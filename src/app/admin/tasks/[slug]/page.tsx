'use client';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

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
  assignee?: { name?: string } | string;
  vendor?: { name?: string } | string;
};

type OptionRecord = {
  name?: string;
  firstName?: string;
  lastName?: string;
};

type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type CreateTaskDraft = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignee: string;
  vendor: string;
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
    const oidValue = (value as { $oid?: string }).$oid;
    return oidValue || undefined;
  }
  return String(value);
};

const mapTaskRecord = (task: TaskRecord, index: number): TaskItem => {
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

const extractNames = (payload: any): string[] => {
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

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (value: Date) => {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: string, time: string) => {
  if (!date || !time) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const getOverlayPosition = (
  triggerRect: DOMRect,
  {
    preferredHeight = 300,
    preferredWidth,
    contentHeight,
  }: {
    preferredHeight?: number;
    preferredWidth?: number;
    contentHeight?: number;
  } = {}
) => {
  const viewportPadding = 8;
  const spacing = 8;
  const viewport = window.visualViewport;
  const viewportOffsetLeft = viewport?.offsetLeft ?? 0;
  const viewportOffsetTop = viewport?.offsetTop ?? 0;
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const visibleLeft = viewportOffsetLeft + viewportPadding;
  const visibleTop = viewportOffsetTop + viewportPadding;
  const visibleRight = viewportOffsetLeft + viewportWidth - viewportPadding;
  const visibleBottom = viewportOffsetTop + viewportHeight - viewportPadding;
  const width = Math.min(
    Math.max(triggerRect.width, preferredWidth ?? triggerRect.width),
    viewportWidth - viewportPadding * 2
  );
  const triggerLeft = viewportOffsetLeft + triggerRect.left;
  const triggerRight = viewportOffsetLeft + triggerRect.right;
  const triggerTop = viewportOffsetTop + triggerRect.top;
  const triggerBottom = viewportOffsetTop + triggerRect.bottom;
  const bottomSpace = visibleBottom - triggerBottom;
  const topSpace = triggerTop - visibleTop;

  const renderAbove = bottomSpace < Math.min(preferredHeight, 220) && topSpace > bottomSpace;
  const maxHeight = Math.max(140, Math.min(preferredHeight, renderAbove ? topSpace - spacing : bottomSpace - spacing));
  const panelHeight = Math.min(maxHeight, contentHeight ?? preferredHeight);

  let left = triggerLeft;
  if (left + width > visibleRight) {
    const rightAlignedLeft = triggerRight - width;
    left = rightAlignedLeft >= visibleLeft
      ? rightAlignedLeft
      : Math.max(visibleLeft, visibleRight - width);
  }

  const top = renderAbove
    ? Math.max(visibleTop, triggerTop - panelHeight - spacing)
    : triggerBottom + spacing;

  return {
    position: 'fixed' as const,
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    maxHeight,
  };
};

const overlayPanelClassName = 'z-[360] overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';
const overlayOptionClassName = 'px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap';
const calendarPanelClassName = 'z-[360] min-w-[22rem] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';

const getDueDateTimeError = (date: string, time: string, now: Date) => {
  if (!date || !time) return '';
  const selectedDueDateTime = combineDateAndTime(date, time);
  if (!selectedDueDateTime || selectedDueDateTime.getTime() < now.getTime()) {
    return 'Due date and time cannot be earlier than the current system date and time.';
  }
  return '';
};

const getNextSelectableDateTime = (value: Date) => {
  const next = new Date(value);
  if (next.getSeconds() > 0 || next.getMilliseconds() > 0) {
    next.setMinutes(next.getMinutes() + 1, 0, 0);
  } else {
    next.setSeconds(0, 0);
  }
  return next;
};

const formatTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if ([hours, minutes].some(Number.isNaN)) return value;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getMinutesFromTimeValue = (value?: string) => {
  if (!value) return 0;
  const [hours, minutes] = value.split(':').map(Number);
  if ([hours, minutes].some(Number.isNaN)) return 0;
  return hours * 60 + minutes;
};

const buildTimeOptions = (minTime?: string) => {
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

const DEFAULT_NEW_TASK: CreateTaskDraft = {
  title: '',
  description: '',
  status: 'TO DO',
  priority: 'MEDIUM',
  dueDate: '',
  dueTime: '',
  assignee: '',
  vendor: 'None',
};

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const OverlaySelect = ({
  value,
  options,
  onChange,
  triggerWrapperClassName,
  renderTrigger,
  renderOption,
  panelClassName,
  preferredWidth,
  preferredHeight,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  triggerWrapperClassName?: string;
  renderTrigger: (selectedOption: SelectOption | undefined, isOpen: boolean) => React.ReactNode;
  renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
  panelClassName?: string;
  preferredWidth?: number;
  preferredHeight?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const nextStyle = getOverlayPosition(rect, {
        preferredHeight,
        preferredWidth,
        contentHeight: menuRef.current?.scrollHeight,
      });

      setMenuStyle((previousStyle) => {
        if (
          previousStyle &&
          previousStyle.top === nextStyle.top &&
          previousStyle.left === nextStyle.left &&
          previousStyle.width === nextStyle.width &&
          previousStyle.maxHeight === nextStyle.maxHeight
        ) {
          return previousStyle;
        }
        return nextStyle;
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (triggerRef.current?.contains(targetNode) || menuRef.current?.contains(targetNode)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updatePosition())
      : null;

    resizeObserver?.observe(triggerRef.current);
    if (menuRef.current) {
      resizeObserver?.observe(menuRef.current);
    }

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
  }, [isOpen, preferredHeight, preferredWidth, !!menuStyle]);

  return (
    <>
      <div
        ref={triggerRef}
        className={triggerWrapperClassName}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        {renderTrigger(selectedOption, isOpen)}
      </div>

      {isOpen && menuStyle && createPortal(
        <div
          ref={menuRef}
          className={panelClassName || overlayPanelClassName}
          style={menuStyle}
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={overlayOptionClassName}
              >
                {renderOption ? renderOption(option, selected) : (
                  <>
                    <div>
                      <div className="text-[13px] font-extrabold text-gray-900">{option.label}</div>
                      {option.sublabel && <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{option.sublabel}</div>}
                    </div>
                    {selected && <Check size={15} className="text-[#facc15]" />}
                  </>
                )}
              </div>
            );
          })}
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const nextStyle = getOverlayPosition(rect, {
        preferredHeight: 392,
        preferredWidth,
        contentHeight: menuRef.current?.scrollHeight,
      });

      setMenuStyle((previousStyle) => {
        if (
          previousStyle &&
          previousStyle.top === nextStyle.top &&
          previousStyle.left === nextStyle.left &&
          previousStyle.width === nextStyle.width &&
          previousStyle.maxHeight === nextStyle.maxHeight
        ) {
          return previousStyle;
        }
        return nextStyle;
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (triggerRef.current?.contains(targetNode) || menuRef.current?.contains(targetNode)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updatePosition())
      : null;

    resizeObserver?.observe(triggerRef.current);
    if (menuRef.current) {
      resizeObserver?.observe(menuRef.current);
    }

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
  }, [isOpen, preferredWidth, !!menuStyle]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      )}
      <div ref={triggerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] transition-all outline-none flex items-center justify-between ${isOpen ? 'border-[#eebf43] bg-white ring-1 ring-[#eebf43]' : 'hover:border-gray-300'} `}
        >
          <span className={`${value ? 'text-gray-900 font-semibold' : 'text-gray-400 font-medium'}`}>
            {value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select due date...'}
          </span>
          <CalendarIcon size={16} className="text-gray-400" />
        </button>
      </div>

      {isOpen && menuStyle && createPortal(
        <div
          ref={menuRef}
          className={calendarPanelClassName}
          style={menuStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-[14px] font-extrabold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, index) => (
              <div key={`${dayName}-${index}`} className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">{dayName}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10 w-10" />
            ))}

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
                    isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#facc15] text-gray-900'
                        : isToday
                          ? 'bg-gray-100 text-[#d4a017] hover:bg-gray-200'
                          : 'text-gray-700 hover:bg-gray-50'
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

const CreateTaskModal = ({
  staffOptions,
  vendorOptions,
  onClose,
  onCreate,
}: {
  staffOptions: string[];
  vendorOptions: string[];
  onClose: () => void;
  onCreate: (draft: CreateTaskDraft) => Promise<boolean>;
}) => {
  const [draft, setDraft] = useState<CreateTaskDraft>(DEFAULT_NEW_TASK);
  const [dueDateTimeError, setDueDateTimeError] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setDueDateTimeError(getDueDateTimeError(draft.dueDate, draft.dueTime, currentDateTime));
  }, [currentDateTime, draft.dueDate, draft.dueTime]);

  const nextSelectableDateTime = getNextSelectableDateTime(currentDateTime);
  const minSelectableDateValue = toDateInputValue(nextSelectableDateTime);
  const minTimeForToday = draft.dueDate === minSelectableDateValue ? toTimeInputValue(nextSelectableDateTime) : undefined;
  const timeOptions = useMemo(
    () => buildTimeOptions(minTimeForToday),
    [minTimeForToday]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDueDateTimeError('');
    if (!draft.title || !draft.assignee || !draft.dueDate || !draft.dueTime || isSubmitting) return;

    const validationError = getDueDateTimeError(draft.dueDate, draft.dueTime, new Date());
    if (validationError) {
      setDueDateTimeError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const didCreate = await onCreate(draft);
      if (didCreate) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Task Title</label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
              placeholder="e.g., Finalize floral arrangements"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
              placeholder="Include specific requirements, vendor contacts, or special instructions..."
            ></textarea>
          </div>

          <div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
              <OverlaySelect
                value={draft.priority}
                onChange={(value) => setDraft((prev) => ({ ...prev, priority: value }))}
                options={PRIORITY_OPTIONS}
                triggerWrapperClassName="relative"
                panelClassName={overlayPanelClassName}
                preferredWidth={180}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                      <span className="truncate whitespace-nowrap">{selectedOption?.label || 'Medium'}</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                    {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <OverlayDatePicker
                label="Due Date"
                value={draft.dueDate}
                minDate={minSelectableDateValue}
                onChange={(value) => {
                  setDraft((prev) => {
                    const nextTask = { ...prev, dueDate: value };
                    const hasInvalidTime = !!prev.dueTime && !!getDueDateTimeError(value, prev.dueTime, currentDateTime);
                    return hasInvalidTime ? { ...nextTask, dueTime: '' } : nextTask;
                  });
                  setDueDateTimeError('');
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Time</label>
              <OverlaySelect
                value={draft.dueTime}
                onChange={(value) => {
                  setDraft((prev) => ({ ...prev, dueTime: value }));
                  setDueDateTimeError('');
                }}
                options={[
                  { value: '', label: 'Select due time...' },
                  ...timeOptions,
                ]}
                triggerWrapperClassName="relative"
                panelClassName={overlayPanelClassName}
                preferredWidth={180}
                preferredHeight={360}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                      <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption?.value ? selectedOption.label : 'Select due time...'}
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className={`truncate whitespace-nowrap text-[12px] font-extrabold tabular-nums ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                      {option.value && <div className="shrink-0 whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 tabular-nums">{option.sublabel}</div>}
                    </div>
                    {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          {dueDateTimeError && (
            <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {dueDateTimeError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
              <OverlaySelect
                value={draft.assignee}
                onChange={(value) => setDraft((prev) => ({ ...prev, assignee: value }))}
                options={[
                  { value: '', label: 'Select a team member...' },
                  ...(staffOptions.length ? staffOptions : ['Unassigned']).map((staffName) => ({ value: staffName, label: staffName })),
                ]}
                triggerWrapperClassName="relative"
                panelClassName={overlayPanelClassName}
                preferredWidth={200}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-[14px] font-medium transition-all outline-none cursor-pointer text-left text-gray-900 min-h-[42px] flex items-center">
                      <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedOption?.label || 'Select a team member...'}
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className={`truncate whitespace-nowrap text-[12px] font-extrabold ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                    {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Vendor Partner</label>
              <OverlaySelect
                value={draft.vendor}
                onChange={(value) => setDraft((prev) => ({ ...prev, vendor: value }))}
                options={(vendorOptions.length ? vendorOptions : ['None']).map((vendorName) => ({ value: vendorName, label: vendorName }))}
                triggerWrapperClassName="relative"
                panelClassName={overlayPanelClassName}
                preferredWidth={180}
                renderTrigger={(selectedOption) => (
                  <>
                    <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer text-left min-h-[42px] flex items-center">
                      <span className="truncate whitespace-nowrap">{selectedOption?.label || 'None'}</span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </>
                )}
                renderOption={(option, selected) => (
                  <>
                    <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                    {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                  </>
                )}
              />
            </div>
          </div>

          <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TasksAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.slug;
  const [eventTitle, setEventTitle] = useState('');

  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);

  useEffect(() => {
    if (!user) return;

    const fetchEventTitle = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!response.ok) {
          return;
        }

        const eventData = await response.json();
        if (eventData?.title) {
          setEventTitle(eventData.title);
        }
      } catch (error) {
        console.error('Failed to load event title:', error);
      }
    };

    const fetchTasks = async () => {
      try {
  console.info('[TasksAdmin] Fetching tasks', { eventId });
        const idToken = await user.getIdToken();
  const requestUrl = `/api/tasks?eventId=${eventId}`;
        console.info('[TasksAdmin] Request', requestUrl);
        const response = await fetch(requestUrl, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        console.info('[TasksAdmin] Response status', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[TasksAdmin] Error response', errorData);
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const payload = await response.json();
        console.info('[TasksAdmin] Payload', payload);

        const records = Array.isArray(payload) ? payload : payload?.tasks || [];
        console.info('[TasksAdmin] Records count', records.length);
        setTasks(records.map((record: TaskRecord, index: number) => mapTaskRecord(record, index)));
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      }
    };

    const fetchDropdownOptions = async () => {
      try {
        const idToken = await user.getIdToken();

        const [staffResponse, vendorResponse] = await Promise.all([
          fetch('/api/staffs', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/vendors', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (staffResponse.ok) {
          const staffPayload = await staffResponse.json();
          const staffNames = extractNames(staffPayload);
          setStaffOptions(Array.from(new Set([...staffNames, 'Unassigned'])));
        }

        if (vendorResponse.ok) {
          const vendorPayload = await vendorResponse.json();
          const vendorNames = extractNames(vendorPayload);
          setVendorOptions(Array.from(new Set(['None', ...vendorNames])));
        }
      } catch (error) {
        console.error('Failed to load dropdown options:', error);
      }
    };

    fetchEventTitle();
    fetchTasks();
    fetchDropdownOptions();
  }, [eventId, user]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskDraft>(DEFAULT_NEW_TASK);
  const [dueDateTimeError, setDueDateTimeError] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const priorityOptions = PRIORITY_OPTIONS;

  useEffect(() => {
    if (!isModalOpen) return;

    setCurrentDateTime(new Date());
    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    setDueDateTimeError(getDueDateTimeError(newTask.dueDate, newTask.dueTime, currentDateTime));
  }, [currentDateTime, isModalOpen, newTask.dueDate, newTask.dueTime]);

  const handleAddTask = async (payload: CreateTaskDraft | React.FormEvent) => {
    if ('preventDefault' in payload) {
      payload.preventDefault();
      return false;
    }

    const newTask = payload;

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
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
          dueTime: newTask.dueTime,
          assignee: newTask.assignee,
          vendor: newTask.vendor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create task');
      }

      const createdTask = await response.json();
      setTasks((prevTasks) => [mapTaskRecord(createdTask, 0), ...prevTasks]);
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  };

  const filterStatusOptions: SelectOption[] = [
    { value: 'ALL', label: 'ALL STATUS' },
    { value: 'TO DO', label: 'TO DO' },
    { value: 'IN PROGRESS', label: 'IN PROGRESS' },
    { value: 'COMPLETED', label: 'COMPLETED' },
  ];

  const taskStatusOptions: SelectOption[] = [
    { value: 'TO DO', label: 'TO DO' },
    { value: 'IN PROGRESS', label: 'IN PROGRESS' },
    { value: 'COMPLETED', label: 'COMPLETED' },
  ];

  const nextSelectableDateTime = getNextSelectableDateTime(currentDateTime);
  const minSelectableDateValue = toDateInputValue(nextSelectableDateTime);
  const minTimeForToday = newTask.dueDate === minSelectableDateValue ? toTimeInputValue(nextSelectableDateTime) : undefined;
  const timeOptions = buildTimeOptions(minTimeForToday);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TO DO': return 'bg-gray-100 text-gray-500';
      case 'IN PROGRESS': return 'bg-[#facc15]/20 text-[#b48600]';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-500';
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

  const updateTaskField = async (taskToUpdate: TaskItem, field: 'assignee' | 'vendor', value: string) => {
    const previousValue = tasks.find((task) => task.id === taskToUpdate.id)?.[field];

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, [field]: value } : task))
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
          [field]: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update ${field}`);
      }
    } catch (error) {
      console.error(`Failed to update task ${field}:`, error);
      if (previousValue) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskToUpdate.id ? { ...task, [field]: previousValue } : task))
        );
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full px-4 sm:px-6 lg:px-8 pb-12 mt-2">
      {/* Header Section */}
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

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tool bar */}
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-[15px] font-extrabold text-gray-900 uppercase tracking-widest">LIVE TASKS REGISTRY</h2>
          <div className="flex items-center gap-4">
            {/* Filter Button / Select */}
            <OverlaySelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={filterStatusOptions}
              triggerWrapperClassName="relative"
              panelClassName={overlayPanelClassName}
              preferredWidth={165}
              renderTrigger={(selectedOption) => (
                <div className="appearance-none flex items-center justify-center gap-2 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[12px] font-black text-gray-700 tracking-widest uppercase hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer min-w-[165px]">
                  {selectedOption?.label || 'ALL STATUS'}
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              )}
              renderOption={(option, selected) => (
                <>
                  <div className="truncate whitespace-nowrap text-[12px] font-black text-gray-800 tracking-wider uppercase">{option.label}</div>
                  {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                </>
              )}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
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
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 font-medium text-[13px]">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : filteredTasks.map((task) => {
                let statusColor = "text-gray-500 bg-gray-50";
                let dotColor = "bg-gray-400";
                if (task.status === 'COMPLETED') {
                  statusColor = "text-emerald-700 bg-emerald-50";
                  dotColor = "bg-emerald-500";
                } else if (task.status === 'IN PROGRESS') {
                  statusColor = "text-[#b48600] bg-[#facc15]/20";
                  dotColor = "bg-[#facc15]";
                }

                return (
                  <tr key={task.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-4 md:px-6 py-4">
                      <div className="font-extrabold text-[14px] text-gray-900 group-hover:text-[#eebf43] transition-colors mb-1">{task.title}</div>
                      <div className="text-[12px] font-medium text-[#71717a] line-clamp-2">
                        {task.description}
                      </div>
                      <div className="mt-2">
                         <span className={`px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest rounded-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority} PRIORITY
                         </span>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <OverlaySelect
                        value={task.status}
                        onChange={(value) => updateTaskStatus(task, value)}
                        options={taskStatusOptions}
                        triggerWrapperClassName="relative inline-flex items-center"
                        panelClassName={overlayPanelClassName}
                        preferredWidth={170}
                        renderTrigger={(selectedOption) => (
                          <>
                            <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            <div className={`appearance-none inline-flex items-center gap-2 pl-5 pr-7 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${statusColor} cursor-pointer`}>
                              {selectedOption?.label || task.status}
                            </div>
                            <svg className="w-3 h-3 text-current absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </>
                        )}
                        renderOption={(option, selected) => (
                          <>
                            <div className="truncate whitespace-nowrap text-[12px] font-extrabold uppercase tracking-wider text-gray-800">{option.label}</div>
                            {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                          </>
                        )}
                      />
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <div className="text-[11px] font-bold text-gray-600">{task.dueDate}</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5">{task.dueTime || 'EOD'}</div>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center align-middle">
                      <OverlaySelect
                        value={task.vendor || 'None'}
                        onChange={(value) => updateTaskField(task, 'vendor', value)}
                        options={[...new Set(['None', ...(vendorOptions.length ? vendorOptions : [task.vendor || 'None'])])].map((vendorName) => ({ value: vendorName, label: vendorName }))}
                        triggerWrapperClassName="relative inline-block w-full max-w-[140px]"
                        panelClassName={overlayPanelClassName}
                        preferredWidth={168}
                        renderTrigger={(selectedOption) => (
                          <>
                            <div className="appearance-none w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors outline-none cursor-pointer text-center truncate">
                              {selectedOption?.label || 'None'}
                            </div>
                            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </>
                        )}
                        renderOption={(option, selected) => (
                          <>
                            <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                            {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                          </>
                        )}
                      />
                    </td>

                    <td className="px-4 md:px-6 py-4 text-right align-middle">
                       <div className="flex items-center justify-end gap-3">
                         <OverlaySelect
                           value={task.assignee}
                           onChange={(value) => updateTaskField(task, 'assignee', value)}
                           options={[...new Set(['Unassigned', ...(staffOptions.length ? staffOptions : [task.assignee || 'Unassigned'])])].map((staffName) => ({ value: staffName, label: staffName }))}
                           triggerWrapperClassName="relative"
                           panelClassName={overlayPanelClassName}
                           preferredWidth={168}
                           renderTrigger={(selectedOption) => (
                             <>
                               <div className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-bold text-[#1d1d1f] hover:bg-gray-50 transition-colors shrink-0 outline-none cursor-pointer">
                                 {selectedOption?.label || 'Unassigned'}
                               </div>
                               <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                             </>
                           )}
                           renderOption={(option, selected) => (
                             <>
                               <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                               {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                             </>
                           )}
                         />
                         <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black border border-white shadow-sm overflow-hidden shrink-0">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} className="w-full h-full object-cover" />
                         </div>
                       </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & inline Pagination */}
        <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            SHOWING 1-{filteredTasks.length} OF {tasks.length} TASKS
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

      {/* Add Task Modal */}
      {isModalOpen && (
        <CreateTaskModal
          staffOptions={staffOptions}
          vendorOptions={vendorOptions}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleAddTask}
        />
      )}
      {false && isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Task Title</label>
                <input 
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
                  placeholder="e.g., Finalize floral arrangements"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Detailed Description</label>
                <textarea 
                  required
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
                  placeholder="Include specific requirements, vendor contacts, or special instructions..."
                ></textarea>
              </div>

              <div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
                  <OverlaySelect
                    value={newTask.priority}
                    onChange={(value) => setNewTask({...newTask, priority: value})}
                    options={priorityOptions}
                    triggerWrapperClassName="relative"
                    panelClassName={overlayPanelClassName}
                    preferredWidth={180}
                    renderTrigger={(selectedOption) => (
                      <>
                        <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                          <span className="truncate whitespace-nowrap">{selectedOption?.label || 'Medium'}</span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </>
                    )}
                    renderOption={(option, selected) => (
                      <>
                        <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                        {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                      </>
                    )}
                  />
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className="hidden w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <OverlayDatePicker
                    label="Due Date"
                    value={newTask.dueDate}
                    minDate={minSelectableDateValue}
                    onChange={(value) => {
                      setNewTask((prev) => {
                        const nextTask = { ...prev, dueDate: value };
                        const hasInvalidTime = !!prev.dueTime && !!getDueDateTimeError(value, prev.dueTime, currentDateTime);
                        return hasInvalidTime ? { ...nextTask, dueTime: '' } : nextTask;
                      });
                      setDueDateTimeError('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Time</label>
                  <OverlaySelect
                    value={newTask.dueTime}
                    onChange={(value) => {
                      setNewTask({...newTask, dueTime: value});
                      setDueDateTimeError('');
                    }}
                    options={[
                      { value: '', label: 'Select due time...' },
                      ...timeOptions,
                    ]}
                    triggerWrapperClassName="relative"
                    panelClassName={overlayPanelClassName}
                    preferredWidth={180}
                    preferredHeight={360}
                    renderTrigger={(selectedOption) => (
                      <>
                        <div className="flex min-h-[42px] w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[14px] font-medium text-gray-900 transition-all outline-none cursor-pointer">
                          <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedOption?.value ? selectedOption.label : 'Select due time...'}
                          </span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </>
                    )}
                    renderOption={(option, selected) => (
                      <>
                        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <div className={`truncate whitespace-nowrap text-[12px] font-extrabold tabular-nums ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                          {option.value && <div className="shrink-0 whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 tabular-nums">{option.sublabel}</div>}
                        </div>
                        {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                      </>
                    )}
                  />
                  <input 
                    type="time"
                    required
                    value={newTask.dueTime}
                    min={minTimeForToday}
                    onChange={(e) => {
                      setNewTask({...newTask, dueTime: e.target.value});
                      setDueDateTimeError('');
                    }}
                    className="hidden w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer"
                  />
                </div>
              </div>

              {dueDateTimeError && (
                <div className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {dueDateTimeError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
                  <OverlaySelect
                    value={newTask.assignee}
                    onChange={(value) => setNewTask({...newTask, assignee: value})}
                    options={[
                      { value: '', label: 'Select a team member...' },
                      ...(staffOptions.length ? staffOptions : ['Unassigned']).map((staffName) => ({ value: staffName, label: staffName })),
                    ]}
                    triggerWrapperClassName="relative"
                    panelClassName={overlayPanelClassName}
                    preferredWidth={200}
                    renderTrigger={(selectedOption) => (
                      <>
                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-[14px] font-medium transition-all outline-none cursor-pointer text-left text-gray-900 min-h-[42px] flex items-center">
                          <span className={`truncate whitespace-nowrap ${selectedOption?.value ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedOption?.label || 'Select a team member...'}
                          </span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </>
                    )}
                    renderOption={(option, selected) => (
                      <>
                        <div className={`truncate whitespace-nowrap text-[12px] font-extrabold ${option.value ? 'text-gray-800' : 'text-gray-500'}`}>{option.label}</div>
                        {selected && option.value && <Check size={15} className="shrink-0 text-[#facc15]" />}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Vendor Partner</label>
                  <OverlaySelect
                    value={newTask.vendor}
                    onChange={(value) => setNewTask({...newTask, vendor: value})}
                    options={(vendorOptions.length ? vendorOptions : ['None']).map((vendorName) => ({ value: vendorName, label: vendorName }))}
                    triggerWrapperClassName="relative"
                    panelClassName={overlayPanelClassName}
                    preferredWidth={180}
                    renderTrigger={(selectedOption) => (
                      <>
                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none cursor-pointer text-left min-h-[42px] flex items-center">
                          <span className="truncate whitespace-nowrap">{selectedOption?.label || 'None'}</span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#71717a]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </>
                    )}
                    renderOption={(option, selected) => (
                      <>
                        <div className="truncate whitespace-nowrap text-[12px] font-extrabold text-gray-800">{option.label}</div>
                        {selected && <Check size={15} className="shrink-0 text-[#facc15]" />}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
