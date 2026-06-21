import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart2,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import socket, { SOCKET_EVENTS } from '../../config/socket';
import { updateGlobalProjectProgress, appendActivityFeed } from '../../features/projects/projectSlice';
import { moveLiveTask } from '../../features/tasks/taskSlice';
import { addLiveComment } from '../../features/tasks/commentSlice';

export const DashboardLayout = () => {
  const { user, handleLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { selectedProject, projects } = useSelector((state) => state.projects);
  const projectsRef = React.useRef(projects);
  React.useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Read the live tasks array so the socket listener can recount done/total
  // without an extra API call whenever a task:moved broadcast arrives.
  const tasks = useSelector((state) => state.tasks.tasks);

  // ===========================================================================
  // Global Socket Lifecycle + Dashboard Progress Sync
  // ===========================================================================
  // This layout is mounted for the entire authenticated session (Dashboard,
  // Workspace, Analytics, Settings — everything inside the guarded routes).
  //
  // Architecture:
  //   1. Connect the singleton socket here so it is ALWAYS active while the
  //      user is logged in — not just when they open a ProjectWorkspace.
  //   2. Emit `join:user` to subscribe to the personal user room
  //      (room key = user._id string). The backend task controller emits
  //      `global:task_updated` to this room after every task mutation so
  //      Dashboard progress bars update regardless of the current page.
  //   3. Keep the existing task:moved/created/deleted handlers as a secondary
  //      sync path for when the tasks array is already loaded in Redux
  //      (e.g. the user is actively in a ProjectWorkspace tab).
  //   4. On layout unmount (logout / session end) disconnect the socket.
  // ===========================================================================

  // ── Effect 1: Connection lifecycle + personal user room ───────────────────
  useEffect(() => {
    if (!user?._id) return;

    // Connect if not already connected (idempotent — socket.io ignores this
    // if the socket is already open, so this is safe to call on re-renders).
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log(`[Socket] Layout connected → socket.id: ${socket.id}`);
      // Join the personal user room so global:task_updated reaches us on any page.
      socket.emit(SOCKET_EVENTS.JOIN_USER, { userId: user._id });
      console.log(`[Socket] Joined personal user room → userId: ${user._id}`);
    };

    // If already connected (e.g. coming back from a workspace route), join immediately.
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN_USER, { userId: user._id });
    }

    // ── global:task_updated ──────────────────────────────────────────────────
    // Received on the personal user room after every task create/update/delete
    // in any project the user belongs to.
    //
    // Payload: { projectId, task, event: 'created'|'updated'|'deleted', timestamp }
    //
    // Strategy: we always have the task's status in the payload. We use the
    // `updateGlobalProjectProgress` Variant B delta for create/delete events
    // (±1 on the Done boundary) and for update we compute the delta from
    // the task's new status. For precise Variant A recounts the secondary
    // effect below handles the case when tasks ARE loaded in Redux.
    // -------------------------------------------------------------------------
    const handleGlobalTaskUpdated = ({ projectId, task, event, user: actor }) => {
      if (!projectId || !task) return;

      console.log(`[Socket] global:task_updated → project: ${projectId} | event: ${event}`);

      // Route all updates directly to our purely mathematical reducer
      dispatch(updateGlobalProjectProgress({ projectId, task, event }));

      if (event === 'updated') {
        // Dispatch action to update Kanban column state simultaneously
        dispatch(moveLiveTask({ taskId: task._id, newStatus: task.status, task }));

        // Secondary Action Hook: if the task just moved to 'Done', append a fresh milestone log.
        // The reducer now handles the exact recount math, so we just append the visual log here
        // if this was an update to Done.
        if (task.status === 'Done') {
          const matchedProj = projectsRef.current.find(
            (p) => p._id === projectId || p._id?.toString() === projectId
          );
          if (matchedProj) {
            dispatch(appendActivityFeed({
              _id: `milestone-${task._id}-${Date.now()}`,
              type: 'milestone',
              actorName: actor?.name || 'A teammate',
              action: `marked task '${task.title || 'Untitled task'}' as Done`,
              taskTitle: task.title || 'Untitled task',
              projectId,
              projectName: matchedProj.name,
              createdAt: new Date().toISOString(),
            }));
          }
        }
      }
    };

    const handleGlobalCommentAdded = ({ projectId, comment }) => {
      if (!projectId || !comment) return;
      console.log(`[Socket] global:comment_added → project: ${projectId}`);
      dispatch(addLiveComment(comment));
    };

    const handleDisconnect = (reason) => {
      console.log(`[Socket] Layout disconnected → reason: ${reason}`);
    };

    socket.on('connect',                        handleConnect);
    socket.on(SOCKET_EVENTS.GLOBAL_TASK_UPDATED, handleGlobalTaskUpdated);
    socket.on(SOCKET_EVENTS.GLOBAL_COMMENT_ADDED, handleGlobalCommentAdded);
    socket.on('disconnect',                     handleDisconnect);

    return () => {
      socket.off('connect',                        handleConnect);
      socket.off(SOCKET_EVENTS.GLOBAL_TASK_UPDATED, handleGlobalTaskUpdated);
      socket.off(SOCKET_EVENTS.GLOBAL_COMMENT_ADDED, handleGlobalCommentAdded);
      socket.off('disconnect',                     handleDisconnect);
      // We don't call socket.disconnect() here so the global connection
      // persists as long as the user session is active.
      console.log('[Socket] Layout unmounted — listeners removed.');
    };
  }, [user?._id, dispatch]);

  // ── Effect 2: Secondary sync — Variant A recount from live tasks array ────
  // Runs whenever the Redux tasks array changes (loaded by ProjectWorkspace).
  // Provides precise done/total counters when the full task list is available,
  // superseding the delta estimate from Effect 1 for the active project.
  useEffect(() => {
    const handleTaskMoved = (payload) => {
      const { projectId, taskId, newStatus } = payload;
      if (!projectId) return;

      const projectTasks = tasks.filter(
        (t) => t.projectId === projectId || t.projectId?.toString() === projectId
      );

      if (projectTasks.length > 0) {
        // Variant A — exact recount now that tasks are loaded.
        const doneTasks  = projectTasks.filter((t) => t.status === 'Done').length;
        const totalTasks = projectTasks.length;
        dispatch(updateGlobalProjectProgress({ projectId, doneTasks, totalTasks }));
      } else {
        const existing  = tasks.find((t) => t._id === taskId || t._id?.toString() === taskId);
        const prevStatus = existing?.status ?? null;
        if (prevStatus !== newStatus && (prevStatus === 'Done' || newStatus === 'Done')) {
          dispatch(updateGlobalProjectProgress({ projectId, prevStatus, newStatus }));
        }
      }
    };

    const handleTaskCreated = (payload) => {
      const { projectId, task } = payload;
      if (!projectId) return;
      const projectTasks = tasks.filter(
        (t) => t.projectId === projectId || t.projectId?.toString() === projectId
      );
      if (projectTasks.length > 0) {
        const doneTasks  = projectTasks.filter((t) => t.status === 'Done').length
                        + (task?.status === 'Done' ? 1 : 0);
        const totalTasks = projectTasks.length + 1;
        dispatch(updateGlobalProjectProgress({ projectId, doneTasks, totalTasks }));
      }
    };

    const handleTaskDeleted = (payload) => {
      const { projectId, taskId } = payload;
      if (!projectId) return;
      const projectTasks = tasks.filter(
        (t) => t.projectId === projectId || t.projectId?.toString() === projectId
      );
      if (projectTasks.length > 0) {
        const remaining  = projectTasks.filter(
          (t) => t._id !== taskId && t._id?.toString() !== taskId
        );
        dispatch(updateGlobalProjectProgress({
          projectId,
          doneTasks:  remaining.filter((t) => t.status === 'Done').length,
          totalTasks: remaining.length,
        }));
      }
    };

    socket.on(SOCKET_EVENTS.TASK_MOVED,   handleTaskMoved);
    socket.on(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
    socket.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.TASK_MOVED,   handleTaskMoved);
      socket.off(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
      socket.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
    };
  }, [tasks, dispatch]);



  // Navigation config mapping icons and paths
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Dynamic breadcrumb generation based on route path
  const renderBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    // If we're on the main dashboard, or no paths
    if (paths.length === 0 || (paths.length === 1 && paths[0].toLowerCase() === 'dashboard')) {
      return (
        <span className="text-foreground tracking-wide font-semibold">
          Dashboard
        </span>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Link 
          to="/dashboard" 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        {paths.map((segment, index) => {
          // If the first segment is "dashboard", skip rendering it to avoid "Dashboard › Dashboard › Projects"
          if (segment.toLowerCase() === 'dashboard') return null;
          
          const url = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          
          const isProjectSegment = selectedProject && selectedProject._id === segment;
          const label = isProjectSegment
            ? selectedProject.name
            : segment.charAt(0).toUpperCase() + segment.slice(1);
          
          return (
            <React.Fragment key={url}>
              <span className="text-muted-foreground/50 select-none">›</span>
              {isLast ? (
                <span className="text-foreground tracking-wide font-semibold truncate max-w-[150px] md:max-w-[250px]">
                  {label}
                </span>
              ) : (
                <Link
                  to={url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const activeNavItem = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Helper component for Logo
  const Logo = () => (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 hover:opacity-90 transition-opacity">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
        CF
      </div>
      {(!isSidebarCollapsed || isMobileOpen) && (
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          CommitFlow
        </span>
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* ============================================================================= */}
      {/* Desktop Sidebar */}
      {/* ============================================================================= */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header/Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border h-16">
          <Logo />
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Expand Trigger (when collapsed) */}
        {isSidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-border">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                }`}
                title={item.name}
              >
                <Icon size={18} className={isActive ? 'text-primary' : ''} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile / Logout Section */}
        <div className="p-3 border-t border-border bg-card/50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
            {/* User Avatar & Info */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-sm text-foreground">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-semibold truncate text-foreground">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{user?.email || 'user@commitflow.com'}</span>
                </div>
              )}
            </div>

            {/* Logout Trigger */}
            {!isSidebarCollapsed && (
              <button
                onClick={handleLogoutClick}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {isSidebarCollapsed && (
            <button
              onClick={handleLogoutClick}
              className="mt-3 flex w-full justify-center rounded-md py-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================================= */}
      {/* Mobile Sidebar overlay */}
      {/* ============================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <div className="relative flex w-4/5 max-w-xs flex-col border-r border-border bg-card p-4 transition-all animate-in slide-in-from-left duration-200">
            {/* Close Trigger */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={18} />
            </button>

            {/* Logo */}
            <div className="mb-8 mt-2">
              <Logo />
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/40'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Profile footer */}
            <div className="mt-auto border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-semibold text-sm">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================= */}
      {/* Main Container */}
      {/* ============================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Navigation Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 z-10">
          
          {/* Left: Hamburger menu (mobile) & Breadcrumbs (desktop) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-sm font-medium">
              {renderBreadcrumbs()}
            </div>
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-border p-2 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Panel */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 transition-colors duration-300">
          {/* Where inner screens are mounted */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
