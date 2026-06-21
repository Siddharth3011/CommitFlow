const User = require('../models/User');
const ProjectMember = require('../models/ProjectMember');

// =============================================================================
// Member Controllers
// =============================================================================

/**
 * Invites/adds a member to a project using their email.
 *
 * Route: POST /api/projects/:id/members
 * Access: Private (Admin only)
 */
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const projectId = req.params.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Member email is required.',
      });
    }

    // Resolve the user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found.',
      });
    }

    // Check if the user is already a member of this project
    const existingMember = await ProjectMember.findOne({
      projectId,
      userId: user._id,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project.',
      });
    }

    // Add user as a project member
    const newMember = await ProjectMember.create({
      projectId,
      userId: user._id,
      role: role || 'viewer',
    });

    // Populate user profile info to return clean details
    const populatedMember = await newMember.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Member added successfully.',
      member: populatedMember,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all members of a project.
 *
 * Route: GET /api/projects/:id/members
 * Access: Private (Members only)
 */
const getProjectMembers = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const members = await ProjectMember.find({ projectId })
      .populate('userId', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a member's role (admin, editor, viewer).
 *
 * Route: PATCH /api/projects/:id/members/:userId
 * Access: Private (Admin only)
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id: projectId, userId } = req.params;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required.',
      });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be admin, editor, or viewer.',
      });
    }

    const member = await ProjectMember.findOneAndUpdate(
      { projectId, userId },
      { role },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Membership record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully.',
      member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Removes a member from a project.
 *
 * Route: DELETE /api/projects/:id/members/:userId
 * Access: Private (Admin only)
 */
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    const member = await ProjectMember.findOneAndDelete({
      projectId,
      userId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Membership record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed from project successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMember,
  getProjectMembers,
  updateMemberRole,
  removeMember,
};
