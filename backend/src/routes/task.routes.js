const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorizeProjectRole } = require('../middleware/role.middleware');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');

const router = express.Router({ mergeParams: true });

// Apply auth protection middleware globally to all task endpoints
router.use(protect);

// --- Nested Project Task Routes ---
router.post(
  '/projects/:projectId/tasks',
  authorizeProjectRole(['admin', 'editor']),
  createTask
);

router.get(
  '/projects/:projectId/tasks',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  getProjectTasks
);

router.get(
  '/projects/:projectId/tasks/:id',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  getTaskById
);

router.patch(
  '/projects/:projectId/tasks/:id',
  authorizeProjectRole(['admin', 'editor']),
  updateTask
);

router.delete(
  '/projects/:projectId/tasks/:id',
  authorizeProjectRole(['admin', 'editor']),
  deleteTask
);

module.exports = router;
