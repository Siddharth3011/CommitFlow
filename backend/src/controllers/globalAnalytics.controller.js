const mongoose = require('mongoose');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const ActivityLog = require('../models/ActivityLog');

// =============================================================================
// Global Analytics Controller
// =============================================================================

/**
 * @desc    Fetch a unified global dashboard payload for the authenticated user.
 *          Returns:
 *            - projects[]    — each project enriched with a real completion %.
 *            - activityFeed  — latest 10 cross-project activity items (comments
 *                              + attachments), sorted newest-first.
 *
 * @route   GET /api/analytics/global
 * @access  Private — requires auth (protect middleware)
 */
const getGlobalDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const memberships = await ProjectMember.find({ userId })
      .populate('projectId', 'name description createdAt updatedAt ownerId')
      .lean();

    const validMemberships = memberships.filter((m) => m.projectId != null);
    const projectIds = validMemberships.map((m) => m.projectId._id);

    const projectsWithProgress = await Promise.all(
      validMemberships.map(async (membership) => {
        const project = membership.projectId;

        const tasks = await Task.find({ projectId: project._id }).select('_id status').lean();
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => t.status === 'Done').length;

        const completionPercentage =
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return {
          _id: project._id,
          name: project.name,
          description: project.description || '',
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          role: membership.role,
          totalTasks,
          doneTasks,
          completionPercentage,
          tasks,
        };
      })
    );

    const recentComments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name')
      .populate({
        path: 'taskId',
        select: 'title projectId',
        populate: { path: 'projectId', select: 'name _id' },
      })
      .lean();

    const recentAttachments = await Attachment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('uploadedBy', 'name')
      .populate({
        path: 'taskId',
        select: 'title projectId',
        populate: { path: 'projectId', select: 'name _id' },
      })
      .lean();

    const recentLogs = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name')
      .populate('projectId', 'name')
      .lean();

    const accessibleProjectIdSet = new Set(projectIds.map((id) => id.toString()));

    const commentActivities = recentComments
      .filter((c) => {
        const projId = c.taskId?.projectId?._id?.toString();
        return projId && accessibleProjectIdSet.has(projId);
      })
      .map((c) => ({
        _id: c._id.toString(),
        type: 'comment',
        actorName: c.userId?.name || 'Unknown User',
        action: 'commented on task',
        taskTitle: c.taskId?.title || 'a task',
        projectId: c.taskId?.projectId?._id,
        projectName: c.taskId?.projectId?.name || 'Unknown Project',
        createdAt: c.createdAt,
      }));

    const attachmentActivities = recentAttachments
      .filter((a) => {
        const projId = a.taskId?.projectId?._id?.toString();
        return projId && accessibleProjectIdSet.has(projId);
      })
      .map((a) => ({
        _id: a._id.toString(),
        type: 'attachment',
        actorName: a.uploadedBy?.name || 'Unknown User',
        action: 'uploaded a file to task',
        taskTitle: a.taskId?.title || 'a task',
        projectId: a.taskId?.projectId?._id,
        projectName: a.taskId?.projectId?.name || 'Unknown Project',
        fileName: a.fileName,
        createdAt: a.createdAt,
      }));

    const logActivities = recentLogs
      .filter((log) => {
        const projId = log.projectId?._id?.toString() || log.projectId?.toString();
        return projId && accessibleProjectIdSet.has(projId);
      })
      .map((log) => ({
        _id: log._id.toString(),
        type: 'milestone',
        actorName: log.user?.name || 'Unknown User',
        action: log.action === 'task_completed' ? 'marked task as Done' : log.action,
        taskTitle: log.details || 'a task',
        projectId: log.projectId?._id || log.projectId,
        projectName: log.projectId?.name || 'Unknown Project',
        createdAt: log.createdAt,
      }));

    const activityFeed = [...commentActivities, ...attachmentActivities, ...logActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: { projects: projectsWithProgress, activityFeed },
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// Organization-Wide Analytics
// =============================================================================

/**
 * @desc    Fetch a deep, organization-level analytics report scoped to all
 *          projects where the authenticated user holds an 'admin' role.
 *
 *          Returns:
 *            - orgKpis            — Global counters: total, completed, overdue.
 *            - projectDistribution — Per-project active task volume (bar chart).
 *            - topContributors    — Ranked leaderboard of completed tasks per user.
 *
 * @route   GET /api/analytics/organization
 * @access  Private — requires auth (protect middleware)
 */
const getGlobalOrganizationAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // -------------------------------------------------------------------------
    // Step 1 — Resolve every project where the user is an admin.
    // Only admins "own" org-level visibility; editors/viewers are excluded.
    // -------------------------------------------------------------------------
    const adminMemberships = await ProjectMember.find({
      userId,
      role: 'admin',
    })
      .select('projectId')
      .lean();

    if (adminMemberships.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          orgKpis: { totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
          projectDistribution: [],
          topContributors: [],
        },
      });
    }

    const adminProjectIds = adminMemberships.map((m) =>
      new mongoose.Types.ObjectId(m.projectId)
    );

    const now = new Date();

    // -------------------------------------------------------------------------
    // Step 2 — Single $facet aggregation pipeline.
    // Three isolated sub-pipelines execute in one database round-trip:
    //   A. orgKpis            — $group across all tasks → total / done / overdue
    //   B. projectDistribution — $group by projectId, $lookup project name
    //   C. topContributors    — $match done tasks, $group by assignee, $lookup user
    // -------------------------------------------------------------------------
    const [result] = await Task.aggregate([
      // Scope to admin-owned projects only.
      {
        $match: { projectId: { $in: adminProjectIds } },
      },

      {
        $facet: {
          // -------------------------------------------------------------------
          // Facet A: orgKpis
          // -------------------------------------------------------------------
          // Counts every task in the scope, done tasks, and overdue tasks.
          // A task is overdue when it has a dueDate in the past and has not
          // been moved to 'Done'.
          // -------------------------------------------------------------------
          orgKpis: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$status', 'Done'] },
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $project: { _id: 0 } },
          ],

          // -------------------------------------------------------------------
          // Facet B: projectDistribution
          // -------------------------------------------------------------------
          // Groups tasks by project and totals active (non-Done) task volume.
          // Joins the projects collection to surface the project name for the
          // horizontal bar chart on the frontend.
          // -------------------------------------------------------------------
          projectDistribution: [
            {
              $group: {
                _id: '$projectId',
                totalTasks: { $sum: 1 },
                activeTasks: {
                  $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] },
                },
                doneTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
              },
            },
            {
              $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: '_id',
                as: 'projectDetails',
              },
            },
            {
              $unwind: {
                path: '$projectDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $sort: { activeTasks: -1 },
            },
            {
              $project: {
                _id: 0,
                projectId: '$_id',
                projectName: { $ifNull: ['$projectDetails.name', 'Deleted Project'] },
                totalTasks: 1,
                activeTasks: 1,
                doneTasks: 1,
              },
            },
          ],

          // -------------------------------------------------------------------
          // Facet C: topContributors
          // -------------------------------------------------------------------
          // Considers only tasks in the 'Done' status to measure real output.
          // Groups by assignee, sorts descending by completed count, and
          // $lookups the users collection to enrich with name and email.
          // -------------------------------------------------------------------
          topContributors: [
            {
              $match: {
                status: 'Done',
                assignee: { $ne: null },
              },
            },
            {
              $group: {
                _id: '$assignee',
                completedTasks: { $sum: 1 },
                // Collect unique project IDs this contributor worked in.
                projects: { $addToSet: '$projectId' },
              },
            },
            {
              $sort: { completedTasks: -1 },
            },
            {
              $limit: 10,
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails',
              },
            },
            {
              $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                name: { $ifNull: ['$userDetails.name', 'Deleted User'] },
                email: { $ifNull: ['$userDetails.email', null] },
                completedTasks: 1,
                projectCount: { $size: '$projects' },
              },
            },
          ],
        },
      },
    ]);

    // -------------------------------------------------------------------------
    // Step 3 — Normalise zero-task edge case.
    // When no tasks exist the facets return arrays with empty [] values.
    // -------------------------------------------------------------------------
    const orgKpis =
      result.orgKpis.length > 0
        ? result.orgKpis[0]
        : { totalTasks: 0, completedTasks: 0, overdueTasks: 0 };

    return res.status(200).json({
      success: true,
      data: {
        orgKpis,
        projectDistribution: result.projectDistribution,
        topContributors: result.topContributors,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGlobalDashboardData, getGlobalOrganizationAnalytics };
