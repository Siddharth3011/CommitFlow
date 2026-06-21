const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorizeProjectRole } = require('../middleware/role.middleware');
const {
  addComment,
  getTaskComments,
  deleteComment,
} = require('../controllers/comment.controller');

const router = express.Router({ mergeParams: true });

// Apply auth protection middleware globally to all comment endpoints
router.use(protect);

// --- Nested Task Comment Routes ---
router.post(
  '/projects/:projectId/tasks/:taskId/comments',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  addComment
);

router.get(
  '/projects/:projectId/tasks/:taskId/comments',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  getTaskComments
);

router.delete(
  '/projects/:projectId/tasks/:taskId/comments/:id',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  deleteComment
);

module.exports = router;
