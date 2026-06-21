const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getGlobalDashboardData,
  getGlobalOrganizationAnalytics,
} = require('../controllers/globalAnalytics.controller');

// =============================================================================
// Global Analytics Router
// =============================================================================

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/analytics/global
// ---------------------------------------------------------------------------
// Returns the unified dashboard payload:
//   - projects[]    — user's projects enriched with real completion percentages.
//   - activityFeed  — latest 10 cross-project comment/attachment events.
//
// Access: Private — any authenticated user.
// ---------------------------------------------------------------------------
router.get('/global', protect, getGlobalDashboardData);

// ---------------------------------------------------------------------------
// GET /api/analytics/organization
// ---------------------------------------------------------------------------
// Returns deep organization-level analytics scoped to admin-owned projects:
//   - orgKpis            — global total / completed / overdue task counters.
//   - projectDistribution — per-project active task volume for bar chart.
//   - topContributors    — ranked leaderboard of done-task counts per member.
//
// Access: Private — any authenticated user (controller self-scopes to admin
//         memberships; non-admins simply receive empty result sets).
// ---------------------------------------------------------------------------
router.get('/organization', protect, getGlobalOrganizationAnalytics);

module.exports = router;
