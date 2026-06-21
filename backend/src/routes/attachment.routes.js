const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorizeProjectRole } = require('../middleware/role.middleware');
const { uploadAttachment } = require('../middleware/multer.middleware');
const {
  uploadFileAttachment,
  getTaskAttachments,
  deleteFileAttachment,
} = require('../controllers/attachment.controller');

// =============================================================================
// Attachment Router
// =============================================================================
// mergeParams: true is essential here. Without it, :projectId and :taskId
// from the parent path segments would not be available inside req.params when
// this router processes the request.

const router = express.Router({ mergeParams: true });

// Apply JWT authentication globally to all attachment endpoints
router.use(protect);

// =============================================================================
// Routes — Nested under /projects/:projectId/tasks/:taskId/attachments
// =============================================================================

// POST — Upload a new file attachment to a task
// Middleware chain: authenticate → verify project role → parse multipart file → upload
router.post(
  '/projects/:projectId/tasks/:taskId/attachments',
  authorizeProjectRole(['admin', 'editor']),
  uploadAttachment,
  uploadFileAttachment
);

// GET — List all attachments for a task
router.get(
  '/projects/:projectId/tasks/:taskId/attachments',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  getTaskAttachments
);

// DELETE — Remove a specific attachment from a task
router.delete(
  '/projects/:projectId/tasks/:taskId/attachments/:id',
  authorizeProjectRole(['admin', 'editor']),
  deleteFileAttachment
);

module.exports = router;
