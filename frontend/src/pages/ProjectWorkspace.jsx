import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FolderKanban,
  Users,
  CalendarDays,
  Crown,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Shield,
  Clock,
  Kanban,
  BarChart3,
} from 'lucide-react';
import { fetchProjectById, clearSelectedProject } from '../features/projects/projectSlice';
import { fetchProjectMembers, clearMembers } from '../features/projects/memberSlice';
import useProjectSocket from '../hooks/useProjectSocket';
import ManageMembers from '../components/project/ManageMembers';
import KanbanBoard from '../components/project/KanbanBoard';
import ProjectAnalytics from '../components/project/ProjectAnalytics';

// =============================================================================
// Tab Bar
// =============================================================================

const TABS = [
  { id: 'overview', label: 'Overview', icon: FolderKanban },
  { id: 'board', label: 'Board', icon: Kanban },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// =============================================================================
// Overview Tab
// =============================================================================

const OverviewTab = ({ project, members }) => {
  const owner = members.find((m) => m.role === 'admin');
  const ownerName = owner?.userId?.name || 'Unknown';

  const metaItems = [
    {
      icon: CalendarDays,
      label: 'Created on',
      value: new Date(project.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    {
      icon: Clock,
      label: 'Last updated',
      value: new Date(project.updatedAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    {
      icon: Crown,
      label: 'Project owner',
      value: ownerName,
    },
    {
      icon: Users,
      label: 'Team size',
      value: `${members.length} member${members.length !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Description Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          About this project
        </h3>
        {project.description ? (
          <p className="text-sm leading-relaxed text-foreground">
            {project.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">
            No description has been added to this project yet.
          </p>
        )}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metaItems.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Icon size={15} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// ProjectWorkspace Page
// =============================================================================

const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedProject: project, loading: projectLoading, error: projectError } =
    useSelector((state) => state.projects);
  const { members, loading: membersLoading } = useSelector((state) => state.members);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectMembers(id));
    }
    // Cleanup on unmount to avoid stale data leaking into other routes
    return () => {
      dispatch(clearSelectedProject());
      dispatch(clearMembers());
    };
  }, [id, dispatch]);

  // =========================================================================
  // Real-Time Collaboration — Socket.io
  // =========================================================================
  // Activates the WebSocket connection and subscribes to the project room.
  // The hook handles its own connect/disconnect lifecycle and dispatches
  // synchronous Redux actions (taskAddedFromSocket, taskMovedFromSocket,
  // taskRemovedFromSocket) whenever a peer emits a task event.
  //
  // Passing `user` (not just user._id) lets the hook also use user.name for
  // future presence/cursor features without a separate selector.
  useProjectSocket(id, user);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (projectLoading || membersLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={32} className="text-destructive" />
        <div>
          <h2 className="font-semibold text-foreground">Failed to load project</h2>
          <p className="mt-1 text-sm text-muted-foreground">{projectError}</p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────
  if (!project) return null;

  // Resolve current user's role in this project
  const currentMembership = members.find((m) => m.userId?._id === user?._id);
  const currentRole = currentMembership?.role || 'viewer';

  const initials = project.name?.slice(0, 2).toUpperCase() || 'PR';

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} />
        Back to Dashboard
      </Link>

      {/* Project Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Project Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-foreground">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Shield size={11} />
          <span className="capitalize">{currentRole}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.id === 'members' && (
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {members.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={activeTab === 'board' ? 'overflow-x-auto' : ''}>
        {activeTab === 'overview' && (
          <OverviewTab project={project} members={members} />
        )}
        {activeTab === 'board' && (
          <KanbanBoard projectId={id} members={members} />
        )}
        {activeTab === 'members' && (
          <ManageMembers projectId={id} />
        )}
        {activeTab === 'analytics' && (
          <ProjectAnalytics />
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspace;
