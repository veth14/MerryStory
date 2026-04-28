'use client';
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Calendar, MapPin, Users, DollarSign, Briefcase, AlertTriangle, User, Tag, Loader2, CheckCircle2, Plus, Minus, Mail, Phone, X, Search, UserPlus, Check } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';

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
  name: string;
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
    <div className="flex gap-4 items-center bg-white/50 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds }
      ].map((item, i) => (
        <React.Fragment key={item.label}>
          <div className="text-center min-w-[32px]">
            <div className="text-[18px] font-black text-gray-900 leading-none tabular-nums tracking-tighter">{String(item.value).padStart(2, '0')}</div>
            <div className="text-[7px] font-black text-[#d4a017] uppercase tracking-[0.1em] mt-1">{item.label}</div>
          </div>
          {i < 3 && <div className="text-gray-200 font-light text-sm mb-3">:</div>}
        </React.Fragment>
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
                    {event.leadAssigned.charAt(0)}
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
                      {member.name.charAt(0)}
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
    const filteredGuests = guests.filter(g => 
      g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
      g.email.toLowerCase().includes(guestSearch.toLowerCase())
    );

    return (
      <div className="animate-in fade-in duration-500 py-10 space-y-16">
        {/* Massive Countdown Header */}
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-10 inline-flex items-center gap-3 bg-gray-50 px-6 py-2.5 rounded-full border border-gray-100 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse"></div>
            <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Countdown to Live Production</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <BigCountdownItem targetDate={event!.date} />
          </div>

          <div className="mt-20 p-10 bg-[#111827] rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#facc15]/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-125 duration-1000"></div>
            <div className="relative z-10">
              <h2 className="text-[32px] font-black tracking-tight mb-4 text-[#facc15] italic uppercase">Command Center Activation</h2>
              <p className="text-white/60 max-w-xl mx-auto text-[15px] font-medium leading-relaxed">
                Live controls for guest check-ins, vendor logistics, and real-time alerts will become active on <span className="text-white font-bold">{new Date(event!.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>. 
              </p>
              <div className="mt-10 flex justify-center gap-6">
                <div className="w-16 h-1.5 w-full max-w-[160px] bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-[#facc15] animate-shimmer" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Management Section */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Guest <span className="text-[#facc15] italic">Manifest</span></h2>
              <p className="text-[14px] text-gray-500 font-medium">Real-time RSVP tracking and check-in station</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search guests..." 
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] font-bold text-gray-900 w-full sm:w-64 focus:border-[#facc15] transition-all outline-none"
                />
              </div>
              <button 
                onClick={() => setIsGuestModalOpen(true)}
                className="bg-[#facc15] hover:bg-[#eab308] text-white text-[12px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl shadow-xl shadow-[#facc15]/10 flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} />
                Add Guest
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">RSVP Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Table</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredGuests.map((guest) => (
                    <tr key={guest._id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[14px] font-black text-gray-400">
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[15px] font-black text-gray-900">{guest.name} {guest.plusOne && <span className="text-[#facc15] text-[10px]">+1</span>}</div>
                            <div className="text-[12px] font-bold text-gray-400">{guest.email || guest.phone || 'No contact info'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          guest.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          guest.status === 'Declined' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {guest.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[14px] font-black text-gray-900"># {guest.tableNo}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              const newChecked = !guest.checkedIn;
                              // Optimistic update
                              setGuests(prev => prev.map(g => g._id === guest._id ? { ...g, checkedIn: newChecked } : g));
                              
                              const idToken = await user!.getIdToken();
                              await fetch(`/api/events/${id}/guests/${guest._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                                body: JSON.stringify({ checkedIn: newChecked }),
                              });
                              fetchEventDetails();
                            }}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                              guest.checkedIn 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <CheckCircle2 size={14} strokeWidth={3} />
                            {guest.checkedIn ? 'Checked In' : 'Check In'}
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm(`Delete guest ${guest.name}?`)) {
                                const idToken = await user!.getIdToken();
                                const res = await fetch(`/api/events/${id}/guests/${guest._id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${idToken}` },
                                });
                                if (res.ok) {
                                  setGuests(prev => prev.filter(g => g._id !== guest._id));
                                  fetchEventDetails();
                                }
                              }
                            }}
                            className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGuests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">No guests found in manifest</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
    <div className="animate-in fade-in duration-300">
      <p className="text-sm font-medium text-gray-400 text-center py-20">Post-event reconciliation will activate after the live date.</p>
    </div>
  );

  return (
    <>
      <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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

          <div className="flex flex-col items-end gap-4">
            <Link
              href={`/admin/events/${id}/edit`}
              className="bg-[#facc15] hover:bg-[#eab308] text-white text-[12px] font-black uppercase tracking-[0.2em] px-10 py-4 rounded-xl shadow-xl shadow-[#facc15]/20 transition-all active:scale-95 flex items-center gap-2 group"
            >
              EDIT DETAILS
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
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


