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
  BarChart3
} from 'lucide-react';

// Main component reproducing the "Event Oversight" inspiration dashboard
export default function FinancesAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');

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
          <button className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 text-[#0f172a] text-[11px] font-black tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors rounded-xl shadow-sm">
            <Download size={14} className="text-[#0f172a]" /> Export Ledger
          </button>
          <button className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20">
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
            
            {/* Profitability Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-4">Net Profitability</p>
                <div className="flex items-end gap-3 mb-3">
                  <h2 className="text-[44px] font-black text-[#1d1d1f] leading-none tracking-tight">$142,850</h2>
                </div>
                <div className="flex items-center gap-2 mb-8">
                  <span className="bg-[#fef9ec] text-[#a88231] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#eebf43]/20">Healthy</span>
                  <span className="text-[#a1a1aa] text-[11px] font-medium">Post-projection</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest">Progress to goal</p>
                  <p className="text-sm font-black text-[#1d1d1f]">79.4%</p>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#eebf43] h-full rounded-full" style={{ width: '79.4%' }}></div>
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 mb-6">
                <TrendingUp size={16} className="text-[#eebf43]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Revenue</p>
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">$312,400</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  Consolidated from receipts and ticket scales.
                </p>
              </div>
            </div>

            {/* Total Expenses Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 mb-6">
                <Wallet size={16} className="text-[#71717a]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Expenses</p>
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">$169,550</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  54% of total budget utilized. Vendor contracts and ad-hoc spend included.
                </p>
              </div>
            </div>

          </div>

          {/* Detailed Lists: Revenue vs Expenditures */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Revenue List */}
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-lg font-black text-[#1d1d1f]">Revenue Sources</h3>
                <span className="text-[#eebf43] text-[10px] font-bold uppercase tracking-widest bg-[#eebf43]/10 px-3 py-1 rounded-full">Live Syncing</span>
              </div>
              
              <div className="space-y-4">
                {/* Item 1 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <Ticket size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Grand Ballroom Tickets</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Direct Purchase • Mar 12</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">+$84,500</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-widest">Verified</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <Star size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Luminary Sponsorship</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Corporate Wire • Mar 10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">+$150,000</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-widest">Settled</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <CreditCard size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Silent Auction Proceeds</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Stripe Sync • Mar 09</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">+$77,900</p>
                    <p className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest">Processing</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-gray-200 text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest hover:text-[#1d1d1f] hover:border-gray-300 transition-colors text-center">
                Load All Revenue Sources
              </button>
            </div>

            {/* Expenditures List */}
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-lg font-black text-[#1d1d1f]">Expenditures</h3>
                <button className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors">
                  <Filter size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Item 1 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <Utensils size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Elite Catering Inc.</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Contract #442 • Vendor</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">-$92,400</p>
                    <p className="text-[#71717a] text-[9px] font-bold uppercase tracking-widest">Contract</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <PenTool size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Calligraphy Printing</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Ad-hoc • Manual Entry</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">-$2,150</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-widest">Manual</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 group-hover:border-[#eebf43]/30 transition-colors">
                      <Flower size={18} className="text-[#71717a] group-hover:text-[#eebf43] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1d1d1f] mb-0.5">Floral Installations</h4>
                      <p className="text-[#a1a1aa] text-[11px] font-medium">Service • Manual Entry</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1d1d1f] font-black text-[15px] mb-1">-$25,000</p>
                    <p className="text-[#eebf43] text-[9px] font-bold uppercase tracking-widest">Manual</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-gray-200 text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest hover:text-[#1d1d1f] hover:border-gray-300 transition-colors text-center">
                Load All Expenditures
              </button>
            </div>

          </div>

          {/* Bottom Fiscal Performance Summary Banner */}
          <div className="bg-[#fef9ec] rounded-[32px] p-8 md:p-12 border border-[#eebf43]/20 flex flex-col md:flex-row items-center gap-10 lg:gap-16 shadow-sm">
            {/* Donut Chart representation */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white drop-shadow-sm"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#eebf43]"
                  strokeWidth="3.5"
                  strokeDasharray="45.7, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#1d1d1f] tracking-tighter">45.7%</span>
                <span className="text-[8px] font-bold text-[#a88231] uppercase tracking-widest mt-1">Profit Margin</span>
              </div>
            </div>

            {/* Summary Text context */}
            <div className="flex-1">
              <h3 className="text-2xl font-black mb-4 tracking-tight text-[#1d1d1f]">
                Fiscal <span className="text-[#eebf43]">Performance Summary</span>
              </h3>
              <p className="text-[#71717a] text-sm leading-relaxed mb-8 max-w-2xl font-medium">
                Current profit margins have reached 45.7%, significantly outpacing the historical baseline of 38%. Optimization is largely attributed to refined vendor negotiation and streamlined operational logistics. Automatic reconciliation from receipts is saving ~14 hours of manual labor per week.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white px-5 py-3 rounded-xl border border-[#eebf43]/30 shadow-sm flex flex-col gap-1">
                  <span className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest">Status</span>
                  <span className="text-[#eebf43] text-xs font-bold flex items-center gap-1.5"><Activity size={12}/> High Efficiency</span>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                  <span className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest">Audit</span>
                  <span className="text-[#1d1d1f] text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={12} className="text-[#1d1d1f]"/> Clean & Verified</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {/* Expanse Tracking Placeholder (Tab 2) */}
      {activeTab === 'expenses' && (
        <div className="animate-in fade-in duration-500 bg-white p-12 rounded-[24px] border border-gray-200/60 shadow-sm text-center">
            <div className="mx-auto w-16 h-16 bg-[#fafafa] rounded-full flex items-center justify-center mb-4">
                <PieChartIcon className="text-[#a1a1aa]" size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Expense Categorization Overview</h2>
            <p className="text-[#71717a] text-sm max-w-md mx-auto mb-6">Detailed breakdowns of overhead, logistics, staffing, and technical expenditures will be surfaced here based on uploaded contracts and records.</p>
            <button className="bg-[#eebf43] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#dcae32] transition">
                Upload New Receipt
            </button>
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

    </div>
  );
}
