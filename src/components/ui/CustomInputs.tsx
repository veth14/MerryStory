'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Calendar as CalendarIcon, ArrowLeft, Clock3, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';

export const CustomSelect = ({ 
  label, 
  options, 
  value, 
  onChange, 
  icon: Icon,
  placeholder = "Select option...",
  className = ""
}: { 
  label?: string, 
  options: { value: string, label: string, sublabel?: string, avatar?: string }[], 
  value: string, 
  onChange: (val: string) => void,
  icon?: any,
  placeholder?: string,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`space-y-2 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
          {Icon && <Icon size={12} />} {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[#facc15] bg-white ring-4 ring-[#facc15]/10' : 'border-gray-100 hover:border-gray-200'}`}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.avatar ? (
            <img src={selectedOption.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
          ) : selectedOption ? (
             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase border border-gray-200/50">
                {selectedOption.label.charAt(0)}
             </div>
          ) : null}
          <span className={`text-[14px] font-extrabold ${selectedOption ? 'text-gray-900' : 'text-gray-400 font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto">
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                {opt.avatar ? (
                  <img src={opt.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-400 uppercase">
                    {opt.label.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-[13px] font-extrabold text-gray-900">{opt.label}</div>
                  {opt.sublabel && <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{opt.sublabel}</div>}
                </div>
              </div>
              {value === opt.value && <Check size={16} className="text-[#facc15]" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomDatePicker = ({ 
  label, 
  value, 
  onChange,
  className = ""
}: { 
  label?: string, 
  value: string, 
  onChange: (val: string) => void,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const days = [];
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`space-y-2 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1">
          <CalendarIcon size={12} /> {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[#facc15] bg-white ring-4 ring-[#facc15]/10' : 'border-gray-100 hover:border-gray-200'}`}
      >
        <span className={`text-[14px] font-extrabold ${value ? 'text-gray-900' : 'text-gray-400 font-medium'}`}>
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date...'}
        </span>
        <CalendarIcon size={16} className="text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft size={16} /></button>
            <div className="text-[14px] font-extrabold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft size={16} className="rotate-180" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-[10px] font-bold text-[#d4a017] uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="h-9 w-9"></div>;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              
              return (
                <div 
                  key={day}
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg text-[12px] font-extrabold cursor-pointer transition-all ${isSelected ? 'bg-[#facc15] text-gray-900' : isToday ? 'bg-gray-100 text-[#d4a017]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const getCurrentTimeValue = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const getTodayLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getInitialTimeParts = (value: string) => {
  const normalizedValue = /^\d{2}:\d{2}$/.test(value) ? value : getCurrentTimeValue();
  const [hourString, minuteString = '00'] = normalizedValue.split(':');
  const hours24 = Number(hourString);
  const minutes = Number(minuteString);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 || 12;

  return {
    hour: String(hour12),
    minute: String(Number.isNaN(minutes) ? 0 : minutes).padStart(2, '0'),
    period,
  };
};

const formatTimeValue = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return 'Select time...';

  const [hourString, minuteString] = value.split(':');
  const hours = Number(hourString);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minuteString} ${period}`;
};

const build24HourTime = ({
  hour,
  minute,
  period,
}: {
  hour: string;
  minute: string;
  period: string;
}) => {
  const normalizedHour = Math.min(Math.max(Number(hour) || 12, 1), 12);
  const normalizedMinute = Math.min(Math.max(Number(minute) || 0, 0), 59);
  const periodOffset = period === 'PM' && normalizedHour !== 12 ? 12 : 0;
  const midnightAdjustment = period === 'AM' && normalizedHour === 12 ? 0 : normalizedHour;
  const hours24 = period === 'AM' && normalizedHour === 12 ? 0 : period === 'PM' && normalizedHour === 12 ? 12 : midnightAdjustment + periodOffset;

  return `${String(hours24).padStart(2, '0')}:${String(normalizedMinute).padStart(2, '0')}`;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const PERIOD_OPTIONS = ['AM', 'PM'];

const getWrappedTimeOption = (options: string[], current: string, direction: 1 | -1) => {
  const currentIndex = options.indexOf(current);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + options.length) % options.length;
  return options[nextIndex];
};

export const CustomTimePicker = ({
  label,
  value,
  onChange,
  selectedDate,
  className = "",
  labelClassName = "",
  triggerClassName = "",
  openTriggerClassName = "",
  closedTriggerClassName = "",
  textClassName = "text-[14px]",
  selectedTextClassName = "font-extrabold text-gray-900",
  placeholderTextClassName = "font-medium text-gray-400",
  placeholder = "Select time...",
  showLabelIcon = false,
  trailingIcon = "chevron",
  disablePastForToday = false,
}: {
  label?: string,
  value: string,
  onChange: (val: string) => void,
  selectedDate?: string,
  className?: string,
  labelClassName?: string,
  triggerClassName?: string,
  openTriggerClassName?: string,
  closedTriggerClassName?: string,
  textClassName?: string,
  selectedTextClassName?: string,
  placeholderTextClassName?: string,
  placeholder?: string,
  showLabelIcon?: boolean,
  trailingIcon?: 'chevron' | 'clock',
  disablePastForToday?: boolean,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftTime, setDraftTime] = useState(() => getInitialTimeParts(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wheelDeltaRef = useRef<Record<string, number>>({ hour: 0, minute: 0, period: 0 });
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
  const today = getTodayLocalDate();
  const draftValue = build24HourTime(draftTime);
  const isPastSelection = disablePastForToday && selectedDate === today && draftValue < getCurrentTimeValue();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDraftTime(getInitialTimeParts(value));
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const preventScrollWhileOpen = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
    };

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('wheel', preventScrollWhileOpen, { passive: false, capture: true });
    document.addEventListener('touchmove', preventScrollWhileOpen, { passive: false, capture: true });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener('wheel', preventScrollWhileOpen, true);
      document.removeEventListener('touchmove', preventScrollWhileOpen, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredWidth = Math.min(Math.max(rect.width, 320), 360);
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 380 && spaceAbove > spaceBelow;

      const nextStyle: React.CSSProperties = {
        position: 'fixed',
        width: preferredWidth,
        zIndex: 300,
        left: Math.min(Math.max(12, rect.left), Math.max(12, viewportWidth - preferredWidth - 12)),
      };

      if (openUp) {
        nextStyle.bottom = viewportHeight - rect.top + 10;
      } else {
        nextStyle.top = rect.bottom + 10;
      }

      setPanelStyle(nextStyle);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleHourChange = (next: string) => {
    setDraftTime((prev) => ({ ...prev, hour: next }));
  };

  const handleMinuteChange = (next: string) => {
    setDraftTime((prev) => ({ ...prev, minute: next }));
  };

  const handlePeriodChange = (next: string) => {
    setDraftTime((prev) => ({ ...prev, period: next }));
  };

  const handleWheelStep = ({
    key,
    current,
    options,
    onChange,
    event,
  }: {
    key: 'hour' | 'minute' | 'period';
    current: string;
    options: string[];
    onChange: (next: string) => void;
    event: React.WheelEvent<HTMLDivElement>;
  }) => {
    event.preventDefault();
    event.stopPropagation();

    wheelDeltaRef.current[key] += event.deltaY;

    if (Math.abs(wheelDeltaRef.current[key]) < 16) return;

    const direction: 1 | -1 = wheelDeltaRef.current[key] > 0 ? 1 : -1;
    wheelDeltaRef.current[key] = 0;
    onChange(getWrappedTimeOption(options, current, direction));
  };

  const renderWheelColumn = ({
    title,
    options,
    current,
    wheelKey,
    onChange,
  }: {
    title: string;
    options: string[];
    current: string;
    wheelKey: 'hour' | 'minute' | 'period';
    onChange: (next: string) => void;
  }) => {
    const previous = getWrappedTimeOption(options, current, -1);
    const next = getWrappedTimeOption(options, current, 1);

    return (
    <div
      onWheel={(event) => handleWheelStep({ key: wheelKey, current, options, onChange, event })}
      className="select-none"
    >
      <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#a7adba] text-center mb-3">{title}</div>
      <div className="relative h-[174px] rounded-[16px] border border-[#f3f3ef] bg-[#fbfbfa] flex flex-col items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-2 top-[50%] -translate-y-1/2 h-9 rounded-[10px] border border-[#f3dd97] bg-[#fff7df] shadow-[0_4px_12px_rgba(250,204,21,0.12)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#fbfbfa] via-[#fbfbfa]/92 to-transparent z-[1]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fbfbfa] via-[#fbfbfa]/92 to-transparent z-[1]" />
        <div className="absolute inset-x-0 top-3 flex justify-center z-[4]">
          <button
            type="button"
            aria-label={`Previous ${title.toLowerCase()}`}
            onClick={() => onChange(getWrappedTimeOption(options, current, -1))}
            className="h-5 w-5 text-[#c7ccd5] flex items-center justify-center transition-colors hover:text-[#8d94a1] active:scale-95"
          >
            <ChevronUp size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center z-[4]">
          <button
            type="button"
            aria-label={`Next ${title.toLowerCase()}`}
            onClick={() => onChange(getWrappedTimeOption(options, current, 1))}
            className="h-5 w-5 text-[#c7ccd5] flex items-center justify-center transition-colors hover:text-[#8d94a1] active:scale-95"
          >
            <ChevronDown size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div className="relative z-[3] w-full flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(previous)}
            className="h-8 w-full flex items-center justify-center text-center leading-none text-[#c2c6ce] font-medium text-[17px] transition-colors hover:text-[#949aa5]"
          >
            {previous}
          </button>
          <button
            type="button"
            onClick={() => onChange(current)}
            className="h-9 w-full flex items-center justify-center text-center leading-none text-[#3c331f] font-semibold text-[18px]"
          >
            {current}
          </button>
          <button
            type="button"
            onClick={() => onChange(next)}
            className="h-8 w-full flex items-center justify-center text-center leading-none text-[#c2c6ce] font-medium text-[17px] transition-colors hover:text-[#949aa5]"
          >
            {next}
          </button>
        </div>
      </div>
    </div>
  )};

  return (
    <div className={`space-y-2 relative ${className}`} ref={containerRef}>
      {label && (
        <label className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 ml-1 ${labelClassName}`}>
          {showLabelIcon && <Clock3 size={12} />}
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${triggerClassName} flex items-center justify-between transition-all cursor-pointer ${isOpen ? openTriggerClassName : closedTriggerClassName}`}
      >
        <span className={`${textClassName} ${value ? selectedTextClassName : placeholderTextClassName}`}>
          {value ? formatTimeValue(value) : placeholder}
        </span>
        {trailingIcon === 'clock' ? (
          <Clock3 size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && panelStyle && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[299]"
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          />
          <div
            ref={panelRef}
            style={panelStyle}
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            className="bg-white border border-[#f2f3f6] rounded-[28px] shadow-[0_24px_56px_rgba(148,163,184,0.24)] p-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="text-center text-[14px] font-semibold text-gray-900 tracking-tight mb-5">Select Time</div>

            <div className="grid grid-cols-3 gap-3">
              {renderWheelColumn({
                title: 'Hour',
                options: HOUR_OPTIONS,
                current: draftTime.hour.padStart(2, '0'),
                wheelKey: 'hour',
                onChange: handleHourChange,
              })}

              {renderWheelColumn({
                title: 'Minute',
                options: MINUTE_OPTIONS,
                current: draftTime.minute,
                wheelKey: 'minute',
                onChange: handleMinuteChange,
              })}

              {renderWheelColumn({
                title: 'Period',
                options: PERIOD_OPTIONS,
                current: draftTime.period,
                wheelKey: 'period',
                onChange: handlePeriodChange,
              })}
            </div>

            <div className="flex items-end justify-between mt-5 pt-4 border-t border-[#e8eaef] gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9fa6b2]">Selected Time</div>
                <div className="text-[16px] font-semibold text-gray-900 mt-1 leading-none">
                  {formatTimeValue(draftValue).split(' ')[0]} <span className="text-[13px] font-semibold text-[#707784] ml-0.5">{formatTimeValue(draftValue).split(' ')[1]}</span>
                </div>
                {isPastSelection && (
                  <div className="text-[10px] font-bold text-amber-600 mt-1">Select a future time for today.</div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const clearedValue = '00:00';
                    const clearedParts = getInitialTimeParts(clearedValue);
                    setDraftTime(clearedParts);
                    onChange(clearedValue);
                  }}
                  className="px-2 py-2 text-[12px] font-medium text-[#9fa6b2] hover:text-[#6b7280] transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={isPastSelection}
                  onClick={() => {
                    onChange(draftValue);
                    setIsOpen(false);
                  }}
                  className="min-w-[84px] px-5 py-3 bg-[#facc15] text-gray-900 text-[12px] font-semibold rounded-[14px] shadow-[0_10px_22px_rgba(250,204,21,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
