const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');

// =============================================================================
// Project Controllers
// =============================================================================

/**
 * Creates a new project and automatically adds the creator as an 'admin' member.
 *
 * Route: POST /api/projects
 * Access: Private (Auth User)
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    // Create the project
    const project = await Project.create({
      name,
      description,
      ownerId: req.user._id,
    });

    // Automatically assign the owner as an 'admin' in ProjectMember
    await ProjectMember.create({
      projectId: project._id,
      userId: req.user._id,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finds all projects where the authenticated user is a member.
 *
 * Route: GET /api/projects
 * Access: Private (Auth User)
 */
const getAllProjects = async (req, res, next) => {
  try {
    // Query the ProjectMember collection for the current user
    const memberships = await ProjectMember.find({ userId: req.user._id })
      .populate('projectId')
      .lean();

    // Map memberships to extract the populated project details and include the user's role
    const projects = await Promise.all(
      memberships.map(async (membership) => {
        if (!membership.projectId) return null;
        const memberCount = await ProjectMember.countDocuments({
          projectId: membership.projectId._id,
        });
        return {
          ...membership.projectId,
          role: membership.role,
          memberCount,
        };
      })
    );

    const filteredProjects = projects.filter(Boolean);

    res.status(200).json({
      success: true,
      projects: filteredProjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finds a single project by ID.
 * Note: Membership validation is handled in the route via `authorizeProjectRole`.
 *
 * Route: GET /api/projects/:id
 * Access: Private (Members only)
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a project's name or description.
 * Note: Role authorization is handled in the route via `authorizeProjectRole`.
 *
 * Route: PATCH /api/projects/:id
 * Access: Private (Admin and Editor only)
 */
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a project and automatically removes all associated membership records.
 * Note: Role authorization is handled in the route via `authorizeProjectRole`.
 *
 * Route: DELETE /api/projects/:id
 * Access: Private (Admin only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Automatically clean up all memberships associated with the deleted project
    await ProjectMember.deleteMany({ projectId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Project and all associated memberships deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
