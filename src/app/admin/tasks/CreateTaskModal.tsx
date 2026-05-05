'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ShieldAlert, Users, X } from 'lucide-react';
import { CustomTimePicker } from '@/components/ui/CustomInputs';

export type StaffOption = {
  uid: string;
  name: string;
  role: string;
  appRole: string;
  avatarUrl?: string | null;
};

export type VendorOption = {
  name: string;
  category?: string;
};

type CreateTaskPayload = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignees: string[];
  vendor: string;
};

type CreateTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTaskPayload) => Promise<void>;
  staffOptions: StaffOption[];
  vendorOptions: VendorOption[];
};

const FORM_TRIGGER_CLASS =
  'w-full min-h-[52px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all';

const PRIORITY_OPTIONS = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    icon: ShieldAlert,
    accent: 'text-red-700',
    tone: 'border-red-200 bg-red-50 text-red-700',
    iconTone: 'bg-red-100 text-red-600',
    helper: 'Immediate escalation required',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: AlertTriangle,
    accent: 'text-orange-700',
    tone: 'border-orange-200 bg-orange-50 text-orange-700',
    iconTone: 'bg-orange-100 text-orange-600',
    helper: 'Needs action soon',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: ArrowUp,
    accent: 'text-amber-700',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    iconTone: 'bg-amber-100 text-amber-600',
    helper: 'Standard production pace',
  },
  {
    value: 'LOW',
    label: 'Low',
    icon: ArrowDown,
    accent: 'text-emerald-700',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconTone: 'bg-emerald-100 text-emerald-600',
    helper: 'Flexible scheduling',
  },
];

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const isPastDueSelection = (dueDate: string, dueTime: string) => {
  if (!dueDate || !dueTime) return false;
  const dueAt = new Date(`${dueDate}T${dueTime}:00`);
  if (Number.isNaN(dueAt.getTime())) return false;
  return dueAt.getTime() < Date.now();
};

const formatDateLabel = (value: string) => {
  if (!value) return 'Select date...';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
  matchAnchorWidth = false,
  preferredHeight = 280,
}: {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className: string;
  align?: 'start' | 'center' | 'end';
  width?: number;
  matchAnchorWidth?: boolean;
  preferredHeight?: number;
}) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const nextWidth = matchAnchorWidth ? rect.width : width ?? rect.width;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < Math.min(preferredHeight, 220) && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));
      const nextStyle: React.CSSProperties = {
        position: 'fixed',
        width: nextWidth,
        zIndex: 260,
        maxHeight,
        overflowY: 'auto',
      };

      if (openUp) {
        nextStyle.bottom = viewportHeight - rect.top + 8;
      } else {
        nextStyle.top = rect.bottom + 8;
      }

      if (align === 'center') {
        nextStyle.left = rect.left + rect.width / 2;
        nextStyle.transform = 'translateX(-50%)';
      } else if (align === 'end') {
        nextStyle.left = rect.right - nextWidth;
      } else {
        nextStyle.left = rect.left;
      }

      const viewportWidth = window.innerWidth;
      if (typeof nextStyle.left === 'number') {
        nextStyle.left = Math.min(Math.max(12, nextStyle.left), Math.max(12, viewportWidth - nextWidth - 12));
        if (align === 'center') {
          nextStyle.transform = undefined;
        }
      }

      setStyle(nextStyle);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, anchorRef, isOpen, matchAnchorWidth, preferredHeight, width]);

  if (!isOpen || !style || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={panelRef} style={style} className={className}>
      {children}
    </div>,
    document.body
  );
}

function PriorityDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const selectedPriority = PRIORITY_OPTIONS.find((option) => option.value === value) || PRIORITY_OPTIONS[2];
  const SelectedIcon = selectedPriority.icon;

  return (
    <div className="space-y-2" ref={triggerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between transition-all ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedPriority.iconTone}`}>
            <SelectedIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-gray-900">{selectedPriority.label}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedPriority.helper}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        matchAnchorWidth
        preferredHeight={320}
        className="rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div>
          {PRIORITY_OPTIONS.map((option) => {
            const selected = option.value === value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-left transition-colors flex items-center justify-between gap-3 ${selected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? option.iconTone : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[13px] font-extrabold ${selected ? option.accent : 'text-gray-900'}`}>{option.label}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{option.helper}</div>
                  </div>
                </div>
                {selected && <Check className="w-4 h-4 text-[#facc15] shrink-0" />}
              </button>
            );
          })}
        </div>
      </FloatingDropdown>
    </div>
  );
}

function Avatar({ staff, small = false }: { staff: StaffOption; small?: boolean }) {
  const dimensionClass = small ? 'w-7 h-7' : 'w-9 h-9';
  const textClass = small ? 'text-[10px]' : 'text-[11px]';

  if (staff.avatarUrl) {
    return <img src={staff.avatarUrl} alt="" className={`${dimensionClass} rounded-full object-cover border border-gray-100`} />;
  }

  return (
    <div className={`${dimensionClass} rounded-full border border-gray-100 bg-gray-100 flex items-center justify-center ${textClass} font-black text-gray-500 uppercase`}>
      {staff.name.charAt(0)}
    </div>
  );
}

function ProductionTypeDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: VendorOption[];
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));

  return (
    <div className="space-y-2" ref={triggerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${FORM_TRIGGER_CLASS} text-left flex items-center justify-between ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <span className="text-[14px] font-medium text-gray-900 truncate">{value || 'Select option...'}</span>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        matchAnchorWidth
        preferredHeight={300}
        className="rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div>
          {options.map((option, index) => (
            <button
              key={`${option.name}-${option.category || 'uncategorized'}-${index}`}
              type="button"
              onClick={() => {
                onChange(option.name);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[13px] font-extrabold text-gray-900">{option.name}</div>
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

function AppointLeadMultiSelect({
  label,
  value,
  staffOptions,
  onChange,
}: {
  label: string;
  value: string[];
  staffOptions: StaffOption[];
  onChange: (next: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const selectedStaff = staffOptions.filter((member) => value.includes(member.name));
  const selectedNamesLabel = selectedStaff.map((member) => member.name).join(', ');

  return (
    <div className="space-y-2" ref={triggerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${FORM_TRIGGER_CLASS} flex items-center justify-between ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-2">
            {selectedStaff.slice(0, 3).map((member) => (
              <div key={member.uid} className="border-2 border-white rounded-full">
                <Avatar staff={member} small />
              </div>
            ))}
            {selectedStaff.length === 0 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
          </div>
          <span className={`truncate text-[14px] ${selectedStaff.length ? 'font-medium text-gray-900' : 'font-medium text-gray-400'}`}>
            {selectedStaff.length ? selectedNamesLabel : 'Select team members...'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        width={360}
        preferredHeight={320}
        className="rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="pr-1">
          {staffOptions.map((member) => {
            const selected = value.includes(member.name);

            return (
              <button
                key={member.uid}
                type="button"
                onClick={() => {
                  onChange(selected ? value.filter((name) => name !== member.name) : [...value, member.name]);
                }}
                className="w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar staff={member} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-extrabold text-gray-900 break-words whitespace-normal leading-tight">{member.name}</div>
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

      {selectedStaff.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedStaff.map((member) => (
            <div key={member.uid} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
              <Avatar staff={member} small />
              <span className="text-[11px] font-black text-gray-900">{member.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductionDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const today = getTodayDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];

  return (
    <div className="space-y-2" ref={triggerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Date</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${FORM_TRIGGER_CLASS} flex items-center justify-between ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <span className={`text-[14px] ${value ? 'font-medium text-gray-900' : 'font-medium text-gray-400'}`}>{formatDateLabel(value)}</span>
        <Calendar className="w-4 h-4 text-[#71717a]" />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        anchorRef={triggerRef}
        panelRef={panelRef}
        matchAnchorWidth
        preferredHeight={360}
        className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <ChevronLeft size={16} />
            </button>
            <div className="text-[14px] font-extrabold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`${day}-${index}`} className="text-[10px] font-bold text-[#d4a017] uppercase">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-9 w-9" />;
              }

              const dateValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateValue;
              const isDisabled = dateValue < today;
              const isToday = dateValue === today;

              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg text-[12px] font-extrabold transition-all ${isSelected ? 'bg-[#facc15] text-gray-900' : isToday ? 'bg-gray-100 text-[#d4a017]' : 'text-gray-700 hover:bg-gray-50'} ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </FloatingDropdown>
    </div>
  );
}

export default function CreateTaskModal({ isOpen, onClose, onCreate, staffOptions, vendorOptions }: CreateTaskModalProps) {
  const [formData, setFormData] = useState<CreateTaskPayload>({
    title: '',
    description: '',
    status: 'TO DO',
    priority: 'MEDIUM',
    dueDate: '',
    dueTime: '',
    assignees: [],
    vendor: 'None',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const normalizedVendorOptions = useMemo(
    () => {
      const options = vendorOptions.filter((option) => option?.name?.trim());
      const deduped = Array.from(new Map(options.map((option) => [option.name, option])).values());
      return [{ name: 'None', category: '' }, ...deduped.filter((option) => option.name !== 'None')];
    },
    [vendorOptions]
  );

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        status: 'TO DO',
        priority: 'MEDIUM',
        dueDate: '',
        dueTime: '',
        assignees: [],
        vendor: 'None',
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Task title and description are required.');
      return;
    }

    if (!formData.dueDate || !formData.dueTime) {
      setError('Due date and time are required.');
      return;
    }

    if (formData.assignees.length === 0) {
      setError('Select at least one assignee.');
      return;
    }

    if (isPastDueSelection(formData.dueDate, formData.dueTime)) {
      setError('Past due date and time cannot be selected.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate(formData);
      onClose();
    } catch (submissionError: any) {
      setError(submissionError?.message || 'Failed to create task.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-visible animate-in zoom-in-95 duration-300">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">Add New <span className="text-[#facc15] italic">Task</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Assignment and schedule setup</p>
          </div>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-10rem)] overflow-y-auto overflow-x-visible">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Task Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none"
              placeholder="e.g., Finalize floral arrangements"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#eebf43] focus:ring-1 focus:ring-[#eebf43] focus:bg-white rounded-xl text-gray-900 text-[14px] font-medium transition-all outline-none resize-none"
              placeholder="Include specific requirements, vendor contacts, or special instructions..."
            />
          </div>

          <PriorityDropdown value={formData.priority} onChange={(priority) => setFormData((prev) => ({ ...prev, priority }))} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProductionDatePicker value={formData.dueDate} onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))} />
            <CustomTimePicker
              label="Due Time"
              value={formData.dueTime}
              selectedDate={formData.dueDate}
              trailingIcon="clock"
              disablePastForToday
              labelClassName="text-[#71717a] ml-0"
              triggerClassName={FORM_TRIGGER_CLASS}
              openTriggerClassName="border-[#eebf43] bg-white"
              closedTriggerClassName="hover:bg-white"
              selectedTextClassName="font-medium text-gray-900"
              placeholderTextClassName="font-medium text-gray-400"
              onChange={(dueTime) => setFormData((prev) => ({ ...prev, dueTime }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppointLeadMultiSelect
              label="Assignee (Staff Pool)"
              value={formData.assignees}
              staffOptions={staffOptions}
              onChange={(assignees) => setFormData((prev) => ({ ...prev, assignees }))}
            />
            <ProductionTypeDropdown
              label="Vendor Partner"
              value={formData.vendor}
              options={normalizedVendorOptions}
              onChange={(vendor) => setFormData((prev) => ({ ...prev, vendor }))}
            />
          </div>

          {formData.dueDate && formData.dueTime && isPastDueSelection(formData.dueDate, formData.dueTime) && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-700">
              The selected due date and time is already in the past.
            </div>
          )}

          <div className="pt-5 mt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-[12px] font-black uppercase tracking-widest text-gray-400">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-[#facc15] text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#facc15]/20 hover:bg-[#eab308] disabled:opacity-70 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
