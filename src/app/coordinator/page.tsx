'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Circle, Clock, ClipboardCheck, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type CoordinatorProfile = {
  name?: string;
  email?: string | null;
};

type EventRecord = {
  _id: string;
  title?: string;
  type?: string;
  date?: string;
  location?: string;
  leadAssigned?: string;
  guests?: {
    invited?: number;
    rsvp?: number;
  };
};

type TaskRecord = {
  _id: string;
  title?: string;
  status?: string;
  category?: string;
  eventId?: string;
  assignee?: { name?: string } | string;
  due?: {
    date?: string;
    time?: string;
  };
};

function normalizeName(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}

function parseEventDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTaskDueDate(task: TaskRecord) {
  const datePart = task.due?.date?.trim();
  if (!datePart) return null;

  const combined = task.due?.time ? `${datePart} ${task.due.time}` : datePart;
  const parsed = new Date(combined);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(datePart);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDisplayDate(date: Date | null) {
  if (!date) return 'TBD';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(date: Date | null) {
  if (!date) return 'TBD';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function resolveAssigneeName(assignee: TaskRecord['assignee']) {
  if (typeof assignee === 'string') return assignee;
  return assignee?.name || '';
}

export default function CoordinatorDashboard() {
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CoordinatorProfile | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();

        const [profileRes, eventsRes, tasksRes] = await Promise.all([
          fetch('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/events', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/tasks', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          setProfile({
            name: user.displayName || '',
            email: user.email,
          });
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        } else {
          setEvents([]);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to load coordinator dashboard:', error);
        setEvents([]);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [isLoading, user]);

  const coordinatorName = profile?.name || user?.displayName || 'Coordinator';
  const coordinatorEmail = profile?.email || user?.email || '';

  const assignedEvents = useMemo(() => {
    const targetName = normalizeName(coordinatorName);
    if (!targetName) return [];

    return events
      .filter((event) => normalizeName(event.leadAssigned) === targetName)
      .sort((left, right) => {
        const leftDate = parseEventDate(left.date)?.getTime() || Number.MAX_SAFE_INTEGER;
        const rightDate = parseEventDate(right.date)?.getTime() || Number.MAX_SAFE_INTEGER;
        return leftDate - rightDate;
      });
  }, [coordinatorName, events]);

  const assignedEventMap = useMemo(
    () =>
      assignedEvents.reduce<Record<string, EventRecord>>((accumulator, event) => {
        accumulator[event._id] = event;
        return accumulator;
      }, {}),
    [assignedEvents]
  );

  const assignedTasks = useMemo(() => {
    const targetName = normalizeName(coordinatorName);
    if (!targetName) return [];

    return tasks.filter((task) => normalizeName(resolveAssigneeName(task.assignee)) === targetName);
  }, [coordinatorName, tasks]);

  const pendingTasks = useMemo(
    () =>
      assignedTasks.filter((task) => {
        const status = normalizeName(task.status);
        return !['done', 'completed', 'complete'].includes(status);
      }),
    [assignedTasks]
  );

  const completedTasks = useMemo(
    () =>
      assignedTasks.filter((task) => {
        const status = normalizeName(task.status);
        return ['done', 'completed', 'complete'].includes(status);
      }),
    [assignedTasks]
  );

  const pendingTaskBreakdown = useMemo(() => {
    const counts = pendingTasks.reduce<Record<string, number>>((accumulator, task) => {
      const eventName = assignedEventMap[task.eventId || '']?.title || 'Unlinked Event';
      accumulator[eventName] = (accumulator[eventName] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);
  }, [assignedEventMap, pendingTasks]);

  const topPriorityTasks = useMemo(() => {
    return [...assignedTasks]
      .sort((left, right) => {
        const leftCompleted = completedTasks.some((task) => task._id === left._id);
        const rightCompleted = completedTasks.some((task) => task._id === right._id);
        if (leftCompleted !== rightCompleted) return leftCompleted ? 1 : -1;

        const leftDue = parseTaskDueDate(left)?.getTime() || Number.MAX_SAFE_INTEGER;
        const rightDue = parseTaskDueDate(right)?.getTime() || Number.MAX_SAFE_INTEGER;
        return leftDue - rightDue;
      })
      .slice(0, 3);
  }, [assignedTasks, completedTasks]);

  const nextEvent = useMemo(() => {
    const now = new Date().getTime();
    return (
      assignedEvents.find((event) => {
        const eventDate = parseEventDate(event.date);
        return eventDate ? eventDate.getTime() >= now : false;
      }) || assignedEvents[0] || null
    );
  }, [assignedEvents]);

  const nextEventDate = parseEventDate(nextEvent?.date);

  const rsvpSummary = useMemo(() => {
    if (!assignedEvents.length) {
      return { confirmed: 0, eventName: 'No assigned event', fillRate: 0 };
    }

    const targetEvent =
      [...assignedEvents].sort((left, right) => {
        const leftRsvp = left.guests?.rsvp || 0;
        const rightRsvp = right.guests?.rsvp || 0;
        return rightRsvp - leftRsvp;
      })[0] || assignedEvents[0];

    const confirmed = targetEvent.guests?.rsvp || 0;
    const invited = targetEvent.guests?.invited || 0;
    const fillRate = invited > 0 ? Math.min(100, Math.round((confirmed / invited) * 100)) : 0;

    return {
      confirmed,
      eventName: targetEvent.title || 'Assigned Event',
      fillRate,
    };
  }, [assignedEvents]);

  if (loading || isLoading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center py-20">
        <Loader className="animate-spin text-[#d4a017] mr-3" size={32} />
        <p className="text-[#71717a]">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Overview <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Dashboard</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Welcome back, <span className="text-[#d4a017] italic pr-2">{coordinatorName}</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Here's a live summary of your assigned events, active tasks, and RSVP activity from the database.
          </p>
          {coordinatorEmail ? <p className="text-xs text-[#a1a1aa] font-semibold mt-2">{coordinatorEmail}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fff9e6] rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Assigned Events</h3>
              <div className="w-8 h-8 rounded-full bg-[#fff9e6] flex items-center justify-center text-[#d4a017]">
                <Calendar size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{assignedEvents.length}</span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Live
              </span>
            </div>
          </div>
          <p className="text-xs text-[#71717a] mt-6 font-semibold pt-4 border-t border-gray-50 flex justify-between">
            <span>Next event:</span>
            <span className="text-[#1d1d1f]">{formatDisplayDate(nextEventDate)}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Pending Tasks</h3>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ClipboardCheck size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 text-left">
              <span className="text-4xl font-black">{pendingTasks.length}</span>
              <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md uppercase tracking-widest">
                Action Required
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-2.5 pt-4 border-t border-gray-50">
            {pendingTaskBreakdown.length ? (
              pendingTaskBreakdown.map((entry) => (
                <div key={entry.eventName} className="flex justify-between text-xs font-semibold">
                  <span className="text-[#71717a] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    {entry.eventName}
                  </span>
                  <span className="text-[#1d1d1f]">{entry.count} tasks</span>
                </div>
              ))
            ) : (
              <div className="text-xs font-semibold text-[#71717a]">No pending tasks assigned right now.</div>
            )}
          </div>
        </div>

        <div className="bg-[#1d1d1f] text-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-800 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">RSVP Tracking</h3>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{rsvpSummary.confirmed}</span>
              <span className="text-[10px] font-extrabold text-[#d4a017] bg-[#d4a017]/10 border border-[#d4a017]/20 px-2 py-1 rounded-md uppercase tracking-widest">
                Seats Confirmed
              </span>
            </div>
          </div>
          <div className="w-full mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">
              <span>{rsvpSummary.eventName}</span>
              <span className="text-white">{rsvpSummary.fillRate}% Fill Rate</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#d4a017] h-full rounded-full" style={{ width: `${rsvpSummary.fillRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f]">Priority Action Items</h2>
              <p className="text-xs text-[#a1a1aa] mt-1">Live tasks assigned to your coordinator profile</p>
            </div>
            <Link href="/coordinator/tasks" className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017] hover:text-[#b88c14] transition-colors">
              View All Tasks
            </Link>
          </div>

          <div className="p-0">
            {topPriorityTasks.length ? (
              topPriorityTasks.map((task) => {
                const eventName = assignedEventMap[task.eventId || '']?.title || 'Unlinked Event';
                const dueDate = parseTaskDueDate(task);
                const isCompleted = completedTasks.some((entry) => entry._id === task._id);
                const now = new Date();
                const isOverdue = !isCompleted && dueDate ? dueDate.getTime() < now.getTime() : false;
                const isDueToday =
                  !isCompleted &&
                  dueDate &&
                  dueDate.toDateString() === now.toDateString() &&
                  !isOverdue;

                return (
                  <div
                    key={task._id}
                    className={`p-4 px-6 flex items-center gap-4 hover:bg-[#fafafa] transition-colors border-b border-gray-50 group cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <div className={`shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-gray-300 group-hover:text-emerald-500 transition-colors'}`}>
                      {isCompleted ? <CheckCircle2 size={20} strokeWidth={2} /> : <Circle size={20} strokeWidth={2} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isCompleted ? 'text-[#a1a1aa] line-through decoration-gray-300' : 'text-[#1d1d1f]'}`}>
                        {task.title || 'Untitled Task'}
                      </p>
                      <p className="text-[11px] font-bold text-[#a1a1aa] mt-0.5">
                        {eventName} • {task.category || 'General'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-[#a1a1aa]">Done</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md ${
                            isOverdue
                              ? 'text-red-500 bg-red-50'
                              : isDueToday
                                ? 'text-orange-500 bg-orange-50'
                                : 'text-blue-600 bg-blue-50'
                          }`}
                        >
                          <Clock size={10} />
                          {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : task.status || 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-sm font-medium text-[#71717a]">No task records are currently assigned to this coordinator.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f]">Up Next</h2>
            <p className="text-xs text-[#a1a1aa] mt-1">Your nearest assigned event</p>
          </div>

          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#fff9e6] flex items-center justify-center text-[#d4a017] mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-black text-[#1d1d1f]">{nextEvent?.title || 'No assigned event yet'}</h3>
            <p className="text-sm font-bold text-[#d4a017] mt-1">{nextEvent?.location || 'Location TBD'}</p>
            <p className="text-xs font-medium text-[#71717a] mt-3 max-w-[220px] leading-relaxed">
              {nextEvent?.type ? `${nextEvent.type} event currently assigned to your coordinator account.` : 'As soon as an event is assigned to you, it will appear here.'}
            </p>

            <div className="w-full mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center text-left">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Date</p>
                <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">{formatDisplayDate(nextEventDate)}</p>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="text-right">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Time</p>
                <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">{formatDisplayTime(nextEventDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}