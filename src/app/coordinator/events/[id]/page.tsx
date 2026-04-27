'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Loader2,
  Filter,
  ChevronDown,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface EventData {
  _id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  status?: string;
  health?: number;
  initialAlert?: string;
  guests?: {
    invited?: number;
    rsvp?: number;
    checkedIn?: number;
  };
}

interface EventTask {
  _id?: string;
  taskId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: {
    date?: string;
    time?: string;
  };
  dueDate?: string;
  dueTime?: string;
}

type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const PAGE_SIZE = 5;
const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: 'ALL', label: 'ALL PRIORITY' },
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'LOW', label: 'LOW' },
];
const priorityColorMap: Record<string, string> = {
  CRITICAL: 'text-red-700 bg-red-50 border-red-200',
  HIGH: 'text-red-700 bg-red-50 border-red-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  LOW: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

const normalizeStatus = (value?: string) => {
  const normalized = value?.toUpperCase().replace(/[_-]/g, ' ').trim();
  return normalized === 'TODO' || normalized === 'TO DO'
    ? 'TO DO'
    : normalized === 'INPROGRESS' || normalized === 'IN PROGRESS'
      ? 'IN PROGRESS'
      : normalized === 'COMPLETED'
        ? 'COMPLETED'
        : normalized || 'TO DO';
};

const normalizePriority = (value?: string) => (value ? value.toUpperCase() : 'MEDIUM');
const isTaskCompleted = (task: EventTask) => normalizeStatus(task.status) === 'COMPLETED';
const getTaskDueDate = (task: EventTask) => task.dueDate || task.due?.date || '';
const getTaskDueTime = (task: EventTask) => task.dueTime || task.due?.time || '';

const getTaskDueDateTime = (task: EventTask) => {
  const dueDate = getTaskDueDate(task);
  const dueTime = getTaskDueTime(task);

  if (!dueDate) return null;

  const parsed = new Date(`${dueDate}T${dueTime || '23:59:59'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isTaskOverdue = (task: EventTask, now: Date) => {
  const due = getTaskDueDateTime(task);
  return !isTaskCompleted(task) && !!due && due.getTime() < now.getTime();
};

const formatEventDateTime = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
};

const formatEventTime = (value?: string) => {
  if (!value) return 'No time set';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
};

const getTaskDueLabel = (task: EventTask, now: Date) => {
  const due = getTaskDueDateTime(task);
  const dueDate = getTaskDueDate(task);
  const dueTime = getTaskDueTime(task);

  if (!due && !dueDate) return 'No due date';
  if (!due) return `Due ${dueDate}`;

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isTaskOverdue(task, now) && isSameCalendarDay(due, yesterday)) {
    return 'Due Yesterday';
  }

  const dateLabel = due.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = dueTime
    ? due.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return `Due ${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}`;
};

const getStatusBadgeClassName = (status?: string) => {
  if (status === 'At Risk') return 'text-red-700 bg-red-50 border-red-100';
  if (status === 'Completed') return 'text-emerald-700 bg-emerald-50 border-emerald-100';
  if (status === 'On Hold') return 'text-gray-600 bg-gray-100 border-gray-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-100';
};

const paginateItems = <T,>(items: T[], page: number) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

export default function CoordinatorEventDetailsPage() {
  return <CoordinatorEventDetailsContent />;
}

function CoordinatorEventDetailsContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const id = typeof params?.id === 'string' ? params.id : '';
  const initialTab = (searchParams.get('tab') as 'overview' | 'tasks' | 'rsvp') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'rsvp'>(initialTab);
  const [event, setEvent] = useState<EventData | null>(null);
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [finishedPage, setFinishedPage] = useState(1);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    action: (() => Promise<void>) | null;
    type: 'info' | 'danger';
  }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });
  const priorityFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'tasks', 'rsvp'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'tasks' | 'rsvp');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityFilterRef.current && !priorityFilterRef.current.contains(event.target as Node)) {
        setIsPriorityFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && id) {
      fetchEventData();
    }
  }, [id, user]);

  useEffect(() => {
    setPendingPage(1);
    setFinishedPage(1);
  }, [priorityFilter, tasks]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError('');

      const idToken = await user!.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [eventResponse, tasksResponse] = await Promise.all([
        fetch(`/api/events/${id}`, { headers }),
        fetch(`/api/tasks?eventId=${id}`, { headers }),
      ]);

      if (!eventResponse.ok) {
        throw new Error((await eventResponse.json().catch(() => ({}))).error || 'Failed to fetch event details');
      }

      if (!tasksResponse.ok) {
        throw new Error((await tasksResponse.json().catch(() => ({}))).error || 'Failed to fetch event tasks');
      }

      const eventPayload = await eventResponse.json();
      const tasksPayload = await tasksResponse.json();

      setEvent(eventPayload);
      setTasks(Array.isArray(tasksPayload) ? tasksPayload : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'overview' | 'tasks' | 'rsvp') => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const openModal = (title: string, desc: string, action: (() => Promise<void>) | null = null, type: 'info' | 'danger' = 'info') => {
    setModal({ isOpen: true, title, desc, action, type });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  const handleConfirm = async () => {
    if (!modal.action) return;
    await modal.action();
    closeModal();
  };

  const visibleTasks = useMemo(
    () =>
      priorityFilter === 'ALL'
        ? tasks
        : tasks.filter((task) => normalizePriority(task.priority) === priorityFilter),
    [priorityFilter, tasks]
  );

  const pendingTasks = useMemo(() => visibleTasks.filter((task) => !isTaskCompleted(task)), [visibleTasks]);
  const finishedTasks = useMemo(() => visibleTasks.filter((task) => isTaskCompleted(task)), [visibleTasks]);
  const completedTaskCount = useMemo(() => tasks.filter((task) => isTaskCompleted(task)).length, [tasks]);
  const pendingTaskCount = Math.max(tasks.length - completedTaskCount, 0);
  const pendingPageCount = Math.max(Math.ceil(pendingTasks.length / PAGE_SIZE), 1);
  const finishedPageCount = Math.max(Math.ceil(finishedTasks.length / PAGE_SIZE), 1);
  const paginatedPendingTasks = paginateItems(pendingTasks, Math.min(pendingPage, pendingPageCount));
  const paginatedFinishedTasks = paginateItems(finishedTasks, Math.min(finishedPage, finishedPageCount));

  const completeTask = async (task: EventTask) => {
    if (!task._id || isCompletingTask) return;

    const previousStatus = task.status;

    try {
      setIsCompletingTask(true);
      setTasks((prev) => prev.map((item) => (item._id === task._id ? { ...item, status: 'COMPLETED' } : item)));

      const idToken = await user!.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ taskObjectId: task._id, status: 'COMPLETED' }),
      });

      if (!response.ok) {
        throw new Error((await response.json().catch(() => ({}))).error || 'Failed to update task status');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not complete task.');
      setTasks((prev) => prev.map((item) => (item._id === task._id ? { ...item, status: previousStatus } : item)));
    } finally {
      setIsCompletingTask(false);
    }
  };

  const renderPagination = (page: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-end gap-3 pt-5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  const renderTaskList = (items: EventTask[], group: 'pending' | 'finished') => {
    if (items.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-sm font-semibold text-[#71717a]">
            {group === 'pending' ? 'No pending directives match this filter.' : 'No finished directives match this filter.'}
          </p>
        </div>
      );
    }

    const now = new Date();

    return (
      <div className="divide-y divide-gray-100">
        {items.map((task) => {
          const isFinished = isTaskCompleted(task);
          const overdue = isTaskOverdue(task, now);
          const priority = normalizePriority(task.priority);

          return (
            <div
              key={task._id || task.taskId || task.title}
              className={`py-6 flex items-start gap-5 transition-colors -mx-4 px-4 rounded-2xl ${isFinished ? 'opacity-50' : 'hover:bg-[#fafafa]/50 group'}`}
            >
              {isFinished ? (
                <div className="text-emerald-500 mt-1">
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openModal(
                      'Mark directive as complete?',
                      `This will move "${task.title || 'Untitled Task'}" into Finished Directives immediately.`,
                      async () => completeTask(task)
                    )
                  }
                  disabled={isCompletingTask}
                  className="text-gray-300 hover:text-emerald-500 transition-colors mt-1 disabled:opacity-50"
                >
                  <Circle size={24} strokeWidth={2} />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-lg font-bold ${isFinished ? 'text-[#a1a1aa] line-through decoration-gray-300' : 'text-[#1d1d1f]'}`}>
                  {task.title || 'Untitled Task'}
                </p>
                <p className={`text-sm font-medium mt-1.5 leading-relaxed ${isFinished ? 'text-[#a1a1aa]' : 'text-[#71717a]'}`}>
                  {task.description || 'No description provided.'}
                </p>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-1 border text-[10px] font-extrabold uppercase tracking-widest rounded-lg ${priorityColorMap[priority] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                    {priority} Priority
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                {isFinished ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Done</span>
                ) : overdue ? (
                  <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2">
                    Overdue
                  </span>
                ) : null}
                <p className="text-xs font-bold text-[#a1a1aa] mt-2">{getTaskDueLabel(task, now)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading event details...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{error}</h2>
        <p className="text-gray-500 mt-2 max-w-xs">We couldn't retrieve the details for this event workspace.</p>
        <Link href="/coordinator/events" className="mt-8 text-[11px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowRight size={14} className="rotate-180" /> Return to Events
        </Link>
      </div>
    );
  }

  const guestInvited = event?.guests?.invited || 0;
  const guestConfirmed = event?.guests?.rsvp || 0;
  const taskProgressPercent = tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : 0;

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <Link href="/coordinator/events" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] hover:text-[#d4a017] transition-colors mb-6 group">
        <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to Events
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Events <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{event?.title}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#d4a017] italic pr-2">Overview</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Execution and logistics hub for {event?.title}. Track your required tasks and monitor guest check-ins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-full border uppercase tracking-widest shadow-sm ${getStatusBadgeClassName(event?.status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${event?.status === 'At Risk' ? 'bg-red-500' : event?.status === 'Completed' ? 'bg-emerald-500' : event?.status === 'On Hold' ? 'bg-gray-400' : 'bg-emerald-500'}`}></span>
            {event?.status || 'Active'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="w-full mt-10 animate-in fade-in duration-500">
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
              <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-200 text-gray-500'}`}>{pendingTaskCount}</span>
            </button>
            <button
              onClick={() => handleTabChange('rsvp')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'rsvp' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Users size={16} /> Guest List
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
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
                          <p className="text-lg font-black text-[#1d1d1f]">{formatEventDateTime(event?.date)}</p>
                        </div>
                      </div>

                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                          <Clock size={20} />
                        </div>
                        <div className="flex-1 border-b border-gray-100 pb-5">
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Time</p>
                          <p className="text-lg font-black text-[#1d1d1f]">{formatEventTime(event?.date)}</p>
                        </div>
                      </div>

                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1 pb-5">
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Location</p>
                          <p className="text-lg font-black text-[#1d1d1f]">{event?.location || 'No location set'}</p>
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
                          <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{completedTaskCount}</span>
                          <span className="text-sm font-bold text-[#71717a]">/ {tasks.length}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                          <div className="bg-[#1d1d1f] h-full rounded-full transition-all" style={{ width: `${taskProgressPercent}%` }}></div>
                        </div>
                      </div>

                      <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-4">Guests Confirmed</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{guestConfirmed}</span>
                          <span className="text-sm font-bold text-[#71717a]">/ {guestInvited}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${guestInvited ? Math.round((guestConfirmed / guestInvited) * 100) : 0}%` }}></div>
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
                        {event?.initialAlert || 'No active directive has been posted for this event yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="animate-in fade-in duration-300">
              <div className="pb-6 border-b border-gray-100 flex items-center justify-between mb-2 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                    <ClipboardCheck size={24} className="text-[#a1a1aa]" /> Pending Directives
                  </h3>
                  <p className="text-sm font-semibold text-[#71717a] mt-2">Mark operations as complete once executed.</p>
                </div>

                <div className="pr-4" ref={priorityFilterRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPriorityFilterOpen((prev) => !prev)}
                      className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer min-w-[165px] relative"
                    >
                      {PRIORITY_OPTIONS.find((option) => option.value === priorityFilter)?.label || 'ALL PRIORITY'}
                      <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${isPriorityFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPriorityFilterOpen && (
                      <div className="absolute right-0 mt-2 min-w-[165px] rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)] z-20">
                        {PRIORITY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setPriorityFilter(option.value);
                              setIsPriorityFilterOpen(false);
                            }}
                            className="w-full px-4 py-3 hover:bg-gray-50 text-left text-[12px] font-black text-gray-800 tracking-wider uppercase"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {renderTaskList(paginatedPendingTasks, 'pending')}
              {renderPagination(Math.min(pendingPage, pendingPageCount), pendingPageCount, setPendingPage)}

              <div className="pt-12 pb-6 border-b border-gray-100 flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                    <CheckCircle2 size={24} className="text-[#a1a1aa]" /> Finished Directives
                  </h3>
                  <p className="text-sm font-semibold text-[#71717a] mt-2">Completed directives are archived here for quick review.</p>
                </div>
              </div>

              {renderTaskList(paginatedFinishedTasks, 'finished')}
              {renderPagination(Math.min(finishedPage, finishedPageCount), finishedPageCount, setFinishedPage)}
            </div>
          )}

          {activeTab === 'rsvp' && (
            <div className="animate-in fade-in duration-300">
              <div className="pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                    <Users size={24} className="text-[#a1a1aa]" /> Guest Registry
                  </h3>
                  <p className="text-sm font-semibold text-[#71717a] mt-2">Guest counts below are sourced from the event workspace summary.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    href={`/coordinator/events/${id}/scan`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    SCAN QR TICKET
                  </Link>

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
              </div>

              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-extrabold">
                      <th className="py-5 font-extrabold w-1/3">Guest Name</th>
                      <th className="py-5 font-extrabold">Category</th>
                      <th className="py-5 font-extrabold text-center">Status</th>
                      <th className="py-5 font-extrabold text-center">Party Size</th>
                      <th className="py-5 font-extrabold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <p className="text-sm font-semibold text-[#71717a]">Guest-level records are not loaded in this coordinator view. Event-level guest counts above are live.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
