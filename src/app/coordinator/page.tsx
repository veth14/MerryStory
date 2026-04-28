'use client';

import React from 'react';
import { Calendar, CheckCircle2, Circle, Clock, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CoordinatorDashboard() {
  const { role } = useAuth();

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Overview <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Dashboard</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Welcome back, <span className="text-[#d4a017] italic pr-2">{role === 'staff' ? 'Staff' : 'Coordinator'}</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Here's a quick summary of your assigned events, active tasks, and recent client activity. Let's make today memorable.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Metric 1 */}
        {role !== 'staff' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fff9e6] rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Assigned Events</h3>
              <div className="w-8 h-8 rounded-full bg-[#fff9e6] flex items-center justify-center text-[#d4a017]">
                <Calendar size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">2</span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
            </div>
          </div>
          <p className="text-xs text-[#71717a] mt-6 font-semibold pt-4 border-t border-gray-50 flex justify-between">
            <span>Next event:</span>
            <span className="text-[#1d1d1f]">Oct 14, 2026</span>
          </p>
        </div>
        )}

        {/* Metric 2: Pending Tasks with Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">Pending Tasks</h3>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ClipboardCheck size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 text-left">
              <span className="text-4xl font-black">8</span>
              <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md uppercase tracking-widest">Action Required</span>
            </div>
          </div>
          
          <div className="mt-5 space-y-2.5 pt-4 border-t border-gray-50">
             <div className="flex justify-between text-xs font-semibold">
               <span className="text-[#71717a] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Garcia Wedding</span>
               <span className="text-[#1d1d1f]">5 tasks</span>
             </div>
             <div className="flex justify-between text-xs font-semibold">
               <span className="text-[#71717a] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Lim Launch</span>
               <span className="text-[#1d1d1f]">3 tasks</span>
             </div>
          </div>
        </div>

        {/* Metric 3: RSVP Tracker */}
        {role !== 'staff' && (
        <div className="bg-[#1d1d1f] text-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-800 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">RSVP Tracking</h3>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">124</span>
              <span className="text-[10px] font-extrabold text-[#d4a017] bg-[#d4a017]/10 border border-[#d4a017]/20 px-2 py-1 rounded-md uppercase tracking-widest">Seats Confirmed</span>
            </div>
          </div>
          <div className="w-full mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">
              <span>Garcia Wedding</span>
              <span className="text-white">82% Fill Rate</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
               <div className="bg-[#d4a017] h-full rounded-full w-[82%]"></div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Priority List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f]">Priority Action Items</h2>
              <p className="text-xs text-[#a1a1aa] mt-1">Check off tasks assigned by Admin</p>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017] hover:text-[#b88c14] transition-colors">View All Tasks</button>
          </div>
          
          <div className="p-0">
            {/* Mock Task Item */}
            <div className="p-4 px-6 flex items-center gap-4 hover:bg-[#fafafa] transition-colors border-b border-gray-50 group cursor-pointer">
              <div className="text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0">
                <Circle size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1d1d1f]">Finalize seating arrangement with caterer</p>
                <p className="text-[11px] font-bold text-[#a1a1aa] mt-0.5">Garcia Wedding • Event Operations</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 rounded-md">
                  <Clock size={10} /> Overdue
                </span>
              </div>
            </div>

            {/* Mock Task Item */}
            <div className="p-4 px-6 flex items-center gap-4 hover:bg-[#fafafa] transition-colors border-b border-gray-50 group cursor-pointer">
              <div className="text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0">
                <Circle size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1d1d1f]">Follow up on pending VIP RSVPs</p>
                <p className="text-[11px] font-bold text-[#a1a1aa] mt-0.5">Lim Launch • Client Comms</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                  <Clock size={10} /> Due Today
                </span>
              </div>
            </div>
            
            {/* Completed Task Item */}
            <div className="p-4 px-6 flex items-center gap-4 hover:bg-[#fafafa] transition-colors group cursor-pointer opacity-60">
              <div className="text-emerald-500 shrink-0">
                <CheckCircle2 size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#a1a1aa] line-through decoration-gray-300">Send introductory email to photographer</p>
                <p className="text-[11px] font-bold text-[#a1a1aa] mt-0.5">Garcia Wedding • Vendor Checks</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[10px] font-bold text-[#a1a1aa]">Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Assigned Event */}
        {role !== 'staff' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1d1d1f]">Up Next</h2>
            <p className="text-xs text-[#a1a1aa] mt-1">Your nearest assigned event</p>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#fff9e6] flex items-center justify-center text-[#d4a017] mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-black text-[#1d1d1f]">Garcia-Reyes Wedding</h3>
            <p className="text-sm font-bold text-[#d4a017] mt-1">Manila Peninsula Hotel</p>
            <p className="text-xs font-medium text-[#71717a] mt-3 max-w-[200px] leading-relaxed">
              Main reception and ceremony operations assigned by Admin.
            </p>
            
            <div className="w-full mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-center text-left">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Date</p>
                <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">Oct 14, 2026</p>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="text-right">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Time</p>
                <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">3:00 PM PST</p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}