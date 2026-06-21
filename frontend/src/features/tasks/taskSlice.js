import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// =============================================================================
// Async Thunks — Task Management
// =============================================================================

/**
 * Fetches all tasks for a given project.
 */
export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/projects/${projectId}/tasks`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch project tasks.'
      );
    }
  }
);

/**
 * Creates a new task under a project.
 */
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ projectId, taskData }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/projects/${projectId}/tasks`, taskData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create task.'
      );
    }
  }
);

/**
 * Updates a task (title, description, status, priority, assignee, dueDate).
 */
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ projectId, taskId, updates }, { rejectWithValue }) => {
    try {
      const response = await API.patch(
        `/projects/${projectId}/tasks/${taskId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update task.'
      );
    }
  }
);

/**
 * Deletes a task from a project.
 */
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      await API.delete(`/projects/${projectId}/tasks/${taskId}`);
      return taskId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete task.'
      );
    }
  }
);

// =============================================================================
// Task Slice Definition
// =============================================================================

const initialState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.selectedTask = null;
      state.error = null;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    // Optimistic update — move task to a new status column immediately
    optimisticallyMoveTask: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },
    // Revert an optimistic update if the API call fails
    revertTaskMove: (state, action) => {
      const { taskId, previousStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = previousStatus;
      }
    },

    // =========================================================================
    // Real-Time Socket Reducers
    // =========================================================================
    // These are dispatched by useProjectSocket when a Socket.io broadcast
    // arrives from a peer in the same project room. They MUST NOT be called
    // for the local user's own actions (the hook guards against this with the
    // `socket.to()` exclusion on the backend, so self-echoes never arrive).
    // =========================================================================

    /**
     * Appends a task document pushed by a remote peer via `task:created`.
     * Guards against accidental duplicates in case of reconnection replays.
     *
     * Payload: { task: TaskDocument, createdBy: string, projectId: string }
     */
    taskAddedFromSocket: (state, action) => {
      const incomingTask = action.payload.task;
      const alreadyExists = state.tasks.some((t) => t._id === incomingTask._id);
      if (!alreadyExists) {
        state.tasks.push(incomingTask);
      }
    },

    /**
     * Updates the status (column) of a task repositioned by a remote peer
     * via `task:moved`. Mirrors the shape of optimisticallyMoveTask so the
     * Kanban board re-groups it correctly via its status-filter logic.
     *
     * Payload: { taskId: string, newStatus: string, movedBy: string, projectId: string }
     */
    taskMovedFromSocket: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },

    /**
     * Removes a task card deleted by a remote peer via `task:deleted`.
     * Also clears selectedTask if the open detail drawer referenced that card.
     *
     * Payload: { taskId: string, deletedBy: string, projectId: string }
     */
    taskRemovedFromSocket: (state, action) => {
      const { taskId } = action.payload;
      state.tasks = state.tasks.filter((t) => t._id !== taskId);
      if (state.selectedTask?._id === taskId) {
        state.selectedTask = null;
      }
    },

    moveLiveTask: (state, action) => {
      const { taskId, newStatus, task } = action.payload;
      const existingTaskIndex = state.tasks.findIndex((t) => t._id === taskId);
      if (existingTaskIndex !== -1) {
        state.tasks[existingTaskIndex].status = newStatus;
        if (task) {
          state.tasks[existingTaskIndex] = { ...state.tasks[existingTaskIndex], ...task };
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Project Tasks ---
      .addCase(fetchProjectTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Task ---
      .addCase(createTask.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Update Task ---
      .addCase(updateTask.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) {
          state.tasks[idx] = action.payload;
        }
        // Sync selectedTask if it was the one being updated
        if (state.selectedTask?._id === action.payload._id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Delete Task ---
      .addCase(deleteTask.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        if (state.selectedTask?._id === action.payload) {
          state.selectedTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearTaskError,
  clearTasks,
  setSelectedTask,
  clearSelectedTask,
  optimisticallyMoveTask,
  revertTaskMove,
  taskAddedFromSocket,
  taskMovedFromSocket,
  taskRemovedFromSocket,
  moveLiveTask,
} = taskSlice.actions;

export default taskSlice.reducer;
