import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
  Clock,
  Folder,
  Activity,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Mail,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import {
  createProject,
  clearProjectError,
  fetchGlobalDashboardData,
} from '../features/projects/projectSlice';
import API from '../api/axios';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Converts an ISO timestamp to a human-readable relative string.
 * Falls back to a locale date string for events older than 7 days.
 */
const formatRelativeTime = (iso) => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
];

const getAvatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// =============================================================================
// Create Project Modal
// =============================================================================

const CreateProjectModal = ({ onClose, onCreated }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.projects);
  const [form, setForm] = useState({ name: '', description: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    return () => dispatch(clearProjectError());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationError) setValidationError('');
    if (error) dispatch(clearProjectError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setValidationError('Project name is required.');
      return;
    }
    const result = await dispatch(
      createProject({ name: form.name.trim(), description: form.description.trim() })
    );
    if (result.meta.requestStatus === 'fulfilled') {
      onCreated();
      onClose();
    }
  };

  const displayError = validationError || error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">New Project</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create a workspace for your team</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {displayError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{displayError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="proj-name" className="block text-sm font-medium text-foreground">
              Project name <span className="text-destructive">*</span>
            </label>
            <input
              id="proj-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. CommitFlow Dashboard"
              disabled={loading}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="proj-desc" className="block text-sm font-medium text-foreground">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="proj-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this project about?"
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" />Creating...</>
              ) : (
                <><Plus size={14} />Create project</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// Project Card
// =============================================================================

const ProjectCard = ({ project, onClick }) => {
  const { completionPercentage = 0, totalTasks = 0, role } = project;
  const initials = getInitials(project.name);

  const barColor =
    completionPercentage === 100
      ? 'bg-emerald-500'
      : completionPercentage >= 50
      ? 'bg-blue-500'
      : 'bg-amber-500';

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-5 text-left shadow-sm hover:border-foreground/20 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${getAvatarColor(project.name)}`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground text-sm leading-snug">
              {project.name}
            </h3>
            {role && (
              <span
                className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase border
                  ${role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                  ${role === 'editor' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                  ${role === 'viewer' ? 'bg-muted text-muted-foreground border-border' : ''}
                `}
              >
                {role}
              </span>
            )}
          </div>
        </div>
        <ArrowRight
          size={15}
          className="shrink-0 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200"
        />
      </div>

      {/* Description */}
      {project.description ? (
        <p className="line-clamp-1 text-xs text-muted-foreground">{project.description}</p>
      ) : (
        <p className="text-xs italic text-muted-foreground/40">No description provided.</p>
      )}

      {/* Completion Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Completion
          </span>
          <span className="text-[11px] font-bold text-foreground">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-500" />
          {project.doneTasks}/{totalTasks} tasks done
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {new Date(project.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </button>
  );
};

// =============================================================================
// Activity Feed Item
// =============================================================================

const ActivityFeedItem = ({ item }) => {
  const isComment = item.type === 'comment';
  const isMilestone = item.type === 'milestone';
  
  let Icon = Paperclip;
  if (isComment) Icon = MessageSquare;
  if (isMilestone) Icon = CheckCircle2;

  let iconStyle = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  if (isComment) {
    iconStyle = 'text-violet-500 bg-violet-500/10 border-violet-500/20';
  } else if (isMilestone) {
    iconStyle = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  }

  return (
    <div className="flex items-start gap-3 text-xs border-b border-border/50 pb-3 last:border-0 last:pb-0">
      {/* Actor Avatar */}
      <div
        className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(item.actorName)}`}
      >
        {getInitials(item.actorName)}
      </div>

      <div className="min-w-0 flex-grow">
        {/* Action Text */}
        <p className="text-foreground leading-relaxed">
          <span className="font-semibold">{item.actorName}</span>
          {' '}
          <span className="text-muted-foreground">{item.action}</span>
          {' '}
          <span className="font-semibold italic">'{item.taskTitle}'</span>
          {item.type === 'attachment' && item.fileName && (
            <span className="text-muted-foreground"> ({item.fileName})</span>
          )}
        </p>

        {/* Project link + Timestamp */}
        <div className="flex items-center justify-between mt-1.5 gap-2">
          {item.projectId ? (
            <Link
              to={`/projects/${item.projectId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 bg-secondary/60 border border-border/40 px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <div className={`h-2 w-2 rounded-sm border shrink-0 flex items-center justify-center ${iconStyle}`}>
                <Icon size={8} />
              </div>
              {item.projectName}
            </Link>
          ) : (
            <span className="text-[10px] text-muted-foreground/60">{item.projectName}</span>
          )}
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Dashboard Page
// =============================================================================

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects = [], activityFeed = [], loading = false, error = null } = useSelector((state) => state.projects);

  // Invitations state
  const [invitations, setInvitations] = useState([]);
  const [inviteActionLoading, setInviteActionLoading] = useState(null); // invitationId being processed

  const fetchDashboard = useCallback(() => {
    dispatch(fetchGlobalDashboardData());
  }, [dispatch]);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await API.get('/invitations/mine');
      setInvitations(res.data.invitations || []);
    } catch (_) {
      // Non-critical; silently ignore
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchInvitations();
  }, [fetchDashboard, fetchInvitations]);

  const handleAcceptInvite = async (invitationId) => {
    setInviteActionLoading(invitationId);
    try {
      await API.patch(`/invitations/${invitationId}/accept`);
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      fetchDashboard(); // Refresh project list
    } catch (err) {
      console.error('Failed to accept invitation:', err);
    } finally {
      setInviteActionLoading(null);
    }
  };

  const handleDeclineInvite = async (invitationId) => {
    setInviteActionLoading(invitationId);
    try {
      await API.patch(`/invitations/${invitationId}/decline`);
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
    } catch (err) {
      console.error('Failed to decline invitation:', err);
    } finally {
      setInviteActionLoading(null);
    }
  };

  const adminCount = projects.filter((p) => p.role === 'admin').length;
  const memberCount = projects.filter((p) => p.role !== 'admin').length;

  const greeting =
    new Date().getHours() < 12
      ? 'morning'
      : new Date().getHours() < 17
      ? 'afternoon'
      : 'evening';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Good {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live overview of your development boards and team activity.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
            title="Refresh dashboard"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            New project
          </button>
        </div>
      </div>
      {/* ── Pending Invitations Banner ─────────────────────────────────── */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Mail size={14} />
            You have {invitations.length} pending project invitation{invitations.length > 1 ? 's' : ''}
          </div>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const isProcessing = inviteActionLoading === inv._id;
              return (
                <div
                  key={inv._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-white dark:bg-card border border-amber-200 dark:border-border px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    {/* Project name — crisp slate-900 in light mode */}
                    <p className="text-sm font-semibold text-slate-900 dark:text-foreground truncate">
                      {inv.projectId?.name || 'Unknown Project'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-muted-foreground mt-0.5">
                      Invited by{' '}
                      <span className="font-semibold text-slate-900 dark:text-foreground">
                        {inv.invitedBy?.name || 'a team member'}
                      </span>{' '}
                      &middot; Role:{' '}
                      <span className="capitalize font-medium text-slate-900 dark:text-foreground">{inv.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(inv._id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCheck size={12} />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv._id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      <XCircle size={12} />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Projects',
            value: projects.length,
            icon: Folder,
            gradient: 'from-blue-500/10 to-indigo-500/5',
            border: 'border-blue-500/20',
          },
          {
            label: 'As Admin',
            value: adminCount,
            icon: TrendingUp,
            gradient: 'from-emerald-500/10 to-teal-500/5',
            border: 'border-emerald-500/20',
          },
          {
            label: 'As Member',
            value: memberCount,
            icon: Users,
            gradient: 'from-amber-500/10 to-orange-500/5',
            border: 'border-amber-500/20',
          },
        ].map(({ label, value, icon: Icon, gradient, border }) => (
          <div
            key={label}
            className={`relative rounded-xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              {/* Label — darkened for light-mode legibility */}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {label}
              </p>
              <div className="p-2 bg-background/50 backdrop-blur-sm rounded-lg border border-border">
                <Icon
                  size={14}
                  className="text-slate-500 dark:text-muted-foreground group-hover:scale-110 transition-transform duration-200"
                />
              </div>
            </div>
            {/* Value — crisp slate-900 in light, white in dark */}
            <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-muted" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Global Error Banner */}
      {error && !loading && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <AlertCircle size={15} className="shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={fetchDashboard}
            className="ml-auto shrink-0 rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Two-Column Split Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

        {/* ── Left Column (65%) ─ Your Projects ── */}
        <div className="w-full lg:w-[65%] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-border pb-2">
            {/* Section header — deeper tint in light mode */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Your Projects
            </h2>
            {!loading && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
                {projects.length} Total
              </span>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-[210px] animate-pulse rounded-xl border border-border bg-secondary/40"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <FolderKanban size={36} className="mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-foreground">No projects yet</h3>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                Create your first project to start tracking progress here.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus size={14} />
                Create a project
              </button>
            </div>
          )}

          {/* Project Grid */}
          {!loading && projects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => navigate(`/projects/${project._id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column (35%) ─ System Activity Feed ── */}
        <div className="w-full lg:w-[35%] flex flex-col space-y-6 lg:sticky lg:top-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-border pb-2">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-500 dark:text-muted-foreground" />
              {/* Section header — deeper tint in light mode */}
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                System Activity
              </h2>
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-secondary px-2 py-0.5 rounded border border-border">
              Live Feed
            </span>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-secondary animate-pulse shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-3 w-4/5 bg-secondary animate-pulse rounded" />
                    <div className="h-3 w-3/5 bg-secondary animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Activity */}
          {!loading && activityFeed.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 flex flex-col items-center text-center shadow-sm">
              <Activity size={24} className="mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comments and file uploads across your projects will appear here.
              </p>
            </div>
          )}

          {/* Activity List */}
          {!loading && activityFeed.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 max-h-[520px] overflow-y-auto scrollbar-thin space-y-3.5 shadow-sm">
              {activityFeed.map((item) => (
                <ActivityFeedItem key={`${item.type}-${item._id}`} item={item} />
              ))}
            </div>
          )}
          </div>
        </div>

      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchDashboard}
        />
      )}
    </div>
  );
};

export default Dashboard;
