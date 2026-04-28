'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Circle, CheckCircle2, Clock, CalendarDays, Filter, UserRound, ArrowDown, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CoordinatorTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [completeCount, setCompleteCount] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const userName = user.displayName;
        
        // Fetch Tasks
        const res = await fetch(`/api/tasks${userName ? `?assignee=${encodeURIComponent(userName)}` : ''}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          setCompleteCount(data.filter((t: any) => t.status === "DONE").length);
        }

        // Fetch Activities
        const actRes = await fetch('/api/activities', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData);
        }
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
      const newStatus = currentStatus === "DONE" ? "TO DO" : "DONE";
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
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        setCompleteCount(prev => currentStatus === "DONE" ? prev - 1 : prev + 1);
        
        // Refresh activities
        const actRes = await fetch('/api/activities', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData);
        }
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

  const overdueTasks = tasks.filter(t => t.status !== "DONE" && t.priority === "HIGH");
  const todayTasks = tasks.filter(t => t.status !== "DONE" && t.priority !== "HIGH");
  
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
          
          {/* Overdue/Urgent Tasks Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
               <h2 className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                  <ArrowDown size={16} /> Needs Attention
               </h2>
               <span className="text-[10px] font-extrabold uppercase tracking-widest bg-red-50 text-red-500 px-2 py-1 rounded-md">{loading ? "..." : overdueTasks.length} Overdue</span>
            </div>
            
            <div className="divide-y divide-gray-50">
               {loading ? <div className="p-6 text-sm text-gray-500">Loading...</div> : 
                 overdueTasks.length === 0 ? <div className="p-6 text-sm text-gray-500">No tasks need attention right now.</div> :
                 overdueTasks.map(task => (
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
                          toggleTask(task._id, task.status);
                        }}
                      >
                        <Circle size={22} strokeWidth={2} className="group-hover/btn:hidden" />
                        <CheckCircle2 size={22} strokeWidth={2} className="hidden group-hover/btn:block text-emerald-500" />
                      </button>
                      <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1d1d1f]">{task.title}</p>
                        <p className="text-xs font-medium text-[#71717a] mt-1 max-w-lg leading-relaxed">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                            <Clock size={12} /> Priority: {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 self-center md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
                       <ArrowRight size={18} className="text-[#a1a1aa]" />
                    </div>
                  </div>
                 ))
               }
            </div>
          </div>

           {/* Today's Tasks Container */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
               <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f] flex items-center gap-2">
                  <Clock size={16} className="text-[#d4a017]" /> Due Today
               </h2>
               <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#fff9e6] text-[#d4a017] px-2 py-1 rounded-md">{loading ? "..." : todayTasks.length} Pending</span>
            </div>
            
            <div className="divide-y divide-gray-50">
               {loading ? <div className="p-6 text-sm text-gray-500">Loading...</div> : 
                 todayTasks.length === 0 ? <div className="p-6 text-sm text-gray-500">No active tasks today.</div> :
                 todayTasks.map(task => (
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
                          toggleTask(task._id, task.status);
                        }}
                      >
                        <Circle size={22} strokeWidth={2} className="group-hover/btn:hidden" />
                        <CheckCircle2 size={22} strokeWidth={2} className="hidden group-hover/btn:block text-emerald-500" />
                      </button>
                      <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1d1d1f]">{task.title}</p>
                        <p className="text-xs font-medium text-[#71717a] mt-1 max-w-lg leading-relaxed">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md">
                            <Clock size={12} /> Status: {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 self-center md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
                       <ArrowRight size={18} className="text-[#a1a1aa]" />
                    </div>
                  </div>
                 ))
               }
            </div>
          </div>
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
             <h3 className="text-sm font-black text-[#1d1d1f] mb-6 border-b border-gray-50 pb-4">Recent Activity</h3>
             <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-[10px] font-medium text-gray-400 italic py-2">No recent activity recorded.</p>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="flex gap-4">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.action === 'TASK_ASSIGNED' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {activity.action === 'TASK_ASSIGNED' ? <UserRound size={14} /> : <CheckCircle2 size={14} />}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-[#1d1d1f]">
                            {activity.actor === 'You' ? <span className="text-[#71717a]">You</span> : <span className="text-[#d4a017]">Admin</span>}
                            {' '}{activity.action === 'TASK_ASSIGNED' ? 'assigned a new task' : `marked a task as ${activity.details?.newStatus || 'completed'}`}
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