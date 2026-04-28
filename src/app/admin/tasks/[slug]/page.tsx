'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowRight, Filter, ListFilter, Plus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import CreateTaskModal from '../CreateTaskModal';
import { TASK_PRIORITY_OPTIONS, TaskMultiSelect, TaskSelect, type TaskSelectOption } from '../TaskControls';

type TaskItem = {
  id: string;
  dbId?: string;
  taskCode?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDateRaw: string;
  dueDateLabel: string;
  dueTime: string;
  assignees: string[];
  vendor: string;
};

type TaskRecord = {
  _id?: unknown;
  taskId?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: { date?: string; time?: string };
  dueDate?: string;
  dueTime?: string;
  assignee?: unknown;
  vendor?: { name?: string } | string;
};

type DirectoryRecord = {
  uid?: string;
  name?: string;
  role?: string;
  accessRole?: string;
};

const STATUS_OPTIONS: TaskSelectOption[] = [
  { value: 'TO DO', label: 'To Do' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const STATUS_FILTER_OPTIONS: TaskSelectOption[] = [
  { value: 'ALL', label: 'All Status' },
  ...STATUS_OPTIONS,
];

const PRIORITY_FILTER_OPTIONS: TaskSelectOption[] = [
  { value: 'ALL', label: 'All Priority' },
  ...TASK_PRIORITY_OPTIONS.map(({ value, label }) => ({ value, label })),
];

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const normalizeStatus = (value?: string) => {
  if (!value) return 'TO DO';
  const normalized = value.toUpperCase().replace(/[_-]/g, ' ').trim();

  if (normalized === 'TODO' || normalized === 'TO DO') return 'TO DO';
  if (normalized === 'INPROGRESS' || normalized === 'IN PROGRESS') return 'IN PROGRESS';
  if (normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'COMPLETED';

  return normalized;
};

const normalizePriority = (value?: string) => {
  const normalized = value?.toUpperCase().trim();
  if (normalized === 'CRITICAL') return 'CRITICAL';
  if (normalized === 'HIGH') return 'HIGH';
  if (normalized === 'LOW') return 'LOW';
  return 'MEDIUM';
};

const formatDateLabel = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStringId = (value?: unknown) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '$oid' in value) {
    return (value as { $oid?: string }).$oid || undefined;
  }
  return String(value);
};

const uniqueNames = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const extractAssigneeNames = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return uniqueNames([value]);
  }

  if (Array.isArray(value)) {
    return uniqueNames(
      value.flatMap((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        if (typeof entry === 'object' && entry !== null && 'name' in entry) {
          const name = (entry as { name?: string }).name;
          return name ? [name] : [];
        }

        return [];
      })
    );
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as { name?: unknown; names?: unknown };

    if (Array.isArray(record.names)) {
      return uniqueNames(record.names.filter((entry): entry is string => typeof entry === 'string'));
    }

    if (typeof record.name === 'string') {
      return uniqueNames([record.name]);
    }
  }

  return [];
};

const resolveVendorName = (value?: { name?: string } | string, fallback = 'None') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;
  return value.name || fallback;
};

const mapTaskRecord = (task: TaskRecord, index: number): TaskItem => {
  const dueDateRaw = task.dueDate ?? task.due?.date ?? '';
  const dueTime = task.dueTime ?? task.due?.time ?? '';
  const dbId = getStringId(task._id);
  const taskCode = task.taskId || undefined;
  const idValue = dbId || taskCode || `TSK-${String(index + 1).padStart(3, '0')}`;

  return {
    id: String(idValue),
    dbId,
    taskCode,
    title: task.title || 'Untitled Task',
    description: task.description || '',
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    dueDateRaw,
    dueDateLabel: formatDateLabel(dueDateRaw),
    dueTime,
    assignees: extractAssigneeNames(task.assignee),
    vendor: resolveVendorName(task.vendor, 'None'),
  };
};

const extractDirectoryRecords = (payload: unknown): DirectoryRecord[] => {
  if (Array.isArray(payload)) {
    return payload as DirectoryRecord[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as { users?: DirectoryRecord[] };
    return record.users || [];
  }

  return [];
};

const uniqueOptions = (options: TaskSelectOption[]) => {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) {
      return false;
    }
    seen.add(option.value);
    return true;
  });
};

const getStatusTone = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return {
        trigger: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50',
        dot: 'bg-emerald-500',
      };
    case 'IN PROGRESS':
      return {
        trigger: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-50',
        dot: 'bg-amber-500',
      };
    default:
      return {
        trigger: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
        dot: 'bg-gray-400',
      };
  }
};

const getPriorityTone = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'border-red-300 bg-red-50 text-red-700';
    case 'HIGH':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'LOW':
      return 'border-emerald-200 bg-emerald-50 text-emerald-600';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
};

const getPriorityOption = (priority: string) =>
  TASK_PRIORITY_OPTIONS.find((option) => option.value === priority) || TASK_PRIORITY_OPTIONS[2];

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: eventId } = use(params);
  const { user } = useAuth();
  const [eventTitle, setEventTitle] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<TaskSelectOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<TaskSelectOption[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user) return;

    const fetchPageData = async () => {
      try {
        const idToken = await user.getIdToken();
        const [eventResponse, tasksResponse, usersResponse, vendorResponse] = await Promise.all([
          fetch(`/api/events/${eventId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/tasks?eventId=${eventId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/users', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/vendors', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (eventResponse.ok) {
          const eventPayload = await eventResponse.json();
          setEventTitle(eventPayload?.title || '');
        }

        if (tasksResponse.ok) {
          const tasksPayload = await tasksResponse.json();
          const taskRecords = Array.isArray(tasksPayload) ? tasksPayload : tasksPayload?.tasks || [];
          setTasks(taskRecords.map((task: TaskRecord, index: number) => mapTaskRecord(task, index)));
        } else {
          setTasks([]);
        }

        if (usersResponse.ok) {
          const staffPayload = await usersResponse.json();
          const options = uniqueOptions(
            extractDirectoryRecords(staffPayload)
              .reduce<TaskSelectOption[]>((collection, record) => {
                const name = record.name?.trim();
                if (!name) {
                  return collection;
                }

                collection.push({
                  value: name,
                  label: name,
                  sublabel: record.role || record.accessRole || 'Production Staff',
                });

                return collection;
              }, [])
          );
          setStaffOptions(options);
        }

        if (vendorResponse.ok) {
          const vendorPayload = await vendorResponse.json();
          const vendorRecords = Array.isArray(vendorPayload) ? vendorPayload : vendorPayload?.vendors || [];
          const options = uniqueOptions([
            { value: 'None', label: 'None' },
            ...vendorRecords
              .map((record: { name?: string }) => record?.name?.trim())
              .filter(Boolean)
              .map((name: string) => ({ value: name, label: name })),
          ]);
          setVendorOptions(options);
        }
      } catch (error) {
        console.error('Failed to load tasks admin page:', error);
        setTasks([]);
      }
    };

    fetchPageData();
  }, [eventId, user]);

  const allVendorOptions = useMemo(
    () =>
      uniqueOptions([
        { value: 'None', label: 'None' },
        ...vendorOptions,
        ...tasks
          .map((task) => task.vendor)
          .filter(Boolean)
          .map((vendor) => ({ value: vendor, label: vendor })),
      ]),
    [tasks, vendorOptions]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
      }),
    [priorityFilter, statusFilter, tasks]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, statusFilter, tasks.length]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTasks = filteredTasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  const updateTaskStatus = async (taskToUpdate: TaskItem, nextStatus: string) => {
    const previousStatus = taskToUpdate.status;

    setTasks((current) =>
      current.map((task) => (task.id === taskToUpdate.id ? { ...task, status: nextStatus } : task))
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
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update status.');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks((current) =>
        current.map((task) => (task.id === taskToUpdate.id ? { ...task, status: previousStatus } : task))
      );
    }
  };

  const updateTaskVendor = async (taskToUpdate: TaskItem, nextVendor: string) => {
    const previousVendor = taskToUpdate.vendor;

    setTasks((current) =>
      current.map((task) => (task.id === taskToUpdate.id ? { ...task, vendor: nextVendor } : task))
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
          vendor: nextVendor,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update vendor.');
      }
    } catch (error) {
      console.error('Failed to update task vendor:', error);
      setTasks((current) =>
        current.map((task) => (task.id === taskToUpdate.id ? { ...task, vendor: previousVendor } : task))
      );
    }
  };

  const updateTaskAssignees = async (taskToUpdate: TaskItem, nextAssignees: string[]) => {
    const previousAssignees = taskToUpdate.assignees;

    setTasks((current) =>
      current.map((task) => (task.id === taskToUpdate.id ? { ...task, assignees: nextAssignees } : task))
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
          assignee: nextAssignees,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update assignees.');
      }
    } catch (error) {
      console.error('Failed to update task assignees:', error);
      setTasks((current) =>
        current.map((task) => (task.id === taskToUpdate.id ? { ...task, assignees: previousAssignees } : task))
      );
    }
  };

  return (
    <div className="mt-2 w-full animate-in fade-in px-4 pb-12 duration-500 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
            <Link href="/admin/events" className="transition-colors hover:text-[#1d1d1f]">
              Events
            </Link>
            <ArrowRight size={10} />
            <span className="text-[#1d1d1f]">{eventTitle || 'Event'}</span>
          </p>
          <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f]">
            Event <span className="pr-2 italic text-[#eebf43]">Tasks</span>
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-[#71717a]">
            Monitor deliverables across all your events with compact controls that keep assignments, status, and due
            timing easy to manage.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#eebf43] px-6 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-md shadow-[#eebf43]/20 transition-colors hover:bg-[#dcae32]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add New Task
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#eee7d6] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#f2ecdd] px-4 py-4 md:flex-row md:items-center md:px-5">
          <h2 className="text-[15px] font-extrabold uppercase tracking-[0.22em] text-[#1f1c14]">Live Tasks Registry</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TaskSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={PRIORITY_FILTER_OPTIONS}
              size="toolbar"
              overlayMinWidth={180}
              prefixIcon={<Filter className="h-4 w-4" />}
              triggerClassName="min-w-[170px]"
            />

            <TaskSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              size="toolbar"
              overlayMinWidth={180}
              prefixIcon={<ListFilter className="h-4 w-4" />}
              triggerClassName="min-w-[170px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#f2ecdd] bg-[#fffdf7]">
                <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f9682] md:px-5">
                  Task Details
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f9682] md:px-5">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f9682] md:px-5">
                  Due
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f9682] md:px-5">
                  Vendor
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f9682] md:px-5">
                  Assignees
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f1e3]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] font-medium text-[#7b7465]">
                    No tasks found matching your current filters.
                  </td>
                </tr>
              ) : (
                pagedTasks.map((task) => {
                  const statusTone = getStatusTone(task.status);

                  return (
                    <tr key={task.id} className="transition-colors hover:bg-[#fffdf8]">
                      <td className="px-4 py-3.5 align-middle md:px-5">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-black text-[#1f1c14]" title={task.title}>
                            {task.title}
                          </div>
                          <div
                            className="mt-1 truncate text-[11px] font-medium text-[#7b7465]"
                            title={task.description || 'No description'}
                          >
                            {task.description || 'No description'}
                          </div>
                          <div className="mt-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em]',
                                getPriorityTone(task.priority)
                              )}
                            >
                              <span className="shrink-0">{getPriorityOption(task.priority).icon}</span>
                              {getPriorityOption(task.priority).label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle md:px-5">
                        <TaskSelect
                          value={task.status}
                          onChange={(nextStatus) => updateTaskStatus(task, nextStatus)}
                          options={STATUS_OPTIONS}
                          size="table"
                          overlayMinWidth={190}
                          className="mx-auto max-w-[180px]"
                          triggerClassName={cn('shadow-none', statusTone.trigger)}
                          renderValue={(selected) => (
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={cn('h-2 w-2 shrink-0 rounded-full', statusTone.dot)} />
                              <span className="truncate text-[11px] font-black uppercase tracking-[0.12em]">
                                {selected?.label || 'Select status'}
                              </span>
                            </span>
                          )}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-center align-middle md:px-5">
                        <div className="truncate text-[11px] font-black text-[#494232]" title={task.dueDateLabel}>
                          {task.dueDateLabel}
                        </div>
                        <div className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#a08e64]">
                          {task.dueTime || 'No Time'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle md:px-5">
                        <TaskSelect
                          value={task.vendor || 'None'}
                          onChange={(nextVendor) => updateTaskVendor(task, nextVendor)}
                          options={allVendorOptions}
                          size="table"
                          overlayMinWidth={200}
                          className="mx-auto max-w-[170px]"
                          triggerClassName="bg-[#fcfbf7]"
                        />
                      </td>

                      <td className="px-4 py-3.5 align-middle md:px-5">
                        <TaskMultiSelect
                          values={task.assignees}
                          onChange={(nextAssignees) => updateTaskAssignees(task, nextAssignees)}
                          options={staffOptions}
                          emptyLabel="Unassigned"
                          size="table"
                          align="right"
                          overlayMinWidth={260}
                          className="ml-auto max-w-[220px]"
                          triggerClassName="bg-white"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#f2ecdd] bg-[#fffdf7] px-4 py-4 md:flex-row md:px-5">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9f9682]">
            Showing {(filteredTasks.length === 0 ? 0 : (safePage - 1) * pageSize + 1)}-
            {Math.min(safePage * pageSize, filteredTasks.length)} of {filteredTasks.length} Tasks
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className={cn(
                'rounded-lg border px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors',
                safePage === 1
                  ? 'cursor-not-allowed border-[#efe7d1] bg-[#f8f4ea] text-[#b8ae9a]'
                  : 'border-[#e8e0ca] bg-white text-[#8b8371] hover:border-[#d8cfbb] hover:text-[#1f1c14]'
              )}
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              className={cn(
                'rounded-lg border px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors',
                safePage === totalPages
                  ? 'cursor-not-allowed border-[#efe7d1] bg-[#f8f4ea] text-[#b8ae9a]'
                  : 'border-[#e4be4f] bg-[#facc15] text-gray-900 hover:bg-[#eab308]'
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        eventId={eventId}
        user={user}
        staffOptions={staffOptions}
        vendorOptions={allVendorOptions}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={(createdTask) => {
          setTasks((current) => [mapTaskRecord(createdTask as TaskRecord, 0), ...current]);
        }}
      />
    </div>
  );
}
