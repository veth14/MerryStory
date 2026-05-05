'use client';
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Calendar, MapPin, Users, DollarSign, Briefcase, AlertTriangle, User, Tag, Loader2, CheckCircle2, Plus, Minus, Mail, Phone, X, Search, UserPlus, Check } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';
import PostEventView from '@/components/admin/events/PostEventView';

interface EventData {
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
  leadAssigned: string;
  leadAvatarUrl?: string;
  team?: { name: string, role: string, avatarUrl?: string }[];
  milestones?: { title: string, category: string, date: string, status: string }[];
  initialAlert?: string;
  client: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  coverImageUrl?: string;
}

interface GuestData {
  _id: string;
  guestName?: string;
  name?: string;
  email: string;
  phone: string;
  status: 'Confirmed' | 'Pending' | 'Declined';
  tableNo: string;
  plusOne: boolean;
  checkedIn: boolean;
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return false;
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        return true;
      }
    };

    calculateTime();
    const timer = setInterval(() => {
      if (!calculateTime()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 animate-pulse">Production Live</span>;

  return (
    <div className="flex gap-3 items-center">
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds }
      ].map((item) => (
        <div key={item.label} className="bg-white/50 backdrop-blur-sm px-5 py-4 rounded-2xl border border-gray-100 shadow-sm text-center min-w-[56px]">
          <div className="text-[28px] font-black text-gray-900 leading-none tabular-nums tracking-tighter">{String(item.value).padStart(2, '0')}</div>
          <div className="text-[9px] font-black text-[#d4a017] uppercase tracking-[0.1em] mt-2">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pre-event');
  const [error, setError] = useState('');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', category: 'Project Start' });
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [newGuest, setNewGuest] = useState({
    name: '', email: '', phone: '', status: 'Confirmed', tableNo: '', plusOne: false
  });

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error('Failed to fetch event details');

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error(err);
      setError('Could not load project data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/events/${id}/guests`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGuests(data);
      }
    } catch (err) {
      console.error("Failed to fetch guests", err);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchEventDetails();
      fetchGuests();
    }
  }, [user, id]);

  // Real-time guest fetch on tab switch to event-day
  useEffect(() => {
    if (activeTab === 'event-day') {
      fetchGuests();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Production Workspace...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{error || 'Project Not Found'}</h2>
        <p className="text-gray-500 mt-2 max-w-xs">We couldn't retrieve the details for this production. It may have been archived or moved.</p>
        <Link href="/admin/events" className="mt-8 text-[11px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:underline flex items-center gap-2">
          <ArrowLeft size={14} /> Return to Portfolio
        </Link>
      </div>
    );
  }

  const renderPreEvent = () => (
    <div className="animate-in fade-in duration-300">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Budget Allocation</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">₱{(event.budget.utilized).toLocaleString()}</span>
            <span className="text-[13px] font-bold text-gray-400">/ ₱{(event.budget.total).toLocaleString()}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-5 mb-2 relative z-10">
            <div className="h-full bg-[#facc15] rounded-full" style={{ width: `${(event.budget.utilized / event.budget.total) * 100 || 0}%` }}></div>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{Math.round((event.budget.utilized / event.budget.total) * 100) || 0}% utilized</span>
            <button 
              onClick={() => setActiveTab('pre-event')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              Manage Budget
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Vendor Confirmation</h3>
          <div className="flex items-baseline gap-2 relative z-10 mb-4">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.vendors.secured}</span>
            <span className="text-[13px] font-bold text-gray-400">/ {event.vendors.total} Secured</span>
          </div>
          <div className="flex items-center mt-3 mb-1.5 relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#facc15] border-[3px] border-white -ml-0 flex items-center justify-center text-[9px] font-extrabold text-white z-10">
              <Briefcase size={12} />
            </div>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{event.vendors.total - event.vendors.secured} pending contracts</span>
            <button 
              onClick={() => setActiveTab('pre-event')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              View All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Guest Capacity</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[32px] font-extrabold text-gray-900 tracking-tight">{event.guests.invited}</span>
            <span className="text-[13px] font-bold text-gray-400">Invited</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 mb-2.5 relative z-10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-extrabold text-emerald-500 tracking-wide">~ {Math.round((event.guests.rsvp / event.guests.invited) * 100) || 0}% RSVP Rate</span>
          </div>
          <div className="flex justify-between items-center relative z-10 mt-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{event.guests.rsvp} confirmed</span>
            <button 
              onClick={() => setActiveTab('event-day')}
              className="text-[9px] font-extrabold text-[#d4a017] uppercase tracking-widest hover:text-[#b8860b]"
            >
              Guest List
            </button>
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
              <button 
                onClick={() => setIsMilestoneModalOpen(true)}
                className="text-[10px] font-extrabold text-[#d4a017] uppercase tracking-widest flex items-center gap-1.5 hover:text-[#b8860b]"
              >
                <Plus size={14} strokeWidth={3} />
                Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {event.milestones?.map((m, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-[0px_2px_8px_rgba(0,0,0,0.01)] hover:border-[#facc15]/30 transition-all">
                  <div className={`w-2 h-2 rounded-full ${m.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#facc15]'} ml-1`}></div>
                  <div className="flex-1">
                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{m.category}</p>
                    <p className="text-[14px] font-extrabold text-gray-900">{m.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
              {!event.milestones?.length && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="w-2 h-2 rounded-full bg-[#facc15] ml-1"></div>
                  <div>
                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Project Start</p>
                    <p className="text-[14px] font-extrabold text-gray-900">Production Initialized</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column / Sidebar Area */}
        <div className="space-y-6">
          {/* Urgent Alerts Box */}
          <div className="bg-[#111827] rounded-2xl p-7 shadow-sm text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#facc15] text-[16px] font-extrabold tracking-tight">Urgent Alerts</h2>
              <button className="text-[9px] font-extrabold text-white/50 uppercase tracking-widest hover:text-white transition-colors">Clear All</button>
            </div>
            <div className="space-y-6">
              <div className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-[#facc15] before:rounded-full">
                <h4 className="text-[13px] font-extrabold text-white mb-1.5 leading-snug">Initial Briefing</h4>
                <p className="text-[11px] text-white/60 font-medium leading-relaxed">{event.initialAlert || 'No active alerts for this production.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 py-7 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-black text-gray-900 tracking-tight">Production Team</h2>
            </div>
            <div className="space-y-5">
              {/* Lead */}
              <div className="flex items-center gap-3.5">
                {event.leadAvatarUrl ? (
                  <img src={event.leadAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-[12px] font-black uppercase tracking-widest overflow-hidden border-2 border-white shadow-sm">
                    {String(event.leadAssigned || '').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-[14px] font-black text-gray-900 capitalize leading-tight">{event.leadAssigned}</h4>
                  <p className="text-[9px] font-black text-[#d4a017] uppercase tracking-widest mt-1">Lead Director</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </div>

              {/* Additional Team */}
              {event.team?.map((member, i) => (
                <div key={i} className="flex items-center gap-3.5 pt-4 border-t border-gray-50">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-sm">
                      {String(member.name || '').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-[13px] font-black text-gray-900 capitalize leading-tight">{member.name}</h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-2xl p-6 py-7 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight">Client Contact</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-extrabold text-gray-900">{event.client.name}</h4>
                <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">{event.client.role}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-[#d4a017] cursor-pointer transition-colors">
                <Mail size={12} /> {event.client.email}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-[#d4a017] cursor-pointer transition-colors">
                <Phone size={12} /> {event.client.phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventDay = () => {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks Complete */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tasks Complete</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">18</span>
              <span className="text-[18px] font-bold text-gray-400">/25</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>

          {/* Timeline Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Timeline Progress</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">65</span>
              <span className="text-[18px] font-bold text-gray-400">%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          {/* Guests Checked In */}
          <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Guests Checked In</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[48px] font-black text-gray-900 tracking-tight leading-none">142</span>
              <span className="text-[18px] font-bold text-gray-400">/350</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#facc15] rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Program Timeline */}
          <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Program <span className="text-[#facc15] italic">Timeline</span></h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1">Live stage cues and schedule</p>
              </div>
              <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl">
                <Calendar size={14} />
                Edit Schedule
              </button>
            </div>

            <div className="space-y-6">
              {/* Timeline Item 1 */}
              <div className="flex gap-4 pb-6 border-b border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                  <div className="w-0.5 h-full bg-gray-100 mt-2"></div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">10:00 AM - 11:30 AM</div>
                  <h3 className="text-[16px] font-black text-gray-900 mb-1">Pre-Show & Soundcheck</h3>
                  <p className="text-[12px] text-gray-500 font-medium">Full run-through with lighting cues</p>
                </div>
              </div>

              {/* Timeline Item 2 - Live Now */}
              <div className="flex gap-4 pb-6 border-b border-gray-100 bg-[#facc15]/5 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#facc15] border-2 border-white shadow-lg shadow-[#facc15]/30 animate-pulse"></div>
                  <div className="w-0.5 h-full bg-[#facc15]/20 mt-2"></div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest">12:00 PM - 01:00 PM</span>
                    <span className="bg-[#facc15] text-gray-900 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Live Now</span>
                  </div>
                  <h3 className="text-[16px] font-black text-gray-900 mb-2">Opening Keynote</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600">
                      <span className="font-bold">Cue:</span>
                      <span className="font-medium">Video intro plays, lights dim to 20%</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-400" />
                        <span className="font-bold text-gray-600">Speaker: Mayor</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-emerald-600">Mic 1 Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">01:15 PM - 02:30 PM</div>
                  <h3 className="text-[16px] font-black text-gray-900 mb-1">Lunch & Networking</h3>
                  <p className="text-[12px] text-gray-500 font-medium">Buffet opens in Main Hall</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Check-in */}
          <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Check-in</span></h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1">Real-time RSVP tracking and entry</p>
              </div>
              <button className="bg-[#facc15] hover:bg-[#eab308] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-[#facc15]/20 flex items-center gap-2">
                <Search size={14} />
                Launch Scanner
              </button>
            </div>

            {/* Guest Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Expected</div>
                <div className="text-[32px] font-black text-gray-900 leading-none">350</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest mb-2">Checked In</div>
                <div className="text-[32px] font-black text-[#facc15] leading-none">142</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Late/Pending</div>
                <div className="text-[32px] font-black text-gray-400 leading-none">208</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search guests by name or email..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold text-gray-900 focus:border-[#facc15] transition-all outline-none"
              />
            </div>

            {/* Guest List Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 pb-3 border-b border-gray-100 mb-4">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Guest Details</div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Table</div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Action</div>
            </div>

            {/* Guest List Items */}
            <div className="space-y-3">
              {/* Guest 1 */}
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-[12px] font-black">
                    MS
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900">Mayor Santos</div>
                    <div className="text-[10px] font-black text-[#facc15] uppercase tracking-wider">VIP Guest</div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[13px] font-black text-gray-900">VIP-1</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border border-emerald-100">
                    <CheckCircle2 size={12} />
                    Arrived
                  </span>
                </div>
              </div>

              {/* Guest 2 */}
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[12px] font-black">
                    JD
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900">Jane Dela Cruz</div>
                    <div className="text-[10px] font-bold text-gray-400">jane@email.com</div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[13px] font-black text-gray-900">12</span>
                </div>
                <div className="text-right">
                  <button className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-gray-200 transition-colors">
                    <UserPlus size={12} />
                    Check In
                  </button>
                </div>
              </div>

              {/* Guest 3 */}
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center py-3 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[12px] font-black">
                    MR
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900">Maria Reyes</div>
                    <div className="text-[10px] font-bold text-gray-400">maria@email.com</div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[13px] font-black text-gray-900">8</span>
                </div>
                <div className="text-right">
                  <button className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-gray-200 transition-colors">
                    <UserPlus size={12} />
                    Check In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BigCountdownItem = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
      const calculate = () => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        if (diff <= 0) return setTimeLeft(null);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      };
      calculate();
      const timer = setInterval(calculate, 1000);
      return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return <div className="col-span-4 py-10 text-[64px] font-black text-emerald-500 tracking-tight italic">PRODUCTION IS LIVE</div>;

    const units = [
      { label: 'DAYS', value: timeLeft.days },
      { label: 'HOURS', value: timeLeft.hours },
      { label: 'MINUTES', value: timeLeft.minutes },
      { label: 'SECONDS', value: timeLeft.seconds }
    ];

    return (
      <>
        {units.map((unit) => (
          <div key={unit.label} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center transform transition-transform hover:-translate-y-2 duration-500">
            <span className="text-[84px] font-black text-gray-900 leading-none tabular-nums tracking-tighter mb-4">{String(unit.value).padStart(2, '0')}</span>
            <span className="text-[12px] font-black text-[#d4a017] uppercase tracking-[0.3em]">{unit.label}</span>
          </div>
        ))}
      </>
    );
  };

  const renderPostEvent = () => (
    <PostEventView eventId={id} user={user!} />
  );

  return (
    <>
      <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-gray-400 hover:text-gray-600 uppercase transition-colors mb-4">
              <ArrowLeft size={12} strokeWidth={3} /> Return to Portfolio
            </Link>
            <div className="flex items-center gap-4">
              <span className="bg-[#facc15] text-gray-900 text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] rounded-lg shadow-sm">{event.status}</span>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              <span className="text-gray-400 text-[11px] font-black tracking-widest uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="text-[54px] font-black text-gray-900 tracking-tight leading-none mt-4">
              {event.title.includes(' ')
                ? <>{event.title.split(' ').slice(0, -1).join(' ')} <span className="text-[#facc15] italic">{event.title.split(' ').pop()}</span></>
                : event.title
              }
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400">
                <MapPin size={16} className="text-gray-400" />
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

          <div className="flex flex-col items-end gap-6">
            <Link
              href={`/admin/events/${id}/edit`}
              className="bg-[#facc15] hover:bg-[#eab308] text-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl shadow-xl shadow-[#facc15]/20 transition-all active:scale-95 flex items-center gap-2 group mt-8"
            >
              EDIT DETAILS
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="mt-auto mb-0">
              <CountdownTimer targetDate={event.date} />
            </div>
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

      {isGuestModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">Initialize <span className="text-[#facc15] italic">Guest</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10">Add attendee to production manifest</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Legal Name</label>
                <input 
                  type="text" 
                  value={newGuest.name}
                  onChange={(e) => setNewGuest(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                  placeholder="Enter guest name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={newGuest.email}
                  onChange={(e) => setNewGuest(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Table Number</label>
                <input 
                  type="text" 
                  value={newGuest.tableNo}
                  onChange={(e) => setNewGuest(p => ({ ...p, tableNo: e.target.value }))}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                  placeholder="e.g. 12 or TBD"
                />
              </div>
              
              <CustomSelect 
                label="RSVP Status"
                value={newGuest.status}
                onChange={(val) => setNewGuest(p => ({ ...p, status: val as any }))}
                options={[
                  { value: 'Confirmed', label: 'Confirmed' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Declined', label: 'Declined' },
                ]}
              />
              
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 cursor-pointer hover:bg-gray-100 transition-all" onClick={() => setNewGuest(p => ({ ...p, plusOne: !p.plusOne }))}>
                 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${newGuest.plusOne ? 'bg-[#facc15] border-[#facc15]' : 'border-gray-200 bg-white'}`}>
                    {newGuest.plusOne && <Check size={14} className="text-white" strokeWidth={4} />}
                 </div>
                 <span className="text-[13px] font-extrabold text-gray-900">Plus One (+1)</span>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setIsGuestModalOpen(false)}
                className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
              >
                Discard
              </button>
              <button 
                onClick={async () => {
                  if (!newGuest.name) return;
                  const idToken = await user!.getIdToken();
                  const res = await fetch(`/api/events/${id}/guests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify(newGuest),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setGuests(prev => [data, ...prev]);
                    setIsGuestModalOpen(false);
                    setNewGuest({ name: '', email: '', phone: '', status: 'Confirmed', tableNo: '', plusOne: false });
                    fetchEventDetails(); // Refresh stats
                  }
                }}
                className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20"
              >
                Initialize Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">New <span className="text-[#facc15] italic">Milestone</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">Production Sequence Addition</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Milestone Title</label>
                <input 
                  type="text" 
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Venue secured"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-[#facc15] transition-all"
                />
              </div>
              <CustomSelect 
                label="Category"
                value={newMilestone.category}
                onChange={(val) => setNewMilestone(p => ({ ...p, category: val }))}
                options={[
                  { value: 'Logistics', label: 'Logistics' },
                  { value: 'Vendors', label: 'Vendors' },
                  { value: 'Creative', label: 'Creative' },
                  { value: 'Finance', label: 'Finance' },
                ]}
              />
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setIsMilestoneModalOpen(false)}
                className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newMilestone.title) return;
                  const m = { ...newMilestone, date: new Date().toISOString(), status: 'Pending' };
                  const updatedEvent = { ...event, milestones: [...(event.milestones || []), m] };
                  
                  // Optimistic update
                  setEvent(updatedEvent);
                  setIsMilestoneModalOpen(false);
                  setNewMilestone({ title: '', category: 'Logistics' });

                  // Save to DB
                  const idToken = await user!.getIdToken();
                  await fetch(`/api/events/${event._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({ milestones: updatedEvent.milestones }),
                  });
                }}
                className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


