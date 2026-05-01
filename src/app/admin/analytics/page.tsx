'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/components/auth/AuthProvider';

interface AnalyticsData {
  monthlyFrequency: Array<{ label: string; bookings: number; inquiries: number; actualBookings?: number; actualInquiries?: number }>;
  quarterlyFrequency: Array<{ label: string; bookings: number; inquiries: number; actualBookings?: number; actualInquiries?: number }>;
  halfYearFrequency: Array<{ label: string; bookings: number; inquiries: number; actualBookings?: number; actualInquiries?: number }>;
  annualFrequency: { label: string; bookings: number; inquiries: number; actualBookings?: number; actualInquiries?: number };
  peakMonths: {
    bookings: { month: string; count: number };
    inquiries: { month: string; count: number };
  };
  eventTypeBreakdown: Array<{ type: string; count: number; bookings: number; inquiries: number; percentage: number }>;
}

export default function AnalyticsAdminPage() {
  const { user } = useAuth();
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly' | 'Half-Year' | 'Annual'>('Monthly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (response.ok) {
          const analyticsData = await response.json();
          console.log('Analytics Data Received:', analyticsData);
          setData(analyticsData);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getChartData = () => {
    if (!data) return [];
    switch (frequency) {
      case 'Quarterly':
        return data.quarterlyFrequency;
      case 'Half-Year':
        return data.halfYearFrequency;
      case 'Annual':
        return [data.annualFrequency];
      case 'Monthly':
      default:
        return data.monthlyFrequency;
    }
  };

  const chartData = getChartData();

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
                {data?.peakMonths.bookings.month || 'Loading'} <Award className="text-[#eebf43]" size={20} />
              </h2>
              <p className="text-xs text-[#71717a] mt-1 font-medium">{data?.peakMonths.bookings.count || 0} bookings - Highest conversion month</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-[#f9f1d8] flex items-center justify-center border border-[#f4d98a]/50 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-[#dcae32]" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group cursor-default">
            <div>
              <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Peak Performance (Inquiries)</p>
              <h2 className="text-2xl font-black text-[#1d1d1f] flex items-center gap-2">
                {data?.peakMonths.inquiries.month || 'Loading'} <BarChart3 className="text-blue-500" size={20} />
              </h2>
              <p className="text-xs text-[#71717a] mt-1 font-medium">{data?.peakMonths.inquiries.count || 0} inquiries - Highest volume month</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
              <Calendar className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card (Frequency Analysis) - Span 2 */}
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm lg:col-span-2 flex flex-col h-[400px]">
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
            <div className="flex items-end gap-2 sm:gap-4 h-[500px] relative mt-4 ml-6 flex-1">
              {/* Y-Axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mb-6">
                {[100, 75, 50, 25, 0].map(val => (
                  <div key={val} className="w-full border-t border-dashed border-gray-100/80 flex items-center relative">
                     <span className="absolute -left-8 text-[9px] font-bold text-[#a1a1aa] pr-2 -translate-y-1/2 w-6 text-right">{val}</span>
                  </div>
                ))}
              </div>
              
              {/* Chart Bars */}
            {chartData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <p className="font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">{data.label}</p>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#1d1d1f]/80 inline-block"></span>
                    <span className="text-[#1d1d1f] font-bold">Bookings: {data.actualBookings !== undefined ? data.actualBookings : data.bookings}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#eebf43] inline-block"></span>
                    <span className="text-[#1d1d1f] font-bold">Inquiries: {data.actualInquiries !== undefined ? data.actualInquiries : data.inquiries}</span>
                  </div>
                </div>

                {/* Existing bars */}
                <div className="flex items-end gap-1.5 sm:gap-2 w-full justify-center h-[calc(100%-24px)]">
                  <div className="w-full max-w-[12px] bg-[#1d1d1f]/80 rounded-t-full ..." style={{ height: `${data.bookings}%` }}></div>
                  <div className="w-full max-w-[12px] bg-[#eebf43]/80 rounded-t-full ..." style={{ height: `${data.inquiries}%` }}></div>
                </div>
                <span className="...">{data.label}</span>
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
              {data?.eventTypeBreakdown && data.eventTypeBreakdown.length > 0 ? (
                data.eventTypeBreakdown.map((item, idx) => {
                  const colors = [
                    { color: "bg-pink-100", text: "text-pink-600", bar: "bg-pink-400" },
                    { color: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-400" },
                    { color: "bg-purple-100", text: "text-purple-600", bar: "bg-purple-400" },
                    { color: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-400" },
                  ];
                  const colorScheme = colors[idx % colors.length];
                  const icons = [GlassWater, Briefcase, Users, Award];
                  const IconComponent = icons[idx % icons.length];

                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${colorScheme.color} flex items-center justify-center border border-white shadow-sm`}>
                            <IconComponent size={14} className={colorScheme.text} />
                          </div>
                          <span className="text-xs font-black text-[#1d1d1f]">{item.type}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-xs font-black text-[#1d1d1f] block">{item.count} Total</span>
                           <span className="text-[9px] font-bold text-[#a1a1aa]">{item.bookings || 0} bookings · {item.inquiries || 0} inquiries</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div className={`h-full ${colorScheme.bar} rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[#a1a1aa] text-xs text-center">No event data available</p>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}