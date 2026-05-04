'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Check,
  Eye,
  Link2,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const ADMIN_REGISTRY_API = '/api/admin/rsvp/guest-registry';
const ADMIN_SEND_LINK_API = '/api/admin/rsvp/guest-registry/send-link';

type EventRecord = {
  _id: string;
  title?: string;
  date?: string;
};

type GuestStatus = 'Confirmed' | 'Pending' | 'Declined';

type GuestRecord = {
  _id: string;
  name?: string;
  email?: string;
  notes?: string;
  tier?: string;
  status?: GuestStatus;
  checkedIn?: boolean;
  rsvpCode?: string;
  usedAt?: string | null;
};

type GuestFormState = {
  name: string;
  email: string;
  tier: string;
  status: GuestStatus;
};

const guestStatusOptions: GuestStatus[] = ['Confirmed', 'Pending', 'Declined'];
const guestTierOptions = ['Standard', 'VIP'];
const guestTierSelectOptions = guestTierOptions.map((option) => ({ value: option, label: option }));
const guestStatusSelectOptions = guestStatusOptions.map((option) => ({ value: option, label: option }));
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

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || '?';
};

const getGuestStatusTone = (status?: string) => {
  if (status === 'Confirmed') {
    return { text: 'text-emerald-700', dot: 'bg-emerald-500' };
  }
  if (status === 'Declined') {
    return { text: 'text-rose-700', dot: 'bg-rose-500' };
  }
  return { text: 'text-amber-700', dot: 'bg-amber-500' };
};

const buildGuestCode = (guest: GuestRecord) => {
  if (guest.rsvpCode?.trim()) return guest.rsvpCode.trim();
  const rawToken = (guest._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const token = rawToken.slice(-8).padStart(8, '0');
  return guest.tier === 'VIP' ? `VIP-${token}` : token;
};

const GUESTS_PER_PAGE = 5;

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
    <div className="relative space-y-2" ref={containerRef}>
      <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-[#71717a]">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${guestDropdownTriggerClass} ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-gray-900">{selectedOption?.label || value}</div>
          {selectedOption?.helper ? (
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{selectedOption.helper}</div>
          ) : null}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-full z-[80] mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div>
                <div className="text-[13px] font-extrabold text-gray-900">{option.label}</div>
                {option.helper ? (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{option.helper}</div>
                ) : null}
              </div>
              {value === option.value ? <Check className="h-4 w-4 text-[#facc15]" /> : null}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
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

        <div className="flex gap-4 mt-10">
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
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
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

        <button 
          onClick={onClose}
          className="w-full py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20 transition-all hover:bg-[#dcae32]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function AdminRsvpGuestRegistryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm font-medium text-gray-500">Loading guest registry...</div>}>
      <AdminRsvpGuestRegistryContent params={params} />
    </Suspense>
  );
}

function AdminRsvpGuestRegistryContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'All' | GuestStatus>('All');
  const [guestPage, setGuestPage] = useState(1);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [submittingGuest, setSubmittingGuest] = useState(false);
  const [actingGuestId, setActingGuestId] = useState<string | null>(null);
  const [isLinkSentModalOpen, setIsLinkSentModalOpen] = useState(false);
  const [linkSentGuest, setLinkSentGuest] = useState<GuestRecord | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [guestPendingRemoval, setGuestPendingRemoval] = useState<GuestRecord | null>(null);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    const fetchEventAndGuests = async () => {
      if (!user || !id) return;
      setLoadingEvent(true);
      setLoadingGuests(true);
      try {
        const idToken = await user.getIdToken();
        const eventResponse = await fetch(`/api/events/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const eventData = eventResponse.ok ? await eventResponse.json() : null;
        setEvent(eventData);

        const guestResponse = await fetch(`${ADMIN_REGISTRY_API}?eventId=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const guestData = guestResponse.ok ? await guestResponse.json() : [];
        setGuests(Array.isArray(guestData) ? guestData : []);
      } catch {
        setEvent(null);
        setGuests([]);
      } finally {
        setLoadingEvent(false);
        setLoadingGuests(false);
      }
    };
    fetchEventAndGuests();
  }, [id, user]);

  const persistGuestPatch = async (guestId: string, payload: Record<string, unknown>) => {
    if (!user) return false;
    setActingGuestId(guestId);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(ADMIN_REGISTRY_API, {
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
      if (!response.ok) throw new Error('Failed to update guest.');
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
        `${ADMIN_REGISTRY_API}?eventId=${encodeURIComponent(id)}&guestId=${encodeURIComponent(guest._id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      if (!response.ok) throw new Error('Failed to remove guest.');
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
      const response = await fetch(ADMIN_REGISTRY_API, {
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
      if (!response.ok) throw new Error('Failed to create guest.');
      const createdGuest = await response.json();
      if (guestForm.email.trim()) {
        await fetch(ADMIN_SEND_LINK_API, {
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
      const response = await fetch(ADMIN_SEND_LINK_API, {
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
      if (!response.ok) throw new Error('Failed to send guest RSVP link.');
      setLinkSentGuest(guest);
      setIsLinkSentModalOpen(true);
    } catch (error) {
      console.error('Failed to send RSVP invite:', error);
    } finally {
      setActingGuestId(null);
    }
  };

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

  return (
    <div className="animate-in fade-in mt-2 w-full duration-500 px-4 pb-12 sm:px-6 lg:px-8">
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        BACK TO EVENTS
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-center">
        <div className="max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
            Invitations <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Guest List</span>
          </p>
          <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f]">
            Guest <span className="pr-2 italic text-[#eebf43]">Registry</span>
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-[#71717a]">
            A curated overview of your production&apos;s attendee lifecycle. Manage high-tier classifications and track real-time RSVP
            engagement metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGuestModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d1d1f] px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-sm transition-colors hover:bg-[#2a2a2d]"
          >
            <Plus size={14} />
            Add Guest
          </button>
          <Link
            href={`/admin/rsvp/scan?eventId=${encodeURIComponent(id)}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#eebf43] px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-md shadow-[#eebf43]/20 transition-colors hover:bg-[#dcae32]"
          >
            <QrCode size={14} />
            Scan QR Ticket
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-5">
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
                <div className="h-full rounded-full bg-[#f4c41d] transition-all" style={{ width: `${guestCodesUsedPct}%` }} />
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
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-white shadow-sm shadow-emerald-500/20">
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

      {isGuestModalOpen && (
        <GuestAddModal submitting={submittingGuest} onClose={() => setIsGuestModalOpen(false)} onSubmit={handleGuestSubmit} />
      )}

      {isLinkSentModalOpen && (
        <LinkSentModal guest={linkSentGuest} onClose={() => { setIsLinkSentModalOpen(false); setLinkSentGuest(null); }} />
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[22px] sm:text-[24px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Details</span></h3>
                <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-gray-400">View Guest Information</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="text-gray-400 transition-colors hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <span className={`h-2 w-2 rounded-full ${getGuestStatusTone(selectedGuest.status).dot}`} />
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
                <div className="min-h-[112px] w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-[13px] sm:text-[14px] leading-relaxed italic text-[#71717a]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[540px] rounded-[18px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Remove Guest</h3>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Guest registry update</p>
              </div>
              <button type="button" onClick={() => setGuestPendingRemoval(null)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close removal modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium leading-relaxed text-[#71717a]">
                Remove <span className="font-bold text-[#1d1d1f]">{guestPendingRemoval.name || 'this guest'}</span> from the registry? Live guest totals for this
                event will update.
              </p>
            </div>
            <div className="mt-0 flex items-center justify-end gap-3 border-t border-gray-100 px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={() => setGuestPendingRemoval(null)}
                className="px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actingGuestId === guestPendingRemoval._id}
                onClick={() => handleGuestRemoval(guestPendingRemoval)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#eebf43] px-6 py-3 text-[12px] font-extrabold uppercase tracking-widest text-white transition-all hover:bg-[#dcae32] disabled:opacity-70"
              >
                {actingGuestId === guestPendingRemoval._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Remove Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
