'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type SelectOption = { value: string; label: string; sublabel?: string };
type TaskDraft = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  vendor: string;
};
type TaskItem = TaskDraft & { id: string; dbId?: string; taskCode?: string };
type PageState = {
  eventTitle: string;
  tasks: TaskItem[];
  staffOptions: string[];
  vendorOptions: string[];
  filterStatus: string;
  isModalOpen: boolean;
  modal: TaskDraft;
  dueDateTimeError: string;
  currentDateTime: Date;
  isSubmitting: boolean;
};

const DEFAULT_DRAFT: TaskDraft = {
  title: '',
  description: '',
  status: 'TO DO',
  priority: 'MEDIUM',
  dueDate: '',
  dueTime: '',
  assignee: '',
  vendor: 'None',
};
const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];
const STATUS_OPTIONS = [
  { value: 'TO DO', label: 'TO DO' },
  { value: 'IN PROGRESS', label: 'IN PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
];
const FILTER_OPTIONS = [{ value: 'ALL', label: 'ALL STATUS' }, ...STATUS_OPTIONS];
const TABLE_HEADERS = [
  ['TASK DETAILS', 'px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] w-[35%]'],
  ['STATUS', 'px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]'],
  ['DUE', 'px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]'],
  ['VENDOR', 'px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-center w-[15%]'],
  ['ASSIGNEE', 'px-4 md:px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] text-right w-[20%]'],
] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const overlayPanelClassName = 'z-[360] overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';
const overlayOptionClassName = 'px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap';
const calendarPanelClassName = 'z-[360] min-w-[22rem] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';
const modalLabelClassName = 'block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5';
const modalInputClassName = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none';
const priorityColorMap: Record<string, string> = {
  HIGH: 'text-red-700 bg-red-50 border-red-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  LOW: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};
const statusStyleMap: Record<string, { pill: string; dot: string }> = {
  'TO DO': { pill: 'text-gray-500 bg-gray-50', dot: 'bg-gray-400' },
  'IN PROGRESS': { pill: 'text-[#b48600] bg-[#facc15]/20', dot: 'bg-[#facc15]' },
  COMPLETED: { pill: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
};

const normalizeStatus = (value?: string) => {
  const normalized = value?.toUpperCase().replace(/[_-]/g, ' ').trim();
  return normalized === 'TODO' || normalized === 'TO DO'
    ? 'TO DO'
    : normalized === 'INPROGRESS' || normalized === 'IN PROGRESS'
      ? 'IN PROGRESS'
      : normalized === 'COMPLETE' || normalized === 'COMPLETED'
        ? 'COMPLETED'
        : normalized || 'TO DO';
};
const normalizePriority = (value?: string) => (value ? value.toUpperCase() : 'MEDIUM');
const formatDateLabel = (value?: string) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const resolveName = (value?: { name?: string } | string, fallback = 'None') => !value ? fallback : typeof value === 'string' ? value : value.name || fallback;
const getStringId = (value?: unknown) => !value ? undefined : typeof value === 'string' ? value : typeof value === 'object' && value !== null && '$oid' in value ? (value as { $oid?: string }).$oid : String(value);
const mapTaskRecord = (task: any, index: number): TaskItem => ({
  id: String(getStringId(task?._id) || task?.taskId || `TSK-${String(index + 1).padStart(3, '0')}`),
  dbId: getStringId(task?._id),
  taskCode: task?.taskId || undefined,
  title: task?.title || 'Untitled Task',
  description: task?.description || '',
  status: normalizeStatus(task?.status),
  priority: normalizePriority(task?.priority),
  dueDate: formatDateLabel(task?.dueDate ?? task?.due?.date),
  dueTime: task?.dueTime ?? task?.due?.time ?? '',
  assignee: resolveName(task?.assignee, 'Unassigned'),
  vendor: resolveName(task?.vendor, 'None'),
});
const extractNames = (payload: any) =>
  (Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : [])
    .map((record: any) => record?.name?.trim?.() || `${record?.firstName || ''} ${record?.lastName || ''}`.trim())
    .filter(Boolean);
const toDateInputValue = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const toTimeInputValue = (value: Date) => `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
const combineDateAndTime = (date: string, time: string) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return [year, month, day, hours, minutes].some(Number.isNaN) ? null : new Date(year, month - 1, day, hours, minutes, 0, 0);
};
const getDueDateTimeError = (date: string, time: string, now: Date) => {
  const due = combineDateAndTime(date, time);
  return date && time && (!due || due.getTime() < now.getTime())
    ? 'Due date and time cannot be earlier than the current system date and time.'
    : '';
};
const getNextSelectableDateTime = (value: Date) => {
  const next = new Date(value);
  if (next.getSeconds() > 0 || next.getMilliseconds() > 0) next.setMinutes(next.getMinutes() + 1, 0, 0);
  else next.setSeconds(0, 0);
  return next;
};
const formatTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return [hours, minutes].some(Number.isNaN)
    ? value
    : new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const getMinutesFromTimeValue = (value?: string) => {
  const [hours, minutes] = (value || '').split(':').map(Number);
  return [hours, minutes].some(Number.isNaN) ? 0 : hours * 60 + minutes;
};
const buildTimeOptions = (minTime?: string): SelectOption[] =>
  Array.from({ length: 24 * 60 - getMinutesFromTimeValue(minTime) }, (_, index) => {
    const totalMinutes = getMinutesFromTimeValue(minTime) + index;
    const value = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    return { value, label: formatTimeLabel(value), sublabel: value };
  });
const uniqueNames = (fallback: string, options: string[], current?: string) => Array.from(new Set([fallback, ...(options.length ? options : [current || fallback])]));
const renderCaret = (className: string, strokeWidth = 2) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M19 9l-7 7-7-7" /></svg>;
const modalChevron = <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]"><ChevronDown className="w-4 h-4" /></div>;
const getOverlayPosition = (
  triggerRect: DOMRect,
  { preferredHeight = 300, preferredWidth, contentHeight }: { preferredHeight?: number; preferredWidth?: number; contentHeight?: number } = {}
) => {
  const padding = 8;
  const spacing = 8;
  const viewport = window.visualViewport;
  const leftOffset = viewport?.offsetLeft ?? 0;
  const topOffset = viewport?.offsetTop ?? 0;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  const visibleLeft = leftOffset + padding;
  const visibleTop = topOffset + padding;
  const visibleRight = leftOffset + width - padding;
  const visibleBottom = topOffset + height - padding;
  const panelWidth = Math.min(Math.max(triggerRect.width, preferredWidth ?? triggerRect.width), width - padding * 2);
  const triggerLeft = leftOffset + triggerRect.left;
  const triggerRight = leftOffset + triggerRect.right;
  const triggerTop = topOffset + triggerRect.top;
  const triggerBottom = topOffset + triggerRect.bottom;
  const bottomSpace = visibleBottom - triggerBottom;
  const topSpace = triggerTop - visibleTop;
  const renderAbove = bottomSpace < Math.min(preferredHeight, 220) && topSpace > bottomSpace;
  const maxHeight = Math.max(140, Math.min(preferredHeight, renderAbove ? topSpace - spacing : bottomSpace - spacing));
  const panelHeight = Math.min(maxHeight, contentHeight ?? preferredHeight);
  let left = triggerLeft;
  if (left + panelWidth > visibleRight) {
    const rightAlignedLeft = triggerRight - panelWidth;
    left = rightAlignedLeft >= visibleLeft ? rightAlignedLeft : Math.max(visibleLeft, visibleRight - panelWidth);
  }
  return {
    position: 'fixed' as const,
    top: Math.round(renderAbove ? Math.max(visibleTop, triggerTop - panelHeight - spacing) : triggerBottom + spacing),
    left: Math.round(left),
    width: Math.round(panelWidth),
    maxHeight,
  };
};

const useOverlayMenu = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLDivElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
  preferredWidth?: number,
  preferredHeight?: number
) => {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>();

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const nextStyle = getOverlayPosition(triggerRef.current.getBoundingClientRect(), {
        preferredHeight,
        preferredWidth,
        contentHeight: menuRef.current?.scrollHeight,
      });
      setMenuStyle((prev) => prev && ['top', 'left', 'width', 'maxHeight'].every((key) => prev[key as keyof React.CSSProperties] === nextStyle[key as keyof React.CSSProperties]) ? prev : nextStyle);
    };
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePosition) : null;
    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);
    resizeObserver?.observe(triggerRef.current);
    if (menuRef.current) resizeObserver?.observe(menuRef.current);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [isOpen, onClose, preferredHeight, preferredWidth, triggerRef, menuRef]);

  return menuStyle;
};

const OverlaySelect = ({
  value,
  options,
  onChange,
  renderTrigger,
  renderOption,
  triggerWrapperClassName,
  panelClassName,
  preferredWidth,
  preferredHeight,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  renderTrigger: (selectedOption: SelectOption | undefined, isOpen: boolean) => React.ReactNode;
  renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
  triggerWrapperClassName?: string;
  panelClassName?: string;
  preferredWidth?: number;
  preferredHeight?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuStyle = useOverlayMenu(isOpen, triggerRef, menuRef, () => setIsOpen(false), preferredWidth, preferredHeight);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <>
      <div
        ref={triggerRef}
        className={triggerWrapperClassName}
        onClick={() => setIsOpen((open) => !open)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((open) => !open);
          }
        }}
      >
        {renderTrigger(selectedOption, isOpen)}
      </div>
      {isOpen && menuStyle && createPortal(
        <div ref={menuRef} className={panelClassName || overlayPanelClassName} style={menuStyle}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={overlayOptionClassName}
            >
              {renderOption ? renderOption(option, option.value === value) : (
                <>
                  <div>
                    <div className="text-[13px] font-extrabold text-gray-900">{option.label}</div>
                    {option.sublabel && <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{option.sublabel}</div>}
                  </div>
                  {option.value === value && <Check size={15} className="text-[#facc15]" />}
                </>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

const OverlayDatePicker = ({
  value,
  onChange,
  label,
  minDate,
  preferredWidth = 352,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minDate?: string;
  preferredWidth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuStyle = useOverlayMenu(isOpen, triggerRef, menuRef, () => setIsOpen(false), preferredWidth, 392);

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [value]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {label && <label className={modalLabelClassName}>{label}</label>}
      <div ref={triggerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] transition-all outline-none flex items-center justify-between ${isOpen ? 'border-[#eebf43] bg-white ring-1 ring-[#eebf43]' : 'hover:border-gray-300'} `}
        >
          <span className={value ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'}>
            {value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select due date...'}
          </span>
          <CalendarIcon size={16} className="text-gray-400" />
        </button>
      </div>
      {isOpen && menuStyle && createPortal(
        <div ref={menuRef} className={calendarPanelClassName} style={menuStyle}>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <ArrowLeft size={16} />
            </button>
            <div className="text-[14px] font-extrabold text-gray-900">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
            <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-7 gap-2 text-center">
            {DAYS.map((dayName, index) => <div key={`${dayName}-${index}`} className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">{dayName}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => <div key={`empty-${index}`} className="h-10 w-10" />)}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = value === dateValue;
              const isPast = minDate ? dateValue < minDate : dayDate.getTime() < today.getTime();
              const isToday = toDateInputValue(today) === dateValue;
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                  className={`h-10 w-10 flex items-center justify-center rounded-lg text-[12px] font-extrabold transition-all ${
                    isPast ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-[#facc15] text-gray-900' : isToday ? 'bg-gray-100 text-[#d4a017] hover:bg-gray-200' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: eventId } = use(params);
  const { user } = useAuth();
  const [state, setState] = useState<PageState>({
    eventTitle: '',
    tasks: [],
    staffOptions: [],
    vendorOptions: [],
    filterStatus: 'ALL',
    isModalOpen: false,
    modal: { ...DEFAULT_DRAFT },
    dueDateTimeError: '',
    currentDateTime: new Date(),
    isSubmitting: false,
  });
  const updateState = (patch: Partial<PageState> | ((prev: PageState) => Partial<PageState>)) => setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const headers = { Authorization: `Bearer ${await user.getIdToken()}` };
        const [eventResult, tasksResult, staffResult, vendorResult] = await Promise.allSettled([
          fetch(`/api/events/${eventId}`, { headers }),
          fetch(`/api/tasks?eventId=${eventId}`, { headers }),
          fetch('/api/staffs', { headers }),
          fetch('/api/vendors', { headers }),
        ]);
        if (cancelled) return;

        const next: Partial<PageState> = {};

        if (eventResult.status === 'fulfilled' && eventResult.value.ok) {
          const eventData = await eventResult.value.json();
          if (eventData?.title) next.eventTitle = eventData.title;
        }

        if (tasksResult.status === 'fulfilled') {
          if (tasksResult.value.ok) {
            const payload = await tasksResult.value.json();
            const records = Array.isArray(payload) ? payload : payload?.tasks || [];
            next.tasks = records.map((record: any, index: number) => mapTaskRecord(record, index));
          } else {
            console.error('Failed to load tasks:', await tasksResult.value.json().catch(() => ({})));
            next.tasks = [];
          }
        } else {
          console.error('Failed to load tasks:', tasksResult.reason);
          next.tasks = [];
        }

        if (staffResult.status === 'fulfilled' && staffResult.value.ok) next.staffOptions = Array.from(new Set([...extractNames(await staffResult.value.json()), 'Unassigned']));
        if (vendorResult.status === 'fulfilled' && vendorResult.value.ok) next.vendorOptions = Array.from(new Set(['None', ...extractNames(await vendorResult.value.json())]));
        updateState(next);
      } catch (error) {
        console.error('Failed to load task admin data:', error);
        if (!cancelled) updateState({ tasks: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, user]);

  useEffect(() => {
    if (!state.isModalOpen) return;
    updateState({ currentDateTime: new Date() });
    const intervalId = window.setInterval(() => updateState({ currentDateTime: new Date() }), 30000);
    return () => window.clearInterval(intervalId);
  }, [state.isModalOpen]);

  useEffect(() => {
    if (!state.isModalOpen) return;
    updateState({ dueDateTimeError: getDueDateTimeError(state.modal.dueDate, state.modal.dueTime, state.currentDateTime) });
  }, [state.currentDateTime, state.isModalOpen, state.modal.dueDate, state.modal.dueTime]);

  const filteredTasks = useMemo(
    () => state.filterStatus === 'ALL' ? state.tasks : state.tasks.filter((task) => task.status === state.filterStatus),
    [state.filterStatus, state.tasks]
  );
  const nextSelectableDateTime = getNextSelectableDateTime(state.currentDateTime);
  const minSelectableDateValue = toDateInputValue(nextSelectableDateTime);
  const minTimeForToday = state.modal.dueDate === minSelectableDateValue ? toTimeInputValue(nextSelectableDateTime) : undefined;
  const timeOptions = useMemo(() => buildTimeOptions(minTimeForToday), [minTimeForToday]);
  const resetModal = () => updateState({ isModalOpen: false, modal: { ...DEFAULT_DRAFT }, dueDateTimeError: '', isSubmitting: false });

  const patchTask = async (task: TaskItem, patch: Partial<Pick<TaskItem, 'status' | 'assignee' | 'vendor'>>) => {
    const previous = state.tasks.find((item) => item.id === task.id);
    if (!previous) return;
    updateState(({ tasks }) => ({ tasks: tasks.map((item) => item.id === task.id ? { ...item, ...patch } : item) }));

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ taskObjectId: task.dbId, taskId: task.taskCode || task.id, ...patch }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `Failed to update ${Object.keys(patch)[0]}`);
    } catch (error) {
      console.error('Failed to update task:', error);
      updateState(({ tasks }) => ({ tasks: tasks.map((item) => item.id === task.id ? previous : item) }));
    }
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const draft = state.modal;
    if (!draft.title || !draft.assignee || !draft.dueDate || !draft.dueTime || state.isSubmitting) return;

    const validationError = getDueDateTimeError(draft.dueDate, draft.dueTime, new Date());
    if (validationError) return updateState({ dueDateTimeError: validationError });

    try {
      updateState({ isSubmitting: true });
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ eventId, ...draft }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Failed to create task');
      const createdTask = await response.json();
      updateState(({ tasks }) => ({
        tasks: [mapTaskRecord(createdTask, 0), ...tasks],
        isModalOpen: false,
        modal: { ...DEFAULT_DRAFT },
        dueDateTimeError: '',
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Failed to create task:', error);
      updateState({ isSubmitting: false });
    }
  };

  const renderSimpleOption = (option: SelectOption, selected: boolean, optionClassName = 'truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800', emptyClassName = 'truncate whitespace-nowrap text-[12px] font-extrabold text-gray-500', showCheckWhenEmpty = false) => (
    <>
      <div className={option.value ? optionClassName : emptyClassName}>{option.label}</div>
      {selected && (showCheckWhenEmpty || !!option.value) && <Check size={15} className="shrink-0 text-[#facc15]" />}
    </>
  );

  const renderSelectField = ({ label, value, onChange, options, preferredWidth = 180, preferredHeight, triggerWrapperClassName = 'relative', renderTrigger, renderOption }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    preferredWidth?: number;
    preferredHeight?: number;
    triggerWrapperClassName?: string;
    renderTrigger: (selectedOption: SelectOption | undefined) => React.ReactNode;
    renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
  }) => label ? <div><label className={modalLabelClassName}>{label}</label><OverlaySelect value={value} onChange={onChange} options={options} triggerWrapperClassName={triggerWrapperClassName} panelClassName={overlayPanelClassName} preferredWidth={preferredWidth} preferredHeight={preferredHeight} renderTrigger={(selectedOption) => renderTrigger(selectedOption)} renderOption={renderOption} /></div> : <OverlaySelect value={value} onChange={onChange} options={options} triggerWrapperClassName={triggerWrapperClassName} panelClassName={overlayPanelClassName} preferredWidth={preferredWidth} preferredHeight={preferredHeight} renderTrigger={(selectedOption) => renderTrigger(selectedOption)} renderOption={renderOption} />;

  const renderRow = (task: TaskItem) => {
    const statusStyle = statusStyleMap[task.status] || statusStyleMap['TO DO'];
    return (
      <tr key={task.id} className="hover:bg-gray-50/30 transition-colors group">
        <td className="px-4 md:px-6 py-4">
          <div className="font-extrabold text-[14px] text-gray-900 group-hover:text-[#eebf43] transition-colors mb-1">{task.title}</div>
          <div className="text-[12px] font-medium text-[#71717a] line-clamp-2">{task.description}</div>
          <div className="mt-2">
            <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${priorityColorMap[task.priority] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
              {task.priority} PRIORITY
            </span>
          </div>
        </td>
        <td className="px-4 md:px-6 py-4 text-center align-middle">{renderSelectField({ value: task.status, onChange: (value) => patchTask(task, { status: value }), options: STATUS_OPTIONS, preferredWidth: 170, triggerWrapperClassName: 'relative inline-flex items-center', renderTrigger: (selectedOption) => <><span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} /><div className={`appearance-none inline-flex items-center gap-2 pl-5 pr-7 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${statusStyle.pill} cursor-pointer`}>{selectedOption?.label || task.status}</div>{renderCaret('w-3 h-3 text-current absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none')}</>, renderOption: (option, selected) => renderSimpleOption(option, selected, 'truncate whitespace-nowrap text-[12px] font-extrabold uppercase tracking-wider text-gray-800') })}</td>
        <td className="px-4 md:px-6 py-4 text-center align-middle">
          <div className="text-[11px] font-bold text-gray-600">{task.dueDate}</div>
          <div className="text-[10px] font-bold text-gray-400 mt-0.5">{task.dueTime || 'EOD'}</div>
        </td>
        <td className="px-4 md:px-6 py-4 text-center align-middle">{renderSelectField({ value: task.vendor || 'None', onChange: (value) => patchTask(task, { vendor: value }), options: uniqueNames('None', state.vendorOptions, task.vendor || 'None').map((vendorName) => ({ value: vendorName, label: vendorName })), preferredWidth: 168, triggerWrapperClassName: 'relative inline-block w-full max-w-[140px]', renderTrigger: (selectedOption) => <><div className="appearance-none w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none cursor-pointer text-center truncate">{selectedOption?.label || 'None'}</div>{renderCaret('w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none')}</>, renderOption: (option, selected) => renderSimpleOption(option, selected) })}</td>
        <td className="px-4 md:px-6 py-4 text-right align-middle">
          <div className="flex items-center justify-end gap-3">
            {renderSelectField({ value: task.assignee, onChange: (value) => patchTask(task, { assignee: value }), options: uniqueNames('Unassigned', state.staffOptions, task.assignee || 'Unassigned').map((staffName) => ({ value: staffName, label: staffName })), preferredWidth: 168, triggerWrapperClassName: 'relative', renderTrigger: (selectedOption) => <><div className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer">{selectedOption?.label || 'Unassigned'}</div>{renderCaret('w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none')}</>, renderOption: (option, selected) => renderSimpleOption(option, selected) })}
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} className="w-full h-full object-cover" />
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderModal = () => !state.isModalOpen ? null : (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">Add New Task</h3><button onClick={resetModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <form onSubmit={createTask} className="p-6 space-y-5">
          {[['title', 'Task Title', 'e.g., Finalize floral arrangements'], ['description', 'Detailed Description', 'Include specific requirements, vendor contacts, or special instructions...']].map(([key, label, placeholder]) => <div key={key}><label className={modalLabelClassName}>{label}</label>{key === 'description' ? <textarea required rows={3} value={state.modal.description} onChange={(event) => updateState((prev) => ({ modal: { ...prev.modal, description: event.target.value } }))} className={`${modalInputClassName} resize-none`} placeholder={placeholder} /> : <input type="text" required value={state.modal.title} onChange={(event) => updateState((prev) => ({ modal: { ...prev.modal, title: event.target.value } }))} className={modalInputClassName} placeholder={placeholder} />}</div>)}

          {renderSelectField({ label: 'Priority Level', value: state.modal.priority, onChange: (value) => updateState((prev) => ({ modal: { ...prev.modal, priority: value } })), options: PRIORITY_OPTIONS, renderTrigger: (selectedOption) => <><div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer"><span className="truncate whitespace-nowrap">{selectedOption?.label || 'Medium'}</span></div>{modalChevron}</>, renderOption: (option, selected) => renderSimpleOption(option, selected) })}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <OverlayDatePicker label="Due Date" value={state.modal.dueDate} minDate={minSelectableDateValue} onChange={(value) => updateState((prev) => { const modal = { ...prev.modal, dueDate: value }; return { modal: prev.modal.dueTime && getDueDateTimeError(value, prev.modal.dueTime, prev.currentDateTime) ? { ...modal, dueTime: '' } : modal, dueDateTimeError: '' }; })} />
            </div>
            {renderSelectField({ label: 'Due Time', value: state.modal.dueTime, onChange: (value) => updateState((prev) => ({ modal: { ...prev.modal, dueTime: value }, dueDateTimeError: '' })), options: [{ value: '', label: 'Select due time...' }, ...timeOptions], preferredHeight: 360, renderTrigger: (selectedOption) => <><div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer"><span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>{selectedOption?.value ? selectedOption.label : 'Select due time...'}</span></div>{modalChevron}</>, renderOption: (option, selected) => <><div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className={`truncate whitespace-nowrap text-[12px] font-extrabold tabular-nums ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>{option.value && <div className="shrink-0 whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 tabular-nums">{option.sublabel}</div>}</div>{selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}</> })}
          </div>

          {state.dueDateTimeError && <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.dueDateTimeError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSelectField({ label: 'Assignee (Staff Pool)', value: state.modal.assignee, onChange: (value) => updateState((prev) => ({ modal: { ...prev.modal, assignee: value } })), options: [{ value: '', label: 'Select a team member...' }, ...(state.staffOptions.length ? state.staffOptions : ['Unassigned']).map((staffName) => ({ value: staffName, label: staffName }))], preferredWidth: 200, renderTrigger: (selectedOption) => <><div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-[14px] font-medium transition-all outline-none cursor-pointer text-left text-gray-900 min-h-[42px] flex items-center"><span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>{selectedOption?.label || 'Select a team member...'}</span></div>{modalChevron}</>, renderOption: (option, selected) => renderSimpleOption(option, selected) })}
            {renderSelectField({ label: 'Vendor Partner', value: state.modal.vendor, onChange: (value) => updateState((prev) => ({ modal: { ...prev.modal, vendor: value } })), options: (state.vendorOptions.length ? state.vendorOptions : ['None']).map((vendorName) => ({ value: vendorName, label: vendorName })), renderTrigger: (selectedOption) => <><div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer text-left min-h-[42px] flex items-center"><span className="truncate whitespace-nowrap">{selectedOption?.label || 'None'}</span></div>{modalChevron}</>, renderOption: (option, selected) => renderSimpleOption(option, selected, 'truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800', 'truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800', true) })}
          </div>

          <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100"><button type="button" onClick={resetModal} className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider">Cancel</button><button type="submit" disabled={state.isSubmitting} className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20">Create Task</button></div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-12 mt-2">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2"><Link href="/admin/events" className="hover:text-[#1d1d1f] transition-colors">Events</Link> <ArrowRight size={10} /> <span className="text-[#1d1d1f]">{state.eventTitle || 'Event'}</span></p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">Event <span className="text-[#eebf43] italic pr-2">Tasks</span></h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">Monitor deliverables across all your events. Keep your production timeline running seamlessly and easily assign responsibilities to staff.</p>
        </div>
        <button onClick={() => updateState({ isModalOpen: true, modal: { ...DEFAULT_DRAFT }, dueDateTimeError: '', currentDateTime: new Date(), isSubmitting: false })} className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[11px] font-black tracking-[0.1em] uppercase transition-colors rounded-xl shadow-md shadow-[#eebf43]/20 shrink-0"><Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />ADD NEW TASK</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE TASKS REGISTRY</h2>
          <div className="flex items-center gap-4">{renderSelectField({ value: state.filterStatus, onChange: (value) => updateState({ filterStatus: value }), options: FILTER_OPTIONS, preferredWidth: 165, renderTrigger: (selectedOption) => <div className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer min-w-[165px]">{selectedOption?.label || 'ALL STATUS'}<svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>{renderCaret('w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none')}</div>, renderOption: (option, selected) => renderSimpleOption(option, selected, 'truncate whitespace-nowrap text-[12px] font-black text-gray-800 tracking-wider uppercase') })}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {TABLE_HEADERS.map(([label, className]) => <th key={label} className={className}>{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 font-medium text-[13px]">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : filteredTasks.map(renderRow)}
            </tbody>
          </table>
        </div>

        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            SHOWING 1-{filteredTasks.length} OF {state.tasks.length} TASKS
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-[11px] font-extrabold text-gray-500 uppercase tracking-widest hover:border-gray-300 hover:text-gray-700 transition-colors shadow-sm">
              PREV
            </button>
            <button className="px-4 py-2 bg-[#facc15] border border-[#eab308] rounded-lg text-[11px] font-extrabold text-gray-900 uppercase tracking-widest hover:bg-[#eab308] transition-colors shadow-sm">
              NEXT
            </button>
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
