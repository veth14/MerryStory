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

    const guests = rawGuests.map((guest) => {
      const statusValue = String(guest?.status || '').toLowerCase();
      const normalizedStatus =
        statusValue === 'confirmed' ? 'confirmed' : statusValue === 'declined' ? 'declined' : 'pending';
      const isCheckedIn = Boolean(guest?.checkedIn || guest?.qrScannedAt || guest?.usedAt);
      const attendanceStatus =
        isCheckedIn ? 'attended' : normalizedStatus === 'confirmed' ? 'absent' : 'pending';

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
  }, [rawGuests]);

  const loading = !financeData && !financeError;
  const error = financeError?.message ?? '';

  const [editableVendors, setEditableVendors] = useState<VendorWithRating[]>([]);

  useEffect(() => {
    setEditableVendors(vendors);
  }, [vendors]);

  const associatedVendors = editableVendors.filter((v) => v.isAssociated) ?? [];

  const attendanceRate =
    guestData && guestData.totalRsvps > 0
      ? Math.round((guestData.totalAttended / guestData.totalRsvps) * 100)
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
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4a017]">
                Post-Event Snapshot
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#1c1c1c] tracking-tight">
                Performance summary
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                A simplified view of attendance, cost, and settlement status in the same production workspace style.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-center">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400">Attendance rate</p>
              <p className="mt-6 text-5xl font-black text-gray-900">{attendanceRate}%</p>
              <p className="mt-3 text-sm text-gray-500">
                {guestData?.totalAttended ?? 0} of {guestData?.totalRsvps ?? 0} attended
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-center">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400">Total RSVPs</p>
              <p className="mt-6 text-5xl font-black text-[#15803d]">{guestData?.totalRsvps ?? 0}</p>
              <p className="mt-3 text-sm text-gray-500">Confirmed responses</p>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-center">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400">Total Cost</p>
              <p className="mt-6 text-5xl font-black text-[#7c3aed]">{totalEventCost}</p>
              <p className="mt-3 text-sm text-gray-500">Event expenses summary</p>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-center">
              <p className="text-[10px] uppercase tracking-[0.32em] text-gray-400">Outstanding</p>
              <p className="mt-6 text-5xl font-black text-[#dc2626]">{outstandingBalance}</p>
              <p className="mt-3 text-sm text-gray-500">Amount due for settlement</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-5">
            {/* Vendor Scorecard */}
            <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4a017]">
                    Vendor Performance Review
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-[#1c1c1c] tracking-tight">
                    Vendor scorecard
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
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
            <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4a017]">
                    Attendance overview
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-[#1c1c1c] tracking-tight">
                    Guest engagement
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Confirmed RSVPs: {guestData?.totalRsvps ?? 0} · Attended: {guestData?.totalAttended ?? 0} · Absent:{' '}
                    {guestData?.totalAbsent ?? 0} · Declined: {guestData?.totalDeclined ?? 0} · Pending:{' '}
                    {guestData?.totalPending ?? 0}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(['all', 'attended', 'absent', 'pending'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setGuestFilter(filter)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
                        guestFilter === filter
                          ? 'bg-[#facc15] text-[#1c1c1c] shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
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

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: 'Attended', value: guestData?.totalAttended ?? 0, accent: 'green', subtitle: 'Arrived' },
                  { title: 'Absent', value: guestData?.totalAbsent ?? 0, accent: 'red', subtitle: 'No-shows' },
                  { title: 'Declined', value: guestData?.totalDeclined ?? 0, accent: 'orange', subtitle: 'Declined RSVPs' },
                  { title: 'Pending', value: guestData?.totalPending ?? 0, accent: 'gray', subtitle: 'Awaiting response' },
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-center"
                  >
                    <p className="text-[10px] uppercase tracking-[0.28em] text-gray-400">{stat.title}</p>
                    <p
                      className={`mt-5 text-5xl font-black ${
                        stat.accent === 'green'
                          ? 'text-green-600'
                          : stat.accent === 'red'
                          ? 'text-red-600'
                          : stat.accent === 'orange'
                          ? 'text-orange-600'
                          : 'text-gray-800'
                      }`}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-gray-400">{stat.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* Guest Table */}
              <div className="mt-6 rounded-[28px] border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#1c1c1c]">Guest list</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filteredGuests.length} guests{guestFilter !== 'all' ? ` · filtered ${guestFilter}` : ''}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
                    <span className="text-xs uppercase tracking-[0.25em] text-gray-400">Total</span>
                    {guestData?.guests.length ?? 0}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse table-auto text-left text-sm">
                    <thead className="bg-[#fafafa] text-xs uppercase tracking-[0.25em] text-gray-400">
                      <tr>
                        <th className="px-6 py-4 text-left">Name</th>
                        <th className="px-6 py-4 text-left">Contact</th>
                        <th className="px-6 py-4 text-center">Code</th>
                        <th className="px-6 py-4 text-center">RSVP</th>
                        <th className="px-6 py-4 text-center">Table</th>
                        <th className="px-6 py-4 text-center">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredGuests.length > 0 ? (
                        filteredGuests.map((guest) => (
                          <tr
                            key={guest._id}
                            onClick={() => setSelectedGuest(guest)}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">{guest.displayName}</p>
                              {guest.plusOne && (
                                <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#d4a017]">+1</p>
                              )}
                              {guest.tier && (
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">{guest.tier}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              <p>{guest.email || 'No email'}</p>
                              {guest.phone && <p className="mt-1 text-xs text-gray-400">{guest.phone}</p>}
                              {guest.notes && <p className="mt-1 text-xs text-gray-400">{guest.notes}</p>}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600">{guest.code || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                                  guest.rsvpStatus === 'accepted'
                                    ? 'bg-green-100 text-green-700'
                                    : guest.rsvpStatus === 'declined'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {guest.status
                                  ? String(guest.status).replace(/^(.)/, (m) => m.toUpperCase())
                                  : guest.rsvpStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-900">{guest.tableNo || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                                  guest.attendanceStatus === 'attended'
                                    ? 'bg-green-100 text-green-700'
                                    : guest.attendanceStatus === 'absent'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
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

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Outstanding Payments */}
            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4a017]">
                    Outstanding payments
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-[#1c1c1c] tracking-tight">
                    Post-event settlement
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Review vendor invoices and payment milestones.
                  </p>
                </div>
                <div className="rounded-3xl bg-red-50 p-3 text-red-700">
                  <DollarSign size={20} />
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
                        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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
            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4a017]">
                    Recent expenses
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-[#1c1c1c] tracking-tight">
                    Event cost breakdown
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Most recent spending entries from the event budget.
                  </p>
                </div>
                <div className="rounded-3xl bg-purple-50 p-3 text-purple-700">
                  <FileText size={20} />
                </div>
              </div>

              {financeData?.recentExpenses && financeData.recentExpenses.length > 0 ? (
                <div className="space-y-3 mt-6">
                  {financeData.recentExpenses.map((expense, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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
    <div className="w-full max-w-2xl rounded-[28px] bg-white p-8 shadow-2xl">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-950">
          View <span className="text-[#facc15] italic">Guest</span>
        </h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
          Guest attendee details
        </p>
      </div>

      {/* Grid Layout — 3 columns landscape */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-5">

        {/* Full Name — spans full width */}
        <div className="col-span-3">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Full Legal Name
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.displayName}</p>
        </div>

        {/* Email */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Email Address
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.email || '—'}</p>
        </div>

        {/* Phone */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Phone
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.phone || '—'}</p>
        </div>

        {/* Guest Code */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Guest Code
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.code || '—'}</p>
        </div>

        {/* RSVP Status */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            RSVP Status
          </p>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
            selectedGuest.rsvpStatus === 'accepted'
              ? 'bg-green-100 text-green-700'
              : selectedGuest.rsvpStatus === 'declined'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {selectedGuest.status
              ? String(selectedGuest.status).replace(/^(.)/, (m) => m.toUpperCase())
              : selectedGuest.rsvpStatus}
          </span>
        </div>

        {/* Attendance */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Attendance
          </p>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
            selectedGuest.attendanceStatus === 'attended'
              ? 'bg-green-100 text-green-700'
              : selectedGuest.attendanceStatus === 'absent'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {selectedGuest.attendanceStatus === 'attended'
              ? 'Attended'
              : selectedGuest.attendanceStatus === 'absent'
              ? 'Absent'
              : 'Pending'}
          </span>
        </div>

        {/* Table Number */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Table Number
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.tableNo || '—'}</p>
        </div>

        {/* Tier */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Tier
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.tier || '—'}</p>
        </div>

        {/* Plus One */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Plus One
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.plusOne ? 'Yes' : 'No'}</p>
        </div>

        {/* Attendees */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Attendees
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.attendees ?? '1'}</p>
        </div>

        {/* Dietary */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Dietary
          </p>
          <p className="text-sm font-bold text-gray-900">{selectedGuest.dietary || 'None'}</p>
        </div>

        {/* Checked In */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Checked In
          </p>
          <p className="text-sm font-bold text-gray-900">
            {selectedGuest.qrScannedAt || selectedGuest.usedAt || selectedGuest.checkedIn ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Notes — spans full width */}
        {selectedGuest.notes && (
          <div className="col-span-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Notes
            </p>
            <p className="text-sm text-gray-700">{selectedGuest.notes}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-gray-100" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedGuest(null)}
          className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-600 transition"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => setSelectedGuest(null)}
          className="rounded-full bg-[#facc15] px-8 py-3 text-sm font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-[#facc15]/30 transition hover:brightness-95"
        >
          Close Guest
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}