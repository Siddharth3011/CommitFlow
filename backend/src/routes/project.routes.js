const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorizeProjectRole } = require('../middleware/role.middleware');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const {
  addMember,
  getProjectMembers,
  updateMemberRole,
  removeMember,
} = require('../controllers/member.controller');

const router = express.Router();

// =============================================================================
// Project and Member Routes  —  Base path: /api/projects
// =============================================================================

// Apply authentication middleware globally to all project-related routes
router.use(protect);

// --- Project Lifecycle Routes ---
router.post('/', createProject);
router.get('/', getAllProjects);

router.get('/:id', authorizeProjectRole(['admin', 'editor', 'viewer']), getProjectById);
router.patch('/:id', authorizeProjectRole(['admin', 'editor']), updateProject);
router.delete('/:id', authorizeProjectRole(['admin']), deleteProject);

// --- Project Members Routes ---
router.get('/:id/members', authorizeProjectRole(['admin', 'editor', 'viewer']), getProjectMembers);
router.post('/:id/members', authorizeProjectRole(['admin']), addMember);
router.patch('/:id/members/:userId', authorizeProjectRole(['admin']), updateMemberRole);
router.delete('/:id/members/:userId', authorizeProjectRole(['admin']), removeMember);

module.exports = router;
