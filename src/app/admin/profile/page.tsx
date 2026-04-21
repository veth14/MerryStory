'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Mail, Phone, Lock, Save, Loader2, CheckCircle2, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alert, setAlert] = useState<{ message: string, type: 'success'|'info'|'error' } | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            password: '',
          });
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        } else {
          showAlert('Failed to load profile data.', 'error');
        }
      } catch (error) {
        console.error(error);
        showAlert('An error occurred while loading profile.', 'error');
      } finally {
        setIsFetching(false);
      }
    }
    fetchProfile();
  }, [user]);

  const showAlert = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const idToken = await user.getIdToken();
      const response = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        showAlert('Profile picture updated successfully.', 'success');
      } else {
        const errData = await response.json();
        showAlert(errData.error || 'Failed to upload image.', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('An error occurred during upload', 'error');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/users/profile/avatar', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        setAvatarUrl(null);
        showAlert('Image removed successfully.', 'success');
      } else {
        const errData = await response.json();
        showAlert(errData.error || 'Failed to remove image.', 'error');
      }
    } catch (error) {
       showAlert('An error occurred while removing the image.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setSuccess(false);
    
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        showAlert('Profile information updated successfully.', 'success');
        setFormData(prev => ({ ...prev, password: '' })); // Clear password field
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errData = await response.json();
        showAlert(errData.error || 'Failed to update profile.', 'error');
      }
    } catch (error) {
      console.error(error);
      showAlert('An error occurred while saving.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#eebf43]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Toast Alert */}
      {alert && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-bottom-4 fade-in ${alert.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'} flex items-center gap-3`}>
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
            Edit <span className="text-[#eebf43] italic pr-2">Profile</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Manage your personal connection to the Merry Story admin portal.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center mt-10">
        <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in duration-500 flex flex-col md:flex-row">
          
          {/* Left / Top Side: Profile Display */}
          <div className="md:w-1/3 bg-[#fafafa] border-b md:border-b-0 md:border-r border-gray-100 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#eebf43]/10 to-transparent"></div>
            
            <div className="relative group cursor-pointer mb-6 z-10" onClick={handleUploadImage}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:opacity-90 transition-all">
                <img src={avatarUrl || `https://ui-avatars.com/api/?name=${formData.name || role || 'Admin'}&background=eebf43&color=fff`} alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Change</span>
              </div>
            </div>
            
            <div className="z-10">
              <h2 className="text-2xl font-black text-[#1d1d1f]">{formData.name || 'Set your name'}</h2>
              <p className="text-sm font-medium text-[#71717a] mt-1 flex items-center justify-center gap-1.5 capitalize">
                <ShieldCheck size={14} className="text-[#eebf43]" /> {role || 'User'}
              </p>
            </div>

            <button 
              onClick={handleUploadImage}
              className="mt-8 px-6 py-2.5 bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-sm w-full max-w-[200px]"
            >
              Upload New Image
            </button>
            <button 
              onClick={handleRemoveImage}
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
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                    <User size={12} /> Full Name
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#a1a1aa] outline-none cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                    <Phone size={12} /> Phone Contact
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+63 9XX XXX XXXX" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                    <Lock size={12} /> Update Password
                  </label>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep same" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-[#1d1d1f] focus:ring-2 focus:ring-[#eebf43]/20 focus:border-[#eebf43] transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa] font-extrabold text-center sm:text-left">
                Last login: <span className="text-[#1d1d1f]">Currently Active</span>
              </p>

              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#1d1d1f] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
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