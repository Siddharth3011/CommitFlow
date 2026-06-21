import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Loader2,
  Trash2,
  Calendar,
  User,
  Clock,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  updateTask,
  deleteTask,
  setSelectedTask,
  clearSelectedTask,
} from '../../features/tasks/taskSlice';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'];
const STATUS_SELECTOR_OPTIONS = ['Todo', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const STATUS_COLORS = {
  Backlog: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
  Todo: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Review: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Done: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const PRIORITY_COLORS = {
  Low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  High: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const PRIORITY_DOTS = {
  Low: 'bg-sky-400',
  Medium: 'bg-amber-400',
  High: 'bg-rose-400',
};

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (isoDate) => {
  if (!isoDate) return null;
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// =============================================================================
// Sub-components
// =============================================================================

/** Single-field dropdown selector used for Status and Priority */
const FieldDropdown = ({ label, value, options, colorMap, onChange, loading, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading || disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-75 disabled:hover:opacity-100 disabled:cursor-not-allowed ${
          colorMap[value] || 'border-border bg-secondary text-foreground'
        }`}
      >
        <span>{value}</span>
        {loading ? (
          <Loader2 size={11} className="animate-spin shrink-0" />
        ) : !disabled ? (
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        ) : null}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-left ${
                opt === value ? 'font-semibold' : 'text-foreground'
              }`}
            >
              {opt === value && <CheckCircle2 size={11} className="text-primary shrink-0" />}
              {opt !== value && <div className="w-[11px]" />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Assignee dropdown selector to assign/unassign tasks */
const AssigneeDropdown = ({ assignee, members, onChange, loading, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
  ];
  const getAvatarColor = (name = '') => {
    const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[colorIdx];
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading || disabled}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs transition-all hover:bg-secondary/70 disabled:opacity-75 disabled:hover:bg-secondary/40 disabled:cursor-not-allowed text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {assignee ? (
            <>
              <div
                className={`h-5 w-5 rounded-full ${getAvatarColor(assignee.name)} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
              >
                {getInitials(assignee.name)}
              </div>
              <span className="font-medium text-foreground truncate">{assignee.name}</span>
            </>
          ) : (
            <>
              <User size={13} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Unassigned</span>
            </>
          )}
        </div>
        {loading ? (
          <Loader2 size={11} className="animate-spin shrink-0" />
        ) : !disabled ? (
          <ChevronDown
            size={12}
            className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 left-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl scrollbar-thin">
          {/* Unassigned Option */}
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-left"
          >
            {assignee === null ? (
              <CheckCircle2 size={11} className="text-primary shrink-0" />
            ) : (
              <div className="w-[11px]" />
            )}
            <User size={13} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground font-medium">Unassigned</span>
          </button>

          {/* Members List */}
          {members.map((member) => {
            const userDoc = member.userId;
            if (!userDoc) return null;
            const isSelected = assignee?._id === userDoc._id;

            return (
              <button
                key={userDoc._id}
                onClick={() => {
                  onChange(userDoc._id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-left"
              >
                {isSelected ? (
                  <CheckCircle2 size={11} className="text-primary shrink-0" />
                ) : (
                  <div className="w-[11px]" />
                )}
                <div
                  className={`h-5 w-5 rounded-full ${getAvatarColor(userDoc.name)} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
                >
                  {getInitials(userDoc.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`truncate font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {userDoc.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {userDoc.email}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};


// =============================================================================
// TaskDetailDrawer Component
// =============================================================================

/**
 * A full-height slide-in drawer showing all task details.
 * Props:
 *   task        — the task document currently selected
 *   projectId   — parent project ID (for nested API calls)
 *   members     — array of project members (for assignee display)
 *   onClose     — callback to close the drawer
 */
const TaskDetailDrawer = ({ task, projectId, members, onClose }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  const { selectedProject } = useSelector((state) => state.projects);
  const reduxMembers = useSelector((state) => state.members.members);
  const projectMembers = members || reduxMembers || [];

  const currentMembership = projectMembers.find((m) => m.userId?._id === user?._id);
  const currentRole = currentMembership?.role || 'viewer';
  const isAssigneeEditable = currentRole === 'admin';
  const isStatusPriorityEditable = currentRole === 'admin' || currentRole === 'editor';

  const statusOptions = currentRole === 'admin'
    ? ['Backlog', 'Todo', 'In Progress', 'Review', 'Done']
    : ['Todo', 'In Progress', 'Done'];

  const projectOwnerId = selectedProject?.ownerId?._id || selectedProject?.ownerId;
  const taskCreatorId = task?.creatorId?._id || task?.creatorId;
  const currentUserId = user?._id;

  const isDeleteAllowed =
    (projectOwnerId && currentUserId && projectOwnerId.toString() === currentUserId.toString()) ||
    (taskCreatorId && currentUserId && taskCreatorId.toString() === currentUserId.toString());

  // Local editable state synced from the task prop
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Sync fields when selected task changes (e.g. switching tasks without closing)
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setSaveStatus('idle');
    }
  }, [task?._id]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  // ─── Field update helpers ──────────────────────────────────────────────────

  const handleFieldUpdate = async (updates) => {
    setSaveStatus('saving');
    const result = await dispatch(
      updateTask({ projectId, taskId: task._id, updates })
    );
    if (updateTask.fulfilled.match(result)) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      handleFieldUpdate({ title: trimmed });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      handleFieldUpdate({ description });
    }
  };

  const handleStatusChange = (status) => handleFieldUpdate({ status });
  const handlePriorityChange = (priority) => handleFieldUpdate({ priority });

  const handleDelete = async () => {
    await dispatch(deleteTask({ projectId, taskId: task._id }));
    onClose();
  };

  // Resolve assignee document from members list
  const assigneeDoc = task.assignee
    ? projectMembers.find((m) => m.userId?._id === task.assignee?._id)?.userId ||
      task.assignee
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl flex flex-col bg-background border-l border-border shadow-2xl"
        style={{ animation: 'drawerSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        role="dialog"
        aria-modal="true"
        aria-label="Task detail drawer"
      >
        {/* ── Drawer Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Priority dot indicator */}
            <div
              className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOTS[task.priority] || 'bg-muted'}`}
            />
            <span className="text-xs font-medium text-muted-foreground capitalize tracking-wide">
              Task
            </span>

            {/* Save status indicator */}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 size={11} className="animate-spin" />
                Saving…
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                <CheckCircle2 size={11} />
                Saved
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={11} />
                Save failed
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Delete task */}
            {isDeleteAllowed && (
              !deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="rounded-md bg-destructive px-2.5 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {actionLoading ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close drawer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Drawer Body (scrollable) ─────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT PANEL — Title, Description, Comments */}
          <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 gap-5 min-w-0">
            {/* Title */}
            <div>
              <label className="sr-only" htmlFor="task-title">
                Task title
              </label>
              <textarea
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                rows={2}
                placeholder="Task title…"
                className="w-full resize-none bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/50 outline-none focus:outline-none leading-tight"
              />
            </div>

            {/* Description */}
            <div>
              <label className="sr-only" htmlFor="task-description">
                Task description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={5}
                placeholder="Add a description for this task…"
                className="w-full resize-none rounded-lg border border-border bg-secondary/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all leading-relaxed"
              />
            </div>

            {/* Comments Section */}
            <div className="flex-1">
              <TaskComments projectId={projectId} taskId={task._id} />
            </div>
          </div>

          {/* RIGHT SIDEBAR — Metadata & Attachments */}
          <div className="w-64 shrink-0 flex flex-col overflow-y-auto border-l border-border bg-secondary/20 px-4 py-5 gap-5">

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </label>
              <FieldDropdown
                value={task.status}
                options={statusOptions}
                colorMap={STATUS_COLORS}
                onChange={handleStatusChange}
                loading={saveStatus === 'saving'}
                disabled={!isStatusPriorityEditable}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Priority
              </label>
              <FieldDropdown
                value={task.priority}
                options={PRIORITY_OPTIONS}
                colorMap={PRIORITY_COLORS}
                onChange={handlePriorityChange}
                loading={saveStatus === 'saving'}
                disabled={!isStatusPriorityEditable}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assignee
              </label>
              <AssigneeDropdown
                assignee={assigneeDoc}
                members={projectMembers}
                onChange={(userId) => handleFieldUpdate({ assignee: userId })}
                loading={saveStatus === 'saving'}
                disabled={!isAssigneeEditable}
              />
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Due Date
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground">
                  <Calendar size={12} className="text-muted-foreground shrink-0" />
                  {formatDate(task.dueDate)}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock size={11} className="shrink-0" />
                <span>
                  Created{' '}
                  {new Date(task.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {task.updatedAt !== task.createdAt && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock size={11} className="shrink-0" />
                  <span>
                    Updated{' '}
                    {new Date(task.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="border-t border-border pt-4">
              <TaskAttachments projectId={projectId} taskId={task._id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailDrawer;
