'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, MapPin, Users, ArrowRight, Eye, CheckCircle2, AlertCircle, X, Send, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type Inquiry = {
  id: string;
  client: string;
  email: string;
  eventType: string;
  needs: string;
  status: string;
  submitted: string;
  isArchived: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  'Under Review': 'text-blue-600 bg-blue-50 border-blue-100',
  'Awaiting Docs': 'text-[#dcae32] bg-[#f9f1d8] border-[#f4d98a]/50',
  'Confirmed': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'New': 'text-purple-600 bg-purple-50 border-purple-100',
  'Reviewing': 'text-orange-600 bg-orange-50 border-orange-100',
};

export default function InquiriesCoordinatorPage() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Alerts & Modals
  const [alert, setAlert] = useState<{ message: string, type: 'success'|'error' } | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean, title: string, desc: string, action: (() => void) | null, type: 'info'|'danger' }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });
  const [composeModal, setComposeModal] = useState<{ isOpen: boolean, to: string, client: string, subject: string, message: string, isSending: boolean }>({ isOpen: false, to: '', client: '', subject: '', message: '', isSending: false });

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const openModal = (title: string, desc: string, action: (() => void) | null = null, type: 'info' | 'danger' = 'info') => {
    setModal({ isOpen: true, title, desc, action, type });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

  const handleConfirm = () => {
    if (modal.action) modal.action();
    closeModal();
  };

  const handleViewDetails = (item: any) => {
    openModal(`Details: ${item.client}`, `Email: ${item.email}\nEvent: ${item.eventType}\nSubmitted: ${item.submitted}\n\nNeeds:\n${item.needs}`);
  };

  const handleReplyEmail = (item: any) => {
    setComposeModal({
      isOpen: true,
      client: item.client,
      to: item.email,
      subject: `Re: Inquiry for ${item.eventType}`,
      message: `Dear ${item.client},\n\nThank you so much for reaching out to Merry Story Productions. We are reviewing your inquiry for ${item.eventType} and would love to discuss further...\n\nWarmest regards,\nMerry Story Team`,
      isSending: false
    });
  };

  const handleSendEmail = () => {
    setComposeModal(prev => ({ ...prev, isSending: true }));
    
    // Simulate API call for now since backend will be connected later
    setTimeout(() => {
      setComposeModal(prev => ({ ...prev, isOpen: false, isSending: false }));
      showAlert('Email sent successfully via Merry Story dashboard!');
    }, 1500);
  };

  const fetchInquiries = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch('/api/inquiries', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      showAlert('Failed to load inquiries', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInquiries();
  }, [user]);

  const handleToggleArchive = async (id: string, currentlyArchived: boolean) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ isArchived: !currentlyArchived }),
      });
      
      if (response.ok) {
        setInquiries(prev => prev.map(inq => 
          inq.id === id ? { ...inq, isArchived: !currentlyArchived } : inq
        ));
        showAlert(currentlyArchived ? 'Inquiry restored successfully' : 'Inquiry archived successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      showAlert('Failed to update archive status', 'error');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
        setOpenDropdownId(null);
        showAlert(`Status updated to ${newStatus}`);
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      showAlert('Failed to update status', 'error');
    }
  };

  const filteredInquiries = inquiries.filter(inq => 
    activeTab === 'archived' ? inq.isArchived : !inq.isArchived
  );

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      
      {/* Toast Alert */}
      {alert && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-bottom-4 fade-in ${alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} flex items-center gap-3`}>
          {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-extrabold tracking-wide">{alert.message}</span>
        </div>
      )}

      {/* Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${modal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#fafafa] text-[#1d1d1f]'}`}>
                {modal.type === 'danger' ? <AlertCircle size={20} /> : <Eye size={20} />}
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={16} className="text-[#a1a1aa]" />
              </button>
            </div>
            <h3 className="text-2xl font-black text-[#1d1d1f] mb-3">{modal.title}</h3>
            <p className="text-sm text-[#71717a] font-medium leading-relaxed whitespace-pre-line mb-8">{modal.desc}</p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3.5 bg-[#fafafa] border border-gray-100 hover:bg-gray-100 text-[#71717a] text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
                Close
              </button>
              {modal.action && (
                <button onClick={handleConfirm} className={`flex-1 py-3.5 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors ${modal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1d1d1f] hover:bg-black'}`}>
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {composeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-black text-[#1d1d1f] flex items-center gap-2">
                <Send size={20} className="text-[#eebf43]" /> Compose Email
              </h3>
              <button 
                onClick={() => setComposeModal(prev => ({ ...prev, isOpen: false }))} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={composeModal.isSending}
              >
                <X size={16} className="text-[#a1a1aa]" />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-2">To</label>
                <input 
                  type="text" 
                  readOnly 
                  value={composeModal.to} 
                  className="w-full px-4 py-3 bg-[#fafafa] border border-gray-100 rounded-xl text-sm font-medium text-[#71717a] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-2">Subject</label>
                <input 
                  type="text" 
                  value={composeModal.subject} 
                  onChange={(e) => setComposeModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-2">Message</label>
                <textarea 
                  rows={8}
                  value={composeModal.message} 
                  onChange={(e) => setComposeModal(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setComposeModal(prev => ({ ...prev, isOpen: false }))} 
                disabled={composeModal.isSending}
                className="px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#71717a] text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendEmail}
                disabled={composeModal.isSending}
                className="flex-1 py-3.5 text-white bg-[#1d1d1f] hover:bg-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {composeModal.isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Lead Routing</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Client <span className="text-[#eebf43] italic pr-2">Inquiries</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Track and respond to incoming event requests directly via email communication pipelines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-200/60 pl-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'border-b-2 border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Active Inquiries
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'archived' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'border-b-2 border-transparent text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Archived 
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'archived' ? 'bg-[#1d1d1f] text-white' : 'bg-gray-100 text-gray-500'}`}>
            {inquiries.filter(i => i.isArchived).length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-[#a1a1aa]" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all"
            placeholder="Search events, clients, or pipelines..."
          />
        </div>
        <div className="relative w-full sm:w-56 shrink-0">
          <select className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all cursor-pointer">
            <option>All Classifications</option>
            <option>Weddings</option>
            <option>Corporate Events</option>
            <option>Debuts / Galas</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <ChevronDown size={14} className="text-[#a1a1aa]" />
          </div>
        </div>
      </div>

      {/* Content Area - Data Table */}
      <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm animate-in fade-in duration-500">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-gray-100">
                <th className="w-[20%] px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Client / Event</th>
                <th className="w-[40%] px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Client Needs</th>
                <th className="w-[15%] px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] text-center whitespace-nowrap">Submitted</th>
                <th className="w-[10%] px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] text-center whitespace-nowrap">Status</th>
                <th className="w-[15%] px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((item) => (
                <tr key={item.id} onClick={() => handleViewDetails(item)} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors group cursor-pointer">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors">{item.client}</span>
                      <span className="text-xs font-semibold text-[#a1a1aa] mt-0.5">{item.eventType}</span>
                    </div>
                  </td>
                  <td className="w-[40%] px-6 py-5 align-middle">
                    <div className="flex items-start gap-2 pr-4">
                      <p className="text-xs font-medium text-[#71717a] line-clamp-2 leading-relaxed" title={item.needs}>
                        {item.needs}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-xs font-bold text-[#a1a1aa] whitespace-nowrap">{formatDate(item.submitted)}</span>
                  </td>
                  <td className="px-6 py-5 align-middle relative">
                    <div className="flex justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === item.id ? null : item.id); }}
                        className={`w-[130px] px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border flex items-center justify-between gap-1.5 cursor-pointer hover:shadow-sm transition-all focus:outline-none ${STATUS_STYLES[item.status]}`}
                      >
                        <span className="truncate">{item.status}</span> <ChevronDown size={10} className="opacity-70 shrink-0" />
                      </button>
                    </div>
                    {openDropdownId === item.id && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute top-12 left-1/2 -translate-x-1/2 mt-1 w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {Object.keys(STATUS_STYLES).map(status => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(item.id, status);
                            }}
                            className={`w-full text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase transition-colors hover:bg-[#fafafa] ${item.status === status ? 'text-[#eebf43] bg-[#f9f1d8]/30' : 'text-[#71717a]'}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleReplyEmail(item); }} className="px-4 py-2 bg-[#eebf43] text-white hover:bg-[#dcae32] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm border border-[#dcae32] disabled:opacity-50 disabled:cursor-not-allowed" disabled={item.isArchived}>
                        <Send size={12} /> Email
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleArchive(item.id, item.isArchived); }}
                        className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm ${
                          item.isArchived 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white text-[#a1a1aa] border-gray-200 hover:bg-gray-50 hover:text-red-500'
                        }`}
                        title={item.isArchived ? "Restore Form" : "Archive Form"}
                      >
                        {item.isArchived ? (
                          <><ArchiveRestore size={12} /> Restore</>
                        ) : (
                          <><Archive size={12} /> Archive</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-gray-300 animate-spin" />
                      <p className="text-[#a1a1aa] text-sm font-bold">Loading inquiries...</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {!isLoading && filteredInquiries.length === 0 && activeTab === 'active' && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Search size={32} className="text-gray-300" />
                      <p className="text-[#a1a1aa] text-sm font-bold">No active inquiries in the pipeline.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filteredInquiries.length === 0 && activeTab === 'archived' && (
                 <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Archive size={32} className="text-gray-300" />
                      <p className="text-[#a1a1aa] text-sm font-bold">No archived inquiries.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">
            Showing All {inquiries.length} Records
          </span>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-200 text-[#71717a] hover:bg-white bg-[#fafafa] rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors shadow-sm">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-200 text-[#71717a] hover:bg-white bg-[#fafafa] rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors shadow-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
