import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Trophy,
  Layers,
  FolderOpen,
} from 'lucide-react';
import API from '../api/axios';

// =============================================================================
// Helpers
// =============================================================================

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500', 'bg-cyan-500',
  'bg-pink-500',   'bg-indigo-500',
];
const getAvatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// =============================================================================
// Skeleton Components
// =============================================================================

const KpiSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-28 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    ))}
  </div>
);

const BarChartSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
    <div className="h-4 w-48 bg-muted rounded" />
    {[100, 75, 55, 40, 25].map((w, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-24 bg-muted rounded shrink-0" />
        <div className="flex-grow h-6 bg-muted rounded-md" style={{ maxWidth: `${w}%` }} />
      </div>
    ))}
  </div>
);

const LeaderboardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
    <div className="h-4 w-40 bg-muted rounded" />
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
        <div className="flex-grow space-y-1.5">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-2.5 w-48 bg-muted rounded" />
        </div>
        <div className="h-6 w-12 bg-muted rounded-full" />
      </div>
    ))}
  </div>
);

// =============================================================================
// KPI Card
// =============================================================================

const KpiCard = ({ label, value, icon: Icon, gradient, border, description }) => (
  <div
    className={`relative rounded-xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="p-2 bg-background/50 backdrop-blur-sm rounded-lg border border-border">
        <Icon
          size={14}
          className="text-muted-foreground group-hover:scale-110 transition-transform duration-200"
        />
      </div>
    </div>
    <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
    {description && (
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    )}
  </div>
);

// =============================================================================
// Project Distribution Bar Chart
// =============================================================================

const ProjectDistributionPanel = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 flex flex-col items-center text-center shadow-sm">
        <FolderOpen size={28} className="mb-3 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No project data</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create tasks inside your admin projects to see the distribution here.
        </p>
      </div>
    );
  }

  const maxActive = Math.max(...data.map((p) => p.totalTasks), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Layers size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">Project Task Distribution</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5 -mt-2">
        Active task overhead per project across your organization.
      </p>

      <div className="space-y-4">
        {data.map((project) => {
          const completionPct =
            project.completionRate ||
            project.progress ||
            (project.totalTasks > 0
              ? Math.round((project.doneTasks / project.totalTasks) * 100)
              : 0);

          const activePct =
            project.totalTasks > 0
              ? Math.round((project.activeTasks / project.totalTasks) * 100)
              : 0;

          const adjustedActivePct = Math.min(activePct, 100 - completionPct);

          return (
            <div key={project.projectId?.toString()} className="space-y-1.5">
              {/* Project label row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-foreground truncate max-w-[160px]">
                    {project.projectName}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                  <span>{project.activeTasks} active</span>
                  <span className="text-emerald-500 font-semibold">{completionPct}%</span>
                </div>
              </div>

              {/* Stacked progress bar — active (blue) + done (emerald) */}
              <div className="w-full h-4 bg-secondary rounded-md overflow-hidden flex">
                {/* Done segment */}
                <div
                  className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${project.completionRate || project.progress || completionPct || 0}%` }}
                />
                {/* Active segment */}
                <div
                  className="h-full bg-blue-500 transition-all duration-700 ease-out"
                  style={{ width: `${adjustedActivePct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Top Contributors Leaderboard
// =============================================================================

const LeaderboardPanel = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 flex flex-col items-center text-center shadow-sm">
        <Trophy size={28} className="mb-3 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No contributors yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign tasks and mark them Done to see leaderboard rankings appear here.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((c) => c.completedTasks || c.taskCount || 0), 1);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={16} className="text-amber-500" />
        <h3 className="text-sm font-bold text-foreground">Top Contributors</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Ranked by completed tasks across all your admin-managed projects.
      </p>

      <div className="space-y-5">
        {data.map((contributor, idx) => {
          const count = contributor.completedTasks || contributor.taskCount || 0;
          const barPct = Math.round((count / maxCount) * 100);
          const medal = medals[idx] || null;

          return (
            <div key={contributor.userId?.toString()} className="space-y-2">
              {/* Contributor header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank badge */}
                  <div className="relative shrink-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(contributor.name)}`}
                    >
                      {getInitials(contributor.name)}
                    </div>
                    {medal && (
                      <span className="absolute -top-1 -right-1 text-xs leading-none">
                        {medal}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                      {contributor.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {contributor.email || 'No email'}
                    </p>
                  </div>
                </div>

                {/* Completion count badge */}
                <span className="shrink-0 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold">
                  {count} tasks completed
                </span>
              </div>

              {/* Progress bar relative to top performer */}
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// GlobalAnalytics Page
// =============================================================================

const GlobalAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrgAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/analytics/organization');
      setData(res.data.data);
    } catch (err) {
      console.error('[GlobalAnalytics] Fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load organization analytics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgAnalytics();
  }, [fetchOrgAnalytics]);

  const kpis = data?.orgKpis ?? { totalTasks: 0, completedTasks: 0, overdueTasks: 0 };
  const projectDistribution = data?.projectDistribution ?? [];
  const taskPerUser = data?.taskPerUser || data?.topContributors || [];

  const kpiCards = [
    {
      label: 'Total Managed Items',
      value: kpis.totalTasks,
      icon: Layers,
      gradient: 'from-blue-500/10 to-indigo-500/5',
      border: 'border-blue-500/20',
      description: 'All tasks across your admin projects',
    },
    {
      label: 'Completed Tasks',
      value: kpis.completedTasks,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/20',
      description:
        kpis.totalTasks > 0
          ? `${Math.round((kpis.completedTasks / kpis.totalTasks) * 100)}% overall completion rate`
          : 'No tasks yet',
    },
    {
      label: 'Active Overdue Flags',
      value: kpis.overdueTasks,
      icon: Clock,
      gradient:
        kpis.overdueTasks > 0
          ? 'from-rose-500/10 to-red-500/5'
          : 'from-amber-500/10 to-orange-500/5',
      border:
        kpis.overdueTasks > 0 ? 'border-rose-500/40' : 'border-amber-500/20',
      description:
        kpis.overdueTasks > 0
          ? 'Tasks past their deadline — action required'
          : 'All deadlines on track',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart2 size={22} className="text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Organization Analytics
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregated metrics across all projects where you are an admin.
          </p>
        </div>

        <button
          onClick={fetchOrgAnalytics}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Global Error Banner ── */}
      {error && !loading && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <AlertCircle size={15} className="shrink-0 text-destructive" />
          <p className="text-sm text-destructive flex-grow">{error}</p>
          <button
            onClick={fetchOrgAnalytics}
            className="shrink-0 rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Cards Row ── */}
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* ── Two-Column Charts Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project Distribution */}
        {loading ? <BarChartSkeleton /> : (
          <ProjectDistributionPanel data={projectDistribution} />
        )}

        {/* Top Contributors Leaderboard */}
        {loading ? <LeaderboardSkeleton /> : (
          <LeaderboardPanel data={taskPerUser} />
        )}
      </div>

      {/* ── Admin Scope Notice ── */}
      {!loading && !error && (
        <p className="text-center text-[11px] text-muted-foreground/60 pb-2">
          Data scope: projects where you hold the <strong>admin</strong> role only.
          {' '}Member-only projects are excluded from this view.
        </p>
      )}
    </div>
  );
};

export default GlobalAnalytics;
