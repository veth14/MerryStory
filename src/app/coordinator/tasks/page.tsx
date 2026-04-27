'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Circle, CheckCircle2, Clock, CalendarDays, UserRound, ArrowDown, Lock, Loader2, AlertCircle, Eye, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface TaskRecord {
  _id?: string;
  taskId?: string;
  eventId?: string;
  title?: string;
  status?: string;
  due?: {
    date?: string;
  };
  dueDate?: string;
}

interface EventRecord {
  _id: string;
  title: string;
}

type DecoratedTask = {
  _id?: string;
  taskId?: string;
  eventId?: string;
  title: string;
  eventTitle: string;
  dueDate: string;
  dueDateValue: Date | null;
  status: string;
};

const getTaskDueDate = (task: TaskRecord) => task.dueDate || task.due?.date || '';
const isCompleted = (status?: string) => status?.trim().toLowerCase() === 'completed';
const parseTaskDueDate = (value: string) => {
  if (!value) return null;

  const isoLike = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(isoLike.getTime()) ? null : isoLike;
};

const formatDueDate = (date: Date | null, fallback: string) => {
  if (!date) return fallback || 'No due date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getStartOfWeek = (value: Date) => {
  const start = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfWeek = (value: Date) => {
  const end = getStartOfWeek(value);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export default function CoordinatorTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DecoratedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    action: (() => Promise<void>) | null;
    type: 'info' | 'danger';
  }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const idToken = await user!.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [tasksResponse, eventsResponse] = await Promise.all([
        fetch('/api/tasks', { headers }),
        fetch('/api/events', { headers }),
      ]);

      if (!tasksResponse.ok) {
        const errorData = await tasksResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const taskPayload: TaskRecord[] = await tasksResponse.json();
      const eventPayload: EventRecord[] = await eventsResponse.json();
      const eventTitleMap = new Map(eventPayload.map((event) => [event._id, event.title]));

      const nextTasks = (Array.isArray(taskPayload) ? taskPayload : [])
        .map((task) => {
          const dueDate = getTaskDueDate(task);
          const parsedDueDate = parseTaskDueDate(dueDate);

          return {
            _id: task._id,
            taskId: task.taskId,
            eventId: task.eventId,
            title: task.title || 'Untitled Task',
            eventTitle: task.eventId ? eventTitleMap.get(task.eventId) || 'Unknown Event' : 'Unassigned Event',
            dueDate,
            dueDateValue: parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : null,
            status: task.status || '',
          };
        })
        .sort((left, right) => {
          if (!left.dueDateValue && !right.dueDateValue) return 0;
          if (!left.dueDateValue) return 1;
          if (!right.dueDateValue) return -1;
          return left.dueDateValue.getTime() - right.dueDateValue.getTime();
        });

      setTasks(nextTasks);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = useMemo(() => tasks.filter((task) => !isCompleted(task.status)), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => isCompleted(task.status)), [tasks]);

  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = getEndOfWeek(now);

    return pendingTasks.reduce(
      (groups, task) => {
        if (!task.dueDateValue) {
          groups.upcoming.push(task);
          return groups;
        }

        const dueDate = new Date(task.dueDateValue.getFullYear(), task.dueDateValue.getMonth(), task.dueDateValue.getDate());

        if (dueDate.getTime() < today.getTime()) {
          groups.needsAttention.push(task);
        } else if (isSameDay(dueDate, today)) {
          groups.dueToday.push(task);
        } else if (dueDate.getTime() >= startOfWeek.getTime() && dueDate.getTime() <= endOfWeek.getTime()) {
          groups.dueThisWeek.push(task);
        } else if (dueDate.getTime() > endOfWeek.getTime()) {
          groups.upcoming.push(task);
        }

        return groups;
      },
      {
        needsAttention: [] as DecoratedTask[],
        dueToday: [] as DecoratedTask[],
        dueThisWeek: [] as DecoratedTask[],
        upcoming: [] as DecoratedTask[],
      }
    );
  }, [pendingTasks]);

  const openModal = (title: string, desc: string, action: (() => Promise<void>) | null = null, type: 'info' | 'danger' = 'info') => {
    setModal({ isOpen: true, title, desc, action, type });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  const handleConfirm = async () => {
    if (!modal.action) return;
    await modal.action();
    closeModal();
  };

  const handleComplete = async (task: DecoratedTask) => {
    if (!task._id || isCompletingTask) return;

    const previousTasks = tasks;

    try {
      setIsCompletingTask(true);
      setTasks((current) => current.map((item) => (item._id === task._id ? { ...item, status: 'completed' } : item)));

      const idToken = await user!.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ taskObjectId: task._id, status: 'completed' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not update task status.');
      setTasks(previousTasks);
    } finally {
      setIsCompletingTask(false);
    }
  };

  const renderTaskRow = (task: DecoratedTask, dueTone: 'red' | 'orange' | 'gray') => (
    <div
      key={task._id || task.taskId || `${task.title}-${task.eventId}`}
      className="p-5 px-6 flex items-start justify-between gap-4 hover:bg-[#fafafa] transition-colors group cursor-pointer"
      onClick={() => task.eventId && router.push(`/coordinator/events/${task.eventId}?tab=tasks`)}
    >
      <div className="flex items-start gap-4">
        <button
          className="text-gray-300 hover:text-emerald-500 transition-colors shrink-0 mt-0.5 p-2 -m-2 group/btn"
          onClick={(event) => {
            event.stopPropagation();
            openModal(
              'Mark task as complete?',
              `This will remove "${task.title}" from your active task slides immediately.`,
              async () => handleComplete(task)
            );
          }}
          disabled={isCompletingTask}
        >
          <Circle size={22} strokeWidth={2} className="group-hover/btn:hidden" />
          <CheckCircle2 size={22} strokeWidth={2} className="hidden group-hover/btn:block text-emerald-500" />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-[#1d1d1f]">{task.title}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#1d1d1f] bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
              <CalendarDays size={12} /> {task.eventTitle}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border px-2 py-1 rounded-md ${
              dueTone === 'red'
                ? 'text-red-500 bg-red-50 border-red-100'
                : dueTone === 'orange'
                  ? 'text-orange-500 bg-orange-50 border-orange-100'
                  : 'text-[#71717a] bg-gray-50 border-gray-100'
            }`}>
              <Clock size={12} /> Due: {formatDueDate(task.dueDateValue, task.dueDate)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center shrink-0 self-center md:opacity-0 md:-translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300">
        <ArrowRight size={18} className="text-[#a1a1aa]" />
      </div>
    </div>
  );

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressWidth = totalTasks ? (completedCount / totalTasks) * 100 : 0;
  const needsAttention = categorizedTasks.needsAttention;
  const dueToday = categorizedTasks.dueToday;
  const dueThisWeek = categorizedTasks.dueThisWeek;
  const upcoming = categorizedTasks.upcoming;
  const recentAssigned = pendingTasks[0];
  const recentCompleted = completedTasks[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Assigned Tasks...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
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

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-6">
          {needsAttention.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                  <ArrowDown size={16} /> Needs Attention
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-red-50 text-red-500 px-2 py-1 rounded-md">Overdue</span>
              </div>

              <div className="divide-y divide-gray-50">
                {needsAttention.map((task) => renderTaskRow(task, 'red'))}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f] flex items-center gap-2">
                  <Clock size={16} className="text-[#d4a017]" /> Due Today
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#fff9e6] text-[#d4a017] px-2 py-1 rounded-md">{dueToday.length} Pending</span>
              </div>

              <div className="divide-y divide-gray-50">
                {dueToday.map((task) => renderTaskRow(task, 'orange'))}
              </div>
            </div>
          )}

          {dueThisWeek.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f] flex items-center gap-2">
                  <CalendarDays size={16} className="text-[#d4a017]" /> Due This Week
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#fff9e6] text-[#d4a017] px-2 py-1 rounded-md">{dueThisWeek.length} Pending</span>
              </div>

              <div className="divide-y divide-gray-50">
                {dueThisWeek.map((task) => renderTaskRow(task, 'gray'))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f] flex items-center gap-2">
                  <CalendarDays size={16} className="text-[#d4a017]" /> Upcoming
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-gray-100 text-[#71717a] px-2 py-1 rounded-md">{upcoming.length} Pending</span>
              </div>

              <div className="divide-y divide-gray-50">
                {upcoming.map((task) => renderTaskRow(task, 'gray'))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
              <h3 className="text-sm font-black text-[#1d1d1f]">My Progress</h3>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Completed</span>
              <span className="text-xs font-black text-emerald-600">{completedCount} / {totalTasks} Tasks</span>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressWidth}%` }}
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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <h3 className="text-sm font-black text-[#1d1d1f] mb-6 border-b border-gray-50 pb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentAssigned && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserRound size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1d1d1f]"><span className="text-[#d4a017]">Admin</span> assigned: {recentAssigned.title}</p>
                    <p className="text-[10px] font-medium text-[#a1a1aa] mt-1">{recentAssigned.eventTitle}</p>
                  </div>
                </div>
              )}

              {recentCompleted && (
                <div className="flex gap-4 opacity-75">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1d1d1f]"><span className="text-[#71717a]">You</span> completed: {recentCompleted.title}</p>
                    <p className="text-[10px] font-medium text-[#a1a1aa] mt-1">{recentCompleted.eventTitle}</p>
                  </div>
                </div>
              )}

              {!recentAssigned && !recentCompleted && (
                <div className="text-[11px] font-medium text-[#a1a1aa]">No live task activity to display yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${modal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#fafafa] text-[#1d1d1f]'}`}>
                {modal.type === 'danger' ? <AlertCircle size={20} /> : <Eye size={20} />}
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors" disabled={isCompletingTask}>
                <X size={16} className="text-[#a1a1aa]" />
              </button>
            </div>
            <h3 className="text-2xl font-black text-[#1d1d1f] mb-3">{modal.title}</h3>
            <p className="text-sm text-[#71717a] font-medium leading-relaxed whitespace-pre-line mb-8">{modal.desc}</p>
            <div className="flex gap-3">
              <button onClick={closeModal} disabled={isCompletingTask} className="flex-1 py-3.5 bg-[#fafafa] border border-gray-100 hover:bg-gray-100 text-[#71717a] text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-60">
                Close
              </button>
              {modal.action && (
                <button onClick={handleConfirm} disabled={isCompletingTask} className="flex-1 py-3.5 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors bg-[#1d1d1f] hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                  {isCompletingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
