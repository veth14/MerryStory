'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Check, Clock, AlertCircle, Loader, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect, CustomDatePicker } from '@/components/ui/CustomInputs';

interface Vendor {
  _id: string;
  vendorName: string;
  serviceCategory: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'confirmed' | 'pending' | 'rejected';
  contractAmount?: number;
  contractDate?: string;
}

interface AvailableVendor {
  _id?: string;
  vendorName: string;
  serviceCategory: string;
  email?: string;
  phone?: string;
  contractAmount?: number;
}

interface EventData {
  _id: string;
  title: string;
  vendors: {
    total: number;
    secured: number;
  };
  date?: string;
  status?: string;
  location?: string;
  health?: number;
}

interface VendorFormState {
  vendorName: string;
  serviceCategory: string;
  email: string;
  phone: string;
  contractAmount: string;
  contractDate: string;
}

const createEmptyVendorForm = (): VendorFormState => ({
  vendorName: '',
  serviceCategory: '',
  email: '',
  phone: '',
  contractAmount: '',
  contractDate: ''
});

export default function VendorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [availableVendors, setAvailableVendors] = useState<AvailableVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState<VendorFormState>(createEmptyVendorForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExistingVendor, setSelectedExistingVendor] = useState('');

  

  // Fetch event data and vendor list
  useEffect(() => {
    if (!user || !eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const idToken = await user.getIdToken();

        // Fetch event data
        const eventRes = await fetch(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!eventRes.ok) throw new Error('Failed to fetch event');
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Fetch vendors for this event
        const vendorRes = await fetch(`/api/admin/vendors?eventId=${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (vendorRes.ok) {
          const vendorData = await vendorRes.json();
          setVendors(Array.isArray(vendorData) ? vendorData : []);
        }

        // Fetch all available vendors from system
        const allVendorsRes = await fetch('/api/vendors', {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (allVendorsRes.ok) {
          const allVendorsData = await allVendorsRes.json();
          setAvailableVendors(
            Array.isArray(allVendorsData)
              ? allVendorsData.map((v: any) => ({
                  _id: v._id?.toString?.() || v._id,
                  vendorName: v.name || v.vendorName,
                  serviceCategory: v.category || v.serviceCategory,
                  email: v.email,
                  phone: v.phone,
                  contactAmount: v.contractAmount,
                }))
              : []
          );
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load event or vendor data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, eventId]);

  const handleAddVendor = async () => {
    if (!newVendor.vendorName || !newVendor.serviceCategory || !user || !eventId) {
      setError('Please fill in Vendor Name and Service Category');
      return;
    }

    try {
      setIsSubmitting(true);
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId,
          ...newVendor,
          status: 'pending',
          contractAmount: newVendor.contractAmount ? parseFloat(newVendor.contractAmount) : 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to add vendor');

      const addedVendor = await response.json();
      setVendors([...vendors, addedVendor]);
      setNewVendor(createEmptyVendorForm());
      setSelectedExistingVendor('');
      setShowAddModal(false);
      setError('');

      // Update event vendor count
      if (event) {
        setEvent({
          ...event,
          vendors: {
            ...event.vendors,
            total: event.vendors.total + 1
          }
        });
      }
    } catch (err) {
      console.error('Error adding vendor:', err);
      setError('Failed to add vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingVendor = (vendorId: string) => {
    const selectedVendor = availableVendors.find(v => v._id === vendorId);
    if (selectedVendor) {
      setNewVendor({
        vendorName: selectedVendor.vendorName,
        serviceCategory: selectedVendor.serviceCategory,
        email: selectedVendor.email || '',
        phone: selectedVendor.phone || '',
        contractAmount: selectedVendor.contractAmount?.toString() || '',
        contractDate: ''
      });
      setSelectedExistingVendor(vendorId);
    }
  };

  const handleConfirmVendor = async (vendorId: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          vendorId,
          eventId,
          status: 'confirmed',
        }),
      });

      if (!response.ok) throw new Error('Failed to confirm vendor');

      // Update local state
      const updatedVendors = vendors.map(v =>
        v._id === vendorId ? { ...v, status: 'confirmed' as const } : v
      );
      setVendors(updatedVendors);

      // Update event vendor secured count
      if (event) {
        setEvent({
          ...event,
          vendors: {
            ...event.vendors,
            secured: event.vendors.secured + 1
          }
        });
      }
    } catch (err) {
      console.error('Error confirming vendor:', err);
      setError('Failed to confirm vendor');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/vendors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ vendorId, eventId }),
      });

      if (!response.ok) throw new Error('Failed to delete vendor');

      setVendors(vendors.filter(v => v._id !== vendorId));

      // Update event vendor count
      if (event) {
        const deletedVendor = vendors.find(v => v._id === vendorId);
        const tallyChange = deletedVendor?.status === 'confirmed' ? -1 : 0;
        setEvent({
          ...event,
          vendors: {
            total: Math.max(0, event.vendors.total - 1),
            secured: Math.max(0, event.vendors.secured + tallyChange)
          }
        });
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('Failed to delete vendor');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-[#eebf43]" size={32} />
          <p className="text-[#71717a] font-medium">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20">
        <Link href="/admin/events" className="flex items-center gap-2 text-[#d4a017] mb-6 hover:text-[#b8860b]">
          <ArrowLeft size={16} />
          <span className="text-sm font-semibold">Back to Events</span>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-700 font-medium">{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  const confirmedVendors = vendors.filter(v => v.status === 'confirmed');
  const pendingVendors = vendors.filter(v => v.status === 'pending');
 

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      {/* Back Button */}
      <Link href={`/admin/events/${event._id}`} className="flex items-center gap-2 text-[#d4a017] mb-8 hover:text-[#b8860b] text-[11px] font-extrabold uppercase tracking-widest">
        <ArrowLeft size={14} />
        Back to {event.title}
      </Link>

      {/* Header */}
      <div className="mb-10">
        <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3">
          {event.title}
        </p>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Vendor <span className="text-[#eebf43] italic pr-2">Confirmation</span>
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-[#facc15] text-white rounded-xl font-extrabold text-[11px] uppercase tracking-widest hover:bg-[#eab308] active:scale-95 shadow-lg shadow-[#facc15]/20 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            Add Vendor
          </button>
        </div>

        <div className="pt-6 space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="bg-white rounded-2xl p-6 shadow-[0px_6px_18px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 relative z-10">Total Vendors</h3>
                <div className="min-h-[72px] flex items-center justify-between relative z-10">
                  <span className="text-[36px] font-black text-gray-900 tracking-tight">{vendors.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-[0px_6px_18px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 relative z-10">Confirmed Vendors</h3>
                <div className="min-h-[72px] flex items-center justify-between relative z-10">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[36px] font-black text-emerald-500 tracking-tight">{confirmedVendors.length}</span>
                    <span className="text-[13px] font-bold text-gray-400">/ {vendors.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-[0px_6px_18px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 relative z-10">Pending Vendors</h3>
                <div className="min-h-[72px] flex items-center justify-between relative z-10">
                  <span className="text-[36px] font-black text-amber-500 tracking-tight">{pendingVendors.length}</span>
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-3">
                  awaiting confirmation
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Vendors Grid */}
      <div className="space-y-8">
        {/* Confirmed Vendors Section */}
        {confirmedVendors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Check size={18} className="text-emerald-500" />
              <h2 className="text-[16px] font-extrabold text-[#1d1d1f] tracking-tight">Confirmed Vendors <span className="text-gray-400 text-[14px]">({confirmedVendors.length})</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedVendors.map(vendor => (
                <div key={vendor._id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 hover:shadow-[0px_2px_8px_rgba(0,0,0,0.04)] transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-[#1d1d1f] text-sm mb-1">{vendor.vendorName}</h3>
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">{vendor.serviceCategory}</p>
                    </div>
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  </div>
                  {vendor.email && <p className="text-[10px] text-gray-600 mb-2">{vendor.email}</p>}
                  {vendor.phone && <p className="text-[10px] text-gray-600 mb-3">{vendor.phone}</p>}
                  <button
                    onClick={() => handleDeleteVendor(vendor._id)}
                    className="w-full text-[9px] font-extrabold text-red-600 uppercase tracking-widest hover:text-red-700 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Vendors Section */}
        {pendingVendors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Clock size={18} className="text-amber-500" />
              <h2 className="text-[16px] font-extrabold text-[#1d1d1f] tracking-tight">Pending Vendors <span className="text-gray-400 text-[14px]">({pendingVendors.length})</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingVendors.map(vendor => (
                <div key={vendor._id} className="bg-white border border-amber-200 rounded-2xl p-5 hover:shadow-[0px_2px_8px_rgba(0,0,0,0.04)] transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-[#1d1d1f] text-sm mb-1">{vendor.vendorName}</h3>
                      <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">{vendor.serviceCategory}</p>
                    </div>
                    <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  </div>
                  {vendor.email && <p className="text-[10px] text-gray-600 mb-2">{vendor.email}</p>}
                  {vendor.phone && <p className="text-[10px] text-gray-600 mb-4">{vendor.phone}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmVendor(vendor._id)}
                      className="flex-1 text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor._id)}
                      className="flex-1 text-[9px] font-extrabold text-red-600 uppercase tracking-widest hover:text-red-700 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {vendors.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center hover:shadow-[0px_2px_8px_rgba(0,0,0,0.02)] transition-all">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-extrabold text-sm mb-1">No Vendors Yet</p>
            <p className="text-gray-500 text-[10px] mb-5">Start by adding your first vendor to this event</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#facc15] text-white rounded-xl font-extrabold text-[9px] uppercase tracking-widest hover:bg-[#eab308] active:scale-95 shadow-lg shadow-[#facc15]/20 transition-all"
            >
              <Plus size={12} strokeWidth={3} />
              Add First Vendor
            </button>
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-[520px] p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewVendor(createEmptyVendorForm());
                setSelectedExistingVendor('');
                setError('');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-[32px] font-black text-gray-900 tracking-tight mb-1">
                Add <span className="text-[#eebf43] italic">Vendor</span>
              </h2>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Select from available suppliers</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-[10px]">{error}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                  Choose Existing Vendor
                </label>
                <CustomSelect
                  options={availableVendors.map((v) => ({
                    value: v._id || v.vendorName,
                    label: v.vendorName,
                    sublabel: v.serviceCategory,
                  }))}
                  value={selectedExistingVendor}
                  onChange={handleSelectExistingVendor}
                  placeholder="Select from available vendors..."
                />
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter vendor name..."
                  value={newVendor.vendorName}
                  onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all"
                />
              </div>

              {/* Service Category */}
              <div>
                <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                  Service Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Catering, Photography, Venue..."
                  value={newVendor.serviceCategory}
                  onChange={(e) => setNewVendor({ ...newVendor, serviceCategory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Contract Amount */}
                <div>
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block mb-2">
                    Contract Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newVendor.contractAmount}
                    onChange={(e) => setNewVendor({ ...newVendor, contractAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15] focus:border-transparent transition-all"
                  />
                </div>

                {/* Contract Date */}
                <div>
                  <CustomDatePicker
                    label="Contract Date"
                    value={newVendor.contractDate}
                    onChange={(val) => setNewVendor({ ...newVendor, contractDate: val })}
                  direction="up"
                    />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-gray-100 pt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewVendor(createEmptyVendorForm());
                  setSelectedExistingVendor('');
                  setError('');
                }}
                className="flex-1 px-4 py-4 border-2 border-gray-200 text-gray-900 rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVendor}
                disabled={isSubmitting}
                className="flex-1 px-4 py-4 bg-[#facc15] text-white rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-[#eab308] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#facc15]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} />
                    Add Vendor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
