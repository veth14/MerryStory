'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Filter, Plus, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import CreateTaskModal, { StaffOption, VendorOption } from '@/app/admin/tasks/CreateTaskModal';

type TaskItem = {
  id: string;
  dbId?: string;
  taskCode?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  assignees: { name: string; avatarUrl?: string | null }[];
  vendor: string;
};

type TaskRecord = {
  _id?: string;
  taskId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: { date?: string; time?: string };
  dueDate?: string;
  dueTime?: string;
  assignees?: Array<{ name?: string; avatarUrl?: string | null } | string>;
  assignee?: { name?: string } | string;
  vendor?: { name?: string } | string;
};

type OptionRecord = {
  _id?: string | { $oid?: string };
  uid?: string;
  name?: string;
  vendorName?: string;
  company?: string;
  businessName?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  appRole?: string;
  avatarUrl?: string | null;
  category?: string;
  serviceCategory?: string;
  vendorCategory?: string;
  type?: string;
  serviceType?: string;
};

const normalizeStatus = (value?: string) => {
  if (!value) return 'TO DO';
  const normalized = value.toUpperCase().replace(/[_-]/g, ' ').trim();
  if (normalized === 'TODO' || normalized === 'TO DO') return 'TO DO';
  if (normalized === 'INPROGRESS' || normalized === 'IN PROGRESS') return 'IN PROGRESS';
  if (normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'COMPLETED';
  return normalized;
};

const normalizePriority = (value?: string) => (value ? value.toUpperCase() : 'MEDIUM');

const formatDateLabel = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const resolveName = (value?: { name?: string } | string, fallback = 'None') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.name || fallback;
};

const getStringId = (value?: unknown) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '$oid' in value) {
    return (value as { $oid?: string }).$oid || undefined;
  }
  return String(value);
};

const resolveAssignees = (
  value?: Array<{ name?: string; avatarUrl?: string | null } | string>,
  fallbackAssignee?: { name?: string } | string
) => {
  const fromList = Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry.trim() ? { name: entry.trim(), avatarUrl: null } : null;
          }
          if (entry?.name?.trim()) {
            return { name: entry.name.trim(), avatarUrl: entry.avatarUrl || null };
          }
          return null;
        })
        .filter(Boolean) as { name: string; avatarUrl?: string | null }[]
    : [];

  if (fromList.length > 0) return fromList;
  const fallbackName = resolveName(fallbackAssignee, 'Unassigned');
  return fallbackName && fallbackName !== 'Unassigned' ? [{ name: fallbackName, avatarUrl: null }] : [];
};

const mapTaskRecord = (task: TaskRecord, index: number): TaskItem => {
  const dueDate = task.dueDate ?? task.due?.date;
  const dueTime = task.dueTime ?? task.due?.time;
  const dbId = getStringId(task._id);
  const taskCode = task.taskId || undefined;
  const assignees = resolveAssignees(task.assignees, task.assignee);
  const idValue = dbId || taskCode || `TSK-${String(index + 1).padStart(3, '0')}`;

  return {
    id: String(idValue),
    dbId,
    taskCode,
    title: task.title || 'Untitled Task',
    description: task.description || '',
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    dueDate: formatDateLabel(dueDate),
    dueTime: dueTime || '',
    assignee: assignees.length ? assignees.map((entry) => entry.name).join(', ') : 'Unassigned',
    assignees,
    vendor: resolveName(task.vendor, 'None'),
  };
};

const extractStaff = (payload: any): StaffOption[] => {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : [];

  return records
    .map((record: OptionRecord) => {
      const name = record?.name?.trim() || `${record?.firstName || ''} ${record?.lastName || ''}`.trim();
      if (!name) return null;

      return {
        uid: record.uid || name,
        name,
        role: record.role || 'PRODUCTION STAFF',
        appRole: record.appRole || 'staff',
        avatarUrl: record.avatarUrl || null,
      };
    })
    .filter((record): record is StaffOption => Boolean(record));
};

const extractVendorOptions = (payload: any): VendorOption[] => {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.vendors) ? payload.vendors : [];

  return records
    .map((record: OptionRecord | string) => {
      if (typeof record === 'string') {
        const normalized = record.trim();
        return normalized ? { name: normalized, category: '' } : null;
      }

      const name =
        record?.name?.trim() ||
        record?.vendorName?.trim() ||
        record?.company?.trim() ||
        record?.businessName?.trim() ||
        record?.title?.trim() ||
        `${record?.firstName || ''} ${record?.lastName || ''}`.trim();
      if (!name) return null;

      return {
        name,
        category:
          record.category?.trim() ||
          record.serviceCategory?.trim() ||
          record.vendorCategory?.trim() ||
          record.serviceType?.trim() ||
          record.type?.trim() ||
          '',
      };
    })
    .filter((record): record is VendorOption => Boolean(record));
};

function useDropdownLayer<T extends HTMLElement, U extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const triggerRef = useRef<T>(null);
  const panelRef = useRef<U>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return { triggerRef, panelRef };
}

function FloatingDropdown({
  isOpen,
  anchorRef,
  panelRef,
  children,
  className,
  align = 'start',
  width,
  preferredHeight = 280,
}: {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className: string;
  align?: 'start' | 'center' | 'end';
  width: number;
  preferredHeight?: number;
}) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      let left = rect.left;
      if (align === 'center') {
        left = rect.left + rect.width / 2 - width / 2;
      } else if (align === 'end') {
        left = rect.right - width;
      }

      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < Math.min(preferredHeight, 220) && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));

      setStyle({
        position: 'fixed',
        ...(openUp ? { bottom: viewportHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
        left: Math.min(Math.max(12, left), Math.max(12, window.innerWidth - width - 12)),
        width,
        zIndex: 240,
        maxHeight,
        overflowY: 'auto',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, anchorRef, isOpen, preferredHeight, width]);

  if (!isOpen || !style || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={panelRef} style={style} className={className}>
      {children}
    </div>,
    document.body
  );
}

function FilterDropdown({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const options = [
    { value: 'ALL', label: 'All Status', sublabel: 'Display every task in the registry' },
    { value: 'TO DO', label: 'To Do', sublabel: 'New or queued deliverables' },
    { value: 'IN PROGRESS', label: 'In Progress', sublabel: 'Work that is currently underway' },
    { value: 'COMPLETED', label: 'Completed', sublabel: 'Finished and closed tasks' },
  ];

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer relative"
      >
        <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {options.find((option) => option.value === value)?.label || 'All Status'}
        <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        align="end"
        width={280}
        preferredHeight={240}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider">{option.label}</div>
                <div className="text-[10px] font-bold text-gray-400">{option.sublabel}</div>
              </div>
              {value === option.value && <Check className="w-4 h-4 text-[#facc15]" />}
            </button>
          ))}
        </div>
      </FloatingDropdown>
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const options = ['TO DO', 'IN PROGRESS', 'COMPLETED'];
  const toneMap: Record<string, string> = {
    'TO DO': 'text-gray-500 bg-gray-100',
    'IN PROGRESS': 'text-[#b48600] bg-[#facc15]/20',
    COMPLETED: 'text-emerald-700 bg-emerald-50',
  };
  const dotMap: Record<string, string> = {
    'TO DO': 'bg-gray-400',
    'IN PROGRESS': 'bg-[#facc15]',
    COMPLETED: 'bg-emerald-500',
  };

  return (
    <div className="relative inline-flex items-center" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex items-center gap-2 pl-5 pr-7 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${toneMap[value] || toneMap['TO DO']} relative`}
      >
        <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${dotMap[value] || dotMap['TO DO']}`} />
        {value}
        <ChevronDown className={`w-3 h-3 text-current absolute right-2 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        align="center"
        width={220}
        preferredHeight={220}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${dotMap[option]}`} />
                <div>
                  <div className="text-[12px] font-extrabold text-gray-900 uppercase tracking-wider">{option}</div>
                </div>
              </div>
              {value === option && <Check className="w-4 h-4 text-[#facc15]" />}
            </button>
          ))}
        </div>
      </FloatingDropdown>
    </div>
  );
}

function VendorDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: VendorOption[];
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));

  return (
    <div className="relative inline-block w-full max-w-[140px]" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none text-center truncate relative"
      >
        <span className="block truncate">{value || 'None'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        align="end"
        width={240}
        preferredHeight={260}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="pr-1">
          {options.map((option, index) => (
            <button
              key={`${option.name}-${option.category || 'uncategorized'}-${index}`}
              type="button"
              onClick={() => {
                onChange(option.name);
                setIsOpen(false);
              }}
              className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[12px] font-extrabold text-gray-900 truncate">{option.name}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{option.category || ''}</div>
              </div>
              {value === option.name && <Check className="w-4 h-4 text-[#facc15]" />}
            </button>
          ))}
        </div>
      </FloatingDropdown>
    </div>
  );
}

function AssigneeDropdown({
  task,
  staffOptions,
  onChange,
}: {
  task: TaskItem;
  staffOptions: StaffOption[];
  onChange: (next: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const selectedNames = task.assignees.map((assignee) => assignee.name);
  const selectedStaff = staffOptions.filter((member) => selectedNames.includes(member.name));

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer relative min-w-[148px] text-left"
      >
        <span className="block truncate">{selectedNames.length ? `${selectedNames.length} assigned` : 'Unassigned'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        align="end"
        width={320}
        preferredHeight={300}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="pr-1">
          {staffOptions.map((member) => {
            const selected = selectedNames.includes(member.name);

            return (
              <button
                key={member.uid}
                type="button"
                onClick={() => {
                  const next = selected ? selectedNames.filter((name) => name !== member.name) : [...selectedNames, member.name];
                  onChange(next);
                }}
                className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500 uppercase">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-extrabold text-gray-900 break-words whitespace-normal leading-tight">{member.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider break-words whitespace-normal">{member.role}</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${selected ? 'border-[#facc15] bg-[#fff8d6]' : 'border-gray-200 bg-white'}`}>
                  {selected && <Check className="w-3.5 h-3.5 text-[#d4a017]" />}
                </div>
              </button>
            );
          })}
        </div>
      </FloatingDropdown>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        {selectedStaff.slice(0, 3).map((member) => (
          <div key={member.uid} className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
            {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
          </div>
        ))}
        {selectedStaff.length > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
            +{selectedStaff.length - 3}
          </div>
        )}
        {selectedStaff.length === 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border border-white shadow-sm overflow-hidden shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.slug;
  const { user } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter((task) => task.status === filterStatus);
  const vendorOptionValues = useMemo(() => {
    const deduped = Array.from(new Map(vendorOptions.map((option) => [option.name, option])).values());
    return [{ name: 'None', category: '' }, ...deduped.filter((option) => option.name !== 'None')];
  }, [vendorOptions]);
  const tasksPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice((currentPageSafe - 1) * tasksPerPage, currentPageSafe * tasksPerPage);
  const emptyRows = Math.max(0, tasksPerPage - paginatedTasks.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!user) return;

    const fetchPageData = async () => {
      try {
        const idToken = await user.getIdToken();
        const [eventResponse, taskResponse, staffResponse, vendorResponse] = await Promise.all([
          fetch(`/api/events/${eventId}`, { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch(`/api/tasks?eventId=${eventId}`, { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch('/api/staff', { headers: { Authorization: `Bearer ${idToken}` } }),
          fetch('/api/vendors', { headers: { Authorization: `Bearer ${idToken}` } }),
        ]);

        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          if (eventData?.title) setEventTitle(eventData.title);
        }

        if (taskResponse.ok) {
          const taskPayload = await taskResponse.json();
          const records = Array.isArray(taskPayload) ? taskPayload : taskPayload?.tasks || [];
          setTasks(records.map((record: TaskRecord, index: number) => mapTaskRecord(record, index)));
        } else {
          setTasks([]);
        }

        if (staffResponse.ok) {
          setStaffOptions(extractStaff(await staffResponse.json()));
        }

        if (vendorResponse.ok) {
          const vendorPayload = await vendorResponse.json();
          setVendorOptions(extractVendorOptions(vendorPayload));
        } else {
          console.error('Failed to fetch vendors for task page:', vendorResponse.status, await vendorResponse.text().catch(() => ''));
          setVendorOptions([]);
        }
      } catch (error) {
        console.error('Failed to load tasks page data:', error);
        setTasks([]);
        setVendorOptions([]);
      }
    };

    fetchPageData();
  }, [eventId, user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const handleAddTask = async (newTask: {
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    assignees: string[];
    vendor: string;
  }) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          eventId,
          ...newTask,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const createdTask = await response.json();
      setTasks((prevTasks) => [mapTaskRecord(createdTask, 0), ...prevTasks]);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskToUpdate: TaskItem, nextStatus: string) => {
    const previousStatus = tasks.find((task) => task.id === taskToUpdate.id)?.status;

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, status: nextStatus } : task))
    );

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          taskObjectId: taskToUpdate.dbId,
          taskId: taskToUpdate.taskCode || taskToUpdate.id,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      if (previousStatus) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, status: previousStatus } : task))
        );
      }
    }
  };

  const updateTaskVendor = async (taskToUpdate: TaskItem, vendor: string) => {
    const previousValue = tasks.find((task) => task.id === taskToUpdate.id)?.vendor;

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, vendor } : task))
    );

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          taskObjectId: taskToUpdate.dbId,
          taskId: taskToUpdate.taskCode || taskToUpdate.id,
          vendor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update vendor');
      }
    } catch (error) {
      console.error('Failed to update task vendor:', error);
      if (previousValue) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, vendor: previousValue } : task))
        );
      }
    }
  };

  const updateTaskAssignees = async (taskToUpdate: TaskItem, assigneeNames: string[]) => {
    const previousAssignees = tasks.find((task) => task.id === taskToUpdate.id)?.assignees || [];
    const selectedAssignees = staffOptions
      .filter((member) => assigneeNames.includes(member.name))
      .map((member) => ({ name: member.name, avatarUrl: member.avatarUrl || null }));

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskToUpdate.id
          ? {
              ...task,
              assignees: selectedAssignees,
              assignee: selectedAssignees.length ? selectedAssignees.map((entry) => entry.name).join(', ') : 'Unassigned',
            }
          : task
      )
    );

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          taskObjectId: taskToUpdate.dbId,
          taskId: taskToUpdate.taskCode || taskToUpdate.id,
          assignees: assigneeNames,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update assignees');
      }
    } catch (error) {
      console.error('Failed to update task assignees:', error);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskToUpdate.id
            ? {
                ...task,
                assignees: previousAssignees,
                assignee: previousAssignees.length ? previousAssignees.map((entry) => entry.name).join(', ') : 'Unassigned',
              }
            : task
        )
      );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-12 mt-2" style={{ scrollbarGutter: 'stable' }}>
      
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        BACK TO EVENTS
      </Link>

      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/admin/events" className="hover:text-[#1d1d1f] transition-colors">Events</Link> <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{eventTitle || 'Event'}</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Event <span className="text-[#eebf43] italic pr-2">Tasks</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Monitor deliverables across all your events. Keep your production timeline running seamlessly and easily assign responsibilities to staff.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          ADD NEW TASK
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE TASKS REGISTRY</h2>
          <div className="flex items-center gap-4">
            <FilterDropdown value={filterStatus} onChange={setFilterStatus} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] w-[35%]">TASK DETAILS</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">STATUS</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">DUE</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]">VENDOR</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-right w-[20%]">ASSIGNEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-medium text-[13px]">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-4 md:px-6 py-4">
                        <div className="font-extrabold text-[14px] text-gray-900 group-hover:text-[#eebf43] transition-colors mb-1 truncate">{task.title}</div>
                        <div className="text-[12px] font-medium text-[#71717a] line-clamp-2 break-words">{task.description}</div>
                        <div className="mt-2">
                          <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority} PRIORITY
                          </span>
                        </div>
                      </td>

                      <td className="px-4 md:px-6 py-4 text-center align-middle">
                        <StatusDropdown value={task.status} onChange={(value) => updateTaskStatus(task, value)} />
                      </td>

                      <td className="px-4 md:px-6 py-4 text-center align-middle">
                        <div className="text-[11px] font-bold text-gray-600 truncate">{task.dueDate}</div>
                        <div className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">{task.dueTime || 'EOD'}</div>
                      </td>

                      <td className="px-4 md:px-6 py-4 text-center align-middle">
                        <VendorDropdown value={task.vendor || 'None'} options={vendorOptionValues} onChange={(value) => updateTaskVendor(task, value)} />
                      </td>

                      <td className="px-4 md:px-6 py-4 text-right align-middle">
                        <div className="flex flex-col items-end">
                          <AssigneeDropdown task={task} staffOptions={staffOptions} onChange={(value) => updateTaskAssignees(task, value)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`empty-row-${currentPageSafe}-${index}`} className="pointer-events-none">
                      <td className="px-4 md:px-6 py-4 h-[92px]" colSpan={5}>
                        <div className="w-full h-full rounded-lg border border-dashed border-transparent" />
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30 rounded-b-xl">
          <span className="text-xs text-[#a1a1aa] font-medium">Showing {filteredTasks.length === 0 ? 0 : (currentPageSafe - 1) * tasksPerPage + 1}-{Math.min(currentPageSafe * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} Tasks</span>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              disabled={currentPageSafe === 1}
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#a1a1aa] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eebf43] text-[#1d1d1f] font-bold text-xs shadow-sm shadow-[#eebf43]/20">
              {currentPageSafe}
            </button>
            <button 
              type="button"
              disabled={currentPageSafe >= totalPages || filteredTasks.length === 0}
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleAddTask}
        staffOptions={staffOptions}
        vendorOptions={vendorOptionValues}
      />
    </div>
  );
}
