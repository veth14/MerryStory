'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, User, Briefcase, MapPin, Tag, Mail, Phone, AlertTriangle, Trash2, Plus, ArrowRight, X, Minus } from 'lucide-react';
import { CustomSelect, CustomDatePicker, CustomTimePicker } from '@/components/ui/CustomInputs';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

interface StaffUser {
  uid: string;
  name: string;
  role: string;
  appRole: string;
  avatarUrl?: string;
}

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
  team?: { name: string, role: string, avatarUrl?: string }[];
  initialAlert?: string;
  client: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

const extractDatePart = (value: string) => {
  if (!value) return '';

  const directMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) return directMatch[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

const extractTimePart = (value: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';

  const directMatch = value.match(/T(\d{2}:\d{2})/);
  if (directMatch) return directMatch[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
};

const combineEventDateTime = (date: string, time: string) => {
  if (!date) return '';
  if (!time) return date;
  return `${date}T${time}:00`;
};

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    date: '',
    time: '',
    location: '',
    leadAssigned: '',
    status: '',
    health: 100,
    budgetTotal: '',
    vendorTarget: '',
    guestCapacity: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientRole: '',
    initialAlert: ''
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTeam, setSelectedTeam] = useState<{ name: string, role: string, avatarUrl?: string }[]>([]);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user!.getIdToken();

      // Fetch Event
      const eventRes = await fetch(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!eventRes.ok) throw new Error('Failed to fetch event');
      const eventData = await eventRes.json();
      setEvent(eventData);

      // Set Form Data
      setFormData({
        title: eventData.title,
        type: eventData.type,
        date: extractDatePart(eventData.date),
        time: extractTimePart(eventData.date),
        location: eventData.location,
        leadAssigned: eventData.leadAssigned,
        status: eventData.status || 'Active',
        health: eventData.health || 100,
        budgetTotal: eventData.budget.total.toString(),
        vendorTarget: (eventData.vendors?.total || 0).toString(),
        guestCapacity: (eventData.guests?.invited || 0).toString(),
        clientName: eventData.client.name,
        clientEmail: eventData.client.email,
        clientPhone: eventData.client.phone,
        clientRole: eventData.client.role,
        initialAlert: eventData.initialAlert || ''
      });
      setImagePreview(eventData.coverImageUrl || null);
      setSelectedTeam(eventData.team || []);

      // Fetch Staff
      const staffRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.users.filter((u: StaffUser) => u.appRole === 'admin' || u.appRole === 'coordinator'));
      }
    } catch (err: any) {
      setError(err.message || 'Could not load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!formData.date) {
      setError('Production date is required.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.time) {
      setError('Production time is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await user!.getIdToken();

      const data = new FormData();
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('date', combineEventDateTime(formData.date, formData.time));
      data.append('location', formData.location);
      data.append('leadAssigned', formData.leadAssigned);
      data.append('status', formData.status);
      data.append('health', formData.health.toString());
      data.append('budgetTotal', formData.budgetTotal);
      data.append('vendorTarget', formData.vendorTarget);
      data.append('guestCapacity', formData.guestCapacity);
      data.append('clientName', formData.clientName);
      data.append('clientEmail', formData.clientEmail);
      data.append('clientPhone', formData.clientPhone);
      data.append('clientRole', formData.clientRole);
      data.append('initialAlert', formData.initialAlert);
      data.append('team', JSON.stringify(selectedTeam));

      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: data,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update production');
      }

      router.push(`/admin/events/${id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during update.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-10">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-black tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
            Workspace <ArrowRight size={10} className="text-[#eebf43]" /> <span className="text-[#1d1d1f]">Configuration</span>
          </p>
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} strokeWidth={3} />
            </Link>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] rounded-lg">Production ID: {id.slice(-6).toUpperCase()}</span>
          </div>
          <h1 className="text-[54px] font-black text-gray-900 tracking-tight leading-none">
            Update <span className="text-[#facc15] italic">Production</span>
          </h1>
          <p className="text-[14px] text-gray-500 font-medium mt-6 max-w-2xl leading-relaxed">
            Refine the core parameters for this workspace. Changes will sync across all team members and vendor portals in real-time.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {error && (
          <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-[13px] font-extrabold border border-red-100 flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* Row 1: Master Visual & Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-4">
                <Tag size={12} /> Master Visual (Cover)
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#facc15] hover:shadow-xl hover:shadow-[#facc15]/5 transition-all relative overflow-hidden group"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-[11px] font-black tracking-widest uppercase">Replace Master Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#d4a017]">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Plus size={24} />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Upload Cover</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>
           </div>

           <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
                    <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Master Configuration</h3>
                  </div>
                  <div className="w-48">
                    <CustomSelect 
                      label="Production Status"
                      value={formData.status}
                      onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                      options={[
                        { value: 'Active', label: 'Active Production' },
                        { value: 'At Risk', label: 'At Risk' },
                        { value: 'On Hold', label: 'On Hold' },
                        { value: 'Completed', label: 'Completed' },
                      ]}
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Production Title</label>
                  <input required type="text" name="title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>

                <CustomSelect 
                  label="Production Type"
                  value={formData.type}
                  onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                  icon={Briefcase}
                  options={[
                    { value: 'Wedding', label: 'Wedding' },
                    { value: 'Corporate', label: 'Corporate' },
                    { value: 'Gala', label: 'Gala / Fundraiser' },
                    { value: 'Exhibition', label: 'Exhibition / Expo' },
                    { value: 'Private', label: 'Private Event' },
                  ]}
                />

                <CustomDatePicker 
                  label="Production Date"
                  value={formData.date}
                  onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Venue Location</label>
                  <input required type="text" name="location" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>

                <CustomTimePicker
                  label="Production Time"
                  value={formData.time}
                  selectedDate={formData.date}
                  trailingIcon="chevron"
                  disablePastForToday
                  labelClassName="text-gray-400"
                  triggerClassName="w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none"
                  openTriggerClassName="border-[#facc15] bg-white"
                  closedTriggerClassName="border-gray-100 hover:bg-white hover:border-[#facc15]"
                  textClassName="text-[15px]"
                  selectedTextClassName="font-extrabold text-gray-900"
                  placeholderTextClassName="font-extrabold text-gray-400"
                  onChange={(val) => setFormData(prev => ({ ...prev, time: val }))}
                />
              </div>
           </div>
        </div>

        {/* Row 2: Limits */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-5 bg-[#facc15] rounded-full"></div>
            <h3 className="text-gray-900 text-[16px] font-black tracking-tight uppercase tracking-widest">Workspace Limits</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Global Budget Ceiling (PHP)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[18px] font-black text-[#d4a017]">₱</span>
                <input required type="number" value={formData.budgetTotal} onChange={(e) => setFormData(p => ({ ...p, budgetTotal: e.target.value }))} className="w-full pl-10 pr-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[22px] font-black text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vendor Target</label>
              <input required type="number" value={formData.vendorTarget} onChange={(e) => setFormData(p => ({ ...p, vendorTarget: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-[18px] font-black text-gray-900 focus:bg-white outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Guest Capacity</label>
              <input required type="number" value={formData.guestCapacity} onChange={(e) => setFormData(p => ({ ...p, guestCapacity: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-[18px] font-black text-gray-900 focus:bg-white outline-none" />
            </div>
          </div>
        </div>

        {/* Row 3: Client & Team */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
              <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Client Portfolio</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal Name</label>
                <input required type="text" name="clientName" value={formData.clientName} onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Role</label>
                <input required type="text" name="clientRole" value={formData.clientRole} onChange={(e) => setFormData(p => ({ ...p, clientRole: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                <input required type="email" name="clientEmail" value={formData.clientEmail} onChange={(e) => setFormData(p => ({ ...p, clientEmail: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone</label>
                <input required type="tel" name="clientPhone" value={formData.clientPhone} onChange={(e) => setFormData(p => ({ ...p, clientPhone: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
              <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Team Coordination</h3>
            </div>
            <div className="space-y-8">
               <CustomSelect 
                  label="Appointed Lead"
                  value={formData.leadAssigned}
                  onChange={(val) => setFormData(prev => ({ ...prev, leadAssigned: val }))}
                  options={staff.map(s => ({
                    value: s.name, label: s.name, sublabel: s.role, avatar: s.avatarUrl
                  }))}
                />

                <div className="space-y-4 pt-4 border-t border-gray-50">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Additional Workspace Staff</label>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {selectedTeam.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl group hover:border-red-100 hover:bg-red-50 transition-all cursor-pointer" onClick={() => setSelectedTeam(prev => prev.filter((_, idx) => idx !== i))}>
                          <span className="text-[12px] font-black text-gray-900">{m.name}</span>
                          <X size={12} className="text-gray-400 group-hover:text-red-500" />
                        </div>
                      ))}
                    </div>
                    <CustomSelect 
                      placeholder="Add more staff..."
                      options={staff.filter(s => !selectedTeam.find(m => m.name === s.name) && s.name !== formData.leadAssigned).map(s => ({
                        value: s.name, label: s.name, sublabel: s.role, avatar: s.avatarUrl
                      }))}
                      value=""
                      onChange={(name) => {
                        const s = staff.find(st => st.name === name);
                        if (s) setSelectedTeam(prev => [...prev, { name: s.name, role: s.role, avatarUrl: s.avatarUrl }]);
                      }}
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Row 4: Priority Notice */}
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
              <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Priority Broadcast Notice</h3>
           </div>
           <textarea name="initialAlert" value={formData.initialAlert} onChange={(e) => setFormData(p => ({ ...p, initialAlert: e.target.value }))} rows={4} className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-[30px] text-[16px] font-bold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none resize-none leading-relaxed"></textarea>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-10 pt-10 border-t border-gray-100">
          <Link href={`/admin/events/${id}`} className="text-[12px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] hover:text-gray-900 transition-colors">Discard Changes</Link>
          <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-[#facc15] hover:bg-[#eab308] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-[#facc15]/20 transition-all disabled:opacity-70 flex items-center gap-4 active:scale-95 group">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
            Save Production Configuration
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
