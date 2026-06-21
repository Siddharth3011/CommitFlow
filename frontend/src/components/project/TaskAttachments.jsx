import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paperclip,
  UploadCloud,
  Trash2,
  Download,
  FileText,
  Image,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  fetchTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  clearAttachments,
  clearAttachmentError,
} from '../../features/tasks/attachmentSlice';

// =============================================================================
// Helpers
// =============================================================================

const ACCEPTED_TYPES =
  'image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

const FILE_ICONS = {
  'image/jpeg': Image,
  'image/jpg': Image,
  'image/png': Image,
  'image/webp': Image,
  default: FileText,
};

const getFileIcon = (mimetype) =>
  FILE_ICONS[mimetype] || FILE_ICONS.default;

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (name = '') => {
  const parts = name.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toUpperCase()}` : '';
};

// =============================================================================
// TaskAttachments Component
// =============================================================================

const TaskAttachments = ({ projectId, taskId }) => {
  const dispatch = useDispatch();
  const { attachments, loading, uploading, actionLoading, error, uploadError } =
    useSelector((state) => state.attachments);

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch attachments when task context changes
  useEffect(() => {
    if (projectId && taskId) {
      dispatch(fetchTaskAttachments({ projectId, taskId }));
    }
    return () => {
      dispatch(clearAttachments());
    };
  }, [projectId, taskId, dispatch]);

  // ─── File handling ─────────────────────────────────────────────────────────

  const processFile = (file) => {
    if (!file) return;
    dispatch(uploadAttachment({ projectId, taskId, file }));
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDelete = async (attachmentId) => {
    setDeletingId(attachmentId);
    await dispatch(deleteAttachment({ projectId, taskId, attachmentId }));
    setDeletingId(null);
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-2 pt-1">
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg border border-border bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Attachments
            {attachments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
                {attachments.length}
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-ring transition-colors disabled:opacity-50"
        >
          <UploadCloud size={12} />
          Upload
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload file attachment"
      />

      {/* Error Banner */}
      {(error || uploadError) && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span className="flex-1">{uploadError || error}</span>
          <button
            onClick={() => dispatch(clearAttachmentError())}
            className="shrink-0 hover:opacity-70"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-primary/60 bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-muted-foreground/40 hover:bg-secondary/40'
        } ${uploading ? 'pointer-events-none' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <UploadCloud
              size={20}
              className={`transition-colors ${
                isDragOver ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <p className="text-xs text-muted-foreground text-center px-4">
              <span className="font-medium text-foreground">Click to upload</span>
              {' '}or drag & drop
            </p>
            <p className="text-[10px] text-muted-foreground">
              PNG, JPG, WebP, PDF, DOC, TXT · max 5 MB
            </p>
          </>
        )}
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.mimeType);
            const isDeleting = deletingId === attachment._id;

            return (
              <li
                key={attachment._id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 hover:bg-secondary/60 transition-colors"
              >
                {/* File type icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <FileIcon size={14} className="text-muted-foreground" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {getFileExtension(attachment.fileName)}
                    {attachment.uploadedBy?.name
                      ? ` · ${attachment.uploadedBy.name}`
                      : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Download / View */}
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                    className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Download attachment"
                  >
                    <Download size={13} />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(attachment._id)}
                    disabled={actionLoading && isDeleting}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label="Delete attachment"
                  >
                    {isDeleting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Empty state */}
      {!uploading && attachments.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic text-center -mt-1">
          No attachments yet.
        </p>
      )}
    </div>
  );
};

export default TaskAttachments;
