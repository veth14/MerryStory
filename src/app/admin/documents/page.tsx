'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Upload, FileText, Image as ImageIcon, Eye, Bell, Edit, Send, X, Info, Folder, Grid, List, Search, MoreVertical, CloudUpload, Link as LinkIcon } from 'lucide-react';

const DOCUMENTS = [
  { id: 1, name: 'INV-2023-089_Floral.pdf', type: 'PDF', size: '1.2 MB', event: 'The Summer Solstice Gala', date: 'Oct 12, 2023', status: 'Reconciled', icon: 'file' },
  { id: 2, name: 'Receipt_Caterer_Deposit.jpg', type: 'JPG', size: '3.4 MB', event: 'Winter Wonderland Wedding', date: 'Oct 15, 2023', status: 'Pending', icon: 'image' },
  { id: 3, name: 'INV-2023-090_Lighting.pdf', type: 'PDF', size: '850 KB', event: 'The Summer Solstice Gala', date: 'Oct 18, 2023', status: 'Reconciled', icon: 'file' }
];

export default function DocumentsAdminPage() {
  const [activeTab, setActiveTab] = useState<'contracts' | 'repository'>('contracts');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#repository') {
      setActiveTab('repository');
    }
  }, []);

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      {/* Header Section */}
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
                Manage financial files, invoices, and payment receipts. Categorized into their event portfolios.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
                Contract <span className="text-[#eebf43] italic pr-2">Management</span>
              </h1>
              <p className="text-[#71717a] text-sm mt-4 max-w-xl leading-relaxed font-medium">
                Oversee and formalize agreements for upcoming events. Ensure all narratives are securely captured and digitally signed.
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
            <button onClick={() => setCreateContractOpen(true)} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 hover:-translate-y-0.5 active:translate-y-0">
              <Plus size={14} strokeWidth={2.5} className="text-white" /> New Contract
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-200/60 pl-2">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${activeTab === 'contracts' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Contract Management
        </button>
        <button
          onClick={() => setActiveTab('repository')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${activeTab === 'repository' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Document Repository
        </button>
      </div>

      {/* Content */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          
          {/* Card 1 Drafting */}
          <div className="md:col-span-2 bg-[#fdfdfc] rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-extrabold tracking-widest text-[#1d1d1f] mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#eebf43]" /> DRAFTING - URGENT
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[#1d1d1f] tracking-tight leading-tight max-w-sm mb-2">Reyes 50th Birthday Gala</h3>
                <p className="text-[#a1a1aa] font-bold text-sm tracking-wide">Vendor Agreements & Main Venue</p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <div className="text-3xl lg:text-4xl font-black text-[#1d1d1f] mb-1 tracking-tight">$45,000</div>
                <div className="text-[10px] font-extrabold text-[#a1a1aa] tracking-widest uppercase">ISSUED: OCT 24, 2023</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button onClick={() => triggerModal('Edit Contract', 'Loading drafting module for Reyes 50th Birthday Gala...')} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#1d1d1f] hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm uppercase tracking-widest">
                <Edit size={14} strokeWidth={2.5} /> Edit
              </button>
              <button onClick={() => triggerModal('Send for Signature', 'Pushing contract to DocuSign sequence...')} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#eebf43] rounded-xl text-[11px] font-black text-white hover:bg-[#dcae32] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-[#eebf43]/20 uppercase tracking-widest">
                <Send size={14} strokeWidth={2.5} /> Send for Signature
              </button>
            </div>
          </div>

          {/* Pipeline Dark Card */}
          <div className="bg-[#18181b] rounded-2xl p-8 shadow-sm flex flex-col border border-gray-800">
            <h3 className="text-2xl font-black text-white tracking-tight mb-8">Contract Pipeline</h3>
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <span className="text-gray-400 font-medium text-sm">Drafting</span>
                <span className="text-white font-black text-lg">4</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                <span className="text-gray-400 font-medium text-sm">Sent for Signature</span>
                <span className="text-white font-black text-lg">2</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-[#eebf43] font-medium text-sm">Signed & Confirmed</span>
                <span className="text-[#eebf43] font-black text-lg">12</span>
              </div>
            </div>
            <Link href="/admin/documents/pipeline" className="mt-8 pt-6 border-t border-gray-800 text-[10px] font-black text-[#eebf43] uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-colors w-full cursor-pointer">
              View Full Pipeline <ArrowRight size={12} strokeWidth={3} />
            </Link>
          </div>

          {/* Small Card 1 */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="mb-10">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-extrabold tracking-widest text-[#1d1d1f]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#facc15]" /> SENT FOR SIGNATURE
                </div>
                <div className="text-2xl font-black text-[#1d1d1f] tracking-tight shrink-0">$120,000</div>
              </div>
              <h3 className="text-2xl font-black text-[#1d1d1f] tracking-tight leading-tight mb-2">Santos Wedding Reception</h3>
              <p className="text-[#71717a] font-medium text-sm leading-relaxed">Awaiting client signature via DocuSign.</p>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-50 pt-5">
              <div className="text-[10px] font-bold text-[#a1a1aa] tracking-widest uppercase">ISSUED: OCT 20, 2023</div>
              <div className="flex gap-4 text-gray-400">
                <button className="hover:text-[#1d1d1f] transition-colors"><Eye size={18} strokeWidth={2.5} /></button>
                <button className="hover:text-[#1d1d1f] transition-colors"><Bell size={18} strokeWidth={2.5} /></button>
              </div>
            </div>
          </div>

          {/* Small Card 2 */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="mb-10">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-extrabold tracking-widest text-[#1d1d1f]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#eebf43]" /> SIGNED & CONFIRMED
                </div>
                <div className="text-2xl font-black text-[#1d1d1f] tracking-tight shrink-0">$8,500</div>
              </div>
              <h3 className="text-2xl font-black text-[#1d1d1f] tracking-tight leading-tight mb-2">Chen Corporate Retreat</h3>
              <p className="text-[#71717a] font-medium text-sm leading-relaxed">Fully executed. Saved to Document Repository.</p>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-50 pt-5">
              <div className="text-[10px] font-bold text-[#a1a1aa] tracking-widest uppercase">ISSUED: OCT 15, 2023</div>
              <button onClick={() => triggerModal('Retrieve PDF', 'Accessing finalized PDF from document repository...')} className="text-[10px] font-black text-[#eebf43] uppercase tracking-[0.2em] hover:text-[#dcae32] transition-colors">
                VIEW PDF
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'repository' && (
        <div className="animate-in fade-in duration-500">
          
          {/* Repository Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search in Documents..." 
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

          {/* Folders Section */}
          <div className="mb-8">
            <h4 className="text-[10px] font-extrabold text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">Categories & Folders</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Contracts & Agreements', count: '12 Files', slug: 'contracts' },
                { name: 'Invoices & Receipts', count: '45 Files', slug: 'invoices' },
                { name: 'Event Plans & Moodboards', count: '8 Files', slug: 'plans' },
                { name: 'Client Uploads', count: '24 Files', slug: 'uploads' },
              ].map((folder, i) => (
                <Link href={`/admin/documents/category/${folder.slug}`} key={i} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-[#eebf43]/40 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#fef9ec] transition-colors relative">
                    <Folder size={18} className="text-gray-400 group-hover:text-[#eebf43] absolute" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-[13px] font-bold text-[#1d1d1f] truncate mb-0.5 group-hover:text-[#eebf43] transition-colors">{folder.name}</h5>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{folder.count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Files Section */}
          <h4 className="text-[10px] font-extrabold text-[#a1a1aa] tracking-[0.2em] uppercase mb-4">Recent Files</h4>

          {viewMode === 'list' ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-3 border-b border-gray-100 mb-2">
                <div className="col-span-5 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DOCUMENT DETAILS</div>
                <div className="col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">ASSOCIATED EVENT</div>
                <div className="col-span-2 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">DATE ADDED</div>
                <div className="col-span-2 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase text-right">STATUS</div>
              </div>

              {DOCUMENTS.map((doc, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 items-center bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group cursor-pointer">
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                      doc.status === 'Reconciled' ? 'bg-[#fef9ec] text-[#eebf43]' : 'bg-gray-50 text-gray-500' 
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DOCUMENTS.map((doc, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#eebf43]/40 transition-all group flex flex-col cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fef9ec] flex items-center justify-center">
                      {doc.icon === 'file' ? <FileText size={20} className="text-[#eebf43]" /> : <ImageIcon size={20} className="text-[#eebf43]" />}
                    </div>
                    <button className="text-gray-300 hover:text-[#1d1d1f] transition-colors p-1">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <h5 className="text-[14px] font-bold text-[#1d1d1f] leading-tight mb-1 group-hover:text-[#eebf43] transition-colors line-clamp-2">{doc.name}</h5>
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
      )}

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
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                <input type="text" placeholder="e.g. Maria Santos" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Associated Event</label>
                <input type="text" placeholder="e.g. Santos Wedding Reception" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all" />
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
                onClick={() => {
                  setCreateContractOpen(false);
                  triggerModal('Contract Drafted', 'The new contract has been added to the drafting pipeline.');
                }}
                className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20"
              >
                Create Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal (aligned with New Contract modal) */}
      {uploadDocumentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setUploadDocumentOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#fef9ec] border border-[#eebf43]/20 flex items-center justify-center">
                <CloudUpload size={18} className="text-[#eebf43]" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight">Upload Document</h3>
            </div>

            <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">Upload a file and assign it to a category in your Document Repository.</p>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Destination Folder</label>
                <div className="relative">
                  <Folder size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-[#1d1d1f] focus:bg-white focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] outline-none transition-all appearance-none">
                    <option value="" disabled>Select a folder...</option>
                    <option value="contracts">Contracts & Agreements</option>
                    <option value="invoices">Invoices & Receipts</option>
                    <option value="plans">Event Plans & Moodboards</option>
                    <option value="uploads">Client Uploads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-1">Document File</label>
                <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[#fef9ec]/50 hover:border-[#eebf43]/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <CloudUpload size={16} className="text-[#eebf43]" />
                  </div>
                  <span className="text-[12px] font-black text-[#1d1d1f]">Click to upload or drag & drop</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">PDF, JPG, PNG, DOCX (Max 25MB)</span>
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
                  triggerModal('File Uploaded', 'Your document has been successfully uploaded to the repository.');
                }}
                className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-md shadow-[#eebf43]/20"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
