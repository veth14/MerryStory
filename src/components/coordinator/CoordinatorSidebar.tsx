'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getFirebaseClientAuth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Calendar, ClipboardCheck, Users, LogOut } from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';

import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/coordinator', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { name: 'Events', href: '/coordinator/events', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { name: 'Tasks', href: '/coordinator/tasks', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { name: 'Inquiries', href: '/coordinator/inquiries', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
];

export default function CoordinatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar-coordinator');
      const toggleBtn = document.getElementById('sidebar-toggle-coordinator');
      if (sidebar && !sidebar.contains(e.target as Node) && !toggleBtn?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);


  const handleSignOut = async () => {
    try {
      await signOut(getFirebaseClientAuth());
      router.push('/sign-in');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const filteredNavItems = role === 'staff' 
    ? navItems.filter(item => item.name === 'Dashboard' || item.name === 'Tasks') 
    : navItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      {!mobileOpen && (
        <button
          id="sidebar-toggle-coordinator"
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-5 left-5 z-50 p-2.5 bg-white rounded-lg shadow-md border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar-coordinator"
        className={`w-[280px] bg-white border-r border-gray-100 h-screen flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 ${
          mobileOpen 
            ? 'fixed left-0 top-0' 
            : 'fixed left-0 top-0 -translate-x-full'
        } md:relative md:translate-x-0 md:pt-0 md:z-10`}
      >
      <div className="p-8 pb-6 text-left flex items-start justify-start flex-col">
        <h2 className="text-[20px] tracking-tight font-extrabold text-gray-900 leading-tight">PRODUCTION</h2>
        <p className="text-[10px] uppercase tracking-wider text-[#d4a017] mt-1 font-bold">
          {role === 'staff' ? 'Staff Portal' : 'Coordinator Portal'}
        </p>
      </div>
      
      <nav className="flex-1 overflow-y-auto mt-2 px-4 scrollbar-hide">
        <ul className="space-y-1.5">
          {filteredNavItems.map((item) => {
            const isActive = item.href === '/coordinator' 
              ? pathname === '/coordinator' 
              : pathname.startsWith(item.href);
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 text-[14px] transition-all rounded-xl relative group ${
                    isActive
                      ? 'text-gray-900 font-bold bg-gray-50'
                      : 'text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-50/80'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#d4a017] rounded-r-md"></div>
                  )}
                  <span className={`${isActive ? 'text-[#d4a017]' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 mt-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3 text-[13px] text-gray-500 font-medium px-2">
          <Link href="/coordinator/support" className="flex items-center gap-3 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50">
            <svg className="w-[18px] h-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Support Center
          </Link>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 hover:text-red-600 transition-colors text-left p-2 rounded-lg hover:bg-red-50 pb-2 mb-2">
            <svg className="w-[18px] h-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="px-6 py-5 border-t border-gray-100 flex items-center gap-3 bg-white mt-1">
        <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white text-[11px] font-bold">
          N
        </div>
        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase truncate break-words whitespace-nowrap">
          © 2026 MERRY STORY INC.
        </p>
      </div>
      </aside>
    </>
  );
}
