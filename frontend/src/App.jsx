import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Page imports
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import TeamManagement from './pages/TeamManagement';
import Settings from './pages/Settings';
import GlobalAnalytics from './pages/GlobalAnalytics';
import LandingPage from './pages/LandingPage';
import VerifyEmail from './pages/VerifyEmail';

// =============================================================================
// App Component — Router Configuration
// =============================================================================

function App() {
  const dispatch = useDispatch();

  // On initial load, dispatch checkAuth to verify any stored httpOnly cookie
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ───────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ── Private / Guarded Routes ─────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard — project listing */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Projects — redirect /projects to dashboard for now */}
            <Route path="/projects" element={<Navigate to="/dashboard" replace />} />

            {/* Individual project workspace */}
            <Route path="/projects/:id" element={<ProjectWorkspace />} />

            {/* Real pages */}
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<GlobalAnalytics />} />
          </Route>
        </Route>

        {/* ── Fallback ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
