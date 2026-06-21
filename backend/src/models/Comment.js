const mongoose = require('mongoose');

// =============================================================================
// Comment Schema
// =============================================================================

const commentSchema = new mongoose.Schema(
  {
    // The task to which this comment belongs
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required.'],
      index: true,
    },

    // The user who wrote the comment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },

    // The text content of the comment
    text: {
      type: String,
      required: [true, 'Comment text is required.'],
      trim: true,
      minlength: [1, 'Comment text cannot be empty.'],
      maxlength: [2000, 'Comment text cannot exceed 2000 characters.'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
