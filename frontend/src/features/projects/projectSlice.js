import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import { addMember, removeMember } from './memberSlice';

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetches all projects where the current user is a member.
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/projects');
      return response.data.projects;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch projects list.'
      );
    }
  }
);

/**
 * Fetches detailed info for a single project by ID.
 */
export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/projects/${projectId}`);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load project details.'
      );
    }
  }
);

/**
 * Creates a new project.
 */
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await API.post('/projects', projectData);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create project.'
      );
    }
  }
);

/**
 * Deletes a project.
 */
export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      await API.delete(`/projects/${projectId}`);
      return projectId; // Return the deleted project ID so we can filter it from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete project.'
      );
    }
  }
);

/**
 * Fetches unified global dashboard data (projects + activity feed).
 */
export const fetchGlobalDashboardData = createAsyncThunk(
  'projects/fetchGlobalDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/analytics/global');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard data.'
      );
    }
  }
);

// =============================================================================
// Project Slice Definition
// =============================================================================

const initialState = {
  projects: [],
  activityFeed: [],
  selectedProject: null,
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    appendActivityFeed: (state, action) => {
      state.activityFeed.unshift(action.payload);
      if (state.activityFeed.length > 50) {
        state.activityFeed.pop();
      }
    },

    // =========================================================================
    // updateGlobalProjectProgress
    // =========================================================================
    // Synchronously patches the completion metrics on a single project inside
    // the global `projects` array.
    //
    // Finds the matching project card, updates the target task's status in the
    // internal tasks array, and recalculates totalTasks and completedTasks
    // by explicitly looping over the array and counting 'Done' statuses.
    // =========================================================================
    updateGlobalProjectProgress: (state, action) => {
      const { projectId, task } = action.payload;

      // Extract raw ID string regardless of whether projectId is an object or string
      const rawProjectId = typeof projectId === 'object' && projectId !== null 
        ? (projectId._id?.toString() || projectId.toString()) 
        : projectId?.toString();

      const project = state.projects.find(
        (p) => p._id === rawProjectId || p._id?.toString() === rawProjectId
      );

      if (!project) return;

      // Ensure the tasks array is initialized (for projects fetched without it)
      if (!project.tasks) {
        project.tasks = [];
      }

      // Handle task deletion
      if (action.payload.event === 'deleted') {
        project.tasks = project.tasks.filter((t) => t._id !== task._id);
      } else {
        // Find the target task and update its status, or push if new
        const existingTaskIndex = project.tasks.findIndex((t) => t._id === task._id);
        if (existingTaskIndex !== -1) {
          project.tasks[existingTaskIndex].status = task.status;
        } else {
          project.tasks.push({ _id: task._id, status: task.status });
        }
      }

      // Pure Mathematical Recalculation
      let completedCount = 0;
      const totalCount = project.tasks.length;

      project.tasks.forEach((t) => {
        if (t.status === 'Done') {
          completedCount++;
        }
      });

      project.totalTasks = totalCount;
      project.completedTasks = completedCount;
      project.doneTasks = completedCount;
      project.progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      project.completionPercentage = Math.round(project.progress);

      // Auto-push a milestone activity entry if a task is newly Done and we know it wasn't before
      // (For this, we just append to activityFeed if action.payload explicitly asks or if we detect a change)
      // Since we removed delta tracking, we can just rely on the layout component dispatching `appendActivityFeed` directly.
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Projects ---
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Global Dashboard Data ---
      .addCase(fetchGlobalDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.activityFeed = action.payload.activityFeed;
      })
      .addCase(fetchGlobalDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Project By ID ---
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Project ---
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        // Append the newly created project to the local state list
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Delete Project ---
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        // Filter out the deleted project from the state list
        state.projects = state.projects.filter(
          (project) => project._id !== action.payload
        );
        // Clear selectedProject reference if it matches the deleted project
        if (state.selectedProject?._id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- Synchronize Member Count on Dashboard ---
      .addCase(addMember.fulfilled, (state, action) => {
        const projectId = action.payload?.projectId?._id || action.payload?.projectId;
        if (projectId) {
          const project = state.projects.find((p) => p._id === projectId);
          if (project) {
            project.memberCount = (project.memberCount || 1) + 1;
          }
        }
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const projectId = action.payload?.projectId;
        if (projectId) {
          const project = state.projects.find((p) => p._id === projectId);
          if (project && project.memberCount > 1) {
            project.memberCount -= 1;
          }
        }
      });
  },
});

export const {
  clearProjectError,
  clearSelectedProject,
  updateGlobalProjectProgress,
  appendActivityFeed,
} = projectSlice.actions;
export default projectSlice.reducer;
