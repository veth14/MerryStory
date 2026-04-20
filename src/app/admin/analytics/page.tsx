'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  Calendar, 
  Award, 
  BarChart3, 
  PieChart, 
  Briefcase, 
  GlassWater, 
  Users 
} from 'lucide-react';

export default function AnalyticsAdminPage() {
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly' | 'Half-Year' | 'Annual'>('Monthly');

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Metrics <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Business Insights</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Data <span className="text-[#eebf43] italic pr-2">Analytics</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Monitor comprehensive client growth metrics. Visualize booking frequencies, engagement trends, and seasonal peaks.
          </p>
        </div>
        
        {/* Frequency Filter */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {['Monthly', 'Quarterly', 'Half-Year', 'Annual'].map((freq) => (
            <button
              key={freq}
              onClick={() => setFrequency(freq as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                frequency === freq 
                  ? 'bg-[#fafafa] text-[#1d1d1f] shadow-sm border border-gray-100' 
                  : 'text-[#a1a1aa] hover:text-[#71717a] border border-transparent'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* KPI / Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group cursor-default">
            <div>
              <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Peak Performance (Bookings)</p>
              <h2 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2">
                October & November <Award className="text-[#eebf43]" size={20} />
              </h2>
              <p className="text-xs text-[#71717a] mt-1 font-medium">Historically highest conversion months</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-[#f9f1d8] flex items-center justify-center border border-[#f4d98a]/50 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-[#dcae32]" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group cursor-default">
            <div>
              <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Peak Performance (Inquiries)</p>
              <h2 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2">
                January & February <BarChart3 className="text-blue-500" size={20} />
              </h2>
              <p className="text-xs text-[#71717a] mt-1 font-medium">Highest volume of initial leads</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
              <Calendar className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card (Frequency Analysis) - Span 2 */}
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Frequency Analysis</h3>
                <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider uppercase">{frequency} Trends: Bookings vs Inquiries</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold px-4 py-2 bg-[#fafafa] rounded-full border border-gray-100">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1d1d1f]/80"></div> Bookings</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#eebf43]/80"></div> Inquiries</div>
              </div>
            </div>

            {/* Custom CSS Bar Chart Space */}
            <div className="flex-1 flex items-end gap-2 sm:gap-4 h-[250px] relative mt-4 ml-6">
              {/* Y-Axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mb-6">
                {[100, 75, 50, 25, 0].map(val => (
                  <div key={val} className="w-full border-t border-dashed border-gray-100/80 flex items-center relative">
                     <span className="absolute -left-8 text-[9px] font-bold text-[#a1a1aa] pr-2 -translate-y-1/2 w-6 text-right">{val}</span>
                  </div>
                ))}
              </div>
              
              {/* Chart Bars */}
              {[
                { label: 'Jan', b: 35, i: 85 },
                { label: 'Feb', b: 40, i: 90 },
                { label: 'Mar', b: 45, i: 70 },
                { label: 'Apr', b: 50, i: 65 },
                { label: 'May', b: 65, i: 80 },
                { label: 'Jun', b: 70, i: 75 },
                { label: 'Jul', b: 60, i: 60 },
                { label: 'Aug', b: 55, i: 50 },
                { label: 'Sep', b: 80, i: 65 },
                { label: 'Oct', b: 95, i: 70 },
                { label: 'Nov', b: 90, i: 65 },
                { label: 'Dec', b: 60, i: 40 },
              ].slice(0, frequency === 'Monthly' ? 12 : frequency === 'Quarterly' ? 4 : frequency === 'Half-Year' ? 2 : 1).map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group">
                  <div className="flex items-end gap-1.5 sm:gap-2 w-full justify-center h-[calc(100%-24px)]">
                    <div className="w-full max-w-[12px] bg-[#1d1d1f]/80 rounded-t-full transition-all duration-500 group-hover:bg-[#1d1d1f] group-hover:shadow-[0_0_8px_rgba(29,29,31,0.2)] relative" style={{ height: `${data.b}%` }}></div>
                    <div className="w-full max-w-[12px] bg-[#eebf43]/80 rounded-t-full transition-all duration-500 group-hover:bg-[#eebf43] group-hover:shadow-[0_0_8px_rgba(238,191,67,0.3)] relative" style={{ height: `${data.i}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-[#a1a1aa] mt-2 block h-[16px] uppercase tracking-wider group-hover:text-[#1d1d1f] transition-colors">
                    {frequency === 'Quarterly' ? `Q${idx+1}` : frequency === 'Half-Year' ? `H${idx+1}` : frequency === 'Annual' ? '2026' : data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Types Breakdown - Span 1 */}
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-100/60">
              <div>
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Types of Events</h3>
                <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider uppercase">Bookings & Inquiries Distribution</p>
              </div>
              <PieChart className="text-[#a1a1aa]" size={20} />
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {[
                { type: "Weddings", count: 42, percentage: 45, icon: GlassWater, color: "bg-pink-100", text: "text-pink-600", bar: "bg-pink-400" },
                { type: "Corporate Galas", count: 28, percentage: 30, icon: Briefcase, color: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-400" },
                { type: "Private Parties", count: 14, percentage: 15, icon: Users, color: "bg-purple-100", text: "text-purple-600", bar: "bg-purple-400" },
                { type: "Charity / Non-Profit", count: 9, percentage: 10, icon: Award, color: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-400" },
              ].map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center border border-white shadow-sm`}>
                        <item.icon size={14} className={item.text} />
                      </div>
                      <span className="text-xs font-black text-[#1d1d1f]">{item.type}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-black text-[#1d1d1f] block">{item.count} Events</span>
                       <span className="text-[10px] font-bold text-[#a1a1aa]">{item.percentage}% of total</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                    <div className={`h-full ${item.bar} rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}