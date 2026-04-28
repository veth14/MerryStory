'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, MapPin, Briefcase, AlertTriangle, User, Tag,
  Image as ImageIcon, UploadCloud, Phone, Mail, Loader2,
  Check, UserCheck, Save, Clock
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect, CustomDatePicker } from '@/components/ui/CustomInputs';
import { TaskTimeField } from '@/app/admin/tasks/TaskControls';

interface StaffUser {
  uid: string;
  name: string;
  role: string;
  appRole: string;
  avatarUrl?: string;
}

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('inquiryId');
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInquiry, setIsLoadingInquiry] = useState(!!inquiryId);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Wedding',
    date: '',
    time: '',
    location: '',
    budgetTotal: '',
    vendorTarget: '',
    guestCapacity: '',
    leadAssigned: '',
    initialAlert: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientRole: 'Bride/Groom'
  });

  useEffect(() => {
    if (user) {
      fetchStaff();
      if (inquiryId) {
        fetchInquiryDetails();
      }
    }
  }, [inquiryId, user]);

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

  const fetchInquiryDetails = async () => {
    try {
      setIsLoadingInquiry(true);
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch inquiry details');
      const inquiry = await response.json();
      
      setFormData(prev => ({
        ...prev,
        title: `${inquiry.client}'s ${inquiry.eventType}`,
        type: inquiry.eventType === 'Weddings' ? 'Wedding' : 
              inquiry.eventType === 'Corporate Events' ? 'Corporate' : 
              inquiry.eventType === 'Debuts / Galas' ? 'Gala' : 'Private',
        clientName: inquiry.client,
        clientEmail: inquiry.email,
        initialAlert: `Original Inquiry Needs: ${inquiry.needs}`
      }));
    } catch (err) {
      console.error(err);
      setError('Could not pre-populate inquiry details.');
    } finally {
      setIsLoadingInquiry(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    setError('');

    // Extensive Validation
    if (!coverImage) {
      setError('A Master Visual (Cover) is required to initialize the workspace.');
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.title.trim()) {
      setError('Production Title is required.');
      return;
    }

    if (!formData.date) {
      setError('Live Production Date is required.');
      return;
    }

    if (!formData.location.trim()) {
      setError('Master Location / Venue is required.');
      return;
    }

    if (!formData.leadAssigned) {
      setError('A Production Director must be appointed.');
      return;
    }

    if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.clientPhone.trim()) {
      setError('All Client Portfolio fields are required.');
      return;
    }

    const budget = parseFloat(formData.budgetTotal);
    if (isNaN(budget) || budget <= 0) {
      setError('Please enter a valid Budget Ceiling.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      const combinedDate = formData.date
        ? `${formData.date}T${formData.time || '00:00'}`
        : '';
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'time') return;
        if (key === 'date') {
          data.append(key, combinedDate);
          return;
        }
        data.append(key, value);
      });
      data.append('coverImage', coverImage); // Guaranteed to be here due to validation

      const idToken = await user!.getIdToken();
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: data,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create event');

      // Promote inquiry to "Confirmed" upon successful workspace initialization
      if (inquiryId) {
        try {
          await fetch(`/api/inquiries/${inquiryId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}` 
            },
            body: JSON.stringify({ status: 'Confirmed' }),
          });
        } catch (e) {
          console.error("Failed to update source inquiry status:", e);
        }
      }

      setSuccess(true);
      setTimeout(() => router.push(`/admin/events/${result.eventId}`), 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during event creation.');
      setIsSubmitting(false);
    }
  };

  const selectedStaff = staff.find(s => s.name === formData.leadAssigned);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-[#facc15] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#facc15]/20">
          <Check className="w-8 h-8 text-gray-900" strokeWidth={3} />
        </div>
        <h2 className="text-[32px] font-extrabold text-gray-900 tracking-tight">Production Initialized</h2>
        <p className="text-[13px] font-bold text-gray-400 mt-2 tracking-widest uppercase">Redirecting to workspace...</p>
      </div>
    );
  }

  if (isLoadingInquiry) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching Inquiry Details...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-10">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
            Workspace <ArrowRight size={10} className="text-[#eebf43]" /> <span className="text-[#1d1d1f]">Initialization</span>
          </p>
          <div className="flex items-center">
            <span className="bg-[#facc15] text-gray-900 text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-lg">New Production</span>
            {inquiryId && (
              <span className="ml-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-lg border border-emerald-100">Lead Conversion</span>
            )}
          </div>
          <h1 className="text-[54px] font-black text-gray-900 tracking-tight leading-none mt-4">
            Initialize <span className="text-[#facc15] italic">Workspace</span>
          </h1>
          <p className="text-[14px] text-gray-500 font-medium mt-6 max-w-2xl leading-relaxed">
            Configure the master parameters for this production. These details will serve as the baseline for financial health, vendor coordination, and guest logistics.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-[13px] font-extrabold border border-red-100 flex items-center gap-3 animate-in shake duration-500">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">
                <ImageIcon size={12} /> Master Visual (Cover) <span className="text-red-500 ml-1">*</span>
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full aspect-[4/3] bg-gray-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all relative overflow-hidden group ${!coverImage && error && error.includes('Cover') ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-[#facc15] hover:shadow-xl hover:shadow-[#facc15]/5'}`}
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
                    <UploadCloud size={48} strokeWidth={1.5} className="mb-4 text-gray-200 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] ml-1">Upload Workspace Cover</span>
                    <span className="text-[10px] font-bold text-gray-300 mt-2 tracking-wide">(1920 x 1080 Recommended)</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    <Tag size={12} /> Production Title
                  </label>
                  <input 
                    required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. The Imperial Wedding Gala"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] focus:ring-4 focus:ring-[#facc15]/10 transition-all outline-none"
                  />
                </div>

                <CustomSelect 
                  label="Production Type"
                  value={formData.type}
                  onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                  icon={Briefcase}
                  options={[
                    { value: 'Wedding', label: 'Wedding', sublabel: 'Ceremonies & Receptions' },
                    { value: 'Corporate', label: 'Corporate', sublabel: 'Conferences & Launchings' },
                    { value: 'Gala', label: 'Gala / Fundraiser', sublabel: 'Black Tie & Charity' },
                    { value: 'Exhibition', label: 'Exhibition / Expo', sublabel: 'Trade Shows & Markets' },
                    { value: 'Private', label: 'Private Event', sublabel: 'Parties & Celebrations' },
                  ]}
                />

                <CustomDatePicker 
                  label="Live Production Date"
                  value={formData.date}
                  onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    <MapPin size={12} /> Master Location / Venue
                  </label>
                  <input 
                    required type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Shangri-La The Fort, Manila"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] focus:ring-4 focus:ring-[#facc15]/10 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    <Clock size={12} /> Live Production Time
                  </label>
                  <TaskTimeField
                    value={formData.time}
                    onChange={(val) => setFormData((prev) => ({ ...prev, time: val }))}
                    size="modal"
                    className="space-y-0"
                    triggerClassName="min-h-[56px] rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] focus:ring-4 focus:ring-[#facc15]/10"
                  />
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="text-[18px] font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-3">
              <User className="text-[#facc15]" size={20} /> Client Portfolio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Legal Full Name</label>
                <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Contact Number</label>
                <input required type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Legal Email Address</label>
                <input required type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
              <div className="">
                <CustomSelect 
                  label="Client Relationship Role"
                  value={formData.clientRole}
                  onChange={(val) => setFormData(prev => ({ ...prev, clientRole: val }))}
                  options={[
                    { value: 'Bride/Groom', label: 'Bride / Groom' },
                    { value: 'Corporate Lead', label: 'Corporate Lead' },
                    { value: 'Event Sponsor', label: 'Event Sponsor' },
                    { value: 'Stakeholder', label: 'Key Stakeholder' },
                    { value: 'Other', label: 'Other Representative' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="text-[18px] font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-3">
              <Briefcase className="text-[#facc15]" size={20} /> Financial Limits
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Global Budget Ceiling (PHP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#d4a017]">₱</span>
                  <input required type="number" name="budgetTotal" value={formData.budgetTotal} onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <input required type="number" name="vendorTarget" value={formData.vendorTarget} onChange={handleChange} placeholder="Vendor Target" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                <input required type="number" name="guestCapacity" value={formData.guestCapacity} onChange={handleChange} placeholder="Guest Capacity" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Appoint Director</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Primary production management lead</p>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                 <div className="flex-1 w-full">
                    <CustomSelect 
                      label="Select Production Lead"
                      value={formData.leadAssigned}
                      onChange={(val) => setFormData(prev => ({ ...prev, leadAssigned: val }))}
                      placeholder="Appoint lead from team..."
                      options={staff.map(s => ({
                        value: s.name, label: s.name, sublabel: s.role, avatar: s.avatarUrl
                      }))}
                    />
                 </div>
                 {selectedStaff && (
                   <div className="w-full md:w-[280px] bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4 animate-in zoom-in-95 duration-300">
                      {selectedStaff.avatarUrl ? (
                        <img src={selectedStaff.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-xl font-black text-[#d4a017]">{selectedStaff.name.charAt(0)}</div>
                      )}
                      <div className="flex-1">
                         <div className="text-[14px] font-black text-gray-900 leading-tight">{selectedStaff.name}</div>
                         <div className="text-[9px] font-black text-[#d4a017] uppercase tracking-wider mt-1">{selectedStaff.role}</div>
                      </div>
                   </div>
                 )}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Initial Priority Notice</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Optional workspace alert for the team</p>
              </div>
              <textarea name="initialAlert" value={formData.initialAlert} onChange={handleChange} rows={4} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none resize-none leading-relaxed"></textarea>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-10 pt-10 border-t border-gray-100">
          <Link href="/admin/events" className="text-[12px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] hover:text-red-500 transition-colors">Discard Workspace</Link>
          <button type="submit" disabled={isSubmitting} className="px-12 py-5 bg-[#facc15] hover:bg-[#eab308] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-[#facc15]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-4 active:scale-95 group">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
            {isSubmitting ? 'Initializing...' : 'Initialize Production Workspace'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-[70vh] gap-4"><Loader2 className="w-10 h-10 text-[#eebf43] animate-spin" /><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading...</p></div>}>
      <NewEventForm />
    </Suspense>
  );
}
