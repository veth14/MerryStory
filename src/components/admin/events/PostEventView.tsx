'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Loader2,
  AlertTriangle,
  Star,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Percent,
  FileText,
  Phone,
  Mail,
  Clock,
  Briefcase,
  Filter,
} from 'lucide-react';
import { User } from 'firebase/auth';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface UpcomingPayment {
  entity: string;
  type: string;
  amount: string;
  due: string;
  days: string;
  dueDateIso: string;
}

interface RecentExpense {
  id: string;
  date: string;
  desc: string;
  subtitle: string;
  category: string;
  amount: string;
  status: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
}

interface FinanceData {
  outstanding: number | string;
  upcomingPayments: UpcomingPayment[];
  recentExpenses: RecentExpense[];
  eventName: string;
}

interface Vendor {
  _id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  rating: number;
  status: string;
}

interface VendorWithRating extends Vendor {
  isAssociated: boolean;
  tempRating?: number;
  isSubmitting?: boolean;
}

interface Guest {
  _id: string;
  guestName?: string;
  name?: string;
  email?: string;
  phone?: string;
  code?: string;
  tier?: string;
  status?: string;
  plusOne?: boolean;
  tableNo?: string;
  attendees?: number | string;
  dietary?: string;
  isAttending?: boolean;
  checkedIn?: boolean;
  qrScannedAt?: string | null;
  usedAt?: string | null;
  invitationSentAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string;
}

interface NormalizedGuest extends Guest {
  displayName: string;
  rsvpStatus: 'accepted' | 'declined' | 'pending';
  attendanceStatus: 'attended' | 'absent' | 'pending';
}

interface GuestData {
  totalRsvps: number;
  totalAttended: number;
  totalAbsent: number;
  totalDeclined: number;
  totalPending: number;
  guests: NormalizedGuest[];
}

// ============================================================================
// UNIFIED FETCHER
// ============================================================================

const fetchWithAuth = async ([url, token]: [string, string]) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

const parseAmount = (value: string | number | undefined): number => {
  if (value === undefined || value === null) return 0;
  const normalized = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PostEventView({
  eventId,
  user,
}: {
  eventId: string;
  user: User;
}) {
  const [idToken, setIdToken] = useState<string>('');
  const [guestFilter, setGuestFilter] = useState<'all' | 'attended' | 'absent' | 'pending'>('all');
  const [selectedGuest, setSelectedGuest] = useState<NormalizedGuest | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<UpcomingPayment | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<RecentExpense | null>(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setIdToken);
    }
  }, [user]);

  const { data: financeData, error: financeError } = useSWR<FinanceData>(
    idToken && eventId ? [`/api/finances/${eventId}`, idToken] : null,
    fetchWithAuth
  );

  const { data: rawVendors, mutate: mutateRawVendors } = useSWR<Vendor[]>(
    idToken ? ['/api/vendors', idToken] : null,
    fetchWithAuth
  );

  const { data: rawExpenses } = useSWR<any[]>(
    idToken && eventId ? [`/api/finances/${eventId}/expenses`, idToken] : null,
    fetchWithAuth
  );

  const { data: rawGuests } = useSWR<Guest[]>(
    idToken && eventId ? [`/api/events/${eventId}/guests`, idToken] : null,
    fetchWithAuth
  );

  const { data: eventDetails } = useSWR<any>(
    idToken && eventId ? [`/api/events/${eventId}`, idToken] : null,
    fetchWithAuth
  );

  const vendors = React.useMemo<VendorWithRating[]>(() => {
    if (!rawVendors) return [];

    const vendorNamesFromFinance = new Set<string>();

    (rawExpenses ?? [])
      .map((e: any) => {
        const vendorName = e?.vendor;
        return vendorName != null ? String(vendorName).toLowerCase() : undefined;
      })
      .filter(Boolean)
      .forEach((name: string) => vendorNamesFromFinance.add(name));

    financeData?.recentExpenses?.forEach((exp) => {
      const subtitle = exp?.subtitle;
      if (subtitle != null) vendorNamesFromFinance.add(String(subtitle).toLowerCase());
    });

    financeData?.upcomingPayments?.forEach((payment) => {
      const entity = payment?.entity;
      if (entity != null) vendorNamesFromFinance.add(String(entity).toLowerCase());
    });

    return (rawVendors ?? []).map((v) => ({
      ...v,
      isAssociated: vendorNamesFromFinance.has(String(v?.name ?? '').toLowerCase()),
    }));
  }, [rawVendors, rawExpenses, financeData]);

  const guestData = React.useMemo<GuestData | null>(() => {
    if (!rawGuests) return null;

    const isEventDatePassed = (eventDate?: string | null) => {
      if (!eventDate) return false;
      try {
        const parsed = /^\d{4}-\d{2}-\d{2}/.test(eventDate)
          ? new Date(`${eventDate.slice(0, 10)}T00:00:00`)
          : new Date(eventDate);
        if (Number.isNaN(parsed.getTime())) return false;
        const absentCutoff = new Date(parsed);
        absentCutoff.setHours(0, 0, 0, 0);
        absentCutoff.setDate(absentCutoff.getDate() + 1);
        return new Date() >= absentCutoff;
      } catch {
        return false;
      }
    };

    const eventHasPassed = isEventDatePassed(eventDetails?.date ?? null);

    const guests = rawGuests.map((guest) => {
      const statusValue = String(guest?.status || '').toLowerCase();
      const normalizedStatus =
        statusValue === 'confirmed' ? 'confirmed' : statusValue === 'declined' ? 'declined' : 'pending';
      // Only consider explicit check-in flags or an actual QR scan as "checked in".
      // `usedAt` represents RSVP code usage (e.g. when a guest used their RSVP code to respond)
      // and should not mark the guest as attended until their QR is scanned or they are explicitly checked in.
      const isCheckedIn = Boolean(guest?.checkedIn || guest?.qrScannedAt);
      const attendanceStatus = isCheckedIn ? 'attended' : eventHasPassed ? 'absent' : 'pending';

      return {
        ...guest,
        displayName: guest.guestName || guest.name || guest.email || guest.code || 'Unknown',
        rsvpStatus:
          normalizedStatus === 'confirmed'
            ? 'accepted'
            : normalizedStatus === 'declined'
            ? 'declined'
            : 'pending',
        attendanceStatus,
      } as NormalizedGuest;
    });

    return {
      totalRsvps: guests.filter((g) => g.rsvpStatus === 'accepted').length,
      totalAttended: guests.filter((g) => g.attendanceStatus === 'attended').length,
      totalAbsent: guests.filter((g) => g.attendanceStatus === 'absent').length,
      totalDeclined: guests.filter((g) => g.rsvpStatus === 'declined').length,
      totalPending: guests.filter((g) => g.rsvpStatus === 'pending').length,
      guests,
    };
  }, [rawGuests, eventDetails?.date]);

  const loading = !financeData && !financeError;
  const error = financeError?.message ?? '';

  const [editableVendors, setEditableVendors] = useState<VendorWithRating[]>([]);

  useEffect(() => {
    setEditableVendors(vendors);
  }, [vendors]);

  const associatedVendors = editableVendors.filter((v) => v.isAssociated) ?? [];

  const attendanceRate =
    guestData && guestData.guests.length > 0
      ? Math.round((guestData.totalAttended / guestData.guests.length) * 100)
      : 0;

  const totalEventCost = currencyFormatter.format(
    financeData?.recentExpenses?.reduce((sum, exp) => sum + parseAmount(exp?.amount), 0) || 0
  );

  const outstandingBalance =
    financeData && typeof financeData.outstanding === 'number'
      ? currencyFormatter.format(financeData.outstanding)
      : typeof financeData?.outstanding === 'string'
      ? financeData.outstanding
      : currencyFormatter.format(0);

  const filteredGuests =
    guestData?.guests?.filter((guest) => {
      if (guestFilter === 'all') return true;
      if (guestFilter === 'attended') return guest?.attendanceStatus === 'attended';
      if (guestFilter === 'absent') return guest?.attendanceStatus === 'absent';
      if (guestFilter === 'pending') return guest?.attendanceStatus === 'pending';
      return true;
    }) ?? [];

  const handleRatingSubmit = async (vendorId: string, rating: number) => {
    setEditableVendors((prev) =>
      prev.map((v) => (v._id === vendorId ? { ...v, isSubmitting: true } : v))
    );

    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (!res.ok) throw new Error('Failed to submit rating');

      setEditableVendors((prev) =>
        prev.map((v) =>
          v._id === vendorId
            ? { ...v, rating, tempRating: undefined, isSubmitting: false }
            : v
        )
      );

      if (mutateRawVendors) mutateRawVendors();
    } catch (err) {
      console.error('Rating submission error:', err);
      setEditableVendors((prev) =>
        prev.map((v) => (v._id === vendorId ? { ...v, isSubmitting: false } : v))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Loading Post-Event Data...
        </p>
      </div>
    );
  }

  if (error || !financeData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {error || 'Data Unavailable'}
        </h2>
        <p className="text-gray-500 mt-2 max-w-xs">
          We couldn&apos;t retrieve the post-event reconciliation data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-in fade-in duration-300 space-y-8 pb-8">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attendance Rate</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[32px] font-black text-gray-900 tracking-tight leading-none">{attendanceRate}</span>
              <span className="text-[18px] font-bold text-gray-400">%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Total RSVPs</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[32px] font-black text-gray-900 tracking-tight leading-none">{guestData?.totalRsvps ?? 0}</span>
              <span className="text-[18px] font-bold text-gray-400">Responses</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Total Cost</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[32px] font-black text-gray-900 tracking-tight leading-none">{totalEventCost}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Outstanding</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[32px] font-black text-gray-900 tracking-tight leading-none">{outstandingBalance}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: outstandingBalance !== '₱0.00' && outstandingBalance !== '0' && outstandingBalance !== '0.00' ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-8 lg:col-span-2">
            {/* Vendor Scorecard */}
            <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Vendor <span className="text-[#facc15] italic">Scorecard</span></h2>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">Vendor Performance Review</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase">
                  {associatedVendors.length} Vendor{associatedVendors.length !== 1 ? 's' : ''}
                </span>
              </div>

              {associatedVendors.length > 0 ? (
                <div className="space-y-3 mt-5">
                  {associatedVendors.map((vendor) => (
                    <div key={vendor._id} className="rounded-[28px] border border-gray-100 bg-gray-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-gray-900 truncate" title={vendor.name}>
                            {vendor.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.23em] text-gray-400">
                            {vendor.category || 'Vendor'}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                          <Briefcase size={14} className="text-[#d4a017]" />
                          {vendor.rating ?? 0}/5
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                          {vendor.email || 'No email available'} · {vendor.phone || 'No phone available'}
                        </p>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setEditableVendors((prev) =>
                                  prev.map((v) =>
                                    v._id === vendor._id ? { ...v, tempRating: star } : v
                                  )
                                )
                              }
                              disabled={vendor.isSubmitting}
                              className="rounded-full p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Star
                                size={16}
                                className={
                                  star <= (vendor.tempRating ?? vendor.rating ?? 0)
                                    ? 'fill-[#facc15] text-[#facc15]'
                                    : 'text-gray-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {vendor.tempRating !== undefined && vendor.tempRating !== vendor.rating && (
                        <button
                          onClick={() => handleRatingSubmit(vendor._id, vendor.tempRating ?? 0)}
                          disabled={vendor.isSubmitting}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#facc15] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-gray-900 transition hover:brightness-105 disabled:opacity-60"
                        >
                          {vendor.isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          {vendor.isSubmitting ? 'Submitting' : 'Submit Rating'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-5">
                    <Star className="h-8 w-8 text-[#facc15]" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">No associated vendors yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Vendors linked to this event will appear here once expenses are recorded.
                  </p>
                </div>
              )}
            </div>

            {/* Guest Engagement */}
            <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Engagement</span></h2>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">Attendance overview</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(['all', 'attended', 'absent', 'pending'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setGuestFilter(filter)}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors ${
                        guestFilter === filter
                          ? 'bg-[#facc15] text-white shadow-sm shadow-[#facc15]/20'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {filter}{' '}
                      {filter !== 'all'
                        ? `(${
                            filter === 'attended'
                              ? guestData?.totalAttended
                              : filter === 'absent'
                              ? guestData?.totalAbsent
                              : guestData?.totalPending
                          })`
                        : `(${guestData?.guests.length ?? 0})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                  { title: 'Attended', value: guestData?.totalAttended ?? 0, accent: 'emerald', subtitle: 'Arrived' },
                  { title: 'Absent', value: guestData?.totalAbsent ?? 0, accent: 'rose', subtitle: 'No-shows' },
                  { title: 'Declined', value: guestData?.totalDeclined ?? 0, accent: 'amber', subtitle: 'Declined RSVPs' },
                  { title: 'Pending', value: guestData?.totalPending ?? 0, accent: 'gray', subtitle: 'Awaiting response' },
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center"
                  >
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{stat.title}</p>
                    <p
                      className={`mt-4 text-4xl font-black ${
                        stat.accent === 'emerald'
                          ? 'text-emerald-500'
                          : stat.accent === 'rose'
                          ? 'text-rose-500'
                          : stat.accent === 'amber'
                          ? 'text-amber-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* Guest Table */}
              <div className="mt-8">
                <div className="flex flex-col gap-4 border-b border-gray-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-[16px] font-black text-gray-900 tracking-tight">Guest list</h3>
                    <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      {filteredGuests.length} guests{guestFilter !== 'all' ? ` · filtered ${guestFilter}` : ''}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/30 bg-[#fef9ec] px-4 py-2 text-sm font-bold text-[#a88231]">
                    <span className="text-[10px] uppercase tracking-widest text-[#d4a017]">Total</span>
                    {guestData?.guests.length ?? 0}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse table-auto text-left text-sm mt-2">
                    <thead className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">
                      <tr>
                        <th className="px-4 py-4 text-left">Name</th>
                        <th className="px-4 py-4 text-left">Contact</th>
                        <th className="px-4 py-4 text-center">Code</th>
                        <th className="px-4 py-4 text-center">RSVP</th>
                        <th className="px-4 py-4 text-center">Table</th>
                        <th className="px-4 py-4 text-center">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredGuests.length > 0 ? (
                        filteredGuests.map((guest) => (
                          <tr
                            key={guest._id}
                            onClick={() => setSelectedGuest(guest)}
                            className="cursor-pointer group hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <td className="px-4 py-4">
                              <p className="font-bold text-[#1d1d1f] text-sm">{guest.displayName}</p>
                              {guest.plusOne && (
                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#d4a017]">+1</p>
                              )}
                              {guest.tier && (
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{guest.tier}</p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-[#71717a] text-[12px]">
                              <p>{guest.email || 'No email'}</p>
                              {guest.phone && <p className="mt-1 text-[11px] text-gray-400">{guest.phone}</p>}
                              {guest.notes && <p className="mt-1 text-[11px] text-gray-400">{guest.notes}</p>}
                            </td>
                            <td className="px-4 py-4 text-center font-medium text-gray-500 text-[12px]">{guest.code || '—'}</td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                                  guest.rsvpStatus === 'accepted'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : guest.rsvpStatus === 'declined'
                                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                                }`}
                              >
                                {guest.status
                                  ? String(guest.status).replace(/^(.)/, (m) => m.toUpperCase())
                                  : guest.rsvpStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-gray-900 font-bold">{guest.tableNo || '—'}</td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                                  guest.attendanceStatus === 'attended'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : guest.attendanceStatus === 'absent'
                                    ? 'bg-rose-50 border-rose-100 text-rose-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                                }`}
                              >
                                {guest.attendanceStatus === 'attended'
                                  ? 'Attended'
                                  : guest.attendanceStatus === 'absent'
                                  ? 'Absent'
                                  : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                            No guests found for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2 lg:col-span-2">
            {/* Outstanding Payments */}
            <section className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Outstanding <span className="text-[#facc15] italic">Payments</span></h2>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">Post-event settlement</p>
                </div>
              </div>

              {financeData?.upcomingPayments && financeData.upcomingPayments.length > 0 ? (
                <div className="space-y-3 mt-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Upcoming payments ({financeData.upcomingPayments.length})
                  </p>
                  <div className="space-y-3">
                    {financeData.upcomingPayments.map((payment, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPayment(payment)}
                        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-black text-gray-900">
                            {payment?.entity || 'Unknown vendor'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                              {payment?.type || 'Payment'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} /> {payment?.due || 'TBD'}
                            </span>
                            <span>{payment?.days || 'N/A'}</span>
                          </div>
                        </div>
                        <p className="text-lg font-black text-gray-900">
                          {payment?.amount || currencyFormatter.format(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                  No upcoming payments have been scheduled for this event.
                </div>
              )}
            </section>

            {/* Recent Expenses */}
            <section className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Cost <span className="text-[#facc15] italic">Breakdown</span></h2>
                  <p className="text-[12px] text-gray-500 font-medium mt-1">Recent event expenses</p>
                </div>
              </div>

              {financeData?.recentExpenses && financeData.recentExpenses.length > 0 ? (
                <div className="space-y-3 mt-6">
                  {financeData.recentExpenses.map((expense, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedExpense(expense)}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {expense?.desc || 'Expense item'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{expense?.subtitle || 'No subtitle'}</span>
                          <span className="rounded-full bg-gray-50 px-2 py-1 text-purple-700 border border-purple-100">
                            {expense?.category || 'Category'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {expense?.date || 'Date unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
                            expense?.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : expense?.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {expense?.status || 'Unknown'}
                        </span>
                        <p className="text-lg font-black text-gray-900">
                          {expense?.amount || currencyFormatter.format(0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                  No recent expenses recorded yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Guest Detail Modal — outside animate-in div so overlay works correctly */}
      {selectedGuest && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="w-full max-w-2xl rounded-[40px] bg-white p-10 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] font-black text-gray-900 tracking-tight">
          View <span className="text-[#facc15] italic">Guest</span>
        </h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          Guest attendee details
        </p>
      </div>

      {/* Grid Layout — 3 columns landscape */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-6">
        {/* Full Name — spans full width */}
        <div className="col-span-3">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Full Legal Name
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.displayName}</p>
        </div>

        {/* Row 2 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Email Address
          </p>
          <p className="text-[13px] font-bold text-gray-900 truncate" title={selectedGuest.email || ''}>{selectedGuest.email || '—'}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Phone
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.phone || '—'}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Guest Code
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.code || '—'}</p>
        </div>

        {/* Row 3 */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            RSVP Status
          </p>
          <span className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-white">
            {selectedGuest.status ? String(selectedGuest.status).toUpperCase() : selectedGuest.rsvpStatus.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Attendance
          </p>
          <span className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-white">
            {selectedGuest.attendanceStatus === 'attended' ? 'ATTENDED' : selectedGuest.attendanceStatus === 'absent' ? 'ABSENT' : 'PENDING'}
          </span>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Table Number
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.tableNo || '—'}</p>
        </div>

        {/* Row 4 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Tier
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.tier || 'Standard'}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Plus One
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.plusOne ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Attendees
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.attendees ?? '1'}</p>
        </div>

        {/* Row 5 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Dietary
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedGuest.dietary || 'None'}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Checked In
          </p>
          <p className="text-[13px] font-bold text-gray-900">
            {selectedGuest.qrScannedAt || selectedGuest.checkedIn ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Notes (Spans full width if exists) */}
        {selectedGuest.notes && (
          <div className="col-span-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Notes
            </p>
            <p className="text-[13px] text-gray-700">{selectedGuest.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSelectedGuest(null)}
          className="flex-1 text-left text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => setSelectedGuest(null)}
          className="rounded-full bg-[#facc15] px-8 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#facc15]/20 transition-all hover:bg-[#eab308]"
        >
          Close Guest
        </button>
      </div>
    </div>
  </div>
)}

      {/* Payment Detail Modal */}
      {selectedPayment && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="w-full max-w-xl rounded-[40px] bg-white p-10 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] font-black text-gray-900 tracking-tight">
          View <span className="text-[#facc15] italic">Payment</span>
        </h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          Upcoming post-event payment details
        </p>
      </div>

      {/* Grid Layout — 2 columns landscape */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {/* Full Name */}
        <div className="col-span-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Entity
          </p>
          <p className="text-[15px] font-bold text-gray-900">{selectedPayment.entity}</p>
        </div>

        {/* Row 2 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Amount
          </p>
          <p className="text-[20px] font-black text-gray-900">{selectedPayment.amount}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Due Date
          </p>
          <p className="text-[15px] font-bold text-gray-900">{selectedPayment.due}</p>
        </div>

        {/* Row 3 */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Type
          </p>
          <span className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-white">
            {selectedPayment.type}
          </span>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Timeline
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedPayment.days}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSelectedPayment(null)}
          className="flex-1 text-left text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => setSelectedPayment(null)}
          className="rounded-full bg-[#facc15] px-8 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#facc15]/20 transition-all hover:bg-[#eab308]"
        >
          Close View
        </button>
      </div>
    </div>
  </div>
)}

      {/* Expense Detail Modal */}
      {selectedExpense && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="w-full max-w-xl rounded-[40px] bg-white p-10 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] font-black text-gray-900 tracking-tight">
          View <span className="text-[#facc15] italic">Expense</span>
        </h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
          Recent event cost breakdown
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {/* Desc */}
        <div className="col-span-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Description
          </p>
          <p className="text-[15px] font-bold text-gray-900">{selectedExpense.desc}</p>
        </div>

        {/* Row 2 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Detail / Entity
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedExpense.subtitle}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Amount
          </p>
          <p className="text-[20px] font-black text-gray-900">{selectedExpense.amount}</p>
        </div>

        {/* Row 3 */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Category
          </p>
          <span className="inline-flex items-center justify-center rounded-full border border-purple-100 px-4 py-1.5 text-[10px] font-bold tracking-widest text-purple-700 bg-purple-50">
            {selectedExpense.category}
          </span>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Status
          </p>
          <span className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
            selectedExpense.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}>
            {selectedExpense.status}
          </span>
        </div>

        {/* Row 4 */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Date
          </p>
          <p className="text-[13px] font-bold text-gray-900">{selectedExpense.date}</p>
        </div>

        {/* Attachment */}
        {selectedExpense.attachmentUrl && (
          <div className="col-span-2 mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Proof of Payment
            </p>
            <a href={selectedExpense.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#d4a017] hover:underline flex items-center gap-2">
              <FileText size={16} />
              {selectedExpense.attachmentName || 'View Attachment'}
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSelectedExpense(null)}
          className="flex-1 text-left text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => setSelectedExpense(null)}
          className="rounded-full bg-[#facc15] px-8 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#facc15]/20 transition-all hover:bg-[#eab308]"
        >
          Close View
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}