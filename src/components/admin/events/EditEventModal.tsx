'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { X, Loader2, Save, User, Briefcase, MapPin, Tag, Mail, Phone, AlertTriangle } from 'lucide-react';
import { CustomSelect, CustomDatePicker } from '@/components/ui/CustomInputs';
import { useAuth } from '@/components/auth/AuthProvider';

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

interface StaffUser {
  uid: string;
  name: string;
  role: string;
  appRole: string;
  avatarUrl?: string;
}

interface EditEventModalProps {
  event: EventData;
  onClose: () => void;
  onUpdate: (updatedEvent: any) => void;
}

export default function EditEventModal({ event, onClose, onUpdate }: EditEventModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  const [formData, setFormData] = useState({
    title: event.title,
    type: event.type,
    date: event.date,
    location: event.location,
    leadAssigned: event.leadAssigned,
    status: event.status || 'Active',
    health: event.health || 100,
    budgetTotal: event.budget.total.toString(),
    clientName: event.client.name,
    clientEmail: event.client.email,
    clientPhone: event.client.phone,
    clientRole: event.client.role,
    initialAlert: event.initialAlert || ''
  });

  const [selectedTeam, setSelectedTeam] = useState<{ name: string, role: string, avatarUrl?: string }[]>(event.team || []);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoadingStaff(true);
      const idToken = await user!.getIdToken();
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStaff(data.users.filter((u: StaffUser) => u.appRole === 'admin' || u.appRole === 'coordinator'));
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const idToken = await user!.getIdToken();
      
      const payload = {
        title: formData.title,
        type: formData.type,
        date: formData.date,
        location: formData.location,
        leadAssigned: formData.leadAssigned,
        status: formData.status,
        health: parseInt(formData.health.toString()),
        budget: {
          ...event.budget,
          total: parseFloat(formData.budgetTotal)
        },
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          role: formData.clientRole
        },
        team: selectedTeam,
        initialAlert: formData.initialAlert
      };

      const response = await fetch(`/api/events/${event._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update event');
      }

      onUpdate({ ...event, ...payload });
    } catch (err: any) {
      setError(err.message || 'An error occurred during update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="4xl"
      actions={(
        <div className="flex items-center justify-end gap-6">
          <button type="button" onClick={onClose} className="text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
          <button type="submit" form="edit-event-form" disabled={isSubmitting} className="px-10 py-4 bg-[#111827] hover:bg-black text-[#facc15] text-[12px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-black/20 transition-all disabled:opacity-70 flex items-center gap-3">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      )}
    >
      <div>
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-10 py-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Edit <span className="text-[#facc15] italic">Production</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Refining project parameters</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <form id="edit-event-form" onSubmit={handleSubmit} className="p-10 space-y-10">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-[13px] font-extrabold border border-red-100 flex items-center gap-3">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Master Details */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
                <h3 className="text-[16px] font-black text-gray-900 uppercase tracking-wider">Master Configuration</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Production Title</label>
                  <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
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

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Venue Location</label>
                  <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Client Portfolio */}
             <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
                  <h3 className="text-[16px] font-black text-gray-900 uppercase tracking-wider">Client Portfolio</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Client Full Name</label>
                    <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Email</label>
                    <input required type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                    <input required type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                  </div>
                </div>
             </div>

             {/* Team & Health */}
             <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#facc15] rounded-full"></div>
                  <h3 className="text-[16px] font-black text-gray-900 uppercase tracking-wider">Team & Health</h3>
                </div>
                <div className="space-y-6">
                  <CustomSelect 
                    label="Lead Director"
                    value={formData.leadAssigned}
                    onChange={(val) => setFormData(prev => ({ ...prev, leadAssigned: val }))}
                    placeholder="Appoint lead..."
                    options={staff.map(s => ({
                      value: s.name, label: s.name, sublabel: s.role, avatar: s.avatarUrl
                    }))}
                  />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Production Health (%)</label>
                    <input type="number" name="health" value={formData.health} onChange={handleChange} min="0" max="100" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Global Budget Ceiling (PHP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#d4a017]">₱</span>
                      <input required type="number" name="budgetTotal" value={formData.budgetTotal} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                    </div>
                  </div>

                  {/* Multi-staff assignment */}
                  <div className="space-y-4 pt-6 border-t border-gray-50">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Additional Production Team</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedTeam.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full group hover:border-red-100 hover:bg-red-50 transition-all cursor-pointer" onClick={() => setSelectedTeam(prev => prev.filter((_, idx) => idx !== i))}>
                          <span className="text-[11px] font-black text-gray-900">{m.name}</span>
                          <X size={10} className="text-gray-400 group-hover:text-red-500" />
                        </div>
                      ))}
                    </div>
                    <CustomSelect 
                      placeholder="Add team member..."
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

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Urgent Priority Notice</label>
            <textarea name="initialAlert" value={formData.initialAlert} onChange={handleChange} rows={3} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none resize-none leading-relaxed"></textarea>
          </div>

        </form>
      </div>
    </Modal>
  );
}
