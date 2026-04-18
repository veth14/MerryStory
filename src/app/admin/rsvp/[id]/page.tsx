'use client';
import React, { useState } from 'react';
import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

const GUESTS = [
  {
    id: 1,
    name: 'Alexander Vance',
    tier: 'PLATINUM TIER',
    code: '56-2025-X991',
    status: 'CONFIRMED',
    avatar: 'A'
  },
  {
    id: 2,
    name: 'Isabella Thorne',
    tier: 'VIP TIER',
    code: '56-2025-L012',
    status: 'PENDING',
    avatar: 'I'
  },
  {
    id: 3,
    name: 'Julian Mercer',
    tier: 'STANDARD TIER',
    code: '56-2025-E25X',
    status: 'DECLINED',
    avatar: 'J'
  },
  {
    id: 4,
    name: 'Elena Sastro',
    tier: 'PLATINUM TIER',
    code: '56-2025-P339',
    status: 'CONFIRMED',
    avatar: 'E'
  }
];

export default function RsvpDetailPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredGuests = GUESTS.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(search.toLowerCase()) || guest.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-6 mt-2">
      {/* Breadcrumb / Back Navigation */}
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        BACK TO EVENTS
      </Link>

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Invitations <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Guest List</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Guest <span className="text-[#eebf43] italic pr-2">Registry</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            A curated overview of your production's attendee lifecycle. Manage high-tier classifications and track real-time RSVP engagement metrics.
          </p>
        </div>
        <Link 
          href="/admin/rsvp/scan"
          className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          SCAN QR TICKET
        </Link>
      </div>

      {/* KPI Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Guests */}
        <div className="bg-white p-4 shadow-sm border border-gray-100 border-l-4 border-l-[#facc15] flex flex-col justify-center relative overflow-hidden">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TOTAL GUESTS</div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">1,248</div>
            <div className="text-[11px] font-bold text-[#d4a017]">+12% vs LY</div>
          </div>
        </div>

        {/* Confirmed Count */}
        <div className="bg-white p-4 shadow-sm border border-gray-100 border-l-4 border-l-gray-900 flex flex-col justify-center relative overflow-hidden">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">CONFIRMED COUNT</div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">842</div>
            <div className="text-[11px] font-medium text-gray-400">67.5% Ratio</div>
          </div>
        </div>

        {/* Codes Used */}
        <div className="bg-white p-4 shadow-sm border border-gray-100 border-l-4 border-l-[#facc15] flex flex-col justify-center relative overflow-hidden">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">CODES USED</div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">91%</div>
            <div className="flex-1 max-w-[120px]">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#facc15]" style={{ width: '91%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tool bar */}
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE GUEST REGISTRY</h2>
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH GUEST..." 
                className="pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[13px] font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:bg-white transition-all w-full md:w-64" 
              />
            </div>
            
            {/* Filter Button / Select */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="DECLINED">DECLINED</option>
              </select>
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] w-1/3">GUEST NAME</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-1/4">UNIQUE RSVP CODE</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-1/4">STATUS</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 font-medium text-[13px]">
                    No guests found matching your criteria.
                  </td>
                </tr>
              ) : filteredGuests.map((guest, idx) => {
                let statusColor = "text-gray-500 bg-gray-50";
                let dotColor = "bg-gray-400";
                if (guest.status === 'CONFIRMED') {
                  statusColor = "text-emerald-700 bg-emerald-50";
                  dotColor = "bg-emerald-500";
                } else if (guest.status === 'PENDING') {
                  statusColor = "text-amber-700 bg-amber-50";
                  dotColor = "bg-amber-500";
                } else if (guest.status === 'DECLINED') {
                  statusColor = "text-red-700 bg-red-50";
                  dotColor = "bg-red-500";
                }

                return (
                  <tr key={guest.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gray-800 text-white rounded-lg flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm border border-gray-200">
                          {idx % 2 === 0 ? (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${guest.name}`} alt={guest.name} className="w-full h-full object-cover" />
                          ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${guest.id}x`} alt={guest.name} className="w-full h-full object-cover bg-gray-100" />
                          )}
                        </div>
                        {/* Detail */}
                        <div>
                          <div className="font-extrabold text-[14px] text-gray-900 group-hover:text-[#d4a017] transition-colors">{guest.name}</div>
                          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">
                            {guest.tier}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 font-mono text-[11px] font-bold rounded-md tracking-wider">
                        {guest.code}
                      </span>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {guest.status}
                      </span>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-right align-middle">
                      <button className="inline-block text-[11px] font-black text-gray-400 tracking-widest uppercase hover:text-[#d4a017] transition-colors">
                        SEND LINK
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & inline Pagination */}
        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            SHOWING 1-{filteredGuests.length} OF 1,248 ENTRIES
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-[11px] font-extrabold text-gray-500 uppercase tracking-widest hover:border-gray-300 hover:text-gray-700 transition-colors shadow-sm">
              PREV
            </button>
            <button className="px-4 py-2 bg-[#facc15] border border-[#eab308] rounded-lg text-[11px] font-extrabold text-gray-900 uppercase tracking-widest hover:bg-[#eab308] transition-colors shadow-sm">
              NEXT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}