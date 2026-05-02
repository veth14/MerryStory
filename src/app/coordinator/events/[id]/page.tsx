'use client';

import React, { useState, use, useEffect, Suspense, useMemo, useRef } from 'react';
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
  Search,
  QrCode,
  Link2,
  Check,
  Loader2,
  X,
  ChevronDown,
  Eye,
  Trash2,
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

type GuestStatus = 'Confirmed' | 'Pending' | 'Declined';

type GuestRecord = {
  _id: string;
  name?: string;
  email?: string;
  notes?: string;
  phone?: string;
  gender?: string;
  age?: number | null;
  tier?: string;
  status?: GuestStatus;
  tableNo?: string;
  plusOne?: boolean;
  checkedIn?: boolean;
  rsvpCode?: string;
};

type GuestFormState = {
  name: string;
  email: string;
  tier: string;
  status: GuestStatus;
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

const guestStatusOptions: GuestStatus[] = ['Confirmed', 'Pending', 'Declined'];
const guestTierOptions = ['Standard', 'VIP'];
const guestTierSelectOptions = guestTierOptions.map((option) => ({
  value: option,
  label: option,
}));
const guestStatusSelectOptions = guestStatusOptions.map((option) => ({
  value: option,
  label: option,
}));
const guestDropdownTriggerClass =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between transition-all';

const createGuestFormState = (): GuestFormState => ({
  name: '',
  email: '',
  tier: 'Standard',
  status: 'Pending',
});

const getGuestStatusTone = (status?: string) => {
  if (status === 'Confirmed') {
    return {
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    };
  }

  if (status === 'Declined') {
    return {
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    };
  }

  return {
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  };
};

const buildGuestCode = (guest: GuestRecord) => {
  if (guest.rsvpCode?.trim()) return guest.rsvpCode.trim();
  const rawToken = (guest._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const token = rawToken.slice(-8).padStart(8, '0');
  return guest.tier === 'VIP' ? `VIP-${token}` : token;
};

function GuestModalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; helper?: string }>;
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${guestDropdownTriggerClass} ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-gray-900 truncate">{selectedOption?.label || value}</div>
          {selectedOption?.helper ? (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedOption.helper}</div>
          ) : null}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[13px] font-extrabold text-gray-900">{option.label}</div>
                {option.helper ? (
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{option.helper}</div>
                ) : null}
              </div>
              {value === option.value ? <Check className="w-4 h-4 text-[#facc15]" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<TaskRecord | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'All' | GuestStatus>('All');
  const [guestForm, setGuestForm] = useState<GuestFormState>(createGuestFormState());
  const [submittingGuest, setSubmittingGuest] = useState(false);
  const [actingGuestId, setActingGuestId] = useState<string | null>(null);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [guestPendingRemoval, setGuestPendingRemoval] = useState<GuestRecord | null>(null);
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

  useEffect(() => {
    const fetchGuests = async () => {
      if (!user || !id) return;

      setLoadingGuests(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/coordinator/guest-registry?eventId=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch guest registry.');
        }

        const guestData = await response.json();
        setGuests(Array.isArray(guestData) ? guestData : []);
      } catch (error) {
        console.error('Failed to fetch coordinator guest registry:', error);
        setGuests([]);
      } finally {
        setLoadingGuests(false);
      }
    };

    fetchGuests();
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
  const guestInvited = guests.length;
  const guestConfirmed = guests.filter((guest) => guest.status === 'Confirmed').length;
  const guestCheckedIn = guests.filter((guest) => guest.checkedIn).length;
  const guestPct = guestInvited > 0 ? (guestConfirmed / guestInvited) * 100 : 0;
  const guestCheckInPct = guestInvited > 0 ? Math.round((guestCheckedIn / guestInvited) * 100) : 0;
  const filteredGuests = guests.filter((guest) => {
    const query = guestSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (guest.name || '').toLowerCase().includes(query) ||
      (guest.email || '').toLowerCase().includes(query) ||
      buildGuestCode(guest).toLowerCase().includes(query);
    const matchesStatus = guestStatusFilter === 'All' || guest.status === guestStatusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const persistGuestPatch = async (guestId: string, payload: Record<string, unknown>) => {
    if (!user) return false;

    setActingGuestId(guestId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/coordinator/guest-registry', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId: id,
          guestId,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update guest.');
      }

      const updatedGuest = await response.json();
      setGuests((prev) => prev.map((guest) => (guest._id === guestId ? updatedGuest : guest)));
      setSelectedGuest((current) => (current?._id === guestId ? updatedGuest : current));
      setGuestPendingRemoval((current) => (current?._id === guestId ? updatedGuest : current));
      return true;
    } catch (error) {
      console.error('Failed to update guest:', error);
      return false;
    } finally {
      setActingGuestId(null);
    }
  };

  const handleGuestStatusChange = async (guestId: string, status: GuestStatus) => {
    await persistGuestPatch(guestId, { status });
  };

  const handleGuestRemoval = async (guest: GuestRecord) => {
    if (!user) return;

    setActingGuestId(guest._id);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        `/api/coordinator/guest-registry?eventId=${encodeURIComponent(id)}&guestId=${encodeURIComponent(guest._id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove guest.');
      }

      setGuests((prev) => prev.filter((entry) => entry._id !== guest._id));
      setGuestPendingRemoval(null);
      setSelectedGuest((current) => (current?._id === guest._id ? null : current));
    } catch (error) {
      console.error('Failed to remove guest:', error);
    } finally {
      setActingGuestId(null);
    }
  };

  const handleGuestSubmit = async () => {
    if (!user || !guestForm.name.trim()) return;

    setSubmittingGuest(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/coordinator/guest-registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId: id,
          name: guestForm.name.trim(),
          email: guestForm.email.trim(),
          tier: guestForm.tier,
          status: guestForm.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guest.');
      }

      const createdGuest = await response.json();
      setGuests((prev) => [createdGuest, ...prev]);
      setGuestForm(createGuestFormState());
      setIsGuestModalOpen(false);
    } catch (error) {
      console.error('Failed to create guest:', error);
    } finally {
      setSubmittingGuest(false);
    }
  };

  const handleSendGuestLink = async (guest: GuestRecord) => {
    if (!guest.email?.trim()) return;

    const code = buildGuestCode(guest);
    const guestName = guest.name?.trim() || 'Guest';
    const subject = `RSVP Code for ${event?.title || 'Your Event Invitation'}`;
    const body = encodeURIComponent(`Hi ${guestName},\n\nYour RSVP code is ${code}.`);

    window.location.href = `mailto:${guest.email.trim()}?subject=${encodeURIComponent(subject)}&body=${body}`;
    setCopiedGuestId(guest._id);
    window.setTimeout(() => {
      setCopiedGuestId((current) => (current === guest._id ? null : current));
    }, 1800);
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
            <div className="pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
              <div>
                <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                  <Users size={24} className="text-[#a1a1aa]" /> Guest Registry
                </h3>
                <p className="text-sm font-semibold text-[#71717a] mt-2">Guest confirmation totals are sourced from the live registry.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGuestForm(createGuestFormState());
                    setIsGuestModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1d1d1f] text-white text-[12px] font-black tracking-wide hover:bg-[#2a2a2d] transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  Add Guest
                </button>
                <Link
                  href={`/coordinator/events/${id}/scan`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f4c41d] text-[#1d1d1f] text-[12px] font-black tracking-wide hover:bg-[#e8b200] transition-colors shadow-sm"
                >
                  <QrCode size={14} />
                  Scan QR
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-[14px] border border-gray-100 border-l-4 border-l-[#f4c41d] p-5 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8] mb-2">Total Guests</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-[#1d1d1f] leading-none">{guestInvited}</span>
                  <span className="text-[11px] font-bold text-[#d4a017] pb-1">{guestInvited === 0 ? 'Registry empty' : 'Live total'}</span>
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-gray-100 border-l-4 border-l-[#1d1d1f] p-5 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8] mb-2">Confirmed Count</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-[#1d1d1f] leading-none">{guestConfirmed}</span>
                  <span className="text-[11px] font-medium text-[#94a3b8] pb-1">{guestPct.toFixed(1)}% Ratio</span>
                </div>
              </div>

              <div className="bg-white rounded-[14px] border border-gray-100 border-l-4 border-l-[#f4c41d] p-5 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8] mb-2">Codes Used</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-[#1d1d1f] leading-none">{guestCheckInPct}%</span>
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#f4c41d] transition-all" style={{ width: `${guestCheckInPct}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100">
                <h4 className="text-[15px] font-black text-[#1d1d1f] uppercase tracking-widest">Guest Registry</h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Search guest..."
                      className="w-full sm:w-60 pl-11 pr-4 py-3 bg-[#fbfbfb] border border-gray-200 rounded-xl text-[13px] font-medium text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#f4c41d]/30 focus:border-[#f4c41d] transition-all"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={guestStatusFilter}
                      onChange={(e) => setGuestStatusFilter(e.target.value as 'All' | GuestStatus)}
                      className="appearance-none min-w-[150px] px-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#f4c41d]/30 focus:border-[#f4c41d]"
                    >
                      <option value="All">All Status</option>
                      {guestStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">⌄</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] table-fixed">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#fcfcfc]">
                      <th className="w-[28%] px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Guest</th>
                      <th className="w-[18%] px-5 py-4 text-center text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">RSVP Code</th>
                      <th className="w-[18%] px-5 py-4 text-center text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Status</th>
                      <th className="w-[36%] px-5 py-4 text-center text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingGuests ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center">
                          <div className="inline-flex items-center gap-3 text-sm font-medium text-[#71717a]">
                            <Loader2 size={18} className="animate-spin text-[#d4a017]" />
                            Loading guest registry...
                          </div>
                        </td>
                      </tr>
                    ) : filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-[#71717a]">
                          No guests match the current search and status filters.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => {
                        const statusTone = getGuestStatusTone(guest.status);
                        const isActing = actingGuestId === guest._id;
                        const hasEmail = Boolean(guest.email?.trim());

                        return (
                          <tr key={guest._id} className="border-b border-gray-100 last:border-b-0 hover:bg-[#fcfcfc] transition-colors">
                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border border-gray-200 flex items-center justify-center text-[13px] font-black text-[#475569]">
                                  {getInitials(guest.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[15px] font-bold text-[#1d1d1f]">{guest.name || 'Unnamed Guest'}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#7c3aed]">
                                    <span className="font-medium text-[#7c3aed]">{guest.tier || 'Standard'}</span>
                                    {guest.checkedIn && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                                        <Check size={12} />
                                        Checked In
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center align-middle">
                              <span className="inline-flex max-w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-[#f8fafc] px-3 py-1.5 font-mono text-[11px] text-[#64748b]">
                                {buildGuestCode(guest)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center align-middle">
                              <span className={`inline-flex items-center justify-center gap-2 text-[14px] font-medium ${statusTone.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`}></span>
                                {guest.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => setSelectedGuest(guest)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                  <Eye size={12} />
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  disabled={isActing || hasEmail}
                                  onClick={() => handleGuestStatusChange(guest._id, 'Confirmed')}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Check size={12} />
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  disabled={isActing || hasEmail}
                                  onClick={() => handleGuestStatusChange(guest._id, 'Declined')}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <X size={12} />
                                  Decline
                                </button>
                                <button
                                  type="button"
                                  disabled={isActing || !hasEmail}
                                  onClick={() => handleSendGuestLink(guest)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] font-bold text-sky-600 hover:bg-sky-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Link2 size={12} />
                                  {copiedGuestId === guest._id ? 'Opened' : 'Send Link'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[540px] rounded-[18px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-visible">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Guest</h3>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mt-1">Guest registry setup</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close guest modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#eebf43] focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="guest@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GuestModalSelect
                    label="Tier"
                    value={guestForm.tier}
                    options={guestTierSelectOptions}
                    onChange={(next) => setGuestForm((prev) => ({ ...prev, tier: next }))}
                  />
                </div>

                <div>
                  <GuestModalSelect
                    label="Initial Status"
                    value={guestForm.status}
                    options={guestStatusSelectOptions}
                    onChange={(next) => setGuestForm((prev) => ({ ...prev, status: next as GuestStatus }))}
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 px-6 pb-5 mt-0 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingGuest || !guestForm.name.trim()}
                onClick={handleGuestSubmit}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
              >
                {submittingGuest ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[640px] rounded-[18px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Guest Details</h3>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mt-1">View guest information</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close guest details modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">Full Name</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1d1d1f] text-[15px] font-bold">
                    {selectedGuest.name?.trim() || 'Unnamed Guest'}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1d1d1f] text-[15px] font-bold break-all">
                    {selectedGuest.email?.trim() || 'No email added'}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">Tier</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1d1d1f] text-[15px] font-bold">
                    {selectedGuest.tier || 'Standard'}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">Status</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className={`inline-flex items-center gap-2 text-[15px] font-bold ${getGuestStatusTone(selectedGuest.status).text}`}>
                      <span className={`h-2 w-2 rounded-full ${getGuestStatusTone(selectedGuest.status).dot}`}></span>
                      {selectedGuest.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">RSVP Code</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[15px] text-[#64748b]">
                  {buildGuestCode(selectedGuest)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-widest mb-1.5">Notes</label>
                <div className="min-h-[128px] w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] leading-relaxed text-[#71717a] italic">
                  {selectedGuest.notes?.trim() || 'No notes added'}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                disabled={actingGuestId === selectedGuest._id}
                onClick={() => setGuestPendingRemoval(selectedGuest)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ffcab8] bg-white px-5 py-3 text-[12px] font-extrabold text-[#f05a28] hover:bg-[#fff5f1] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Remove Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {guestPendingRemoval && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[540px] rounded-[18px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Remove Guest</h3>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mt-1">Guest registry update</p>
              </div>
              <button
                type="button"
                onClick={() => setGuestPendingRemoval(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close guest removal modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm font-medium text-[#71717a] leading-relaxed">
                Remove <span className="font-bold text-[#1d1d1f]">{guestPendingRemoval.name || 'this guest'}</span> from the registry? This will also update the live guest totals for the event.
              </p>
            </div>

            <div className="pt-5 px-6 pb-5 mt-0 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setGuestPendingRemoval(null)}
                className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actingGuestId === guestPendingRemoval._id}
                onClick={() => handleGuestRemoval(guestPendingRemoval)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all"
              >
                {actingGuestId === guestPendingRemoval._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Remove Guest
              </button>
            </div>
          </div>
        </div>
      )}

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
