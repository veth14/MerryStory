'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ArrowRight, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

type EventRecord = {
  _id: string;
  title?: string;
  type?: string;
  date?: string;
  location?: string;
  status?: string;
  health?: number;
  coverImageUrl?: string | null;
  initialAlert?: string;
  guests?: {
    invited?: number;
    rsvp?: number;
  };
};

type TaskRecord = {
  _id: string;
  eventId?: string;
  status?: string;
  assignee?: {
    name?: string;
  };
  assignees?: Array<{
    name?: string;
  }>;
};

type EventCardData = {
  id: string;
  title: string;
  type: string;
  dateLabel: string;
  location: string;
  guestCount: number;
  completionPct: number;
  statusLabel: string;
  statusClasses: string;
  coverImageUrl: string;
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
];

const formatEventDate = (dateValue?: string) => {
  if (!dateValue) return 'TBD';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeTaskStatus = (value?: string) => {
  const normalized = (value || '').toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'DONE';
  if (normalized === 'TODO') return 'TO DO';
  if (normalized === 'INPROGRESS') return 'IN PROGRESS';
  return normalized;
};

const normalizeStatus = (event: EventRecord, completionPct: number) => {
  const status = normalizeTaskStatus(event.status);
  const health = typeof event.health === 'number' ? event.health : null;
  const lower = status.toLowerCase();

  if (lower.includes('risk') || lower.includes('delay') || (health !== null && health < 50)) {
    return {
      label: 'At Risk',
      classes: 'bg-red-50 text-red-600',
    };
  }

  if (completionPct >= 100 || lower.includes('complete')) {
    return {
      label: 'Completed',
      classes: 'bg-emerald-50 text-emerald-600',
    };
  }

  return {
    label: 'In Progress',
    classes: 'bg-white/90 backdrop-blur-sm text-yellow-600',
  };
};

export default function CoordinatorEventsPage() {
  const router = useRouter();
  const { role, user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');

  useEffect(() => {
    if (role === 'staff') {
      router.replace('/coordinator');
    }
  }, [role, router]);

  useEffect(() => {
    const fetchAssignedEvents = async () => {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        const userName = user.displayName;

        if (!userName) {
          setEvents([]);
          setTasks([]);
          return;
        }

        const [eventsRes, tasksRes] = await Promise.all([
          fetch('/api/events', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/tasks?assignee=${encodeURIComponent(userName)}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        const [eventsData, tasksData] = await Promise.all([
          eventsRes.ok ? eventsRes.json() : [],
          tasksRes.ok ? tasksRes.json() : [],
        ]);

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (error) {
        console.error('Failed to load coordinator events:', error);
        setEvents([]);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedEvents();
  }, [user]);

  const eventCards = useMemo<EventCardData[]>(() => {
    const tasksByEvent = tasks.reduce<Record<string, TaskRecord[]>>((acc, task) => {
      if (!task.eventId) return acc;
      acc[task.eventId] = acc[task.eventId] || [];
      acc[task.eventId].push(task);
      return acc;
    }, {});

    return events
      .filter((event) => event?._id && tasksByEvent[event._id]?.length)
      .map((event, index) => {
        const eventTasks = tasksByEvent[event._id] || [];
        const completedTasks = eventTasks.filter((task) => normalizeTaskStatus(task.status) === 'DONE').length;
        const completionPct = eventTasks.length > 0 ? Math.round((completedTasks / eventTasks.length) * 100) : 0;
        const status = normalizeStatus(event, completionPct);

        return {
          id: event._id,
          title: event.title || 'Untitled Event',
          type: event.type || 'Uncategorized',
          dateLabel: formatEventDate(event.date),
          location: event.location || 'Venue TBD',
          guestCount: event.guests?.invited || 0,
          completionPct,
          statusLabel: status.label,
          statusClasses: status.classes,
          coverImageUrl: event.coverImageUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
        };
      });
  }, [events, tasks]);

  const eventTypes = useMemo(() => {
    const uniqueTypes = Array.from(new Set(eventCards.map((event) => event.type).filter(Boolean)));
    return ['All types', ...uniqueTypes];
  }, [eventCards]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return eventCards.filter((event) => {
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query);
      const matchesType = typeFilter === 'All types' || event.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [eventCards, searchTerm, typeFilter]);

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
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-2xl relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search event...."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-100 text-gray-700 text-[14px] font-bold rounded-xl pl-5 pr-12 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 cursor-pointer min-w-[140px]"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            <div className="bg-[#fff9e6] text-[#d4a017] px-5 py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm border border-yellow-200/50 whitespace-nowrap">
              <Eye size={14} strokeWidth={2.5} /> Read Only
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-sm font-medium text-[#71717a]">
              Loading assigned events...
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-sm font-medium text-[#71717a]">
              No assigned events found for your current task list.
            </div>
          )}

          {!loading && filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row items-center gap-4 md:gap-8 pr-0 md:pr-8 group">
              <div className="w-full md:w-72 h-48 md:h-full min-h-[180px] bg-gray-200 relative overflow-hidden shrink-0 pb-0">
                <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm ${event.statusClasses}`}>
                  {event.statusLabel}
                </div>
              </div>

              <div className="py-6 px-6 md:px-0 flex-1 w-full flex flex-col justify-center">
                <h3 className="text-2xl font-black text-[#1d1d1f] mb-3 tracking-tight">{event.title}</h3>

                <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-[#71717a] mb-6">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#d4a017]" />
                    {event.dateLabel}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {event.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-[#d4a017]" />
                    {event.guestCount} Guests
                  </span>
                </div>

                <div className="max-w-md">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-2">
                    <span>Execution Progress</span>
                    <span className="text-[#1d1d1f]">{event.completionPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#facc15] h-full rounded-full transition-all" style={{ width: `${event.completionPct}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pb-6 px-6 md:px-0 md:py-6 w-full md:w-auto flex shrink-0 md:border-l border-gray-100/50 md:pl-8 pt-4 md:pt-0">
                <Link href={`/coordinator/events/${event.id}`} className="w-full md:w-auto bg-[#1d1d1f] hover:bg-[#d4a017] text-white font-extrabold uppercase tracking-widest px-8 py-3.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2">
                  Event Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
