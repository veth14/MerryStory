'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, ShieldCheck, Users, UserCog } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { CustomSelect } from '@/components/ui/CustomInputs';

type AuditCategory = 'USER_MANAGEMENT' | 'PROFILE' | 'SECURITY' | 'AUTH' | 'SYSTEM';

type AuditLogEntry = {
  id: string;
  category: AuditCategory;
  action: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: Record<string, unknown>;
  actorUid: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetUid: string | null;
  targetEmail: string | null;
  targetType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

const CATEGORY_OPTIONS: Array<'ALL' | AuditCategory> = ['ALL', 'USER_MANAGEMENT', 'PROFILE', 'SECURITY', 'AUTH', 'SYSTEM'];

const CATEGORY_LABELS: Record<'ALL' | AuditCategory, string> = {
  ALL: 'All Categories',
  USER_MANAGEMENT: 'User Management',
  PROFILE: 'Profile',
  SECURITY: 'Security',
  AUTH: 'Authentication',
  SYSTEM: 'System',
};

function formatAction(action: string): string {
  return action
    .split('_')
    .map((word) => `${word.charAt(0)}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function formatDateTime(isoDate: string): string {
  const value = new Date(isoDate);

  if (Number.isNaN(value.getTime())) {
    return 'Unknown time';
  }

  return value.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category');
  const [category, setCategory] = useState<'ALL' | AuditCategory>(
    CATEGORY_OPTIONS.includes((initialCategory as 'ALL' | AuditCategory) || 'ALL')
      ? ((initialCategory as 'ALL' | AuditCategory) || 'ALL')
      : 'ALL'
  );
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLogs = async (isManualRefresh = false) => {
    if (!user) {
      return;
    }

    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);
      const idToken = await user.getIdToken();
      const params = new URLSearchParams();
      params.set('limit', '250');

      if (category !== 'ALL') {
        params.set('category', category);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as {
        logs?: AuditLogEntry[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch audit logs.');
      }

      setLogs(payload.logs || []);
      setCurrentPage(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to fetch audit logs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchLogs();
    }
  }, [user, category]);

  const categoryCounts = useMemo(() => {
    return {
      total: logs.length,
      userManagement: logs.filter((entry) => entry.category === 'USER_MANAGEMENT').length,
      profile: logs.filter((entry) => entry.category === 'PROFILE').length,
      security: logs.filter((entry) => entry.category === 'SECURITY').length,
    };
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const showingStart = logs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, logs.length);
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1) as Array<number | 'ellipsis-left' | 'ellipsis-right'>;
    }

    const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      items.push('ellipsis-left');
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < totalPages - 1) {
      items.push('ellipsis-right');
    }

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchLogs();
  };

  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 mb-8">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            System Admin <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Audit Trail</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Activity <span className="text-[#eebf43] italic pr-2">Logs</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-2xl leading-relaxed font-medium">
            Full backend audit trail for user actions and account-level events, categorized and stored in MongoDB.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void fetchLogs(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-black tracking-[0.1em] uppercase hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#eebf43] text-white rounded-xl text-[11px] font-black tracking-[0.1em] uppercase hover:bg-[#dcae32] transition-all shadow-lg shadow-[#eebf43]/20"
          >
            Back to Users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#eebf43]"></div>
          <div className="flex justify-between items-start mb-4">
            <Users className="text-[#eebf43] w-5 h-5" />
            <span className="text-[#a88231] text-xs font-semibold">{categoryCounts.total} captured</span>
          </div>
          <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{categoryCounts.total}</h2>
          <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Total Events</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3f3f46]"></div>
          <div className="flex justify-between items-start mb-4">
            <UserCog className="text-[#71717a] w-5 h-5" />
            <span className="text-[#71717a] text-xs font-semibold">Access changes</span>
          </div>
          <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{categoryCounts.userManagement}</h2>
          <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">User Management</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-4">
            <ShieldCheck className="text-emerald-500 w-5 h-5" />
            <span className="text-emerald-600 text-xs font-semibold">Identity logs</span>
          </div>
          <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{categoryCounts.profile}</h2>
          <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Profile Events</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex justify-between items-start mb-4">
            <ShieldCheck className="text-rose-500 w-5 h-5" />
            <span className="text-rose-500 text-xs font-semibold">High priority</span>
          </div>
          <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{categoryCounts.security}</h2>
          <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Security Events</p>
        </div>
      </div>

      <div className="mb-6 rounded-[30px] border border-gray-100 bg-[#fcfcfc] p-4 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a1a1aa]">Filter By Category</p>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#8f8f98] border border-gray-100">
            {logs.length} results
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by message, action, actor or target..."
                className="w-full rounded-2xl border-2 border-gray-100 pl-14 pr-6 py-4 text-sm font-bold text-[#1d1d1f] placeholder-[#a1a1aa] focus:outline-none focus:border-[#eebf43] focus:ring-4 focus:ring-[#eebf43]/5 transition-all bg-white shadow-sm"
              />
            </div>
          </form>

          <CustomSelect
            value={category}
            onChange={(value) => setCategory(value as 'ALL' | AuditCategory)}
            options={CATEGORY_OPTIONS.map((value) => ({
              value,
              label: CATEGORY_LABELS[value],
            }))}
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ height: '820px' }}>
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Actor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Target</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] border-b border-gray-50">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#71717a]">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Loader2 size={16} className="animate-spin" />
                      Loading audit logs...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-600 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#71717a]">
                    No audit logs found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((entry) => {
                  const detailEntries = Object.entries(entry.details || {}).filter(([, value]) => value !== null && value !== undefined && String(value) !== '');

                  return (
                    <tr key={entry.id} className="border-b border-gray-50 align-top hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-5 text-xs font-semibold text-[#3f3f46] whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full border border-[#eebf43]/30 bg-[#fef9ec] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a88231]">
                          {CATEGORY_LABELS[entry.category]}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-[#1d1d1f] whitespace-nowrap">{formatAction(entry.action)}</td>
                      <td className="px-6 py-5 text-xs text-[#3f3f46]">
                        <p className="font-semibold">{entry.actorEmail || entry.actorUid || 'Unknown actor'}</p>
                        <p className="text-[#a1a1aa] mt-1">{entry.actorRole || '-'}</p>
                      </td>
                      <td className="px-6 py-5 text-xs text-[#3f3f46]">
                        <p className="font-semibold">{entry.targetEmail || entry.targetUid || '-'}</p>
                        <p className="text-[#a1a1aa] mt-1">{entry.targetType || '-'}</p>
                      </td>
                      <td className="px-6 py-5 text-xs text-[#3f3f46] max-w-[320px]">
                        <p className="font-semibold mb-2">{entry.message}</p>
                        {detailEntries.length > 0 ? (
                          <div className="space-y-1">
                            {detailEntries.slice(0, 4).map(([key, value]) => (
                              <p key={key} className="text-[#71717a]">
                                <span className="font-semibold text-[#52525b]">{key}:</span> {String(value)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#a1a1aa]">No extra details</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-[10px] text-[#a1a1aa]">
                          <span className="inline-flex items-center gap-1"><Users size={11} /> {entry.ipAddress || '-'}</span>
                          <span className="inline-flex items-center gap-1"><UserCog size={11} /> {entry.userAgent ? 'UA captured' : 'UA unavailable'}</span>
                          <span className="inline-flex items-center gap-1"><ShieldCheck size={11} /> {entry.severity}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !error && logs.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50 bg-[#fafafa]/50">
            <span className="text-xs text-[#a1a1aa] font-medium">Showing {showingStart}-{showingEnd} of {logs.length} Logs</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1">
                {paginationItems.map((item, idx) => {
                  if (typeof item !== 'number') {
                    return (
                      <span key={`${item}-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#a1a1aa]">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${
                        currentPage === item
                          ? 'bg-[#eebf43] text-[#1d1d1f] shadow-sm shadow-[#eebf43]/20'
                          : 'bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
