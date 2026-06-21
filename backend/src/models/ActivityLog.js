const mongoose = require('mongoose');

// =============================================================================
// ActivityLog Schema
// =============================================================================

const activityLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    action: {
      type: String,
      enum: ['task_completed', 'task_created', 'comment_added'],
      required: [true, 'Action name is required.'],
    },
    details: {
      type: String,
      required: [true, 'Details are required.'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
