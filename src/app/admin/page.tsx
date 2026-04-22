export default function AdminDashboard() {
  return (
    <div className="space-y-12 w-full max-w-none">
      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row gap-8 justify-between xl:items-end">
        {/* Intro Text */}
        <div className="flex flex-col justify-center xl:w-1/2 pt-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#d4a017] uppercase mb-4">Admin Portal</p>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Merry Story<br />Productions
          </h1>
          <p className="text-gray-500 text-[15px] leading-relaxed max-w-md">
            Curating extraordinary cinematic experiences and premium live productions globally.
          </p>
        </div>

        {/* Top Stat Cards */}
        <div className="flex flex-wrap lg:flex-nowrap gap-5 shrink-0 mt-6 xl:mt-0 xl:w-auto w-full">
          {/* Active Events */}
          <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 xl:w-56 w-[calc(50%-10px)] flex flex-col justify-between min-h-[180px]">
            <div className="flex gap-2 items-center text-[11px] font-bold tracking-wider text-gray-400 mb-8 uppercase">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Active Events
            </div>
            <div>
              <p className="text-6xl font-bold text-gray-900 tracking-tight">42</p>
              <p className="text-[12px] text-gray-500 font-medium mt-4 flex items-center gap-1">
                <span className="text-gray-900 font-bold border-b border-gray-900 leading-none pb-0.5">↗</span> +12% vs last month
              </p>
            </div>
          </div>

          {/* Inquiries */}
          <div className="bg-[#1c1c1c] p-7 rounded-xl shadow-lg shadow-gray-200 xl:w-64 w-[calc(50%-10px)] flex flex-col justify-between text-white min-h-[180px] transform transition-transform hover:-translate-y-1">
            <div className="flex gap-2 items-center text-[11px] font-bold tracking-wider text-gray-400 mb-8 uppercase">
              <svg className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Inquiries
            </div>
            <div>
              <p className="text-6xl font-bold tracking-tight">124</p>
              <p className="text-[12px] text-[#d4a017] font-semibold mt-4 flex items-center gap-1">
                <span className="leading-none pb-0.5">↗</span> +15 this week
              </p>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-[#facc15] p-7 rounded-xl shadow-lg shadow-[#facc15]/20 xl:w-48 w-full flex flex-col justify-between min-h-[180px]">
            <div className="flex gap-2 items-center text-[11px] font-bold tracking-wider text-yellow-900 mb-8 uppercase">
              <svg className="w-5 h-5 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Tasks
            </div>
            <div>
              <p className="text-6xl font-extrabold tracking-tight text-gray-900">18</p>
              <p className="text-[12px] text-yellow-900 font-semibold mt-4">
                Due this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row (Charts context) */}
      <div className="flex flex-col lg:flex-row gap-6 pt-4">
        {/* Client Engagements */}
        <div className="flex-1 bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
           <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Client Engagements</h3>
                <p className="text-[13px] text-gray-500 mt-1">Monthly breakdown of new inquiries and confirmed bookings.</p>
              </div>
              <div className="flex gap-6 text-[11px] font-bold tracking-wider uppercase">
                <span className="text-gray-900 border-b-2 border-gray-900 pb-1">Bookings</span>
                <span className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors pb-1">Inquiries</span>
              </div>
           </div>
           
           <div className="mt-auto relative w-full h-[150px] border-b border-gray-100 flex items-end justify-between pb-4">
             {/* Chart bars showing Bookings (colored) vs Inquiries (gray) */}
             <div className="w-[10%] h-[40%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[30%] bg-[#facc15] rounded-t-sm"></div></div>
             <div className="w-[10%] h-[60%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[40%] bg-[#facc15] rounded-t-sm"></div></div>
             <div className="w-[10%] h-[80%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[65%] bg-[#facc15] rounded-t-sm"></div></div>
             <div className="w-[10%] h-[50%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[45%] bg-[#facc15] rounded-t-sm"></div></div>
             <div className="w-[10%] h-[90%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[80%] bg-[#1c1c1c] rounded-t-sm"></div></div>
             <div className="w-[10%] h-[70%] bg-gray-100 rounded-t-sm mx-auto relative"><div className="absolute bottom-0 w-full h-[60%] bg-[#facc15] rounded-t-sm"></div></div>
           </div>

           <div className="flex justify-between px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-4">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
           </div>
        </div>

        {/* Production Quality */}
        <div className="lg:w-80 bg-gray-100 p-8 md:p-10 rounded-xl flex flex-col justify-center min-h-[350px]">
            <h3 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Production Quality
            </h3>
            <p className="text-5xl md:text-[56px] font-extrabold text-gray-900 leading-none tracking-tight">98.2%</p>
            <p className="text-[14px] text-gray-600 mt-4 leading-relaxed font-medium">
              Aggregate feedback across all active production sets.
            </p>
            <button className="text-[11px] font-bold tracking-widest uppercase text-gray-900 mt-10 flex items-center gap-2 group decoration-2 hover:underline underline-offset-4 transition-all">
              View full report
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
        </div>
      </div>

      {/* Bottom Row - In Production & Staff */}
      <div className="space-y-8 pt-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight">In Production</h2>
            <p className="text-[15px] text-gray-500 mt-2 font-medium">Real-time status of high-priority projects.</p>
          </div>
          <button className="text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            Manage All Events
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group cursor-pointer">
             <div className="h-52 bg-gray-200 relative overflow-hidden">
               <img src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800" alt="Starlight Gala" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-5 right-5 bg-[#d4a017] text-[10px] font-bold px-3 py-1.5 rounded-md text-white tracking-widest uppercase shadow-sm">Live</div>
             </div>
             <div className="p-8 flex flex-col flex-grow">
               <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Starlight Gala 2024</h3>
               <p className="text-[14px] text-gray-500 leading-relaxed mb-8 flex-grow">Annual fundraising event for Global Heritage Fund at the Crystal Palace.</p>
               
               <div className="flex justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
                 <span>Budget Spent</span>
                 <span className="text-gray-900">72%</span>
               </div>
               <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
                 <div className="bg-gray-900 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '72%' }}></div>
               </div>
               
               <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                  <div className="flex -space-x-3">
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#facc15] text-[10px] font-bold flex items-center justify-center text-yellow-900 z-10">+4</div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Dec 12 - 14</span>
               </div>
             </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group cursor-pointer">
             <div className="h-52 bg-gray-200 relative overflow-hidden">
               <img src="https://images.unsplash.com/photo-1540039155732-d6749b109c91?auto=format&fit=crop&q=80&w=800" alt="Neon Nights" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-5 right-5 bg-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-md text-white tracking-widest uppercase shadow-sm">Pre-Prod</div>
             </div>
             <div className="p-8 flex flex-col flex-grow">
               <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Neon Nights Concert</h3>
               <p className="text-[14px] text-gray-500 leading-relaxed mb-8 flex-grow">Electronic music showcase featuring local indie artists and immersive light shows.</p>
               
               <div className="flex justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
                 <span>Timeline</span>
                 <span className="text-gray-900">35%</span>
               </div>
               <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
                 <div className="bg-[#d4a017] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
               </div>
               
               <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                  <div className="flex -space-x-3">
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#facc15] text-[10px] font-bold flex items-center justify-center text-yellow-900 z-10">+8</div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Jan 05 - 06</span>
               </div>
             </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group cursor-pointer">
             <div className="h-52 bg-gray-200 relative overflow-hidden">
               <img src="https://images.unsplash.com/photo-1509631179647-0c5000642f53?auto=format&fit=crop&q=80&w=800" alt="Fashion Week" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-5 right-5 bg-[#d4a017] text-[10px] font-bold px-3 py-1.5 rounded-md text-white tracking-widest uppercase shadow-sm">Live</div>
             </div>
             <div className="p-8 flex flex-col flex-grow">
               <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Avenue Fashion Week</h3>
               <p className="text-[14px] text-gray-500 leading-relaxed mb-8 flex-grow">Main stage production for 12 international designers during the global event.</p>
               
               <div className="flex justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
                 <span>Technical Ready</span>
                 <span className="text-gray-900">92%</span>
               </div>
               <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
                 <div className="bg-gray-900 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '92%' }}></div>
               </div>
               
               <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                  <div className="flex -space-x-3">
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#facc15] text-[10px] font-bold flex items-center justify-center text-yellow-900 z-10">+11</div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Feb 18 - 25</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div className="flex flex-col xl:flex-row gap-8 pb-12 border-t border-gray-200 pt-10">
        <div className="w-80 shrink-0 pr-6">
           <h2 className="text-xl md:text-[22px] font-bold text-gray-900 mb-3">Core Production Team</h2>
           <p className="text-[14px] text-gray-500 leading-relaxed mb-8">
             Our specialized leads and their current deployment status across regional territories.
           </p>
           <button className="text-[11px] font-bold tracking-widest uppercase text-[#d4a017] flex items-center gap-2 group hover:text-yellow-600 transition-colors">
             Staff Directory
             <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
           </button>
        </div>

        <div className="flex-1 space-y-4">
          {/* Staff 1 */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-5">
               <img className="w-12 h-12 rounded bg-gray-100 object-cover shadow-sm" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Julian" />
               <div>
                 <p className="text-[15px] font-bold text-gray-900">Julian Sterling</p>
                 <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mt-1">Lead Technical Producer</p>
               </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Status</p>
                <p className="text-[12px] font-semibold text-gray-900 mt-1.5 flex items-center justify-end gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> On-site (NYC)
                </p>
              </div>
              <button className="text-gray-300 hover:text-gray-900 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          </div>

          {/* Staff 2 */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-5">
               <img className="w-12 h-12 rounded bg-gray-100 object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Elena" />
               <div>
                 <p className="text-[15px] font-bold text-gray-900">Elena Rossi</p>
                 <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mt-1">Creative Arts Director</p>
               </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Status</p>
                <p className="text-[12px] font-semibold text-gray-900 mt-1.5 flex items-center justify-end gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span> In Transit (LDN)
                </p>
              </div>
              <button className="text-gray-300 hover:text-gray-900 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          </div>

          {/* Staff 3 */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-gray-200 transition-colors opacity-70 hover:opacity-100">
            <div className="flex items-center gap-5">
               <img className="w-12 h-12 rounded bg-gray-100 object-cover shadow-sm grayscale" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Marcus" />
               <div>
                 <p className="text-[15px] font-bold text-gray-900">Marcus Thorne</p>
                 <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mt-1">Head of Vendor Relations</p>
               </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Status</p>
                <p className="text-[12px] font-medium text-gray-400 mt-1.5 flex items-center justify-end gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span> Unavailable
                </p>
              </div>
              <button className="text-gray-300 hover:text-gray-900 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
