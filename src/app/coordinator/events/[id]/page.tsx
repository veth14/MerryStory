'use client';

import React, { useState, use, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ClipboardCheck, 
  CheckCircle2, 
  Circle,
  Tag,
  MessageSquare,
  Link as LinkIcon
} from 'lucide-react';

export default function CoordinatorEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8">Loading event details...</div>}>
      <CoordinatorEventDetailsContent params={params} />
    </Suspense>
  );
}

function CoordinatorEventDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTab = (searchParams.get('tab') as 'overview' | 'tasks' | 'rsvp') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'rsvp'>(initialTab);
  const { id } = use(params);

  // Sync searchParams changing
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'tasks', 'rsvp'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'overview' | 'tasks' | 'rsvp') => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  // Mock specific event
  const event = {
    id: id,
    name: "Garcia-Reyes Wedding",
    type: "Wedding",
    date: "Oct 14, 2026",
    time: "3:00 PM PST",
    location: "Manila Peninsula",
    address: "Makati, Metro Manila",
    status: "Confirmed",
    guests: {
      confirmed: 124,
      total: 150
    },
    tasks: {
      completed: 12,
      total: 17
    }
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <Link href="/coordinator/events" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] hover:text-[#d4a017] transition-colors mb-6 group">
        <ArrowRight size={12} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to Events
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Events <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{event.name}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#d4a017] italic pr-2">Overview</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Execution and logistics hub for {event.name}. Track your required tasks and monitor guest check-ins.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {event.status}
           </span>
        </div>
      </div>

      <div className="w-full mt-10 animate-in fade-in duration-500">
        <div className="w-full flex flex-col">
          
          {/* Tabs Navigation */}
          <div className="border-b-2 border-gray-100 flex overflow-x-auto scrollbar-hide mb-8">
            <button 
              onClick={() => handleTabChange('overview')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'overview' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Calendar size={16} /> Schedule & Info
            </button>
            <button 
              onClick={() => handleTabChange('tasks')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'tasks' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <ClipboardCheck size={16} /> Assigned Tasks
              <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-200 text-gray-500'}`}>{event.tasks.total - event.tasks.completed}</span>
            </button>
            <button 
              onClick={() => handleTabChange('rsvp')}
              className={`py-5 px-6 text-sm font-black tracking-wide border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 -mb-0.5 ${activeTab === 'rsvp' ? 'border-[#1d1d1f] text-[#1d1d1f]' : 'border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
            >
              <Users size={16} /> Guest List
            </button>
          </div>

          {/* Tab Content: Overview */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-[#1d1d1f] mb-6 tracking-tight">Event Logistics</h3>
                    <div className="space-y-6">
                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                           <Calendar size={20} />
                        </div>
                        <div className="flex-1 border-b border-gray-100 pb-5">
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Date</p>
                          <p className="text-lg font-black text-[#1d1d1f]">{event.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                           <Clock size={20} />
                        </div>
                        <div className="flex-1 border-b border-gray-100 pb-5">
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Timeline</p>
                          <p className="text-lg font-black text-[#1d1d1f]">{event.time}</p>
                          <p className="text-sm font-bold text-[#71717a] mt-1">Doors open 1 hour prior</p>
                        </div>
                      </div>

                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm mt-1">
                           <MapPin size={20} />
                        </div>
                        <div className="flex-1 pb-5">
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-1.5">Location</p>
                          <p className="text-lg font-black text-[#1d1d1f]">{event.location}</p>
                          <p className="text-sm font-bold text-[#71717a] mt-1">{event.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                   <div>
                    <h3 className="text-2xl font-black text-[#1d1d1f] mb-6 tracking-tight">Your KPIs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-4">Tasks Completed</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{event.tasks.completed}</span>
                           <span className="text-sm font-bold text-[#71717a]">/ {event.tasks.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                           <div className="bg-[#1d1d1f] h-full rounded-full transition-all" style={{ width: `${(event.tasks.completed / event.tasks.total) * 100}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="p-8 border border-gray-100 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-4">Guests Confirmed</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-5xl font-black text-[#1d1d1f] tracking-tight">{event.guests.confirmed}</span>
                           <span className="text-sm font-bold text-[#71717a]">/ {event.guests.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(event.guests.confirmed / event.guests.total) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-[#fff9e6] rounded-3xl border border-[#eebf43]/30 flex gap-5 items-start">
                     <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#d4a017] shrink-0 shadow-sm border border-[#eebf43]/20">
                       <MessageSquare size={20} />
                     </div>
                     <div>
                       <h4 className="text-lg font-black text-[#1d1d1f] mb-2 tracking-tight">Admin Directive</h4>
                       <p className="text-sm font-bold text-yellow-950/70 leading-relaxed text-balance">
                         "Priority focus is on checking in VIPs smoothly and ensuring the seating chart matches the final catering pass. Please verify completion of tasks before Friday."
                       </p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Tasks */}
          {activeTab === 'tasks' && (
            <div className="animate-in fade-in duration-300">
               <div className="pb-6 border-b border-gray-100 flex items-center justify-between mb-2">
                 <div>
                   <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                     <ClipboardCheck size={24} className="text-[#a1a1aa]" /> Pending Directives
                   </h3>
                   <p className="text-sm font-semibold text-[#71717a] mt-2">Mark operations as complete once executed.</p>
                 </div>
               </div>

               <div className="divide-y divide-gray-100">
                  {/* Task 1 */}
                  <div className="py-6 flex items-start gap-5 hover:bg-[#fafafa]/50 transition-colors group cursor-pointer -mx-4 px-4 rounded-2xl">
                    <div className="text-gray-300 group-hover:text-emerald-500 transition-colors mt-1">
                      <Circle size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#1d1d1f]">Finalize seating arrangement with caterer</p>
                      <p className="text-sm font-medium text-[#71717a] mt-1.5">Cross-check tables 1-4 with dietary restrictions list.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg mb-2">
                        Overdue
                      </span>
                      <p className="text-xs font-bold text-[#a1a1aa]">Due Yesterday</p>
                    </div>
                  </div>
                  
                  {/* Task 2 */}
                  <div className="py-6 flex items-start gap-5 hover:bg-[#fafafa]/50 transition-colors group cursor-pointer -mx-4 px-4 rounded-2xl">
                    <div className="text-gray-300 group-hover:text-emerald-500 transition-colors mt-1">
                      <Circle size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#1d1d1f]">Test Audio/Visual equipment in main hall</p>
                      <p className="text-sm font-medium text-[#71717a] mt-1.5">Mic check x3. Ensure projector syncs with laptop seamlessly.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-widest text-[#d4a017] bg-[#fff9e6] px-2.5 py-1.5 rounded-lg mb-2">
                        High Priority
                      </span>
                      <p className="text-xs font-bold text-[#a1a1aa]">Due Oct 12</p>
                    </div>
                  </div>

                  {/* Task 3 */}
                  <div className="py-6 flex items-start gap-5 hover:bg-[#fafafa]/50 transition-colors group cursor-pointer -mx-4 px-4 rounded-2xl">
                    <div className="text-gray-300 group-hover:text-emerald-500 transition-colors mt-1">
                      <Circle size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#1d1d1f]">Coordinate load-in schedule with florist</p>
                      <p className="text-sm font-medium text-[#71717a] mt-1.5">Flower delivery expected at 8:00 AM sharp.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#a1a1aa] mt-1">Due Oct 13</p>
                    </div>
                  </div>

                  {/* Completed Task */}
                  <div className="py-6 flex items-start gap-5 opacity-50 -mx-4 px-4">
                    <div className="text-emerald-500 mt-1">
                      <CheckCircle2 size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#a1a1aa] line-through decoration-gray-300">Send introductory email to photographer</p>
                      <p className="text-sm font-medium text-[#a1a1aa] mt-1.5">Give schedule and call time.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Done</span>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Tab Content: RSVP */}
          {activeTab === 'rsvp' && (
            <div className="animate-in fade-in duration-300">
              <div className="pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
                 <div>
                   <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                     <Users size={24} className="text-[#a1a1aa]" /> Guest Registry
                   </h3>
                   <p className="text-sm font-semibold text-[#71717a] mt-2">Manage event arrivals, send reminders, and scan tickets.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                   <Link 
                     href={`/coordinator/events/${event.id}/scan`}
                     className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"
                   >
                     <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                     SCAN QR TICKET
                   </Link>
                   
                   <div className="w-full sm:w-auto bg-[#fafafa] border border-gray-100 px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center gap-6 shrink-0">
                     <div className="flex flex-col text-right pr-6 border-r border-gray-200">
                        <span className="text-2xl font-black text-emerald-600 leading-none">124</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mt-2">Confirmed</span>
                     </div>
                     <div className="flex flex-col text-left pl-2">
                        <span className="text-2xl font-black text-gray-300 leading-none">26</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mt-2">Pending</span>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="overflow-x-auto -mx-4 px-4">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-[#a1a1aa] font-extrabold">
                       <th className="py-5 font-extrabold w-1/3">Guest Name</th>
                       <th className="py-5 font-extrabold">Category</th>
                       <th className="py-5 font-extrabold text-center">Status</th>
                       <th className="py-5 font-extrabold text-center">Party Size</th>
                       <th className="py-5 font-extrabold text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     <tr className="hover:bg-[#fafafa]/50 transition-colors group">
                       <td className="py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">SM</div>
                           <div>
                             <p className="text-base font-bold text-[#1d1d1f]">Sarah Miller</p>
                             <p className="text-xs font-bold text-[#a1a1aa] mt-1">sarah.m@example.com</p>
                           </div>
                         </div>
                       </td>
                       <td className="py-5 text-sm font-semibold text-[#71717a]">VIP</td>
                       <td className="py-5 text-center">
                         <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                           <CheckCircle2 size={12} /> Confirmed
                         </span>
                       </td>
                       <td className="py-5 text-base font-bold text-[#1d1d1f] text-center">2</td>
                       <td className="py-5 text-right w-48">
                         <div className="flex items-center justify-end gap-2">
                           <button className="inline-flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors py-2 px-3">
                             SEND LINK
                           </button>
                           <button className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors bg-white hover:bg-[#fff9e6] border border-gray-200 hover:border-[#eebf43]/30 px-3 py-2 rounded-lg">
                             <MessageSquare size={12} /> Reminder
                           </button>
                         </div>
                       </td>
                     </tr>

                     <tr className="hover:bg-[#fafafa]/50 transition-colors group">
                       <td className="py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">DJ</div>
                           <div>
                             <p className="text-base font-bold text-[#1d1d1f]">David Johnson</p>
                             <p className="text-xs font-bold text-[#a1a1aa] mt-1">david@johnsoninc.com</p>
                           </div>
                         </div>
                       </td>
                       <td className="py-5 text-sm font-semibold text-[#71717a]">Family</td>
                       <td className="py-5 text-center">
                         <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                           <CheckCircle2 size={12} /> Confirmed
                         </span>
                       </td>
                       <td className="py-5 text-base font-bold text-[#1d1d1f] text-center">4</td>
                       <td className="py-5 text-right w-48">
                         <div className="flex items-center justify-end gap-2">
                           <button className="inline-flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors py-2 px-3">
                             SEND LINK
                           </button>
                           <button className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors bg-white hover:bg-[#fff9e6] border border-gray-200 hover:border-[#eebf43]/30 px-3 py-2 rounded-lg">
                             <MessageSquare size={12} /> Reminder
                           </button>
                         </div>
                       </td>
                     </tr>
                     
                     <tr className="hover:bg-[#fafafa]/50 transition-colors group">
                       <td className="py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-black text-sm">EW</div>
                           <div>
                             <p className="text-base font-bold text-[#1d1d1f]">Emily Wong</p>
                             <p className="text-xs font-bold text-[#a1a1aa] mt-1">emilyw@studio.test</p>
                           </div>
                         </div>
                       </td>
                       <td className="py-5 text-sm font-semibold text-[#71717a]">Colleague</td>
                       <td className="py-5 text-center">
                         <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                           <Circle size={12} /> Pending
                         </span>
                       </td>
                       <td className="py-5 text-base font-bold text-[#1d1d1f] text-center">1</td>
                       <td className="py-5 text-right w-48">
                         <div className="flex items-center justify-end gap-2">
                           <button className="inline-flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors py-2 px-3">
                             SEND LINK
                           </button>
                           <button className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-gray-400 hover:text-[#d4a017] transition-colors bg-white hover:bg-[#fff9e6] border border-gray-200 hover:border-[#eebf43]/30 px-3 py-2 rounded-lg">
                             <MessageSquare size={12} /> Reminder
                           </button>
                         </div>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}