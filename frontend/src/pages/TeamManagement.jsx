import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Shield, Mail, User, ShieldCheck, ShieldAlert, ArrowRight, Loader2, Users } from 'lucide-react';
import API from '../api/axios';
import { fetchProjects } from '../features/projects/projectSlice';

// Helper to get initials
const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// Dynamic avatar colors
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

const getAvatarBg = (name = '') => {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
};

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');

  // Load projects if not already in state
  useEffect(() => {
    if (!projects || projects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, projects]);

  // Aggregate project members into a unified directory list
  useEffect(() => {
    const fetchAllMembers = async () => {
      if (!projects || projects.length === 0) return;
      setLoading(true);
      try {
        const promises = projects.map((project) =>
          API.get(`/projects/${project._id}/members`)
            .then((res) => ({
              projectId: project._id,
              projectName: project.name,
              members: res.data.members || [],
            }))
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        const memberMap = {}; // userId -> user info with array of projects

        results.forEach((res) => {
          if (!res) return;
          res.members.forEach((m) => {
            const userDoc = m.userId;
            if (!userDoc) return;

            if (!memberMap[userDoc._id]) {
              memberMap[userDoc._id] = {
                _id: userDoc._id,
                name: userDoc.name,
                email: userDoc.email,
                projects: [],
                role: m.role, // Max role resolver
                status: 'Active',
              };
            }

            // Append project info
            memberMap[userDoc._id].projects.push({
              _id: res.projectId,
              name: res.projectName,
              role: m.role,
            });

            // Resolve max project role (Admin > Editor > Viewer)
            if (m.role === 'admin') {
              memberMap[userDoc._id].role = 'admin';
            } else if (m.role === 'editor' && memberMap[userDoc._id].role !== 'admin') {
              memberMap[userDoc._id].role = 'editor';
            }
          });
        });

        setTeamMembers(Object.values(memberMap));
      } catch (error) {
        console.error('Error fetching team directory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMembers();
  }, [projects]);

  // Filters
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedRole === 'All Roles') return matchesSearch;
    return matchesSearch && m.role?.toLowerCase() === selectedRole.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Directory</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View all collaborators, their active roles, and project assignments.
        </p>
      </div>

      {/* Directory Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members by name or email..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
        </div>

        {/* Role Filtering Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-lg border border-border bg-card self-start sm:self-auto">
          {['All Roles', 'Admin', 'Editor', 'Viewer'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                selectedRole === role
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading directory...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Users size={32} className="text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground text-sm">No members found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No directory entries match your search criteria or role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Collaborator</th>
                  <th className="px-6 py-4">Global Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Project Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMembers.map((member) => {
                  const avatarBg = getAvatarBg(member.name);
                  const isSystemAdmin = member.role === 'admin';
                  const isSystemEditor = member.role === 'editor';

                  return (
                    <tr key={member._id} className="group hover:bg-secondary/10 transition-colors">
                      {/* Avatar, Name, Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatarBg} text-white font-bold text-xs`}>
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-foreground text-sm leading-snug truncate">
                              {member.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] md:max-w-xs">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Global Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border capitalize
                          ${isSystemAdmin ? 'bg-primary/10 text-primary border-primary/20' : ''}
                          ${isSystemEditor ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                          ${member.role === 'viewer' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : ''}
                        `}>
                          {isSystemAdmin ? (
                            <ShieldCheck size={11} className="shrink-0" />
                          ) : (
                            <Shield size={11} className="shrink-0" />
                          )}
                          {member.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {member.status}
                        </span>
                      </td>

                      {/* Project Assignments */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {member.projects.map((proj) => (
                            <span
                              key={proj._id}
                              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/80"
                              title={`${proj.name} (${proj.role})`}
                            >
                              <span className="truncate max-w-[100px]">{proj.name}</span>
                              <span className="text-[9px] text-muted-foreground capitalize">
                                ({proj.role})
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
