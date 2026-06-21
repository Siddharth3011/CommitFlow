const ProjectMember = require('../models/ProjectMember');

// =============================================================================
// authorizeProjectRole Middleware Factory
// =============================================================================

/**
 * A factory function that returns an Express middleware capable of enforcing
 * role-based access control (RBAC) on project-scoped routes.
 *
 * Usage example in a router:
 *   router.delete('/:id', protect, authorizeProjectRole(['admin']), deleteProject);
 *
 * How it works:
 *   1. Extracts the project ID from `req.params.id` or `req.params.projectId`.
 *   2. Queries the ProjectMember collection for a record matching both the
 *      project ID and the authenticated user's ID (set by `protect` middleware).
 *   3. If no membership record is found → 403 (user is not a member).
 *   4. If the user's role is not in `allowedRoles` → 403 (insufficient role).
 *   5. If the check passes, attaches the member document to `req.projectMember`
 *      for use in downstream controllers and calls `next()`.
 *
 * @param {string[]} allowedRoles - Array of roles permitted to access the route.
 *                                  Valid values: 'admin', 'editor', 'viewer'
 * @returns {import('express').RequestHandler}
 */
const authorizeProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Support both /:projectId (nested sub-routes) and /:id (project routes)
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is missing from the request parameters.',
        });
      }

      // req.user is guaranteed to exist here because `protect` must run before
      // this middleware on every protected route.
      const member = await ProjectMember.findOne({
        projectId,
        userId: req.user._id,
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this project.',
        });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        });
      }

      // Attach the membership record so controllers can read the role without
      // another database round-trip.
      req.projectMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorizeProjectRole };
