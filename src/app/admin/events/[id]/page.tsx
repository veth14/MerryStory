'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('pre-event');

  const event = {
    title: "The Starlight Gala",
    date: "Oct 14, 2026",
    location: "Metropolitan Museum of Art, NY",
    health: 85,
    budget: { utilized: 240.5, total: 400 },
    vendors: { secured: 18, total: 22 },
    guests: { invited: 450, rsvp: 82, checkedIn: 342 }
  };

  const renderPreEvent = () => (
    <div className="animate-in fade-in duration-300">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Budget Allocation</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">${event.budget.utilized}k</span>
            <span className="text-[13px] font-bold text-gray-400">/ ${event.budget.total}k</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-5 mb-2 relative z-10">
            <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${(event.budget.utilized / event.budget.total) * 100}%` }}></div>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{Math.round((event.budget.utilized / event.budget.total) * 100)}% utilized</span>
            <button className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]">Manage Budget</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Vendor Confirmation</h3>
          <div className="flex items-baseline gap-2 relative z-10 mb-4">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.vendors.secured}</span>
            <span className="text-[13px] font-bold text-gray-400">/ {event.vendors.total} Secured</span>
          </div>
          <div className="flex items-center mt-3 mb-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-gray-200 border-[3px] border-white -ml-0"></div>
            <div className="w-7 h-7 rounded-full bg-gray-300 border-[3px] border-white -ml-2"></div>
            <div className="w-7 h-7 rounded-full bg-gray-400 border-[3px] border-white -ml-2"></div>
            <div className="w-7 h-7 rounded-full bg-[#facc15] border-[3px] border-white -ml-2 flex items-center justify-center text-[9px] font-extrabold text-white z-10">+15</div>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{event.vendors.total - event.vendors.secured} pending contracts</span>
            <button className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]">View All</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Guest Capacity</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.guests.invited}</span>
            <span className="text-[13px] font-bold text-gray-400">Invited</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 mb-2.5 relative z-10">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
            <span className="text-[11px] font-extrabold text-emerald-500 tracking-wide">~ {event.guests.rsvp}% RSVP Rate</span>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">32 VIP remaining</span>
            <button className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]">Guest List</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column (Milestones / Logistics ) */}
        <div className="space-y-8">
          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Production Milestones</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-0.5">Sequence of key operations</p>
              </div>
              <button className="text-[10px] font-extrabold text-[#d4a017] uppercase tracking-widest flex items-center gap-1.5 hover:text-[#b8860b]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
                <div className="w-2 h-2 rounded-full bg-[#facc15] ml-1"></div>
                <div>
                  <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Oct 2, 2026</p>
                  <p className="text-[14px] font-extrabold text-gray-900">Final Lighting Rigging Approval</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-300 ml-1"></div>
                <div>
                  <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Oct 5, 2026</p>
                  <p className="text-[14px] font-extrabold text-gray-900">On-Site Catering Walkthrough</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-300 ml-1"></div>
                <div>
                  <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Oct 10, 2026</p>
                  <p className="text-[14px] font-extrabold text-gray-900">Floor Plan Finalization & Fire Marshal Sign-off</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Status */}
          <div>
             <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Logistics Status</h2>
              <button className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest hover:text-gray-600">Update All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 px-5 flex items-center justify-between shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-gray-900 mb-0.5">Rigging</p>
                    <p className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-widest">Ready</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 px-5 flex items-center justify-between shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-gray-900 mb-0.5">Catering</p>
                    <p className="text-[8px] font-extrabold text-[#d4a017] uppercase tracking-widest">Pending Load-in</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column / Sidebar Area */}
        <div className="space-y-6">
          {/* Urgent Alerts Box */}
          <div className="bg-[#201A03] rounded-2xl p-7 shadow-sm text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#facc15] text-[16px] font-extrabold tracking-tight">Urgent Alerts</h2>
              <button className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest hover:text-white transition-colors">Clear All</button>
            </div>
            <div className="space-y-6">
               <div className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-[#facc15] before:rounded-full">
                <h4 className="text-[13px] font-extrabold text-white mb-1.5 leading-snug">Met Museum Blackout Dates</h4>
                <p className="text-[11px] text-white/60 font-medium leading-relaxed">Structural survey scheduled for Wing A on Oct 12-13. Re-routing required.</p>
              </div>
            </div>
          </div>
          {/* Team List */}
          <div className="bg-white rounded-2xl p-6 py-7 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Production Team</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-gray-900 flex shrink-0"></div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-extrabold text-gray-900">Elena Vance</h4>
                  <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">Creative Director</p>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-500">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventDay = () => (
    <div className="animate-in fade-in duration-300">
      {/* Live KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          </div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Live Status</h3>
          <div className="text-[24px] font-extrabold tracking-tight mt-2">In Progress</div>
          <p className="text-[11px] text-[#facc15] font-extrabold mt-2">Next: Keynote Speech (10m)</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Guest Check-In</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.guests.checkedIn}</span>
            <span className="text-[13px] font-bold text-gray-400">/ {event.guests.invited}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3">
             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(event.guests.checkedIn / event.guests.invited) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vendor Load-In</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">22</span>
            <span className="text-[13px] font-bold text-gray-400">/ 22 On-site</span>
          </div>
          <p className="text-[11px] text-emerald-500 font-extrabold mt-3">100% Arrived</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Incident Reports</h3>
           <div className="text-[32px] font-extrabold text-gray-900 tracking-tight mt-2">0</div>
           <p className="text-[11px] text-gray-400 font-extrabold mt-3">All operations normal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column: Run of Show & Walkie Talkie logs */}
        <div className="space-y-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-[20px] font-extrabold text-gray-900 tracking-tight">Run of Show (ROS)</h2>
               <button className="text-[11px] font-extrabold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200">Download PDF</button>
            </div>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
              {/* Passed Item */}
              <div className="relative pl-6 opacity-50">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">04:00 PM</span>
                <h4 className="text-[15px] font-extrabold text-gray-900 mt-1">Team Call Time & Briefing</h4>
                <p className="text-[12px] text-gray-500 mt-1">Main Hall. All hands on deck.</p>
              </div>
              
              {/* Passed Item */}
              <div className="relative pl-6 opacity-50">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">05:30 PM</span>
                <h4 className="text-[15px] font-extrabold text-gray-900 mt-1">VIP Reception Starts</h4>
                <p className="text-[12px] text-gray-500 mt-1">East Wing Gallery. String quartet begins playing.</p>
              </div>

              {/* Active Item */}
              <div className="relative pl-6">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-[#facc15] border-4 border-white shadow-sm animate-pulse"></div>
                <span className="text-[11px] font-extrabold text-[#d4a017] uppercase tracking-widest">06:45 PM (CURRENT)</span>
                <h4 className="text-[17px] font-extrabold text-gray-900 mt-1">Doors Open for General Admission</h4>
                <p className="text-[13px] text-gray-600 mt-1">Usher guests to the main ballroom. Catering starts passing hors d'oeuvres.</p>
                <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-3">
                   <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   <div><p className="text-[12px] font-bold text-orange-800">Queue bottleneck at Entrance B.</p><p className="text-[11px] text-orange-600">Dispatch 2 more ushers to assist with scanning.</p></div>
                </div>
              </div>

              {/* Future Item */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">07:30 PM</span>
                <h4 className="text-[15px] font-extrabold text-gray-900 mt-1">Welcome Remarks & Dinner Served</h4>
                <p className="text-[12px] text-gray-500 mt-1">Lights dim 50%. Audio visual team cues introductory video.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Communications & Maps */}
        <div className="space-y-6">
           {/* Live Walkie/Comm Log */}
           <div className="bg-gray-900 rounded-2xl p-6 shadow-sm text-white">
             <h2 className="text-[16px] font-extrabold text-white tracking-tight mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Live Comm Channel
             </h2>
             <div className="space-y-4 h-48 overflow-y-auto pr-2">
                <div className="border-b border-gray-800 pb-3">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-[#facc15] uppercase">Security (Ch 2)</span>
                      <span className="text-[10px] text-gray-500">Just now</span>
                   </div>
                   <p className="text-[12px] mt-1 text-gray-300">"Mayor's convoy has arrived at the loading dock. Need escort."</p>
                </div>
                <div className="border-b border-gray-800 pb-3">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-blue-400 uppercase">Catering (Ch 4)</span>
                      <span className="text-[10px] text-gray-500">2 mins ago</span>
                   </div>
                   <p className="text-[12px] mt-1 text-gray-300">"Salad course is plated. Awaiting cue to serve."</p>
                </div>
                <div className="pb-1">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-purple-400 uppercase">A/V Tech (Ch 3)</span>
                      <span className="text-[10px] text-gray-500">8 mins ago</span>
                   </div>
                   <p className="text-[12px] mt-1 text-gray-300">"Mic check 2 complete. Audio levels holding."</p>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-800">
                <input type="text" placeholder="Broadcast message..." className="w-full bg-gray-800 border-none rounded-lg text-[12px] px-4 py-2.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-[#facc15] outline-none" />
             </div>
           </div>
           
           {/* VIP Status */}
           <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight mb-4">VIP Status</h2>
              <div className="space-y-3">
                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                       <p className="text-[13px] font-extrabold text-gray-900">The Mayor</p>
                       <p className="text-[10px] font-bold text-gray-500">Table 1</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-extrabold">SEated</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                       <p className="text-[13px] font-extrabold text-gray-900">Keynote Speaker</p>
                       <p className="text-[10px] font-bold text-gray-500">Green Room</p>
                    </div>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-extrabold">Prep</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPostEvent = () => (
    <div className="animate-in fade-in duration-300">
       {/* Post Event KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Financial Reconciliation</h3>
            <div className="flex items-baseline gap-2 mt-2">
               <span className="text-[32px] font-extrabold text-emerald-600 tracking-tight">+ $12k</span>
               <span className="text-[13px] font-bold text-gray-400">Surplus</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-2">All vendor invoices processed.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Guest Feedback</h3>
             <div className="flex items-baseline gap-2 mt-2">
               <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">4.8</span>
               <span className="text-[13px] font-bold text-gray-400">/ 5.0</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-2">Based on 215 survey responses</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Media Assets</h3>
            <div className="flex items-baseline gap-2 mt-2">
               <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">Delivered</span>
            </div>
            <p className="text-[11px] text-[#d4a017] font-extrabold mt-2 cursor-pointer hover:underline">View Drive Link</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Post Event Checklists & Analytics */}
          <div className="space-y-8">
             <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
               <h2 className="text-[20px] font-extrabold text-gray-900 tracking-tight mb-5">Wrap-up Checklist</h2>
               <div className="space-y-4">
                  <label className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer">
                     <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[#d4a017] focus:ring-[#d4a017] border-gray-300" />
                     <span className="text-[14px] font-extrabold text-gray-900 line-through opacity-60">Return venue deposit and settle damages</span>
                  </label>
                  <label className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer">
                     <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[#d4a017] focus:ring-[#d4a017] border-gray-300" />
                     <span className="text-[14px] font-extrabold text-gray-900 line-through opacity-60">Send client Thank You gift & final portfolio</span>
                  </label>
                  <label className="flex items-center gap-4 p-3 bg-white border border-gray-100 hover:border-gray-300 rounded-xl cursor-pointer shadow-sm">
                     <input type="checkbox" className="w-5 h-5 rounded text-[#d4a017] focus:ring-[#d4a017] border-gray-300" />
                     <span className="text-[14px] font-extrabold text-gray-900">Conduct internal team post-mortem meeting</span>
                  </label>
                  <label className="flex items-center gap-4 p-3 bg-white border border-gray-100 hover:border-gray-300 rounded-xl cursor-pointer shadow-sm">
                     <input type="checkbox" className="w-5 h-5 rounded text-[#d4a017] focus:ring-[#d4a017] border-gray-300" />
                     <span className="text-[14px] font-extrabold text-gray-900">Process final freelance staff payouts</span>
                  </label>
               </div>
             </div>
          </div>

          {/* Right Column: Summaries */}
          <div className="space-y-6">
             <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-[16px] font-extrabold text-yellow-900 tracking-tight mb-2">Client Offboarding</h2>
                <p className="text-[12px] text-yellow-800 leading-relaxed mb-4">The event achieved all major KPIs. Client has signed the final release form. Safe to archive project.</p>
                <button className="w-full bg-[#d4a017] text-white py-3 rounded-xl text-[12px] font-extrabold uppercase tracking-wider hover:bg-[#c49214] transition-colors">
                   Archive Project
                </button>
             </div>
             
             <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight mb-4">Debrief Notes</h2>
                <ul className="list-disc pl-4 space-y-2 text-[12px] text-gray-600">
                   <li>Catering ran out of vegan options early; order +15% next time.</li>
                   <li>Valet transition was seamless thanks to the new app integration.</li>
                   <li>Client loved the lighting transitions. Keep vendor on preferred list.</li>
                </ul>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center">
            <span className="bg-[#facc15] text-gray-900 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-[4px]">Active Production</span>
            <span className="text-gray-400 text-[11px] font-bold tracking-wider uppercase ml-3">• {event.date}</span>
          </div>
          <h1 className="text-[42px] font-extrabold text-gray-900 tracking-tight leading-none mt-3">{event.title}</h1>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {event.location}
            </div>
            <div className="w-10 h-0.5 bg-gray-200 rounded-full"></div>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{event.health}% Health</span>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#d4a017]" style={{ width: `${event.health}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {activeTab === 'post-event' && (
             <button className="border border-[#d4a017] text-[#d4a017] text-[11px] font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-yellow-50 transition-colors shadow-sm">
               Generate Report
             </button>
           )}
          <button className="bg-[#d4a017] hover:bg-[#c49214] text-white text-[11px] font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors">
            Edit Details
          </button>
        </div>
      </div>

      {/* Top Level Tabs */}
      <div className="border-b border-gray-200 mt-8 flex gap-8">
        {['pre-event', 'event-day', 'post-event'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[13px] font-extrabold uppercase tracking-wider transition-colors border-b-2 relative top-[1px] ${activeTab === tab ? 'border-[#d4a017] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="pt-4">
        {activeTab === 'pre-event' && renderPreEvent()}
        {activeTab === 'event-day' && renderEventDay()}
        {activeTab === 'post-event' && renderPostEvent()}
      </div>
    </div>
  );
}
