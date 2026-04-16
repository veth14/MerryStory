import React from 'react';
import Link from 'next/link';

export default function ProjectsView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-2xl relative">
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search event...."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-100 text-gray-700 text-[14px] font-bold rounded-xl pl-5 pr-12 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 cursor-pointer min-w-[140px]">
              <option>All types</option>
              <option>Wedding</option>
              <option>Corporate</option>
              <option>Birthday</option>
            </select>
            <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>

          <Link href="/admin/events/new" className="flex items-center justify-center gap-2 bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold py-3 px-6 rounded-xl text-[14px] transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 whitespace-nowrap">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
             New Event
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">    

        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800" alt="TechPH Summit 2026" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />  
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-yellow-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">In Progress</div>
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">TechPH Summit 2026</h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Jul 20, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                SMX Convention Center
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                150
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="text-gray-900">75%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#facc15] h-full rounded-full transition-all" style={{ width: '75%' }}></div>
              </div>
              <div className="text-[10px] font-bold tracking-wider text-gray-400 mt-2 uppercase">Budget: ?450,000</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Link href="/admin/events/1" className="w-full bg-[#d4a017] hover:bg-[#c49214] text-white font-extrabold uppercase tracking-widest py-3 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center">        
                Event Dashboard
              </Link>
              <div className="flex gap-2">
                <Link href="/admin/rsvp/1" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  RSVP
                </Link>
                <Link href="/admin/tasks/techph-summit-2026" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800" alt="Manila Food Expo 2026" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 right-4 bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">At Risk</div>
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Manila Food Expo 2026</h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Jun 1, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                SMX Convention Center
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                150
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="text-gray-900">25%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#d4a017] h-full rounded-full transition-all" style={{ width: '25%' }}></div>
              </div>
              <div className="text-[10px] font-bold tracking-wider text-gray-400 mt-2 uppercase">Budget: ?450,000</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Link href="/admin/events/2" className="w-full bg-[#d4a017] hover:bg-[#c49214] text-white font-extrabold uppercase tracking-widest py-3 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center">        
                Event Dashboard
              </Link>
              <div className="flex gap-2">
                <Link href="/admin/rsvp/2" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  RSVP
                </Link>
                <Link href="/admin/tasks/manila-food-expo-2026" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800" alt="Garcia Santos Wedding" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-yellow-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">In Progress</div>
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Garcia Santos Wedding</h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                May 1, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                SMX Convention Center
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                200
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="text-gray-900">15%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#d4a017] h-full rounded-full transition-all" style={{ width: '15%' }}></div>
              </div>
              <div className="text-[10px] font-bold tracking-wider text-gray-400 mt-2 uppercase">Budget: ?150,000</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Link href="/admin/events/3" className="w-full bg-[#d4a017] hover:bg-[#c49214] text-white font-extrabold uppercase tracking-widest py-3 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center">        
                Event Dashboard
              </Link>
              <div className="flex gap-2">
                <Link href="/admin/rsvp/3" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  RSVP
                </Link>
                <Link href="/admin/tasks/garcia-santos-wedding" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1533174000222-94b29bb88b69?auto=format&fit=crop&q=80&w=800" alt="Sofia 18th Birthday" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> 
            <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">Scheduled</div>
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">Sofia 18th Birthday</h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-400 mb-6">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Mar 24, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                SMX Convention Center
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                120
              </span>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="text-gray-900">5%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#d4a017] h-full rounded-full transition-all" style={{ width: '5%' }}></div>
              </div>
              <div className="text-[10px] font-bold tracking-wider text-gray-400 mt-2 uppercase">Budget: ?650,000</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <Link href="/admin/events/4" className="w-full bg-[#d4a017] hover:bg-[#c49214] text-white font-extrabold uppercase tracking-widest py-3 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center">        
                Event Dashboard
              </Link>
              <div className="flex gap-2">
                <Link href="/admin/rsvp/4" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  RSVP
                </Link>
                <Link href="/admin/tasks/sofia-18th-birthday" className="flex-1 border-2 border-gray-100 hover:border-[#d4a017] text-gray-500 hover:text-[#d4a017] font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
