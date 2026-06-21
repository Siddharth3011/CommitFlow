const mongoose = require('mongoose');

// =============================================================================
// Project Schema
// =============================================================================

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long.'],
      maxlength: [100, 'Project name cannot exceed 100 characters.'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Project description cannot exceed 500 characters.'],
      default: '',
    },

    // The user who created the project and holds full ownership.
    // Indexed to allow efficient lookups like "fetch all projects owned by user X".
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required.'],
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
