import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// =============================================================================
// Async Thunks — Comment Management
// =============================================================================

/**
 * Fetches all comments for a given task.
 */
export const fetchTaskComments = createAsyncThunk(
  'comments/fetchTaskComments',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/projects/${projectId}/tasks/${taskId}/comments`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch comments.'
      );
    }
  }
);

/**
 * Adds a new comment to a task.
 */
export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ projectId, taskId, text }, { rejectWithValue }) => {
    try {
      const response = await API.post(
        `/projects/${projectId}/tasks/${taskId}/comments`,
        { text }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add comment.'
      );
    }
  }
);

/**
 * Deletes a comment from a task.
 */
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ projectId, taskId, commentId }, { rejectWithValue }) => {
    try {
      await API.delete(
        `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
      );
      return commentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete comment.'
      );
    }
  }
);

// =============================================================================
// Comment Slice Definition
// =============================================================================

const initialState = {
  comments: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.comments = [];
      state.error = null;
    },
    addLiveComment: (state, action) => {
      const incomingComment = action.payload;
      const alreadyExists = state.comments.some((c) => c._id === incomingComment._id);
      if (!alreadyExists) {
        state.comments.push(incomingComment);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Comments ---
      .addCase(fetchTaskComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchTaskComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Add Comment ---
      .addCase(addComment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.comments.push(action.payload);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Delete Comment ---
      .addCase(deleteComment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.comments = state.comments.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCommentError, clearComments, addLiveComment } = commentSlice.actions;
export default commentSlice.reducer;
