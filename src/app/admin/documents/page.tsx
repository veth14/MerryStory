'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  CheckCircle,
  CloudUpload,
  Edit,
  Eye,
  FileText,
  Folder,
  Grid,
  Image as ImageIcon,
  Info,
  List,
  Loader,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Upload,
  X,
  Download,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';

interface DocumentRecord {
  _id: string;
  name: string;
  type: string;
  size: string;
  event: string;
  eventId?: string;
  date: string;
  status: string;
  icon: string;
  category?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

interface ContractRecord {
  _id: string;
  name: string;
  type: string;
  value: string;
  status: string;
  eventId?: string;
  eventName?: string;
  lastUpdated?: string;
  platform?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  signedFileUrl?: string | null;
  signedFileName?: string | null;
  signedFileType?: string | null;
  recipientEmail?: string;
  recipientName?: string;
  reviewLink?: string;
}

interface EventRecord {
  _id: string;
  title: string;
}

interface PreviewModalData {
  isOpen: boolean;
  kind: 'documents' | 'contracts' | null;
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

const CATEGORY_DEFINITIONS = [
  { name: 'Contracts & Agreements', slug: 'contracts' },
  { name: 'Invoices & Receipts', slug: 'invoices' },
  { name: 'Expense Records', slug: 'expenses' },
  { name: 'Event Plans & Moodboards', slug: 'plans' },
  { name: 'Client Uploads', slug: 'uploads' },
] as const;

const PESO_SYMBOL = '\u20B1';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

function inferFileType(fileName: string) {
  const extension = fileName.split('.').pop()?.toUpperCase();
  return extension || 'FILE';
}

function inferFileIcon(fileName: string) {
  const lowered = fileName.toLowerCase();
  if (lowered.endsWith('.png') || lowered.endsWith('.jpg') || lowered.endsWith('.jpeg') || lowered.endsWith('.webp')) {
    return 'image';
  }
  return 'file';
}

function formatContractValue(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return `${PESO_SYMBOL}0`;
  return trimmed.startsWith(PESO_SYMBOL) ? trimmed : `${PESO_SYMBOL}${trimmed}`;
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

export default function DocumentsAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contracts' | 'repository'>('repository');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [submittingDocument, setSubmittingDocument] = useState(false);
  const [sendingContractId, setSendingContractId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [pipelineStats, setPipelineStats] = useState({ drafting: 0, sent: 0, signed: 0 });
  const [previewModal, setPreviewModal] = useState<PreviewModalData>({
    isOpen: false,
    kind: null,
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
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handledNotificationRef = useRef<string | null>(null);
  
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
  const [documentForm, setDocumentForm] = useState({
    eventId: '',
    category: 'uploads',
    status: 'Pending',
    file: null as File | null,
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const [docsRes, contractsRes, pipelineRes, eventsRes] = await Promise.all([
        fetch('/api/admin/documents', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/contracts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/contracts/pipeline', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/events', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(Array.isArray(docsData) ? docsData : []);
      } else {
        setDocuments([]);
      }

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(Array.isArray(contractsData) ? contractsData : []);
      } else {
        setContracts([]);
      }

      if (pipelineRes.ok) {
        const pipeline = await pipelineRes.json();
        setPipelineStats({
          drafting: pipeline.drafting?.length || 0,
          sent: pipeline.sent?.length || 0,
          signed: pipeline.signed?.length || 0,
        });
      } else {
        setPipelineStats({ drafting: 0, sent: 0, signed: 0 });
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !user) return;
    loadData();
  }, [hydrated, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#repository') {
      setActiveTab('repository');
    }
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'contracts' || requestedTab === 'repository') {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const handlePdfAction = async (kind: 'documents' | 'contracts', id: string, download = false) => {
    if (!user) {
      triggerModal('Authentication Required', 'Please sign in again before viewing or downloading PDFs.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/${kind}/${id}/pdf${download ? '?download=1' : ''}`, {
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
        anchor.download = `${kind === 'contracts' ? 'contract' : 'document'}-${id}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      return objectUrl;
    } catch (error) {
      console.error('Failed to handle PDF action:', error);
      triggerModal('PDF Error', (error as Error).message || 'Failed to load PDF.');
      return null;
    }
  };

  const openPreviewModal = async (kind: 'documents' | 'contracts', id: string, item: any) => {
    if (!user) return;

    const contractPreviewUrl =
      item.status === 'signed'
        ? item.signedFileUrl || item.fileUrl || null
        : item.fileUrl || null;
    const contractPreviewName =
      item.status === 'signed'
        ? item.signedFileName || item.fileName || item.name
        : item.fileName || item.name;
    const contractPreviewType =
      item.status === 'signed'
        ? item.signedFileType || item.fileType || item.type
        : item.fileType || item.type;
    const documentPreviewUrl = item.fileUrl || null;
    const documentPreviewName = item.fileName || item.name;
    const documentPreviewType = item.fileType || item.type;
    const directFileUrl = kind === 'contracts' ? contractPreviewUrl : documentPreviewUrl;
    const directFileName = kind === 'contracts' ? contractPreviewName : documentPreviewName;
    const directFileType = kind === 'contracts' ? contractPreviewType : documentPreviewType;

    if (directFileUrl) {
      const previewConfig = resolvePreviewConfig(directFileUrl, directFileType, directFileName);
      setPdfError(null);
      setIsLoadingPdf(false);
      setPreviewModal({
        isOpen: true,
        kind,
        id,
        name: item.name,
        type: item.fileType || item.type,
        event: item.event || item.eventName || 'N/A',
        status: item.status,
        value: item.value,
        date: item.date || item.lastUpdated,
        fileUrl: directFileUrl,
        fileName: directFileName,
        previewUrl: previewConfig.previewUrl,
        previewMode: previewConfig.previewMode,
      });
      return;
    }

    if (kind === 'documents') {
      setPdfError(null);
      setIsLoadingPdf(false);
      setPreviewModal({
        isOpen: true,
        kind,
        id,
        name: item.name,
        type: item.type,
        event: item.event || 'N/A',
        status: item.status,
        value: item.value,
        date: item.date,
        fileUrl: null,
        fileName: item.fileName || item.name,
        previewUrl: null,
        previewMode: 'iframe',
      });
      return;
    }

    setIsLoadingPdf(true);
    setPdfError(null);

    try {
      const fileUrl = await handlePdfAction(kind, id, false);
      
      if (fileUrl) {
        const previewConfig = resolvePreviewConfig(fileUrl, item.fileType || item.type, item.fileName || item.name);
        setPreviewModal({
          isOpen: true,
          kind,
          id,
          name: item.name,
          type: item.type,
          event: item.event || item.eventName || 'N/A',
          status: item.status,
          value: item.value,
          date: item.date || item.lastUpdated,
          fileUrl,
          fileName: item.fileName || item.name,
          previewUrl: previewConfig.previewUrl,
          previewMode: previewConfig.previewMode,
        });
      }
    } catch (error) {
      setPdfError('Failed to load document preview');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const closePreviewModal = () => {
    if (previewModal.fileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewModal.fileUrl);
    }
    setPreviewModal({
      isOpen: false,
      kind: null,
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
    setPdfError(null);
  };

  const isCompactPreviewModal =
    previewModal.isOpen &&
    !previewModal.fileUrl &&
    !previewModal.previewUrl &&
    previewModal.kind === 'documents';

  const openPreviewInNewTab = () => {
    if (!previewModal.fileUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewModal.fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadCurrentPdf = async () => {
    if (!previewModal.fileUrl && previewModal.kind === 'documents') {
      triggerModal('No File Attached', 'This document record does not have an uploaded file attached yet.');
      return;
    }

    if (previewModal.kind === 'contracts' && previewModal.fileUrl && !previewModal.fileUrl.startsWith('blob:')) {
      const anchor = document.createElement('a');
      anchor.href = previewModal.fileUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = previewModal.fileName || 'contract-draft';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }

    if (previewModal.kind && previewModal.id) {
      await handlePdfAction(previewModal.kind, previewModal.id, true);
    }
  };

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

  const selectedEventTitle = (eventId: string) => events.find((entry) => entry._id === eventId)?.title || 'Unassigned Event';

  const filteredDocuments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return documents;
    return documents.filter((doc) =>
      [doc.name, doc.event, doc.type, doc.status].some((value) => String(value || '').toLowerCase().includes(normalized))
    );
  }, [documents, searchQuery]);

  const contractEventOptions = useMemo(
    () =>
      events.map((event) => ({
        value: event._id,
        label: event.title,
        sublabel: 'Associated event',
      })),
    [events]
  );

  const folderCounts = useMemo(
    () =>
      CATEGORY_DEFINITIONS.map((folder) => ({
        ...folder,
        count:
          folder.slug === 'contracts'
            ? contracts.length
            : documents.filter((document) => document.category === folder.slug).length,
      })),
    [contracts.length, documents]
  );

  const primaryContracts = contracts.slice(0, 3);

  const handleEditContract = async (id: string) => {
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
      console.error('Failed to load contract:', error);
      triggerModal('Edit Error', (error as Error).message || 'Failed to load contract details.');
    }
  };

  const handleCreateContract = async () => {
    if (!user) {
      return;
    }

    if (!contractForm.name || !contractForm.eventId || !contractForm.value || !contractForm.recipientEmail) {
      triggerModal('Missing Details', 'Please complete the contract title, event, value, and recipient email before saving.');
      return;
    }

    try {
      setSubmittingContract(true);
      const token = await user.getIdToken();
      const payload = new FormData();
      payload.append('name', contractForm.name);
      payload.append('type', contractForm.type);
      payload.append('value', formatContractValue(contractForm.value));
      payload.append('eventId', contractForm.eventId);
      payload.append('eventName', selectedEventTitle(contractForm.eventId));
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
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save contract');
      }

      closeContractModal();
      await loadData();
      triggerModal(
        editingContractId ? 'Contract Updated' : 'Contract Created',
        editingContractId
          ? 'The contract details have been updated successfully.'
          : 'The contract has been saved to the drafting pipeline.'
      );
    } catch (error) {
      console.error('Failed to create contract:', error);
      triggerModal('Contract Error', (error as Error).message || 'Failed to save contract.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!user || !documentForm.eventId || !documentForm.file) {
      return;
    }

    try {
      setSubmittingDocument(true);
      const token = await user.getIdToken();
      const file = documentForm.file;
      const payload = new FormData();
      payload.append('name', file.name);
      payload.append('type', inferFileType(file.name));
      payload.append('eventId', documentForm.eventId);
      payload.append('event', selectedEventTitle(documentForm.eventId));
      payload.append('date', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      payload.append('status', documentForm.status);
      payload.append('category', documentForm.category);
      payload.append('icon', inferFileIcon(file.name));
      payload.append('file', file);

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to upload document metadata');
      }

      setUploadDocumentOpen(false);
      setDocumentForm({
        eventId: '',
        category: 'uploads',
        status: 'Pending',
        file: null,
      });
      await loadData();
      triggerModal('File Uploaded', 'The document record has been saved to the repository.');
    } catch (error) {
      console.error('Failed to upload document:', error);
      triggerModal('Upload Error', (error as Error).message || 'Failed to upload document.');
    } finally {
      setSubmittingDocument(false);
    }
  };

  useEffect(() => {
    if (loading || !contracts.length) return;

    const contractId = searchParams.get('contractId');
    const contractView = searchParams.get('contractView');
    const currentKey = `${contractId || ''}:${contractView || ''}`;

    if (!contractId || !contractView || handledNotificationRef.current === currentKey) {
      return;
    }

    const contract = contracts.find((entry) => entry._id === contractId);
    if (!contract) {
      handledNotificationRef.current = currentKey;
      return;
    }

    handledNotificationRef.current = currentKey;
    setActiveTab('contracts');

    const run = async () => {
      if (contractView === 'edit') {
        await handleEditContract(contractId);
      } else {
        await openPreviewModal('contracts', contractId, contract);
      }

      router.replace('/admin/documents?tab=contracts', { scroll: false });
    };

    void run();
  }, [contracts, loading, openPreviewModal, router, searchParams]);

  const handleSendContractEmail = async (contractId: string) => {
    if (!user) {
      triggerModal('Authentication Required', 'Please sign in again before sending contract emails.');
      return;
    }

    try {
      setSendingContractId(contractId);
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/contracts/${contractId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send contract email.');
      }

      await loadData();
      triggerModal('Contract Sent', 'The contract review link has been emailed to the selected recipient.');
    } catch (error) {
      triggerModal('Send Error', (error as Error).message || 'Failed to send contract email.');
    } finally {
      setSendingContractId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center py-20">
        <Loader className="animate-spin text-[#eebf43] mr-3" size={32} />
        <p className="text-[#71717a]">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Storage <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Contracts & Files</span>
          </p>
          {activeTab === 'repository' ? (
            <>
              <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
                Document <span className="text-[#eebf43] italic pr-2">Repository</span>
              </h1>
              <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
                This repository now reflects live MongoDB document records instead of placeholder folders and files.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
                Contract <span className="text-[#eebf43] italic pr-2">Management</span>
              </h1>
              <p className="text-[#71717a] text-sm mt-4 max-w-xl leading-relaxed font-medium">
                Monitor live contract records from MongoDB and add new agreements directly into the drafting pipeline.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
          {activeTab === 'repository' ? (
            <button onClick={() => setUploadDocumentOpen(true)} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 hover:-translate-y-0.5 active:translate-y-0">
              <Upload size={14} strokeWidth={2.5} className="text-white" /> Upload Document
            </button>
          ) : (
            <button onClick={() => { setEditingContractId(null); resetContractForm(); setCreateContractOpen(true); }} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 hover:-translate-y-0.5 active:translate-y-0">
              <Plus size={14} strokeWidth={2.5} className="text-white" /> New Contract
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-8 mb-8 border-b border-gray-200/60 pl-2">
        <button
          onClick={() => setActiveTab('repository')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${activeTab === 'repository' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Document Repository
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${activeTab === 'contracts' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Contract Management
        </button>
      </div>

      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="md:col-span-2 bg-[#fdfdfc] rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            {primaryContracts[0] ? (
              <>
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-extrabold tracking-widest text-[#1d1d1f] mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#eebf43]" /> {primaryContracts[0].status.toUpperCase()}
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tight leading-tight max-w-sm mb-2">{primaryContracts[0].name}</h3>
                    <p className="text-[#a1a1aa] font-bold text-sm tracking-wide">{primaryContracts[0].type}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <div className="text-3xl lg:text-4xl font-black text-[#1d1d1f] mb-1 tracking-tight">{formatContractValue(primaryContracts[0].value)}</div>
                    <div className="text-[10px] font-extrabold text-[#a1a1aa] tracking-widest uppercase">UPDATED: {primaryContracts[0].lastUpdated || 'Today'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button onClick={() => handleEditContract(primaryContracts[0]._id)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-black text-[#1d1d1f] hover:bg-gray-200 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm uppercase tracking-widest">
                    <Edit size={14} strokeWidth={2.5} /> Edit Draft
                  </button>
                  <button onClick={() => openPreviewModal('contracts', primaryContracts[0]._id, primaryContracts[0])} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#1d1d1f] hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm uppercase tracking-widest">
                    <Eye size={14} strokeWidth={2.5} /> View Draft
                  </button>
                  <button 
                    disabled={sendingContractId === primaryContracts[0]._id}
                    onClick={() => handleSendContractEmail(primaryContracts[0]._id)} 
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#eebf43] rounded-xl text-[11px] font-black text-white hover:bg-[#dcae32] disabled:opacity-75 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-[#eebf43]/20 uppercase tracking-widest disabled:hover:bg-[#eebf43] disabled:hover:-translate-y-0"
                  >
                    {sendingContractId === primaryContracts[0]._id ? (
                      <>
                        <Loader size={14} strokeWidth={2.5} className="animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} strokeWidth={2.5} /> Send To Email
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center text-center min-h-[260px]">
                <p className="text-[#a1a1aa] text-sm">No contracts found. Create one to get started.</p>
              </div>
            )}
          </div>

          <div className="bg-[#18181b] rounded-2xl p-8 shadow-sm flex flex-col border border-gray-800">
            <h3 className="text-2xl font-black text-white tracking-tight mb-8">Contract Pipeline</h3>
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <span className="text-gray-400 font-medium text-sm">Drafting</span>
                <span className="text-white font-black text-lg">{pipelineStats.drafting}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <span className="text-gray-400 font-medium text-sm">Sent for Signature</span>
                <span className="text-white font-black text-lg">{pipelineStats.sent}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[#eebf43] font-medium text-sm">Signed & Confirmed</span>
                <span className="text-[#eebf43] font-black text-lg">{pipelineStats.signed}</span>
              </div>
            </div>
            <Link href="/admin/documents/pipeline" className="mt-8 pt-6 border-t border-gray-800 text-[10px] font-black text-[#eebf43] uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-colors w-full cursor-pointer">
              View Full Pipeline <ArrowRight size={12} strokeWidth={3} />
            </Link>
          </div>

          {primaryContracts.slice(1).map((contract) => (
            <div key={contract._id} className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="mb-10">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-extrabold tracking-widest text-[#1d1d1f]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#facc15]" /> {contract.status.toUpperCase()}
                  </div>
                  <div className="text-2xl font-black text-[#1d1d1f] tracking-tight shrink-0">{formatContractValue(contract.value)}</div>
                </div>
                <h3 className="text-2xl font-black text-[#1d1d1f] tracking-tight leading-tight mb-2">{contract.name}</h3>
                <p className="text-[#71717a] font-medium text-sm leading-relaxed">{contract.type}</p>
              </div>

              <div className="flex justify-between items-center border-t border-gray-50 pt-5">
                <div className="text-[10px] font-bold text-[#a1a1aa] tracking-widest uppercase">UPDATED: {contract.lastUpdated || 'Today'}</div>
                <div className="flex gap-4 text-gray-400">
                  <button className="hover:text-[#1d1d1f] transition-colors" onClick={() => handleEditContract(contract._id)} title="Edit Draft"><Edit size={18} strokeWidth={2.5} /></button>
                  <button className="hover:text-[#1d1d1f] transition-colors" onClick={() => openPreviewModal('contracts', contract._id, contract)} title="View Draft"><Eye size={18} strokeWidth={2.5} /></button>
                  <button 
                    disabled={sendingContractId === contract._id}
                    onClick={() => handleSendContractEmail(contract._id)} 
                    title={sendingContractId === contract._id ? 'Sending...' : 'Send To Email'}
                    className={`transition-colors ${sendingContractId === contract._id ? 'text-[#eebf43] opacity-75 cursor-not-allowed' : 'text-gray-400 hover:text-[#1d1d1f]'}`}
                  >
                    {sendingContractId === contract._id ? (
                      <Loader size={18} strokeWidth={2.5} className="animate-spin" />
                    ) : (
                      <Send size={18} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'repository' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search in Documents..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#fef9ec] text-[#eebf43]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                  <Grid size={16} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#fef9ec] text-[#eebf43]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-[10px] font-extrabold text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">Categories & Folders</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {folderCounts.map((folder) => (
                <Link href={`/admin/documents/category/${folder.slug}`} key={folder.slug} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-[#eebf43]/40 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#fef9ec] transition-colors relative">
                    <Folder size={18} className="text-gray-400 group-hover:text-[#eebf43] absolute" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-[13px] font-bold text-[#1d1d1f] truncate mb-0.5 group-hover:text-[#eebf43] transition-colors">{folder.name}</h5>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{folder.count} Files</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <h4 className="text-[10px] font-extrabold text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">Recent Files</h4>

          {viewMode === 'list' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-3 border-b border-gray-100 mb-2">
                <div className="col-span-5 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DOCUMENT DETAILS</div>
                <div className="col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">ASSOCIATED EVENT</div>
                <div className="col-span-2 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DATE ADDED</div>
                <div className="col-span-2 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase text-right">STATUS</div>
              </div>

                {filteredDocuments.map((doc) => (
                  <div key={doc._id} onClick={() => openPreviewModal('documents', doc._id, doc)} className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 items-center bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group cursor-pointer">
                  <div className="col-span-12 lg:col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-[#fef9ec]">
                      {doc.icon === 'file' ? <FileText size={16} className="text-[#eebf43]" /> : <ImageIcon size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#1d1d1f] mb-0.5 group-hover:text-[#eebf43] transition-colors">{doc.name}</div>
                      <div className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">{doc.type} &bull; {doc.size}</div>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-3 text-[12px] font-semibold text-[#3f3f46] hidden lg:block">{doc.event}</div>
                  <div className="col-span-12 lg:col-span-2 text-[12px] font-medium text-[#71717a] hidden lg:block">{doc.date}</div>
                  <div className="col-span-12 lg:col-span-2 flex justify-start lg:justify-end">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${doc.status === 'Reconciled' ? 'bg-[#fef9ec] text-[#eebf43]' : 'bg-gray-50 text-gray-500'}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc._id} onClick={() => openPreviewModal('documents', doc._id, doc)} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fef9ec] flex items-center justify-center">
                      {doc.icon === 'file' ? <FileText size={20} className="text-[#eebf43]" /> : <ImageIcon size={20} className="text-[#eebf43]" />}
                    </div>
                      <button className="text-gray-300 hover:text-[#1d1d1f] transition-colors p-1" onClick={(event) => { event.stopPropagation(); openPreviewModal('documents', doc._id, doc); }} title="View PDF">
                        <Eye size={16} />
                      </button>
                  </div>
                  <h5 className="text-[14px] font-bold text-[#1d1d1f] leading-tight mb-1 group-hover:text-[#eebf43] transition-colors line-clamp-2">{doc.name}</h5>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{doc.type} &bull; {doc.size}</p>
                  <p className="text-[11px] font-medium text-[#71717a] mb-4">{doc.event}</p>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#a1a1aa] tracking-widest uppercase">{doc.date}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${doc.status === 'Reconciled' ? 'bg-[#facc15] text-black' : 'bg-gray-100 text-gray-500'}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-3xl w-full max-h-[90vh] shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden ${isCompactPreviewModal ? 'max-w-3xl' : 'max-w-6xl'}`}>
            {/* Modal Header */}
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
                    onClick={downloadCurrentPdf}
                    disabled={!previewModal.fileUrl && previewModal.kind === 'documents'}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                    title={previewModal.kind === 'contracts' ? 'Download Draft File' : 'Download PDF'}
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

            {/* Modal Content - Split View */}
            <div className={`flex flex-1 overflow-hidden ${isCompactPreviewModal ? 'flex-col md:flex-row' : ''}`}>
              {/* Left Panel - Document Info */}
              <div className={`${isCompactPreviewModal ? 'w-full md:w-72' : 'w-80'} bg-gray-50 ${isCompactPreviewModal ? 'md:border-r' : 'border-r'} border-gray-100 p-6 overflow-y-auto`}>
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                      previewModal.status === 'signed' || previewModal.status === 'Reconciled'
                        ? 'bg-[#fef9ec] text-[#eebf43]'
                        : previewModal.status === 'drafting' || previewModal.status === 'Pending'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {previewModal.status}
                    </span>
                  </div>

                  {/* Associated Event */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Associated Event</label>
                    <p className="text-sm font-semibold text-[#1d1d1f]">{previewModal.event}</p>
                  </div>

                  {/* Contract Value (if contract) */}
                  {previewModal.value && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Contract Value</label>
                      <p className="text-2xl font-black text-[#1d1d1f] tracking-tight">{formatContractValue(previewModal.value)}</p>
                    </div>
                  )}

                  {/* Date */}
                  {previewModal.date && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                      <p className="text-sm font-medium text-gray-700">{previewModal.date}</p>
                    </div>
                  )}

                  {/* Document Type */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Document Type</label>
                    <p className="text-sm font-medium text-gray-700">{previewModal.type}</p>
                  </div>

                  {/* Separator */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                    
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Draft / File Preview */}
              <div className={`flex-1 ${isCompactPreviewModal ? 'bg-white' : 'bg-gray-100'} p-6 overflow-auto flex items-center justify-center`}>
                {isLoadingPdf ? (
                  <div className="text-center">
                    <Loader className="animate-spin text-[#eebf43] mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">{previewModal.kind === 'contracts' ? 'Loading draft preview...' : 'Loading PDF preview...'}</p>
                  </div>
                ) : pdfError ? (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-red-400" />
                    </div>
                    <p className="text-red-600 font-medium mb-2">{previewModal.kind === 'contracts' ? 'Failed to load draft file' : 'Failed to load PDF'}</p>
                    <p className="text-gray-500 text-sm">{pdfError}</p>
                  </div>
                ) : previewModal.previewMode === 'external' ? (
                  <div className="max-w-md text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mx-auto mb-5">
                      <FileText size={28} className="text-[#eebf43]" />
                    </div>
                    <h4 className="text-lg font-black text-[#1d1d1f] mb-3">Preview In New Tab</h4>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      This file type can’t be safely embedded in the modal because third-party viewers block iframe access.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={openPreviewInNewTab}
                        className="px-5 py-3 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                      >
                        Open Original
                      </button>
                      <button
                        onClick={downloadCurrentPdf}
                        className="px-5 py-3 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors"
                      >
                        Download File
                      </button>
                    </div>
                  </div>
                ) : previewModal.previewUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={previewModal.previewUrl}
                    className="w-full h-full min-h-[500px] rounded-xl shadow-lg bg-white"
                    title={previewModal.kind === 'contracts' ? 'Draft File Preview' : 'PDF Preview'}
                    frameBorder="0"
                  />
                ) : (
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No preview available</p>
                    {previewModal.kind === 'documents' ? (
                      <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                        This document record does not have an uploaded file attached yet.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          {['Contract Updated', 'Contract Sent'].includes(modal.title) ? (
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200 overflow-hidden">
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
              <div className="flex flex-col items-center text-center pt-4">
                {modal.title === 'Contract Updated' ? (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#eebf43] to-[#dcae32] flex items-center justify-center mb-6 animate-in scale-in-95 duration-300 shadow-lg">
                    <RefreshCw size={32} className="text-white animate-in rotate-in duration-500" strokeWidth={1.5} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#eebf43] to-[#dcae32] flex items-center justify-center mb-6 animate-in scale-in-95 duration-300 shadow-lg">
                    <CheckCircle size={32} className="text-white animate-in scale-in-50 duration-500" strokeWidth={1.5} />
                  </div>
                )}
                <h3 className="text-2xl font-black text-[#1d1d1f] mb-3 tracking-tight">{modal.title}</h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">{modal.message}</p>
                <button 
                  onClick={() => setModal({ ...modal, isOpen: false })} 
                  className="w-full py-3.5 bg-gradient-to-r from-[#eebf43] to-[#dcae32] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-lg transition-all duration-200 shadow-md shadow-[#eebf43]/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Great!
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mb-6">
                <Info size={24} className="text-[#eebf43]" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] mb-2 tracking-tight">{modal.title}</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">{modal.message}</p>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-md">
                Understood
              </button>
            </div>
          )}
        </div>
      )}

      {createContractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button onClick={closeContractModal} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center">
                <FileText size={18} className="text-[#eebf43]" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight">{editingContractId ? 'Edit Contract' : 'New Contract'}</h3>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract Title</label>
                <input value={contractForm.name} onChange={(event) => setContractForm((current) => ({ ...current, name: event.target.value }))} type="text" placeholder="e.g. Santos Floral Agreement" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
              </div>
              <div>
                <CustomSelect
                  label="Associated Event"
                  value={contractForm.eventId}
                  onChange={(value) => setContractForm((current) => ({ ...current, eventId: value }))}
                  options={contractEventOptions}
                  icon={FileText}
                  placeholder="Select an event..."
                />
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
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Contract File</label>
                <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/50 hover:border-[#eebf43]/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Upload size={16} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[12px] font-black text-[#1d1d1f]">{contractForm.contractFile ? contractForm.contractFile.name : 'Click to upload or drag & drop'}</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                    {contractForm.existingFileName && !contractForm.contractFile ? `Current: ${contractForm.existingFileName}` : 'PDF, DOCX (Max 10MB)'}
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

            <div className="flex gap-3">
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

      {uploadDocumentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setUploadDocumentOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center">
                <CloudUpload size={18} className="text-[#eebf43]" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight">Upload Document</h3>
            </div>

            <div className="space-y-5 mb-8">
              <CustomSelect
                label="Destination Folder"
                value={documentForm.category}
                onChange={(value) => setDocumentForm((current) => ({ ...current, category: value }))}
                options={CATEGORY_DEFINITIONS.filter((folder) => folder.slug !== 'contracts').map((folder) => ({
                  value: folder.slug,
                  label: folder.name,
                  sublabel: 'Document category',
                }))}
                icon={FileText}
                placeholder="Select a folder..."
              />
              <CustomSelect
                label="Associated Event"
                value={documentForm.eventId}
                onChange={(value) => setDocumentForm((current) => ({ ...current, eventId: value }))}
                options={contractEventOptions}
                icon={FileText}
                placeholder="Select an event..."
              />
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Document File</label>
                <label className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/50 hover:border-[#eebf43]/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Upload size={16} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[12px] font-black text-[#1d1d1f]">{documentForm.file ? documentForm.file.name : 'Click to upload or drag & drop'}</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">PDF, DOCX, PNG, JPG</span>
                  <input type="file" className="hidden" onChange={(event) => setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setUploadDocumentOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button disabled={submittingDocument} onClick={handleUploadDocument} className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20 disabled:opacity-70">
                {submittingDocument ? 'Saving...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
