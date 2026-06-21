import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// =============================================================================
// Async Thunks — Attachment Management
// =============================================================================

/**
 * Fetches all attachments for a given task.
 */
export const fetchTaskAttachments = createAsyncThunk(
  'attachments/fetchTaskAttachments',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/projects/${projectId}/tasks/${taskId}/attachments`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch attachments.'
      );
    }
  }
);

/**
 * Uploads a file attachment to a task via multipart/form-data.
 */
export const uploadAttachment = createAsyncThunk(
  'attachments/uploadAttachment',
  async ({ projectId, taskId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await API.post(
        `/projects/${projectId}/tasks/${taskId}/attachments`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to upload attachment.'
      );
    }
  }
);

/**
 * Deletes an attachment from a task.
 */
export const deleteAttachment = createAsyncThunk(
  'attachments/deleteAttachment',
  async ({ projectId, taskId, attachmentId }, { rejectWithValue }) => {
    try {
      await API.delete(
        `/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`
      );
      return attachmentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete attachment.'
      );
    }
  }
);

// =============================================================================
// Attachment Slice Definition
// =============================================================================

const initialState = {
  attachments: [],
  loading: false,
  uploading: false,
  actionLoading: false,
  error: null,
  uploadError: null,
};

const attachmentSlice = createSlice({
  name: 'attachments',
  initialState,
  reducers: {
    clearAttachmentError: (state) => {
      state.error = null;
      state.uploadError = null;
    },
    clearAttachments: (state) => {
      state.attachments = [];
      state.error = null;
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Attachments ---
      .addCase(fetchTaskAttachments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskAttachments.fulfilled, (state, action) => {
        state.loading = false;
        state.attachments = action.payload;
      })
      .addCase(fetchTaskAttachments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Upload Attachment ---
      .addCase(uploadAttachment.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.uploading = false;
        state.attachments.unshift(action.payload);
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
      })

      // --- Delete Attachment ---
      .addCase(deleteAttachment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.attachments = state.attachments.filter(
          (a) => a._id !== action.payload
        );
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttachmentError, clearAttachments } =
  attachmentSlice.actions;

export default attachmentSlice.reducer;
