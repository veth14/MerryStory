'use client';

import React, { useState } from 'react';
import { ArrowRight, Code, Mail, Phone, ExternalLink, ShieldCheck, MessageSquare, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getFirebaseClientAuth } from '@/lib/firebase/client';

export default function SupportCenterPage() {
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alert, setAlert] = useState<{ message: string, type: 'success'|'error' } | null>(null);

  // Form states
  const [subject, setSubject] = useState('Bug or System Error');
  const [priority, setPriority] = useState('low'); // 'low' is Normal, 'high' is Urgent/Critical
  const [message, setMessage] = useState('');

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const currentUser = getFirebaseClientAuth().currentUser;

      if (!currentUser) {
        throw new Error('Please sign in again to send a support ticket.');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/admin/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ subject, priority, message }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        showAlert('Message successfully routed to the Lead Developer.', 'success');
        setMessage(''); // clear on success
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to send ticket');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      showAlert(error.message || 'An error occurred while sending your ticket.', 'error');
    } finally {
      setIsSending(false);
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Help Desk</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Support <span className="text-[#eebf43] italic pr-2">Center</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Contact the lead software engineer for dashboard maintenance, feature requests, or technical bugs.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center mt-10">
        <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in duration-500 flex flex-col lg:flex-row">
          
          {/* Left Column: Contact Details */}
          <div className="lg:w-2/5 p-10 bg-[#fafafa] border-b lg:border-b-0 lg:border-r border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#fff9e6] rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4 opacity-60 pointer-events-none"></div>

            <div className="flex items-start gap-5 mb-8">
              <div className="w-14 h-14 bg-[#eebf43] text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-[#eebf43]/20">
                <Code size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1d1d1f] flex items-center gap-2">
                  Ian Angelo Valmores
                </h2>
                <p className="text-xs font-bold text-[#eebf43] uppercase tracking-widest flex items-center gap-1 mt-1">
                  Lead Developer <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                </p>
              </div>
            </div>

            <p className="text-[#71717a] text-sm mb-10 leading-relaxed">
              I built and maintain the Merry Story management dashboard. If you're experiencing any issues, need to add new features, or have database concerns, reach out to me directly below.
            </p>

            <div className="space-y-4">
              {/* Phone Link */}
              <a href="tel:09957419175" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all group cursor-pointer" onClick={() => showAlert('Opening dialer...', 'success')}>
                <div className="w-10 h-10 rounded-full bg-[#fafafa] border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#1d1d1f] group-hover:text-white transition-all">
                  <Phone size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-0.5">Direct Line</p>
                  <p className="text-sm font-bold text-[#1d1d1f]">0995 741 9175</p>
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-[#eebf43] transition-colors" />
              </a>

              {/* Email Link */}
              <a href="mailto:vianangelo.14@gmail.com" className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all group cursor-pointer" onClick={() => showAlert('Opening email client...', 'success')}>
                <div className="w-10 h-10 rounded-full bg-[#fafafa] border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#1d1d1f] group-hover:text-white transition-all">
                  <Mail size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#a1a1aa] mb-0.5">Email Address</p>
                  <p className="text-sm font-bold text-[#1d1d1f]">vianangelo.14@gmail.com</p>
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-[#eebf43] transition-colors" />
              </a>
            </div>
            
            <div className="mt-10 pt-6 border-t border-gray-200 flex items-center gap-2">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-xs font-bold text-[#71717a]">System Status: Operational</span>
            </div>
          </div>

          {/* Right Column: Direct Message Form */}
          <div className="lg:w-3/5 p-10 flex flex-col justify-between bg-white z-10">
            <div>
              <h3 className="text-lg font-black text-[#1d1d1f] mb-8 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#a1a1aa]" /> Send a Direct Ticket
              </h3>
              
              <form onSubmit={handleSendMessage} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Subject Area</label>
                  <select 
                    value={subject || 'Bug or System Error'}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="Bug or System Error">Bug or System Error</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Database Assistance">Database Assistance</option>
                    <option value="Other technical concern">Other technical concern</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Priority Level</label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priority" 
                        value="low" 
                        checked={priority === 'low'}
                        onChange={(e) => setPriority(e.target.value)}
                        className="peer sr-only" 
                      />
                      <div className="text-center py-2.5 px-3 border border-gray-200 rounded-xl text-xs font-bold text-[#71717a] peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition-all">Normal</div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priority" 
                        value="high" 
                        checked={priority === 'high'}
                        onChange={(e) => setPriority(e.target.value)}
                        className="peer sr-only" 
                      />
                      <div className="text-center py-2.5 px-3 border border-gray-200 rounded-xl text-xs font-bold text-[#71717a] peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 transition-all">Urgent / Critical</div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">Message Details</label>
                  <textarea 
                    required
                    rows={5}
                    value={message || ''}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue or feature you need help with..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSending}
                    className="w-full md:w-auto px-8 py-3.5 bg-[#1d1d1f] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <><Loader2 size={16} className="animate-spin" /> Transmitting...</>
                    ) : success ? (
                      <><CheckCircle2 size={16} className="text-emerald-400" /> Ticket Sent</>
                    ) : (
                      <><Send size={16} /> Submit Ticket</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}