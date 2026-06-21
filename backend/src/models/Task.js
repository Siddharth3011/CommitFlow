const mongoose = require('mongoose');

// =============================================================================
// Task Schema
// =============================================================================

const taskSchema = new mongoose.Schema(
  {
    // The project to which this task belongs
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },

    // The display title of the task
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters long.'],
      maxlength: [150, 'Task title cannot exceed 150 characters.'],
    },

    // Detailed description of the task requirements
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Task description cannot exceed 1000 characters.'],
      default: '',
    },

    // Current workflow status of the task
    status: {
      type: String,
      required: [true, 'Task status is required.'],
      enum: {
        values: ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'],
        message: '"{VALUE}" is not a valid status. Must be one of: Backlog, Todo, In Progress, Review, Done.',
      },
      default: 'Todo',
      index: true,
    },

    // Relative priority level of the task
    priority: {
      type: String,
      required: [true, 'Task priority is required.'],
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '"{VALUE}" is not a valid priority. Must be one of: Low, Medium, High.',
      },
      default: 'Medium',
    },

    // The team member assigned to the task
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },

    // Optional deadline for completing the task
    dueDate: {
      type: Date,
      default: null,
    },

    // The user who created the task
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// =============================================================================
// Compound Indexes
// =============================================================================
// 1. Optimizes lookup queries filtering tasks within a specific project by status
taskSchema.index({ projectId: 1, status: 1 });

// 2. Optimizes lookup queries filtering tasks within a specific project by assignee
taskSchema.index({ projectId: 1, assignee: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
