'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Circle, CheckCircle2, Clock, UserRound, Lock, ChevronDown, ChevronUp, AlertTriangle, Flame, TimerReset, CalendarClock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type TaskRecord = {
  _id: string;
  eventId?: string;
  eventTitle?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: {
    date?: string;
    time?: string;
  };
};

type ActivityRecord = {
  id: string;
  action?: string;
  actor?: string;
  time: string;
  details?: {
    taskTitle?: string;
    newStatus?: string;
  };
};

const normalizeTaskStatus = (value?: string) => {
  const normalized = (value || '').toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'DONE' || normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'TODO') return 'TO DO';
  if (normalized === 'INPROGRESS') return 'IN PROGRESS';
  return normalized;
};

const normalizeTaskPriority = (value?: string) => {
  const normalized = (value || '').toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'CRITICAL') return 'CRITICAL';
  if (normalized === 'HIGH') return 'HIGH';
  if (normalized === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

const formatPriorityLabel = (value?: string) => {
  const normalized = normalizeTaskPriority(value);
  if (normalized === 'CRITICAL') return 'Critical';
  if (normalized === 'HIGH') return 'High';
  if (normalized === 'MEDIUM') return 'Medium';
  return 'Low';
};

const formatDueLabel = (task: TaskRecord) => {
  if (!task.due?.date) return 'No due date';
  const parsed = new Date(`${task.due.date}T${task.due.time || '23:59'}:00`);
  if (Number.isNaN(parsed.getTime())) return task.due.date;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const priorityMeta = {
  CRITICAL: {
    title: 'Critical',
    icon: AlertTriangle,
    headerText: 'text-red-600',
    headerBg: 'bg-red-50',
    badgeText: 'text-red-600',
    badgeBg: 'bg-red-50 border-red-100',
    empty: 'No critical tasks right now.',
  },
  HIGH: {
    title: 'High',
    icon: Flame,
    headerText: 'text-orange-600',
    headerBg: 'bg-orange-50',
    badgeText: 'text-orange-600',
    badgeBg: 'bg-orange-50 border-orange-100',
    empty: 'No high-priority tasks right now.',
  },
  MEDIUM: {
    title: 'Medium',
    icon: TimerReset,
    headerText: 'text-amber-700',
    headerBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBg: 'bg-amber-50 border-amber-100',
    empty: 'No medium-priority tasks at the moment.',
  },
  LOW: {
    title: 'Low',
    icon: CalendarClock,
    headerText: 'text-sky-700',
    headerBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBg: 'bg-sky-50 border-sky-100',
    empty: 'No low-priority tasks queued up.',
  },
} as const;

export default function CoordinatorTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const refreshPageData = async (idToken: string, userName?: string | null) => {
    await fetch(`/api/tasks/priority-update${userName ? `?assignee=${encodeURIComponent(userName)}` : ''}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const [tasksRes, actRes] = await Promise.all([
      fetch(`/api/tasks${userName ? `?assignee=${encodeURIComponent(userName)}` : ''}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      }),
      fetch('/api/activities', {
        headers: { Authorization: `Bearer ${idToken}` },
      }),
    ]);

    if (tasksRes.ok) {
      const taskData = await tasksRes.json();
      setTasks(Array.isArray(taskData) ? taskData : []);
    } else {
      setTasks([]);
    }

    if (actRes.ok) {
      const actData = await actRes.json();
      setActivities(Array.isArray(actData) ? actData : []);
    } else {
      setActivities([]);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const userName = user.displayName;
        await refreshPageData(idToken, userName);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    if (!user) return;
    try {
      const normalizedStatus = normalizeTaskStatus(currentStatus);
      const newStatus = normalizedStatus === 'COMPLETED' ? 'TO DO' : 'COMPLETED';
      const idToken = await user.getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ taskObjectId: taskId, status: newStatus })
      });
      if (res.ok) {
        await refreshPageData(idToken, user.displayName);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString();
  };

  const completeCount = useMemo(
    () => tasks.filter((task) => normalizeTaskStatus(task.status) === 'COMPLETED').length,
    [tasks]
  );

  const pendingTasks = useMemo(
    () => tasks.filter((task) => normalizeTaskStatus(task.status) !== 'COMPLETED'),
    [tasks]
  );

  const tasksByPriority = useMemo(
    () => ({
      CRITICAL: pendingTasks.filter((task) => normalizeTaskPriority(task.priority) === 'CRITICAL'),
      HIGH: pendingTasks.filter((task) => normalizeTaskPriority(task.priority) === 'HIGH'),
      MEDIUM: pendingTasks.filter((task) => normalizeTaskPriority(task.priority) === 'MEDIUM'),
      LOW: pendingTasks.filter((task) => normalizeTaskPriority(task.priority) === 'LOW'),
    }),
    [pendingTasks]
  );

  const visibleActivities = showAllActivities ? activities : activities.slice(0, 5);
  const hiddenActivityCount = Math.max(activities.length - 5, 0);
  
  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Tasks</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Assigned <span className="text-[#d4a017] italic pr-2">Tasks</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Manage your daily action items, update completion statuses, and track your responsibilities. New tasks are assigned by the Admin.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Task Lists */}
        <div className="lg:w-2/3 space-y-6">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priorityKey) => {
            const meta = priorityMeta[priorityKey];
            const sectionTasks = tasksByPriority[priorityKey];
            const Icon = meta.icon;

            return (
              <div key={priorityKey} className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${meta.headerText}`}>
                    <Icon size={16} /> {meta.title}
                  </h2>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md border ${meta.badgeText} ${meta.badgeBg}`}>
                    {loading ? '...' : sectionTasks.length} Tasks
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {loading ? (
                    <div className="p-6 text-sm text-gray-500">Loading...</div>
                  ) : sectionTasks.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">{meta.empty}</div>
                  ) : (
                    sectionTasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-5 px-6 flex items-start justify-between gap-4 hover:bg-[#fafafa] transition-colors group cursor-pointer"
                        onClick={() => router.push(`/coordinator/events/${task.eventId}?tab=tasks`)}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            className="text-gray-300 hover:text-emerald-500 transition-colors shrink-0 mt-0.5 p-2 -m-2 group/btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task._id, task.status || '');
                            }}
                          >
                            <Circle size={22} strokeWidth={2} className="group-hover/btn:hidden" />
                            <CheckCircle2 size={22} strokeWidth={2} className="hidden group-hover/btn:block text-emerald-500" />
                          </button>
                          <div className="flex-1">
                            <p className="text-[15px] font-bold text-[#1d1d1f]">{task.title || 'Untitled Task'}</p>
                            {task.description && (
                              <p className="text-xs font-medium text-[#71717a] mt-1 max-w-lg leading-relaxed">{task.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${meta.badgeText} ${meta.badgeBg}`}>
                                <Clock size={12} /> {formatPriorityLabel(task.priority)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717a] bg-[#fafafa] border border-gray-100 px-2 py-1 rounded-md">
                                Due {formatDueLabel(task)}
                              </span>
                              {task.eventTitle && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1d1d1f] bg-white border border-gray-100 px-2 py-1 rounded-md">
                                  {task.eventTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center shrink-0 self-center md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
                          <ArrowRight size={18} className="text-[#a1a1aa]" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Status & Filters */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-6">
             <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                <h3 className="text-sm font-black text-[#1d1d1f]">My Progress</h3>
             </div>

             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Completed</span>
                <span className="text-xs font-black text-emerald-600">{completeCount} / {tasks.length} Tasks</span>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${tasks.length > 0 ? (completeCount / tasks.length) * 100 : 0}%` }}
                ></div>
             </div>

             <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100 flex gap-3 text-left items-start mt-4">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={12} className="text-[#a1a1aa]" />
                </div>
                <div>
                   <p className="text-xs font-bold text-[#1d1d1f]">Locked Configuration</p>
                   <p className="text-[10px] font-medium text-[#71717a] mt-1 leading-relaxed">
                     You are viewing assigned tasks. Task creation and delegation are exclusively managed by the Admin.
                   </p>
                </div>
             </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
             <div className="mb-6 border-b border-gray-50 pb-4 flex items-center justify-between gap-3">
               <h3 className="text-sm font-black text-[#1d1d1f]">Recent Activity</h3>
               {hiddenActivityCount > 0 && (
                 <button
                   type="button"
                   onClick={() => setShowAllActivities((current) => !current)}
                   className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors"
                 >
                   {showAllActivities ? 'Collapse' : `View ${hiddenActivityCount} More`}
                   {showAllActivities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 </button>
               )}
             </div>
             <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-[10px] font-medium text-gray-400 italic py-2">No recent activity recorded.</p>
                ) : (
                  visibleActivities.map(activity => (
                    <div key={activity.id} className="flex gap-4">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.action === 'TASK_ASSIGNED' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {activity.action === 'TASK_ASSIGNED' ? <UserRound size={14} /> : <CheckCircle2 size={14} />}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-[#1d1d1f]">
                            {activity.actor === 'You' ? <span className="text-[#71717a]">You</span> : <span className="text-[#d4a017]">Admin</span>}
                            {' '}{activity.action === 'TASK_ASSIGNED' ? 'assigned a new task' : `marked a task as ${normalizeTaskStatus(activity.details?.newStatus || 'COMPLETED').toLowerCase()}`}
                          </p>
                          <p className="text-[10px] font-medium text-[#1d1d1f]/60 truncate max-w-[180px] mt-0.5">{activity.details?.taskTitle}</p>
                          <p className="text-[10px] font-medium text-[#a1a1aa] mt-1">{getTimeAgo(activity.time)}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
