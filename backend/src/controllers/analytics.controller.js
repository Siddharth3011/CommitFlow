const mongoose = require('mongoose');
const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');

// =============================================================================
// Analytics Controller
// =============================================================================
// All metric calculations are delegated entirely to the MongoDB aggregation
// engine via a single round-trip $facet pipeline, keeping the application
// server stateless and memory-efficient.
// =============================================================================

/**
 * @desc    Retrieve comprehensive analytics metrics for a single project.
 * @route   GET /api/projects/:projectId/analytics
 * @access  Private — requires auth + project membership (any role)
 */
const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    // -------------------------------------------------------------------------
    // Casting Guard
    // -------------------------------------------------------------------------
    // Explicitly cast the raw string param to ObjectId so that the $match
    // stage performs an efficient indexed equality scan instead of a
    // collection-level string comparison.
    // -------------------------------------------------------------------------
    let projectObjectId;
    try {
      projectObjectId = new mongoose.Types.ObjectId(projectId);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.',
      });
    }

    // -------------------------------------------------------------------------
    // Single-Pass $facet Aggregation Pipeline
    // -------------------------------------------------------------------------
    // The pipeline is structured in three logical phases:
    //   1. $match  — Filter to only this project's tasks (uses compound index).
    //   2. $facet  — Branch into three independent sub-pipelines in parallel:
    //       a. projectSummary      — Aggregate-level counters per status.
    //       b. taskPerUser         — Task load distribution per assignee.
    //       c. priorityDistribution — Count of tasks per priority level.
    // -------------------------------------------------------------------------
    const [result] = await Task.aggregate([
      // Phase 1 — Scope the working set to the target project only.
      // This leverages the { projectId: 1, status: 1 } compound index.
      {
        $match: { projectId: projectObjectId },
      },

      // Phase 2 — Fan out into three isolated analytical sub-pipelines.
      {
        $facet: {
          // -------------------------------------------------------------------
          // Facet A: projectSummary
          // -------------------------------------------------------------------
          // Counts total tasks and per-status breakdowns in a single grouping
          // pass. Using $sum with a conditional expression ($cond + $eq) avoids
          // multiple separate $match + $count stages and processes everything
          // in a single document scan.
          // -------------------------------------------------------------------
          projectSummary: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                backlog: {
                  $sum: { $cond: [{ $eq: ['$status', 'Backlog'] }, 1, 0] },
                },
                todo: {
                  $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] },
                },
                inProgress: {
                  $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
                },
                review: {
                  $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] },
                },
                done: {
                  $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
                completionRate: {
                  // Expressed as a decimal (0.0 – 1.0). The caller can
                  // multiply by 100 for a percentage display.
                  $avg: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                },
              },
            },
            // Remove the internal grouping key from the output document.
            {
              $project: { _id: 0 },
            },
          ],

          // -------------------------------------------------------------------
          // Facet B: taskPerUser
          // -------------------------------------------------------------------
          // Groups assigned tasks by their assignee ObjectId, then performs a
          // $lookup join against the 'users' collection to enrich each bucket
          // with the assignee's display name and email — keeping the join
          // entirely server-side within MongoDB.
          //
          // Unassigned tasks (assignee: null) are deliberately excluded via the
          // $match guard so the chart only surfaces actual team workload.
          // -------------------------------------------------------------------
          taskPerUser: [
            // Exclude tasks that have no assignee.
            {
              $match: { assignee: { $ne: null } },
            },
            // Bucket tasks by assignee.
            {
              $group: {
                _id: '$assignee',
                taskCount: { $sum: 1 },
                // Collect statuses for an optional breakdown tooltip.
                statuses: { $push: '$status' },
              },
            },
            // Sort descending so the heaviest-loaded assignee appears first.
            {
              $sort: { taskCount: -1 },
            },
            // Enrich each bucket with the full user document.
            {
              $lookup: {
                from: 'users',          // The MongoDB collection name
                localField: '_id',      // assignee ObjectId from the task group
                foreignField: '_id',    // _id field in the users collection
                as: 'userDetails',
              },
            },
            // Flatten the single-element userDetails array into a scalar.
            {
              $unwind: {
                path: '$userDetails',
                // If a user document was deleted, preserve the task count
                // record but with null userDetails rather than silently
                // dropping the row.
                preserveNullAndEmptyArrays: true,
              },
            },
            // Shape the final output document for the frontend.
            {
              $project: {
                _id: 0,
                userId: '$_id',
                name: { $ifNull: ['$userDetails.name', 'Deleted User'] },
                email: { $ifNull: ['$userDetails.email', null] },
                taskCount: 1,
                statuses: 1,
              },
            },
          ],

          // -------------------------------------------------------------------
          // Facet C: priorityDistribution
          // -------------------------------------------------------------------
          // Simple bucketing of all tasks in the project by their priority
          // label. Useful for a bar or donut chart on the analytics dashboard.
          // -------------------------------------------------------------------
          priorityDistribution: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { count: -1 },
            },
            {
              $project: {
                _id: 0,
                priority: '$_id',
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    // -------------------------------------------------------------------------
    // Normalize empty project result
    // -------------------------------------------------------------------------
    // If the project has zero tasks, Task.aggregate returns an array containing
    // a single object with empty arrays for every facet. We normalise the
    // projectSummary facet so the caller always receives a consistent shape.
    // -------------------------------------------------------------------------
    const summary =
      result.projectSummary.length > 0
        ? result.projectSummary[0]
        : {
            totalTasks: 0,
            backlog: 0,
            todo: 0,
            inProgress: 0,
            review: 0,
            done: 0,
            completionRate: 0,
          };

    return res.status(200).json({
      success: true,
      data: {
        projectSummary: summary,
        taskPerUser: result.taskPerUser,
        priorityDistribution: result.priorityDistribution,
      },
    });
  } catch (error) {
    console.error('[getProjectAnalytics] Aggregation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while computing analytics.',
    });
  }
};

module.exports = { getProjectAnalytics };
