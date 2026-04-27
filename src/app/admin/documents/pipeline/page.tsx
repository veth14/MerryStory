'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, ExternalLink, Calendar, Users, ChevronLeft, MoreVertical, Edit, Send, CheckCircle2, X, Info, FileText, Upload, Loader } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Contract {
  _id: string;
  name: string;
  type: string;
  value: string;
  lastUpdated: string;
  status: 'drafting' | 'sent' | 'signed';
  platform?: string;
}

interface Pipeline {
  drafting: Contract[];
  sent: Contract[];
  signed: Contract[];
}

export default function PipelinePage() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [pipeline, setPipeline] = useState<Pipeline>({ drafting: [], sent: [], signed: [] });
  const [events, setEvents] = useState<Array<{ _id: string; title: string }>>([]);
  const [contractForm, setContractForm] = useState({
    name: '',
    eventId: '',
    type: 'Service Agreement',
    value: '',
    platform: 'DocuSign',
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;

    const fetchPipeline = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();

        const [pipelineRes, eventsRes] = await Promise.all([
          fetch('/api/admin/contracts/pipeline', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
        ]);

        if (pipelineRes.ok) {
          const pipelineData = await pipelineRes.json();
          setPipeline(pipelineData);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, [hydrated, user]);

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const openContractPdf = async (id: string, download = false) => {
    if (!user) {
      triggerModal('Authentication Required', 'Please sign in again before viewing or downloading PDFs.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/contracts/${id}/pdf${download ? '?download=1' : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load PDF');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (download) {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `contract-${id}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const newWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        URL.revokeObjectURL(objectUrl);
        throw new Error('Popup blocked while opening PDF preview.');
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      console.error('Failed to open contract PDF:', error);
      triggerModal('PDF Error', (error as Error).message || 'Failed to load PDF.');
    }
  };

  const handleCreateContract = async () => {
    if (!user || !contractForm.name || !contractForm.eventId || !contractForm.value) return;

    try {
      setSubmittingContract(true);
      const token = await user.getIdToken();
      const selectedEvent = events.find((event) => event._id === contractForm.eventId);
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: contractForm.name,
          eventId: contractForm.eventId,
          eventName: selectedEvent?.title || 'Unassigned Event',
          type: contractForm.type,
          value: contractForm.value,
          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          platform: contractForm.platform,
          status: 'drafting',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create contract');
      }

      setCreateContractOpen(false);
      setContractForm({
        name: '',
        eventId: '',
        type: 'Service Agreement',
        value: '',
        platform: 'DocuSign',
      });
      triggerModal('Contract Drafted', 'The new contract has been added to the drafting pipeline.');
      const pipelineRes = await fetch('/api/admin/contracts/pipeline', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        setPipeline(pipelineData);
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
      triggerModal('Contract Error', (error as Error).message || 'Failed to create contract.');
    } finally {
      setSubmittingContract(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center py-20">
        <Loader className="animate-spin text-[#eebf43] mr-3" size={32} />
        <p className="text-[#71717a]">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 animate-in fade-in duration-500 relative">
      {/* Breadcrumb / Back Navigation */}
      <Link href="/admin/documents" className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4 pt-2">
        <ChevronLeft size={16} strokeWidth={2.5} /> BACK TO CONTRACTS
      </Link>

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Kanban Tracker</span>
          </p>
          <h1 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] tracking-tight">
            Contract <span className="text-[#eebf43] italic pr-2">Pipeline</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Monitor the lifecycle of all event agreements. Track drafting progress, signature requests, and finalized executions in real-time.
          </p>
        </div>
        <button onClick={() => setCreateContractOpen(true)} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-all rounded-xl shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-[#eebf43]/20 shrink-0">
          <Plus size={14} className="text-white" /> Create Contract
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Column 1: DRAFTING */}
        <div className="flex flex-col h-full bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[12px] font-black text-gray-900 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span> Drafting
            </h2>
            <span className="bg-white text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200">
              {pipeline.drafting.length}
            </span>
          </div>
          
          <div className="space-y-4">
            {pipeline.drafting.map(contract => (
              <div key={contract._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-extrabold text-[#eebf43] bg-[#fef9ec] px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                  <button className="text-gray-400 hover:text-gray-900"><MoreVertical size={16} /></button>
                </div>
                <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight group-hover:text-[#eebf43] transition-colors">{contract.name}</h3>
                <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                
                <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                  <div className="text-sm font-black text-[#1d1d1f]">{contract.value}</div>
                  <div className="flex gap-2">
                    <button onClick={() => openContractPdf(contract._id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title="View PDF">
                       <Edit size={14} />
                    </button>
                    <button onClick={() => openContractPdf(contract._id, true)} className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white hover:bg-black transition-colors" title="Download PDF">
                       <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: SENT FOR SIGNATURE */}
        <div className="flex flex-col h-full bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[12px] font-black text-[#eebf43] tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#eebf43] animate-pulse"></span> Pending Signature
            </h2>
            <span className="bg-white text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200">
              {pipeline.sent.length}
            </span>
          </div>
          
          <div className="space-y-4">
             {pipeline.sent.map(contract => (
              <div key={contract._id} className="bg-white p-5 rounded-2xl border border-[#eebf43]/20 shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-grab active:cursor-grabbing">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-extrabold text-[#eebf43] bg-[#fef9ec] px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{contract.lastUpdated}</span>
                </div>
                <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight group-hover:text-[#eebf43] transition-colors">{contract.name}</h3>
                <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                
                <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                  <div className="text-sm font-black text-[#1d1d1f]">{contract.value}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                    {contract.platform}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: SIGNED & CONFIRMED */}
        <div className="flex flex-col h-full bg-emerald-50/30 rounded-3xl p-4 border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[12px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Signed & Reconciled
            </h2>
            <span className="bg-white text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
              {pipeline.signed.length}
            </span>
          </div>
          
          <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
            {pipeline.signed.map(contract => (
              <div key={contract._id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight">{contract.name}</h3>
                <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                
                <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                  <div className="text-sm font-black text-[#1d1d1f]">{contract.value}</div>
                  <button onClick={() => openContractPdf(contract._id)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1">
                    VIEW PDF <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => triggerModal('Load More', 'Fetching older executed agreements...')} className="mt-6 py-3 w-full border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-50/50 transition-colors">
            Load More (9)
          </button>
        </div>

      </div>

      {/* Custom Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mb-6">
              <Info size={24} className="text-[#eebf43]" />
            </div>
            <h3 className="text-xl font-black text-[#1d1d1f] mb-2 tracking-tight">{modal.title}</h3>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">{modal.message}</p>
            <button 
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full py-3.5 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-md"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {createContractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setCreateContractOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center">
                <FileText size={18} className="text-[#eebf43]" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight">New Contract</h3>
            </div>
            
            <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">Enter the client's information and attach the drafted agreement file.</p>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract Title</label>
                <input value={contractForm.name} onChange={(event) => setContractForm((current) => ({ ...current, name: event.target.value }))} type="text" placeholder="e.g. Maria Santos Contract" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                <input value={contractForm.type} onChange={(event) => setContractForm((current) => ({ ...current, type: event.target.value }))} type="text" placeholder="e.g. Floral Services" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Associated Event</label>
                <select value={contractForm.eventId} onChange={(event) => setContractForm((current) => ({ ...current, eventId: event.target.value }))} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all">
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>{event.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Value</label>
                <input value={contractForm.value} onChange={(event) => setContractForm((current) => ({ ...current, value: event.target.value }))} type="text" placeholder="e.g. ₱45,000" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract File</label>
                <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/50 hover:border-[#eebf43]/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Upload size={16} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[12px] font-black text-[#1d1d1f]">Click to upload or drag & drop</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">PDF, DOCX (Max 10MB)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setCreateContractOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateContract}
                disabled={submittingContract}
                className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20 disabled:opacity-70"
              >
                {submittingContract ? 'Saving...' : 'Create Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
