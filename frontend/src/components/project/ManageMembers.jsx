import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  addMember,
  updateMemberRole,
  removeMember,
  clearMemberError,
} from '../../features/projects/memberSlice';

// =============================================================================
// Role configuration helpers
// =============================================================================

const ROLES = ['admin', 'editor', 'viewer'];

const ROLE_STYLES = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  editor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

const RoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
      ROLE_STYLES[role] || ROLE_STYLES.viewer
    }`}
  >
    <Shield size={10} />
    {role}
  </span>
);

// =============================================================================
// Invite Member Form (Admin only)
// =============================================================================

const InviteMemberForm = ({ projectId }) => {
  const dispatch = useDispatch();
  const { actionLoading, error } = useSelector((state) => state.members);
  const [form, setForm] = useState({ email: '', role: 'viewer' });
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    return () => dispatch(clearMemberError());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationError) setValidationError('');
    if (error) dispatch(clearMemberError());
    if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!form.email.trim()) {
      setValidationError('Email address is required.');
      return;
    }
    if (!emailRegex.test(form.email.trim())) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    const result = await dispatch(
      addMember({ projectId, email: form.email.trim(), role: form.role })
    );
    if (result.meta.requestStatus === 'fulfilled') {
      setForm({ email: '', role: 'viewer' });
      setSuccessMsg('Member invited successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <UserPlus size={15} className="text-muted-foreground" />
        Invite a member
      </h3>

      {displayError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{displayError}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-3.5 py-3">
          <p className="text-xs text-green-600 dark:text-green-400">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {/* Email */}
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="teammate@example.com"
          disabled={actionLoading}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 transition-colors"
        />

        {/* Role Selector */}
        <div className="relative">
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            disabled={actionLoading}
            className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 transition-colors cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all whitespace-nowrap"
        >
          {actionLoading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Inviting...
            </>
          ) : (
            <>
              <UserPlus size={13} />
              Invite
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// =============================================================================
// Member Row
// =============================================================================

const MemberRow = ({ member, projectId, isAdmin, currentUserId }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.members);
  const [isUpdating, setIsUpdating] = useState(false);

  const userId = member.userId?._id;
  const name = member.userId?.name || 'Unknown';
  const email = member.userId?.email || '—';
  const isSelf = userId === currentUserId;

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setIsUpdating(true);
    await dispatch(updateMemberRole({ projectId, userId, role: newRole }));
    setIsUpdating(false);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${name} from this project?`)) {
      dispatch(removeMember({ projectId, userId }));
    }
  };

  const avatarInitials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/20">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
          {avatarInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {name}{' '}
            {isSelf && (
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">(you)</span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Right: Role + Actions */}
      <div className="flex shrink-0 items-center gap-3">
        {isAdmin && !isSelf ? (
          // Editable role dropdown for admins
          <div className="relative">
            <select
              value={member.role}
              onChange={handleRoleChange}
              disabled={actionLoading || isUpdating}
              className="appearance-none rounded-md border border-border bg-background py-1.5 pl-2.5 pr-7 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 capitalize cursor-pointer transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {/* Remove button — admins only, cannot remove themselves */}
        {isAdmin && !isSelf && (
          <button
            onClick={handleRemove}
            disabled={actionLoading}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
            title={`Remove ${name}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// ManageMembers — Main Export
// =============================================================================

const ManageMembers = ({ projectId }) => {
  const { members, loading } = useSelector((state) => state.members);
  const { user } = useSelector((state) => state.auth);

  // Determine the current user's role in this project
  const currentMembership = members.find((m) => m.userId?._id === user?._id);
  const currentUserRole = currentMembership?.role || 'viewer';
  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="space-y-5">
      {/* Invite Form — admin only */}
      {isAdmin && <InviteMemberForm projectId={projectId} />}

      {/* Members List */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Team Members
          </h3>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!loading && members.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No members found for this project.
          </p>
        )}

        {/* Member rows */}
        {!loading && members.length > 0 && (
          <div className="space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member._id}
                member={member}
                projectId={projectId}
                isAdmin={isAdmin}
                currentUserId={user?._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Read-only notice for non-admins */}
      {!isAdmin && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield size={12} />
          Only project admins can invite or manage team members.
        </p>
      )}
    </div>
  );
};

export default ManageMembers;
