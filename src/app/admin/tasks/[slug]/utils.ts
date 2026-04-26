import type { OptionRecord, SelectOption, TaskItem, TaskRecord } from './types';

export const normalizeStatus = (value?: string) => {
  if (!value) return 'TO DO';
  const normalized = value.toUpperCase().replace(/[_-]/g, ' ').trim();

  if (normalized === 'TODO' || normalized === 'TO DO') return 'TO DO';
  if (normalized === 'INPROGRESS' || normalized === 'IN PROGRESS') return 'IN PROGRESS';
  if (normalized === 'COMPLETE' || normalized === 'COMPLETED') return 'COMPLETED';

  return normalized;
};

export const normalizePriority = (value?: string) => (value ? value.toUpperCase() : 'MEDIUM');

export const formatDateLabel = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const resolveName = (value?: { name?: string } | string, fallback = 'None') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.name || fallback;
};

export const getStringId = (value?: unknown) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '$oid' in value) {
    const oidValue = (value as { $oid?: string }).$oid;
    return oidValue || undefined;
  }
  return String(value);
};

export const mapTaskRecord = (task: TaskRecord, index: number): TaskItem => {
  const dueDate = task.dueDate ?? task.due?.date;
  const dueTime = task.dueTime ?? task.due?.time;
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
    dueDate: formatDateLabel(dueDate),
    dueTime: dueTime || '',
    assignee: resolveName(task.assignee, 'Unassigned'),
    vendor: resolveName(task.vendor, 'None'),
  };
};

export const extractNames = (payload: any): string[] => {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.users)
      ? payload.users
      : [];

  return records
    .map((record: OptionRecord) => {
      if (record?.name && record.name.trim()) return record.name.trim();
      const fullName = `${record?.firstName || ''} ${record?.lastName || ''}`.trim();
      return fullName;
    })
    .filter(Boolean);
};

export const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toTimeInputValue = (value: Date) => {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const combineDateAndTime = (date: string, time: string) => {
  if (!date || !time) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const getDueDateTimeError = (date: string, time: string, now: Date) => {
  if (!date || !time) return '';
  const selectedDueDateTime = combineDateAndTime(date, time);
  if (!selectedDueDateTime || selectedDueDateTime.getTime() < now.getTime()) {
    return 'Due date and time cannot be earlier than the current system date and time.';
  }
  return '';
};

export const getNextSelectableDateTime = (value: Date) => {
  const next = new Date(value);
  if (next.getSeconds() > 0 || next.getMilliseconds() > 0) {
    next.setMinutes(next.getMinutes() + 1, 0, 0);
  } else {
    next.setSeconds(0, 0);
  }
  return next;
};

export const formatTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if ([hours, minutes].some(Number.isNaN)) return value;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getMinutesFromTimeValue = (value?: string) => {
  if (!value) return 0;
  const [hours, minutes] = value.split(':').map(Number);
  if ([hours, minutes].some(Number.isNaN)) return 0;
  return hours * 60 + minutes;
};

export const buildTimeOptions = (minTime?: string): SelectOption[] => {
  const startMinutes = getMinutesFromTimeValue(minTime);

  return Array.from({ length: 24 * 60 - startMinutes }, (_, index) => {
    const totalMinutes = startMinutes + index;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      value,
      label: formatTimeLabel(value),
      sublabel: value,
    };
  });
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
    case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'TO DO': return 'bg-gray-100 text-gray-500';
    case 'IN PROGRESS': return 'bg-[#facc15]/20 text-[#b48600]';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export const getTaskStatusTone = (status: string) => {
  let statusColor = 'text-gray-500 bg-gray-50';
  let dotColor = 'bg-gray-400';

  if (status === 'COMPLETED') {
    statusColor = 'text-emerald-700 bg-emerald-50';
    dotColor = 'bg-emerald-500';
  } else if (status === 'IN PROGRESS') {
    statusColor = 'text-[#b48600] bg-[#facc15]/20';
    dotColor = 'bg-[#facc15]';
  }

  return { statusColor, dotColor };
};
