'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ArrowRight, Eye, Users, Loader2, Image as ImageIcon, Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

interface AssignedEvent {
  _id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  health?: number;
  status?: string;
  coverImageUrl?: string | null;
  guests?: {
    invited?: number;
  };
  leadAssigned?: string;
  team?: { name?: string }[];
}

interface UserProfile {
  name?: string;
}

const normalizeName = (value?: string | null) => (value || '').trim().toLowerCase();

const formatEventDateTime = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
};

const getStatusTextClassName = (status?: string) => {
  if (status === 'At Risk') return 'text-red-600';
  if (status === 'Completed') return 'text-emerald-600';
  if (status === 'On Hold') return 'text-gray-600';
  return 'text-yellow-600';
};

export default function CoordinatorEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All types');

  useEffect(() => {
    if (user) {
      fetchAssignedEvents();
    }
  }, [user]);

  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const idToken = await user!.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [profileResponse, eventsResponse] = await Promise.all([
        fetch('/api/users/profile', { headers }),
        fetch('/api/events', { headers }),
      ]);

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const profilePayload: UserProfile | null = profileResponse.ok ? await profileResponse.json() : null;
      const currentUserName = normalizeName(profilePayload?.name || user?.displayName || user?.email);
      const payload = await eventsResponse.json();
      const records = Array.isArray(payload) ? payload : [];

      setEvents(
        currentUserName
          ? records.filter((event: AssignedEvent) => {
              const isLead = normalizeName(event.leadAssigned) === currentUserName;
              const isTeamMember = Array.isArray(event.team)
                ? event.team.some((member) => normalizeName(member?.name) === currentUserName)
                : false;
              return isLead || isTeamMember;
            })
          : []
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load assigned events.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const title = event.title || '';
        const location = event.location || '';
        const matchesSearch =
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All types' || event.type === filterType;
        return matchesSearch && matchesType;
      }),
    [events, filterType, searchQuery]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Assigned Events...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2 animate-in fade-in duration-500">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Events</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Assigned <span className="text-[#d4a017] italic pr-2">Events</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            View the schedules, timelines, and execution details for the events you are assigned to coordinate. Use this hub to track upcoming functions.
          </p>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500 delay-150">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-2xl relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event...."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="relative">
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="appearance-none bg-white border border-gray-100 text-gray-700 text-[14px] font-bold rounded-xl pl-5 pr-12 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 cursor-pointer min-w-[140px]"
              >
                <option>All types</option>
                <option>Wedding</option>
                <option>Corporate</option>
                <option>Gala</option>
                <option>Exhibition</option>
                <option>Private</option>
              </select>
              <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            <div className="bg-[#fff9e6] text-[#d4a017] px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm border border-yellow-200/50 whitespace-nowrap">
              <Eye size={14} strokeWidth={2.5} /> Read Only
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Calendar className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">No Assigned Events Found</h3>
            <p className="text-[13px] text-gray-400 font-medium mt-1 max-w-xs">
              {searchQuery ? "We couldn't find any assigned events matching your search." : 'There are no events assigned to your coordinator profile yet.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row items-center gap-4 md:gap-8 pr-0 md:pr-8 group">
                <div className="w-full md:w-72 h-48 md:h-full min-h-[180px] bg-gray-200 relative overflow-hidden shrink-0 pb-0">
                  {event.coverImageUrl ? (
                    <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className={`absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm ${getStatusTextClassName(event.status)}`}>
                    {event.status || 'Active'}
                  </div>
                </div>

                <div className="py-6 px-6 md:px-0 flex-1 w-full flex flex-col justify-center">
                  <h3 className="text-2xl font-black text-[#1d1d1f] mb-3 tracking-tight">{event.title}</h3>

                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-[#71717a] mb-6">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#d4a017]" />
                      {formatEventDateTime(event.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#d4a017]" />
                      {event.location || 'No Location'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-[#d4a017]" />
                      {event.guests?.invited || 0} Guests
                    </span>
                  </div>

                  <div className="max-w-md">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-2">
                      <span>Health Status</span>
                      <span className="text-[#1d1d1f]">{event.health ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#facc15] h-full rounded-full transition-all" style={{ width: `${event.health ?? 0}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pb-6 px-6 md:px-0 md:py-6 w-full md:w-auto flex shrink-0 md:border-l border-gray-100/50 md:pl-8 pt-4 md:pt-0">
                  <Link href={`/coordinator/events/${event._id}`} className="w-full md:w-auto bg-[#1d1d1f] hover:bg-[#d4a017] text-white font-extrabold uppercase tracking-widest px-8 py-3.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2">
                    Event Dashboard <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
