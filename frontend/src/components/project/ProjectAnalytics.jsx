import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  PieChart, 
  Users,
  Activity,
  UserCheck
} from 'lucide-react';
import API from '../../api/axios';

// =============================================================================
// Helper Functions
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
// Skeleton Loader Component
// =============================================================================

const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-28 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Skeleton Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team Performance Skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 h-[320px] flex flex-col justify-between">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-4 w-28 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-8 bg-muted rounded" />
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Priority Donut Skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 h-[320px] flex flex-col justify-between">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-full">
            <div className="h-32 w-32 rounded-full border-[10px] border-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Donut Chart Component
// =============================================================================

const DonutChart = ({ low = 0, medium = 0, high = 0 }) => {
  const total = low + medium + high;
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.195

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24 text-muted-foreground/30">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
          />
        </svg>
        <p className="mt-4 text-xs text-muted-foreground">No tasks assigned with priority levels.</p>
      </div>
    );
  }

  const segments = [
    { label: 'High', count: high, strokeColor: 'stroke-rose-500', hoverColor: 'hover:stroke-rose-400', bgClass: 'bg-rose-500' },
    { label: 'Medium', count: medium, strokeColor: 'stroke-amber-500', hoverColor: 'hover:stroke-amber-400', bgClass: 'bg-amber-500' },
    { label: 'Low', count: low, strokeColor: 'stroke-emerald-500', hoverColor: 'hover:stroke-emerald-400', bgClass: 'bg-emerald-500' },
  ].filter(s => s.count > 0);

  let currentRotation = -90;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:justify-around gap-6 h-full py-4">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -scale-x-100">
          {segments.map((segment) => {
            const pct = (segment.count / total) * 100;
            const strokeOffset = circumference - (pct / 100) * circumference;
            const rotation = currentRotation;
            currentRotation += (pct / 100) * 360;

            return (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeWidth="10"
                className={`${segment.strokeColor} ${segment.hoverColor} transition-all duration-300 ease-out cursor-pointer`}
                transform={`rotate(${rotation} 50 50)`}
                style={{ strokeLinecap: 'round' }}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tasks</span>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3">
        {segments.map((segment) => {
          const pct = ((segment.count / total) * 100).toFixed(0);
          return (
            <div key={segment.label} className="flex items-center gap-3 text-sm">
              <span className={`h-3 w-3 rounded-full shrink-0 ${segment.bgClass}`} />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground leading-none">
                  {segment.label} ({segment.count})
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {pct}% of priority layout
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// ProjectAnalytics Component
// =============================================================================

const ProjectAnalytics = () => {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const fetchAnalyticsAndTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch aggregation metrics and raw tasks in parallel
        const [analyticsRes, tasksRes] = await Promise.all([
          API.get(`/projects/${projectId}/analytics`),
          API.get(`/projects/${projectId}/tasks`)
        ]);

        setAnalytics(analyticsRes.data.data);

        // Compute overdue tasks: status !== Done AND has dueDate in the past
        const now = new Date();
        const overdue = tasksRes.data.data.filter((task) => {
          if (task.status === 'Done') return false;
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < now;
        });

        setOverdueCount(overdue.length);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Failed to fetch project analytics.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalyticsAndTasks();
    }
  }, [projectId]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
        <AlertCircle size={16} className="shrink-0" />
        <div>
          <p className="font-semibold">Unable to compile analytics</p>
          <p className="text-xs mt-0.5 opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const { projectSummary, taskPerUser, priorityDistribution } = analytics;

  // Convert priorityDistribution array to an accessible object
  const priorityMap = priorityDistribution.reduce((acc, curr) => {
    acc[curr.priority] = curr.count;
    return acc;
  }, { Low: 0, Medium: 0, High: 0 });

  // Calculate pending tasks (total - done)
  const pendingTasks = projectSummary.totalTasks - projectSummary.done;

  return (
    <div className="space-y-6">
      {/* Section 1: Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tasks Card */}
        <div className="rounded-xl border border-border bg-card p-5 hover:border-muted-foreground/20 transition-all duration-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Activity size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {projectSummary.totalTasks}
            </span>
            <span className="text-xs text-muted-foreground">active board items</span>
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div className="rounded-xl border border-border bg-card p-5 hover:border-muted-foreground/20 transition-all duration-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {projectSummary.done}
            </span>
            <span className="text-xs text-emerald-500 font-medium">
              {projectSummary.totalTasks > 0 
                ? `${((projectSummary.done / projectSummary.totalTasks) * 100).toFixed(0)}% completion`
                : '0% completion'
              }
            </span>
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="rounded-xl border border-border bg-card p-5 hover:border-muted-foreground/20 transition-all duration-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {pendingTasks}
            </span>
            <span className="text-xs text-muted-foreground">awaiting final completion</span>
          </div>
        </div>

        {/* Overdue Tasks Card */}
        <div className={`rounded-xl border p-5 transition-all duration-200 shadow-sm flex flex-col justify-between ${
          overdueCount > 0 
            ? 'border-rose-500/50 bg-rose-500/5 hover:border-rose-500' 
            : 'border-border bg-card hover:border-muted-foreground/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Tasks
            </span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              overdueCount > 0 ? 'bg-rose-500/25 text-rose-500' : 'bg-secondary text-foreground'
            }`}>
              <AlertCircle size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${overdueCount > 0 ? 'text-rose-500' : 'text-foreground'}`}>
              {overdueCount}
            </span>
            <span className="text-xs text-muted-foreground">missed target deadlines</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 2: Team Performance Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Team Performance</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Task completion load distributed across assigned project members.
            </p>
          </div>

          <div className="mt-6 space-y-5 flex-grow overflow-y-auto max-h-[200px] scrollbar-thin pr-1">
            {taskPerUser.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center text-muted-foreground">
                <Users size={20} className="mb-2 opacity-40" />
                <p className="text-xs">No users have been assigned tasks in this project yet.</p>
              </div>
            ) : (
              taskPerUser.map((userItem) => {
                const completedCount = userItem.statuses 
                  ? userItem.statuses.filter((s) => s === 'Done').length 
                  : 0;
                
                // Calculate percentage relative to total tasks assigned to this user
                const totalAssigned = userItem.taskCount;
                const percentage = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;
                
                return (
                  <div key={userItem.userId} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        {/* User Avatar Badge */}
                        <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(userItem.name)}`}>
                          {getInitials(userItem.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground leading-tight">
                            {userItem.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-none">
                            {userItem.email}
                          </span>
                        </div>
                      </div>
                      <span className="font-medium text-muted-foreground">
                        <strong className="text-foreground">{completedCount}</strong> / {totalAssigned} completed
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          percentage === 100 
                            ? 'bg-emerald-500' 
                            : percentage > 50 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 3: Priority Distribution Donut Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChart size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Priority Distribution</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Proportional breakdown of tasks by Low, Medium, and High priority labels.
            </p>
          </div>

          <div className="mt-4 flex-grow flex items-center justify-center">
            <DonutChart 
              low={priorityMap.Low} 
              medium={priorityMap.Medium} 
              high={priorityMap.High} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
