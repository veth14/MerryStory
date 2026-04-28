'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, MessageSquare, Briefcase } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CoordinatorHeader() {
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<{name?: string, email?: string, avatarUrl?: string}>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

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

    async function loadHeaderProfile() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/users/profile', { headers: { Authorization: `Bearer ${idToken}` } });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    loadHeaderProfile();

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const handleToggle = (dropdown: 'notifications' | 'profile') => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <header className="bg-[#fafafa]/80 backdrop-blur-md h-20 flex items-center justify-between px-10 relative border-b border-gray-100/50">
      <div className="flex items-center w-full max-w-md relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Global search..."
          className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none text-gray-500 placeholder-gray-400 font-medium"
        />
      </div>
      <div className="flex items-center space-x-6 text-[#52525b]" ref={dropdownRef}>
        
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
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
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
                    return (
                      <div key={notif.id} className="p-3 hover:bg-[#fafafa] rounded-xl cursor-pointer transition-colors mb-1">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.type === 'consultation' ? 'bg-[#fef9ec] text-[#dcae32]' : 'bg-blue-50 text-blue-600'}`}>
                            {notif.type === 'consultation' ? <Briefcase size={14} /> : <MessageSquare size={14} />}
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
                <button onClick={() => window.location.href = '/coordinator/tasks'} className="text-[11px] font-bold uppercase tracking-widest text-[#71717a] hover:text-[#1d1d1f] transition-colors">View All Assigned</button>
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
             <img src={profileData?.avatarUrl || `https://ui-avatars.com/api/?name=${profileData?.name || 'Coordinator'}&background=eebf43&color=fff`} alt="Coordinator avatar" className="w-full h-full object-cover" />
          </div>

          {activeDropdown === 'profile' && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <img src={profileData?.avatarUrl || `https://ui-avatars.com/api/?name=${profileData?.name || 'Coordinator'}&background=eebf43&color=fff`} alt="Coordinator avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1d1d1f] truncate">{profileData?.name || 'Coordinator'}</p>
                  <p className="text-xs font-medium text-[#a1a1aa] truncate">{profileData?.email || user?.email || 'coor@merrystory.com'}</p>
                </div>
              </div>
              <div className="p-2">
                <button onClick={() => window.location.href = '/coordinator/profile'} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-[#fafafa] rounded-xl transition-colors">
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