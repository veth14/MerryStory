'use client';
import React, { useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, Eye, Download, X, Info, Folder, Grid, List, Search, MoreVertical, ChevronLeft, CloudUpload } from 'lucide-react';

const CATEGORY_NAMES: Record<string, string> = {
  'contracts': 'Contracts & Agreements',
  'invoices': 'Invoices & Receipts',
  'plans': 'Event Plans & Moodboards',
  'uploads': 'Client Uploads'
};

const MOCK_EVENTS = [
  {
    id: 'E-001',
    name: 'Santos Wedding Reception',
    documents: [
      { id: 101, name: 'INV-2023-089_Floral.pdf', type: 'PDF', size: '1.2 MB', date: 'Oct 12, 2023', status: 'Reconciled', icon: 'file' },
      { id: 102, name: 'Receipt_Caterer_Deposit.jpg', type: 'JPG', size: '3.4 MB', date: 'Oct 15, 2023', status: 'Pending', icon: 'image' },
    ]
  },
  {
    id: 'E-002',
    name: 'The Summer Solstice Gala',
    documents: [
      { id: 201, name: 'Main_Venue_Agreement.pdf', type: 'PDF', size: '2.1 MB', date: 'Oct 20, 2023', status: 'Reconciled', icon: 'file' },
      { id: 202, name: 'INV-2023-090_Lighting.pdf', type: 'PDF', size: '850 KB', date: 'Oct 18, 2023', status: 'Reconciled', icon: 'file' }
    ]
  },
  {
    id: 'E-003',
    name: 'Reyes 50th Birthday Gala',
    documents: [
      { id: 301, name: 'Vendor_Agreement_Draft_v2.docx', type: 'DOCX', size: '412 KB', date: 'Yesterday', status: 'Draft', icon: 'file' }
    ]
  }
];

export default function EventCategoryDocumentsPage({ params }: { params: Promise<{ slug: string, eventId: string }> }) {
  const { slug, eventId } = use(params);
  const categoryName = CATEGORY_NAMES[slug] || 'Document Category';
  const event = MOCK_EVENTS.find(e => e.id === eventId) || MOCK_EVENTS[0];
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

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
              <span className="text-[#eebf43]">{event.name}</span>
            </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 items-center justify-center shrink-0">
              <Folder size={28} className="text-[#eebf43]" />
            </div>
            <div>
               <h1 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] tracking-tight">{event.name}</h1>
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
              <div className="col-span-3 lg:col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase hidden lg:block">DATE ADDED</div>
              <div className="col-span-4 lg:col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase text-right">STATUS / ACTIONS</div>
             </div>

             {event.documents.map((doc) => (
               <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 items-center bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group cursor-pointer">
                  <div className="col-span-8 lg:col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-[#fef9ec]">
                      {doc.icon === 'file' ? <FileText size={16} className="text-[#eebf43]" /> : <ImageIcon size={16} className="text-[#eebf43]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#1d1d1f] mb-0.5 group-hover:text-[#eebf43] transition-colors truncate pr-4">{doc.name}</div>
                      <div className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wider">{doc.type} &bull; {doc.size}</div>
                    </div>
                  </div>

                  <div className="col-span-3 lg:col-span-3 text-[12px] font-medium text-[#71717a] hidden lg:block">{doc.date}</div>
                  
                  <div className="col-span-4 lg:col-span-3 flex justify-end items-center gap-4">
                     <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                        doc.status === 'Reconciled' ? 'bg-[#fef9ec] text-[#eebf43]' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {doc.status}
                     </span>
                     <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); triggerModal('View Document', `Opening ${doc.name} to view securely.`); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="View"><Eye size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); triggerModal('Download Document', `Downloading ${doc.name} to your device.`); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="Download"><Download size={16} /></button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {event.documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fef9ec] flex items-center justify-center">
                    {doc.icon === 'file' ? <FileText size={20} className="text-[#eebf43]" /> : <ImageIcon size={20} className="text-[#eebf43]" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); triggerModal('Download Document', `Downloading ${doc.name} to your device.`); }} className="text-gray-300 hover:text-[#1d1d1f] p-1"><Download size={16} /></button>
                     <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-300 hover:text-[#1d1d1f] p-1"><MoreVertical size={16} /></button>
                  </div>
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

            <p className="text-[13px] font-medium text-gray-500 mb-4 leading-relaxed text-center">Upload a file to {event.name}.</p>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Document File</label>
                <div className="w-full border-2 border-dashed border-gray-200 bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/20 hover:border-[#eebf43]/30 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <CloudUpload size={20} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[13px] font-black text-[#1d1d1f] mb-1">Select a file from your device</span>
                  <span className="text-[11px] font-semibold text-gray-400">or drag and drop it here</span>
                  <div className="mt-4 px-3 py-1 bg-white rounded-full border border-gray-100 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                    PDF, JPG, PNG, DOCX (Max 25MB)
                  </div>
                </div>
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
                  triggerModal('File Uploaded', `Your document has been successfully added to ${event.name}.`);
                }}
                className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20 flex items-center justify-center gap-2"
              >
                <CloudUpload size={14} />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
