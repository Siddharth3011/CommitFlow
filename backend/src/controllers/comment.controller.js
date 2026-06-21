const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { getIO } = require('../config/socket');

// =============================================================================
// Comment Controllers
// =============================================================================

/**
 * Adds a comment to a specific task.
 * Route: POST /api/projects/:projectId/tasks/:taskId/comments
 */
exports.addComment = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      const error = new Error('Comment text is required and cannot be empty.');
      error.statusCode = 400;
      return next(error);
    }

    // Verify task exists in the scope of this project
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    let comment = await Comment.create({
      taskId,
      userId: req.user._id,
      text,
    });

    // Populate user profile info for standard response representation
    comment = await comment.populate('userId', 'name email');

    // ── Global User-Room Broadcast (Dashboard Sync) ────────────────────────
    try {
      const io = getIO();
      const project = await Project.findById(projectId).select('ownerId').lean();
      const members = await ProjectMember.find({ projectId }).select('userId').lean();

      const recipientIds = new Set();
      if (project && project.ownerId) {
        recipientIds.add(project.ownerId.toString());
      }
      members.forEach((m) => {
        if (m.userId) {
          recipientIds.add(m.userId.toString());
        }
      });

      const newComment = comment;
      recipientIds.forEach((memberId) => {
        io.to(memberId.toString()).emit('global:comment_added', { projectId, comment: newComment });
      });
    } catch (socketErr) {
      console.warn('[comment.controller] socket broadcast failed:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches all comments belonging to a specific task in chronological order.
 * Route: GET /api/projects/:projectId/tasks/:taskId/comments
 */
exports.getTaskComments = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;

    // Verify task exists under the project scope
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const error = new Error('Task not found in this project.');
      error.statusCode = 404;
      return next(error);
    }

    const comments = await Comment.find({ taskId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 }); // Chronological order

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a comment by ID if the requester is the author or a project admin/editor.
 * Route: DELETE /api/projects/:projectId/tasks/:taskId/comments/:id
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;

    const comment = await Comment.findOne({ _id: id, taskId });
    if (!comment) {
      const error = new Error('Comment not found on this task.');
      error.statusCode = 404;
      return next(error);
    }

    // Check permissions: Requester must be author OR a project Admin/Editor.
    // req.projectMember is populated by the authorizeProjectRole middleware.
    const isCommentAuthor = comment.userId.toString() === req.user._id.toString();
    const isProjectManager = ['admin', 'editor'].includes(req.projectMember.role);

    if (!isCommentAuthor && !isProjectManager) {
      const error = new Error('Access denied. You do not have permission to delete this comment.');
      error.statusCode = 403;
      return next(error);
    }

    await Comment.findByIdAndDelete(comment._id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
