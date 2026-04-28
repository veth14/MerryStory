'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Users, X } from 'lucide-react';

export type StaffOption = {
  uid: string;
  name: string;
  role: string;
  appRole: string;
  avatarUrl?: string | null;
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
  vendorOptions: string[];
};

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;

  return {
    value,
    label: `${displayHour}:${minutes} ${period}`,
  };
});

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return ref;
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
  options: string[];
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between transition-all ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <span className="text-[14px] font-medium text-gray-900 truncate">{value || 'Select option...'}</span>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[120] top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[13px] font-extrabold text-gray-900">{option}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available option</div>
              </div>
              {value === option && <Check className="w-4 h-4 text-[#facc15]" />}
            </button>
          ))}
        </div>
      )}
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
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const selectedStaff = staffOptions.filter((member) => value.includes(member.name));

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
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
            {selectedStaff.length ? `${selectedStaff.length} staff selected` : 'Select team members...'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[120] top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[280px] overflow-y-auto pr-1">
            {staffOptions.map((member) => {
              const selected = value.includes(member.name);

              return (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => {
                    onChange(selected ? value.filter((name) => name !== member.name) : [...value, member.name]);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar staff={member} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-extrabold text-gray-900 truncate">{member.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{member.role}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selected ? 'border-[#facc15] bg-[#fff8d6]' : 'border-gray-200 bg-white'}`}>
                    {selected && <Check className="w-3.5 h-3.5 text-[#d4a017]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const today = getTodayDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Date</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <span className={`text-[14px] ${value ? 'font-medium text-gray-900' : 'font-medium text-gray-400'}`}>{formatDateLabel(value)}</span>
        <Calendar className="w-4 h-4 text-[#71717a]" />
      </button>

      {isOpen && (
        <div className="absolute z-[120] top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
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
      )}
    </div>
  );
}

function TimePicker({
  value,
  dueDate,
  onChange,
}: {
  value: string;
  dueDate: string;
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const today = getTodayDate();
  const currentTime = getCurrentTime();

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Due Time</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all ${isOpen ? 'border-[#eebf43] bg-white' : 'hover:bg-white'}`}
      >
        <span className={`text-[14px] ${value ? 'font-medium text-gray-900' : 'font-medium text-gray-400'}`}>
          {TIME_OPTIONS.find((option) => option.value === value)?.label || 'Select time...'}
        </span>
        <Clock3 className="w-4 h-4 text-[#71717a]" />
      </button>

      {isOpen && (
        <div className="absolute z-[120] top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[280px] overflow-y-auto pr-1">
            {TIME_OPTIONS.map((option) => {
              const isDisabled = dueDate === today && option.value < currentTime;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-colors flex items-center justify-between ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <div>
                    <div className="text-[13px] font-extrabold text-gray-900">{option.label}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Schedule slot</div>
                  </div>
                  {value === option.value && <Check className="w-4 h-4 text-[#facc15]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
    () => Array.from(new Set(['None', ...vendorOptions.filter(Boolean)])),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mt-1">Assignment and schedule setup</p>
          </div>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          <div>
            <label className="block text-[11px] font-extrabold text-[#71717a] uppercase tracking-widest mb-1.5">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const selected = formData.priority === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, priority: option.value }))}
                    className={`rounded-xl border px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${selected ? 'border-[#facc15] bg-[#fff8d6] text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-white'}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ProductionDatePicker value={formData.dueDate} onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))} />
            <TimePicker value={formData.dueTime} dueDate={formData.dueDate} onChange={(dueTime) => setFormData((prev) => ({ ...prev, dueTime }))} />
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
            <button type="button" onClick={onClose} className="px-6 py-3 text-[12px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#eebf43] hover:bg-[#dcae32] disabled:opacity-70 text-white text-[12px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#eebf43]/20"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
