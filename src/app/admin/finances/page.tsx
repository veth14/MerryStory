import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';

const MOCK_EVENTS = [
  { id: '1', name: 'Starlight Gala 2026', date: 'Mar 15, 2026', location: 'Grand Ballroom', status: 'Active' },
  { id: '2', name: 'Tech Summit Innovate', date: 'Apr 02, 2026', location: 'Convention Center', status: 'Active' },
  { id: '3', name: 'Sapphire Nuptials', date: 'Jun 18, 2026', location: 'Botanical Gardens', status: 'Planning' },
  { id: '4', name: 'Corporate Leadership Retreat', date: 'Sep 10, 2026', location: 'Alpine Resort', status: 'Planning' },
];

export default function FinancesEventSelectorPage() {
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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EVENTS.map(event => (
          <Link href={`/admin/finances/${event.id}`} key={event.id}>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col h-full cursor-pointer">
              
              <div className="flex justify-between items-start mb-4">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    event.status === 'Active' 
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

    </div>
  );
}
