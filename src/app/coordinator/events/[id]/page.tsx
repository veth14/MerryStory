'use client';

import React, { useState, use, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type EventRecord = {
  _id: string;
  title?: string;
  type?: string;
  date?: string;
  location?: string;
  status?: string;
  initialAlert?: string;
  guests?: {
    invited?: number;
    rsvp?: number;
  };
};

type UserRecord = {
  uid: string;
  name: string;
  role?: string;
  appRole: 'admin' | 'coordinator' | 'staff';
  avatarUrl?: string | null;
  email?: string | null;
};

type TaskAssignee = {
  name?: string;
};

type TaskRecord = {
  _id: string;
  eventId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: {
    date?: string;
    time?: string;
  };
  assignee?: TaskAssignee;
  assignees?: TaskAssignee[];
};

const formatFullDate = (dateValue?: string) => {
  if (!dateValue) return 'TBD';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateValue?: string) => {
  if (!dateValue) return 'TBD';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'TBD';
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatDueDate = (dateValue?: string) => {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const normalizeTaskStatus = (value?: string) => {
  const normalized = (value || '').toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'DONE' || normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'TODO') return 'TO DO';
  if (normalized === 'INPROGRESS') return 'IN PROGRESS';
  return normalized;
};

const getDisplayStatusLabel = (value?: string) => {
  const normalized = normalizeTaskStatus(value);
  if (normalized === 'COMPLETED') return 'Completed';
  if (normalized === 'IN PROGRESS') return 'In Progress';
  if (normalized === 'TO DO') return 'To Do';
  return value?.trim() || 'Active';
};

const normalizeAssigneeNames = (task: TaskRecord) => {
  const names = (task.assignees || [])
    .map((assignee) => assignee?.name?.trim() || '')
    .filter(Boolean);

  if (names.length > 0) {
    return Array.from(new Set(names));
  }

  const fallback = task.assignee?.name?.trim();
  return fallback ? [fallback] : [];
};

const getTaskBadge = (task: TaskRecord) => {
  const priority = (task.priority || '').toUpperCase();
  const status = normalizeTaskStatus(task.status);

  if (status === 'COMPLETED') {
    return {
      label: 'Completed',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (priority === 'HIGH') {
    return {
      label: 'High Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-[#d4a017] bg-[#fff9e6] px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  const dueDate = task.due?.date ? new Date(`${task.due.date}T${task.due.time || '00:00'}:00`) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
    return {
      label: 'Overdue',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  return null;
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || '?';
};

const roleLabelMap: Record<UserRecord['appRole'], string> = {
  admin: 'Administrator',
  coordinator: 'Coordinator',
  staff: 'Staff',
};

const roleBadgeMap: Record<UserRecord['appRole'], string> = {
  admin: 'bg-[#1d1d1f] text-white',
  coordinator: 'bg-[#fff9e6] text-[#d4a017]',
  staff: 'bg-[#f5f5f5] text-[#71717a]',
};

export default function CoordinatorEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8">Loading event details...</div>}>
      <CoordinatorEventDetailsContent params={params} />
    </Suspense>
  );
}

function CoordinatorEventDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const initialTab = (searchParams.get('tab') as 'overview' | 'tasks' | 'rsvp') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'rsvp'>(initialTab);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [directory, setDirectory] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<TaskRecord | null>(null);
  const { id } = use(params);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'tasks', 'rsvp'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'tasks' | 'rsvp');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!user || !id) return;

      try {
        const idToken = await user.getIdToken();
        const userName = user.displayName;

        const [eventRes, tasksRes, staffRes] = await Promise.all([
          fetch(`/api/events/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/tasks?eventId=${encodeURIComponent(id)}${userName ? `&assignee=${encodeURIComponent(userName)}` : ''}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/staff', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        const [eventData, tasksData, staffData] = await Promise.all([
          eventRes.ok ? eventRes.json() : null,
          tasksRes.ok ? tasksRes.json() : [],
          staffRes.ok ? staffRes.json() : { users: [] },
        ]);

        setEvent(eventData);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setDirectory(Array.isArray(staffData?.users) ? staffData.users : []);
      } catch (error) {
        console.error('Failed to fetch coordinator event details:', error);
        setEvent(null);
        setTasks([]);
        setDirectory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, user]);

  const handleTabChange = (tab: 'overview' | 'tasks' | 'rsvp') => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const userLookup = useMemo(() => {
    const map = new Map<string, UserRecord>();
    directory.forEach((entry) => {
      map.set(entry.name, entry);
    });
    return map;
  }, [directory]);

  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      const assigneeNames = normalizeAssigneeNames(task);
      const assignees = assigneeNames.map((name) => {
        const profile = userLookup.get(name);
        return {
          name,
          appRole: profile?.appRole || 'staff',
          avatarUrl: profile?.avatarUrl || null,
          role: profile?.role || null,
        };
      });

      return {
        ...task,
        assigneesResolved: assignees,
      };
    });
  }, [tasks, userLookup]);

  const pendingTasks = useMemo(
    () => enrichedTasks.filter((task) => normalizeTaskStatus(task.status) !== 'COMPLETED'),
    [enrichedTasks]
  );

  const finishedTasks = useMemo(
    () => enrichedTasks.filter((task) => normalizeTaskStatus(task.status) === 'COMPLETED'),
    [enrichedTasks]
  );

  const completedTasks = finishedTasks.length;
  const taskCompletionPct = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const guestConfirmed = event?.guests?.rsvp || 0;
  const guestInvited = event?.guests?.invited || 0;
  const guestPct = guestInvited > 0 ? (guestConfirmed / guestInvited) * 100 : 0;

  const updateTaskLocally = (taskId: string, updater: (task: TaskRecord) => TaskRecord) => {
    setTasks((prev) => prev.map((task) => (task._id === taskId ? updater(task) : task)));
  };

  const persistTaskPatch = async (taskId: string, payload: Record<string, unknown>) => {
    if (!user) return false;

    setUpdatingTaskId(taskId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          taskObjectId: taskId,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task.');
      }

      const updatedTask = await response.json();
      updateTaskLocally(taskId, (currentTask) => ({
        ...currentTask,
        ...updatedTask,
      }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleConfirmTaskDone = async () => {
    if (!confirmTask) return;
    const taskId = confirmTask._id;
    const success = await persistTaskPatch(taskId, { status: 'COMPLETED' });
    if (success) {
      setConfirmTask(null);
    }
  };

  const handleAddStaff = async (task: TaskRecord, staffName: string) => {
    const currentAssignees = normalizeAssigneeNames(task);
    if (currentAssignees.includes(staffName)) return;

    const success = await persistTaskPatch(task._id, {
      assignees: [...currentAssignees, staffName],
    });

    if (success) {
      setAssigningTaskId(null);
    }
  };

  const handleRemoveStaff = async (task: TaskRecord, staffName: string) => {
    const currentAssignees = normalizeAssigneeNames(task);
    const nextAssignees = currentAssignees.filter((name) => name !== staffName);
    await persistTaskPatch(task._id, {
      assignees: nextAssignees,
    });
  };

  const renderTaskSection = (
    sectionTitle: string,
    sectionDescription: string,
    sectionTasks: Array<TaskRecord & {
      assigneesResolved: Array<{
        name: string;
        appRole: UserRecord['appRole'];
        avatarUrl: string | null;
        role: string | null;
      }>;
    }>,
    isFinishedSection: boolean
  ) => (
    <div className="mb-10 last:mb-0">
      <div className="pb-5 border-b border-gray-100 flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
            <ClipboardCheck size={24} className="text-[#a1a1aa]" /> {sectionTitle}
          </h3>
          <p className="text-sm font-semibold text-[#71717a] mt-2">{sectionDescription}</p>
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
          {sectionTasks.length} {sectionTasks.length === 1 ? 'Task' : 'Tasks'}
        </span>
      </div>

      <div className="space-y-5">
        {sectionTasks.length === 0 && (
          <div className="py-6 text-sm font-medium text-[#71717a]">
            {isFinishedSection ? 'No finished directives yet.' : 'No pending directives assigned to you for this event.'}
          </div>
        )}

        {sectionTasks.map((task) => {
          const isDone = normalizeTaskStatus(task.status) === 'COMPLETED';
          const badge = getTaskBadge(task);
          const availableStaff = directory.filter(
            (entry) =>
              entry.appRole === 'staff' &&
              !task.assigneesResolved.some((assignee) => assignee.name === entry.name)
          );
          const isAssigning = assigningTaskId === task._id;
          const isUpdating = updatingTaskId === task._id;

          return (
            <div key={task._id} className={`bg-white rounded-2xl border border-gray-100 overflow-visible ${isDone ? 'opacity-70' : 'shadow-sm'}`}>
              <div className="py-6 px-6 flex items-start gap-5">
                <button
                  type="button"
                  disabled={isDone || isUpdating}
                  onClick={() => !isDone && setConfirmTask(task)}
                  className={`mt-1 shrink-0 transition-colors ${isDone ? 'text-emerald-500 cursor-default' : 'text-gray-300 hover:text-emerald-500'} disabled:opacity-60`}
                >
                  {isDone ? <CheckCircle2 size={24} strokeWidth={2} /> : <Circle size={24} strokeWidth={2} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`text-lg font-bold ${isDone ? 'text-[#a1a1aa] line-through decoration-gray-300' : 'text-[#1d1d1f]'}`}>
                        {task.title || 'Untitled Task'}
                      </p>
                      {task.description && (
                        <p className={`text-sm font-medium mt-1.5 ${isDone ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      {badge && <span className={badge.classes}>{badge.label}</span>}
                      <p className="text-xs font-bold text-[#a1a1aa]">
                        {task.due?.date ? `Due ${formatDueDate(task.due.date)}` : 'No due date'}
                        {task.due?.time ? ` at ${task.due.time}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 bg-[#fcfcfc] px-6 py-4">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-3">
                  <Users size={12} />
                  Assigned Staff
                  <span className="text-[#d4a017]">{task.assigneesResolved.length}</span>
                </div>

                <div className="flex flex-wrap gap-3 mb-3">
                  {task.assigneesResolved.map((assignee) => {
                    const removable = assignee.appRole === 'staff' && !isDone;
                    return (
                      <div key={`${task._id}-${assignee.name}`} className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
                        {assignee.avatarUrl ? (
                          <img src={assignee.avatarUrl} alt={assignee.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#f3f4f6] text-[#71717a] flex items-center justify-center text-[10px] font-black">
                            {getInitials(assignee.name)}
                          </div>
                        )}
                        <div className="pr-1">
                          <p className="text-[13px] font-bold text-[#1d1d1f] leading-tight">{assignee.name}</p>
                          <span className={`inline-flex mt-0.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${roleBadgeMap[assignee.appRole]}`}>
                            {assignee.appRole}
                          </span>
                        </div>
                        {removable && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleRemoveStaff(task, assignee.name)}
                            className="w-6 h-6 rounded-full bg-[#f8f8f8] hover:bg-red-50 text-[#a1a1aa] hover:text-red-500 transition-colors flex items-center justify-center disabled:opacity-50"
                            aria-label={`Remove ${assignee.name}`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isDone && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAssigningTaskId((current) => (current === task._id ? null : task._id))}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-[#71717a] hover:text-[#1d1d1f] hover:border-[#d4a017]/40 transition-colors"
                    >
                      <Plus size={14} />
                      Assign Staff
                    </button>

                    {isAssigning && (
                      <div className="absolute left-0 top-full z-20 mt-3 w-full md:w-[340px] rounded-2xl border border-gray-100 bg-white shadow-lg p-3 space-y-2">
                        {availableStaff.length === 0 && (
                          <p className="text-sm font-medium text-[#71717a] px-2 py-2">All available staff are already assigned.</p>
                        )}

                        {availableStaff.map((staff) => (
                          <button
                            key={`${task._id}-${staff.uid}`}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleAddStaff(task, staff.name)}
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#fafafa] transition-colors text-left disabled:opacity-50"
                          >
                            {staff.avatarUrl ? (
                              <img src={staff.avatarUrl} alt={staff.name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#f3f4f6] text-[#71717a] flex items-center justify-center text-[10px] font-black">
                                {getInitials(staff.name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-[#1d1d1f]">{staff.name}</p>
                              <p className="text-[11px] font-medium text-[#a1a1aa]">{roleLabelMap[staff.appRole]}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <Link href="/coordinator/events" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] hover:text-[#d4a017] transition-colors mb-6 group">
        <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to Events
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Events <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{event?.title || 'Event'}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#d4a017] italic pr-2">Overview</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Execution and logistics hub for {event?.title || 'this event'}. Track your required tasks and monitor guest confirmations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {getDisplayStatusLabel(event?.status)}
          </span>
        </div>
      </div>

      <div className="w-full mt-10">
        <div className="w-full flex flex-col">
          <div className="border-b-2 border-gray-100 flex overflow-x-auto scrollbar-hide mb-8">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'overview' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Calendar size={16} /> Schedule & Info
            </button>
            <button
              onClick={() => handleTabChange('tasks')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'tasks' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <ClipboardCheck size={16} /> Assigned Tasks
              <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-200 text-gray-500'}`}>{pendingTasks.length}</span>
            </button>
            <button
              onClick={() => handleTabChange('rsvp')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'rsvp' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Users size={16} /> Guest List
            </button>
          </div>

          <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-[#1d1d1f] mb-6 tracking-tight">Event Logistics</h3>
                  <div className="space-y-6">
                    <div className="flex gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1 border-b border-gray-100 pb-5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Date</p>
                        <p className="text-lg font-black text-[#1d1d1f]">{loading ? 'Loading...' : formatFullDate(event?.date)}</p>
                      </div>
                    </div>

                    <div className="flex gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                        <Clock size={20} />
                      </div>
                      <div className="flex-1 border-b border-gray-100 pb-5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Time</p>
                        <p className="text-lg font-black text-[#1d1d1f]">{loading ? 'Loading...' : formatTime(event?.date)}</p>
                      </div>
                    </div>

                    <div className="flex gap-5 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-1 pb-5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Location</p>
                        <p className="text-lg font-black text-[#1d1d1f]">{loading ? 'Loading...' : event?.location || 'Venue TBD'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#1d1d1f] mb-6 tracking-tight">Your KPIs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-4">Tasks Completed</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{completedTasks}</span>
                        <span className="text-sm font-bold text-[#71717a]">/ {tasks.length}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                        <div className="bg-[#1d1d1f] h-full rounded-full transition-all" style={{ width: `${taskCompletionPct}%` }}></div>
                      </div>
                    </div>

                    <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-4">Guests Confirmed</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{guestConfirmed}</span>
                        <span className="text-sm font-bold text-[#71717a]">/ {guestInvited}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${guestPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-[#fff9e6] rounded-3xl border border-[#eebf43]/30 flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm border border-[#eebf43]/20">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#1d1d1f] mb-2 tracking-tight">Admin Directive</h4>
                    <p className="text-sm font-bold text-yellow-950/70 leading-relaxed text-balance">
                      {event?.initialAlert?.trim() || 'No active admin directive for this event.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
            {loading ? (
              <div className="py-6 text-sm font-medium text-[#71717a]">Loading assigned tasks...</div>
            ) : (
              <>
                {renderTaskSection(
                  'Pending Directives',
                  'Mark tasks as finished after reviewing the confirmation modal and coordinate staff support when needed.',
                  pendingTasks,
                  false
                )}
                {renderTaskSection(
                  'Finished Directives',
                  'Completed tasks stay visible here so progress is clear and immediately reflected in your event KPIs.',
                  finishedTasks,
                  true
                )}
              </>
            )}
          </div>

          <div className={activeTab === 'rsvp' ? 'block' : 'hidden'}>
            <div className="pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
              <div>
                <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                  <Users size={24} className="text-[#a1a1aa]" /> Guest Registry
                </h3>
                <p className="text-sm font-semibold text-[#71717a] mt-2">Guest confirmation totals are sourced from the event record.</p>
              </div>

              <div className="w-full sm:w-auto bg-[#fafafa] border border-gray-100 px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center gap-6 shrink-0">
                <div className="flex flex-col text-right pr-6 border-r border-gray-200">
                  <span className="text-2xl font-black text-emerald-600 leading-none">{guestConfirmed}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mt-2">Confirmed</span>
                </div>
                <div className="flex flex-col text-left pl-2">
                  <span className="text-2xl font-black text-gray-300 leading-none">{Math.max(guestInvited - guestConfirmed, 0)}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mt-2">Pending</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-sm font-medium text-[#71717a]">
              RSVP metrics are available for this event. Detailed guest roster actions are managed from the event guest workflows.
            </div>
          </div>
        </div>
      </div>

      {confirmTask && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-3">Confirm Completion</p>
            <h3 className="text-2xl font-black text-[#1d1d1f] tracking-tight mb-3">Mark this task as completed?</h3>
            <p className="text-sm font-medium text-[#71717a] leading-relaxed">
              <span className="font-bold text-[#1d1d1f]">{confirmTask.title || 'Untitled Task'}</span> will be moved to finished directives and your progress KPI will update immediately.
            </p>
            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setConfirmTask(null)}
                className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-[#71717a] hover:text-[#1d1d1f] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingTaskId === confirmTask._id}
                onClick={handleConfirmTaskDone}
                className="px-5 py-3 rounded-xl bg-[#1d1d1f] hover:bg-[#d4a017] text-white text-sm font-extrabold transition-colors disabled:opacity-60"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
