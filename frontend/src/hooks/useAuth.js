import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  checkAuth,
  clearError,
} from '../features/auth/authSlice';

/**
 * Custom React hook to interact with the Redux authentication state.
 * Exposes user status, session data, and handle methods for lifecycle auth events.
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Extract auth state elements
  const { user, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  /**
   * Logs in a user with the provided credentials.
   * @param {object} credentials - { email, password }
   */
  const handleLogin = useCallback(
    (credentials) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  /**
   * Registers a new user.
   * @param {object} userData - { name, email, password }
   */
  const handleRegister = useCallback(
    (userData) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  /**
   * Logs out the user and clears session tokens.
   */
  const handleLogout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  /**
   * Dispatches checkAuth to verify cookie sessions on boot.
   */
  const handleCheckAuth = useCallback(() => {
    return dispatch(checkAuth());
  }, [dispatch]);

  /**
   * Clears any error messages in the authentication slice.
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    handleLogin,
    handleRegister,
    handleLogout,
    handleCheckAuth,
    handleClearError,
  };
};

export default useAuth;
