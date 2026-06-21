import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// =============================================================================
// Async Thunks — Member Management
// =============================================================================

/**
 * Fetches all members for a given project.
 */
export const fetchProjectMembers = createAsyncThunk(
  'members/fetchProjectMembers',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/projects/${projectId}/members`);
      return response.data.members;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch project members.'
      );
    }
  }
);

/**
 * Invites a new member to a project by email.
 */
export const addMember = createAsyncThunk(
  'members/addMember',
  async ({ projectId, email, role }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/projects/${projectId}/members`, { email, role });
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add member.'
      );
    }
  }
);

/**
 * Updates a member's role within a project.
 */
export const updateMemberRole = createAsyncThunk(
  'members/updateMemberRole',
  async ({ projectId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/projects/${projectId}/members/${userId}`, { role });
      return response.data.member;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update member role.'
      );
    }
  }
);

/**
 * Removes a member from a project.
 */
export const removeMember = createAsyncThunk(
  'members/removeMember',
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      return { projectId, userId }; // Return both projectId and userId to sync project member counts
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove member.'
      );
    }
  }
);

// =============================================================================
// Member Slice Definition
// =============================================================================

const initialState = {
  members: [],
  loading: false,
  actionLoading: false, // Tracks add/update/remove operations separately from fetch
  error: null,
};

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    clearMemberError: (state) => {
      state.error = null;
    },
    clearMembers: (state) => {
      state.members = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Members ---
      .addCase(fetchProjectMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Add Member ---
      .addCase(addMember.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.members.push(action.payload);
      })
      .addCase(addMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Update Member Role ---
      .addCase(updateMemberRole.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Replace the member record with the updated one from the server
        const idx = state.members.findIndex(
          (m) => m.userId?._id === action.payload.userId?._id
        );
        if (idx !== -1) {
          state.members[idx] = action.payload;
        }
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- Remove Member ---
      .addCase(removeMember.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.members = state.members.filter(
          (m) => m.userId?._id !== action.payload.userId
        );
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMemberError, clearMembers } = memberSlice.actions;
export default memberSlice.reducer;
