"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MoreVertical,
  Users,
  BadgeCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  Crown,
  UserCheck,
  Download,
  Plus,
  ArrowRight,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

type AccessRole = 'ADMINISTRATOR' | 'LEAD COORDINATOR' | 'PRODUCTION STAFF';
type UserStatus = 'Active' | 'On-Site' | 'Away' | 'Invited';

type ManagedUser = {
  uid: string;
  name: string;
  email: string;
  role: AccessRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
};

type AuditLogEntry = {
  id: string;
  category: 'USER_MANAGEMENT' | 'PROFILE' | 'SECURITY' | 'AUTH' | 'SYSTEM';
  action: string;
  message: string;
  actorEmail: string | null;
  targetEmail: string | null;
  createdAt: string;
};

type AlertState = {
  message: string;
  type: 'success' | 'error' | 'info';
};

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: AccessRole;
  status: UserStatus;
  avatarPreview: string;
  removeAvatar: boolean;
};

const STATUS_COLOR_MAP: Record<UserStatus, string> = {
  Active: 'bg-emerald-500',
  'On-Site': 'bg-amber-500',
  Away: 'bg-blue-400',
  Invited: 'bg-violet-500',
};

const DEFAULT_FORM: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'PRODUCTION STAFF',
  status: 'Active',
  avatarPreview: '',
  removeAvatar: false,
};

function toRelativeTime(isoString: string | null): string {
  if (!isoString) {
    return 'Never';
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Just now';
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)} mins ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} hours ago`;
  }

  if (diffMs < day * 7) {
    return `${Math.floor(diffMs / day)} days ago`;
  }

  return date.toLocaleDateString();
}

export default function UsersAdministrationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogEntry[]>([]);

  const [formData, setFormData] = useState<UserFormState>(DEFAULT_FORM);

  const showAlert = (message: string, type: AlertState['type']) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const getDownloadFileName = (contentDisposition: string | null, fallback: string) => {
    if (!contentDisposition) {
      return fallback;
    }

    const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    return match?.[1] || fallback;
  };

  const fetchUsers = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      const idToken = await user.getIdToken();

      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as {
        users?: ManagedUser[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch users list.');
      }

      setUsers(payload.users || []);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to fetch users.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentAuditLogs = async () => {
    if (!user) {
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/admin/audit-logs?limit=2&category=USER_MANAGEMENT', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as {
        logs?: AuditLogEntry[];
      };

      if (response.ok) {
        setRecentAuditLogs(payload.logs || []);
      }
    } catch {
      // Keep UI resilient even if audit preview fails
    }
  };

  const handleExportDirectory = async () => {
    if (!user) {
      return;
    }

    try {
      setIsExporting(true);
      const idToken = await user.getIdToken();
      const response = await fetch('/api/users/export', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to export directory.');
      }

      const blob = await response.blob();
      const fileName = getDownloadFileName(response.headers.get('content-disposition'), `users-directory-${Date.now()}.csv`);
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);

      showAlert('Directory exported successfully.', 'success');
      await fetchRecentAuditLogs();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to export directory.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchUsers();
      void fetchRecentAuditLogs();
    }
  }, [user]);

  const totalCurators = users.length;
  const leadCoordinators = useMemo(() => users.filter((entry) => entry.role === 'LEAD COORDINATOR').length, [users]);
  const pendingInvites = useMemo(() => users.filter((entry) => entry.status === 'Invited').length, [users]);
  const activeDuty = useMemo(() => users.filter((entry) => entry.status === 'Active' || entry.status === 'On-Site').length, [users]);

  const handleAddNew = () => {
    setFormData(DEFAULT_FORM);
    setEditingUser(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAddingUser(true);
  };

  const handleEdit = (targetUser: ManagedUser) => {
    setEditingUser(targetUser);
    setAvatarFile(null);

    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
      status: targetUser.status,
      avatarPreview: targetUser.avatarUrl || '',
      removeAvatar: false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsAddingUser(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showAlert('Please upload an image file only.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarFile(file);
      setFormData((prev) => ({
        ...prev,
        avatarPreview: String(reader.result || ''),
        removeAvatar: false,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);

    setFormData((prev) => ({
      ...prev,
      avatarPreview: '',
      removeAvatar: Boolean(editingUser),
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (uid: string) => {
    if (!user) {
      return;
    }

    const shouldDelete = window.confirm('Are you sure you want to delete this user? This also removes the Firebase account.');

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingUid(uid);
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/users/${uid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete user.');
      }

      setUsers((prev) => prev.filter((entry) => entry.uid !== uid));
      await fetchRecentAuditLogs();
      showAlert('User deleted successfully.', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to delete user.', 'error');
    } finally {
      setDeletingUid(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (!editingUser && formData.password.trim().length < 6) {
      showAlert('Password is required and must be at least 6 characters for new users.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('role', formData.role);
      payload.append('status', formData.status);

      if (formData.password.trim().length > 0) {
        payload.append('password', formData.password.trim());
      }

      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      if (formData.removeAvatar) {
        payload.append('removeAvatar', 'true');
      }

      const idToken = await user.getIdToken();
      const response = await fetch(editingUser ? `/api/users/${editingUser.uid}` : '/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: payload,
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save user.');
      }

      setIsAddingUser(false);
      setEditingUser(null);
      setAvatarFile(null);
      setFormData(DEFAULT_FORM);
      await fetchUsers();
      await fetchRecentAuditLogs();

      showAlert(editingUser ? 'User updated successfully.' : 'User created successfully.', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-none">
      <div className="w-full text-[#1d1d1f]">
        {alert && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-bottom-4 fade-in ${
              alert.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-800'
                : alert.type === 'info'
                  ? 'bg-blue-50 border-blue-100 text-blue-800'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            } flex items-center gap-3`}
          >
            {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-extrabold tracking-wide">{alert.message}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 pt-2">
          <div>
            <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
              System Admin <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Access Control</span>
            </p>
            <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
              Users & <span className="text-[#eebf43] italic pr-2">Management</span>
            </h1>
            <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
              Curate your production collective. Assign roles that mirror the bespoke precision of your events.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 mt-4 md:mt-0">
            <button
              onClick={handleExportDirectory}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 text-[#0f172a] text-[11px] font-black tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors rounded-xl shadow-sm disabled:opacity-60"
            >
              {isExporting ? <Loader2 size={14} className="text-[#0f172a] animate-spin" /> : <Download size={14} className="text-[#0f172a]" />} Export Directory
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20"
            >
              <Plus size={14} className="text-white" /> Invite New User
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#eebf43]"></div>
            <div className="flex justify-between items-start mb-4">
              <Users className="text-[#eebf43] w-5 h-5" />
              <span className="text-[#a88231] text-xs font-semibold">{totalCurators} registered</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{totalCurators}</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Total Curators</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3f3f46]"></div>
            <div className="flex justify-between items-start mb-4">
              <BadgeCheck className="text-[#71717a] w-5 h-5" />
              <span className="text-[#71717a] text-xs font-semibold">{activeDuty} Active Duty</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{leadCoordinators}</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Lead Coordinators</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <Mail className="text-[#a1a1aa] w-5 h-5" />
              <span className="text-red-500 text-xs font-semibold">Awaiting onboarding</span>
            </div>
            <h2 className="text-4xl font-black text-[#1d1d1f] mb-1">{pendingInvites}</h2>
            <p className="text-[#a1a1aa] text-[10px] font-bold tracking-widest uppercase">Pending Invites</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <h3 className="text-[#1d1d1f] text-xs font-bold tracking-[0.1em] uppercase">Active Directory</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50">Last Active</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#71717a]">
                        <div className="inline-flex items-center gap-2 font-semibold">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading users...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#71717a]">
                        No users found yet. Click Invite New User to create one.
                      </td>
                    </tr>
                  ) : (
                    users.map((entry) => (
                      <tr key={entry.uid} className="group hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-b-0">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt={entry.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center text-[#71717a] text-xs font-bold shadow-sm">
                                {entry.name
                                  .split(' ')
                                  .filter(Boolean)
                                  .map((part) => part[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-[#1d1d1f] font-bold text-sm">{entry.name}</p>
                              <p className="text-[#71717a] text-[11px]">{entry.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex py-1.5 px-3 rounded-full bg-[#fef9ec] border border-[#eebf43]/30 text-[#a88231] text-[10px] font-bold tracking-widest uppercase">
                            {entry.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR_MAP[entry.status] || 'bg-gray-400'}`}></span>
                            <span className="text-[#3f3f46] text-xs font-semibold">{entry.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[#71717a] text-xs font-medium">{toRelativeTime(entry.lastActiveAt)}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-[#a1a1aa] hover:text-[#1d1d1f] transition-colors outline-none focus:outline-none"
                              title="Edit user"
                            >
                              <MoreVertical size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.uid)}
                              className="text-[#f87171] hover:text-[#dc2626] transition-colors outline-none focus:outline-none"
                              title="Delete user"
                              disabled={deletingUid === entry.uid}
                            >
                              {deletingUid === entry.uid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-gray-50 bg-[#fafafa]/50 rounded-b-xl">
              <span className="text-xs text-[#a1a1aa] font-medium">Showing {users.length} of {users.length} Curators</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronLeft size={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eebf43] text-[#1d1d1f] font-bold text-xs shadow-sm shadow-[#eebf43]/20">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#fafafa] rounded-xl p-6 border border-gray-200/60 shadow-sm relative">
              <h3 className="text-[#1d1d1f] text-xs font-bold tracking-[0.1em] uppercase mb-6">Quick Permissions</h3>

              <div className="space-y-5 mb-8">
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Financial Access</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">Allows viewing and modifying event budgets and payment schedules.</p>
                </div>
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Event Creation</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">Permits the drafting and publishing of new production schedules.</p>
                </div>
                <div>
                  <h4 className="text-[#1d1d1f] text-xs font-bold mb-1 uppercase tracking-wide">Contract Signing</h4>
                  <p className="text-[#71717a] text-[11px] leading-relaxed">High-level authority to approve vendor and talent agreements.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h4 className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest mb-3">Audit Snippet</h4>
                <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[3px] before:w-[2px] before:bg-gray-100">
                  {recentAuditLogs.length === 0 ? (
                    <div className="relative pl-4">
                      <span className="absolute left-[2px] top-1.5 w-1 h-1 rounded-full bg-[#eebf43]"></span>
                      <p className="text-[#3f3f46] text-xs font-bold">No audit logs yet</p>
                      <p className="text-[#a1a1aa] text-[10px]">Logs appear after user actions</p>
                    </div>
                  ) : (
                    recentAuditLogs.map((entry) => (
                      <div className="relative pl-4" key={entry.id}>
                        <span className="absolute left-[2px] top-1.5 w-1 h-1 rounded-full bg-[#eebf43]"></span>
                        <p className="text-[#3f3f46] text-xs font-bold">{entry.message}</p>
                        <p className="text-[#a1a1aa] text-[10px]">{toRelativeTime(entry.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => router.push('/admin/audit-logs')}
                  className="w-full mt-4 py-2 border border-gray-200 rounded-md text-[#1d1d1f] text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition"
                >
                  View Full Log
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[#1d1d1f] text-xs font-bold tracking-[0.1em] uppercase">Team Composition</h3>
                <div className="w-7 h-7 rounded-full bg-[#fef9ec] flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-[#eebf43]" />
                </div>
              </div>

              <div className="space-y-4">
                {([
                  { label: 'Administrators', role: 'ADMINISTRATOR' as AccessRole, color: '#1d1d1f', bg: '#f4f4f5' },
                  { label: 'Lead Coordinators', role: 'LEAD COORDINATOR' as AccessRole, color: '#eebf43', bg: '#fef9ec' },
                  { label: 'Production Staff', role: 'PRODUCTION STAFF' as AccessRole, color: '#71717a', bg: '#f4f4f5' },
                ] as const).map(({ label, role, color, bg }) => {
                  const count = users.filter((u) => u.role === role).length;
                  const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#3f3f46]">{label}</span>
                        <span className="text-[11px] font-black text-[#1d1d1f]">{count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: bg }}>
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-[#71717a]">
                    {activeDuty} active right now
                  </span>
                </div>
                <button
                  onClick={handleAddNew}
                  className="text-[#eebf43] text-[10px] font-black uppercase tracking-widest hover:text-[#a88231] transition"
                >
                  + Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-[#1d1d1f]/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => !isSubmitting && setIsAddingUser(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-xl font-extrabold text-[#1d1d1f]" id="modal-title">
                    {editingUser ? 'Edit User Credentials' : 'Invite New User'}
                  </h3>
                  <p className="text-xs text-[#71717a] mt-1">
                    {editingUser ? 'Modify access levels, avatar, and password for this user.' : 'Create a real account with a login password.'}
                  </p>

                  <div className="mt-8">
                    <form onSubmit={handleSave}>
                      <div className="space-y-5">
                        <div className="flex justify-center mb-6">
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {formData.avatarPreview ? (
                              <img src={formData.avatarPreview} alt="Profile" className="h-20 w-20 rounded-full object-cover border border-gray-200 shadow-sm" />
                            ) : (
                              <div className="h-20 w-20 rounded-full bg-[#fafafa] flex items-center justify-center border border-dashed border-[#dcae32] group-hover:bg-[#fef9ec] transition-colors">
                                <span className="text-[10px] text-[#a88231] font-bold uppercase tracking-wider">Photo</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-bold tracking-widest uppercase">Change</span>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                          </div>
                        </div>

                        {formData.avatarPreview && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={handleClearAvatar}
                              className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                            >
                              Remove selected picture
                            </button>
                          </div>
                        )}

                        <div>
                          <label htmlFor="name" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="block w-full border border-gray-200 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="block w-full border border-gray-200 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]"
                          />
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">
                            Password {editingUser ? '(leave blank to keep current password)' : '(required)'}
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                            required={!editingUser}
                            minLength={editingUser ? undefined : 6}
                            className="block w-full border border-gray-200 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]"
                          />
                        </div>

                        <div>
                          <label htmlFor="role" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">
                            Access Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as AccessRole }))}
                            className="block w-full py-2.5 px-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]"
                          >
                            <option value="ADMINISTRATOR">Administrator</option>
                            <option value="LEAD COORDINATOR">Lead Coordinator</option>
                            <option value="PRODUCTION STAFF">Production Staff</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest mb-1">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as UserStatus }))}
                            className="block w-full py-2.5 px-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:border-[#dcae32] focus:ring-1 focus:ring-[#dcae32] text-sm text-[#1d1d1f]"
                          >
                            <option value="Active">Active</option>
                            <option value="On-Site">On-Site</option>
                            <option value="Away">Away</option>
                            <option value="Invited">Invited</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-gray-200 px-6 py-2.5 bg-white text-xs font-bold tracking-widest text-[#3f3f46] hover:bg-gray-50 focus:outline-none transition-colors uppercase"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent px-6 py-2.5 bg-[#1d1d1f] text-xs font-bold tracking-widest text-white hover:bg-[#3f3f46] focus:outline-none transition-colors shadow-md uppercase disabled:opacity-60"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                          {editingUser ? 'Save Changes' : 'Create User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
