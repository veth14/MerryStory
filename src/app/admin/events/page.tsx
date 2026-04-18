'use client';
import React, { useState } from 'react';
import ProjectsView from '@/components/admin/events/ProjectsView';
import CalendarView from '@/components/admin/events/CalendarView';
import VendorsView from '@/components/admin/events/VendorsView';
import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EventsAdminPage() {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Workspace <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Portfolio</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#eebf43] italic pr-2">Management</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Oversee production pipelines. Coordinate schedules, manage client projects, and track vendor deliverables.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-200/60 pl-2">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'projects' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Event Projects
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'calendar' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Calendar & Scheduling
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'vendors' ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}
        >
          Vendor Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8 animate-in fade-in duration-500">
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'vendors' && <VendorsView />}
      </div>
    </div>
  );
}
