'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, Plus, Search, Trash2, Edit, ChevronDown, CheckCircle2, AlertCircle, X, Mail, Phone, User, Users, Activity, Tag } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomInputs';

interface Vendor {
  _id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  events: number;
}

export default function VendorsView() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: 'Catering', contact: '', email: '', phone: '', status: 'Active'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const idToken = await user!.getIdToken();
      const response = await fetch('/api/vendors', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not load vendors.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (vendor: Vendor | null = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        category: vendor.category,
        contact: vendor.contact,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '', category: 'Catering', contact: '', email: '', phone: '', status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await user!.getIdToken();
      const url = editingVendor ? `/api/vendors/${editingVendor._id}` : '/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save vendor');
      
      showToast(editingVendor ? 'Vendor updated successfully!' : 'Vendor created successfully!');
      fetchVendors();
      handleCloseModal();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setVendorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return;
    try {
      const idToken = await user!.getIdToken();
      const response = await fetch(`/api/vendors/${vendorToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete vendor');
      
      showToast('Vendor deleted successfully!');
      fetchVendors();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vendor.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || vendor.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: 'All Categories', label: 'All Categories' },
    { value: 'Catering', label: 'Catering' },
    { value: 'Photography', label: 'Photography' },
    { value: 'Venue', label: 'Venue' },
    { value: 'Florist', label: 'Florist' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Equipment', label: 'Equipment' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  if (loading && vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-[#eebf43] animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Partners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
        <div className="flex-1 max-w-2xl relative w-full">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors (name, category, contact)..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 shrink-0 w-full sm:w-auto">
          <CustomSelect 
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
            className="min-w-[180px] flex-1 sm:flex-none"
          />

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-3 bg-[#facc15] hover:bg-[#eab308] text-white font-black py-3 px-6 rounded-[20px] text-[13px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#facc15]/20 active:scale-95 whitespace-nowrap h-[52px]"
          >
             <Plus className="w-5 h-5" strokeWidth={3} />
             Add Vendor
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Partners', value: vendors.length.toString(), icon: Users, color: '#facc15', bg: 'bg-yellow-50/50', border: 'border-yellow-100/50' },
          { label: 'Active Roster', value: vendors.filter(v => v.status === 'Active').length.toString(), icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
          { label: 'Quality Reviews', value: vendors.filter(v => v.status === 'Under Review').length.toString(), icon: Activity, color: '#f59e0b', bg: 'bg-amber-50/50', border: 'border-amber-100/50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-[0px_8px_30px_rgba(0,0,0,0.02)] flex flex-col gap-6 group hover:border-gray-200 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.border} transition-transform group-hover:scale-110 duration-300`}>
                 <stat.icon style={{ color: stat.color }} size={24} />
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-gray-200"></div>
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#1d1d1f] tracking-tighter">{stat.value}</span>
                <span className="text-[12px] font-black text-gray-300 uppercase tracking-widest">Units</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Table List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-5 px-8 font-extrabold text-[10px] text-gray-400 uppercase tracking-[0.15em]">Vendor Details</th>
                <th className="py-5 px-8 font-extrabold text-[10px] text-gray-400 uppercase tracking-[0.15em]">Contact Info</th>
                <th className="py-5 px-8 font-extrabold text-[10px] text-gray-400 uppercase tracking-[0.15em] text-center">Rating</th>
                <th className="py-5 px-8 font-extrabold text-[10px] text-gray-400 uppercase tracking-[0.15em] text-center">Status</th>
                <th className="py-5 px-8 font-extrabold text-[10px] text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-20 text-center text-gray-400 font-bold text-[13px] uppercase tracking-widest">No vendors found</td>
                 </tr>
              ) : filteredVendors.map((vendor, i) => (
                <tr key={vendor._id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#facc15]/10 text-[#d4a017] flex items-center justify-center font-black text-lg shrink-0 border border-[#facc15]/20">
                        {String(vendor.name || '').charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-[15px] text-gray-900 leading-tight">{vendor.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-[#d4a017] bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 uppercase tracking-wider">{vendor.category}</span>
                          <span className="text-[11px] font-bold text-gray-400">• {vendor.events || 0} Productions</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-5 px-8 align-middle">
                    <div className="text-[14px] font-black text-gray-900 mb-1">{vendor.contact}</div>
                    <div className="text-[11px] font-bold text-gray-500 flex flex-col gap-1">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#d4a017]" /> {vendor.email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#d4a017]" /> {vendor.phone}</span>
                    </div>
                  </td>
                  
                  <td className="py-5 px-8 text-center align-middle">
                    <div className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                      <svg className="w-4 h-4 text-[#facc15]" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="font-black text-[13px] text-gray-900">{vendor.rating ? vendor.rating.toFixed(1) : 'NEW'}</span>
                    </div>
                  </td>
                  
                  <td className="py-5 px-8 text-center align-middle">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                      vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      vendor.status === 'Under Review' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  
                  <td className="py-5 px-8 text-right align-middle">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteClick(vendor._id)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 flex items-center justify-center transition-all"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenModal(vendor)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-[#d4a017] hover:border-[#d4a017] hover:shadow-lg hover:shadow-yellow-500/5 flex items-center justify-center transition-all"><Edit className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add/Edit */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {editingVendor ? 'Edit Partner Profile' : 'Register New Partner'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Vendor Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-black text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>
                
                <CustomSelect 
                  label="Service Category"
                  value={formData.category}
                  onChange={(val) => setFormData({...formData, category: val})}
                  options={categoryOptions.filter(o => o.value !== 'All Categories')}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Contact Person</label>
                  <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-black text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>

                <CustomSelect 
                  label="Partnership Status"
                  value={formData.status}
                  onChange={(val) => setFormData({...formData, status: val})}
                  options={statusOptions}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Official Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-black text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-black text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-10 py-3.5 bg-[#201A03] hover:bg-black text-[#facc15] text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingVendor ? 'Update Profile' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Confirm Removal</h2>
              <p className="text-[14px] text-gray-500 font-bold leading-relaxed">This will permanently remove the partner from your active portfolio records.</p>
            </div>
            <div className="p-6 bg-gray-50 flex gap-4 border-t border-gray-100">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all">Remove</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toast && createPortal(
        <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 px-8 py-5 rounded-3xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <span className="text-[14px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
}
