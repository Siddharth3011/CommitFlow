const Task          = require('../models/Task');
const Comment       = require('../models/Comment');
const ProjectMember = require('../models/ProjectMember');
const Project       = require('../models/Project');
const ActivityLog   = require('../models/ActivityLog');
const { getIO, EVENTS } = require('../config/socket');

// =============================================================================
// Real-Time Helper
// =============================================================================

/**
 * Emits `global:task_updated` to every member of a project's personal user
 * room so that Dashboard progress bars update regardless of which page the
 * recipient is currently viewing.
 *
 * Design notes:
 *   - Uses `io.to(userId)` (personal room) NOT `io.to(projectId)` (project
 *     room) so it reaches users who are NOT currently inside the workspace.
 *   - The query is intentionally lightweight: only `userId` is selected.
 *   - Non-fatal: failures are caught and logged without breaking the response.
 *
 * @param {string}  projectId  - MongoDB ObjectId string of the parent project.
 * @param {object}  task       - The mutated task document (populated or plain).
 * @param {string}  eventType  - 'created' | 'updated' | 'deleted'
 * @param {object}  user       - The req.user object representing the actor
 */
const emitGlobalTaskUpdate = async (projectId, task, eventType, user = null) => {
  try {
    const io = getIO();

    // Fetch the project to get its owner/admin defensively
    const project = await Project.findById(projectId).lean();

    // Fetch all member user IDs for this project in one lean query.
    const members = await ProjectMember
      .find({ projectId })
      .select('userId')
      .lean();

    // Combine both project owner ID and all member user IDs into a unique set
    const recipientIds = new Set();
    if (project) {
      const adminId = project.owner || project.createdBy || project.adminId || project.user || project.ownerId;
      if (adminId) {
        recipientIds.add(adminId.toString());
      }
    }
    members.forEach((member) => {
      if (member.userId) {
        recipientIds.add(member.userId.toString());
      }
    });

    const payload = {
      projectId: projectId.toString(),
      task,
      event: eventType,
      user: user ? { _id: user._id, name: user.name } : null,
      timestamp: new Date().toISOString(),
    };

    // Emit to each recipient's personal room in parallel.
    recipientIds.forEach((userId) => {
      io.to(userId).emit(EVENTS.GLOBAL_TASK_UPDATED, payload);
    });

    console.log(
      `[task.controller] global:task_updated → ${recipientIds.size} recipient(s) | project: ${projectId} | event: ${eventType}`
    );
  } catch (err) {
    // Non-fatal — dashboard sync failure must never break the REST response.
    console.warn('[task.controller] emitGlobalTaskUpdate failed:', err.message);
  }
};

// =============================================================================
// Task Controllers
// =============================================================================

/**
 * Creates a new task in the specified project.
 * Route: POST /api/projects/:projectId/tasks
 */
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignee, dueDate } = req.body;

    const task = await Task.create({
      projectId,
      title,
      description,
      status,
      priority,
      assignee: assignee || null,
      dueDate: dueDate || null,
      creatorId: req.user._id,
    });

    // Re-fetch with populated assignee so the broadcast payload is identical
    // to what every client would receive from GET /tasks.
    const populatedTask = await Task.findById(task._id).populate('assignee', 'name email');

    // ── Project-Room Broadcast ─────────────────────────────────────────────
    // Emit to the project room, EXCLUDING the creator's own socket so they
    // don't receive a self-echo that would double-render the card in their UI.
    // The creator already appends the task locally via createTask.fulfilled.
    //
    // `socketId` is optionally sent by the frontend in the request body so
    // the backend knows which socket to exclude. Falls back to broadcasting
    // to everyone (safe — the Redux de-dupe guard in taskSlice handles it).
    try {
      const senderSocketId = req.body.socketId || null;
      const io = getIO();
      const emitter = senderSocketId
        ? io.to(projectId).except(senderSocketId)
        : io.to(projectId);

      emitter.emit(EVENTS.TASK_CREATED, {
        task: populatedTask,
        createdBy: req.user._id,
        projectId,
        timestamp: new Date().toISOString(),
      });
    } catch (socketErr) {
      // Non-fatal — REST response succeeds even if the socket broadcast fails.
      console.warn('[task.controller] createTask socket emit failed:', socketErr.message);
    }

    // ── Global User-Room Broadcast (Dashboard Sync) ────────────────────────
    // Fire-and-forget — we await but a failure inside emitGlobalTaskUpdate
    // is caught internally so it never rejects this async controller.
    await emitGlobalTaskUpdate(projectId, populatedTask, 'created', req.user);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches all tasks belonging to a specific project.
 * Route: GET /api/projects/:projectId/tasks
 */
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches a single task by its ID within a specific project.
 * Route: GET /api/projects/:projectId/tasks/:id
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const task = await Task.findOne({ _id: id, projectId }).populate(
      'assignee',
      'name email'
    );

    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a specific task's fields within a project.
 * Route: PATCH /api/projects/:projectId/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { title, description, status, priority, assignee, dueDate } = req.body;

    // Retrieve the task first to assert existence and project match
    const task = await Task.findOne({ _id: id, projectId });

    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    const wasDone = task.status === 'Done';

    // Assign only explicitly provided fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    
    // Support clearing the assignee by passing empty string or null
    if (assignee !== undefined) task.assignee = assignee || null;
    
    // Support clearing the due date
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();

    // Re-fetch with populated assignee details for UI display
    const updatedTask = await Task.findById(task._id).populate(
      'assignee',
      'name email'
    );

    // If task transitioned to Done, save milestone ActivityLog
    if (updatedTask.status === 'Done' && !wasDone) {
      await ActivityLog.create({
        projectId,
        user: req.user._id,
        action: 'task_completed',
        details: updatedTask.title,
      });
    }

    // ── Project-Room Broadcast ─────────────────────────────────────────────
    // Emit task:moved to ALL sockets in the room (including the updater).
    // Using io.to() rather than socket.to() ensures the REST path is the
    // single source of truth — the sender's optimistic local state is
    // overwritten by the authoritative populated document from the DB.
    try {
      const io = getIO();

      io.to(projectId.toString()).emit(EVENTS.TASK_MOVED, {
        taskId:    updatedTask._id.toString(),
        newStatus: updatedTask.status,
        task:      updatedTask,       // full document for field-level updates
        projectId: projectId.toString(),
        timestamp: new Date().toISOString(),
      });

      // Broadcast 'taskUpdated' for dynamic field morphing (title, description, etc)
      io.to(projectId.toString()).emit(EVENTS.TASK_UPDATED, updatedTask);
    } catch (socketErr) {
      console.warn('[task.controller] updateTask socket emit failed:', socketErr.message);
    }

    // ── Global User-Room Broadcast (Dashboard Sync) ────────────────────────
    await emitGlobalTaskUpdate(projectId, updatedTask, 'updated', req.user);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a task by ID within a project, and purges all of its comments.
 * Route: DELETE /api/projects/:projectId/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    // Check task existence under the project
    const task = await Task.findOne({ _id: id, projectId });

    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    // Check permissions: project admin OR task creator
    const isProjectAdmin = req.projectMember && req.projectMember.role === 'admin';
    const isTaskCreator = task.creatorId && task.creatorId.toString() === req.user._id.toString();

    if (!isProjectAdmin && !isTaskCreator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete tasks you created or if you are a project Admin.',
      });
    }

    // Delete the task document
    await Task.findByIdAndDelete(task._id);

    // Cascade delete all comments associated with the task
    await Comment.deleteMany({ taskId: task._id });

    // ── Project-Room Broadcast ─────────────────────────────────────────────
    try {
      getIO().to(projectId.toString()).emit(EVENTS.TASK_DELETED, {
        taskId:    task._id.toString(),
        deletedBy: req.user._id.toString(),
        projectId: projectId.toString(),
        timestamp: new Date().toISOString(),
      });
    } catch (socketErr) {
      console.warn('[task.controller] deleteTask socket emit failed:', socketErr.message);
    }

    // ── Global User-Room Broadcast (Dashboard Sync) ────────────────────────
    // Pass a minimal stub for the deleted task so the frontend can identify
    // which project and task were affected when rebuilding counters.
    await emitGlobalTaskUpdate(
      projectId,
      { _id: task._id.toString(), projectId: projectId.toString(), status: task.status },
      'deleted',
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Task and all associated comments deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
