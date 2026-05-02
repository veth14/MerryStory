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
  Users,
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  X
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

interface Recommendation {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

export default function AnalyticsAdminPage() {
  const { user } = useAuth();
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly' | 'Half-Year' | 'Annual'>('Monthly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastIndex, setToastIndex] = useState(0);

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
          generateRecommendations(analyticsData);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Handle auto-close toast after 10 seconds
  useEffect(() => {
    if (!showToast) return;
    
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [showToast]);

  const generateRecommendations = (analyticsData: AnalyticsData) => {
    const recs: Recommendation[] = [];

    // Get actual totals from the API data
    const monthlyData = analyticsData.monthlyFrequency || [];
    const totalInquiries = monthlyData.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0);
    const totalBookings = monthlyData.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0);
    const conversionRate = totalBookings > 0 && totalInquiries > 0 ? (totalBookings / totalInquiries) * 100 : 0;

    // 1. Conversion Rate Analysis
    if (totalInquiries > 20 && conversionRate < 30) {
      recs.push({
        type: 'warning',
        title: 'Low Conversion Rate Detected',
        description: `You have ${totalInquiries} inquiries but only ${conversionRate.toFixed(1)}% are converting to bookings. Consider improving follow-up strategies or refining your pricing.`,
        metric: `${conversionRate.toFixed(1)}% conversion`,
        action: 'Review inquiry response time and quality'
      });
    } else if (totalInquiries > 20 && conversionRate >= 30) {
      recs.push({
        type: 'success',
        title: 'Healthy Conversion Rate',
        description: `Your conversion rate of ${conversionRate.toFixed(1)}% indicates strong follow-up and sales performance. ${totalBookings} bookings from ${totalInquiries} inquiries shows effective business operations.`,
        metric: `${conversionRate.toFixed(1)}% conversion`,
        action: 'Maintain current sales strategies'
      });
    }

    // 2. Peak Season Opportunity
    const peakMonthBooking = analyticsData.peakMonths.bookings.month;
    const peakCountBooking = analyticsData.peakMonths.bookings.count;
    if (peakCountBooking > 5) {
      recs.push({
        type: 'opportunity',
        title: `Maximize ${peakMonthBooking} Peak Season`,
        description: `${peakMonthBooking} is your strongest booking month with ${peakCountBooking} confirmed bookings. Ensure adequate resources, inventory, and staffing to capitalize on this opportunity.`,
        metric: `+${peakCountBooking} bookings`,
        action: 'Plan capacity for peak season'
      });
    }

    const peakMonthInq = analyticsData.peakMonths.inquiries.month;
    const peakCountInq = analyticsData.peakMonths.inquiries.count;
    if (peakCountInq > 10 && peakMonthInq !== peakMonthBooking) {
      recs.push({
        type: 'opportunity',
        title: `Prepare for ${peakMonthInq} Inquiry Surge`,
        description: `${peakMonthInq} has the highest inquiry volume with ${peakCountInq} inquiries. This is a critical follow-up period - ensure your team is ready to convert these leads.`,
        metric: `+${peakCountInq} inquiries`,
        action: 'Increase sales team availability'
      });
    }

    // 3. Event Type Performance
    if (analyticsData.eventTypeBreakdown && analyticsData.eventTypeBreakdown.length > 0) {
      const topEvent = analyticsData.eventTypeBreakdown[0];
      const lowestEvent = analyticsData.eventTypeBreakdown[analyticsData.eventTypeBreakdown.length - 1];

      if (topEvent.percentage > 40) {
        recs.push({
          type: 'success',
          title: `${topEvent.type} is Your Star Service`,
          description: `${topEvent.type} generates ${topEvent.percentage}% of your business with ${topEvent.bookings} confirmed bookings. This is your revenue driver - focus on maintaining quality and growing this segment.`,
          metric: `${topEvent.count} total events`,
          action: 'Invest in marketing this service'
        });
      }

      if (lowestEvent.count < 3 && lowestEvent.inquiries > 0) {
        recs.push({
          type: 'opportunity',
          title: `Unlock ${lowestEvent.type} Potential`,
          description: `${lowestEvent.type} has limited activity but shows interest with ${lowestEvent.inquiries} inquiries. With targeted improvements, this could become a secondary revenue stream.`,
          metric: `Only ${lowestEvent.count} events`,
          action: 'Create growth plan for this category'
        });
      }
    }

    // 4. Month-over-Month Growth Analysis
    if (monthlyData.length >= 2) {
      // Get last 3 months average vs previous 3 months
      const recentMonths = monthlyData.slice(-3);
      const previousMonths = monthlyData.slice(-6, -3);
      
      const recentBookings = recentMonths.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) / recentMonths.length;
      const previousBookings = previousMonths.length > 0 
        ? previousMonths.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) / previousMonths.length 
        : 0;

      const bookingGrowth = previousBookings > 0 ? ((recentBookings - previousBookings) / previousBookings) * 100 : 0;

      if (recentMonths.length > 0 && previousBookings > 0) {
        if (bookingGrowth > 25) {
          recs.push({
            type: 'success',
            title: 'Strong Booking Growth',
            description: `Your bookings are trending upward with a ${bookingGrowth.toFixed(0)}% increase recently. Maintain momentum with consistent quality and marketing efforts.`,
            metric: `+${bookingGrowth.toFixed(0)}% growth`,
            action: 'Continue current successful strategies'
          });
        } else if (bookingGrowth < -25) {
          recs.push({
            type: 'warning',
            title: 'Booking Decline Alert',
            description: `Recent bookings have declined by ${Math.abs(bookingGrowth).toFixed(0)}%. Investigate external factors and consider promotional campaigns or service improvements.`,
            metric: `${bookingGrowth.toFixed(0)}% change`,
            action: 'Analyze and adjust marketing strategy'
          });
        }
      }
    }

    // 5. Inquiry Volume Analysis
    const peakInquiryCount = analyticsData.peakMonths.inquiries.count;
    const avgMonthlyInquiries = totalInquiries / 12;

    if (peakInquiryCount > avgMonthlyInquiries * 2.5) {
      recs.push({
        type: 'opportunity',
        title: 'Leverage Seasonal Demand',
        description: `Peak inquiry months show ${Math.round((peakInquiryCount / avgMonthlyInquiries - 1) * 100)}% above average volume. Optimize your follow-up process to convert more leads during these periods.`,
        metric: `${peakInquiryCount} peak inquiries`,
        action: 'Implement inquiry tracking system'
      });
    }

    // Ensure at least one recommendation
    if (recs.length === 0) {
      recs.push({
        type: 'success',
        title: 'Business Metrics Stable',
        description: `Your analytics show stable performance with ${totalBookings} bookings and ${totalInquiries} inquiries. Continue monitoring for trends and opportunities.`,
        metric: `${totalBookings} bookings`,
        action: 'Continue monitoring'
      });
    }

    // Limit to 4 recommendations
    setRecommendations(recs.slice(0, 4));
    
    // Show toast notification
    if (recs.length > 0) {
      setShowToast(true);
      setToastIndex(0);
    }
  };

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
        {/* Toast Notifications */}
        <div className="fixed top-6 right-6 z-50 max-w-sm">
          {showToast && recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((rec, idx) => {
                const bgColors = {
                  opportunity: 'bg-blue-50 border-blue-200',
                  warning: 'bg-amber-50 border-amber-200',
                  success: 'bg-emerald-50 border-emerald-200'
                };
                const iconColors = {
                  opportunity: 'text-blue-600 bg-blue-100',
                  warning: 'text-amber-600 bg-amber-100',
                  success: 'text-emerald-600 bg-emerald-100'
                };
                const icons = {
                  opportunity: Lightbulb,
                  warning: AlertCircle,
                  success: CheckCircle2
                };
                const IconComponent = icons[rec.type];

                return (
                  <div 
                    key={idx}
                    className={`border rounded-2xl p-5 group animate-in slide-in-from-right-full duration-300 shadow-lg ${showToast ? '' : 'animate-out fade-out duration-300'} ${bgColors[rec.type]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[rec.type]}`}>
                        <IconComponent size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#1d1d1f] mb-1">{rec.title}</h4>
                        <p className="text-xs text-[#71717a] leading-relaxed mb-3">{rec.description}</p>
                        {rec.metric && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-white/50 rounded-lg border border-white/80">
                            <Zap size={14} className={iconColors[rec.type]} />
                            <span className="text-xs font-bold text-[#1d1d1f]">{rec.metric}</span>
                          </div>
                        )}
                        {rec.action && (
                          <button className="text-xs font-bold text-[#1d1d1f] hover:underline flex items-center gap-1 group/btn">
                            {rec.action} 
                            <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setShowToast(false)}
                        className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-[#a1a1aa] hover:text-[#1d1d1f]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KPI / Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group cursor-default hover:shadow-lg hover:border-gray-200 transition-all duration-300">
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
          
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group cursor-default hover:shadow-lg hover:border-gray-200 transition-all duration-300">
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

        {/* KPI Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data && (
            <>
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider">Total Inquiries</span>
                  <Target size={16} className="text-[#eebf43]" />
                </div>
                <p className="text-2xl font-black text-[#1d1d1f]">
                  {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider">Total Bookings</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-[#1d1d1f]">
                  {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider">Conversion Rate</span>
                  <ArrowUpRight size={16} className="text-blue-500" />
                </div>
                <p className="text-2xl font-black text-[#1d1d1f]">
                  {(() => {
                    const totalBookings = data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0);
                    const totalInquiries = data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0);
                    return totalInquiries > 0 ? ((totalBookings / totalInquiries) * 100).toFixed(1) : '0.0';
                  })()}%
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider">Event Types</span>
                  <PieChart size={16} className="text-purple-500" />
                </div>
                <p className="text-2xl font-black text-[#1d1d1f]">
                  {data.eventTypeBreakdown.length}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card (Frequency Analysis) - Span 2 */}
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm lg:col-span-2 flex flex-col h-[450px] hover:shadow-lg hover:border-gray-200 transition-all">
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
            <div className="flex items-end gap-2 sm:gap-4 h-[calc(100%-100px)] relative mt-4 ml-6 flex-1">
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
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <p className="font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">{data.label}</p>
                  <div className="flex items-center gap-1.5 mb-1">
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
                  <div className="w-full max-w-[12px] bg-[#1d1d1f]/80 rounded-t-full transition-all group-hover:opacity-100 opacity-80 hover:shadow-lg" style={{ height: `${data.bookings}%` }}></div>
                  <div className="w-full max-w-[12px] bg-[#eebf43]/80 rounded-t-full transition-all group-hover:opacity-100 opacity-80 hover:shadow-lg" style={{ height: `${data.inquiries}%` }}></div>
                </div>
                <span className="text-[9px] font-bold text-[#a1a1aa] mt-2">{data.label}</span>
              </div>
            ))}
            </div>
          </div>

          {/* Event Types Breakdown - Span 1 */}
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex flex-col h-[450px] hover:shadow-lg hover:border-gray-200 transition-all">
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-100/60">
              <div>
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Types of Events</h3>
                <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider uppercase">Bookings & Inquiries Distribution</p>
              </div>
              <PieChart className="text-[#a1a1aa]" size={20} />
            </div>

            <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="space-y-6">
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
                            <div className={`w-8 h-8 rounded-full ${colorScheme.color} flex items-center justify-center border border-white shadow-sm group-hover:scale-110 transition-transform`}>
                              <IconComponent size={14} className={colorScheme.text} />
                            </div>
                            <span className="text-xs font-black text-[#1d1d1f]">{item.type}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-[#1d1d1f] block">{item.count} Total</span>
                             <span className="text-[9px] font-bold text-[#a1a1aa]">{item.bookings || 0}B · {item.inquiries || 0}I</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50 group-hover:bg-gray-100 transition-colors">
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

        {/* Insights Section */}
        <div className="bg-gradient-to-br from-[#fafafa] to-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:border-gray-200 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#f9f1d8] flex items-center justify-center">
              <Lightbulb size={20} className="text-[#dcae32]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Smart Insights</h3>
              <p className="text-[10px] font-bold text-[#a1a1aa] mt-1">Real data from your business</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data && (
              <>
                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Inquiry to Booking Ratio</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">
                      1 : {Math.round((data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0)) / (data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) || 1))}
                    </p>
                    <span className="text-xs text-[#71717a]">conversion ratio</span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    For every {Math.round((data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0)) / (data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) || 1))} inquiries, you convert 1 booking. {
                      ((data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) / (data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0) || 1)) * 100) > 30 
                        ? 'Excellent conversion rate!' 
                        : 'Consider improving follow-up strategies.'
                    }
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Total Activity</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">
                      {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0)}
                    </p>
                    <span className="text-xs text-[#71717a]">
                      / {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0)} inquiries
                    </span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    You have successfully booked {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0)} events from {data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0)} total inquiries in the tracked period.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Peak Booking Month</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">{data.peakMonths.bookings.month}</p>
                    <span className="text-xs text-[#71717a]">{data.peakMonths.bookings.count} bookings</span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    Your strongest month. Ensure adequate resources during this period. Average monthly bookings: {Math.round(data.monthlyFrequency.reduce((sum, m) => sum + (m.actualBookings || m.bookings), 0) / 12)}.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Top Revenue Driver</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">
                      {data.eventTypeBreakdown.length > 0 
                        ? data.eventTypeBreakdown[0].type
                        : 'N/A'
                      }
                    </p>
                    <span className="text-xs text-[#71717a]">
                      {data.eventTypeBreakdown.length > 0 
                        ? `${data.eventTypeBreakdown[0].percentage}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    {data.eventTypeBreakdown.length > 0 
                      ? `${data.eventTypeBreakdown[0].bookings} bookings. Focus on quality and growth in this category.`
                      : 'No event type data available.'
                    }
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Growth Opportunity</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">
                      {data.eventTypeBreakdown.length > 0
                        ? data.eventTypeBreakdown[data.eventTypeBreakdown.length - 1].type
                        : 'N/A'
                      }
                    </p>
                    <span className="text-xs text-[#71717a]">
                      {data.eventTypeBreakdown.length > 0 
                        ? `${data.eventTypeBreakdown[data.eventTypeBreakdown.length - 1].count} events`
                        : '0'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    {data.eventTypeBreakdown.length > 0 
                      ? `Underperforming category with ${data.eventTypeBreakdown[data.eventTypeBreakdown.length - 1].inquiries} inquiries. Explore marketing opportunities.`
                      : 'No event type data available.'
                    }
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-100/50 hover:border-gray-200 transition-colors">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Peak Inquiry Month</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-2xl font-black text-[#1d1d1f]">{data.peakMonths.inquiries.month}</p>
                    <span className="text-xs text-[#71717a]">{data.peakMonths.inquiries.count} inquiries</span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">
                    Highest volume inquiry month. Prepare your sales team for this surge. Average monthly inquiries: {Math.round(data.monthlyFrequency.reduce((sum, m) => sum + (m.actualInquiries || m.inquiries), 0) / 12)}.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}