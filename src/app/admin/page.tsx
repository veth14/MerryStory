"use client";
import React, { useEffect, useState } from 'react';
// Real function to fetch activity logs for a member
async function fetchMemberActivity(memberId: string, idToken: string) {
  try {
    const res = await fetch(`/api/activities?uid=${memberId}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((log: any) => ({
        time: new Date(log.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        action: log.message,
        actor: log.actor
      }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
import { useAuth } from '@/components/auth/AuthProvider';

interface Event {
  _id: string;
  status: string;
  date?: string;
  type?: string;
}

interface StaffUser {
  _id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
}

interface MonthlyBreakdown {
  month: string;
  shortMonth: string;
  bookings: number;
  inquiries: number;
  isCurrent: boolean;
}

function getStatusConfig(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'on-site' || s === 'online')
    return { dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]', label: status, textClass: 'text-gray-900 font-semibold' };
  if (s === 'in transit' || s === 'away' || s === 'busy')
    return { dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]', label: status, textClass: 'text-gray-900 font-semibold' };
  return { dot: 'bg-gray-300', label: status || 'Unavailable', textClass: 'text-gray-400 font-medium' };
}

export default function AdminDashboard() {
    const [openActivityMember, setOpenActivityMember] = useState<string | null>(null);
    const [activityLogs, setActivityLogs] = useState<Record<string, any[]>>({});
    const [activityLoading, setActivityLoading] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const [activeEventsCount, setActiveEventsCount] = useState<number>(0);
  const [activeEventsPercentChange, setActiveEventsPercentChange] = useState<number | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);
  const [inquiriesPercentChange, setInquiriesPercentChange] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [tasksPercentChange, setTasksPercentChange] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  // Helper to check if event is ongoing today
  function isEventOngoingToday(event: any) {
    if (!event.date) return false;
    // Support both single date and date ranges (e.g., '2026-04-28' or '2026-04-28 to 2026-04-30')
    const today = new Date();
    const eventDateStr = event.date;
    if (eventDateStr.includes('to')) {
      const [start, end] = eventDateStr.split('to').map((d: string) => new Date(d.trim()));
      return today >= start && today <= end;
    } else {
      const eventDate = new Date(eventDateStr);
      return (
        eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
      );
    }
  }

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');

  const [activeTab, setActiveTab] = useState<'bookings' | 'inquiries'>('bookings');
  const [chartPage, setChartPage] = useState(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const idToken = await user.getIdToken();

        const eventsRes = await fetch('/api/events', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!eventsRes.ok) throw new Error('Failed to fetch events');
        const events: any[] = await eventsRes.json();

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        // Filter and sort active events by updatedAt or createdAt
        const active = events
          .filter(event => event.status && event.status.toLowerCase().includes('active'))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        setActiveEvents(active);
        // For count and percent change
        let currentMonthActive = 0;
        let prevMonthActive = 0;
        active.forEach(event => {
          if (event.date) {
            const eventDate = new Date(event.date);
            const eventMonth = eventDate.getMonth();
            const eventYear = eventDate.getFullYear();
            if (eventMonth === thisMonth && eventYear === thisYear) currentMonthActive++;
            else if (eventMonth === lastMonth && eventYear === lastMonthYear) prevMonthActive++;
          } else {
            currentMonthActive++;
          }
        });
        setActiveEventsCount(currentMonthActive);
        setActiveEventsPercentChange(
          prevMonthActive === 0
            ? currentMonthActive > 0 ? 100 : 0
            : ((currentMonthActive - prevMonthActive) / prevMonthActive) * 100
        );

        const inquiriesRes = await fetch('/api/inquiries', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!inquiriesRes.ok) throw new Error('Failed to fetch inquiries');
        const inquiriesData = await inquiriesRes.json();
        const inquiries = inquiriesData.inquiries || [];

        function getISOWeek(date: Date) {
          const tmp = new Date(date.getTime());
          tmp.setHours(0, 0, 0, 0);
          tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
          const week1 = new Date(tmp.getFullYear(), 0, 4);
          return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
        }

        const thisISOWeek = getISOWeek(now);
        const lastISOWeek = thisISOWeek - 1;
        let currentWeekInquiries = 0;
        let prevWeekInquiries = 0;
        inquiries.forEach((inq: any) => {
          if (inq.submitted) {
            const submittedDate = new Date(inq.submitted);
            const year = submittedDate.getFullYear();
            const week = getISOWeek(submittedDate);
            if (year === thisYear && week === thisISOWeek) currentWeekInquiries++;
            else if (year === thisYear && week === lastISOWeek) prevWeekInquiries++;
          }
        });

        const months = [
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        ];
        const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        const breakdown: MonthlyBreakdown[] = months.map((month, i) => {
          const bookings = events.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d.getFullYear() === thisYear && d.getMonth() === i &&
              e.status?.toLowerCase().includes('active');
          }).length;

          const monthInquiries = inquiries.filter((inq: any) => {
            if (!inq.submitted) return false;
            const d = new Date(inq.submitted);
            return d.getFullYear() === thisYear && d.getMonth() === i;
          }).length;

          return {
            month,
            shortMonth: shortMonths[i],
            bookings,
            inquiries: monthInquiries,
            isCurrent: i === thisMonth,
          };
        });
        setMonthlyBreakdown(breakdown);
        setChartPage(thisMonth < 6 ? 0 : 1);

        setInquiriesCount(currentWeekInquiries);
        setInquiriesPercentChange(
          prevWeekInquiries === 0 && currentWeekInquiries === 0 ? 0
            : prevWeekInquiries === 0 ? 100
            : ((currentWeekInquiries - prevWeekInquiries) / prevWeekInquiries) * 100
        );

        const tasksRes = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        const tasks = await tasksRes.json();
        let currentWeekTasks = 0;
        let prevWeekTasks = 0;
        tasks.forEach((task: any) => {
          if (task.createdAt) {
            const createdDate = new Date(task.createdAt);
            const year = createdDate.getFullYear();
            const week = getISOWeek(createdDate);
            if (year === thisYear && week === thisISOWeek) currentWeekTasks++;
            else if (year === thisYear && week === lastISOWeek) prevWeekTasks++;
          }
        });
        setTasksCount(currentWeekTasks);
        setTasksPercentChange(
          prevWeekTasks === 0 && currentWeekTasks === 0 ? 0
            : prevWeekTasks === 0 ? 100
            : ((currentWeekTasks - prevWeekTasks) / prevWeekTasks) * 100
        );
      } catch (err: any) {
        setError(err.message || 'Could not load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!user) return;
      try {
        setStaffLoading(true);
        const idToken = await user.getIdToken();

        // Fetch both users and staff collections in parallel
        const [usersRes, staffRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch('/api/staffs', { headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        if (!usersRes.ok && !staffRes.ok) throw new Error('Failed to fetch users or staff');

        let users: StaffUser[] = [];
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          users = Array.isArray(usersData) ? usersData : usersData.users ?? [];
        }

        let staffMembers: StaffUser[] = [];
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          staffMembers = Array.isArray(staffData) ? staffData : staffData.staff ?? staffData.users ?? [];
        }

        // Merge both collections, deduplicate by _id
        const merged = [...users];
        for (const member of staffMembers) {
          if (!merged.some(u => u._id === member._id)) {
            merged.push(member);
          }
        }

        setStaff(merged);
      } catch (err: any) {
        setStaffError(err.message || 'Could not load staff.');
      } finally {
        setStaffLoading(false);
      }
    };
    fetchStaff();
  }, [user]);

  return (
    <div className="space-y-12 w-full max-w-none">
      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row gap-8 justify-between xl:items-end">
        <div className="flex flex-col justify-center xl:w-1/2 pt-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#d4a017] uppercase mb-4">Admin Portal</p>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Merry Story<br />Productions
          </h1>
          <p className="text-gray-500 text-[15px] leading-relaxed max-w-md">
            Curating extraordinary cinematic experiences and premium live productions globally.
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap gap-5 shrink-0 mt-6 xl:mt-0 xl:w-auto w-full">
          {/* Active Events */}
          <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 xl:w-56 w-[calc(50%-10px)] flex flex-col justify-between min-h-[180px]">
            <div className="flex gap-2 items-center text-[11px] font-bold tracking-wider text-gray-400 mb-8 uppercase">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Active Events
            </div>
            <div>
              {loading ? <p className="text-6xl font-bold text-gray-400 tracking-tight">...</p>
                : error ? <p className="text-xs text-red-500 font-bold">Error</p>
                : <p className="text-6xl font-bold text-gray-900 tracking-tight">{activeEventsCount}</p>}
              <p className="text-[12px] text-gray-500 font-medium mt-4 flex items-center gap-1">
                <span className="text-gray-900 font-bold border-b border-gray-900 leading-none pb-0.5">
                  {activeEventsPercentChange !== null && !loading && !error && (
                    activeEventsPercentChange > 0 ? '↗' : activeEventsPercentChange < 0 ? '↘' : '→'
                  )}
                </span>
                {activeEventsPercentChange !== null && !loading && !error && (
                  <span className={activeEventsPercentChange > 0 ? 'text-green-600' : activeEventsPercentChange < 0 ? 'text-red-600' : 'text-gray-500'}>
                    {activeEventsPercentChange > 0 ? '+' : ''}{activeEventsPercentChange.toFixed(0)}% vs last month
                  </span>
                )}
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
              {loading ? <p className="text-6xl font-bold tracking-tight text-[#d4a017]/40">...</p>
                : error ? <p className="text-xs text-red-500 font-bold">Error</p>
                : <p className="text-6xl font-bold tracking-tight">{inquiriesCount}</p>}
              <p className="text-[12px] text-[#d4a017] font-semibold mt-4 flex items-center gap-1">
                <span className="leading-none pb-0.5">
                  {inquiriesPercentChange !== null && !loading && !error && (
                    inquiriesPercentChange > 0 ? '↗' : inquiriesPercentChange < 0 ? '↘' : '→'
                  )}
                </span>
                {inquiriesPercentChange !== null && !loading && !error && (
                  <span className={inquiriesPercentChange > 0 ? 'text-green-400' : inquiriesPercentChange < 0 ? 'text-red-400' : 'text-[#d4a017]'}>
                    {inquiriesPercentChange > 0 ? '+' : ''}{inquiriesPercentChange.toFixed(0)}% vs last week
                  </span>
                )}
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
              <p className="text-6xl font-extrabold tracking-tight text-gray-900">{tasksCount}</p>
              <p className="text-[12px] text-yellow-900 font-semibold mt-4 flex items-center gap-1">
                <span className="leading-none pb-0.5">
                  {tasksPercentChange !== null && !loading && !error && (
                    tasksPercentChange > 0 ? '↗' : tasksPercentChange < 0 ? '↘' : '→'
                  )}
                </span>
                {tasksPercentChange !== null && !loading && !error && (
                  <span className={tasksPercentChange > 0 ? 'text-green-700' : tasksPercentChange < 0 ? 'text-red-700' : 'text-yellow-900'}>
                    {tasksPercentChange > 0 ? '+' : ''}{tasksPercentChange.toFixed(0)}% vs last week
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex flex-col lg:flex-row gap-6 pt-4">
        {/* Client Engagements */}
        <div className="flex-1 bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Client Engagements</h3>
              <p className="text-[13px] text-gray-500 mt-1">Monthly breakdown of new inquiries and confirmed bookings.</p>
            </div>
            <div className="flex gap-6 text-[11px] font-bold tracking-wider uppercase">
              <span
                onClick={() => setActiveTab('bookings')}
                className={`cursor-pointer pb-1 transition-colors ${activeTab === 'bookings' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Bookings
              </span>
              <span
                onClick={() => setActiveTab('inquiries')}
                className={`cursor-pointer pb-1 transition-colors ${activeTab === 'inquiries' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Inquiries
              </span>
            </div>
          </div>

          {(() => {
            const visibleMonths = monthlyBreakdown.slice(chartPage * 6, chartPage * 6 + 6);
            const values = visibleMonths.map(m => activeTab === 'bookings' ? m.bookings : m.inquiries);
            const maxVal = Math.max(...values, 1);

            return (
              <>
                <div key={`${activeTab}-${chartPage}`} className="mt-auto relative w-full h-[150px] border-b border-gray-100 flex items-end justify-between pb-4">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="w-[10%] h-full flex items-end mx-auto">
                        <div className="w-full bg-gray-100 rounded-t-sm animate-pulse" style={{ height: `${30 + (i * 10)}%` }} />
                      </div>
                    ))
                  ) : (
                    visibleMonths.map((m, i) => {
                      const val = activeTab === 'bookings' ? m.bookings : m.inquiries;
                      const heightPct = maxVal === 0 ? 8 : Math.max((val / maxVal) * 100, 8);
                      return (
                        <div key={m.month} className="w-[10%] h-full flex items-end mx-auto group relative">
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {val} {activeTab}
                          </div>
                          <div
                            className={`w-full rounded-t-sm transition-all duration-700 ease-out ${
                              m.isCurrent ? 'bg-[#1c1c1c]' : 'bg-[#facc15] group-hover:bg-[#e6b800]'
                            }`}
                            style={{
                              height: `${heightPct}%`,
                              animationName: 'growUp',
                              animationDuration: '600ms',
                              animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                              animationFillMode: 'both',
                              animationDelay: `${i * 60}ms`,
                            }}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setChartPage(0)}
                    disabled={chartPage === 0}
                    className={`p-1.5 rounded-lg border transition-all duration-200 ${
                      chartPage === 0
                        ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:scale-110 active:scale-95'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex-1 flex justify-between px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    {visibleMonths.map((m, i) => (
                      <span
                        key={m.month}
                        className={`transition-all duration-300 ${m.isCurrent ? 'text-gray-900' : ''}`}
                        style={{
                          animationName: 'fadeInUp',
                          animationDuration: '400ms',
                          animationTimingFunction: 'ease-out',
                          animationFillMode: 'both',
                          animationDelay: `${i * 60}ms`,
                        }}
                      >
                        {m.shortMonth}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setChartPage(1)}
                    disabled={chartPage === 1}
                    className={`p-1.5 rounded-lg border transition-all duration-200 ${
                      chartPage === 1
                        ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:scale-110 active:scale-95'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            );
          })()}
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

      {/* In Production */}
      <div className="space-y-8 pt-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight">In Production</h2>
            <p className="text-[15px] text-gray-500 mt-2 font-medium">Real-time status of current projects.</p>
          </div>
          <a
            href="/admin/events"
            className="text-[13px] font-bold text-gray-700 bg-white border border-gray-200 px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 group overflow-hidden relative"
            style={{ position: 'relative' }}
            onClick={e => {
              e.currentTarget.classList.add('animate-slideOutLeft');
              setTimeout(() => {
                window.location.href = '/admin/events';
              }, 350);
              e.preventDefault();
            }}
          >
            <span className="transition-transform duration-300 group-hover:translate-x-1">Manage All Events</span>
            <style jsx>{`
              .animate-slideOutLeft {
                animation: slideOutLeft 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
              }
              @keyframes slideOutLeft {
                0% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(-100vw); opacity: 0; }
              }
            `}</style>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {(() => {
            // Prioritize ongoing event today
            const ongoing = activeEvents.find(isEventOngoingToday);
            const rest = activeEvents.filter(e => !ongoing || e._id !== ongoing._id);
            const prioritized = ongoing ? [ongoing, ...rest] : rest;
            return prioritized.slice(0, 3).map(event => {
              const budget = event.budget || {};
              const progress = budget.total ? Math.round((budget.utilized || 0) / budget.total * 100) : (event.health || 0);
              const progressLabel = budget.total ? 'Budget Spent' : 'Health';
              const progressColor = budget.total ? 'bg-gray-900' : 'bg-emerald-500';
              const isOngoing = isEventOngoingToday(event);
              return (
                <div key={event._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group cursor-pointer">
                  <div className="h-52 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-gray-400 text-lg">No Image</span>
                    )}
                    <div className={`absolute top-5 right-5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase shadow-sm ${isOngoing ? 'bg-green-600 text-white animate-pulse' : 'bg-[#d4a017] text-white'}`}>{isOngoing ? 'Ongoing' : event.status}</div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                      {event.title}
                    </h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed mb-8 flex-grow">
                      {event.type || '—'} | {event.date ? new Date(event.date).toLocaleDateString() : 'No Date'}
                    </p>
                    <div className="flex justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-3">
                      <span>{progressLabel}</span><span className="text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
                      <div className={`${progressColor} h-full rounded-full`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                      <div className="flex -space-x-3">
                        {event.team && Array.isArray(event.team) && event.team.slice(0, 3).map((member: any, i: number) => (
                          member.avatarUrl ? (
                            <img key={i} className="w-8 h-8 rounded-full border-2 border-white object-cover" src={member.avatarUrl} alt={member.name} />
                          ) : (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-[10px] font-bold flex items-center justify-center text-gray-400 z-10">{member.name?.charAt(0).toUpperCase()}</div>
                          )
                        ))}
                        {event.team && event.team.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-[#facc15] text-[10px] font-bold flex items-center justify-center text-yellow-900 z-10">+{event.team.length - 3}</div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">{event.date ? new Date(event.date).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
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
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          {!staffLoading && !staffError && (
            <p className="text-[11px] text-gray-400 mt-4">{staff.length} member{staff.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Scrollable list */}
        <div
          style={{
            maxHeight: 420,
            overflowY: 'auto',
            minHeight: 0,
            width: '100%'
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >

          {/* Skeletons */}
          {staffLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 animate-pulse">
              <div className="w-12 h-12 rounded bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="hidden sm:block space-y-2">
                <div className="h-2 bg-gray-100 rounded w-12 ml-auto" />
                <div className="h-3 bg-gray-100 rounded w-20 ml-auto" />
              </div>
            </div>
          ))}

          {/* Error */}
          {staffError && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-[13px] font-medium p-5 rounded-xl">
              {staffError}
            </div>
          )}

          {/* Empty */}
          {!staffLoading && !staffError && staff.length === 0 && (
            <div className="text-[13px] text-gray-400 p-5">No staff members found.</div>
          )}

          {/* Staff rows — merged from users + staff collections */}
          {!staffLoading && !staffError && staff.map((member, i) => {
            const { dot, label, textClass } = getStatusConfig(member.status);
            const isUnavailable = !member.status || member.status.toLowerCase() === 'unavailable';

            const memberId = member._id?.toString() ?? i.toString();
            const isOpen = openActivityMember === memberId;
            return (
              <div
                key={memberId}
                className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:border-gray-200 transition-colors ${isUnavailable ? 'opacity-70 hover:opacity-100' : ''}`}
              >
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-5">
                    {member.avatarUrl ? (
                      <img
                        className={`w-12 h-12 rounded bg-gray-100 object-cover shadow-sm ${isUnavailable ? 'grayscale' : ''}`}
                        src={member.avatarUrl}
                        alt={member.name}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 shadow-sm flex items-center justify-center text-gray-400 font-bold text-lg">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[15px] font-bold text-gray-900">{member.name}</p>
                      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mt-1">
                        {member.role || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Status</p>
                      <p className={`text-[12px] mt-1.5 flex items-center justify-end gap-2 ${textClass}`}>
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        {label}
                      </p>
                    </div>
                    <button
                      className={`text-[12px] font-bold text-[#eebf43] hover:underline px-3 py-1.5 rounded transition-colors ${isOpen ? 'underline' : ''}`}
                      title="View Activity"
                      onClick={async () => {
                        if (isOpen) {
                          setOpenActivityMember(null);
                        } else {
                          setOpenActivityMember(memberId);
                          if (!activityLogs[memberId]) {
                            setActivityLoading(prev => ({ ...prev, [memberId]: true }));
                            const idToken = await user?.getIdToken();
                            if (idToken) {
                              const logs = await fetchMemberActivity(memberId, idToken);
                              setActivityLogs(prev => ({ ...prev, [memberId]: logs }));
                            }
                            setActivityLoading(prev => ({ ...prev, [memberId]: false }));
                          }
                        }
                      }}
                    >
                      View Activity
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-4 text-[13px] text-gray-700 shadow-inner animate-in fade-in duration-300">
                    <div className="font-bold text-[12px] text-gray-900 mb-2">Recent Activity</div>
                    {activityLoading[memberId] ? (
                      <div className="text-gray-400 italic">Loading...</div>
                    ) : (
                      <ul className="space-y-1">
                        {(activityLogs[memberId] || []).map((log: any, idx: number) => (
                          <li key={idx} className="flex flex-col gap-0.5 border-l-2 border-gray-100 pl-3 py-1">
                            <span className="text-[10px] font-bold text-gray-400">{log.time}</span>
                            <span className="text-[11px] font-medium text-gray-700 leading-snug">{log.action}</span>
                          </li>
                        ))}
                        {(!activityLogs[memberId] || activityLogs[memberId].length === 0) && (
                          <li className="text-gray-400 italic">No activity found.</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}