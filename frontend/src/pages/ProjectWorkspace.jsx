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
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { fetchProjectById, clearSelectedProject } from '../features/projects/projectSlice';
import { fetchProjectMembers, clearMembers } from '../features/projects/memberSlice';
import useProjectSocket from '../hooks/useProjectSocket';
import ManageMembers from '../components/project/ManageMembers';
import KanbanBoard from '../components/project/KanbanBoard';
import ProjectAnalytics from '../components/project/ProjectAnalytics';
import API from '../api/axios';

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
// Inline Editable Field — Admin Only
// =============================================================================

const InlineEdit = ({ value, onSave, multiline = false, placeholder = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft.trim() === (value || '').trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none rounded-lg border border-ring bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-ring bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={11} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity"
      title="Click to edit"
    >
      <span className="shrink-0 opacity-0 group-hover:opacity-70 transition-opacity">
        <Pencil size={12} className="text-muted-foreground" />
      </span>
    </button>
  );
};

// =============================================================================
// Overview Tab
// =============================================================================

const OverviewTab = ({ project, members, isAdmin, projectId }) => {
  const dispatch = useDispatch();
  const owner = members.find((m) => m.role === 'admin');
  const ownerName = owner?.userId?.name || 'Unknown';

  const [editingField, setEditingField] = useState(null); // 'name' | 'description' | null
  const [draftName, setDraftName] = useState(project.name || '');
  const [draftDesc, setDraftDesc] = useState(project.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (field) => {
    const updates = {};
    if (field === 'name') updates.name = draftName.trim();
    if (field === 'description') updates.description = draftDesc.trim();

    if (!updates.name && field === 'name') return; // name required
    setSaving(true);
    try {
      await API.patch(`/projects/${projectId}`, updates);
      dispatch(fetchProjectById(projectId)); // refresh project data
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  const handleCancel = (field) => {
    if (field === 'name') setDraftName(project.name || '');
    if (field === 'description') setDraftDesc(project.description || '');
    setEditingField(null);
  };

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            About this project
          </h3>
          {/* Admin-only edit button for description */}
          {isAdmin && editingField !== 'description' && (
            <button
              onClick={() => {
                setDraftDesc(project.description || '');
                setEditingField('description');
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Edit description (Admin only)"
            >
              <Pencil size={11} />
              Edit
            </button>
          )}
        </div>

        {editingField === 'description' ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={3}
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              placeholder="Describe what this project is about..."
              className="w-full resize-none rounded-lg border border-ring bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave('description')}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Save
              </button>
              <button
                onClick={() => handleCancel('description')}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={11} />
                Cancel
              </button>
            </div>
          </div>
        ) : project.description ? (
          <p className="text-sm leading-relaxed text-foreground">{project.description}</p>
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

  // Admin-only inline edit state for the header name
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectMembers(id));
    }
    return () => {
      dispatch(clearSelectedProject());
      dispatch(clearMembers());
    };
  }, [id, dispatch]);

  // Sync draft when project loads
  useEffect(() => {
    if (project?.name) setDraftName(project.name);
  }, [project?.name]);

  useProjectSocket(id, user);

  const handleSaveName = async () => {
    if (!draftName.trim() || draftName.trim() === project.name) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    try {
      await API.patch(`/projects/${id}`, { name: draftName.trim() });
      dispatch(fetchProjectById(id));
    } catch (err) {
      console.error('Failed to update project name:', err);
    } finally {
      setNameSaving(false);
      setEditingName(false);
    }
  };

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

  if (!project) return null;

  // Resolve current user's role in this project
  const currentMembership = members.find((m) => m.userId?._id === user?._id);
  const currentRole = currentMembership?.role || 'viewer';
  const isAdmin = currentRole === 'admin';

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
          <div className="min-w-0">
            {/* Project Name — inline editable for admins */}
            {isAdmin && editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setDraftName(project.name); setEditingName(false); }
                  }}
                  className="rounded-lg border border-ring bg-background px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 w-full max-w-xs"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 shrink-0"
                >
                  {nameSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  onClick={() => { setDraftName(project.name); setEditingName(false); }}
                  className="flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                {/* Admin-only edit pencil for project name */}
                {isAdmin && (
                  <button
                    onClick={() => { setDraftName(project.name); setEditingName(true); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    title="Edit project name (Admin only)"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )}
            {project.description && !editingName && (
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
          <OverviewTab
            project={project}
            members={members}
            isAdmin={isAdmin}
            projectId={id}
          />
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
