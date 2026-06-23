const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getMyInvitations, acceptInvitation, declineInvitation } = require('../controllers/invitation.controller');

const router = express.Router();

// =============================================================================
// Invitation Routes  —  Base path: /api/invitations
// =============================================================================

// All routes require the user to be authenticated
router.use(protect);

// GET /api/invitations/mine — Fetch all pending invitations for the current user
router.get('/mine', getMyInvitations);

// PATCH /api/invitations/:invitationId/accept — Accept a specific invitation
router.patch('/:invitationId/accept', acceptInvitation);

// PATCH /api/invitations/:invitationId/decline — Decline a specific invitation
router.patch('/:invitationId/decline', declineInvitation);

module.exports = router;
