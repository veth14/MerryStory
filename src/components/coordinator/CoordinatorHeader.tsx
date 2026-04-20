'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, MessageSquare, Calendar } from 'lucide-react';

export default function CoordinatorHeader() {
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="bg-transparent h-20 flex items-center justify-between px-10 relative">
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
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#1d1d1f] text-sm">Notifications</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eebf43] cursor-pointer hover:text-[#dcae32]">Mark all read</span>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                <div className="p-3 hover:bg-[#fafafa] rounded-xl cursor-pointer transition-colors mb-1">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fff9e6] text-[#d4a017] flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-[#1d1d1f] font-medium leading-tight">Admin assigned a new task for <span className="font-bold">Lim Launch</span></p>
                      <p className="text-xs text-[#a1a1aa] mt-1">10 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-[#fafafa] rounded-xl cursor-pointer transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-[#1d1d1f] font-medium leading-tight">Schedule updated for <span className="font-bold">Garcia Wedding</span></p>
                      <p className="text-xs text-[#a1a1aa] mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
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
             <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Coordinator avatar" className="w-full h-full object-cover" />
          </div>

          {activeDropdown === 'profile' && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Coordinator avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div>
                  <p className="text-sm font-bold text-[#1d1d1f]">Coordinator</p>
                  <p className="text-xs font-medium text-[#a1a1aa]">coor@merrystory.com</p>
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