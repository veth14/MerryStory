'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
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
  FileText,
  Send,
  Paperclip,
  ArrowLeft,
} from 'lucide-react';
import { getFirebaseClientAuth } from '@/lib/firebase/client';
import { CustomDatePicker, CustomSelect } from '@/components/ui/CustomInputs';
import Link from 'next/link';

const PESO_SYMBOL = '\u20B1';

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
  totalBudgetValue: number;
  totalExpensesValue: number;
  remainingValue: number;
  totalInvoicedValue: number;
  totalReceivedValue: number;
  outstandingValue: number;
  budgetStatus: 'within-limit' | 'exceeded';
  upcomingPayments: Array<{ entity: string; type: string; amount: string; due: string; days: string; dueDateIso?: string }>;
  recentExpenses: Array<{ id: string; date: string; dueDateIso?: string; desc: string; subtitle: string; category: string; amount: string; status: string; attachmentUrl?: string | null; attachmentName?: string | null }>;
  invoices: Array<{ id: string; invoiceNumber: string; client: string; issue: string; due: string; amount: string; status: string; description?: string; expenseId?: string; expenseLabel?: string }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
}

type ExpenseOption = {
  id: string;
  title: string;
  vendor: string;
};

type ExpenseFormState = {
  title: string;
  vendor: string;
  amount: string;
  category: string;
  status: string;
  dueDate: string;
  attachment: File | null;
};

const createEmptyExpenseForm = (): ExpenseFormState => ({
  title: '',
  vendor: '',
  amount: '',
  category: 'venue',
  status: 'pending',
  dueDate: '',
  attachment: null,
});

type InvoiceFormState = {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  status: string;
  expenseId: string;
  description: string;
};

const createEmptyInvoiceForm = (): InvoiceFormState => ({
  invoiceNumber: '',
  clientName: '',
  amount: '',
  issueDate: '',
  dueDate: '',
  status: 'pending',
  expenseId: '',
  description: '',
});

const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'catering', label: 'Catering', sublabel: 'Food, beverage, and dining' },
  { value: 'equipment', label: 'Equipment', sublabel: 'Gear, rentals, and staging' },
  { value: 'decoration', label: 'Decoration', sublabel: 'Styling, florals, and design' },
  { value: 'venue', label: 'Venue', sublabel: 'Rental fees and hall charges' },
  { value: 'other', label: 'Other', sublabel: 'Miscellaneous production costs' },
];

const EXPENSE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', sublabel: 'Awaiting settlement' },
  { value: 'paid', label: 'Paid', sublabel: 'Already cleared' },
];

const INVOICE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', sublabel: 'Awaiting payment' },
  { value: 'half-paid', label: 'Half Payment', sublabel: 'Partially received' },
  { value: 'paid', label: 'Paid', sublabel: 'Already received' },
  { value: 'overdue', label: 'Overdue', sublabel: 'Past the due date' },
];

function getDueDateParts(value?: string) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { month: 'TBD', day: '--', full: 'No due date' };
  }

  return {
    month: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: parsed.toLocaleDateString('en-US', { day: '2-digit' }),
    full: parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  };
}

function getBudgetStatusMeta(financialData: FinancialData) {
  const isExceeded = financialData.budgetStatus === 'exceeded' || financialData.remainingValue < 0;
  return isExceeded
    ? {
        label: 'Budget Exceeded',
        detail: `Expenses are over budget by ${PESO_SYMBOL}${Math.abs(financialData.remainingValue).toLocaleString()}.`,
        chipClass: 'bg-red-50 text-red-600 border-red-100',
        panelClass: 'bg-red-50 text-red-900 border-red-100/70',
        iconClass: 'text-red-500',
        progressClass: 'from-red-300 to-red-500',
      }
    : {
        label: 'Within Budget',
        detail: `Remaining balance is ${PESO_SYMBOL}${financialData.remainingValue.toLocaleString()}.`,
        chipClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        panelClass: 'bg-emerald-50 text-emerald-900 border-emerald-100/70',
        iconClass: 'text-emerald-500',
        progressClass: 'from-[#f4d98a] to-[#eebf43]',
      };
}

function getExpenseStatusMeta(status: string) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'paid' || normalized === 'cleared') {
    return {
      label: 'Paid',
      dotClass: 'bg-emerald-400',
      textClass: 'text-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    };
  }
  if (normalized === 'half payment' || normalized === 'half-paid') {
    return {
      label: 'Half Payment',
      dotClass: 'bg-orange-400',
      textClass: 'text-orange-600',
      badgeClass: 'bg-orange-50 text-orange-600 border-orange-100/50',
    };
  }
  return {
    label: 'Pending',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-100/50',
  };
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(createEmptyExpenseForm());
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseErrors, setExpenseErrors] = useState<Partial<Record<keyof ExpenseFormState, string>>>({});
  const [expenseOptions, setExpenseOptions] = useState<ExpenseOption[]>([]);
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<FinancialData['recentExpenses'][number] | null>(null);

  // Generate Invoice Modal State
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(createEmptyInvoiceForm());
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<FinancialData['invoices'][number] | null>(null);
  const [budgetStatusModalShown, setBudgetStatusModalShown] = useState(false);

  const params = useParams();
  const id = (params?.id as string) || '';

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setBudgetStatusModalShown(false);
  }, [id]);

  const loadFinancialData = async (tokenOverride?: string) => {
    try {
      setLoading(true);
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = tokenOverride || await user.getIdToken();
      const [response, expensesResponse] = await Promise.all([
        fetch(`/api/finances/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`/api/finances/${id}/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      if (!response.ok) {
        throw new Error(`Failed to fetch financial data: ${response.statusText}`);
      }

      const data = await response.json();
      setEventData(data);
      if (expensesResponse.ok) {
        const expenses = await expensesResponse.json();
        setExpenseOptions(
          Array.isArray(expenses)
            ? expenses.map((expense) => ({
                id: expense.id,
                title: expense.description || 'Untitled Expense',
                vendor: expense.vendor || 'Unknown Vendor',
              }))
            : []
        );
      } else {
        setExpenseOptions([]);
      }
      setError(null);

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

  useEffect(() => {
    if (!hydrated || !id) return;
    void loadFinancialData();
  }, [id, hydrated]);

  useEffect(() => {
    if (!hydrated || !eventData || budgetStatusModalShown || activeTab !== 'overview') return;
    const budgetMeta = getBudgetStatusMeta(eventData);
    if (budgetMeta.label !== 'Budget Exceeded') return;
    triggerModal(budgetMeta.label, budgetMeta.detail);
    setBudgetStatusModalShown(true);
  }, [activeTab, budgetStatusModalShown, eventData, hydrated]);

  const triggerModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const closeExpenseModal = () => {
    setShowAddExpenseModal(false);
    setEditingExpenseId(null);
    setExpenseForm(createEmptyExpenseForm());
    setExpenseErrors({});
  };

  const openExpenseEditor = (expense: FinancialData['recentExpenses'][number]) => {
    const normalizedStatus = String(expense.status || '').trim().toLowerCase();
    setSelectedExpenseDetail(null);
    setEditingExpenseId(expense.id);
    setExpenseErrors({});
    setExpenseForm({
      title: expense.desc || '',
      vendor: expense.subtitle || '',
      amount: String(expense.amount || '').replace(/[^\d.-]/g, ''),
      category: String(expense.category || 'other').trim().toLowerCase(),
      status: normalizedStatus === 'paid' || normalizedStatus === 'cleared' ? 'paid' : 'pending',
      dueDate: expense.dueDateIso ? expense.dueDateIso.slice(0, 10) : '',
      attachment: null,
    });
    setShowAddExpenseModal(true);
  };

  const updateExpenseField = <K extends keyof ExpenseFormState>(field: K, value: ExpenseFormState[K]) => {
    setExpenseForm((current) => ({ ...current, [field]: value }));
    setExpenseErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateExpenseForm = () => {
    const nextErrors: Partial<Record<keyof ExpenseFormState, string>> = {};
    if (!expenseForm.title.trim()) nextErrors.title = 'Expense title is required.';
    if (!expenseForm.vendor.trim()) nextErrors.vendor = 'Vendor is required.';
    if (!expenseForm.amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else if (!Number.isFinite(Number(expenseForm.amount)) || Number(expenseForm.amount) <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }
    if (!expenseForm.dueDate.trim()) nextErrors.dueDate = 'Due date is required.';
    if (!expenseForm.category.trim()) nextErrors.category = 'Expense category is required.';
    if (!expenseForm.status.trim()) nextErrors.status = 'Payment status is required.';
    return nextErrors;
  };

  const isExpenseFormComplete = Object.keys(validateExpenseForm()).length === 0;

  const validateInvoiceForm = () => {
    const trimmedAmount = invoiceForm.amount.trim();
    if (!invoiceForm.invoiceNumber.trim()) return false;
    if (!invoiceForm.clientName.trim()) return false;
    if (!trimmedAmount || !Number.isFinite(Number(trimmedAmount)) || Number(trimmedAmount) <= 0) return false;
    if (!invoiceForm.issueDate.trim()) return false;
    if (!invoiceForm.dueDate.trim()) return false;
    if (!invoiceForm.status.trim()) return false;
    return true;
  };

  const isInvoiceFormComplete = validateInvoiceForm();

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
    const validationErrors = validateExpenseForm();
    setExpenseErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      triggerModal('Incomplete Expense Form', 'Complete the required expense details before saving this record.');
      return;
    }

    try {
      setExpenseLoading(true);
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const token = await user.getIdToken();
      const payload = new FormData();
      payload.append('vendor', expenseForm.vendor);
      payload.append('description', expenseForm.title);
      payload.append('amount', expenseForm.amount);
      payload.append('dueDate', expenseForm.dueDate);
      payload.append('status', expenseForm.status);
      payload.append('paymentType', expenseForm.category);
      if (expenseForm.attachment) {
        payload.append('attachment', expenseForm.attachment);
      }

      const response = await fetch(editingExpenseId ? `/api/finances/${id}/expenses/${editingExpenseId}` : `/api/finances/${id}/expenses`, {
        method: editingExpenseId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingExpenseId ? 'update' : 'add'} expense: ${response.statusText}`);
      }

      // Close modal and refresh data
      closeExpenseModal();

      await loadFinancialData(token);

      triggerModal('Success', editingExpenseId ? 'Expense updated successfully!' : 'Expense added successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      triggerModal('Error', err instanceof Error ? err.message : `Failed to ${editingExpenseId ? 'update' : 'add'} expense`);
    } finally {
      setExpenseLoading(false);
    }
  };

  // Handle Generate Invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInvoiceFormComplete) {
      triggerModal('Incomplete Invoice Form', 'Complete all required invoice details before creating this record.');
      return;
    }
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
          expenseId: invoiceForm.expenseId,
          description: invoiceForm.description
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate invoice: ${response.statusText}`);
      }

      // Close modal and refresh data
      setShowGenerateInvoiceModal(false);
      setInvoiceForm(createEmptyInvoiceForm());
      await loadFinancialData(token);

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

  const budgetStatusMeta = getBudgetStatusMeta(eventData);
  const BudgetStatusIcon = eventData.budgetStatus === 'exceeded' || eventData.remainingValue < 0 ? AlertTriangle : CheckCircle2;

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">

      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        BACK TO EVENTS
      </Link>

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
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors ${activeTab === 'overview'
              ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]'
              : 'text-[#a1a1aa] hover:text-[#71717a]'
            }`}
        >
          Financial Overview
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'expenses'
              ? 'border-b-2 border-[#eebf43] text-[#1d1d1f]'
              : 'text-[#a1a1aa] hover:text-[#71717a]'
            }`}
        >
          Expense Tracking
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-xs font-extrabold tracking-widest uppercase transition-colors flex items-center gap-2 ${activeTab === 'invoices'
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
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                  <TrendingUp size={16} className="text-[#eebf43]" />
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${budgetStatusMeta.chipClass}`}>
                  <BudgetStatusIcon size={14} className={budgetStatusMeta.iconClass} />
                  {budgetStatusMeta.label}
                </span>
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
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                  <Wallet size={16} className="text-[#71717a]" />
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${budgetStatusMeta.chipClass}`}>
                  <BudgetStatusIcon size={14} className={budgetStatusMeta.iconClass} />
                  {eventData.budgetStatus === 'exceeded' ? 'Needs Review' : 'Healthy Spend'}
                </span>
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

          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Payment & Invoice Snapshot</h3>
                <p className="text-[10px] font-bold text-[#a1a1aa] mt-1 tracking-wider">CONNECTED TO THE SELECTED EVENT FINANCIALS</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${budgetStatusMeta.chipClass}`}>
                <BudgetStatusIcon size={14} className={budgetStatusMeta.iconClass} />
                {budgetStatusMeta.label}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[#fafafa] border border-gray-100 p-5">
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Invoiced</p>
                <p className="text-2xl font-black text-[#1d1d1f]">{eventData.totalInvoiced}</p>
              </div>
              <div className="rounded-2xl bg-[#fafafa] border border-gray-100 p-5">
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Total Received</p>
                <p className="text-2xl font-black text-emerald-600">{eventData.totalReceived}</p>
              </div>
              <div className="rounded-2xl bg-[#fafafa] border border-gray-100 p-5">
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-2">Outstanding</p>
                <p className={`text-2xl font-black ${eventData.outstandingValue > 0 ? 'text-red-600' : 'text-[#1d1d1f]'}`}>{eventData.outstanding}</p>
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
                <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
                  <h3 className="text-sm font-black text-[#1d1d1f] tracking-widest uppercase">Budget Utilization</h3>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${budgetStatusMeta.chipClass}`}>
                    <BudgetStatusIcon size={14} className={budgetStatusMeta.iconClass} />
                    {budgetStatusMeta.label}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-4xl font-black text-[#1d1d1f] tracking-tighter">{eventData.utilization}</span>
                    <span className="text-[10px] font-extrabold text-[#71717a] uppercase tracking-widest px-3 py-1 bg-gray-50 rounded-full border border-gray-100">Spent</span>
                  </div>
                  <div className="w-full h-8 bg-gray-50 rounded-full overflow-hidden mb-5 border border-gray-100/50 shadow-inner">
                    <div className={`h-full bg-gradient-to-r ${budgetStatusMeta.progressClass} rounded-full relative`} style={{ width: eventData.utilization }}>
                      <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 transform origin-bottom -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${budgetStatusMeta.panelClass}`}>
                    <BudgetStatusIcon size={16} className={budgetStatusMeta.iconClass} />
                    <p className="text-xs font-bold leading-relaxed">
                      Remaining Balance: <span className="font-black">{eventData.remaining}</span>
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
                    eventData.upcomingPayments.map((payment, idx) => {
                      const dueDateParts = getDueDateParts(payment.dueDateIso);
                      return (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-[16px] bg-[#fafafa] border border-gray-100 hover:border-[#eebf43]/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white shrink-0">
                              <div className="bg-[#fef3c7] text-[#d4a017] text-[9px] font-black tracking-[0.2em] uppercase text-center py-1.5">
                                {dueDateParts.month}
                              </div>
                              <div className="py-2 text-center text-[#1d1d1f] font-black text-lg leading-none">
                                {dueDateParts.day}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#1d1d1f] mb-1">{payment.entity}</span>
                              <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">{payment.type}</span>
                              <span className="text-[10px] text-[#a1a1aa] font-bold mt-1">{dueDateParts.full}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-[#1d1d1f]">{payment.amount}</span>
                            <span className="text-[10px] text-[#eebf43] font-bold mt-1">In {payment.days}</span>
                          </div>
                        </div>
                      )
                    })
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
                    <div key={idx} onClick={() => setSelectedExpenseDetail(tx)} className="group flex justify-between items-center p-4 rounded-[16px] hover:bg-[#fafafa] transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 shadow-sm group-hover:bg-white transition-colors">
                          <Receipt size={14} className="text-[#a1a1aa] group-hover:text-[#1d1d1f] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#1d1d1f] mb-1">{tx.desc}</span>
                          <span className="text-[10px] text-[#71717a] font-bold tracking-wider">{tx.date} – {tx.subtitle}</span>
                          {tx.attachmentName ? (
                            <a
                              href={tx.attachmentUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-[#eebf43] font-black tracking-wider mt-1 hover:text-[#dcae32]"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {tx.attachmentName}
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-[#1d1d1f]">- {tx.amount}</span>
                        <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full border uppercase tracking-widest ${getExpenseStatusMeta(tx.status).badgeClass}`}>{getExpenseStatusMeta(tx.status).label}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Invoiced</p>
                <h2 className="text-[32px] font-black text-[#1d1d1f] leading-none tracking-tight">{eventData.totalInvoiced}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fafafa] flex items-center justify-center border border-gray-100">
                <FileText size={20} className="text-[#a1a1aa]" />
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Total Received</p>
                <h2 className="text-[32px] font-black text-emerald-600 leading-none tracking-tight">{eventData.totalReceived}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={20} className="text-emerald-500" />
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
                  onClick={() => {
                    setExpenseErrors({});
                    setShowAddExpenseModal(true);
                  }}
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
                        const expenseStatusMeta = getExpenseStatusMeta(expense.status);
                        return (
                          <tr
                            key={idx}
                            onClick={() => setSelectedExpenseDetail(expense)}
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
                                <div className={`w-1.5 h-1.5 rounded-full ${expenseStatusMeta.dotClass}`}></div>
                                <span className={`text-[11px] font-bold ${expenseStatusMeta.textClass}`}>{expenseStatusMeta.label}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">Remaining Budget</p>
                <h2 className={`text-[32px] font-black leading-none tracking-tight ${eventData.remainingValue < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{eventData.remaining}</h2>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${eventData.remainingValue < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <BudgetStatusIcon size={20} className={budgetStatusMeta.iconClass} />
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
                
                    <th className="py-4 px-8 font-extrabold">Issued Date</th>
                    <th className="py-4 px-8 font-extrabold">Due Date</th>
                    <th className="py-4 px-8 font-extrabold text-right">Amount (₱)</th>
                    <th className="py-4 px-10 font-extrabold text-center">Status</th>
                    <th className="py-4 px-8 font-extrabold text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-[#71717a] divide-y divide-gray-50">
                  {eventData.invoices.length > 0 ? (
                    eventData.invoices.map((inv, idx) => (
                      <tr key={idx} onClick={() => setSelectedInvoiceDetail(inv)} className="hover:bg-[#fafafa] transition-colors group cursor-pointer">
                        <td className="py-4 px-8 font-black text-[#1d1d1f]">{inv.invoiceNumber}</td>
                        <td className="py-4 px-8 font-bold text-[#1d1d1f]">{inv.client}</td>
                        <td className="py-4 px-8 text-[#a1a1aa]">{inv.issue}</td>
                        <td className="py-4 px-8 font-bold">{inv.due}</td>
                        <td className="py-4 px-8 font-black text-[#1d1d1f] text-right">{inv.amount}</td>
                        <td className="py-4 px-10 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border ${inv.status === "Paid" ? "bg-green-50 text-green-600 border-green-100/50" :
                              inv.status === "Pending" ? "bg-yellow-50 text-yellow-600 border-yellow-100/50" :
                                inv.status === "Half Payment" ? "bg-orange-50 text-orange-600 border-orange-100/50" :
                                "bg-red-50 text-red-600 border-red-100/50"
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-8">
                          <div className="flex items-center justify-center">
                            <button onClick={(event) => { event.stopPropagation(); setSelectedInvoiceDetail(inv); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#a1a1aa] hover:bg-white hover:text-[#1d1d1f] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                              <FileText size={14} />
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

      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedInvoiceDetail(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1d1d1f] transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div>
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-3">Invoice Details</p>
                <h3 className="text-[24px] font-black text-[#1d1d1f] mb-2">{selectedInvoiceDetail.invoiceNumber}</h3>
                <p className="text-[13px] font-medium text-[#71717a] leading-relaxed">Review the invoice record directly here without opening a generated PDF page.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="rounded-[20px] border border-gray-100 bg-[#fafafa] p-5 space-y-3">
                  <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Client</span><span className="text-[13px] font-bold text-[#1d1d1f] text-right">{selectedInvoiceDetail.client}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Amount</span><span className="text-[13px] font-black text-[#1d1d1f] text-right">{selectedInvoiceDetail.amount}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Issue Date</span><span className="text-[13px] font-bold text-[#1d1d1f] text-right">{selectedInvoiceDetail.issue}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Due Date</span><span className="text-[13px] font-bold text-[#1d1d1f] text-right">{selectedInvoiceDetail.due}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Status</span><span className="text-[13px] font-bold text-[#1d1d1f] text-right">{selectedInvoiceDetail.status}</span></div>
                  {selectedInvoiceDetail.expenseLabel ? (
                    <div className="flex justify-between gap-4"><span className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa]">Related Expense</span><span className="text-[13px] font-bold text-[#1d1d1f] text-right">{selectedInvoiceDetail.expenseLabel}</span></div>
                  ) : null}
                </div>
                <div className="rounded-[20px] border border-gray-100 bg-white p-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#a1a1aa] mb-3">Billing Notes</p>
                  <p className="text-[13px] font-medium text-[#71717a] leading-relaxed">{selectedInvoiceDetail.description || 'No billing notes were added to this invoice.'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="w-full py-3.5 bg-[#eebf43] text-white rounded-[24px] text-[11px] font-black tracking-[0.2em] uppercase hover:bg-[#dcae32] transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedExpenseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1d1f]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] p-5 lg:p-6 max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button onClick={() => setSelectedExpenseDetail(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-[#1d1d1f] transition-colors">
              <X size={20} strokeWidth={2} />
            </button>

            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4 pr-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Finance Workspace</p>
                <h3 className="text-[28px] font-black text-[#1d1d1f] tracking-tight">Expense Details</h3>
                <p className="text-[12px] text-[#71717a] font-medium leading-relaxed mt-2.5 max-w-xl">
                  Review the recorded expense information, payment status, and attached receipt details for this event.
                </p>
              </div>
              <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-[#fef3c7] items-center justify-center text-[#d4a017]">
                <Receipt size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
              <div className="space-y-4">
                <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                  <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                    <Briefcase className="text-[#facc15]" size={20} /> Expense Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Expense Title</label>
                      <div className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900">{selectedExpenseDetail.desc}</div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Vendor</label>
                      <div className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900">{selectedExpenseDetail.subtitle}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Amount</label>
                      <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900">{selectedExpenseDetail.amount}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Recorded Date</label>
                      <div className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900">{selectedExpenseDetail.date}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                  <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                    <Target className="text-[#facc15]" size={20} /> Tracking Setup
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1 mb-2">Expense Category</p>
                      <div className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-extrabold text-gray-900 uppercase">{selectedExpenseDetail.category || 'Other'}</div>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1 mb-2">Payment Status</p>
                      <div className={`inline-flex items-center px-4 py-3 rounded-2xl border text-[13px] font-black uppercase tracking-widest ${getExpenseStatusMeta(selectedExpenseDetail.status).badgeClass}`}>
                        {getExpenseStatusMeta(selectedExpenseDetail.status).label}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                  <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                    <Paperclip className="text-[#facc15]" size={20} /> Receipt Attachment
                  </h4>
                  <div className="w-full border-2 border-dashed border-gray-200 rounded-[26px] p-5 bg-gray-50/60">
                    <p className="text-[13px] font-black text-[#1d1d1f]">{selectedExpenseDetail.attachmentName || 'No attachment uploaded for this expense.'}</p>
                    {selectedExpenseDetail.attachmentUrl ? (
                      <a href={selectedExpenseDetail.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex mt-3 text-[11px] font-black uppercase tracking-[0.1em] text-[#dcae32] hover:text-[#b98f23]">
                        Open Attachment
                      </a>
                    ) : (
                      <p className="text-[11px] text-[#a1a1aa] font-medium mt-2">There isn&apos;t a receipt file linked to this expense yet.</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => openExpenseEditor(selectedExpenseDetail)}
                    className="flex-1 py-3.5 bg-[#eebf43] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#dcae32] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95"
                  >
                    <Briefcase size={18} />
                    Edit Expense Data
                  </button>
                </div>
              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1d1f]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] p-5 lg:p-6 max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button onClick={closeExpenseModal} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-[#1d1d1f] transition-colors">
              <X size={20} strokeWidth={2} />
            </button>

            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4 pr-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Finance Workspace</p>
                <h3 className="text-[28px] font-black text-[#1d1d1f] tracking-tight">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
                <p className="text-[12px] text-[#71717a] font-medium leading-relaxed mt-2.5 max-w-xl">
                  {editingExpenseId
                    ? 'Update the recorded expense details, revise the payment status, and refresh the linked receipt information when needed.'
                    : 'Record a live production expense, assign the payment status, and attach the supporting receipt so it lands in the expense documents folder automatically.'}
                </p>
              </div>
              <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-[#fef3c7] items-center justify-center text-[#d4a017]">
                <Receipt size={24} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleAddExpense}>
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
                <div className="space-y-4">
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Briefcase className="text-[#facc15]" size={20} /> Expense Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Expense Title</label>
                        <input type="text" placeholder="e.g. Florist deposit" value={expenseForm.title} onChange={(e) => updateExpenseField('title', e.target.value)} className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:ring-4 focus:ring-[#facc15]/10 transition-all outline-none ${expenseErrors.title ? 'border-red-300 focus:border-red-400' : 'border-gray-100 focus:border-[#facc15]'}`} />
                        {expenseErrors.title ? <p className="text-[11px] font-bold text-red-500 ml-1">{expenseErrors.title}</p> : null}
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Vendor</label>
                        <input type="text" placeholder="e.g. Grand Ballroom C" value={expenseForm.vendor} onChange={(e) => updateExpenseField('vendor', e.target.value)} className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:ring-4 focus:ring-[#facc15]/10 transition-all outline-none ${expenseErrors.vendor ? 'border-red-300 focus:border-red-400' : 'border-gray-100 focus:border-[#facc15]'}`} />
                        {expenseErrors.vendor ? <p className="text-[11px] font-bold text-red-500 ml-1">{expenseErrors.vendor}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Amount ({PESO_SYMBOL})</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#d4a017]">{PESO_SYMBOL}</span>
                          <input type="number" placeholder="0.00" value={expenseForm.amount} onChange={(e) => updateExpenseField('amount', e.target.value)} step="0.01" className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white transition-all outline-none ${expenseErrors.amount ? 'border-red-300 focus:border-red-400' : 'border-gray-100 focus:border-[#facc15]'}`} />
                        </div>
                        {expenseErrors.amount ? <p className="text-[11px] font-bold text-red-500 ml-1">{expenseErrors.amount}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <CustomDatePicker label="Due Date" value={expenseForm.dueDate} onChange={(val) => updateExpenseField('dueDate', val)} />
                        {expenseErrors.dueDate ? <p className="text-[11px] font-bold text-red-500 ml-1">{expenseErrors.dueDate}</p> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button type="button" onClick={closeExpenseModal} className="px-7 py-3.5 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={expenseLoading || !isExpenseFormComplete} className="flex-1 py-3.5 text-white bg-[#eebf43] hover:bg-[#dcae32] text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      {expenseLoading ? <Loader size={18} className="animate-spin" /> : <Receipt size={18} />}
                      {expenseLoading ? (editingExpenseId ? 'Updating Expense...' : 'Saving Expense...') : (editingExpenseId ? 'Update Expense Record' : 'Save Expense Record')}
                    </button>
                  </div>


                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Target className="text-[#facc15]" size={20} /> Tracking Setup
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <CustomSelect label="Expense Category" value={expenseForm.category} onChange={(val) => updateExpenseField('category', val)} options={EXPENSE_CATEGORY_OPTIONS} icon={Target} />
                        {expenseErrors.category ? <p className="text-[11px] font-bold text-red-500 ml-1 mt-2">{expenseErrors.category}</p> : null}
                      </div>
                      <div>
                        <CustomSelect label="Payment Status" value={expenseForm.status} onChange={(val) => updateExpenseField('status', val)} options={EXPENSE_STATUS_OPTIONS} icon={FileText} />
                        {expenseErrors.status ? <p className="text-[11px] font-bold text-red-500 ml-1 mt-2">{expenseErrors.status}</p> : null}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Paperclip className="text-[#facc15]" size={20} /> Receipt Attachment
                    </h4>
                    <div className="w-full border-2 border-dashed border-gray-200 rounded-[26px] p-5 bg-gray-50/60 hover:border-[#facc15] hover:bg-white transition-all cursor-pointer">
                      <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setExpenseForm({ ...expenseForm, attachment: e.target.files?.[0] || null })} className="w-full text-[13px] font-bold text-[#1d1d1f] file:mr-4 file:border-0 file:bg-[#f9f1d8] file:px-4 file:py-2.5 file:rounded-xl file:text-[11px] file:font-black file:uppercase file:tracking-[0.1em] file:text-[#dcae32] cursor-pointer" />
                      <div className="mt-4">
                        <p className="text-[13px] font-black text-[#1d1d1f]">{expenseForm.attachment ? expenseForm.attachment.name : 'Attach a receipt, image, PDF, or spreadsheet'}</p>
                        <p className="text-[11px] text-[#a1a1aa] font-medium mt-2">This file will be filed under the expense documents folder for {eventData.eventName}.</p>
                      </div>
                    </div>
                  </div>


                </div>
              </div>


            </form>
          </div>
        </div>
      )}


      {/* Generate Invoice Modal */}
      {showGenerateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1d1f]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] p-5 lg:p-6 max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100">
            <button onClick={() => setShowGenerateInvoiceModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-[#1d1d1f] transition-colors">
              <X size={20} strokeWidth={2} />
            </button>

            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4 pr-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] mb-2">Finance Workspace</p>
                <h3 className="text-[28px] font-black text-[#1d1d1f] tracking-tight">Generate Invoice</h3>
                <p className="text-[12px] text-[#71717a] font-medium leading-relaxed mt-2.5 max-w-xl">
                  Draft a structured invoice for this event and mirror it into the documents repository so the billing folder stays current.
                </p>
              </div>
              <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-[#fef3c7] items-center justify-center text-[#d4a017]">
                <Send size={24} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleGenerateInvoice}>
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
                <div className="space-y-4">
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <FileText className="text-[#facc15]" size={20} /> Invoice Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Invoice Number</label>
                        <input required type="text" placeholder="e.g. INV-2026-001" value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] focus:ring-4 focus:ring-[#facc15]/10 transition-all outline-none" />
                      </div>
                     

                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Amount ({PESO_SYMBOL})</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#d4a017]">{PESO_SYMBOL}</span>
                          <input required type="number" placeholder="0.00" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} step="0.01" className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-extrabold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none" />
                        </div>
                      </div>
                      <CustomDatePicker label="Issue Date" value={invoiceForm.issueDate} onChange={(val) => setInvoiceForm({ ...invoiceForm, issueDate: val })} />
                      <CustomDatePicker label="Due Date" value={invoiceForm.dueDate} onChange={(val) => setInvoiceForm({ ...invoiceForm, dueDate: val })} />
                    </div>
                  </div>
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Receipt className="text-[#facc15]" size={20} /> Related Expense
                    </h4>
                    <CustomSelect
                      label="Expense Reference"
                      value={invoiceForm.expenseId}
                      onChange={(val) => setInvoiceForm({ ...invoiceForm, expenseId: val })}
                      options={[
                        { value: '', label: 'No linked expense', sublabel: 'Optional' },
                        ...expenseOptions.map((expense) => ({
                          value: expense.id,
                          label: expense.title,
                          sublabel: expense.vendor,
                        })),
                      ]}
                      icon={Briefcase}
                    />
                  </div>


                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Target className="text-[#facc15]" size={20} /> Invoice Status
                    </h4>
                    <CustomSelect label="Collection Status" value={invoiceForm.status} onChange={(val) => setInvoiceForm({ ...invoiceForm, status: val })} options={INVOICE_STATUS_OPTIONS} icon={Send} />
                  </div>
                  <div className="bg-white rounded-[26px] p-5 border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                    <h4 className="text-[17px] font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <Briefcase className="text-[#facc15]" size={20} /> Billing Notes
                    </h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">Description</label>
                      <textarea placeholder="e.g. Event sponsorship for Gala 2026" value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 focus:bg-white focus:border-[#facc15] transition-all outline-none resize-none h-32 leading-relaxed" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowGenerateInvoiceModal(false)} className="px-7 py-3.5 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={invoiceLoading || !isInvoiceFormComplete} className="flex-1 py-3.5 text-white bg-[#eebf43] hover:bg-[#dcae32] text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {invoiceLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                  {invoiceLoading ? 'Generating Invoice...' : 'Create Invoice Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
