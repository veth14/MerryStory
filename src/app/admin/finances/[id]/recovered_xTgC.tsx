'use client';
import React, { useState } from 'react';
import { 
  Download, 
  Plus, 
  TrendingUp, 
  Wallet, 
  Ticket, 
  Star, 
  CreditCard, 
  Utensils, 
  PenTool, 
  Flower, 
  Filter, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  X,
  Info
} from 'lucide-react';

// Main component reproducing the "Event Oversight" inspiration dashboard
export default function FinancesAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      
      {/* Breadcrumb / Top Navigation Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Financials <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Starlight Gala 2026</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#eebf43] italic pr-2">Oversight</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Comprehensive fiscal performance report. Automatically retrieves payments from uploaded receipts and deducts contracted vendor expenses.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
          <button 
            onClick={() => triggerModal('Export Ledger', 'Generating comprehensive CSV ledger for Starlight Gala 2026...')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 text-[#0f172a] text-[11px] font-black tracking-[0.1em] uppercase hover:bg-gray-50 hover:-translate-y-0.5 transition-all active:translate-y-0 rounded-xl shadow-sm">
            <Download size={14} className="text-[#0f172a]" /> Export Ledger
          </button>
          <button 
            onClick={() => triggerModal('Add Expense', 'Opening secure expense entry wizard...')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase rounded-xl shadow-md shadow-[#eebf43]/20">
            <Plus size={14} className="text-white" /> Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-200/60 pl-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${
            activeTab === 'overview' 
              ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' 
              : 'text-[#a1a1aa] hover:text-[#71717a]'
          }`}
        >
          Financial Overview
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'expenses' 
              ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' 
              : 'text-[#a1a1aa] hover:text-[#71717a]'
          }`}
        >
          Expense Tracking
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'invoices' 
              ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]' 
              : 'text-[#a1a1aa] hover:text-[#71717a]'
          }`}
        >
          Payment & Invoices
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in duration-500 w-full space-y-10">
          
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Analytics Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-4">Analytics overview</p>
                <div className="flex items-end gap-3 mb-3">
                  <h2 className="text-[44px] font-black text-[#1d1d1f] leading-none tracking-tight">+24%</h2>
                </div>
                <div className="flex items-center gap-2 mb-8">
                  <span className="bg-[#fef9ec] text-[#a88231] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#eebf43]/20">Growth</span>
                  <span className="text-[#a1a1aa] text-[11px] font-medium">Vs. Last Event</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest">Efficiency</p>
                  <p className="text-sm font-black text-[#1d1d1f]">92.4%</p>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#eebf43] h-full rounded-full" style={{ width: '92.4%' }}></div>
                </div>
              </div>
            </div>

            {/* Total Budget Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 mb-6">
                <TrendingUp size={16} className="text-[#1d1d1f]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Budget</p>
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">₱500,000</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  Allocated budget for the entire event lifecycle.
                </p>
              </div>
            </div>

            {/* Total Expenses Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 mb-6">
                <Wallet size={16} className="text-[#1d1d1f]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Expenses</p>
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">₱285,550</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  57% of total budget utilized. Vendor contracts and ad-hoc spend included.
                </p>
              </div>
            </div>

          </div>

          {/* Detailed Lists: Revenue vs Expenditures */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Revenue List */}
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-xl font-black tracking-tight text-[#1d1d1f]">Revenue Sources</h3>
                <span className="text-[#eebf43] text-[9px] font-black uppercase tracking-[0.2em] bg-[#fef9ec] px-4 py-1.5 rounded-full border border-[#eebf43]/20 shadow-[0_2px_10px_-4px_rgba(238,191,67,0.1)]">Live Syncing</span>
              </div>
              
              <div className="space-y-4">
                {/* Item 1 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <Ticket size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Grand Ballroom Tickets</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Direct Purchase • Mar 12</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">+$84,500</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-[0.1em]">Verified</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <Star size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Luminary Sponsorship</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Corporate Wire • Mar 10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">+$150,000</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-[0.1em]">Settled</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <CreditCard size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Silent Auction Proceeds</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Stripe Sync • Mar 09</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">+$77,900</p>
                    <p className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-[0.1em]">Processing</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-5 py-4 rounded-[16px] border-2 border-dashed border-gray-100 text-[#a1a1aa] text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#1d1d1f] hover:border-gray-200 transition-colors text-center bg-[#fafafa]/50">
                Load All Revenue Sources
              </button>
            </div>

            {/* Expenditures List */}
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-xl font-black tracking-tight text-[#1d1d1f]">Expenditures</h3>
                <button className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors">
                  <Filter size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Item 1 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <Utensils size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Elite Catering Inc.</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Contract #442 • Vendor</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">-$92,400</p>
                    <p className="text-[#71717a] text-[9px] font-bold uppercase tracking-[0.1em]">Contract</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <PenTool size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Calligraphy Printing</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Ad-hoc • Manual Entry</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">-$2,150</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-[0.1em]">Manual</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-white p-6 rounded-[24px] flex items-center justify-between border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#eebf43]/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[#fdfdfc] flex items-center justify-center border border-gray-100 group-hover:bg-[#fef9ec] group-hover:border-[#eebf43]/30 transition-colors">
                      <Flower size={20} className="text-[#a1a1aa] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] mb-1">Floral Installations</h4>
                      <p className="text-[#a1a1aa] text-[12px] font-medium">Service • Manual Entry</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[17px] mb-1">-$25,000</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-[0.1em]">Manual</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-5 py-4 rounded-[16px] border-2 border-dashed border-gray-100 text-[#a1a1aa] text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#1d1d1f] hover:border-gray-200 transition-colors text-center bg-[#fafafa]/50">
                Load All Expenditures
              </button>
            </div>

          </div>

          {/* Bottom Fiscal Performance Summary Banner */}
          <div className="bg-[#fffdf8] rounded-[24px] p-8 md:p-12 border border-[#eebf43]/20 flex flex-col md:flex-row items-center gap-10 lg:gap-16 shadow-sm">
            {/* Donut Chart representation */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white drop-shadow-sm"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#eebf43]"
                  strokeWidth="4"
                  strokeDasharray="45.7, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-black text-[#1d1d1f] tracking-tighter leading-none mt-1">45.7%</span>
                <span className="text-[6.5px] font-black text-[#eebf43] uppercase tracking-[0.2em] mt-1">Profit Margin</span>
              </div>
            </div>

            {/* Summary Text context */}
            <div className="flex-1">
              <h3 className="text-[22px] font-black mb-3 tracking-tight text-[#1d1d1f]">
                Fiscal <span className="text-[#eebf43]">Performance Summary</span>
              </h3>
              <p className="text-[#71717a] text-[13px] leading-relaxed mb-6 max-w-2xl font-medium">
                Current profit margins have reached 45.7%, significantly outpacing the historical baseline of 38%. Optimization is largely attributed to refined vendor negotiation and streamlined operational logistics. Automatic reconciliation from receipts is saving ~14 hours of manual labor per week.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white px-4 py-2.5 rounded-xl border border-[#eebf43]/30 shadow-[0_2px_10px_-4px_rgba(238,191,67,0.1)] flex flex-col gap-0.5">
                  <span className="text-[#a1a1aa] text-[8px] font-black uppercase tracking-widest">Status</span>
                  <span className="text-[#eebf43] text-[11px] font-bold flex items-center gap-1.5"><Activity size={12}/> High Efficiency</span>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-0.5">
                  <span className="text-[#a1a1aa] text-[8px] font-black uppercase tracking-widest">Audit</span>
                  <span className="text-[#1d1d1f] text-[11px] font-bold flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#1d1d1f]"/> Clean & Verified</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {/* Expense Tracking Panel (Tab 2) */}
      {activeTab === 'expenses' && (
        <div className="animate-in fade-in duration-500 w-full space-y-6">
            
            {/* Top KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-center h-32">
                 <p className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-4">Total Expenses</p>
                 <h2 className="text-[36px] font-black text-[#1d1d1f] leading-none tracking-tight">₱315,000</h2>
              </div>
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-center h-32">
                 <p className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-4">Records</p>
                 <h2 className="text-[36px] font-black text-[#1d1d1f] leading-none tracking-tight">4</h2>
              </div>
            </div>

            {/* Expenses by Category Chart Area */}
            <div className="bg-white p-8 rounded-[16px] border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)]">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-8">Expenses by Category</h3>
              
              <div className="w-full flex justify-center py-6">
                {/* SVG representing the donut chart */}
                <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Catering 34.1% - #eebf43 */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#dfb23e" strokeWidth="8" strokeDasharray="34.1 65.9" strokeDashoffset="0" />
                    {/* Equipment 21.9% - #be9635 */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#be9635" strokeWidth="8" strokeDasharray="21.9 78.1" strokeDashoffset="-34.1" />
                    {/* Decoration 20.6% - #5a4b2b */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#5a4b2b" strokeWidth="8" strokeDasharray="20.6 79.4" strokeDashoffset="-56" />
                    {/* Venue 10.9% - #fffae8 */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#fffae8" strokeWidth="8" strokeDasharray="10.9 89.1" strokeDashoffset="-76.6" />
                    {/* Staff 5.8% - #cfad6b */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#cfad6b" strokeWidth="8" strokeDasharray="5.8 94.2" strokeDashoffset="-87.5" />
                    {/* Marketing 2.3% - #fdef8a */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#fdef8a" strokeWidth="8" strokeDasharray="2.3 97.7" strokeDashoffset="-93.3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="w-20 h-20 bg-white rounded-full"></span>
                  </div>
                  
                  {/* Fake Labels around the donut */}
                  <div className="absolute -top-3 right-8 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Catering</span>
                    <span className="text-[10px] text-[#71717a] font-medium">34.1%</span>
                  </div>
                  <div className="absolute -bottom-1 right-12 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Equipment</span>
                    <span className="text-[10px] text-[#71717a] font-medium">21.9%</span>
                  </div>
                  <div className="absolute bottom-5 left-6 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Decoration</span>
                    <span className="text-[10px] text-[#71717a] font-medium">20.6%</span>
                  </div>
                  <div className="absolute top-14 -left-3 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Venue</span>
                    <span className="text-[10px] text-[#71717a] font-medium">10.9%</span>
                  </div>
                  <div className="absolute top-3 left-6 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Staff</span>
                    <span className="text-[10px] text-[#71717a] font-medium">5.8%</span>
                  </div>
                  <div className="absolute -top-5 left-20 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-[#1d1d1f]">Marketing</span>
                    <span className="text-[10px] text-[#71717a] font-medium">2.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses List Table */}
            <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
               <div className="w-full overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-gray-100">
                       <th className="py-6 px-8 text-[9px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase">Expense</th>
                       <th className="py-6 px-8 text-[9px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase">Category</th>
                       <th className="py-6 px-8 text-[9px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase">Amount</th>
                       <th className="py-6 px-8 text-[9px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase">Status</th>
                       <th className="py-6 px-8 text-[9px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase">Date</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100/60">
                     <tr className="hover:bg-[#fef9ec]/30 transition-colors">
                       <td className="py-5 px-8 text-[12.5px] font-semibold text-[#1d1d1f]">Florist deposit - Bloom & Blossom</td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Decoration</td>
                       <td className="py-5 px-8 text-[12.5px] font-bold text-[#1d1d1f]">₱60,000</td>
                       <td className="py-5 px-8"><span className="bg-[#e6fcf5] text-[#166534] px-3 py-1.5 rounded-[6px] text-[9px] font-black tracking-[0.2em] uppercase">paid</span></td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">May 15, 2026</td>
                     </tr>
                     <tr className="hover:bg-[#fef9ec]/30 transition-colors">
                       <td className="py-5 px-8 text-[12.5px] font-semibold text-[#1d1d1f]">Catering advance - Saveur Co.</td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Catering</td>
                       <td className="py-5 px-8 text-[12.5px] font-bold text-[#1d1d1f]">₱175,000</td>
                       <td className="py-5 px-8"><span className="bg-[#fef9ec] text-[#eebf43] px-3 py-1.5 rounded-[6px] text-[9px] font-black tracking-[0.2em] uppercase">pending</span></td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Aug 15, 2026</td>
                     </tr>
                     <tr className="hover:bg-[#fef9ec]/30 transition-colors">
                       <td className="py-5 px-8 text-[12.5px] font-semibold text-[#1d1d1f]">Photography deposit - LensArt</td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Equipment</td>
                       <td className="py-5 px-8 text-[12.5px] font-bold text-[#1d1d1f]">₱47,500</td>
                       <td className="py-5 px-8"><span className="bg-[#e6fcf5] text-[#166534] px-3 py-1.5 rounded-[6px] text-[9px] font-black tracking-[0.2em] uppercase">paid</span></td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Jun 25, 2026</td>
                     </tr>
                     <tr className="hover:bg-[#fef9ec]/30 transition-colors">
                       <td className="py-5 px-8 text-[12.5px] font-semibold text-[#1d1d1f]">Lighting rental - Premiere Lighting</td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Equipment</td>
                       <td className="py-5 px-8 text-[12.5px] font-bold text-[#1d1d1f]">₱32,500</td>
                       <td className="py-5 px-8"><span className="bg-[#e6fcf5] text-[#166534] px-3 py-1.5 rounded-[6px] text-[9px] font-black tracking-[0.2em] uppercase">paid</span></td>
                       <td className="py-5 px-8 text-[12.5px] text-[#71717a]">Sep 20, 2026</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
        </div>
      )}

      {/* Invoices Placeholder (Tab 3) */}
      {activeTab === 'invoices' && (
        <div className="animate-in fade-in duration-500 bg-white p-12 rounded-[24px] border border-gray-200/60 shadow-sm text-center">
             <div className="mx-auto w-16 h-16 bg-[#fafafa] rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="text-[#a1a1aa]" size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Client Invoicing & Receivables</h2>
            <p className="text-[#71717a] text-sm max-w-md mx-auto mb-6">Create invoice artifacts, track partial payments, send reminders effortlessly, and retrieve settled payments automatically through Stripe sync.</p>
            <button className="bg-white border border-gray-200 text-[#1d1d1f] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition shadow-sm">
                Generate Invoice
            </button>
        </div>
      )}

      {/* Generic UI Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            {modal.title === 'Add Expense' ? (
              <div className="bg-[#fffdf8] p-8 rounded-[24px] shadow-[0_2px_15px_-6px_rgba(0,0,0,0.03)] border border-[#f3ecd5]">
                {/* Inner modal card layout matching screenshot */}
                <div className="mb-6 flex flex-col gap-1.5">
                  <h4 className="text-[17px] font-bold text-[#1d1d1f] tracking-tight">Add Expense</h4>
                  <p className="text-[#a1a1aa] text-[13px] leading-relaxed max-w-[320px]">
                    Input an expense for this event. These details will be added to the financial breakdown.
                  </p>
                </div>

                <form className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase ml-1">Expense Title</label>
                    <input type="text" placeholder="e.g. Florist deposit" className="bg-white border border-[#eaeaea] rounded-[16px] px-5 py-4 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/30 transition-shadow" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase ml-1">Amount (₱)</label>
                    <input type="number" placeholder="0.00" className="bg-white border border-[#eaeaea] rounded-[16px] px-5 py-4 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/30 transition-shadow" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase ml-1">Category</label>
                      <select className="bg-white border border-[#eaeaea] rounded-[16px] px-5 py-4 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/30 transition-shadow appearance-none">
                        <option value="">Select category</option>
                        <option value="catering">Catering</option>
                        <option value="equipment">Equipment</option>
                        <option value="decoration">Decoration</option>
                        <option value="venue">Venue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.2em] uppercase ml-1">Status</label>
                      <select className="bg-white border border-[#eaeaea] rounded-[16px] px-5 py-4 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#eebf43]/30 transition-shadow appearance-none">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[#f3ecd5] my-2"></div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setModal({ ...modal, isOpen: false })}
                      className="flex-1 bg-white border border-[#eaeaea] text-[#1d1d1f] rounded-[24px] py-4 text-[11px] font-black tracking-[0.2em] uppercase hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={() => setModal({ ...modal, isOpen: false })}
                      className="flex-1 bg-[#1d1d1f] text-white rounded-[24px] py-4 text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#2d2d2f] transition-colors shadow-sm"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
                <div className="w-12 h-12 rounded-[16px] bg-[#fffdf8] border border-[#eebf43]/20 flex items-center justify-center mb-6">
                  <Info size={24} className="text-[#eebf43]" />
                </div>
                <h3 className="text-xl font-black text-[#1d1d1f] mb-2 tracking-tight">{modal.title}</h3>
                <p className="text-[13px] font-medium text-[#71717a] leading-relaxed mb-8">{modal.message}</p>
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="w-full py-4 bg-[#1d1d1f] text-white rounded-[16px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors shadow-md"
                >
                  Understood
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
