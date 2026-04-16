'use client';
import React, { useState } from 'react';
import ProjectsView from '@/components/admin/events/ProjectsView';
import CalendarView from '@/components/admin/events/CalendarView';
import VendorsView from '@/components/admin/events/VendorsView';

export default function EventsAdminPage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 font-bold text-[15px] transition-colors ${activeTab === 'projects' ? 'border-b-2 border-[#d4a017] text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Event Projects
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 font-bold text-[15px] transition-colors ${activeTab === 'calendar' ? 'border-b-2 border-[#d4a017] text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Calendar & Scheduling
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 font-bold text-[15px] transition-colors ${activeTab === 'vendors' ? 'border-b-2 border-[#d4a017] text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Vendor Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'vendors' && <VendorsView />}
      </div>
    </div>
  );
}
