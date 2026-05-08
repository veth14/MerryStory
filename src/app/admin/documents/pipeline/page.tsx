'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, ExternalLink, ChevronLeft, Edit, Send, CheckCircle2, X, Info, FileText, Upload, Loader, Download, Maximize2, Search } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Contract {
  _id: string;
  name: string;
  type: string;
  value: string;
  lastUpdated: string;
  status: 'drafting' | 'sent' | 'signed';
  platform?: string;
  eventId?: string;
  eventName?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  recipientEmail?: string;
  recipientName?: string;
  reviewLink?: string;
  signedByName?: string;
  signatureDataUrl?: string;
  signedFileUrl?: string | null;
  signedFileName?: string | null;
  signedFileType?: string | null;
}

interface Pipeline {
  drafting: Contract[];
  sent: Contract[];
  signed: Contract[];
}

const PESO_SYMBOL = '\u20B1';

function formatContractValue(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return `${PESO_SYMBOL}0`;
  return trimmed.startsWith(PESO_SYMBOL) ? trimmed : `${PESO_SYMBOL}${trimmed}`;
}

function formatDate(dateString: string) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildPdfPreviewUrl(fileUrl: string) {
  return `${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}

function resolvePreviewConfig(fileUrl: string | null, fileType?: string | null, fileName?: string | null) {
  if (!fileUrl) return { previewUrl: null, previewMode: 'iframe' as const };

  const normalizedType = String(fileType || '').toLowerCase();
  const normalizedName = String(fileName || '').toLowerCase();
  const isPdf = normalizedType.includes('pdf') || normalizedName.endsWith('.pdf');
  const isOfficeDocument =
    normalizedType.includes('wordprocessingml') ||
    normalizedType.includes('msword') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx');

  if (isOfficeDocument) {
    return { previewUrl: fileUrl, previewMode: 'external' as const };
  }

  if (isPdf) {
    return { previewUrl: buildPdfPreviewUrl(fileUrl), previewMode: 'iframe' as const };
  }

  return { previewUrl: fileUrl, previewMode: 'iframe' as const };
}

function openLinkInNewTab(url: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

interface PreviewModalData {
  isOpen: boolean;
  id: string | null;
  name: string;
  type: string;
  event: string;
  status: string;
  value?: string;
  date?: string;
  fileUrl: string | null;
  fileName?: string;
  previewUrl?: string | null;
  previewMode?: 'iframe' | 'external';
}

export default function PipelinePage() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [pipeline, setPipeline] = useState<Pipeline>({ drafting: [], sent: [], signed: [] });
  const [events, setEvents] = useState<Array<{ _id: string; title: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Unified pagination state - shows all contracts across columns
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [previewModal, setPreviewModal] = useState<PreviewModalData>({
    isOpen: false,
    id: null,
    name: '',
    type: '',
    event: '',
    status: '',
    value: '',
    date: '',
    fileUrl: null,
    fileName: '',
    previewUrl: null,
    previewMode: 'iframe',
  });
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState({
    name: '',
    eventId: '',
    type: 'Service Agreement',
    value: '',
    platform: 'DocuSign',
    recipientName: '',
    recipientEmail: '',
    contractFile: null as File | null,
    existingFileName: '',
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  const resetContractForm = () => {
    setContractForm({
      name: '',
      eventId: '',
      type: 'Service Agreement',
      value: '',
      platform: 'DocuSign',
      recipientName: '',
      recipientEmail: '',
      contractFile: null,
      existingFileName: '',
    });
  };

  const closeContractModal = () => {
    setCreateContractOpen(false);
    setEditingContractId(null);
    resetContractForm();
  };

  const fetchPipeline = async (tokenOverride?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = tokenOverride || await user.getIdToken();

      const [pipelineRes, eventsRes] = await Promise.all([
        fetch('/api/admin/contracts/pipeline', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/events', {
          headers: { Authorization: `Bearer ${token}` }
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

  useEffect(() => {
    if (!hydrated || !user) return;
    void fetchPipeline();
  }, [hydrated, user]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
        setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
        triggerModal('PDF Downloaded', 'The contract has been downloaded successfully.');
        return;
      }

      return objectUrl;
    } catch (error) {
      console.error('Failed to open contract PDF:', error);
      triggerModal('PDF Error', (error as Error).message || 'Failed to load PDF.');
      return null;
    }
  };

  const handleEditDrafting = async (id: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/contracts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load contract details');
      }

      const contract = await response.json();
      setEditingContractId(id);
      setCreateContractOpen(true);
      setContractForm({
        name: contract.name || '',
        eventId: contract.eventId || '',
        type: contract.type || 'Service Agreement',
        value: contract.value || '',
        platform: contract.platform || 'DocuSign',
        recipientName: contract.recipientName || '',
        recipientEmail: contract.recipientEmail || '',
        contractFile: null,
        existingFileName: contract.fileName || '',
      });
    } catch (error) {
      console.error('Failed to load draft contract:', error);
      triggerModal('Edit Error', (error as Error).message || 'Failed to load contract details.');
    }
  };

  const handleCreateContract = async () => {
    if (!user) return;

    if (!contractForm.name || !contractForm.eventId || !contractForm.value || !contractForm.recipientEmail) {
      triggerModal('Missing Details', 'Please complete the contract title, event, value, and recipient email before saving.');
      return;
    }

    try {
      setSubmittingContract(true);
      const token = await user.getIdToken();
      const selectedEvent = events.find((event) => event._id === contractForm.eventId);
      const payload = new FormData();
      payload.append('name', contractForm.name);
      payload.append('eventId', contractForm.eventId);
      payload.append('eventName', selectedEvent?.title || 'Unassigned Event');
      payload.append('type', contractForm.type);
      payload.append('value', formatContractValue(contractForm.value));
      payload.append('platform', contractForm.platform);
      payload.append('recipientName', contractForm.recipientName);
      payload.append('recipientEmail', contractForm.recipientEmail);
      payload.append('status', 'drafting');
      if (contractForm.contractFile) {
        payload.append('contractFile', contractForm.contractFile);
      }

      const response = await fetch(editingContractId ? `/api/admin/contracts/${editingContractId}` : '/api/admin/contracts', {
        method: editingContractId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create contract');
      }

      closeContractModal();
      triggerModal(
        editingContractId ? 'Contract Updated' : 'Contract Drafted',
        editingContractId
          ? 'The drafting contract has been updated successfully.'
          : 'The new contract has been added to the drafting pipeline.'
      );
      await fetchPipeline(token);
    } catch (error) {
      console.error('Failed to create contract:', error);
      triggerModal('Contract Error', (error as Error).message || 'Failed to save contract.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const openPreviewModal = async (contract: Contract) => {
    const directFileUrl = contract.signedFileUrl || contract.fileUrl || null;
    const directFileName = contract.signedFileName || contract.fileName || contract.name;
    const directFileType = contract.signedFileType || contract.fileType || contract.type;

    setPreviewError(null);

    if (directFileUrl) {
      const previewConfig = resolvePreviewConfig(directFileUrl, directFileType, directFileName);
      setIsLoadingPreview(false);
      setPreviewModal({
        isOpen: true,
        id: contract._id,
        name: contract.name,
        type: directFileType,
        event: contract.eventName || 'N/A',
        status: contract.status,
        value: contract.value,
        date: contract.lastUpdated,
        fileUrl: directFileUrl,
        fileName: directFileName,
        previewUrl: previewConfig.previewUrl,
        previewMode: previewConfig.previewMode,
      });
      return;
    }

    setIsLoadingPreview(true);
    setPreviewModal({
      isOpen: true,
      id: contract._id,
      name: contract.name,
      type: directFileType,
      event: contract.eventName || 'N/A',
      status: contract.status,
      value: contract.value,
      date: contract.lastUpdated,
      fileUrl: null,
      fileName: directFileName,
      previewUrl: null,
      previewMode: 'iframe',
    });

    try {
      const fileUrl = await openContractPdf(contract._id, false);
      if (fileUrl) {
        const previewConfig = resolvePreviewConfig(fileUrl, directFileType, directFileName);
        setPreviewModal({
          isOpen: true,
          id: contract._id,
          name: contract.name,
          type: directFileType,
          event: contract.eventName || 'N/A',
          status: contract.status,
          value: contract.value,
          date: contract.lastUpdated,
          fileUrl,
          fileName: directFileName,
          previewUrl: previewConfig.previewUrl,
          previewMode: previewConfig.previewMode,
        });
      } else {
        setPreviewError('Failed to load PDF preview');
      }
    } catch (error) {
      setPreviewError((error as Error).message || 'Failed to load PDF preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreviewModal = () => {
    if (previewModal.fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewModal.fileUrl);
    }
    setPreviewModal({
      isOpen: false,
      id: null,
      name: '',
      type: '',
      event: '',
      status: '',
      value: '',
      date: '',
      fileUrl: null,
      fileName: '',
      previewUrl: null,
      previewMode: 'iframe',
    });
    setPreviewError(null);
    setIsLoadingPreview(false);
  };

  const openPreviewInNewTab = () => {
    if (!previewModal.fileUrl) return;
    openLinkInNewTab(previewModal.fileUrl);
  };

  const downloadCurrentPdf = async () => {
    if (previewModal.fileUrl && !previewModal.fileUrl.startsWith('blob:')) {
      const anchor = document.createElement('a');
      anchor.href = previewModal.fileUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = previewModal.fileName || 'contract-file';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }

    if (previewModal.id) {
      await openContractPdf(previewModal.id, true);
    }
  };

  const handleSendContractEmail = async (id: string) => {
    if (!user) {
      triggerModal('Authentication Required', 'Please sign in again before sending contract emails.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/contracts/${id}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send contract email.');
      }

      triggerModal('Contract Sent', 'The review link has been sent to the recipient email.');
      await fetchPipeline(token);
    } catch (error) {
      triggerModal('Send Error', (error as Error).message || 'Failed to send contract email.');
    }
  };

  // Filter contracts based on search term
  const filterContracts = (contracts: Contract[]) => {
    if (!searchTerm.trim()) return contracts;
    const term = searchTerm.toLowerCase();
    return contracts.filter(contract => 
      contract.name.toLowerCase().includes(term) ||
      contract.type.toLowerCase().includes(term) ||
      contract.eventName?.toLowerCase().includes(term) ||
      contract._id.toLowerCase().includes(term) ||
      contract.recipientName?.toLowerCase().includes(term)
    );
  };

  const filteredDrafting = filterContracts(pipeline.drafting);
  const filteredSent = filterContracts(pipeline.sent);
  const filteredSigned = filterContracts(pipeline.signed);

  // Paginate within each column independently
  const draftingStartIndex = (currentPage - 1) * itemsPerPage;
  const draftingEndIndex = draftingStartIndex + itemsPerPage;
  const paginatedDrafting = filteredDrafting.slice(draftingStartIndex, draftingEndIndex);

  const sentStartIndex = (currentPage - 1) * itemsPerPage;
  const sentEndIndex = sentStartIndex + itemsPerPage;
  const paginatedSent = filteredSent.slice(sentStartIndex, sentEndIndex);

  const signedStartIndex = (currentPage - 1) * itemsPerPage;
  const signedEndIndex = signedStartIndex + itemsPerPage;
  const paginatedSigned = filteredSigned.slice(signedStartIndex, signedEndIndex);

  // Calculate total pages based on the column with the most items
  const maxItemsInAnyColumn = Math.max(
    filteredDrafting.length,
    filteredSent.length,
    filteredSigned.length
  );
  const totalItems = maxItemsInAnyColumn;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Pagination component - bottom centered with page numbers and range indicator
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    // Calculate display range for the largest column
    const draftingCount = filteredDrafting.length;
    const sentCount = filteredSent.length;
    const signedCount = filteredSigned.length;
    const rangeStart = (currentPage - 1) * itemsPerPage + 1;
    const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="mt-12 pt-4 flex flex-col items-center gap-3">
        <div className="text-xs text-gray-400 font-medium">
          Page {currentPage} of {totalPages} • Showing up to {itemsPerPage} items per column
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Prev
          </button>
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all ${
                currentPage === page
                  ? 'bg-[#eebf43] text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    );
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
        <button onClick={() => { setEditingContractId(null); resetContractForm(); setCreateContractOpen(true); }} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-all rounded-xl shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-[#eebf43]/20 shrink-0">
          <Plus size={14} className="text-white" /> Create Contract
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, type, event, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-500 mt-2 ml-1">
            Found {totalItems} contract(s) matching &quot;{searchTerm}&quot;
          </p>
        )}
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
              {paginatedDrafting.length}
            </span>
          </div>
          
          <div className="space-y-4 flex-1">
            {paginatedDrafting.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                <p className="text-gray-400 text-sm font-medium">No contracts on this page</p>
              </div>
            ) : (
              paginatedDrafting.map(contract => (
                <div key={contract._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-extrabold text-[#eebf43] bg-[#fef9ec] px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                    <div className="text-[10px] font-medium text-gray-400">{formatDate(contract.lastUpdated)}</div>
                  </div>
                  <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight group-hover:text-[#eebf43] transition-colors">{contract.name}</h3>
                  <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                  
                  <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                    <div className="text-sm font-black text-[#1d1d1f]">{formatContractValue(contract.value)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditDrafting(contract._id)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title="Edit Draft">
                         <Edit size={14} />
                      </button>
                      <button onClick={() => handleSendContractEmail(contract._id)} className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white hover:bg-black transition-colors" title="Send To Email">
                         <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: SENT FOR SIGNATURE */}
        <div className="flex flex-col h-full bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[12px] font-black text-[#eebf43] tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#eebf43] animate-pulse"></span> Pending Signature
            </h2>
            <span className="bg-white text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200">
              {paginatedSent.length}
            </span>
          </div>
          
          <div className="space-y-4 flex-1">
            {paginatedSent.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                <p className="text-gray-400 text-sm font-medium">No contracts on this page</p>
              </div>
            ) : (
              paginatedSent.map(contract => (
                <div key={contract._id} className="bg-white p-5 rounded-2xl border border-[#eebf43]/20 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-extrabold text-[#eebf43] bg-[#fef9ec] px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                    <div className="text-[10px] font-medium text-gray-400">{formatDate(contract.lastUpdated)}</div>
                  </div>
                  <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight group-hover:text-[#eebf43] transition-colors">{contract.name}</h3>
                  <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                  
                  <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                    <div className="text-sm font-black text-[#1d1d1f]">{formatContractValue(contract.value)}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                      {contract.platform}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: SIGNED & RECONCILED */}
        <div className="flex flex-col h-full bg-emerald-50/30 rounded-3xl p-4 border border-emerald-100/50">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[12px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Signed &amp; Reconciled
            </h2>
            <span className="bg-white text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
              {paginatedSigned.length}
            </span>
          </div>
          
          <div className="space-y-4 flex-1">
            {paginatedSigned.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-emerald-100 text-center">
                <p className="text-gray-400 text-sm font-medium">No contracts on this page</p>
              </div>
            ) : (
              paginatedSigned.map(contract => (
                <div key={contract._id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">{contract._id.slice(-6).toUpperCase()}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-medium text-gray-400">{formatDate(contract.lastUpdated)}</div>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-[#1d1d1f] mb-1 leading-tight">{contract.name}</h3>
                  <p className="text-xs font-semibold text-gray-500 mb-6">{contract.type}</p>
                  
                  <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                    <div className="text-sm font-black text-[#1d1d1f]">{formatContractValue(contract.value)}</div>
                    <button onClick={() => void openPreviewModal(contract)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1">
                      VIEW PDF <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Single Pagination Bar - Bottom Center with Range Display */}
      <PaginationControls />

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center">
                  <FileText size={18} className="text-[#eebf43]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight">{previewModal.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{previewModal.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void downloadCurrentPdf()}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
                {previewModal.previewMode === 'external' && (
                  <button
                    onClick={openPreviewInNewTab}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                    title="Open Original File"
                  >
                    <Maximize2 size={18} />
                  </button>
                )}
                <button
                  onClick={closePreviewModal}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#fef9ec] text-[#eebf43]">
                      {previewModal.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Associated Event</label>
                    <p className="text-sm font-semibold text-[#1d1d1f]">{previewModal.event}</p>
                  </div>

                  {previewModal.value && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Contract Value</label>
                      <p className="text-2xl font-black text-[#1d1d1f] tracking-tight">{formatContractValue(previewModal.value)}</p>
                    </div>
                  )}

                  {previewModal.date && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                      <p className="text-sm font-medium text-gray-700">{formatDate(previewModal.date)}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Document Type</label>
                    <p className="text-sm font-medium text-gray-700">{previewModal.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-100 p-6 overflow-auto flex items-center justify-center">
                {isLoadingPreview ? (
                  <div className="text-center">
                    <Loader className="animate-spin text-[#eebf43] mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading PDF preview...</p>
                  </div>
                ) : previewError ? (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-red-400" />
                    </div>
                    <p className="text-red-600 font-medium mb-2">Failed to load PDF</p>
                    <p className="text-gray-500 text-sm">{previewError}</p>
                  </div>
                ) : previewModal.previewMode === 'external' ? (
                  <div className="max-w-md text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mx-auto mb-5">
                      <FileText size={28} className="text-[#eebf43]" />
                    </div>
                    <h4 className="text-lg font-black text-[#1d1d1f] mb-3">Preview In New Tab</h4>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      This file type can&apos;t be safely embedded in the modal because third-party viewers block iframe access.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={openPreviewInNewTab}
                        className="px-5 py-3 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                      >
                        Open Original
                      </button>
                      <button
                        onClick={() => void downloadCurrentPdf()}
                        className="px-5 py-3 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors"
                      >
                        Download File
                      </button>
                    </div>
                  </div>
                ) : previewModal.previewUrl ? (
                  <iframe
                    src={previewModal.previewUrl}
                    className="w-full h-full min-h-[500px] rounded-xl shadow-lg bg-white"
                    title="PDF Preview"
                    frameBorder="0"
                  />
                ) : (
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No preview available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          {['Send Error', 'PDF Error'].includes(modal.title) ? (
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200 overflow-hidden">
              <button 
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
              <div className="flex flex-col items-center text-center pt-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mb-6 animate-in scale-in-95 duration-300 shadow-lg">
                  <Info size={32} className="text-white animate-in scale-in-50 duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-[#1d1d1f] mb-3 tracking-tight">{modal.title}</h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{modal.message}</p>
                <button 
                  onClick={() => setModal({ ...modal, isOpen: false })} 
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-lg transition-all duration-200 shadow-md shadow-yellow-400/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Understood
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Create / Edit Contract Modal */}
      {createContractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button onClick={closeContractModal} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>
            
            <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-6 pr-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Document Management</p>
                <h3 className="text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tight">{editingContractId ? 'Edit Contract' : 'New Contract'}</h3>
                <p className="text-[12px] text-[#71717a] font-medium leading-relaxed mt-2.5 max-w-2xl">
                  {editingContractId
                    ? 'Update the contract details, recipient information, and replace the file if needed.'
                    : 'Create a new contract agreement, define the recipient, attach the contract file, and send it for signature through your preferred platform.'}
                </p>
              </div>
              <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-[#fef9ec] items-center justify-center text-[#eebf43] shrink-0">
                <FileText size={24} strokeWidth={1.5} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract Title</label>
                  <input value={contractForm.name} onChange={(event) => setContractForm((current) => ({ ...current, name: event.target.value }))} type="text" placeholder="e.g. Santos Floral Agreement" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Type</label>
                    <input value={contractForm.type} onChange={(event) => setContractForm((current) => ({ ...current, type: event.target.value }))} type="text" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Value</label>
                    <input value={contractForm.value} onChange={(event) => setContractForm((current) => ({ ...current, value: event.target.value }))} type="text" placeholder={`e.g. ${PESO_SYMBOL}45,000`} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Recipient Name</label>
                    <input
                      value={contractForm.recipientName}
                      onChange={(event) => setContractForm((current) => ({ ...current, recipientName: event.target.value }))}
                      type="text"
                      placeholder="e.g. Ian Angelo Valomores"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Recipient Email</label>
                    <input
                      value={contractForm.recipientEmail}
                      onChange={(event) => setContractForm((current) => ({ ...current, recipientEmail: event.target.value }))}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract File</label>
                <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/50 hover:border-[#eebf43]/50 transition-colors cursor-pointer group h-48">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Upload size={16} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[11px] font-black text-[#1d1d1f] line-clamp-2">{contractForm.contractFile ? contractForm.contractFile.name : 'Click to upload'}</span>
                  <span className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                    {contractForm.existingFileName && !contractForm.contractFile ? `Current: ${contractForm.existingFileName}` : 'PDF, DOCX'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(event) =>
                      setContractForm((current) => ({
                        ...current,
                        contractFile: event.target.files?.[0] || null,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <button onClick={closeContractModal} className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button disabled={submittingContract} onClick={handleCreateContract} className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20 disabled:opacity-70">
                {submittingContract ? 'Saving...' : editingContractId ? 'Save Changes' : 'Create Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
