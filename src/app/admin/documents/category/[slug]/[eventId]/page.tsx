'use client';
import React, { useState, use, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, Download, X, Info, Folder, Grid, List, ChevronLeft, CloudUpload, Loader, Maximize2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';

const CATEGORY_NAMES: Record<string, string> = {
  'contracts': 'Contracts & Agreements',
  'invoices': 'Invoices & Receipts',
  'expenses': 'Expense Records',
  'plans': 'Event Plans & Moodboards',
  'uploads': 'Client Uploads'
};

const PESO_SYMBOL = '\u20B1';

type EventDocument = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  icon: string;
  kind: 'documents' | 'contracts';
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  value?: string;
};

type PreviewModalData = {
  isOpen: boolean;
  id: string | null;
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  kind: 'documents' | 'contracts' | null;
  fileUrl: string | null;
  fileName?: string;
  previewUrl?: string | null;
  previewMode?: 'iframe' | 'external';
  value?: string;
};

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

function openBlobPreview(objectUrl: string) {
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export default function EventCategoryDocumentsPage({ params }: { params: Promise<{ slug: string, eventId: string }> }) {
  const { user } = useAuth();
  const { slug, eventId } = use(params);
  const categoryName = CATEGORY_NAMES[slug] || 'Document Category';
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('Event Folder');
  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingDocument, setSubmittingDocument] = useState(false);
  const [previewModal, setPreviewModal] = useState<PreviewModalData>({
    isOpen: false,
    id: null,
    name: '',
    type: '',
    size: '',
    date: '',
    status: '',
    kind: null,
    fileUrl: null,
    fileName: '',
    previewUrl: null,
    previewMode: 'iframe',
    value: '',
  });

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const openPreviewModal = (doc: EventDocument) => {
    const previewConfig = resolvePreviewConfig(doc.fileUrl || null, doc.fileType || doc.type, doc.fileName || doc.name);
    setPreviewModal({
      isOpen: true,
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      date: doc.date,
      status: doc.status,
      kind: doc.kind,
      fileUrl: doc.fileUrl || null,
      fileName: doc.fileName || doc.name,
      previewUrl: previewConfig.previewUrl,
      previewMode: previewConfig.previewMode,
      value: doc.value,
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      id: null,
      name: '',
      type: '',
      size: '',
      date: '',
      status: '',
      kind: null,
      fileUrl: null,
      fileName: '',
      previewUrl: null,
      previewMode: 'iframe',
      value: '',
    });
  };

  const downloadCurrentFile = () => {
    if (!previewModal.fileUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewModal.fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = previewModal.fileName || previewModal.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const openOriginalFile = () => {
    if (!previewModal.fileUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewModal.fileUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();

        const [eventRes, documentsRes, contractsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/admin/documents?eventId=${eventId}&category=${slug}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          slug === 'contracts'
            ? fetch(`/api/admin/contracts?eventId=${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEventName(eventData.title || 'Event Folder');
        }

        const documentRecords = documentsRes.ok ? await documentsRes.json() : [];
        const contractRecords = contractsRes && contractsRes.ok ? await contractsRes.json() : [];

        const mappedDocuments: EventDocument[] = [
          ...(Array.isArray(documentRecords) ? documentRecords : []).map((doc: any) => ({
                id: String(doc._id),
                name: doc.name || 'Untitled Document',
                type: doc.type || 'FILE',
                size: doc.size || 'Unknown',
                date: doc.date || '',
                status: doc.status || 'Pending',
                icon: doc.icon || 'file',
                kind: 'documents' as const,
                fileUrl: doc.fileUrl || null,
                fileName: doc.fileName || doc.name || null,
                fileType: doc.fileType || doc.type || null,
              })),
          ...(slug === 'contracts'
            ? (Array.isArray(contractRecords) ? contractRecords : []).map((contract: any) => ({
                id: String(contract._id),
                name: contract.name || 'Untitled Contract',
                type: contract.type || 'Contract',
                size: formatContractValue(contract.value || ''),
                date: contract.lastUpdated || '',
                status: contract.status || 'drafting',
                icon: 'file',
                kind: 'contracts' as const,
                fileUrl: contract.status === 'signed' ? contract.signedFileUrl || contract.fileUrl || null : contract.fileUrl || null,
                fileName: contract.status === 'signed' ? contract.signedFileName || contract.fileName || contract.name || null : contract.fileName || contract.name || null,
                fileType: contract.status === 'signed' ? contract.signedFileType || contract.fileType || contract.type || null : contract.fileType || contract.type || null,
                value: contract.value || '',
              }))
            : []),
        ];

        setDocuments(mappedDocuments);
      } catch (error) {
        console.error('Failed to fetch event documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, hydrated, slug, user]);

  const normalizedDocuments = useMemo(() => documents, [documents]);

  const handleUploadDocument = async () => {
    if (!user || !selectedFile) return;

    try {
      setSubmittingDocument(true);
      const token = await user.getIdToken();
      const payload = new FormData();
      payload.append('name', selectedFile.name);
      payload.append('type', selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE');
      payload.append('eventId', eventId);
      payload.append('event', eventName);
      payload.append('date', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      payload.append('status', 'Pending');
      payload.append('category', slug);
      payload.append('icon', selectedFile.type.startsWith('image/') ? 'image' : 'file');
      payload.append('file', selectedFile);

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to upload document');
      }

      setUploadDocumentOpen(false);
      setSelectedFile(null);
      setDocuments((current) => [
        {
          id: `temp-${Date.now()}`,
          name: selectedFile.name,
          type: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
          size: `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Pending',
          icon: selectedFile.type.startsWith('image/') ? 'image' : 'file',
          kind: 'documents' as const,
          fileUrl: null,
          fileName: selectedFile.name,
          fileType: selectedFile.type || null,
        },
        ...current,
      ]);
      triggerModal('File Uploaded', `Your document has been successfully added to ${eventName}.`);
    } catch (error) {
      console.error('Failed to upload event document:', error);
      triggerModal('Upload Error', (error as Error).message || 'Failed to upload document.');
    } finally {
      setSubmittingDocument(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center py-20">
        <Loader className="animate-spin text-[#eebf43] mr-3" size={32} />
        <p className="text-[#71717a]">Loading event documents...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 animate-in fade-in duration-500 relative">
      {/* Breadcrumb */}
      <Link href={`/admin/documents/category/${slug}`} className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4 pt-2">
        <ChevronLeft size={16} strokeWidth={2.5} /> BACK TO EVENT FOLDERS
      </Link>

      {/* Header Section */}
<div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold tracking-widest uppercase mb-4 text-[#a1a1aa]">
              <Link href="/admin/documents#repository" className="hover:text-[#eebf43] transition-colors flex items-center gap-2">
                Document Repository
              </Link>
              <ArrowRight size={10} className="text-gray-300" />
              <Link href={`/admin/documents/category/${slug}`} className="hover:text-[#eebf43] transition-colors">{categoryName}</Link>
              <ArrowRight size={10} className="text-gray-300" />
              <span className="text-[#eebf43]">{eventName}</span>
            </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 items-center justify-center shrink-0">
              <Folder size={28} className="text-[#eebf43]" />
            </div>
            <div>
               <h1 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] tracking-tight">{eventName}</h1>
               <p className="text-[#71717a] text-sm mt-3 max-w-md leading-relaxed font-medium">
                 Viewing files for this event categorized under {categoryName}.
               </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 w-full lg:w-auto self-end md:self-auto mt-4 md:mt-0">
          <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#fef9ec] text-[#eebf43]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#fef9ec] text-[#eebf43]' : 'text-gray-400 hover:text-[#1d1d1f]'}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setUploadDocumentOpen(true)} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3.5 bg-[#eebf43] border hover:-translate-y-0.5 active:translate-y-0 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20">
             <CloudUpload size={16} />
             Upload Here
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="mt-12">
        {viewMode === 'list' ? (
          <div className="flex flex-col gap-3">
             <div className="grid grid-cols-12 gap-4 px-6 py-2 mb-1">
              <div className="col-span-8 lg:col-span-6 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DOCUMENT NAME</div>
              <div className="col-span-3 lg:col-span-2 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase hidden lg:block">DATE ADDED</div>
              <div className="hidden lg:flex lg:col-span-3 items-center justify-center text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">STATUS</div>
              <div className="col-span-4 lg:col-span-1 flex items-center justify-end pr-2 lg:pr-4 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DOWNLOAD</div>
             </div>

             {normalizedDocuments.map((doc) => (
               <div key={doc.id} onClick={() => openPreviewModal(doc)} className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 items-center bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group cursor-pointer">
                  <div className="col-span-8 lg:col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-[#fef9ec]">
                      {doc.icon === 'file' ? <FileText size={16} className="text-[#eebf43]" /> : <ImageIcon size={16} className="text-[#eebf43]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#1d1d1f] mb-0.5 group-hover:text-[#eebf43] transition-colors truncate pr-4">{doc.name}</div>
                      <div className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">{doc.type} &bull; {doc.size}</div>
                    </div>
                  </div>

                  <div className="col-span-3 lg:col-span-2 text-[12px] font-medium text-[#71717a] hidden lg:block">{doc.date}</div>
                  
                  <div className="hidden lg:flex lg:col-span-3 items-center justify-center px-4">
                     <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        doc.status === 'Reconciled' ? 'bg-[#fef9ec] text-[#eebf43]' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {doc.status}
                     </span>
                  </div>
                  <div className="col-span-4 lg:col-span-1 flex items-center justify-end pr-2 lg:pr-4">
                     <button onClick={(e) => { e.stopPropagation(); setPreviewModal((current) => ({ ...current, fileUrl: doc.fileUrl || null, fileName: doc.fileName || doc.name })); openPreviewModal(doc); }} className="w-9 h-9 rounded-xl flex items-center justify-center justify-self-end text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Download">
                       <Download size={16} />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {normalizedDocuments.map((doc) => (
              <div key={doc.id} onClick={() => openPreviewModal(doc)} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fef9ec] flex items-center justify-center">
                    {doc.icon === 'file' ? <FileText size={20} className="text-[#eebf43]" /> : <ImageIcon size={20} className="text-[#eebf43]" />}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openPreviewModal(doc); }} className="text-gray-300 hover:text-[#1d1d1f] p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Preview">
                    <Download size={16} />
                  </button>
                </div>
                <h5 className="text-[14px] font-bold text-[#1d1d1f] leading-tight mb-1 group-hover:text-[#eebf43] transition-colors break-words">{doc.name}</h5>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">{doc.type} &bull; {doc.size}</p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#a1a1aa] tracking-widest uppercase">{doc.date}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                    doc.status === 'Reconciled' ? 'bg-[#facc15] text-black' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
             ))}
           </div>
        )}
      </div>

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

      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
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
                <button onClick={downloadCurrentFile} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900" title="Download File">
                  <Download size={18} />
                </button>
                {previewModal.previewMode === 'external' && (
                  <button onClick={openOriginalFile} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900" title="Open Original File">
                    <Maximize2 size={18} />
                  </button>
                )}
                <button onClick={closePreviewModal} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                      previewModal.status === 'signed' || previewModal.status === 'Reconciled'
                        ? 'bg-[#fef9ec] text-[#eebf43]'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {previewModal.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Associated Event</label>
                    <p className="text-sm font-semibold text-[#1d1d1f]">{eventName}</p>
                  </div>
                  {previewModal.value && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Contract Value</label>
                      <p className="text-2xl font-black text-[#1d1d1f] tracking-tight">{formatContractValue(previewModal.value)}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Date Added</label>
                    <p className="text-sm font-medium text-gray-700">{previewModal.date}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">File Details</label>
                    <p className="text-sm font-medium text-gray-700">{previewModal.type} • {previewModal.size}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-100 p-6 overflow-auto flex items-center justify-center">
                {previewModal.previewMode === 'external' ? (
                  <div className="max-w-md text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center mx-auto mb-5">
                      <FileText size={28} className="text-[#eebf43]" />
                    </div>
                    <h4 className="text-lg font-black text-[#1d1d1f] mb-3">Open File</h4>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      This file type cannot be fully embedded here yet, but the real uploaded file is linked and ready.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={openOriginalFile} className="px-5 py-3 bg-[#1d1d1f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                        Open Original
                      </button>
                      <button onClick={downloadCurrentFile} className="px-5 py-3 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors">
                        Download File
                      </button>
                    </div>
                  </div>
                ) : previewModal.previewUrl ? (
                  <iframe
                    src={previewModal.previewUrl}
                    className="w-full h-full min-h-[500px] rounded-xl shadow-lg bg-white"
                    title="File Preview"
                    frameBorder="0"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
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

      {uploadDocumentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setUploadDocumentOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="flex items-center justify-center mb-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#eebf43] text-white shadow-md shadow-[#eebf43]/20">
                <CloudUpload size={16} />
                <span className="text-sm font-black tracking-widest uppercase">Upload Document</span>
              </div>
            </div>

            <p className="text-[13px] font-medium text-gray-500 mb-4 leading-relaxed text-center">Upload a file to {eventName}.</p>

            <div className="space-y-5 mb-6">
              <CustomSelect
                label="Document Category"
                value={slug}
                onChange={() => {}}
                options={[{ value: slug, label: categoryName, sublabel: 'Current folder' }]}
                icon={Folder}
                className="pointer-events-none opacity-80"
              />
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Document File</label>
                <label className="w-full border-2 border-dashed border-gray-200 bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/20 hover:border-[#eebf43]/30 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <CloudUpload size={20} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[13px] font-black text-[#1d1d1f] mb-1">{selectedFile ? selectedFile.name : 'Select a file from your device'}</span>
                  <span className="text-[11px] font-semibold text-gray-400">or drag and drop it here</span>
                  <div className="mt-4 px-3 py-1 bg-white rounded-full border border-gray-100 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                    PDF, JPG, PNG, DOCX (Max 25MB)
                  </div>
                  <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUploadDocumentOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUploadDocumentOpen(false);
                  handleUploadDocument();
                }}
                disabled={submittingDocument || !selectedFile}
                className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20 flex items-center justify-center gap-2"
              >
                <CloudUpload size={14} />
                {submittingDocument ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
