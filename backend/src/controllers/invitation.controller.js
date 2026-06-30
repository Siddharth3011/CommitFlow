const Project = require('../models/Project');
const User = require('../models/User');
const ProjectMember = require('../models/ProjectMember');
const Invitation = require('../models/Invitation');

// =============================================================================
// Invitation Controllers
// =============================================================================

/**
 * Sends a pending invitation to an email address for a specific project.
 * The inviting user must be an admin on the project.
 *
 * Route:  POST /api/projects/:id/invitations
 * Access: Private (Admin only)
 * Body:   { email, role? }
 */
const sendInvitation = async (req, res, next) => {
  try {
    const { email, role = 'viewer' } = req.body;
    const projectId = req.params.id;
    const invitedBy = req.user._id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Invitee email is required.' });
    }

    // Resolve the project name for the response
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Prevent inviting yourself
    if (req.user.email.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(400).json({ success: false, message: 'You cannot invite yourself.' });
    }

    // If the invitee already has a registered account, block if already a member
    const invitee = await User.findOne({ email: email.toLowerCase().trim() });
    if (invitee) {
      const alreadyMember = await ProjectMember.findOne({ projectId, userId: invitee._id });
      if (alreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'This user is already a member of this project.',
        });
      }
    }

    // Create the pending invitation (the unique index prevents duplicates)
    const invitation = await Invitation.create({
      projectId,
      invitedBy,
      inviteeEmail: email.toLowerCase().trim(),
      role,
    });

    // If the invitee already has an account, emit real-time socket notification
    if (invitee) {
      try {
        const { getIO, EVENTS } = require('../config/socket');
        const populatedInvitation = await Invitation.findById(invitation._id)
          .populate('projectId', 'name description')
          .populate('invitedBy', 'name email')
          .lean();
          
        getIO().to(invitee._id.toString()).emit(EVENTS.NEW_INVITATION, populatedInvitation);
      } catch (err) {
        console.warn('[invitation.controller] socket emit failed:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}.`,
      invitation,
    });
  } catch (error) {
    // Duplicate key error = invitation already pending
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A pending invitation already exists for this email on this project.',
      });
    }
    next(error);
  }
};

/**
 * Returns all pending invitations for the currently authenticated user
 * (matched by their registered email address).
 *
 * Route:  GET /api/invitations/mine
 * Access: Private
 */
const getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      inviteeEmail: req.user.email.toLowerCase(),
      status: 'pending',
    })
      .populate('projectId', 'name description')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, invitations });
  } catch (error) {
    next(error);
  }
};

/**
 * Accepts a pending invitation.
 * Creates a ProjectMember record and flips the invitation status to 'accepted'.
 *
 * Route:  PATCH /api/invitations/:invitationId/accept
 * Access: Private (Invitee only)
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    // Ensure this invitation belongs to the current user
    if (invitation.inviteeEmail !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}.`,
      });
    }

    // Create the ProjectMember record
    await ProjectMember.create({
      projectId: invitation.projectId,
      userId: req.user._id,
      role: invitation.role,
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted. You have been added to the project.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Declines a pending invitation.
 *
 * Route:  PATCH /api/invitations/:invitationId/decline
 * Access: Private (Invitee only)
 */
const declineInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (invitation.inviteeEmail !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}.`,
      });
    }

    invitation.status = 'declined';
    await invitation.save();

    return res.status(200).json({ success: true, message: 'Invitation declined.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
};
