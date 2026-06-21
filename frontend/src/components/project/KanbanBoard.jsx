import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Calendar,
  User,
  X,
} from 'lucide-react';
import {
  fetchProjectTasks,
  createTask,
  updateTask,
  setSelectedTask,
  optimisticallyMoveTask,
  revertTaskMove,
  clearTasks,
} from '../../features/tasks/taskSlice';
import TaskDetailDrawer from './TaskDetailDrawer';

// =============================================================================
// Constants
// =============================================================================

const COLUMNS = [
  { id: 'Backlog', label: 'Backlog', color: 'text-zinc-500', dot: 'bg-zinc-400' },
  { id: 'Todo', label: 'Todo', color: 'text-blue-400', dot: 'bg-blue-400' },
  { id: 'In Progress', label: 'In Progress', color: 'text-amber-400', dot: 'bg-amber-400' },
  { id: 'Review', label: 'Review', color: 'text-violet-400', dot: 'bg-violet-400' },
  { id: 'Done', label: 'Done', color: 'text-emerald-400', dot: 'bg-emerald-400' },
];

const PRIORITY_CONFIG = {
  Low: {
    label: 'Low',
    badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    dot: 'bg-sky-400',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  High: {
    label: 'High',
    badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

// =============================================================================
// Helpers
// =============================================================================

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

const getAvatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// =============================================================================
// Task Card
// =============================================================================

const TaskCard = ({ task, onCardClick, onDragStart }) => {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const assigneeName = task.assignee?.name || null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onCardClick(task)}
      className="group relative flex flex-col gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:border-muted-foreground/30 hover:shadow-md transition-all duration-150 active:opacity-75"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(task)}
      aria-label={`Open task: ${task.title}`}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priority.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>

        {/* Quick actions — visible on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCardClick(task);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-all"
          aria-label="More options"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Footer metadata */}
      <div className="flex items-center justify-between mt-0.5">
        {/* Due date */}
        {task.dueDate ? (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        ) : (
          <div />
        )}

        {/* Assignee avatar */}
        {assigneeName ? (
          <div
            className={`h-6 w-6 rounded-full ${getAvatarColor(assigneeName)} flex items-center justify-center text-[9px] font-bold text-white`}
            title={assigneeName}
          >
            {getInitials(assigneeName)}
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/40">
            <User size={10} />
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// New Task Form (inline inside a column)
// =============================================================================

const NewTaskForm = ({ columnStatus, projectId, onClose }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.tasks);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const result = await dispatch(
      createTask({
        projectId,
        taskData: { title: trimmed, status: columnStatus, priority },
      })
    );

    if (createTask.fulfilled.match(result)) {
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-ring bg-card p-3 space-y-2.5 shadow-md"
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Priority picker */}
      <div className="flex gap-1">
        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPriority(key)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all ${
              priority === key
                ? cfg.badge
                : 'border-border text-muted-foreground hover:border-muted-foreground/50'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {key}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || actionLoading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {actionLoading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : null}
          Create Task
        </button>
      </div>
    </form>
  );
};

// =============================================================================
// Kanban Column
// =============================================================================

const KanbanColumn = ({
  column,
  tasks,
  projectId,
  onCardClick,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragTarget,
}) => {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  return (
    <div
      className={`flex flex-col gap-3 min-h-[200px] transition-all duration-150 ${
        isDragTarget ? 'scale-[1.01]' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${column.dot}`} />
          <h3 className={`text-xs font-semibold uppercase tracking-wide ${column.color}`}>
            {column.label}
          </h3>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setShowNewTaskForm(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={`Add task to ${column.label}`}
          aria-label={`Add task to ${column.label}`}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Drop zone highlight */}
      <div
        className={`flex flex-col gap-2 rounded-xl border-2 min-h-[160px] p-2 transition-all duration-150 ${
          isDragTarget
            ? 'border-primary/50 bg-primary/5'
            : 'border-transparent'
        }`}
      >
        {/* Task Cards */}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onCardClick={onCardClick}
            onDragStart={onDragStart}
          />
        ))}

        {/* Empty column placeholder */}
        {tasks.length === 0 && !showNewTaskForm && (
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/50 py-8 text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-colors w-full"
            aria-label={`Add a task to ${column.label}`}
          >
            <Plus size={16} />
            <span className="text-[10px]">Add task</span>
          </button>
        )}

        {/* New Task Inline Form */}
        {showNewTaskForm && (
          <NewTaskForm
            columnStatus={column.id}
            projectId={projectId}
            onClose={() => setShowNewTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// KanbanBoard Component
// =============================================================================

/**
 * Main Kanban board component.
 * Props:
 *   projectId — the current project's ID (used for nested API routes)
 *   members   — array of project member docs (passed down for assignee display in drawer)
 */
const KanbanBoard = ({ projectId, members = [] }) => {
  const dispatch = useDispatch();
  const { tasks, selectedTask, loading, error } = useSelector(
    (state) => state.tasks
  );

  const [draggedTask, setDraggedTask] = useState(null);
  const [dragTargetColumn, setDragTargetColumn] = useState(null);

  // Fetch tasks when board mounts
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectTasks(projectId));
    }
    return () => {
      dispatch(clearTasks());
    };
  }, [projectId, dispatch]);

  // ─── Drag & Drop handlers ──────────────────────────────────────────────────

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image styling: browsers use the element itself; we rely on
    // the `active:opacity-75` class on the card for visual feedback.
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragTargetColumn !== columnId) setDragTargetColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragTargetColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragTargetColumn(null);

    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    const previousStatus = draggedTask.status;
    const taskId = draggedTask._id;
    setDraggedTask(null);

    // Optimistic update — move card instantly in UI
    dispatch(optimisticallyMoveTask({ taskId, newStatus: targetStatus }));

    // Persist to backend
    const result = await dispatch(
      updateTask({
        projectId,
        taskId,
        updates: { status: targetStatus },
      })
    );

    // Revert on failure
    if (!updateTask.fulfilled.match(result)) {
      dispatch(revertTaskMove({ taskId, previousStatus }));
    }
  };

  // ─── Task card click → open drawer ────────────────────────────────────────
  const handleCardClick = (task) => {
    dispatch(setSelectedTask(task));
  };

  const handleCloseDrawer = () => {
    dispatch(setSelectedTask(null));
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-64 space-y-3">
            <div className="flex items-center gap-2 px-0.5">
              <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
        <AlertCircle size={16} className="shrink-0" />
        <div>
          <p className="font-semibold">Failed to load tasks</p>
          <p className="text-xs mt-0.5 opacity-80">{error}</p>
        </div>
        <button
          onClick={() => dispatch(fetchProjectTasks(projectId))}
          className="ml-auto shrink-0 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  return (
    <>
      {/* Board */}
      <div
        className="grid gap-4 overflow-x-auto pb-4"
        style={{
          gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(240px, 1fr))`,
          minWidth: `${COLUMNS.length * 260}px`,
        }}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            projectId={projectId}
            onCardClick={handleCardClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            isDragTarget={dragTargetColumn === column.id}
          />
        ))}
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          projectId={projectId}
          members={members}
          onClose={handleCloseDrawer}
        />
      )}
    </>
  );
};

export default KanbanBoard;
