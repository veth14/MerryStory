'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Loader } from 'lucide-react';
import { getFirebaseClientAuth } from '@/lib/firebase/client';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
}

export default function FinancesEventSelectorPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const auth = getFirebaseClientAuth();
        
        // Get current user and their token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const token = await user.getIdToken();
        
        const response = await fetch('/api/finances', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [hydrated]);

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 pt-2">
        <div>
          <p className="text-[#a88231] text-[10px] font-extrabold tracking-widest uppercase mb-3">Financials</p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Select an <span className="text-[#eebf43] italic pr-2">Event</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Choose an active or planned event to view its specialized financial ledger, tracking expenses, revenues, and invoices.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-[#eebf43] mr-3" />
          <p className="text-[#71717a]">Loading events...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Events Grid */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Link href={`/admin/finances/${event.id}`} key={event.id}>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col h-full cursor-pointer">
                
                <div className="flex justify-between items-start mb-4">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      event.status === 'Active Production' || event.status === 'Active'
                        ? 'bg-[#fef9ec] text-[#a88231] border border-[#eebf43]/20' 
                        : 'bg-gray-100 text-[#71717a] border border-gray-200'
                   }`}>
                     {event.status}
                   </span>
                </div>
                
                <h2 className="text-xl font-black text-[#1d1d1f] mb-4 group-hover:text-[#eebf43] transition-colors">{event.name}</h2>
                
                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-[#71717a] text-xs font-medium">
                    <Calendar size={14} className="text-[#a1a1aa]" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-[#71717a] text-xs font-medium">
                    <MapPin size={14} className="text-[#a1a1aa]" /> {event.location}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between group-hover:text-[#1d1d1f] text-[#a1a1aa] transition-colors">
                   <span className="text-[10px] font-bold uppercase tracking-widest">View Ledger</span>
                   <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-[#71717a] text-lg">No events found. Create an event to get started.</p>
        </div>
      )}

    </div>
  );
}
