import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, Circle, Rocket } from 'lucide-react';

const WorkspaceGuide = () => {
  const projects = useSelector((state) => state.projects.projects || []);
  const activityFeed = useSelector((state) => state.projects.activityFeed || []);
  
  // Conditionally checking application state to resolve onboarding checklist
  const hasProject = projects.length > 0;
  const hasMember = projects.some((p) => (p.memberCount || 1) > 1);
  const hasDoneTask = projects.some((p) => (p.doneTasks || p.completedTasks) > 0);
  const hasComment = activityFeed.some((log) => log.type === 'comment');

  const steps = useMemo(() => [
    { id: 1, label: 'Launch a new Team Project Space', completed: hasProject },
    { id: 2, label: 'Invite your first Workspace Member', completed: hasMember },
    { id: 3, label: "Transition a Kanban Card status to 'Done'", completed: hasDoneTask },
    { id: 4, label: 'Post an instant project update comment', completed: hasComment },
  ], [hasProject, hasMember, hasDoneTask, hasComment]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-6 shadow-lg">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-300 tracking-wider">GETTING STARTED</h3>
        </div>
        <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
          {progressPercent}%
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-3 pt-2">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`flex items-start gap-3 transition-all duration-500 ${
                step.completed ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0 transition-transform duration-500 hover:scale-110">
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <span className={`text-sm font-medium transition-colors duration-500 ${
                step.completed ? 'text-gray-500 line-through' : 'text-gray-300'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceGuide;
