import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// =============================================================================
// Shared Loading Spinner
// =============================================================================

const BootSpinner = ({ label = 'Loading...' }) => (
  <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors duration-300">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-muted-foreground tracking-wide animate-pulse">
        {label}
      </p>
    </div>
  </div>
);

// =============================================================================
// ProtectedRoute
// =============================================================================
// Three-stage evaluation order:
//
//   Stage 1 — Boot gate (isInitialized === false)
//   ─────────────────────────────────────────────
//   On a hard refresh, Redux starts with isInitialized: false. App.jsx
//   dispatches checkAuth() which hits /auth/me to validate the httpOnly cookie.
//   Until that async round-trip resolves we MUST NOT redirect — we don't yet
//   know whether the user has a valid session or not. Rendering the spinner here
//   prevents the classic "refresh kicks you to /login" bug.
//
//   Stage 2 — Auth gate (isInitialized === true, isAuthenticated === false)
//   ───────────────────────────────────────────────────────────────────────
//   checkAuth has resolved and confirmed there is no valid session. Safe to
//   redirect to /login now.
//
//   Stage 3 — Authenticated (isInitialized === true, isAuthenticated === true)
//   ───────────────────────────────────────────────────────────────────────────
//   Render children or the nested <Outlet /> for layout routes.
// =============================================================================

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized, loading } = useSelector(
    (state) => state.auth
  );

  // ── Stage 1: Boot gate ────────────────────────────────────────────────────
  // The /auth/me request is still in-flight. Block all routing decisions until
  // the session status is definitively known.
  if (!isInitialized) {
    return <BootSpinner label="Verifying session..." />;
  }

  // ── Secondary: interactive loading (login / logout in progress) ───────────
  // This fires during the loginUser / logoutUser thunks, not on page load.
  if (loading) {
    return <BootSpinner label="Please wait..." />;
  }

  // ── Stage 2: No valid session after initialization ────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Stage 3: Authenticated — render the protected content ─────────────────
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

