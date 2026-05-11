'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, MessageSquare, Briefcase, FileSignature } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminHeader() {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{name?: string, email?: string, avatarUrl?: string}>({});
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function loadHeaderProfile() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to load header profile", err);
      }
    }
    loadHeaderProfile();

    async function loadNotifications() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    loadNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (dropdown: 'notifications' | 'profile') => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleNotificationClick = (notification: any) => {
    setActiveDropdown(null);
    if (notification?.href) {
      router.push(notification.href);
    }
  };

  return (
    <header className="bg-[#fafafa]/80 backdrop-blur-md h-20 flex items-center justify-between px-5 sm:px-8 md:px-10 border-b border-gray-100/50 sticky top-0 z-40">
      <div className="flex items-center w-full max-w-md relative">
        
       
      </div>
      <div className="flex items-center space-x-3 sm:space-x-6 text-[#52525b]" ref={dropdownRef}>
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => handleToggle('notifications')}
            className={`transition-colors relative p-1 rounded-md ${activeDropdown === 'notifications' ? 'text-[#1d1d1f] bg-gray-100' : 'hover:text-[#1d1d1f]'}`}
          >
            <Bell size={20} strokeWidth={2} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          
          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-20px)] sm:w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#1d1d1f] text-sm">Notifications</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eebf43] cursor-pointer hover:text-[#dcae32]">Mark all read</span>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[#a1a1aa] text-xs font-medium">No new notifications</div>
                ) : (
                  notifications.map((notif) => {
                    const timeString = new Date(notif.time).toLocaleDateString() + ' ' + new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isConsultation = notif.type === 'consultation';
                    const isContract = notif.type === 'contract-signature' || notif.type === 'contract-revision' || notif.type === 'contract';
                    return (
                      <div key={notif.id} onClick={() => handleNotificationClick(notif)} className="p-3 hover:bg-[#fafafa] rounded-xl cursor-pointer transition-colors mb-1">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isConsultation ? 'bg-[#fef9ec] text-[#dcae32]' : isContract ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isConsultation ? <Briefcase size={14} /> : isContract ? <FileSignature size={14} /> : <MessageSquare size={14} />}
                          </div>
                          <div>
                            <p className="text-sm text-[#1d1d1f] font-medium leading-tight" dangerouslySetInnerHTML={{ __html: notif.title.replace(/(from\s+)(.*)/i, '$1<span class="font-bold">$2</span>') }}></p>
                            <p className="text-xs text-[#a1a1aa] mt-1">{timeString}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-gray-50 text-center">
                <button className="text-[11px] font-bold uppercase tracking-widest text-[#71717a] hover:text-[#1d1d1f] transition-colors">View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <div 
            onClick={() => handleToggle('profile')}
            className={`w-9 h-9 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer transition-all ${activeDropdown === 'profile' ? 'ring-2 ring-[#1d1d1f]' : 'hover:ring-2 hover:ring-gray-200'}`}
          >
             <img src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${profileData.name || 'Admin'}&background=eebf43&color=fff`} alt="Admin avatar" className="w-full h-full object-cover" />
          </div>

          {activeDropdown === 'profile' && (
            <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-20px)] sm:w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <img src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${profileData.name || 'Admin'}&background=eebf43&color=fff`} alt="Admin avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1d1d1f] truncate">{profileData.name || 'Admin User'}</p>
                  <p className="text-xs font-medium text-[#a1a1aa] truncate">{profileData.email || user?.email || 'admin@merrystory.com'}</p>
                </div>
              </div>
              <div className="p-2">
                <button onClick={() => window.location.href = '/admin/profile'} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-[#fafafa] rounded-xl transition-colors">
                  <User size={16} className="text-[#a1a1aa]" /> Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
}
