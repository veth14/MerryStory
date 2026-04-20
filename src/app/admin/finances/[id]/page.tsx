'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Download,
  Info,
  X,
  Briefcase,
  Target,
  Plus, 
  TrendingUp, 
  Wallet, 
  Receipt,
  MoreHorizontal,
  ArrowRight,
  BarChart3,
  Calendar,
} from 'lucide-react';


const MOCK_FINANCES: Record<string, any> = {
  "1": {
    eventName: "Starlight Gala 2026",
    totalBudget: "₱500,000",
    totalExpenses: "₱315,000",
    utilization: "63%",
    remaining: "₱185,000",
    totalInvoiced: "₱850,000",
    totalReceived: "₱500,000",
    outstanding: "₱350,000",
    upcomingPayments: [
      { entity: "Lumina Floral Studio", type: "Final Payment", amount: "₱45,000", due: "Oct 25", days: "5 days" },
      { entity: "Grand Horizon Venue", type: "Balance", amount: "₱120,000", due: "Nov 01", days: "12 days" },
      { entity: "AudioVision Tech", type: "Deposit", amount: "₱35,000", due: "Nov 15", days: "26 days" }
    ],
    recentExpenses: [
      { date: "Oct 12", desc: "Sunset Banquet Hall", subtitle: "Initial Deposit", amount: "₱85,000", status: "Cleared" },
      { date: "Oct 10", desc: "Apex Corp Logistics", subtitle: "Equipment Rental", amount: "₱50,000", status: "Cleared" },
      { date: "Oct 05", desc: "Harmony Catering", subtitle: "Tasting & Menu Lock", amount: "₱15,000", status: "Cleared" },
      { date: "Oct 02", desc: "Vanguard Security", subtitle: "Retainer Fee", amount: "₱20,000", status: "Cleared" },
      { date: "Sep 28", desc: "Creative Media Ads", subtitle: "Campaign Launch", amount: "₱40,000", status: "Cleared" },
      { date: "Sep 25", desc: "Starlight Permits", subtitle: "City Processing", amount: "₱12,500", status: "Cleared" }
    ],
    invoices: [
      { id: "INV-2026-004", client: "Starlight Gala Organizers", issue: "Oct 15, 2026", due: "Nov 01, 2026", amount: "₱150,000", status: "Pending" },
      { id: "INV-2026-003", client: "Apex Corp Sponsorship", issue: "Oct 01, 2026", due: "Oct 15, 2026", amount: "₱200,000", status: "Overdue" },
      { id: "INV-2026-002", client: "Starlight Gala Organizers", issue: "Sep 15, 2026", due: "Sep 30, 2026", amount: "₱250,000", status: "Paid" },
      { id: "INV-2026-001", client: "Starlight Gala Organizers", issue: "Sep 01, 2026", due: "Sep 15, 2026", amount: "₱250,000", status: "Paid" }
    ]
  },
  "2": {
    eventName: "Tech Summit 2026",
    totalBudget: "₱1,200,000",
    totalExpenses: "₱450,000",
    utilization: "37%",
    remaining: "₱750,000",
    totalInvoiced: "₱1,500,000",
    totalReceived: "₱900,000",
    outstanding: "₱600,000",
    upcomingPayments: [
      { entity: "Convention Center", type: "Final Payment", amount: "₱200,000", due: "Oct 30", days: "10 days" },
      { entity: "A/V Pros", type: "Balance", amount: "₱150,000", due: "Nov 05", days: "16 days" }
    ],
    recentExpenses: [
      { date: "Oct 18", desc: "Convention Center", subtitle: "Initial Deposit", amount: "₱200,000", status: "Cleared" },
      { date: "Oct 15", desc: "Catering Plus", subtitle: "Menu Sync", amount: "₱100,000", status: "Cleared" }
    ],
    invoices: [
      { id: "INV-TS26-002", client: "Google Sponsorship", issue: "Oct 10, 2026", due: "Oct 25, 2026", amount: "₱500,000", status: "Pending" },
      { id: "INV-TS26-001", client: "Microsoft Sponsorship", issue: "Oct 01, 2026", due: "Oct 15, 2026", amount: "₱400,000", status: "Paid" }
    ]
  },
  "3": {
    eventName: "Symphony Charity Ball",
    totalBudget: "₱300,000",
    totalExpenses: "₱285,000",
    utilization: "95%",
    remaining: "₱15,000",
    totalInvoiced: "₱400,000",
    totalReceived: "₱400,000",
    outstanding: "₱0",
    upcomingPayments: [
      { entity: "Elite Strings", type: "Performance Fee", amount: "₱15,000", due: "Oct 22", days: "2 days" }
    ],
    recentExpenses: [
      { date: "Oct 10", desc: "Grand Plaza", subtitle: "Venue Full", amount: "₱150,000", status: "Cleared" },
      { date: "Oct 08", desc: "Luxury Dining", subtitle: "Catering", amount: "₱120,000", status: "Cleared" }
    ],
    invoices: [
      { id: "INV-SCB-001", client: "Philanthropic Trust", issue: "Sep 01, 2026", due: "Sep 15, 2026", amount: "₱400,000", status: "Paid" }
    ]
  }
};

export default function FinancesAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const params = useParams();
  const id = (params?.id as string) || '1';
  const eventData = MOCK_FINANCES[id] || MOCK_FINANCES['1'];

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      
      {/* Breadcrumb / Top Navigation Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Financials <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{eventData.eventName}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#eebf43] italic pr-2">Oversight</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Comprehensive fiscal performance report. Automatically retrieves payments from uploaded receipts and deducts contracted vendor expenses.
          </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Total Budget Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100 mb-6">
                <TrendingUp size={16} className="text-[#eebf43]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Budget</p>
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">{eventData.totalBudget}</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  Allocated budget for the entire event lifecycle.
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
                <h2 className="text-[38px] font-black text-[#1d1d1f] leading-none tracking-tight mb-6">{eventData.totalExpenses}</h2>
                <p className="text-[#a1a1aa] text-xs font-medium leading-relaxed">
                  {eventData.utilization} of total budget utilized. Vendor contracts and ad-hoc spend included.
                </p>
              </div>
            </div>

          </div>

          {/* Additional Overview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Budget Utilization Progress & Upcoming Liabilities */}
            <div className="space-y-6">
              {/* Budget Utilization Card */}
              <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={120} className="text-[#eebf43]" />
                </div>
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase mb-8 relative z-10">Budget Utilization</h3>
                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-4xl font-black text-[#1d1d1f] tracking-tighter">{eventData.utilization}</span>
                    <span className="text-[10px] font-extrabold text-[#71717a] uppercase tracking-widest px-3 py-1 bg-gray-50 rounded-full border border-gray-100">Spent</span>
                  </div>
                  <div className="w-full h-8 bg-gray-50 rounded-full overflow-hidden mb-5 border border-gray-100/50 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#f4d98a] to-[#eebf43] rounded-full relative" style={{ width: eventData.utilization }}>
                        <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 transform origin-bottom -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-red-50 text-red-900 px-4 py-3 rounded-2xl border border-red-100/50">
                     <Wallet size={16} className="text-red-500" />
                     <p className="text-xs font-bold leading-relaxed">
                       Remaining Balance: <span className="font-black text-red-600">{eventData.remaining}</span>
                     </p>
                  </div>
                </div>
              </div>

              {/* Upcoming Payments Card */}
              <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Approaching Due Dates</h3>
                    <div className="p-2 bg-[#fafafa] rounded-full border border-gray-100">
                        <Calendar size={14} className="text-[#a1a1aa]" />
                    </div>
                </div>
                <div className="space-y-4">
                  {[
                    { entity: "Lumina Floral Studio", type: "Final Payment", amount: "₱45,000", due: "Oct 25", days: "5 days" },
                    { entity: "Grand Horizon Venue", type: "Balance", amount: "₱120,000", due: "Nov 01", days: "12 days" },
                    { entity: "AudioVision Tech", type: "Deposit", amount: "₱35,000", due: "Nov 15", days: "26 days" }
                  ].map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-[16px] bg-[#fafafa] border border-gray-100 hover:border-[#eebf43]/50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm text-[#1d1d1f] font-black text-xs">
                            {payment.due.split(" ")[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-[#1d1d1f] mb-1">{payment.entity}</span>
                            <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">{payment.type}</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-[#1d1d1f]">{payment.amount}</span>
                        <span className="text-[10px] text-[#eebf43] font-bold mt-1">In {payment.days}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Financial Activity Card */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100/60">
                <div>
                   <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Recent Expenditures</h3>
                   <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider">LATEST CONFIRMED DEDUCTIONS</p>
                </div>
                <button onClick={() => setActiveTab("expenses")} className="px-4 py-2 bg-[#fafafa] rounded-full text-[10px] font-bold text-[#1d1d1f] uppercase tracking-widest hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm flex items-center gap-2">View All <ArrowRight size={10} /></button>
              </div>
              <div className="space-y-4 flex-1">
                {[
                  { date: "Oct 12", desc: "Sunset Banquet Hall", subtitle: "Initial Deposit", amount: "₱85,000", status: "Cleared" },
                  { date: "Oct 10", desc: "Apex Corp Logistics", subtitle: "Equipment Rental", amount: "₱50,000", status: "Cleared" },
                  { date: "Oct 05", desc: "Harmony Catering", subtitle: "Tasting & Menu Lock", amount: "₱15,000", status: "Cleared" },
                  { date: "Oct 02", desc: "Vanguard Security", subtitle: "Retainer Fee", amount: "₱20,000", status: "Cleared" },
                  { date: "Sep 28", desc: "Creative Media Ads", subtitle: "Campaign Launch", amount: "₱40,000", status: "Cleared" },
                  { date: "Sep 25", desc: "Starlight Permits", subtitle: "City Processing", amount: "₱12,500", status: "Cleared" }
                ].map((tx, idx) => (
                  <div key={idx} className="group flex justify-between items-center p-4 rounded-[16px] hover:bg-[#fafafa] transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm group-hover:bg-white transition-colors">
                        <Receipt size={14} className="text-[#a1a1aa] group-hover:text-[#1d1d1f] transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#1d1d1f] mb-1">{tx.desc}</span>
                        <span className="text-[10px] text-[#71717a] font-bold tracking-wider">{tx.date} � {tx.subtitle}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-[#1d1d1f]">- {tx.amount}</span>
                      <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100/50 uppercase tracking-widest">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
        </div>
      )}

      {/* Expense Tracking Placeholder (Tab 2) */}


      {activeTab === 'expenses' && (
        <div className="animate-in fade-in duration-500 w-full space-y-6">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Expenses Card */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Expenses</p>
                <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">₱315,000</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                <Wallet size={20} className="text-[#a1a1aa]" />
              </div>
            </div>

            {/* Expense Records Card */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Expense Records</p>
                <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">24</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                <Receipt size={20} className="text-[#a1a1aa]" />
              </div>
            </div>
          </div>

          {/* Split Row: Donut Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Categorization Donut Chart (1/3 width) */}
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Expenses by Category</h3>
                <button className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* CSS-based Donut placeholder matching the style */}
                <div className="w-[180px] h-[180px] rounded-full flex items-center justify-center" 
                     style={{ background: 'conic-gradient(#eebf43 0% 45%, #f4d98a 45% 75%, #f9f1d8 75% 100%)' }}>
                  <div className="w-[140px] h-[140px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="text-2xl font-black text-[#1d1d1f]">45%</span>
                      <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest">Venue</span>
                  </div>
                </div>
                
                {/* Legend below donut */}
                <div className="w-full mt-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#eebf43]"></div>
                      <span className="text-xs font-semibold text-[#71717a]">Venue</span>
                    </div>
                    <span className="text-xs font-black text-[#1d1d1f]">₱141,750</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#f4d98a]"></div>
                      <span className="text-xs font-semibold text-[#71717a]">Catering</span>
                    </div>
                    <span className="text-xs font-black text-[#1d1d1f]">₱94,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#f9f1d8]"></div>
                      <span className="text-xs font-semibold text-[#71717a]">Marketing</span>
                    </div>
                    <span className="text-xs font-black text-[#1d1d1f]">₱78,750</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Table (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Detailed Records</h3>
                <button 
                  onClick={() => setModal({ isOpen: true, title: 'Add Expense', message: '' })}
                  className="bg-[#eebf43] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors shadow-sm flex items-center gap-2 shrink-0"
                >
                  <Plus size={14} strokeWidth={3} />
                  Add Expense
                </button>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="py-4 px-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-gray-100 bg-[#fafafa]/50 first:rounded-tl-xl w-1/3">Expense</th>
                      <th className="py-4 px-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-gray-100 bg-[#fafafa]/50">Category</th>
                      <th className="py-4 px-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-gray-100 bg-[#fafafa]/50 text-right">Amount</th>
                      <th className="py-4 px-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-gray-100 bg-[#fafafa]/50">Status</th>
                      <th className="py-4 px-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-gray-100 bg-[#fafafa]/50 last:rounded-tr-xl">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1 */}
                    <tr 
                      onClick={() => triggerModal('Expense Details', 'Title: Venue Deposit\nVendor: Grand Ballroom C\nCategory: Venue\nAmount: ₱50,000\nStatus: Paid\nDate: Oct 15, 2026\n\nNotes: Initial downpayment.')}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f9f1d8] flex items-center justify-center shrink-0">
                                  <span className="text-[#dcae32] font-black text-[10px]">VE</span>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors truncate max-w-[120px]">Venue Deposit</p>
                                  <p className="text-[10px] text-[#a1a1aa] font-medium truncate max-w-[120px]">Grand Ballroom C</p>
                              </div>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100">
                              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Venue</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 text-right">
                          <span className="text-xs font-black text-[#1d1d1f]">₱50,000</span>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center gap-1.5 flex-nowrap">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                              <span className="text-[11px] font-bold text-emerald-600">Paid</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <span className="text-[10px] font-bold text-[#a1a1aa] tracking-wider uppercase">OCT 15</span>
                      </td>
                    </tr>
                    
                    {/* Row 2 */}
                    <tr 
                      onClick={() => triggerModal('Expense Details', 'Title: VIP Catering\nVendor: Stella\'s Kitchen\nCategory: Catering\nAmount: ₱15,000\nStatus: Pending\nDate: Oct 18, 2026\n\nNotes: Sponsor dinner cost.')}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f9f1d8] flex items-center justify-center shrink-0">
                                  <span className="text-[#dcae32] font-black text-[10px]">CA</span>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors truncate max-w-[120px]">VIP Catering</p>
                                  <p className="text-[10px] text-[#a1a1aa] font-medium truncate max-w-[120px]">Stella's Kitchen</p>
                              </div>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100">
                              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Catering</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 text-right">
                          <span className="text-xs font-black text-[#1d1d1f]">₱15,000</span>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center gap-1.5 flex-nowrap">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[11px] font-bold text-amber-600">Pending</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <span className="text-[10px] font-bold text-[#a1a1aa] tracking-wider uppercase">OCT 18</span>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr 
                      onClick={() => triggerModal('Expense Details', 'Title: Social Ads\nVendor: Meta / IG\nCategory: Marketing\nAmount: ₱8,500\nStatus: Paid\nDate: Oct 20, 2026\n\nNotes: Content boosting.')}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 border-b border-gray-50 last:border-b-0">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f9f1d8] flex items-center justify-center shrink-0">
                                  <span className="text-[#dcae32] font-black text-[10px]">MK</span>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors truncate max-w-[120px]">Social Ads</p>
                                  <p className="text-[10px] text-[#a1a1aa] font-medium truncate max-w-[120px]">Meta / IG</p>
                              </div>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 last:border-b-0">
                          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100">
                              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Marketing</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 last:border-b-0 text-right">
                          <span className="text-xs font-black text-[#1d1d1f]">₱8,500</span>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 last:border-b-0">
                          <div className="inline-flex items-center gap-1.5 flex-nowrap">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                              <span className="text-[11px] font-bold text-emerald-600">Paid</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 last:border-b-0">
                          <span className="text-[10px] font-bold text-[#a1a1aa] tracking-wider uppercase">OCT 20</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices (Tab 3) */}
      {activeTab === 'invoices' && (
        <div className="animate-in fade-in duration-500 w-full space-y-8">
          
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Invoiced */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Invoiced</p>
                <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">{eventData.totalInvoiced}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                <Receipt size={20} className="text-[#a1a1aa]" />
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Received</p>
                <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">{eventData.totalReceived}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                <TrendingUp size={20} className="text-green-500" />
              </div>
            </div>

            {/* Outstanding */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Outstanding Balance</p>
                <h2 className="text-[32px] font-black text-red-600 leading-none tracking-tight">{eventData.outstanding}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <Wallet size={20} className="text-red-500" />
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-8 border-b border-gray-100/60 flex justify-between items-center bg-[#fafafa]">
                <div>
                  <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Invoice Artifacts</h3>
                  <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider">CLIENT & SPONSOR BILLING</p>
                </div>
                <button className="px-5 py-2.5 bg-[#eebf43] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors border border-transparent flex items-center gap-2 shadow-sm">
                  <Plus size={14} /> Generate Invoice
                </button>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 uppercase text-[10px] font-black text-[#a1a1aa] tracking-widest">
                    <th className="py-4 px-8 font-extrabold whitespace-nowrap">Invoice #</th>
                    <th className="py-4 px-8 font-extrabold">Client / Sponsor</th>
                    <th className="py-4 px-8 font-extrabold">Issued Date</th>
                    <th className="py-4 px-8 font-extrabold">Due Date</th>
                    <th className="py-4 px-8 font-extrabold text-right">Amount (₱)</th>
                    <th className="py-4 px-8 font-extrabold text-center">Status</th>
                    <th className="py-4 px-8 font-extrabold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-[#71717a] divide-y divide-gray-50">
                  {[
                    { id: "INV-2026-004", client: "Starlight Gala Organizers", issue: "Oct 15, 2026", due: "Nov 01, 2026", amount: "₱150,000", status: "Pending" },
                    { id: "INV-2026-003", client: "Apex Corp Sponsorship", issue: "Oct 01, 2026", due: "Oct 15, 2026", amount: "₱200,000", status: "Overdue" },
                    { id: "INV-2026-002", client: "Starlight Gala Organizers", issue: "Sep 15, 2026", due: "Sep 30, 2026", amount: "₱250,000", status: "Paid" },
                    { id: "INV-2026-001", client: "Starlight Gala Organizers", issue: "Sep 01, 2026", due: "Sep 15, 2026", amount: "₱250,000", status: "Paid" }
                  ].map((inv, idx) => (
                    <tr key={idx} className="hover:bg-[#fafafa] transition-colors group cursor-default">
                      <td className="py-4 px-8 font-black text-[#1d1d1f]">{inv.id}</td>
                      <td className="py-4 px-8 font-bold text-[#1d1d1f]">{inv.client}</td>
                      <td className="py-4 px-8 text-[#a1a1aa]">{inv.issue}</td>
                      <td className="py-4 px-8 font-bold">{inv.due}</td>
                      <td className="py-4 px-8 font-black text-[#1d1d1f] text-right">{inv.amount}</td>
                      <td className="py-4 px-8 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border ${
                          inv.status === "Paid" ? "bg-green-50 text-green-600 border-green-100/50" : 
                          inv.status === "Pending" ? "bg-yellow-50 text-yellow-600 border-yellow-100/50" : 
                          "bg-red-50 text-red-600 border-red-100/50"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-8">
                          <div className="flex items-center justify-center">
                              <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#a1a1aa] hover:bg-white hover:text-[#1d1d1f] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                  <Download size={14} />
                              </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {/* Generic UI Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1d1d1f] transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>

            {modal.title === 'Add Expense' ? (
              <div>
                <div className="mb-8">
                  <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-1.5">Add Expense</h3>
                  <p className="text-[13px] font-medium text-[#71717a]">
                    Input an expense for this event. These details will be added to the financial breakdown.
                  </p>
                </div>

                <form className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Expense Title</label>
                    <input type="text" placeholder="e.g. Florist deposit" className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Amount (₱)</label>
                    <input type="number" placeholder="0.00" className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Category</label>
                      <select className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow appearance-none">
                        <option value="">Select category</option>
                        <option value="catering">Catering</option>
                        <option value="equipment">Equipment</option>
                        <option value="decoration">Decoration</option>
                        <option value="venue">Venue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Status</label>
                      <select className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow appearance-none">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4 w-full">
                    <button 
                      type="button"
                      onClick={() => setModal({ ...modal, isOpen: false })}
                      className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1d1d1f] rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={() => setModal({ ...modal, isOpen: false })}
                      className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#dcae32] transition-colors shadow-sm"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-1.5">{modal.title}</h3>
                  <p className="text-[13px] font-medium text-[#71717a] leading-relaxed">{modal.message}</p>
                </div>
                <div className="flex gap-4 w-full mt-4">
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1d1d1f] rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#dcae32] transition-colors shadow-sm"
                  >
                    Understood
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
