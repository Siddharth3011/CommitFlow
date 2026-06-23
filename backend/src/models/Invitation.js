const mongoose = require('mongoose');

// =============================================================================
// Invitation Schema
// =============================================================================
// Tracks a pending project invitation sent to a user by email.
// An invitation stays 'pending' until the invitee logs in and accepts it.
// Upon acceptance, a ProjectMember record is created and the invitation
// status is flipped to 'accepted'.
// =============================================================================

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviting user ID is required.'],
    },

    inviteeEmail: {
      type: String,
      required: [true, 'Invitee email is required.'],
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer',
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // createdAt = sent date
  }
);

// Prevent duplicate pending invitations to the same project/email pair.
invitationSchema.index(
  { projectId: 1, inviteeEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
