import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  fetchTaskComments,
  addComment,
  deleteComment,
  clearComments,
} from '../../features/tasks/commentSlice';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formats an ISO date string into a relative human-readable timestamp.
 * Falls back to a locale date string for older dates (> 7 days).
 */
const formatTimestamp = (isoDate) => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Returns initials from a display name string.
 */
const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// =============================================================================
// Avatar Component
// =============================================================================

const Avatar = ({ name, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];
  const colorIdx = name
    ? name.charCodeAt(0) % colors.length
    : 0;

  return (
    <div
      className={`${sizeClass} ${colors[colorIdx]} shrink-0 rounded-full flex items-center justify-center font-semibold text-white`}
    >
      {getInitials(name)}
    </div>
  );
};

// =============================================================================
// TaskComments Component
// =============================================================================

const TaskComments = ({ projectId, taskId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { comments, loading, actionLoading, error } = useSelector(
    (state) => state.comments
  );

  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Fetch comments when the task changes
  useEffect(() => {
    if (projectId && taskId) {
      dispatch(fetchTaskComments({ projectId, taskId }));
    }
    return () => {
      dispatch(clearComments());
    };
  }, [projectId, taskId, dispatch]);

  // Auto-scroll to the latest comment when comments update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || actionLoading) return;
    await dispatch(addComment({ projectId, taskId, text: trimmed }));
    setText('');
  };

  const handleDelete = (commentId) => {
    dispatch(deleteComment({ projectId, taskId, commentId }));
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Comments
          {comments.length > 0 && (
            <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
              {comments.length}
            </span>
          )}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Comment Feed */}
      <div className="max-h-64 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No comments yet. Be the first to add one.
          </p>
        ) : (
          comments.map((comment) => {
            const authorName = comment.userId?.name || 'Unknown';
            const isOwn = comment.userId?._id === user?._id;

            return (
              <div key={comment._id} className="group flex gap-3">
                <Avatar name={authorName} size="sm" />
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {authorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(comment.createdAt)}
                    </span>
                    {/* Delete button — visible on hover for own comments */}
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  {/* Comment body */}
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Comment Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-start gap-2.5 pt-1 border-t border-border"
      >
        <Avatar name={user?.name} size="sm" />
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
          <input
            id="comment-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            disabled={actionLoading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || actionLoading}
            className="shrink-0 flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {actionLoading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Send size={11} />
            )}
            {actionLoading ? '' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskComments;
