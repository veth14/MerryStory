'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, Check, ChevronDown, ShieldAlert, Users, X } from 'lucide-react';
import { CustomTimePicker } from '@/components/ui/CustomInputs';
import type { StaffOption, VendorOption } from '@/app/admin/tasks/CreateTaskModal';

type EventDaySchedulePayload = {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignees: string[];
  vendor: string;
};

type EventDayScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: EventDaySchedulePayload) => Promise<void>;
  staffOptions: StaffOption[];
  vendorOptions: VendorOption[];
  productionDate: string;
  initialData?: Partial<EventDaySchedulePayload> | null;
};

const FORM_TRIGGER_CLASS =
  'w-full min-h-[52px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all';

const PRIORITY_OPTIONS = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    icon: ShieldAlert,
    accent: 'text-red-700',
    iconTone: 'bg-red-100 text-red-600',
    helper: 'Immediate escalation required',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: AlertTriangle,
    accent: 'text-orange-700',
    iconTone: 'bg-orange-100 text-orange-600',
    helper: 'Needs action soon',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: ArrowUp,
    accent: 'text-amber-700',
    iconTone: 'bg-amber-100 text-amber-600',
    helper: 'Standard production pace',
  },
  {
    value: 'LOW',
    label: 'Low',
    icon: ArrowDown,
    accent: 'text-emerald-700',
    iconTone: 'bg-emerald-100 text-emerald-600',
    helper: 'Flexible scheduling',
  },
];

const isPastDueSelection = (dueDate: string, dueTime: string) => {
  if (!dueDate || !dueTime) return false;
  const dueAt = new Date(`${dueDate}T${dueTime}:00`);
  if (Number.isNaN(dueAt.getTime())) return false;
  return dueAt.getTime() < Date.now();
};

const formatDateLabel = (value: string) => {
  if (!value) return 'Production date unavailable';
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
    <div className="space-y-2" ref={triggerRef}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Vendor Partner</label>
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

function AssigneeMultiSelect({
  value,
  staffOptions,
  onChange,
}: {
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
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Assignee (Staff Pool)</label>
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

export default function EventDayScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  staffOptions,
  vendorOptions,
  productionDate,
  initialData,
}: EventDayScheduleModalProps) {
  const isEditing = Boolean(initialData);
  const [formData, setFormData] = useState<EventDaySchedulePayload>({
    title: '',
    description: '',
    status: 'TO DO',
    priority: 'MEDIUM',
    dueDate: productionDate,
    dueTime: '',
    assignees: [],
    vendor: 'None',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const normalizedVendorOptions = useMemo(() => {
    const options = vendorOptions.filter((option) => option?.name?.trim());
    const deduped = Array.from(new Map(options.map((option) => [option.name, option])).values());
    return [{ name: 'None', category: '' }, ...deduped.filter((option) => option.name !== 'None')];
  }, [vendorOptions]);

  useEffect(() => {
    const nextState: EventDaySchedulePayload = {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'TO DO',
      priority: initialData?.priority || 'MEDIUM',
      dueDate: initialData?.dueDate || productionDate,
      dueTime: initialData?.dueTime || '',
      assignees: initialData?.assignees || [],
      vendor: initialData?.vendor || 'None',
    };

    if (!isOpen) {
      setFormData(nextState);
      setError('');
      setIsSubmitting(false);
      return;
    }

    setFormData(nextState);
    setError('');
    setIsSubmitting(false);
  }, [initialData, isOpen, productionDate]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, dueDate: productionDate }));
  }, [productionDate]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Task title and description are required.');
      return;
    }

    if (!formData.dueDate || !formData.dueTime) {
      setError('Production date and due time are required.');
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
      await onSubmit(formData);
      onClose();
    } catch (submissionError: any) {
      setError(submissionError?.message || `Failed to ${isEditing ? 'update' : 'create'} production schedule.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-visible animate-in zoom-in-95 duration-300">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-2">{isEditing ? 'Edit' : 'New'} <span className="text-[#facc15] italic">Schedule</span></h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Program timeline setup for event day</p>
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
              placeholder="e.g., Opening keynote prep"
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
              placeholder="Include stage cues, team callouts, or program notes..."
            />
          </div>

          <PriorityDropdown value={formData.priority} onChange={(priority) => setFormData((prev) => ({ ...prev, priority }))} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Production Date</label>
              <div className="w-full min-h-[52px] px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between">
                <span className="text-[14px] font-medium text-gray-900">{formatDateLabel(formData.dueDate)}</span>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Locked
                </div>
              </div>
            </div>
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
            <AssigneeMultiSelect
              value={formData.assignees}
              staffOptions={staffOptions}
              onChange={(assignees) => setFormData((prev) => ({ ...prev, assignees }))}
            />
            <VendorDropdown
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
