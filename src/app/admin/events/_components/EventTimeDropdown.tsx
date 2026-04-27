'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock3, X } from 'lucide-react';

interface EventTimeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

type TimeParts = {
  hour: number;
  minute: number;
  meridiem: 'AM' | 'PM';
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const MERIDIEMS: Array<'AM' | 'PM'> = ['AM', 'PM'];

const toTimeParts = (value: string): TimeParts => {
  if (/^\d{2}:\d{2}$/.test(value)) {
    const hour24 = Number(value.slice(0, 2));
    const minute = Number(value.slice(3, 5));

    if (!Number.isNaN(hour24) && !Number.isNaN(minute)) {
      const meridiem: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
      const hour = ((hour24 + 11) % 12) + 1;
      return { hour, minute: Math.max(0, Math.min(59, minute)), meridiem };
    }
  }

  return { hour: 12, minute: 0, meridiem: 'AM' };
};

const to24HourValue = (parts: TimeParts) => {
  const normalizedHour = parts.hour % 12;
  const hour24 = parts.meridiem === 'PM' ? normalizedHour + 12 : normalizedHour;
  return `${String(hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
};

const toDisplayLabel = (parts: TimeParts) => `${parts.hour}:${String(parts.minute).padStart(2, '0')} ${parts.meridiem}`;

export default function EventTimeDropdown({
  value,
  onChange,
  label = 'Production Time',
  placeholder = 'Select time...',
}: EventTimeDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [parts, setParts] = useState<TimeParts>(() => toTimeParts(value));

  useEffect(() => {
    setParts(toTimeParts(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    return toDisplayLabel(toTimeParts(value));
  }, [value]);

  const updateTime = (next: Partial<TimeParts>) => {
    const updated = { ...parts, ...next };
    setParts(updated);
    onChange(to24HourValue(updated));
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
        <Clock3 size={12} /> {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl flex items-center justify-between transition-all ${isOpen ? 'border-[#facc15] bg-white ring-4 ring-[#facc15]/10' : 'border-gray-100 hover:border-gray-200'}`}
      >
        <span className={`text-[14px] ${selectedLabel ? 'font-extrabold text-gray-900' : 'font-medium text-gray-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/60">
            <p className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Hour</p>
            <p className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Minutes</p>
            <p className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Meridiem</p>
          </div>

          <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-2">
            <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-1">
              {HOURS.map((hour) => {
                const isActive = parts.hour === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => updateTime({ hour })}
                    className={`w-full px-2 py-2 rounded-lg text-[13px] font-extrabold tabular-nums transition-colors ${isActive ? 'bg-[#facc15] text-gray-900' : 'text-gray-600 hover:bg-white'}`}
                  >
                    {String(hour).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-1">
              {MINUTES.map((minute) => {
                const isActive = parts.minute === minute;
                return (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => updateTime({ minute })}
                    className={`w-full px-2 py-2 rounded-lg text-[13px] font-extrabold tabular-nums transition-colors ${isActive ? 'bg-[#facc15] text-gray-900' : 'text-gray-600 hover:bg-white'}`}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-1">
              {MERIDIEMS.map((meridiem) => {
                const isActive = parts.meridiem === meridiem;
                return (
                  <button
                    key={meridiem}
                    type="button"
                    onClick={() => updateTime({ meridiem })}
                    className={`w-full px-2 py-2 rounded-lg text-[13px] font-extrabold transition-colors ${isActive ? 'bg-[#facc15] text-gray-900' : 'text-gray-600 hover:bg-white'}`}
                  >
                    {meridiem}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="h-8 w-8 rounded-lg border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-colors flex items-center justify-center"
              aria-label="Clear time"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors flex items-center justify-center"
              aria-label="Apply time"
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}