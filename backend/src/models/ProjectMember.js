const mongoose = require('mongoose');

// =============================================================================
// ProjectMember Schema
// =============================================================================
// This is the join collection that maps a user to a project and assigns them
// a role. It represents the "membership" concept within the RBAC system.
//
// Roles:
//   admin  — Full control: edit/delete project, manage members
//   editor — Can create and edit tasks, add comments
//   viewer — Read-only access to the project
// =============================================================================

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },

    role: {
      type: String,
      required: [true, 'Member role is required.'],
      enum: {
        values: ['admin', 'editor', 'viewer'],
        message: '"{VALUE}" is not a valid role. Must be one of: admin, editor, viewer.',
      },
      default: 'viewer',
    },
  },
  {
    timestamps: true, // Adds createdAt (joined date) and updatedAt fields automatically
  }
);

// =============================================================================
// Compound Unique Index
// =============================================================================
// Prevents the same user from being added to the same project more than once.
// This index also acts as an efficient lookup for the query:
// "fetch the membership record for this specific user in this specific project."
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

module.exports = ProjectMember;
