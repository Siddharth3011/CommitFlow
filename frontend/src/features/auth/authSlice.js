import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Registers a new user.
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

/**
 * Logins a user and initializes a session.
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid email or password.'
      );
    }
  }
);

/**
 * Terminates the user's session.
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await API.post('/auth/logout');
      return null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Logout failed. Please try again.'
      );
    }
  }
);

/**
 * Checks for an active session to persist logins across page refreshes.
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Session expired or user is not logged in.'
      );
    }
  }
);

// =============================================================================
// Auth Slice Definition
// =============================================================================

const initialState = {
  user: null,
  isAuthenticated: false,
  // Starts false; flips to true once checkAuth resolves (fulfilled OR rejected).
  // ProtectedRoute blocks rendering until this is true so the app never
  // redirects to /login on a hard refresh before the session cookie is checked.
  isInitialized: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Register User ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Do not set isAuthenticated to true yet, they must verify OTP
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Login User ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // Do not set isAuthenticated to true yet, they must verify OTP
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Logout User ---
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Check Session Auth ---
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
        // isInitialized stays false while the /auth/me request is in-flight.
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isInitialized = true;  // boot sequence complete — user is logged in
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.isInitialized = true;  // boot sequence complete — no valid session
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
