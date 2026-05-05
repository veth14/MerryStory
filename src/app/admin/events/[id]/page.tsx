'use client';
import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Calendar, MapPin, Users, DollarSign, Briefcase, AlertTriangle, User, Tag, Loader2, CheckCircle2, Plus, Minus, Mail, Phone, X, Search, UserPlus, Check, QrCode, Link2, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';
import PostEventView from '@/components/admin/events/PostEventView';
import EventDayScheduleModal from './EventDayScheduleModal';
import type { StaffOption, VendorOption } from '@/app/admin/tasks/CreateTaskModal';

interface EventData {
  _id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  budget: { total: number; utilized: number };
  vendors: { total: number; secured: number };
  guests: { invited: number; rsvp: number; checkedIn: number };
  health: number;
  status: string;
  leadAssigned: string;
  leadAvatarUrl?: string;
  team?: { name: string, role: string, avatarUrl?: string }[];
  milestones?: { title: string, category: string, date: string, status: string }[];
  initialAlert?: string;
  client: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  coverImageUrl?: string;
}

interface GuestData {
  _id: string;
  guestName?: string;
  name?: string;
  email: string;
  phone: string;
  status: 'Confirmed' | 'Pending' | 'Declined';
  tableNo: string;
  plusOne: boolean;
  checkedIn: boolean;
  qrScannedAt?: string | null;
  usedAt?: string | null;
}

type NormalizedGuestData = GuestData & {
  normalizedRsvpStatus: 'Confirmed' | 'Pending' | 'Declined';
  attendanceStatus: 'Checked In' | 'Absent' | 'Pending' | 'Declined';
  isCheckedIn: boolean;
};

type OptionRecord = {
  uid?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  appRole?: string;
  avatarUrl?: string | null;
  category?: string;
  vendorName?: string;
  company?: string;
  businessName?: string;
  title?: string;
  serviceCategory?: string;
  vendorCategory?: string;
  serviceType?: string;
  type?: string;
};

interface ProdTaskData {
  _id: string;
  taskId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: {
    date?: string;
    time?: string;
  };
  assignee?: {
    name?: string;
  };
  assignees?: { name?: string }[];
  vendor?: {
    name?: string;
  };
}

interface EventTaskData {
  _id?: string;
  status?: string;
}

const extractStaff = (payload: any): StaffOption[] => {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : [];

  return records
    .map((record: OptionRecord) => {
      const name = record?.name?.trim() || `${record?.firstName || ''} ${record?.lastName || ''}`.trim();
      if (!name) return null;

      return {
        uid: record.uid || name,
        name,
        role: record.role || 'PRODUCTION STAFF',
        appRole: record.appRole || 'staff',
        avatarUrl: record.avatarUrl || null,
      };
    })
    .filter((record): record is StaffOption => Boolean(record));
};

const extractVendorOptions = (payload: any): VendorOption[] => {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.vendors) ? payload.vendors : [];

  return records
    .map((record: OptionRecord | string) => {
      if (typeof record === 'string') {
        const normalized = record.trim();
        return normalized ? { name: normalized, category: '' } : null;
      }

      const name =
        record?.name?.trim() ||
        record?.vendorName?.trim() ||
        record?.company?.trim() ||
        record?.businessName?.trim() ||
        record?.title?.trim() ||
        `${record?.firstName || ''} ${record?.lastName || ''}`.trim();
      if (!name) return null;

      return {
        name,
        category:
          record.category?.trim() ||
          record.serviceCategory?.trim() ||
          record.vendorCategory?.trim() ||
          record.serviceType?.trim() ||
          record.type?.trim() ||
          '',
      };
    })
    .filter((record): record is VendorOption => Boolean(record));
};

const toDateInputValue = (value: string | Date) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

const formatTimeLabel = (value?: string) => {
  if (!value) return 'Time TBD';

  const [hoursValue, minutesValue] = value.split(':');
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHour = hours % 12 || 12;
  return `${String(normalizedHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const getGuestName = (guest: GuestData) => guest.guestName || guest.name || 'Unnamed Guest';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'NA';

const isCompletedTask = (status?: string) => ['DONE', 'COMPLETED'].includes(String(status || '').toUpperCase());

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

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      if (!calculateTime()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 animate-pulse">Production Live</span>;

  return (
    <div className="flex gap-3 items-center">
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds }
      ].map((item) => (
        <div key={item.label} className="bg-white/50 backdrop-blur-sm px-5 py-4 rounded-2xl border border-gray-100 shadow-sm text-center min-w-[56px]">
          <div className="text-[28px] font-black text-gray-900 leading-none tabular-nums tracking-tighter">{String(item.value).padStart(2, '0')}</div>
          <div className="text-[9px] font-black text-[#d4a017] uppercase tracking-[0.1em] mt-2">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pre-event');
  const [error, setError] = useState('');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', category: 'Project Start' });
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [prodTasks, setProdTasks] = useState<ProdTaskData[]>([]);
  const [eventTasks, setEventTasks] = useState<EventTaskData[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [isEventDayLoading, setIsEventDayLoading] = useState(false);
  const [eventDayError, setEventDayError] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingProdTask, setEditingProdTask] = useState<ProdTaskData | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestPage, setGuestPage] = useState(1);
  const [newGuest, setNewGuest] = useState({
    name: '', email: '', phone: '', status: 'Confirmed', tableNo: '', plusOne: false
  });

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error('Failed to fetch event details');

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error(err);
      setError('Could not load project data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/events/${id}/guests`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGuests(data);
      }
    } catch (err) {
      console.error("Failed to fetch guests", err);
    }
  };

  const fetchEventDayResources = async () => {
    try {
      setIsEventDayLoading(true);
      setEventDayError('');
      const idToken = await user!.getIdToken();

      const [prodTaskResponse, eventTaskResponse, staffResponse, vendorResponse] = await Promise.all([
        fetch(`/api/admin/event-day?eventId=${id}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch(`/api/tasks?eventId=${id}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch('/api/staff', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch('/api/vendors', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ]);

      if (!prodTaskResponse.ok) {
        throw new Error('Failed to fetch event-day timeline.');
      }

      const [prodTasksPayload, eventTasksPayload, staffPayload, vendorPayload] = await Promise.all([
        prodTaskResponse.json(),
        eventTaskResponse.ok ? eventTaskResponse.json() : Promise.resolve([]),
        staffResponse.ok ? staffResponse.json() : Promise.resolve([]),
        vendorResponse.ok ? vendorResponse.json() : Promise.resolve([]),
      ]);

      setProdTasks(Array.isArray(prodTasksPayload) ? prodTasksPayload : []);
      setEventTasks(Array.isArray(eventTasksPayload) ? eventTasksPayload : []);
      setStaffOptions(extractStaff(staffPayload));
      setVendorOptions(extractVendorOptions(vendorPayload));
    } catch (err) {
      console.error('Failed to fetch event-day resources', err);
      setEventDayError('Could not load the program timeline.');
    } finally {
      setIsEventDayLoading(false);
    }
  };

  const handleCreateProdTask = async (payload: {
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    assignees: string[];
    vendor: string;
  }) => {
    const idToken = await user!.getIdToken();
    const response = await fetch('/api/admin/event-day', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        eventId: id,
        ...payload,
      }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Failed to save schedule.');
    }

    setProdTasks((prev) =>
      [...prev, body].sort((first, second) => {
        const firstKey = `${first?.due?.date || ''} ${first?.due?.time || ''}`;
        const secondKey = `${second?.due?.date || ''} ${second?.due?.time || ''}`;
        return firstKey.localeCompare(secondKey);
      })
    );
  };

  const updateProdTaskStatus = async (task: ProdTaskData, nextStatus: string) => {
    const idToken = await user!.getIdToken();
    const response = await fetch('/api/admin/event-day', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        taskObjectId: task._id,
        status: nextStatus,
      }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Failed to update schedule.');
    }

    setProdTasks((prev) => prev.map((entry) => (entry._id === task._id ? body : entry)));
  };

  const handleSaveProdTask = async (payload: {
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    assignees: string[];
    vendor: string;
  }) => {
    if (!editingProdTask?._id) {
      await handleCreateProdTask(payload);
      return;
    }

    const idToken = await user!.getIdToken();
    const response = await fetch('/api/admin/event-day', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        taskObjectId: editingProdTask._id,
        ...payload,
      }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'Failed to update schedule.');
    }

    setProdTasks((prev) =>
      prev
        .map((entry) => (entry._id === editingProdTask._id ? body : entry))
        .sort((first, second) => {
          const firstKey = `${first?.due?.date || ''} ${first?.due?.time || ''}`;
          const secondKey = `${second?.due?.date || ''} ${second?.due?.time || ''}`;
          return firstKey.localeCompare(secondKey);
        })
    );
  };

  const toggleGuestCheckIn = async (guest: GuestData) => {
    const idToken = await user!.getIdToken();
    const response = await fetch(`/api/events/${id}/guests/${guest._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ checkedIn: !guest.checkedIn }),
    });

    if (!response.ok) {
      throw new Error('Failed to update guest check-in.');
    }

    setGuests((prev) => prev.map((entry) => (entry._id === guest._id ? { ...entry, checkedIn: !guest.checkedIn } : entry)));
    setEvent((prev) =>
      prev
        ? {
            ...prev,
            guests: {
              ...prev.guests,
              checkedIn: prev.guests.checkedIn + (guest.checkedIn ? -1 : 1),
            },
          }
        : prev
    );
  };

  const confirmGuest = async (guest: GuestData) => {
    const idToken = await user!.getIdToken();
    const response = await fetch(`/api/events/${id}/guests/${guest._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ status: 'Confirmed' }),
    });

    if (!response.ok) {
      throw new Error('Failed to confirm guest.');
    }

    setGuests((prev) => prev.map((entry) => (entry._id === guest._id ? { ...entry, status: 'Confirmed' } : entry)));
  };

  const sendGuestLink = async (guest: GuestData) => {
    if (!guest.email?.trim()) return;
    
    try {
      const idToken = await user!.getIdToken();
      // Implement send link API call here
      console.log('Sending RSVP link to:', guest.email);
      // You can show a success toast or modal here
    } catch (error) {
      console.error('Failed to send guest link:', error);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchEventDetails();
      fetchGuests();
    }
  }, [user, id]);

  // Real-time guest fetch on tab switch to event-day
  useEffect(() => {
    if (activeTab === 'event-day' && user && id) {
      fetchGuests();
      fetchEventDayResources();
    }
  }, [activeTab, user, id]);

  useEffect(() => {
    if (activeTab !== 'event-day' || !user || !id) return;

    const refreshGuests = () => {
      fetchGuests();
    };

    const intervalId = window.setInterval(refreshGuests, 15000);
    window.addEventListener('focus', refreshGuests);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshGuests);
    };
  }, [activeTab, user, id]);

  const productionDate = event ? toDateInputValue(event.date) : '';
  const todayDate = toDateInputValue(new Date());

  const normalizedGuests = useMemo<NormalizedGuestData[]>(() => {
    const eventHasPassed = isEventDatePassed(event?.date);

    return guests.map((guest) => {
      const statusValue = String(guest?.status || '').toLowerCase();
      const normalizedRsvpStatus =
        statusValue === 'confirmed' ? 'Confirmed' : statusValue === 'declined' ? 'Declined' : 'Pending';
      const isCheckedIn = Boolean(guest?.checkedIn || guest?.qrScannedAt);
      const attendanceStatus = isCheckedIn
        ? 'Checked In'
        : normalizedRsvpStatus === 'Confirmed' && eventHasPassed
          ? 'Absent'
          : normalizedRsvpStatus === 'Declined'
            ? 'Declined'
            : 'Pending';

      return {
        ...guest,
        normalizedRsvpStatus,
        attendanceStatus,
        isCheckedIn,
      };
    });
  }, [event?.date, guests]);

  const checkedInGuests = normalizedGuests.filter((guest) => guest.isCheckedIn).length;
  const pendingGuests = normalizedGuests.filter((guest) => guest.attendanceStatus === 'Pending' || guest.attendanceStatus === 'Absent').length;
  const filteredGuests = useMemo(() => {
    const searchValue = guestSearch.trim().toLowerCase();
    if (!searchValue) return normalizedGuests;

    return normalizedGuests.filter((guest) => {
      const name = getGuestName(guest).toLowerCase();
      return name.includes(searchValue) || guest.email?.toLowerCase().includes(searchValue);
    });
  }, [guestSearch, normalizedGuests]);

  const GUESTS_PER_PAGE = 5;
  const totalGuestPages = Math.max(1, Math.ceil(filteredGuests.length / GUESTS_PER_PAGE));
  const paginatedGuests = useMemo(() => {
    const startIndex = (guestPage - 1) * GUESTS_PER_PAGE;
    return filteredGuests.slice(startIndex, startIndex + GUESTS_PER_PAGE);
  }, [filteredGuests, guestPage]);

  useEffect(() => {
    setGuestPage(1);
  }, [guestSearch]);

  useEffect(() => {
    if (guestPage > totalGuestPages) {
      setGuestPage(totalGuestPages);
    }
  }, [guestPage, totalGuestPages]);

  const scheduleModalInitialData = useMemo(() => {
    if (!editingProdTask) return null;

    return {
      title: editingProdTask.title || '',
      description: editingProdTask.description || '',
      status: editingProdTask.status || 'TO DO',
      priority: editingProdTask.priority || 'MEDIUM',
      dueDate: editingProdTask.due?.date || productionDate,
      dueTime: editingProdTask.due?.time || '',
      assignees:
        editingProdTask.assignees?.map((entry) => entry?.name).filter(Boolean) ||
        (editingProdTask.assignee?.name ? [editingProdTask.assignee.name] : []),
      vendor: editingProdTask.vendor?.name || 'None',
    };
  }, [editingProdTask, productionDate]);

  const timelineItems = useMemo(() => {
    const sortedTasks = [...prodTasks].sort((first, second) => {
      const firstKey = `${first?.due?.date || ''} ${first?.due?.time || ''}`;
      const secondKey = `${second?.due?.date || ''} ${second?.due?.time || ''}`;
      return firstKey.localeCompare(secondKey);
    });

    const now = new Date();
    const isToday = productionDate === todayDate;

    return sortedTasks.map((task, index) => {
      const nextTask = sortedTasks[index + 1];
      const dueDate = task?.due?.date || productionDate;
      const dueTime = task?.due?.time || '';
      const dueAt = dueTime ? new Date(`${dueDate}T${dueTime}:00`) : null;
      const nextDueAt = nextTask?.due?.time ? new Date(`${nextTask?.due?.date || productionDate}T${nextTask.due.time}:00`) : null;
      const completed = isCompletedTask(task.status);
      const live =
        !completed &&
        isToday &&
        !!dueAt &&
        !Number.isNaN(dueAt.getTime()) &&
        dueAt.getTime() <= now.getTime() &&
        (!nextDueAt || Number.isNaN(nextDueAt.getTime()) || now.getTime() < nextDueAt.getTime());

      return {
        ...task,
        dueDate,
        dueTime,
        completed,
        live,
        upcoming: !completed && !live,
        assigneeNames:
          task.assignees?.map((entry) => entry?.name).filter(Boolean) ||
          (task.assignee?.name ? [task.assignee.name] : []),
      };
    });
  }, [prodTasks, productionDate, todayDate]);

  const completedTimelineCount = timelineItems.filter((task) => task.completed).length;
  const completedAllTasksCount = completedTimelineCount + eventTasks.filter((task) => isCompletedTask(task.status)).length;
  const totalAllTasksCount = timelineItems.length + eventTasks.length;
  const timelineProgress = timelineItems.length ? Math.round((completedTimelineCount / timelineItems.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Production Workspace...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{error || 'Project Not Found'}</h2>
        <p className="text-gray-500 mt-2 max-w-xs">We couldn't retrieve the details for this production. It may have been archived or moved.</p>
        <Link href="/admin/events" className="mt-8 text-[11px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowLeft size={14} /> Return to Portfolio
        </Link>
      </div>
    );
  }

  const renderPreEvent = () => (
    <div className="animate-in fade-in duration-300">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Budget Allocation</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">₱{(event.budget.utilized).toLocaleString()}</span>
            <span className="text-[13px] font-bold text-gray-400">/ ₱{(event.budget.total).toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-5 mb-2 relative z-10">
            <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${(event.budget.utilized / event.budget.total) * 100 || 0}%` }}></div>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{Math.round((event.budget.utilized / event.budget.total) * 100) || 0}% utilized</span>
            <button 
              onClick={() => setActiveTab('pre-event')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              Manage Budget
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Vendor Confirmation</h3>
          <div className="flex items-baseline gap-2 relative z-10 mb-4">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.vendors.secured}</span>
            <span className="text-[13px] font-bold text-gray-400">/ {event.vendors.total} Secured</span>
          </div>
          <div className="flex items-center mt-3 mb-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#facc15] border-[3px] border-white -ml-0 flex items-center justify-center text-[9px] font-extrabold text-white z-10">
              <Briefcase size={12} />
            </div>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{event.vendors.total - event.vendors.secured} pending contracts</span>
            <button 
              onClick={() => setActiveTab('pre-event')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              View All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Guest Capacity</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.guests.invited}</span>
            <span className="text-[13px] font-bold text-gray-400">Invited</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 mb-2.5 relative z-10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-extrabold text-emerald-500 tracking-wide">~ {Math.round((event.guests.rsvp / event.guests.invited) * 100) || 0}% RSVP Rate</span>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{event.guests.rsvp} confirmed</span>
            <button 
              onClick={() => setActiveTab('event-day')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              Guest List
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column (Milestones / Logistics ) */}
        <div className="space-y-8">
          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Production Milestones</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Sequence of key operations</p>
              </div>
              <button 
                onClick={() => setIsMilestoneModalOpen(true)}
                className="text-[10px] font-extrabold text-[#d4a017] uppercase tracking-widest flex items-center gap-1.5 hover:text-[#b8860b]"
              >
                <Plus size={14} strokeWidth={3} />
                Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {event.milestones?.map((m, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-[0px_2px_8px_rgba(0,0,0,0.01)] hover:border-[#facc15]/30 transition-all">
                  <div className={`w-2 h-2 rounded-full ${m.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#facc15]'} ml-1`}></div>
                  <div className="flex-1">
                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{m.category}</p>
                    <p className="text-[14px] font-extrabold text-gray-900">{m.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
              {!event.milestones?.length && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="w-2 h-2 rounded-full bg-[#facc15] ml-1"></div>
                  <div>
                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Project Start</p>
                    <p className="text-[14px] font-extrabold text-gray-900">Production Initialized</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column / Sidebar Area */}
        <div className="space-y-6">
          {/* Urgent Alerts Box */}
          <div className="bg-[#111827] rounded-2xl p-7 shadow-sm text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#facc15] text-[16px] font-extrabold tracking-tight">Urgent Alerts</h2>
              <button className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest hover:text-white transition-colors">Clear All</button>
            </div>
            <div className="space-y-6">
              <div className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-[#facc15] before:rounded-full">
                <h4 className="text-[13px] font-extrabold text-white mb-1.5 leading-snug">Initial Briefing</h4>
                <p className="text-[11px] text-white/60 font-medium leading-relaxed">{event.initialAlert || 'No active alerts for this production.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 py-7 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-black text-gray-900 tracking-tight">Production Team</h2>
            </div>
            <div className="space-y-5">
              {/* Lead */}
              <div className="flex items-center gap-3.5">
                {event.leadAvatarUrl ? (
                  <img src={event.leadAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-[12px] font-black uppercase tracking-widest overflow-hidden border-2 border-white shadow-sm">
                    {String(event.leadAssigned || '').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-[14px] font-black text-gray-900 capitalize leading-tight">{event.leadAssigned}</h4>
                  <p className="text-[9px] font-black text-[#d4a017] uppercase tracking-widest mt-1">Lead Director</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </div>

              {/* Additional Team */}
              {event.team?.map((member, i) => (
                <div key={i} className="flex items-center gap-3.5 pt-4 border-t border-gray-50">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-sm">
                      {String(member.name || '').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-[13px] font-black text-gray-900 capitalize leading-tight">{member.name}</h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-2xl p-6 py-7 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Client Contact</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-extrabold text-gray-900">{event.client.name}</h4>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">{event.client.role}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-[#d4a017] cursor-pointer transition-colors">
                <Mail size={12} /> {event.client.email}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-[#d4a017] cursor-pointer transition-colors">
                <Phone size={12} /> {event.client.phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventDay = () => {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks Complete */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tasks Complete</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">{completedAllTasksCount}</span>
              <span className="text-[18px] font-bold text-gray-400">/{totalAllTasksCount}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${totalAllTasksCount ? (completedAllTasksCount / totalAllTasksCount) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Timeline Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Timeline Progress</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">{timelineProgress}</span>
              <span className="text-[18px] font-bold text-gray-400">%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full" style={{ width: `${timelineProgress}%` }}></div>
            </div>
          </div>

          {/* Guests Checked In */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Guests Checked In</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">{checkedInGuests}</span>
              <span className="text-[18px] font-bold text-gray-400">/{guests.length || event.guests.invited}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${guests.length ? (checkedInGuests / guests.length) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Program Timeline */}
          <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Program <span className="text-[#facc15] italic">Timeline</span></h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1">Live stage cues and schedule</p>
              </div>
              <button
                onClick={() => {
                  setEditingProdTask(null);
                  setIsScheduleModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8]"
              >
                <Calendar size={14} />
                Add Schedule
              </button>
            </div>

            {eventDayError && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-600">
                {eventDayError}
              </div>
            )}

            {isEventDayLoading ? (
              <div className="py-14 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#eebf43] animate-spin" />
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Loading schedule</p>
              </div>
            ) : timelineItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                <p className="text-[16px] font-black text-gray-900">No program timeline yet</p>
                <p className="text-[12px] text-gray-500 font-medium mt-2">Use Edit Schedule to add event-day tasks into the live program timeline.</p>
              </div>
            ) : (
              <div className="overflow-y-auto pr-2" style={{ maxHeight: '500px' }}>
                <div className="space-y-6">
                {timelineItems.map((task, index) => {
                  const accentClass = task.completed
                    ? 'bg-emerald-500'
                    : task.live
                      ? 'bg-[#facc15] shadow-lg shadow-[#facc15]/30 animate-pulse'
                      : 'bg-gray-200';
                  const wrapperClass = task.live
                    ? 'bg-[#facc15]/5 -mx-4 px-4 py-4 rounded-xl'
                    : '';
                  const timeClass = task.live ? 'text-[#d4a017]' : 'text-gray-400';
                  const connectorClass = task.live ? 'bg-[#facc15]/20' : 'bg-gray-100';

                  return (
                    <div
                      key={task._id || `${task.title}-${index}`}
                      onClick={() => {
                        setEditingProdTask(task);
                        setIsScheduleModalOpen(true);
                      }}
                      className={`flex gap-4 cursor-pointer rounded-2xl transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:shadow-gray-100/60 ${index !== timelineItems.length - 1 ? 'pb-6 border-b border-gray-100' : ''} ${wrapperClass}`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${accentClass}`}>
                          {task.completed && <Check size={8} className="text-white" strokeWidth={4} />}
                        </div>
                        {index !== timelineItems.length - 1 && <div className={`w-0.5 h-full mt-2 ${connectorClass}`}></div>}
                      </div>
                      <div className="flex-1 pt-0.5 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${timeClass}`}>{formatTimeLabel(task.dueTime)}</span>
                          {task.live && <span className="bg-[#facc15] text-gray-900 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Live Now</span>}
                          {task.completed && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-100">Completed</span>}
                          {task.upcoming && <span className="bg-gray-100 text-gray-500 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Upcoming</span>}
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-[16px] font-black text-gray-900 mb-1 break-words">{task.title}</h3>
                            <p className="text-[12px] text-gray-500 font-medium mb-3 break-words">{task.description || 'No schedule notes added.'}</p>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <User size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-600">{task.vendor?.name && task.vendor.name !== 'None' ? task.vendor.name : 'Internal team'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${task.completed ? 'bg-emerald-500' : task.live ? 'bg-[#facc15]' : 'bg-gray-300'}`}></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{task.priority || 'MEDIUM'} Priority</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.assigneeNames.length > 0 ? (
                                <>
                                  <div className="flex -space-x-2">
                                    {task.assigneeNames.slice(0, 3).map((name, assigneeIndex) => {
                                      const staffMember = staffOptions.find(s => s.name === name);
                                      return staffMember?.avatarUrl ? (
                                        <img
                                          key={`${task._id}-${name}-${assigneeIndex}`}
                                          src={staffMember.avatarUrl}
                                          alt={name}
                                          className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover"
                                        />
                                      ) : (
                                        <div
                                          key={`${task._id}-${name}-${assigneeIndex}`}
                                          className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-black shadow-sm ${task.live ? 'bg-[#d4a017]' : task.completed ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                        >
                                          {getInitials(name)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400">{task.assigneeNames.join(', ')}</span>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400">Unassigned</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              updateProdTaskStatus(task, task.completed ? 'TO DO' : 'DONE').catch((err) => {
                                console.error(err);
                                setEventDayError('Could not update the program timeline status.');
                              });
                            }}
                            className={`shrink-0 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                              task.completed
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-100'
                                : 'bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase hover:bg-[#fff6d8]'
                            }`}
                          >
                            {task.completed ? 'Reopen' : 'Mark Done'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Guest Check-in */}
          <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Check-in</span></h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1">Real-time RSVP tracking and entry</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/admin/rsvp/scan?eventId=${encodeURIComponent(id)}`)}
                className="bg-[#facc15] hover:bg-[#eab308] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-[#facc15]/20 flex items-center gap-2 transition-all"
              >
                <QrCode size={14} />
                Launch Scanner
              </button>
            </div>

            {/* Guest Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expected</div>
                <div className="text-[32px] font-black text-gray-900 leading-none">{guests.length || event.guests.invited}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest mb-2">Checked In</div>
                <div className="text-[32px] font-black text-[#facc15] leading-none">{checkedInGuests}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Late/Pending</div>
                <div className="text-[32px] font-black text-gray-400 leading-none">{pendingGuests}</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search guests by name or email..."
                value={guestSearch}
                onChange={(event) => setGuestSearch(event.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold text-gray-900 focus:border-[#facc15] transition-all outline-none"
              />
            </div>

            {/* Guest List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Guest</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-[#71717a]">
                        No guests found matching your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedGuests.map((guest) => {
                      const hasEmail = Boolean(guest.email?.trim());
                      const statusTone = guest.attendanceStatus === 'Checked In'
                        ? { text: 'text-emerald-700', dot: 'bg-emerald-500' }
                        : guest.attendanceStatus === 'Absent'
                          ? { text: 'text-rose-700', dot: 'bg-rose-500' }
                          : guest.attendanceStatus === 'Declined'
                            ? { text: 'text-rose-700', dot: 'bg-rose-500' }
                          : { text: 'text-amber-700', dot: 'bg-amber-500' };

                      return (
                        <tr
                          key={guest._id}
                          className="group hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-b-0"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#71717a] text-xs font-bold shadow-sm">
                                {getInitials(getGuestName(guest))}
                              </div>
                              <div>
                                <p className="text-[#1d1d1f] font-bold text-sm">{getGuestName(guest)}</p>
                                <p className="text-[#71717a] text-[11px]">{guest.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${statusTone.dot}`}></span>
                              <span className={`text-xs font-semibold ${statusTone.text}`}>
                                {guest.attendanceStatus === 'Pending' ? guest.normalizedRsvpStatus : guest.attendanceStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {guest.attendanceStatus === 'Checked In' ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-white shadow-sm shadow-emerald-500/20">
                                <Check size={13} />
                                <span className="text-[11px] font-black uppercase tracking-[0.1em]">Checked In</span>
                              </div>
                            ) : guest.attendanceStatus === 'Absent' ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-gray-500 px-5 py-3 text-white shadow-sm shadow-gray-500/20">
                                <X size={13} />
                                <span className="text-[11px] font-black uppercase tracking-[0.1em]">Absent</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {hasEmail ? (
                                  <button
                                    type="button"
                                    onClick={() => sendGuestLink(guest).catch((err) => console.error(err))}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8]"
                                  >
                                    <Link2 size={13} />
                                    Send Link
                                  </button>
                                ) : (
                                  <>
                                    {guest.normalizedRsvpStatus === 'Pending' ? (
                                      <button
                                        type="button"
                                        onClick={() => confirmGuest(guest).catch((err) => console.error(err))}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8]"
                                      >
                                        <Check size={13} />
                                        Confirm
                                      </button>
                                    ) : guest.normalizedRsvpStatus === 'Confirmed' ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleGuestCheckIn(guest).catch((err) => console.error(err))}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#fff6d8]"
                                      >
                                        <UserCheck size={13} />
                                        Check In
                                      </button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {/* Empty rows to maintain fixed height */}
                  {Array.from({ length: GUESTS_PER_PAGE - paginatedGuests.length }).map((_, index) => (
                    <tr key={`empty-${index}`} style={{ height: '73px' }}>
                      <td colSpan={3} className="border-b border-gray-50 last:border-b-0"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
    );
  };

  const BigCountdownItem = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
      const calculate = () => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        if (diff <= 0) return setTimeLeft(null);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      };
      calculate();
      const timer = setInterval(calculate, 1000);
      return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return <div className="col-span-4 py-10 text-[64px] font-black text-emerald-500 tracking-tight italic">PRODUCTION IS LIVE</div>;

    const units = [
      { label: 'DAYS', value: timeLeft.days },
      { label: 'HOURS', value: timeLeft.hours },
      { label: 'MINUTES', value: timeLeft.minutes },
      { label: 'SECONDS', value: timeLeft.seconds }
    ];

    return (
      <>
        {units.map((unit) => (
          <div key={unit.label} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center transform transition-transform hover:-translate-y-2 duration-500">
            <span className="text-[84px] font-black text-gray-900 leading-none tabular-nums tracking-tighter mb-4">{String(unit.value).padStart(2, '0')}</span>
            <span className="text-[12px] font-black text-[#d4a017] uppercase tracking-[0.3em]">{unit.label}</span>
          </div>
        ))}
      </>
    );
  };

  const renderPostEvent = () => (
    <PostEventView eventId={id} user={user!} />
  );

  return (
    <>
      <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-gray-400 hover:text-gray-600 uppercase transition-colors mb-4">
              <ArrowLeft size={12} strokeWidth={3} /> Return to Portfolio
            </Link>
            <div className="flex items-center gap-4">
              <span className="bg-[#facc15] text-gray-900 text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] rounded-lg shadow-sm">{event.status}</span>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              <span className="text-gray-400 text-[11px] font-black tracking-widest uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="text-[54px] font-black text-gray-900 tracking-tight leading-none mt-4">
              {event.title.includes(' ')
                ? <>{event.title.split(' ').slice(0, -1).join(' ')} <span className="text-[#facc15] italic">{event.title.split(' ').pop()}</span></>
                : event.title
              }
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
                <MapPin size={16} className="text-gray-400" />
                {event.location}
              </div>
              <div className="w-10 h-0.5 bg-gray-200 rounded-full"></div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{event.health}% Health</span>
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d4a017]" style={{ width: `${event.health}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <Link
              href={`/admin/events/${id}/edit`}
              className="bg-[#facc15] hover:bg-[#eab308] text-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl shadow-xl shadow-[#facc15]/20 transition-all active:scale-95 flex items-center gap-2 group mt-8"
            >
              EDIT DETAILS
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="mt-auto mb-0">
              <CountdownTimer targetDate={event.date} />
            </div>
          </div>
        </div>

        {/* Top Level Tabs */}
        <div className="border-b border-gray-200 mt-8 flex gap-8">
          {['pre-event', 'event-day', 'post-event'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[13px] font-extrabold uppercase tracking-wider transition-colors border-b-2 relative top-[1px] ${activeTab === tab ? 'border-[#d4a017] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <div className="pt-4">
          {activeTab === 'pre-event' && renderPreEvent()}
          {activeTab === 'event-day' && renderEventDay()}
          {activeTab === 'post-event' && renderPostEvent()}
        </div>
      </div>

      <EventDayScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingProdTask(null);
        }}
        onSubmit={handleSaveProdTask}
        staffOptions={staffOptions}
        vendorOptions={vendorOptions}
        productionDate={productionDate}
        initialData={scheduleModalInitialData}
      />

      {isGuestModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">Initialize <span className="text-[#facc15] italic">Guest</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10">Add attendee to production manifest</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Legal Name</label>
                <input 
                  type="text" 
                  value={newGuest.name}
                  onChange={(e) => setNewGuest(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                  placeholder="Enter guest name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={newGuest.email}
                  onChange={(e) => setNewGuest(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Table Number</label>
                <input 
                  type="text" 
                  value={newGuest.tableNo}
                  onChange={(e) => setNewGuest(p => ({ ...p, tableNo: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                  placeholder="e.g. 12 or TBD"
                />
              </div>
              
              <CustomSelect 
                label="RSVP Status"
                value={newGuest.status}
                onChange={(val) => setNewGuest(p => ({ ...p, status: val as any }))}
                options={[
                  { value: 'Confirmed', label: 'Confirmed' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Declined', label: 'Declined' },
                ]}
              />
              
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 cursor-pointer hover:bg-gray-100 transition-all" onClick={() => setNewGuest(p => ({ ...p, plusOne: !p.plusOne }))}>
                 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${newGuest.plusOne ? 'bg-[#facc15] border-[#facc15]' : 'border-gray-200 bg-white'}`}>
                    {newGuest.plusOne && <Check size={14} className="text-white" strokeWidth={4} />}
                 </div>
                 <span className="text-[13px] font-extrabold text-gray-900">Plus One (+1)</span>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setIsGuestModalOpen(false)}
                className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
              >
                Discard
              </button>
              <button 
                onClick={async () => {
                  if (!newGuest.name) return;
                  const idToken = await user!.getIdToken();
                  const res = await fetch(`/api/events/${id}/guests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify(newGuest),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setGuests(prev => [data, ...prev]);
                    setIsGuestModalOpen(false);
                    setNewGuest({ name: '', email: '', phone: '', status: 'Confirmed', tableNo: '', plusOne: false });
                    fetchEventDetails(); // Refresh stats
                  }
                }}
                className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20"
              >
                Initialize Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">New <span className="text-[#facc15] italic">Milestone</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">Production Sequence Addition</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Milestone Title</label>
                <input 
                  type="text" 
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Venue secured"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                />
              </div>
              <CustomSelect 
                label="Category"
                value={newMilestone.category}
                onChange={(val) => setNewMilestone(p => ({ ...p, category: val }))}
                options={[
                  { value: 'Logistics', label: 'Logistics' },
                  { value: 'Vendors', label: 'Vendors' },
                  { value: 'Creative', label: 'Creative' },
                  { value: 'Finance', label: 'Finance' },
                ]}
              />
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setIsMilestoneModalOpen(false)}
                className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newMilestone.title) return;
                  const m = { ...newMilestone, date: new Date().toISOString(), status: 'Pending' };
                  const updatedEvent = { ...event, milestones: [...(event.milestones || []), m] };
                  
                  // Optimistic update
                  setEvent(updatedEvent);
                  setIsMilestoneModalOpen(false);
                  setNewMilestone({ title: '', category: 'Logistics' });

                  // Save to DB
                  const idToken = await user!.getIdToken();
                  await fetch(`/api/events/${event._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({ milestones: updatedEvent.milestones }),
                  });
                }}
                className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


