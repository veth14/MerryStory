'use client';

import React, { useState } from 'react';
import { ArrowRight, User, Mail, Phone, Lock, Save, Loader2, CheckCircle2, Bell, Tag } from 'lucide-react';

export default function CoordinatorProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alert, setAlert] = useState<{ message: string, type: 'success'|'info' } | null>(null);

  const showAlert = (message: string, type: 'success' | 'info' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleUploadImage = () => {
    showAlert('Image upload feature will be connected to storage shortly.', 'info');
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      showAlert('Profile information updated successfully.', 'success');
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">

      {/* Toast Alert */}
      {alert && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-bottom-4 fade-in ${alert.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} flex items-center gap-3`}>
          {alert.type === 'info' ? <Bell size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-extrabold tracking-wide">{alert.message}</span>
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">User Account</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Edit <span className="text-[#d4a017] italic pr-2">Profile</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Manage your personal connection and contact settings as a coordinator.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center mt-10">
        <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in duration-500 flex flex-col md:flex-row">
          
          {/* Left / Top Side: Profile Display */}
          <div className="md:w-1/3 bg-[#fafafa] border-b md:border-b-0 md:border-r border-gray-100 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fff9e6] to-transparent"></div>
            
            <div className="relative group cursor-pointer mb-6 z-10" onClick={handleUploadImage}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:opacity-90 transition-all flex items-center justify-center bg-[#1d1d1f] text-white">
                 <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Coordinator" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Change</span>
              </div>
            </div>
            
            <div className="z-10">
              <h2 className="text-2xl font-black text-[#1d1d1f]">Coordinator</h2>
              <p className="text-sm font-medium text-[#71717a] mt-1 flex items-center justify-center gap-1.5">
                <Tag size={14} className="text-[#d4a017]" /> Merry Story Staff
              </p>
            </div>

            <button 
              onClick={handleUploadImage}
              className="mt-8 px-6 py-2.5 bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-sm w-full max-w-[200px]"
            >
              Upload New Image
            </button>
            <button 
              onClick={() => showAlert('Removing image...', 'info')}
              className="mt-3 px-6 py-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all w-full max-w-[200px]"
            >
              Remove Picture
            </button>
          </div>

          {/* Right / Bottom Side: Edit Form */}
          <div className="md:w-2/3 p-10 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-[#1d1d1f] mb-8 flex items-center gap-2">
                <User size={18} className="text-[#a1a1aa]" /> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 mb-8">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
                    <User size={12} /> Full Name
                  </label>
                  <input 
                    type="text" 
                    defaultValue="Coordinator First" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#d4a017]/20 focus:border-[#d4a017] transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
                    <Mail size={12} /> Email Address
                  </label>
                  <input 
                    type="email" 
                    defaultValue="coor@merrystory.com" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#a1a1aa] outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
                    <Phone size={12} /> Phone Contact
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+63 9XX XXX XXXX" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#d4a017]/20 focus:border-[#d4a017] transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
                    <Lock size={12} /> Update Password
                  </label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep same" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#d4a017]/20 focus:border-[#d4a017] transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-extrabold text-center sm:text-left">
                Last login: <span className="text-[#1d1d1f]">April 20, 2026</span>
              </p>

              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1d1d1f] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : success ? (
                  <><CheckCircle2 size={16} className="text-emerald-400" /> Saved</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}