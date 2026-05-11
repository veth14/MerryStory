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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import Modal from '@/components/ui/Modal';

type EventRecord = {
  _id: string;
  title?: string;
  type?: string;
  date?: string;
  location?: string;
  status?: string;
  initialAlert?: string;
  coverImageUrl?: string;
  guests?: {
    invited?: number;
    rsvp?: number;
    checkedIn?: number;
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
  eventTitle?: string;
  eventType?: string;
  eventLocation?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  taskType?: 'event' | 'production';
  taskTypeLabel?: string;
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
  /** Set when the guest completes the public RSVP flow (one-time code consumed). */
  usedAt?: string | null;
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

const normalizeTaskPriority = (value?: string) => {
  const normalized = (value || '').toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'CRITICAL') return 'CRITICAL';
  if (normalized === 'HIGH') return 'HIGH';
  if (normalized === 'MEDIUM') return 'MEDIUM';
  if (normalized === 'LOW') return 'LOW';
  return '';
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
  const priority = normalizeTaskPriority(task.priority);
  const status = normalizeTaskStatus(task.status);

  if (status === 'COMPLETED') {
    return {
      label: 'Completed',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (priority === 'CRITICAL') {
    return {
      label: 'Critical Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (priority === 'HIGH') {
    return {
      label: 'High Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-[#d4a017] bg-[#fff9e6] px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (priority === 'MEDIUM') {
    return {
      label: 'Medium Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (priority === 'LOW') {
    return {
      label: 'Low Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (!priority) {
    return {
      label: 'No Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-[#71717a] bg-[#f4f4f5] px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  const dueDate = task.due?.date ? new Date(`${task.due.date}T${task.due.time || '00:00'}:00`) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
    return {
      label: 'Overdue',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2',
    };
  }

  if (!priority) {
    return {
      label: 'No Priority',
      classes: 'inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-[#71717a] bg-[#f4f4f5] px-2.5 py-1.5 rounded-lg mb-2',
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

const validateEmail = (email: string): boolean => {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isEventDatePassed = (eventDate?: string): boolean => {
  if (!eventDate) return false;

  try {
    const parsedEventDate = /^\d{4}-\d{2}-\d{2}/.test(eventDate)
      ? new Date(`${eventDate.slice(0, 10)}T00:00:00`)
      : new Date(eventDate);

    if (Number.isNaN(parsedEventDate.getTime())) return false;

    const absentCutoff = new Date(parsedEventDate);
    absentCutoff.setHours(0, 0, 0, 0);
    absentCutoff.setDate(absentCutoff.getDate() + 1);

    return new Date() >= absentCutoff;
  } catch {
    return false;
  }
};

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

const GUESTS_PER_PAGE = 5;
const TASKS_PER_PAGE = 5;

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

function GuestAddModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (form: GuestFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<GuestFormState>(createGuestFormState());
  const [emailError, setEmailError] = useState('');

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (!validateEmail(form.email)) {
      setEmailError('Invalid email format');
      return;
    }
    setEmailError('');
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="md"
      actions={(
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !validateEmail(form.email)}
            className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20 disabled:opacity-70 transition-all inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Add Guest
          </button>
        </div>
      )}
    >
      <div>
        <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">Add New <span className="text-[#facc15] italic">Guest</span></h2>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">Guest Registry Addition</p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                setEmailError('');
              }}
              placeholder="guest@example.com"
              className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-[14px] font-bold outline-none transition-all ${
                emailError ? 'border-rose-500 focus:border-rose-500' : 'border-gray-100 focus:border-[#facc15]'
              }`}
            />
            {emailError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{emailError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GuestModalSelect label="Tier" value={form.tier} options={guestTierSelectOptions} onChange={(next) => setForm((prev) => ({ ...prev, tier: next }))} />
            <GuestModalSelect
              label="Initial Status"
              value={form.status}
              options={guestStatusSelectOptions}
              onChange={(next) => setForm((prev) => ({ ...prev, status: next as GuestStatus }))}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function LinkSentModal({
  guest,
  onClose,
}: {
  guest: GuestRecord | null;
  onClose: () => void;
}) {
  if (!guest) return null;

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="md" actions={(
      <div>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20 transition-all hover:bg-[#dcae32]"
        >
          Done
        </button>
      </div>
    )}>
      <div>
        <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">Link <span className="text-[#facc15] italic">Sent</span></h2>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">RSVP Invitation Delivery</p>

        <div className="space-y-6 mb-10">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Check className="text-emerald-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-[12px] font-black text-emerald-900 uppercase tracking-widest">Successfully Sent</p>
              <p className="text-[11px] text-emerald-700 mt-1">RSVP link has been delivered</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Guest Details</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Name</p>
                <p className="text-[14px] font-bold text-gray-900">{guest.name || 'Unnamed Guest'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</p>
                <p className="text-[14px] font-bold text-gray-900 break-all">{guest.email || 'No email'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
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
  const [productionTasks, setProductionTasks] = useState<TaskRecord[]>([]);
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
  const [submittingGuest, setSubmittingGuest] = useState(false);
  const [actingGuestId, setActingGuestId] = useState<string | null>(null);
  const [isLinkSentModalOpen, setIsLinkSentModalOpen] = useState(false);
  const [linkSentGuest, setLinkSentGuest] = useState<GuestRecord | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [guestPendingRemoval, setGuestPendingRemoval] = useState<GuestRecord | null>(null);
  const [guestPage, setGuestPage] = useState(1);
  const [expandedTaskStaff, setExpandedTaskStaff] = useState<Set<string>>(new Set());
  const [pendingTasksPage, setPendingTasksPage] = useState(1);
  const [productionTasksPage, setProductionTasksPage] = useState(1);
  const [finishedTasksPage, setFinishedTasksPage] = useState(1);
  const { id } = use(params);

  useEffect(() => {
    const modalOpen = Boolean(
      isGuestModalOpen ||
      isLinkSentModalOpen ||
      selectedGuest ||
      guestPendingRemoval ||
      confirmTask
    );

    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isGuestModalOpen, isLinkSentModalOpen, selectedGuest, guestPendingRemoval, confirmTask]);

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

        const [eventRes, taskHubRes, staffRes] = await Promise.all([
          fetch(`/api/events/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/coordinator/task-hub?eventId=${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/staff', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        const [eventData, taskHubData, staffData] = await Promise.all([
          eventRes.ok ? eventRes.json() : null,
          taskHubRes.ok ? taskHubRes.json() : { eventTasks: [], productionTasks: [] },
          staffRes.ok ? staffRes.json() : { users: [] },
        ]);

        setEvent(eventData);
        setTasks(Array.isArray(taskHubData?.eventTasks) ? taskHubData.eventTasks : []);
        setProductionTasks(Array.isArray(taskHubData?.productionTasks) ? taskHubData.productionTasks : []);
        setDirectory(Array.isArray(staffData?.users) ? staffData.users : []);
      } catch (error) {
        console.error('Failed to fetch coordinator event details:', error);
        setEvent(null);
        setTasks([]);
        setProductionTasks([]);
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
    return [...tasks, ...productionTasks].map((task) => {
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
  }, [productionTasks, tasks, userLookup]);

  const pendingEventTasks = useMemo(
    () => enrichedTasks.filter((task) => task.taskType !== 'production' && normalizeTaskStatus(task.status) !== 'COMPLETED'),
    [enrichedTasks]
  );

  const pendingProductionTasks = useMemo(
    () => enrichedTasks.filter((task) => task.taskType === 'production' && normalizeTaskStatus(task.status) !== 'COMPLETED'),
    [enrichedTasks]
  );

  const finishedTasks = useMemo(
    () => enrichedTasks.filter((task) => normalizeTaskStatus(task.status) === 'COMPLETED'),
    [enrichedTasks]
  );

  const completedTasks = finishedTasks.length;
  const totalAssignedTasks = tasks.length + productionTasks.length;
  const taskCompletionPct = totalAssignedTasks > 0 ? (completedTasks / totalAssignedTasks) * 100 : 0;
  const guestInvited = guests.length;
  const guestConfirmed = guests.filter((guest) => guest.status === 'Confirmed').length;
  const guestCodesUsed = guests.filter((guest) => Boolean(guest.usedAt)).length;
  const guestPct = guestInvited > 0 ? (guestConfirmed / guestInvited) * 100 : 0;
  const guestCodesUsedPct = guestInvited > 0 ? Math.round((guestCodesUsed / guestInvited) * 100) : 0;
  const filteredGuests = useMemo(
    () =>
      guests.filter((guest) => {
        const query = guestSearch.trim().toLowerCase();
        const matchesSearch =
          !query ||
          (guest.name || '').toLowerCase().includes(query) ||
          (guest.email || '').toLowerCase().includes(query) ||
          buildGuestCode(guest).toLowerCase().includes(query);
        const matchesStatus = guestStatusFilter === 'All' || guest.status === guestStatusFilter;
        return matchesSearch && matchesStatus;
      }),
    [guestSearch, guestStatusFilter, guests]
  );
  const totalGuestPages = Math.max(1, Math.ceil(filteredGuests.length / GUESTS_PER_PAGE));
  const paginatedGuests = useMemo(() => {
    const startIndex = (guestPage - 1) * GUESTS_PER_PAGE;
    return filteredGuests.slice(startIndex, startIndex + GUESTS_PER_PAGE);
  }, [filteredGuests, guestPage]);
  const guestRowPlaceholders = Math.max(0, GUESTS_PER_PAGE - paginatedGuests.length);

  useEffect(() => {
    setGuestPage(1);
  }, [guestSearch, guestStatusFilter]);

  useEffect(() => {
    if (guestPage > totalGuestPages) {
      setGuestPage(totalGuestPages);
    }
  }, [guestPage, totalGuestPages]);

  const updateTaskLocally = (taskId: string, taskType: TaskRecord['taskType'], updater: (task: TaskRecord) => TaskRecord) => {
    if (taskType === 'production') {
      setProductionTasks((prev) => prev.map((task) => (task._id === taskId ? updater(task) : task)));
      return;
    }

    setTasks((prev) => prev.map((task) => (task._id === taskId ? updater(task) : task)));
  };

  const persistTaskPatch = async (task: TaskRecord, payload: Record<string, unknown>) => {
    if (!user) return false;

    setUpdatingTaskId(task._id);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(task.taskType === 'production' ? '/api/admin/event-day' : '/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          taskObjectId: task._id,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task.');
      }

      const updatedTask = await response.json();
      updateTaskLocally(task._id, task.taskType, (currentTask) => ({
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
    const success = await persistTaskPatch(confirmTask, { status: 'COMPLETED' });
    if (success) {
      setConfirmTask(null);
    }
  };

  const handleAddStaff = async (task: TaskRecord, staffName: string) => {
    const currentAssignees = normalizeAssigneeNames(task);
    if (currentAssignees.includes(staffName)) return;

    const success = await persistTaskPatch(task, {
      assignees: [...currentAssignees, staffName],
    });

    if (success) {
      setAssigningTaskId(null);
    }
  };

  const handleRemoveStaff = async (task: TaskRecord, staffName: string) => {
    const currentAssignees = normalizeAssigneeNames(task);
    const nextAssignees = currentAssignees.filter((name) => name !== staffName);
    await persistTaskPatch(task, {
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

  const handleGuestStatusChange = async (guest: GuestRecord, status: GuestStatus) => {
    if (status === 'Confirmed') {
      await persistGuestPatch(guest._id, { status });
      return;
    }
    await persistGuestPatch(guest._id, {
      status,
      usedAt: null,
      qrScannedAt: null,
    });
  };

  /** Door check-in for email-less guests confirmed manually (no QR ticket from email flow). */
  const handleGuestCheckIn = async (guest: GuestRecord) => {
    if (!guest.checkedIn) {
      await persistGuestPatch(guest._id, {
        qrScannedAt: new Date().toISOString(),
      });
    }
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

  const handleGuestSubmit = async (guestForm: GuestFormState) => {
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
      if (guestForm.email.trim()) {
        await fetch('/api/coordinator/guest-registry/send-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            eventId: id,
            guestId: createdGuest._id,
          }),
        });
      }
      setGuests((prev) => [createdGuest, ...prev]);
      setIsGuestModalOpen(false);
    } catch (error) {
      console.error('Failed to create guest:', error);
    } finally {
      setSubmittingGuest(false);
    }
  };

  const handleSendGuestLink = async (guest: GuestRecord) => {
    if (!guest.email?.trim() || !user) return;

    setActingGuestId(guest._id);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/coordinator/guest-registry/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId: id,
          guestId: guest._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send guest RSVP link.');
      }

      setLinkSentGuest(guest);
      setIsLinkSentModalOpen(true);
    } catch (error) {
      console.error('Failed to send RSVP invite:', error);
    } finally {
      setActingGuestId(null);
    }
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
    isFinishedSection: boolean,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.max(1, Math.ceil(sectionTasks.length / TASKS_PER_PAGE));
    const paginatedTasks = sectionTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE);

    return (
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

        {paginatedTasks.map((task) => {
          const isStaffExpanded = expandedTaskStaff.has(task._id);
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
                      {task.taskType === 'production' && (
                        <span className="inline-flex mb-2 items-center rounded-full border border-[#eebf43]/30 bg-[#fff9e6] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#d4a017]">
                          Production
                        </span>
                      )}
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
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTaskStaff((prev) => {
                      const next = new Set(prev);
                      if (next.has(task._id)) {
                        next.delete(task._id);
                      } else {
                        next.add(task._id);
                      }
                      return next;
                    });
                  }}
                  className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-3 hover:text-[#1d1d1f] transition-colors"
                >
                  <Users size={12} />
                  Assigned Staff
                  <span className="text-[#d4a017]">{task.assigneesResolved.length}</span>
                  <ChevronDown size={14} className={`transition-transform ${isStaffExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isStaffExpanded && (
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
                )}

                {!isDone && isStaffExpanded && (
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

      {sectionTasks.length > TASKS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span className="text-xs font-bold text-[#71717a]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19l7-7-7-7"></path></svg>
          </button>
        </div>
      )}
    </div>
  );
  };

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
          <div className="mb-8 border-b-2 border-gray-100 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
            <button
              onClick={() => handleTabChange('overview')}
              className={`shrink-0 py-5 px-6 text-sm font-black tracking-wide border-b-2 transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'overview' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Calendar size={16} /> Schedule & Info
            </button>
            <button
              onClick={() => handleTabChange('tasks')}
              className={`shrink-0 py-5 px-6 text-sm font-black tracking-wide border-b-2 transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'tasks' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <ClipboardCheck size={16} /> Assigned Tasks
              <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-200 text-gray-500'}`}>{pendingEventTasks.length + pendingProductionTasks.length}</span>
            </button>
            <button
              onClick={() => handleTabChange('rsvp')}
              className={`shrink-0 py-5 px-6 text-sm font-black tracking-wide border-b-2 transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'rsvp' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Users size={16} /> Guest List
            </button>
            </div>
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
                        <span className="text-sm font-bold text-[#71717a]">/ {totalAssignedTasks}</span>
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
                  'Production Directives',
                  'Production directives come from the live event-day schedule and appear here whenever you are assigned to them for this event.',
                  pendingProductionTasks,
                  false,
                  productionTasksPage,
                  setProductionTasksPage
                )}
                {renderTaskSection(
                  'Pending Directives',
                  'Mark tasks as finished after reviewing the confirmation modal and coordinate staff support when needed.',
                  pendingEventTasks,
                  false,
                  pendingTasksPage,
                  setPendingTasksPage
                )}
                {renderTaskSection(
                  'Finished Directives',
                  'Completed tasks stay visible here so progress is clear and immediately reflected in your event KPIs.',
                  finishedTasks,
                  true,
                  finishedTasksPage,
                  setFinishedTasksPage
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
                    setIsGuestModalOpen(true);
                  }}
                  className="inline-flex min-w-[142px] items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1d1d1f] text-white text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#2a2a2d] transition-colors shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  Add Guest
                </button>
                <Link
                  href={`/coordinator/events/${id}/scan`}
                  className="inline-flex min-w-[142px] items-center justify-center gap-2 rounded-xl bg-[#eebf43] px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-md shadow-[#eebf43]/20 transition-colors hover:bg-[#dcae32] shrink-0"
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
                  <span className="text-4xl font-black text-[#1d1d1f] leading-none">{guestCodesUsedPct}%</span>
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#f4c41d] transition-all" style={{ width: `${guestCodesUsedPct}%` }}></div>
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Guest</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">RSVP Code</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingGuests ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#71717a]">
                          <div className="inline-flex items-center gap-2 font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading guests...
                          </div>
                        </td>
                      </tr>
                    ) : filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#71717a]">
                          No guests found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedGuests.map((guest) => {
                        const statusTone = getGuestStatusTone(guest.status);
                        const isActing = actingGuestId === guest._id;
                        const hasEmail = Boolean(guest.email?.trim());

                        return (
                          <tr 
                            key={guest._id} 
                            onClick={() => setSelectedGuest(guest)}
                            className="group hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#71717a] text-xs font-bold shadow-sm">
                                  {getInitials(guest.name)}
                                </div>
                                <div>
                                  <p className="text-[#1d1d1f] font-bold text-sm">{guest.name || 'Unnamed Guest'}</p>
                                  <p className="text-[#71717a] text-[11px]">{guest.email || 'No email'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="inline-flex py-1.5 px-3 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase">
                                {buildGuestCode(guest)}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${statusTone.dot}`}></span>
                                <span className="text-[#3f3f46] text-xs font-semibold">{guest.status || 'Pending'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                              {guest.checkedIn ? (
                                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-white shadow-sm shadow-emerald-500/20">
                                  <Check size={13} />
                                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">Checked In</span>
                                </div>
                              ) : event && isEventDatePassed(event.date) ? (
                                <div className="inline-flex items-center gap-2 rounded-full bg-gray-500 px-5 py-3 text-white shadow-sm shadow-gray-500/20">
                                  <X size={13} />
                                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">Absent</span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {!hasEmail && guest.status === 'Confirmed' ? (
                                    <button
                                      type="button"
                                      disabled={isActing}
                                      onClick={() => handleGuestCheckIn(guest)}
                                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <UserCheck size={13} />
                                      Check In
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isActing || hasEmail}
                                        onClick={() => handleGuestStatusChange(guest, 'Confirmed')}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Check size={13} />
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isActing || hasEmail}
                                        onClick={() => handleGuestStatusChange(guest, 'Declined')}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <X size={13} />
                                        Decline
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isActing || !hasEmail}
                                        onClick={() => handleSendGuestLink(guest)}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Link2 size={13} />
                                        Send Link
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-gray-50 bg-[#fafafa]/50 rounded-b-xl">
                <span className="text-xs text-[#a1a1aa] font-medium">Showing {filteredGuests.length} of {filteredGuests.length} Guests</span>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    disabled={guestPage === 1}
                    onClick={() => setGuestPage((current) => Math.max(1, current - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eebf43] text-[#1d1d1f] font-bold text-xs shadow-sm shadow-[#eebf43]/20">
                    {guestPage}
                  </button>
                  <button 
                    type="button"
                    disabled={guestPage >= totalGuestPages}
                    onClick={() => setGuestPage((current) => Math.min(totalGuestPages, current + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19l7-7-7-7"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGuestModalOpen && (
        <GuestAddModal
          submitting={submittingGuest}
          onClose={() => setIsGuestModalOpen(false)}
          onSubmit={handleGuestSubmit}
        />
      )}

      {isLinkSentModalOpen && (
        <LinkSentModal
          guest={linkSentGuest}
          onClose={() => {
            setIsLinkSentModalOpen(false);
            setLinkSentGuest(null);
          }}
        />
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[22px] sm:text-[24px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Details</span></h3>
                <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-gray-400">View Guest Information</p>
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

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                  <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-[13px] sm:text-[14px] font-bold text-gray-900">
                    {selectedGuest.name?.trim() || 'Unnamed Guest'}
                  </div>
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                  <div className="w-full break-all rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-[13px] sm:text-[14px] font-bold text-gray-900">
                    {selectedGuest.email?.trim() || 'No email added'}
                  </div>
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Tier</label>
                  <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-[13px] sm:text-[14px] font-bold text-gray-900">
                    {selectedGuest.tier || 'Standard'}
                  </div>
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
                  <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5">
                    <span className={`inline-flex items-center gap-2 text-[13px] sm:text-[14px] font-bold ${getGuestStatusTone(selectedGuest.status).text}`}>
                      <span className={`h-2 w-2 rounded-full ${getGuestStatusTone(selectedGuest.status).dot}`}></span>
                      {selectedGuest.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">RSVP Code</label>
                <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 font-mono text-[13px] sm:text-[14px] text-[#64748b]">
                  {buildGuestCode(selectedGuest)}
                </div>
              </div>

              <div>
                <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</label>
                <div className="min-h-[112px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-[13px] sm:text-[14px] leading-relaxed text-[#71717a] italic">
                  {selectedGuest.notes?.trim() || 'No notes added'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="flex-1 py-3.5 text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-gray-400"
              >
                Close
              </button>
              <button
                type="button"
                disabled={actingGuestId === selectedGuest._id}
                onClick={() => setGuestPendingRemoval(selectedGuest)}
                className="flex-1 py-3.5 bg-[#facc15] text-white text-[11px] sm:text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20 transition-all inline-flex items-center justify-center gap-2 hover:bg-[#dcae32] disabled:cursor-not-allowed disabled:opacity-50"
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
