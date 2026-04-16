'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const INITIAL_VENDORS = [
  { id: 1, name: 'Taste of Manila Catering', category: 'Catering', rating: 4.8, status: 'Active', contact: 'Maria Santos', email: 'hello@tasteofmanila.com', phone: '+63 917 123 4567', events: 12 },
  { id: 2, name: 'Snap & Shoot Studios', category: 'Photography', rating: 4.9, status: 'Active', contact: 'John Doe', email: 'john@snapshoot.ph', phone: '+63 918 234 5678', events: 8 },
  { id: 3, name: 'Lumina Floral Design', category: 'Florist', rating: 4.2, status: 'Under Review', contact: 'Sarah Lim', email: 'sarah@luminaflora.com', phone: '+63 919 345 6789', events: 3 },
  { id: 4, name: 'Grand Ballroom SMX', category: 'Venue', rating: 5.0, status: 'Active', contact: 'Anna Lee', email: 'bookings@smx.com', phone: '+63 920 456 7890', events: 24 },
  { id: 5, name: 'The Harmony Strings', category: 'Entertainment', rating: 4.6, status: 'Active', contact: 'Mark Reyes', email: 'music@harmonystrings.ph', phone: '+63 921 567 8901', events: 5 },
  { id: 6, name: 'Lux Event Rentals', category: 'Equipment', rating: 4.0, status: 'Inactive', contact: 'Paul Chua', email: 'rentals@luxevents.ph', phone: '+63 922 678 9012', events: 1 },
];

export default function VendorsView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [formData, setFormData] = useState({
    name: '', category: 'Catering', contact: '', email: '', phone: '', status: 'Active'
  });

  const handleOpenModal = (vendor: any = null) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      showToast('Vendor updated successfully!', 'success');
      setVendors(vendors.map(v => v.id === editingVendor.id ? { ...v, ...formData } : v));
    } else {
      const newVendor = {
        id: Math.max(...vendors.map(v => v.id), 0) + 1,
        ...formData,
        rating: 0,
        events: 0,
      };
      setVendors([...vendors, newVendor]);
    }
    handleCloseModal();
  };

  const handleDeleteClick = (id: number) => {
    setVendorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (vendorToDelete !== null) {
      showToast('Vendor deleted successfully!', 'success');
      setVendors(vendors.filter(v => v.id !== vendorToDelete));
    }
    setIsDeleteModalOpen(false);
    setVendorToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setVendorToDelete(null);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vendor.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || vendor.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-2xl relative">
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors (name, category, contact)..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-100 text-gray-700 text-[14px] font-bold rounded-xl pl-5 pr-12 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] cursor-pointer min-w-[150px]"
            >
              <option>All Categories</option>
              <option>Catering</option>
              <option>Photography</option>
              <option>Venue</option>
              <option>Florist</option>
              <option>Entertainment</option>
              <option>Equipment</option>
            </select>
            <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-bold py-3 px-6 rounded-xl text-[14px] transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 whitespace-nowrap"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
             </svg>
             Add Vendor
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vendors', value: vendors.length.toString(), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Contracts', value: vendors.filter(v => v.status === 'Active').length.toString(), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Pending Reviews', value: vendors.filter(v => v.status === 'Under Review').length.toString(), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { label: 'Total Paid (YTD)', value: '₱1.2M', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-purple-500', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <div>
              <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Table List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="py-4 px-6 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Vendor Details</th>
                <th className="py-4 px-6 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Contact Info</th>
                <th className="py-4 px-6 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Rating</th>
                <th className="py-4 px-6 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">No vendors found matching your criteria.</td>
                 </tr>
              ) : filteredVendors.map((vendor, i) => (
                <tr key={vendor.id} className={`group ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50/80 transition-colors`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                        {vendor.name.charAt(0)}
                      </div>
                      
                      <div>
                        <div className="font-extrabold text-[15px] text-gray-900 leading-tight">{vendor.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{vendor.category}</span>
                          <span className="text-[12px] font-medium text-gray-400">• {vendor.events} past events</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 align-middle">
                    <div className="text-[14px] font-bold text-gray-900 mb-1">{vendor.contact}</div>
                    <div className="text-[12px] font-medium text-gray-500 flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 line-clamp-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> 
                        {vendor.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> 
                        {vendor.phone}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 text-center align-middle">
                    <div className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                      <svg className="w-4 h-4 text-[#facc15]" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="font-extrabold text-[13px] text-gray-900">{vendor.rating ? vendor.rating.toFixed(1) : 'NEW'}</span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 text-center align-middle">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      vendor.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-right align-middle">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {/* Delete Action (Optional replacing the eye view if view isn't a separate page, mapping it to delete or keeping view generic) */}
                      <button 
                        onClick={() => handleDeleteClick(vendor.id)}
                        title="Delete Vendor"
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <button 
                        onClick={() => handleOpenModal(vendor)}
                        title="Edit Vendor"
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[#d4a017] hover:border-[#d4a017] hover:bg-yellow-50 flex items-center justify-center transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal Overlay */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-extrabold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Vendor Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all" placeholder="Enter vendor name..." />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all">
                    <option>Catering</option>
                    <option>Photography</option>
                    <option>Venue</option>
                    <option>Florist</option>
                    <option>Entertainment</option>
                    <option>Equipment</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Contact Person</label>
                  <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all" placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all">
                    <option>Active</option>
                    <option>Under Review</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all" placeholder="hello@vendor.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700">Phone Number</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium transition-all" placeholder="+63 9XX XXX XXXX" />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl font-bold text-[14px] text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-[14px] bg-[#facc15] hover:bg-[#eab308] text-gray-900 shadow-sm transition-all hover:-translate-y-0.5">
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {mounted && isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Delete Vendor</h2>
              <p className="text-[14px] text-gray-500 font-medium">Are you sure you want to delete this vendor? This action cannot be undone.</p>
            </div>
            <div className="p-5 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[14px] text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[14px] text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {mounted && toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-white px-5 py-4 rounded-xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div>
            <h4 className="text-[14px] font-extrabold text-gray-900">
              {toast.type === 'success' ? 'Success!' : 'Error!'}
            </h4>
            <p className="text-[13px] font-medium text-gray-500">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}
