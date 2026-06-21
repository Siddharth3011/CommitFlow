const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorizeProjectRole } = require('../middleware/role.middleware');
const { getProjectAnalytics } = require('../controllers/analytics.controller');

// =============================================================================
// Analytics Router
// =============================================================================
// mergeParams: true is required so that :projectId injected by the parent
// router (app.use('/api', analyticsRoutes)) is accessible on req.params inside
// the controller and the authorizeProjectRole middleware.
// =============================================================================

const router = express.Router({ mergeParams: true });

// Apply JWT authentication to every analytics endpoint.
router.use(protect);

// ---------------------------------------------------------------------------
// GET /api/projects/:projectId/analytics
// ---------------------------------------------------------------------------
// Returns the $facet aggregation result containing:
//   - projectSummary       (total + per-status task counts, completion rate)
//   - taskPerUser          (workload distribution per assignee, enriched with
//                           user name & email from a server-side $lookup)
//   - priorityDistribution (task count bucketed by Low / Medium / High)
//
// Access: All project roles (admin, editor, viewer) may view analytics.
// ---------------------------------------------------------------------------
router.get(
  '/projects/:projectId/analytics',
  authorizeProjectRole(['admin', 'editor', 'viewer']),
  getProjectAnalytics
);

module.exports = router;
