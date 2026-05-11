'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, CheckCircle2, Circle, Clock, ClipboardCheck,
  ArrowRight, AlertTriangle, Zap, TrendingUp, MapPin, Tag,
  ChevronRight, Layers, Activity
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

function getPriorityConfig(priority: string) {
  const p = (priority || '').toUpperCase();
  if (p === 'HIGH') return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500', label: 'High' };
  if (p === 'MEDIUM') return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-400', label: 'Medium' };
  return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-400', label: 'Low' };
}

function getStatusConfig(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'DONE') return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Done' };
  if (s === 'IN PROGRESS') return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'In Progress' };
  if (s === 'TO DO') return { color: 'text-gray-500', bg: 'bg-gray-100', label: 'To Do' };
  return { color: 'text-gray-500', bg: 'bg-gray-100', label: status || '—' };
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

export default function CoordinatorDashboard() {
  const { role, user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const userName = user.displayName;
        const res = await fetch(`/api/tasks${userName ? `?assignee=${encodeURIComponent(userName)}` : ''}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
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
    if (!user || toggling) return;
    setToggling(taskId);
    try {
      const newStatus = currentStatus === 'DONE' ? 'IN PROGRESS' : 'DONE';
      const idToken = await user.getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ taskObjectId: taskId, status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasks = tasks.filter(t => t.status === 'DONE');
  const highPriorityTasks = pendingTasks.filter(t => (t.priority || '').toUpperCase() === 'HIGH');

  // Group tasks by event
  const tasksByEvent = tasks.reduce((acc: Record<string, any>, task) => {
    const key = task.eventId || 'unassigned';
    if (!acc[key]) {
      acc[key] = { eventTitle: task.eventTitle || 'Unknown Event', eventType: task.eventType, tasks: [] };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {});

  const eventGroups = Object.entries(tasksByEvent).map(([id, group]: [string, any]) => ({
    id,
    ...group,
    pending: group.tasks.filter((t: any) => t.status !== 'DONE').length,
    total: group.tasks.length,
  }));

  const completionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative bg-[#f8f8f8] min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8 pt-2">
        <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-2 flex items-center gap-2">
          Overview <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Dashboard</span>
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#1d1d1f] tracking-tight leading-none">
              Welcome back,{' '}
              <span className="text-[#d4a017] italic">
                {user?.displayName || (role === 'staff' ? 'Staff' : 'Coordinator')}
              </span>
            </h1>
            <p className="text-[#71717a] text-sm mt-2 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link
            href="/coordinator/tasks"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#d4a017] border border-[#d4a017]/30 bg-[#d4a017]/5 hover:bg-[#d4a017]/10 px-4 py-2.5 rounded-xl transition-colors"
          >
            <ClipboardCheck size={14} /> View All Tasks
          </Link>
        </div>
      </div>

      {/* ── Stat Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Assigned */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff9e6] flex items-center justify-center text-[#d4a017]">
              <Layers size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1d1d1f]">{loading ? '—' : tasks.length}</span>
            <span className="text-xs font-semibold text-[#71717a]">assigned</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <Clock size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-orange-500">{loading ? '—' : pendingTasks.length}</span>
            <span className="text-xs font-semibold text-[#71717a]">to complete</span>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">High Priority</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-500">{loading ? '—' : highPriorityTasks.length}</span>
            <span className="text-xs font-semibold text-[#71717a]">urgent</span>
          </div>
        </div>

        {/* Completion */}
        <div className="bg-[#1d1d1f] rounded-2xl p-5 border border-gray-800 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Completion</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#d4a017]">
              <TrendingUp size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{loading ? '—' : `${completionPct}%`}</span>
            <span className="text-xs font-semibold text-gray-400">{completedTasks.length}/{tasks.length} done</span>
          </div>
          {!loading && tasks.length > 0 && (
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4a017] rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Priority Task Feed ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* High Priority Section */}
          {!loading && highPriorityTasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-50 flex items-center justify-between bg-red-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={12} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-red-600">Needs Attention</h2>
                    <p className="text-[10px] text-red-400 font-medium">{highPriorityTasks.length} high-priority task{highPriorityTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-red-100 text-red-600 px-2.5 py-1 rounded-lg">URGENT</span>
              </div>
              <div className="divide-y divide-gray-50">
                {highPriorityTasks.map(task => (
                  <TaskRow key={task._id} task={task} onToggle={toggleTask} toggling={toggling} />
                ))}
              </div>
            </div>
          )}

          {/* All Pending Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#fff9e6] flex items-center justify-center">
                  <Activity size={12} className="text-[#d4a017]" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-[#1d1d1f]">Active Tasks</h2>
                  <p className="text-[10px] text-[#a1a1aa] font-medium">{pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} remaining</p>
                </div>
              </div>
              <Link href="/coordinator/tasks" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017] hover:text-[#b88c14] transition-colors flex items-center gap-1">
                All <ChevronRight size={12} />
              </Link>
            </div>

            {loading && (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 items-center">
                    <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && pendingTasks.length === 0 && (
              <div className="p-10 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1d1d1f]">All caught up!</p>
                <p className="text-xs text-[#a1a1aa] mt-1">No pending tasks assigned to you.</p>
              </div>
            )}

            {!loading && pendingTasks.filter(t => (t.priority || '').toUpperCase() !== 'HIGH').slice(0, 8).map(task => (
              <TaskRow key={task._id} task={task} onToggle={toggleTask} toggling={toggling} />
            ))}

            {/* Completed */}
            {!loading && completedTasks.length > 0 && (
              <>
                <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Completed — {completedTasks.length}</span>
                </div>
                {completedTasks.slice(0, 3).map(task => (
                  <div key={task._id} className="px-6 py-3.5 flex items-center gap-4 border-b border-gray-50 opacity-50">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#a1a1aa] line-through truncate">{task.title}</p>
                      {task.eventTitle && (
                        <p className="text-[10px] text-[#a1a1aa] mt-0.5 truncate flex items-center gap-1">
                          <Calendar size={9} /> {task.eventTitle}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">Done</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-6">

          {/* Progress Ring Card */}
          <div className="bg-[#1d1d1f] rounded-2xl p-6 border border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">My Progress</h3>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="40" cy="40" r="32"
                    stroke="#d4a017"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionPct / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-white">{completionPct}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-black text-white">{completedTasks.length}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Tasks done</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <p className="text-[11px] text-gray-300">{pendingTasks.length} remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Events Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1d1d1f] flex items-center gap-2">
                <Calendar size={13} className="text-[#d4a017]" /> Events Breakdown
              </h3>
              <p className="text-[10px] text-[#a1a1aa] mt-0.5 font-medium">Tasks grouped by event</p>
            </div>

            {loading ? (
              <div className="p-5 space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                    <div className="h-1.5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : eventGroups.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-[#a1a1aa]">No events found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {eventGroups.map(group => {
                  const pct = group.total > 0 ? Math.round(((group.total - group.pending) / group.total) * 100) : 0;
                  return (
                    <div key={group.id} className="px-6 py-4 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1d1d1f] truncate">{group.eventTitle}</p>
                          {group.eventType && (
                            <p className="text-[10px] text-[#a1a1aa] font-semibold mt-0.5 flex items-center gap-1">
                              <Tag size={9} /> {group.eventType}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-[#1d1d1f]">{group.pending}</p>
                          <p className="text-[9px] text-[#a1a1aa] font-semibold uppercase tracking-widest">pending</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#d4a017] rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#a1a1aa] shrink-0">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-[#a1a1aa] mt-1.5 font-medium">{group.total - group.pending} of {group.total} tasks done</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Info Banner */}
          <div className="bg-gradient-to-br from-[#d4a017]/10 to-[#d4a017]/5 rounded-2xl p-5 border border-[#d4a017]/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#d4a017]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4a017]">Reminder</h3>
            </div>
            <p className="text-xs font-medium text-[#1d1d1f] leading-relaxed">
              Tasks are assigned by Admin. Mark them complete as you finish each one to keep your progress updated.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, toggling }: { task: any; onToggle: (id: string, status: string) => void; toggling: string | null }) {
  const isDone = task.status === 'DONE';
  const priority = getPriorityConfig(task.priority);
  const isToggling = toggling === task._id;

  return (
    <div className={`px-6 py-4 flex items-start gap-4 border-b border-gray-50 hover:bg-[#fafafa] transition-colors group ${isDone ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onToggle(task._id, task.status)}
        disabled={isToggling}
        className="shrink-0 mt-0.5 transition-all duration-200 hover:scale-110 disabled:opacity-50"
      >
        {isDone
          ? <CheckCircle2 size={20} className="text-emerald-500" />
          : <Circle size={20} className="text-gray-300 group-hover:text-emerald-400 transition-colors" strokeWidth={2} />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isDone ? 'line-through text-[#a1a1aa]' : 'text-[#1d1d1f]'} leading-snug`}>
          {task.title}
        </p>

        {/* Event info row */}
        {(task.eventTitle || task.eventType || task.eventLocation) && (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {task.eventTitle && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#d4a017]">
                <Calendar size={9} /> {task.eventTitle}
              </span>
            )}
            {task.eventType && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#71717a]">
                <Tag size={9} /> {task.eventType}
              </span>
            )}
            {task.eventLocation && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#71717a]">
                <MapPin size={9} /> {task.eventLocation}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {task.description && (
          <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed line-clamp-2">{task.description}</p>
        )}

        {/* Due date */}
        {task.due?.date && (
          <p className="text-[10px] text-[#a1a1aa] mt-1.5 flex items-center gap-1 font-semibold">
            <Clock size={9} /> Due {formatDate(task.due.date)}{task.due.time ? ` at ${task.due.time}` : ''}
          </p>
        )}
      </div>

      {/* Priority badge */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest ${priority.color} ${priority.bg} border ${priority.border} px-2 py-0.5 rounded-md`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        {task.status && !isDone && (
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${getStatusConfig(task.status).color} ${getStatusConfig(task.status).bg}`}>
            {getStatusConfig(task.status).label}
          </span>
        )}
      </div>
    </div>
  );
}