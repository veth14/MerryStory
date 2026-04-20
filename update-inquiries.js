const fs = require('fs');

const content = `'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, MapPin, Users, ArrowRight, Eye, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';

// Mock Data
const INQUIRIESList = [
  { id: 'INQ-001', client: 'Garcia-Reyes', email: 'garcia@example.com', eventType: 'Wedding • Prestige', date: 'Jun 14, 2025', location: 'Makati', pax: 250, status: 'Under Review', submitted: 'Mar 5, 2025' },
  { id: 'INQ-002', client: 'Reyes Debut', email: 'reyes@example.com', eventType: 'Debut • Grand', date: 'Jun 10, 2025', location: 'Quezon City', pax: 180, status: 'Awaiting Docs', submitted: 'Mar 2, 2025' },
  { id: 'INQ-003', client: 'Lim Launch', email: 'lim@example.com', eventType: 'Corporate • Prestige', date: 'Jun 5, 2025', location: 'Caloocan City', pax: 120, status: 'Confirmed', submitted: 'Feb 28, 2025' },
  { id: 'INQ-004', client: 'Santos Gala', email: 'santos@example.com', eventType: 'Gala • Essential', date: 'Jul 20, 2025', location: 'BGC', pax: 150, status: 'New', submitted: 'Mar 8, 2025' },
  { id: 'INQ-005', client: 'Cruz Anniversary', email: 'cruz@example.com', eventType: 'Corporate • Grand', date: 'Aug 15, 2025', location: 'Pasig City', pax: 300, status: 'Reviewing', submitted: 'Mar 9, 2025' },
];

const STATUS_STYLES: Record<string, string> = {
  'Under Review': 'text-blue-600 bg-blue-50 border-blue-100',
  'Awaiting Docs': 'text-[#dcae32] bg-[#f9f1d8] border-[#f4d98a]/50',
  'Confirmed': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'New': 'text-purple-600 bg-purple-50 border-purple-100',
  'Reviewing': 'text-orange-600 bg-orange-50 border-orange-100',
};

export default function InquiriesAdminPage() {
  const [inquiries, setInquiries] = useState(INQUIRIESList);

  // Alerts & Modals
  const [alert, setAlert] = useState<{ message: string, type: 'success'|'error' } | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean, title: string, desc: string, action: (() => void) | null, type: 'info'|'danger' }>({ isOpen: false, title: '', desc: '', action: null, type: 'info' });

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
    openModal(\`Details: \${item.client}\`, \`Email: \${item.email}\\nEvent: \${item.eventType}\\nLocation: \${item.location}\\nPax: \${item.pax}\\nDate: \${item.date}\\n\\nClient submitted inquiry on \${item.submitted}.\`);
  };

  const handleReplyEmail = (item: any) => {
    openModal('Reply to Inquiry', \`This will open your default email client to compose a response to \${item.client} (\${item.email}).\\n\\nDo you want to proceed?\`, () => {
      window.location.href = \`mailto:\${item.email}?subject=Re: Inquiry for \${item.eventType}\`;
      showAlert(\`Drafting email to \${item.email}...\`);
    });
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      
      {/* Toast Alert */}
      {alert && (
        <div className={\`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-top-4 fade-in \${alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} flex items-center gap-3\`}>
          {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-extrabold tracking-wide">{alert.message}</span>
        </div>
      )}

      {/* Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className={\`w-12 h-12 rounded-full flex items-center justify-center shrink-0 \${modal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#fafafa] text-[#1d1d1f]'}\`}>
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
                <button onClick={handleConfirm} className={\`flex-1 py-3.5 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors \${modal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1d1d1f] hover:bg-black'}\`}>
                  Confirm
                </button>
              )}
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
      <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Client / Event</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Target Date</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Logistics</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Submitted</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] whitespace-nowrap">Status</th>
                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-[#a1a1aa] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors group cursor-default">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors">{item.client}</span>
                      <span className="text-xs font-semibold text-[#a1a1aa] mt-0.5">{item.eventType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#a1a1aa]" />
                      <span className="text-sm font-bold text-[#1d1d1f] whitespace-nowrap">{item.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#a1a1aa]" />
                        <span className="text-xs font-bold text-[#71717a]">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-[#a1a1aa]" />
                        <span className="text-xs font-bold text-[#71717a]">{item.pax} pax expected</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className="text-xs font-bold text-[#a1a1aa] whitespace-nowrap">{item.submitted}</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <span className={\`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border flex w-max items-center gap-1.5 \${STATUS_STYLES[item.status]}\`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleReplyEmail(item)} className="px-4 py-2 bg-[#eebf43] text-white hover:bg-[#dcae32] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm border border-[#dcae32]">
                        <Send size={12} /> Email
                      </button>
                      <button onClick={() => handleViewDetails(item)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#1d1d1f] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm">
                        <Eye size={12} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Search size={32} className="text-gray-300" />
                      <p className="text-[#a1a1aa] text-sm font-bold">No active inquiries in the pipeline.</p>
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
`;

fs.writeFileSync('src/app/admin/inquiries/page.tsx', content);
