'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Calendar, MapPin, Users, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Event {
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
  coverImageUrl?: string;
}

export default function ProjectsView({ archived }: { archived?: boolean } ) {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All types');
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; desc: string; action: (() => Promise<void>) | null; type: 'info' | 'danger' }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  const openModal = (title: string, desc: string, action: (() => Promise<void>) | null = null, type: 'info' | 'danger' = 'info') => {
    setModal({ isOpen: true, title, desc, action, type });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, archived]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const idToken = await user!.getIdToken();
      const endpoint = archived ? '/api/events/archived' : '/api/events';
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load events.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const title = event.title || '';
    const location = event.location || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All types' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Productions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-2xl relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="relative">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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

          <Link href="/admin/events/new" className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#facc15] hover:bg-[#eab308] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-all rounded-xl shadow-md shadow-yellow-500/10 whitespace-nowrap">
             <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
             New Event
          </Link>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
             <Plus className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">No Events Found</h3>
          <p className="text-[13px] text-gray-400 font-medium mt-1 max-w-xs">
            {searchQuery ? "We couldn't find any events matching your search." : "You haven't initialized any event productions yet."}
          </p>
          {!searchQuery && (
            <Link href="/admin/events/new" className="mt-6 text-[11px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:underline">
              Create your first event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">    
          {filteredEvents.map((event) => (
            <div key={event._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className={`absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm ${
                  event.status === 'At Risk' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {event.status || 'Active'}
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">{event.title}</h3>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location || 'No Location'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {event.guests?.invited || 0}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="text-gray-900">
                      {event.vendors ? Math.round((event.vendors.secured / event.vendors.total) * 100) || 0 : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#facc15] h-full rounded-full transition-all" 
                      style={{ width: `${event.vendors ? Math.round((event.vendors.secured / event.vendors.total) * 100) || 0 : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 mt-2 uppercase">
                    Budget: ₱{event.budget?.total?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto">
                  {!archived && (
                    <>
                      <Link href={`/admin/events/${event._id}`} className="w-full bg-[#d4a017] hover:bg-[#c49214] text-white font-extrabold uppercase tracking-widest py-3 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center">        
                        Event Dashboard
                      </Link>
                      <div className="flex gap-2">
                        <Link href={`/admin/rsvp/${event._id}`} className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          RSVP
                        </Link>
                        <Link href={`/admin/tasks/${event._id}`} className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          Tasks
                        </Link>
                        <Link href={`/admin/finances/${event._id}`} className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Finances
                        </Link>
                      </div>
                    </>
                  )}

                  {archived && role === 'admin' && (
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        try {
                          const idToken = await user!.getIdToken();
                          const res = await fetch(`/api/events/${event._id}/archive`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                            body: JSON.stringify({ action: 'restore' })
                          });
                          if (res.ok) fetchEvents();
                        } catch (err) { console.error(err); }
                      }} className="flex-1 border-2 border-gray-100 hover:border-green-600 text-green-600 font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all">Restore</button>
                      <button onClick={() => openModal('Permanently delete event', 'This will permanently delete the event and cannot be undone. Are you sure?', async () => {
                        try {
                          const idToken = await user!.getIdToken();
                          const res = await fetch(`/api/events/${event._id}/archive`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                            body: JSON.stringify({ action: 'delete' })
                          });
                          if (res.ok) await fetchEvents();
                        } catch (err) { console.error(err); }
                      }, 'danger') } className="flex-1 border-2 border-red-100 hover:border-red-600 text-red-600 font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all">Delete Now</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1d1d1f]">{modal.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{modal.desc}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-2xl">✕</button>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={async () => { if (modal.action) await modal.action(); closeModal(); }} className={`flex-1 py-3 rounded-xl font-extrabold ${modal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-[#facc15] text-white'}`}>
                {modal.type === 'danger' ? 'Delete' : 'Confirm'}
              </button>
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border-2 border-gray-100 font-extrabold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
