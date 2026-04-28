'use client';
import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Folder, ChevronLeft, Calendar, MapPin, Grid, List, Search, Loader } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const CATEGORY_NAMES: Record<string, string> = {
  'contracts': 'Contracts & Agreements',
  'invoices': 'Invoices & Receipts',
  'expenses': 'Expense Records',
  'plans': 'Event Plans & Moodboards',
  'uploads': 'Client Uploads'
};

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  type: string;
  fileCount: number;
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const categoryName = CATEGORY_NAMES[slug] || 'Document Category';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();

        const [eventsRes, documentsRes, contractsRes] = await Promise.all([
          fetch('/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(slug === 'contracts' ? '/api/admin/documents?category=contracts' : `/api/admin/documents?category=${slug}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          slug === 'contracts'
            ? fetch('/api/admin/contracts', {
                headers: { 'Authorization': `Bearer ${token}` }
              })
            : Promise.resolve(null),
        ]);

        const eventsData = eventsRes.ok ? await eventsRes.json() : [];
        const documentsData = documentsRes.ok ? await documentsRes.json() : [];
        const contractsData = contractsRes && contractsRes.ok ? await contractsRes.json() : [];

        const fileCountByEventId = new Map<string, number>();

        (Array.isArray(documentsData) ? documentsData : []).forEach((document: any) => {
          const eventId = String(document.eventId || '');
          if (!eventId) return;
          fileCountByEventId.set(eventId, (fileCountByEventId.get(eventId) || 0) + 1);
        });

        if (slug === 'contracts') {
          (Array.isArray(contractsData) ? contractsData : []).forEach((contract: any) => {
            const eventId = String(contract.eventId || '');
            if (!eventId) return;
            fileCountByEventId.set(eventId, (fileCountByEventId.get(eventId) || 0) + 1);
          });
        }

        const mappedEvents = (Array.isArray(eventsData) ? eventsData : [])
          .filter((event: any) => fileCountByEventId.has(String(event._id || '')))
          .map((event: any) => ({
            id: String(event._id),
            name: event.title || 'Untitled Event',
            date: event.date
              ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'No Date',
            location: event.location || 'No Location',
            type: event.type || 'Event',
            fileCount: fileCountByEventId.get(String(event._id)) || 0,
          }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [hydrated, user, slug]);

  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20 flex items-center justify-center py-20">
        <Loader className="animate-spin text-[#eebf43] mr-3" size={32} />
        <p className="text-[#71717a]">Loading category...</p>
      </div>
    );
  }

  const filteredEvents = events.filter((event) =>
    [event.name, event.location, event.type].some((value) =>
      value.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
  );

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20 animate-in fade-in duration-500 relative">
      <Link href="/admin/documents#repository" className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4 pt-2">
        <ChevronLeft size={16} strokeWidth={2.5} /> BACK TO STORAGE
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold tracking-widest uppercase mb-4 text-[#a1a1aa]">
            <Link href="/admin/documents#repository" className="hover:text-[#eebf43] transition-colors flex items-center gap-2">
              Document Repository
            </Link>
            <ArrowRight size={10} className="text-gray-300" />
            <span className="text-[#eebf43]">{categoryName}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-[#fef9ec] border border-[#eebf43]/20 items-center justify-center shrink-0">
              <Folder size={28} className="text-[#eebf43]" />
            </div>
            <div>
               <h1 className="text-4xl lg:text-5xl font-black text-[#1d1d1f] tracking-tight">{categoryName}</h1>
               <p className="text-[#71717a] text-sm mt-3 max-w-md leading-relaxed font-medium">
                 Manage financial files, invoices, and payment receipts. Categorized into their event portfolios.
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto self-end md:self-auto mt-4 md:mt-0">
          <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="text" placeholder="Search events..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-[#1d1d1f] outline-none shadow-sm focus:ring-2 focus:ring-[#eebf43]/50 focus:border-[#eebf43] transition-all" />
          </div>
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

      <h4 className="text-[10px] font-extrabold text-[#a1a1aa] tracking-[0.2em] uppercase mb-4 mt-8">Event Folders</h4>
      
      {viewMode === 'grid' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredEvents.map(event => (
             <Link href={`/admin/documents/category/${slug}/${event.id}`} key={event.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all cursor-pointer group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#fef9ec] transition-colors relative">
                     <Folder size={24} className="text-gray-400 group-hover:text-[#eebf43] absolute" />
                   </div>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full group-hover:bg-[#fef9ec] group-hover:text-[#eebf43] transition-colors">{event.fileCount} Files</span>
                </div>
                <h3 className="text-lg font-black text-[#1d1d1f] mb-1 group-hover:text-[#eebf43] transition-colors leading-tight">{event.name}</h3>
                <div className="inline-flex text-[11px] font-bold text-[#eebf43] uppercase tracking-wider mb-4">{event.type}</div>
                
                <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
                      <Calendar size={14} className="text-gray-400" /> {event.date}
                   </div>
                   <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
                      <MapPin size={14} className="text-gray-400" /> <span className="truncate">{event.location}</span>
                   </div>
                </div>
             </Link>
           ))}
         </div>
      ) : (
         <div className="flex flex-col gap-3">
           <div className="grid grid-cols-12 gap-4 px-6 py-2 mb-1">
            <div className="col-span-12 lg:col-span-5 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase">EVENT DIRECTORY</div>
            <div className="col-span-12 lg:col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase hidden lg:block">EVENT DATE</div>
            <div className="col-span-12 lg:col-span-3 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase hidden lg:block">LOCATION</div>
            <div className="col-span-12 lg:col-span-1 text-[10px] font-black text-[#a1a1aa] tracking-[0.2em] uppercase text-right hidden lg:block">FILES</div>
           </div>
           
           {filteredEvents.map(event => (
             <Link href={`/admin/documents/category/${slug}/${event.id}`} key={event.id} className="grid grid-cols-12 gap-4 px-6 lg:px-8 py-5 items-center bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#eebf43]/40 transition-all group cursor-pointer">
                <div className="col-span-12 lg:col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-gray-50 group-hover:bg-[#fef9ec]">
                    <Folder size={20} className="text-gray-400 group-hover:text-[#eebf43]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-black text-[#1d1d1f] mb-0.5 group-hover:text-[#eebf43] transition-colors truncate">{event.name}</div>
                    <div className="text-[10px] font-bold text-[#eebf43] uppercase tracking-wider">{event.type}</div>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-3 text-[13px] font-semibold text-[#71717a] hidden lg:flex items-center gap-2">
                   <Calendar size={14} className="text-gray-400" /> {event.date}
                </div>
                <div className="col-span-12 lg:col-span-3 text-[13px] font-semibold text-[#71717a] hidden lg:flex items-center gap-2 truncate">
                   <MapPin size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{event.location}</span>
                </div>
                <div className="col-span-12 lg:col-span-1 text-right hidden lg:block">
                   <span className="text-[11px] font-bold text-[#1d1d1f] bg-gray-50 group-hover:bg-[#fef9ec] group-hover:text-[#eebf43] px-3 py-1.5 rounded-full transition-colors">{event.fileCount}</span>
                </div>
             </Link>
           ))}
        </div>
      )}
    </div>
  );
}
