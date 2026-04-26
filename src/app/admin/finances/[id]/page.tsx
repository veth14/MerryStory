'use client';
import React, { useState, useEffect } from 'react';
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
  Loader,
} from 'lucide-react';
import { getFirebaseClientAuth } from '@/lib/firebase/client';

interface FinancialData {
  eventName: string;
  eventId: string;
  totalBudget: string;
  totalExpenses: string;
  utilization: string;
  remaining: string;
  totalInvoiced: string;
  totalReceived: string;
  outstanding: string;
  upcomingPayments: Array<{ entity: string; type: string; amount: string; due: string; days: string }>;
  recentExpenses: Array<{ id: string; date: string; desc: string; subtitle: string; category: string; amount: string; status: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; client: string; issue: string; due: string; amount: string; status: string }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
}

export default function FinancesAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [eventData, setEventData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Add Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', vendor: '', amount: '', category: 'venue', status: 'pending', dueDate: '' });
  const [expenseLoading, setExpenseLoading] = useState(false);
  
  // Generate Invoice Modal State
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', clientName: '', amount: '', issueDate: '', dueDate: '', status: 'pending', description: '' });
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const params = useParams();
  const id = (params?.id as string) || '';

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !id) return;

    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const auth = getFirebaseClientAuth();
        
        // Get current user and their token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const token = await user.getIdToken();
        
        const response = await fetch(`/api/finances/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch financial data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEventData(data);
        setError(null);
        
        // Auto-select the category with highest amount
        if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
          const highest = data.categoryBreakdown.reduce((prev: any, current: any) => 
            current.amount > prev.amount ? current : prev
          );
          setSelectedCategory(highest.category);
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFinancialData();
    }
  }, [id, hydrated]);

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  // Generate conic-gradient string from category breakdown
  const generateConicGradient = (breakdown: Array<{ category: string; amount: number; percentage: number }>) => {
    const colors = ['#eebf43', '#f4d98a', '#f9f1d8', '#dcae32', '#c7925a', '#b37b3c'];
    let gradientParts: string[] = [];
    let currentPercentage = 0;

    breakdown.forEach((item, idx) => {
      const color = colors[idx % colors.length];
      const nextPercentage = currentPercentage + item.percentage;
      gradientParts.push(`${color} ${currentPercentage}% ${nextPercentage}%`);
      currentPercentage = nextPercentage;
    });

    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setExpenseLoading(true);
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/finances/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor: expenseForm.vendor,
          description: expenseForm.title,
          amount: parseFloat(expenseForm.amount),
          dueDate: expenseForm.dueDate,
          status: expenseForm.status,
          paymentType: expenseForm.category
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add expense: ${response.statusText}`);
      }

      // Close modal and refresh data
      setShowAddExpenseModal(false);
      setExpenseForm({ title: '', vendor: '', amount: '', category: 'venue', status: 'pending', dueDate: '' });
      
      // Refresh financial data
      if (id) {
        const dataResponse = await fetch(`/api/finances/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setEventData(data);
        }
      }
      
      triggerModal('Success', 'Expense added successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      triggerModal('Error', err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  // Handle Generate Invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInvoiceLoading(true);
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/finances/${id}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceNumber: invoiceForm.invoiceNumber,
          clientName: invoiceForm.clientName,
          amount: parseFloat(invoiceForm.amount),
          issueDate: invoiceForm.issueDate,
          dueDate: invoiceForm.dueDate,
          status: invoiceForm.status,
          description: invoiceForm.description
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate invoice: ${response.statusText}`);
      }

      // Close modal and refresh data
      setShowGenerateInvoiceModal(false);
      setInvoiceForm({ invoiceNumber: '', clientName: '', amount: '', issueDate: '', dueDate: '', status: 'pending', description: '' });
      
      // Refresh financial data
      if (id) {
        const dataResponse = await fetch(`/api/finances/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setEventData(data);
        }
      }
      
      triggerModal('Success', 'Invoice generated successfully!');
    } catch (err) {
      console.error('Error generating invoice:', err);
      triggerModal('Error', err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20">
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-[#eebf43] mr-3" size={32} />
          <p className="text-[#71717a] text-lg">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !eventData) {
    return (
      <div className="w-full max-w-none text-[#1d1d1f] pb-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-700 font-medium text-lg">{error || 'Failed to load event data'}</p>
        </div>
      </div>
    );
  }

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
                  {eventData.upcomingPayments.length > 0 ? (
                    eventData.upcomingPayments.map((payment, idx) => (
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
                  ))
                  ) : (
                    <div className="text-center py-8 text-[#a1a1aa] text-sm">No upcoming payments</div>
                  )}
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
                {eventData.recentExpenses.length > 0 ? (
                  eventData.recentExpenses.map((tx, idx) => (
                    <div key={idx} className="group flex justify-between items-center p-4 rounded-[16px] hover:bg-[#fafafa] transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm group-hover:bg-white transition-colors">
                          <Receipt size={14} className="text-[#a1a1aa] group-hover:text-[#1d1d1f] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#1d1d1f] mb-1">{tx.desc}</span>
                          <span className="text-[10px] text-[#71717a] font-bold tracking-wider">{tx.date} – {tx.subtitle}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-[#1d1d1f]">- {tx.amount}</span>
                        <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100/50 uppercase tracking-widest">{tx.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#a1a1aa] text-sm">
                    No recent expenses
                  </div>
                )}
              </div>
            </div>

          </div>
          
        </div>
      )}

      {/* Expense Tracking Tab with CSS-based Donut Chart matching the image */}
{activeTab === 'expenses' && (
  <div className="animate-in fade-in duration-500 w-full space-y-6">
    
    {/* KPI Cards Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Expenses Card */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Expenses</p>
          <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">{eventData.totalExpenses}</h2>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
          <Wallet size={20} className="text-[#a1a1aa]" />
        </div>
      </div>

      {/* Expense Records Card */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Expense Records</p>
          <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">{eventData.recentExpenses.length}</h2>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
          <Receipt size={20} className="text-[#a1a1aa]" />
        </div>
      </div>
    </div>

    {/* Split Row: Donut Chart & Table */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Categorization Donut Chart (1/3 width) - Using CSS conic-gradient style from reference */}
      <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Expenses by Category</h3>
          <button className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {eventData.categoryBreakdown.length > 0 ? (
            <>
              {/* CSS-based Donut with dynamic conic-gradient from fetched data */}
              <div 
                className="w-[180px] h-[180px] rounded-full flex items-center justify-center mb-6 shadow-sm" 
                style={{ background: generateConicGradient(eventData.categoryBreakdown) }}
              >
                <div className="w-[140px] h-[140px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-black text-[#1d1d1f]">
                    {selectedCategory 
                      ? eventData.categoryBreakdown.find(c => c.category === selectedCategory)?.percentage 
                      : eventData.categoryBreakdown[0]?.percentage}%
                  </span>
                  <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mt-1 text-center px-2">
                    {selectedCategory || eventData.categoryBreakdown[0]?.category}
                  </span>
                </div>
              </div>
              
              {/* Dynamic Legend - generated from fetched data */}
              <div className="w-full mt-4 space-y-3">
                {eventData.categoryBreakdown.map((item, idx) => {
                  const colors = ['#eebf43', '#f4d98a', '#f9f1d8', '#dcae32', '#c7925a', '#b37b3c'];
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setSelectedCategory(item.category)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                        <span className="text-xs font-bold text-[#71717a] capitalize">{item.category}</span>
                      </div>
                      <span className="text-xs font-black text-[#1d1d1f]">₱{item.amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-[#a1a1aa]">No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table (2/3 width) */}
      <div className="lg:col-span-2 bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Detailed Records</h3>
          <button 
            onClick={() => setShowAddExpenseModal(true)}
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
              {eventData.recentExpenses.length > 0 ? (
                eventData.recentExpenses.map((expense, idx) => {
                  const categoryInitials = (expense.subtitle || 'EX').substring(0, 2).toUpperCase();
                  const statusColor = expense.status === 'Cleared' || expense.status === 'Paid' ? 'emerald' : expense.status === 'Pending' ? 'amber' : 'gray';
                  const displayStatus = expense.status === 'Cleared' ? 'Paid' : expense.status;
                  return (
                    <tr 
                      key={idx}
                      onClick={() => triggerModal('Expense Details', `Title: ${expense.desc}\nAmount: ${expense.amount}\nStatus: ${displayStatus}\nDate: ${expense.date}\n\nCategory: ${expense.subtitle}`)}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f9f1d8] flex items-center justify-center shrink-0">
                                  <span className="text-[#dcae32] font-black text-[10px]">{categoryInitials}</span>
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#eebf43] transition-colors truncate max-w-[120px]">{expense.desc}</p>
                                  <p className="text-[10px] text-[#a1a1aa] font-medium truncate max-w-[120px]">{expense.subtitle}</p>
                              </div>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100">
                              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">{expense.category || 'Other'}</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50 text-right">
                          <span className="text-xs font-black text-[#1d1d1f]">{expense.amount}</span>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <div className="inline-flex items-center gap-1.5 flex-nowrap">
                              <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-400`}></div>
                              <span className={`text-[11px] font-bold text-${statusColor}-600`}>{displayStatus}</span>
                          </div>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-50">
                          <span className="text-[10px] font-bold text-[#a1a1aa] tracking-wider uppercase">{expense.date}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-[#a1a1aa] text-sm font-medium">
                    No expenses yet. Add one to get started.
                  </td>
                </tr>
              )}
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
                <button 
                  onClick={() => setShowGenerateInvoiceModal(true)}
                  className="px-5 py-2.5 bg-[#eebf43] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-colors border border-transparent flex items-center gap-2 shadow-sm">
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
                  {eventData.invoices.length > 0 ? (
                    eventData.invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-[#fafafa] transition-colors group cursor-default">
                        <td className="py-4 px-8 font-black text-[#1d1d1f]">{inv.invoiceNumber}</td>
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 px-8 text-center text-[#a1a1aa] text-sm font-medium">
                        No invoices yet. Generate one to get started.
                      </td>
                    </tr>
                  )}
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
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1d1d1f] transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div>
              <div className="mb-8">
                <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-1.5">Add Expense</h3>
                <p className="text-[13px] font-medium text-[#71717a]">
                  Input an expense for this event. These details will be added to the financial breakdown.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleAddExpense}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Expense Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Florist deposit" 
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    required
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Vendor</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Grand Ballroom C" 
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    required
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Amount (₱)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    step="0.01"
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Due Date</label>
                  <input 
                    type="date" 
                    value={expenseForm.dueDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Category</label>
                    <select 
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow appearance-none"
                    >
                      <option value="catering">Catering</option>
                      <option value="equipment">Equipment</option>
                      <option value="decoration">Decoration</option>
                      <option value="venue">Venue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Status</label>
                    <select 
                      value={expenseForm.status}
                      onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow appearance-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-4 w-full">
                  <button 
                    type="button"
                    onClick={() => setShowAddExpenseModal(false)}
                    className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1d1d1f] rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={expenseLoading}
                    className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#dcae32] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {expenseLoading ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Expense'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setShowGenerateInvoiceModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1d1d1f] transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div>
              <div className="mb-8">
                <h3 className="text-[20px] font-bold text-[#1d1d1f] mb-1.5">Generate Invoice</h3>
                <p className="text-[13px] font-medium text-[#71717a]">
                  Create a new invoice for clients or sponsors.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleGenerateInvoice}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Invoice Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. INV-2026-001" 
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    required
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Client / Sponsor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Starlight Gala Organizers" 
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                    required
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Amount (₱)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    required
                    step="0.01"
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Issue Date</label>
                    <input 
                      type="date" 
                      value={invoiceForm.issueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Due Date</label>
                    <input 
                      type="date" 
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Status</label>
                  <select 
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow appearance-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-[#1d1d1f] tracking-[0.1em] uppercase">Description</label>
                  <textarea 
                    placeholder="e.g. Event sponsorship for Gala 2026" 
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow resize-none h-24" 
                  />
                </div>

                <div className="flex gap-4 mt-4 w-full">
                  <button 
                    type="button"
                    onClick={() => setShowGenerateInvoiceModal(false)}
                    className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1d1d1f] rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={invoiceLoading}
                    className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#dcae32] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {invoiceLoading ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Invoice'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
