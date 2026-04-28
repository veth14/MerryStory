'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ArrowRight, Eye, CheckCircle2, AlertCircle, X, Send, Loader2, Archive, ArchiveRestore } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('All Classifications');

  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean, title: string, desc: string, action: (() => void) | null, type: 'info' | 'danger' }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });
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
        headers: { Authorization: `Bearer ${idToken}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ isArchived: !currentlyArchived }),
      });
      if (response.ok) {
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, isArchived: !currentlyArchived } : inq));
        showAlert(currentlyArchived ? 'Inquiry restored successfully' : 'Inquiry archived successfully');
      } else throw new Error('Failed to update');
    } catch {
      showAlert('Failed to update archive status', 'error');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
        setOpenDropdownId(null);
        showAlert(`Status updated to ${newStatus}`);
      } else throw new Error('Failed to update');
    } catch {
      showAlert('Failed to update status', 'error');
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesArchive = activeTab === 'archived' ? inq.isArchived : !inq.isArchived;
    const matchesClassification = classificationFilter === 'All Classifications' || inq.eventType === classificationFilter;
    const matchesSearch = !searchQuery ||
      inq.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.needs.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArchive && matchesClassification && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoString)).toUpperCase();
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative animate-in fade-in duration-500">

        {/* Toast Alert */}
        {alert && (
          <div className={`fixed bottom-8 right-8 z-50 px-8 py-5 rounded-[20px] shadow-2xl border animate-in slide-in-from-bottom-5 fade-in ${alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} flex items-center gap-4`}>
            {alert.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="text-[14px] font-black uppercase tracking-widest">{alert.message}</span>
          </div>
        )}

        {/* Header Section — matches admin exactly */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pt-2">
          <div>
            <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
              Workspace <ArrowRight size={10} className="text-[#eebf43]" /> <span className="text-[#1d1d1f]">Lead Routing</span>
            </p>
            <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight leading-none">
              Client <span className="text-[#eebf43] italic pr-2">Inquiries</span>
            </h1>
            <p className="text-[#71717a] text-[15px] mt-6 max-w-xl leading-relaxed font-medium">
              Track and respond to incoming event requests. Monitor client needs and status updates directly from the pipeline.
            </p>
          </div>
        </div>

        {/* Tabs — matches admin exactly */}
        <div className="flex gap-10 mb-10 border-b border-gray-200/60">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 text-xs font-black tracking-[0.15em] uppercase transition-all relative ${activeTab === 'active' ? 'text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
          >
            Active Pipeline
            {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#eebf43] rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-4 text-xs font-black tracking-[0.15em] uppercase transition-all relative ${activeTab === 'archived' ? 'text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
          >
            Archive Registry
            <span className="ml-3 px-2.5 py-0.5 rounded-lg text-[10px] bg-gray-100 text-gray-500 font-black">
              {inquiries.filter(i => i.isArchived).length}
            </span>
            {activeTab === 'archived' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#eebf43] rounded-full" />}
          </button>
        </div>

        {/* Filters — matches admin exactly */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 items-end">
          <div className="relative flex-1 w-full lg:w-auto">
            <Search size={18} className="text-[#a1a1aa] absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 shadow-sm rounded-2xl text-sm font-bold text-[#1d1d1f] placeholder-[#a1a1aa] focus:outline-none focus:border-[#eebf43] focus:ring-4 focus:ring-[#eebf43]/5 transition-all"
              placeholder="Search clients, events, or specific needs..."
            />
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <select
              value={classificationFilter}
              onChange={e => setClassificationFilter(e.target.value)}
              className="w-full appearance-none pl-5 pr-10 py-4 bg-white border-2 border-gray-100 shadow-sm rounded-2xl text-sm font-bold text-[#71717a] focus:outline-none focus:border-[#eebf43] transition-all cursor-pointer"
            >
              <option>All Classifications</option>
              <option>Weddings</option>
              <option>Corporate Events</option>
              <option>Debuts / Galas</option>
            </select>
            <ChevronDown size={14} className="text-[#a1a1aa] absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Data Grid — matches admin exactly */}
        <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-[#a1a1aa]">Form Identity</th>
                  <th className="px-8 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-[#a1a1aa]">Client Briefing</th>
                  <th className="px-8 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-[#a1a1aa] text-center">Receipt Date</th>
                  <th className="px-8 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-[#a1a1aa] text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-[#a1a1aa] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInquiries.map((item) => (
                  <tr key={item.id} onClick={() => handleViewDetails(item)} className="group hover:bg-[#fafafa]/50 transition-colors cursor-pointer">
                    <td className="px-8 py-6 align-middle">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors">{item.client}</span>
                        <span className="text-[11px] font-black text-[#a1a1aa] uppercase tracking-wider mt-1">{item.eventType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 align-middle">
                      <p className="text-[13px] font-medium text-[#71717a] line-clamp-1 leading-relaxed max-w-sm" title={item.needs}>
                        {item.needs}
                      </p>
                    </td>
                    <td className="px-8 py-6 align-middle text-center">
                      <span className="text-[12px] font-black text-[#a1a1aa] uppercase">{formatDate(item.submitted)}</span>
                    </td>
                    <td className="px-8 py-6 align-middle relative">
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === item.id ? null : item.id); }}
                          className={`min-w-[140px] px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border-2 flex items-center justify-between gap-3 transition-all ${STATUS_STYLES[item.status] || 'border-gray-100 text-gray-400 bg-gray-50'}`}
                        >
                          <span className="truncate">{item.status}</span> <ChevronDown size={12} className="opacity-70 shrink-0" />
                        </button>
                      </div>
                      {openDropdownId === item.id && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute top-16 left-1/2 -translate-x-1/2 mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] py-2 overflow-hidden animate-in zoom-in-95 duration-200">
                          {Object.keys(STATUS_STYLES).map(status => (
                            <button
                              key={status}
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, status); }}
                              className={`w-full text-left px-5 py-3 text-[10px] font-black tracking-[0.1em] uppercase transition-colors hover:bg-gray-50 ${item.status === status ? 'text-[#eebf43] bg-yellow-50/30' : 'text-[#71717a]'}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 align-middle">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReplyEmail(item); }}
                          disabled={item.isArchived}
                          className="px-4 py-2.5 bg-[#facc15] text-gray-900 hover:bg-[#eab308] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm border border-[#facc15] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send size={12} /> Contact
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleArchive(item.id, item.isArchived); }}
                          className={`p-2.5 border-2 rounded-xl transition-all ${item.isArchived ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-white text-gray-300 border-gray-100 hover:text-red-500 hover:border-red-100'}`}
                        >
                          {item.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="text-[#eebf43] animate-spin" />
                        <p className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">Accessing Pipeline...</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && filteredInquiries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">No matching inquiries found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal — Details (matches admin) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1d1d1f]/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-lg p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#1d1d1f]">
                <Eye size={24} />
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                <X size={20} className="text-[#a1a1aa]" />
              </button>
            </div>
            <h3 className="text-3xl font-black text-[#1d1d1f] mb-4 tracking-tight">{modal.title}</h3>
            <div className="bg-gray-50 p-6 rounded-2xl mb-10">
              <p className="text-[14px] text-[#71717a] font-medium leading-relaxed whitespace-pre-line">{modal.desc}</p>
            </div>
            <button onClick={closeModal} className="w-full py-4 bg-[#1d1d1f] hover:bg-black text-white text-[12px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl shadow-black/10">
              Close Inspection
            </button>
          </div>
        </div>
      )}

      {/* Modal — Compose (matches admin) */}
      {composeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1d1d1f]/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-3xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
              <h3 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-3">
                <Send size={24} className="text-[#eebf43]" /> Compose Official Response
              </h3>
              <button onClick={() => setComposeModal(prev => ({ ...prev, isOpen: false }))} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                <X size={20} className="text-[#a1a1aa]" />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2 ml-1">Recipient</label>
                  <div className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-500">{composeModal.to}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2 ml-1">Subject Line</label>
                  <input
                    type="text"
                    value={composeModal.subject}
                    onChange={(e) => setComposeModal(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-[#1d1d1f] focus:border-[#eebf43] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2 ml-1">Message Body</label>
                <textarea
                  rows={10}
                  value={composeModal.message}
                  onChange={(e) => setComposeModal(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[24px] text-sm font-medium text-[#1d1d1f] focus:border-[#eebf43] outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setComposeModal(prev => ({ ...prev, isOpen: false }))}
                className="px-8 py-4 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSendEmail}
                disabled={composeModal.isSending}
                className="flex-1 py-4 text-white bg-[#1d1d1f] hover:bg-black text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
              >
                {composeModal.isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {composeModal.isSending ? 'Transmitting...' : 'Dispatch Email Communication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
