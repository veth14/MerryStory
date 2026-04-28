'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, ChevronDown, Circle, Clock, Flame, Zap } from 'lucide-react';

export type TaskSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
};

type ControlSize = 'toolbar' | 'table' | 'modal';
type AlignMode = 'left' | 'right';

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const TASK_PRIORITY_OPTIONS: TaskSelectOption[] = [
  { value: 'CRITICAL', label: 'Critical', icon: <Flame className="h-4 w-4" /> },
  { value: 'HIGH', label: 'High', icon: <Zap className="h-4 w-4" /> },
  { value: 'MEDIUM', label: 'Medium', icon: <Circle className="h-4 w-4" /> },
  { value: 'LOW', label: 'Low', icon: <Circle className="h-4 w-4" /> },
];

const CONTROL_STYLES: Record<
  ControlSize,
  {
    trigger: string;
    label: string;
    menu: string;
    item: string;
    itemLabel: string;
    itemMeta: string;
  }
> = {
  toolbar: {
    trigger:
      'min-h-[40px] rounded-xl border px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em]',
    label: 'text-[11px] font-black uppercase tracking-[0.16em]',
    menu: 'rounded-2xl p-1.5',
    item: 'min-h-[42px] rounded-xl px-3 py-2.5',
    itemLabel: 'text-[11px] font-black uppercase tracking-[0.14em]',
    itemMeta: 'text-[9px] font-black uppercase tracking-[0.16em] text-[#b29d61]',
  },
  table: {
    trigger:
      'min-h-[36px] rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]',
    label: 'text-[11px] font-black uppercase tracking-[0.12em]',
    menu: 'rounded-2xl p-1.5',
    item: 'min-h-[40px] rounded-lg px-3 py-2.5',
    itemLabel: 'text-[11px] font-black uppercase tracking-[0.12em]',
    itemMeta: 'text-[9px] font-black uppercase tracking-[0.16em] text-[#b29d61]',
  },
  modal: {
    trigger:
      'min-h-[52px] rounded-2xl border px-4 py-3.5 text-[14px] font-extrabold tracking-tight',
    label: 'text-[14px] font-extrabold tracking-tight',
    menu: 'rounded-[26px] p-2',
    item: 'min-h-[52px] rounded-2xl px-4 py-3.5',
    itemLabel: 'text-[13px] font-extrabold tracking-tight',
    itemMeta: 'text-[10px] font-black uppercase tracking-[0.16em] text-[#b29d61]',
  },
};

function getOverlayStyle({
  trigger,
  align,
  overlayMinWidth,
  overlayMaxWidth,
  offset,
  preferredHeight,
}: {
  trigger: HTMLButtonElement;
  align: AlignMode;
  overlayMinWidth?: number;
  overlayMaxWidth: number;
  offset: number;
  preferredHeight: number;
}): React.CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewportPadding = 12;
  const maxWidth = Math.min(overlayMaxWidth, window.innerWidth - viewportPadding * 2);
  const width = Math.max(
    Math.min(Math.max(rect.width, overlayMinWidth ?? rect.width), maxWidth),
    Math.min(rect.width, maxWidth)
  );

  let left = align === 'right' ? rect.right - width : rect.left;
  left = Math.min(Math.max(left, viewportPadding), window.innerWidth - width - viewportPadding);

  const availableBelow = window.innerHeight - rect.bottom - viewportPadding - offset;
  const availableAbove = rect.top - viewportPadding - offset;
  const placeAbove = availableBelow < preferredHeight && availableAbove > availableBelow;

  if (placeAbove) {
    const bottom = Math.min(window.innerHeight - rect.top + offset, window.innerHeight - viewportPadding);
    return {
      position: 'fixed',
      bottom,
      left,
      width,
      maxHeight: Math.max(96, window.innerHeight - bottom - viewportPadding),
      zIndex: 260,
    };
  }

  const top = Math.min(rect.bottom + offset, window.innerHeight - viewportPadding);
  return {
    position: 'fixed',
    top,
    left,
    width,
    maxHeight: Math.max(96, window.innerHeight - top - viewportPadding),
    zIndex: 260,
  };
}

function useAnchoredOverlay({
  isOpen,
  onClose,
  align = 'left',
  overlayMinWidth,
  overlayMaxWidth = 360,
  offset = 8,
  preferredHeight = 280,
}: {
  isOpen: boolean;
  onClose: () => void;
  align?: AlignMode;
  overlayMinWidth?: number;
  overlayMaxWidth?: number;
  offset?: number;
  preferredHeight?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const syncPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') {
      return;
    }

    setStyle(
      getOverlayStyle({
        trigger,
        align,
        overlayMinWidth,
        overlayMaxWidth,
        offset,
        preferredHeight,
      })
    );
  }, [align, offset, overlayMaxWidth, overlayMinWidth, preferredHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || overlayRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleWindowChange = () => syncPosition();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncPosition());
      if (triggerRef.current) {
        resizeObserver.observe(triggerRef.current);
      }
    }

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      resizeObserver?.disconnect();
    };
  }, [isOpen, syncPosition]);

  return { mounted, style, triggerRef, overlayRef, syncPosition };
}

function TaskFieldLabel({ label }: { label?: string }) {
  if (!label) {
    return null;
  }

  return (
    <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#8b8371]">
      {label}
    </label>
  );
}

export function TaskSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option',
  size = 'modal',
  align = 'left',
  overlayMinWidth,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  prefixIcon,
  renderValue,
}: {
  label?: string;
  options: TaskSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: ControlSize;
  align?: AlignMode;
  overlayMinWidth?: number;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  prefixIcon?: React.ReactNode;
  renderValue?: (option: TaskSelectOption | undefined) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = CONTROL_STYLES[size];
  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const { mounted, style, triggerRef, overlayRef, syncPosition } = useAnchoredOverlay({
    isOpen,
    onClose: () => setIsOpen(false),
    align,
    overlayMinWidth,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <TaskFieldLabel label={label} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          syncPosition();
          setIsOpen(true);
        }}
        className={cn(
          'flex w-full items-center justify-between gap-3 bg-white text-left text-[#1f1c14] transition-colors duration-200',
          'border-[#e7dfc9] hover:border-[#d7cbab] hover:bg-[#fffdf7]',
          'focus:outline-none focus:ring-2 focus:ring-[#f4d66f]/40',
          styles.trigger,
          triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {prefixIcon ? <span className="shrink-0 text-[#b29d61]">{prefixIcon}</span> : null}
          {renderValue ? (
            renderValue(selectedOption)
          ) : (
            <span className="flex min-w-0 items-center gap-2.5">
              {selectedOption?.icon ? <span className="shrink-0 text-[#b78910]">{selectedOption.icon}</span> : null}
              <span
                className={cn(
                  styles.label,
                  'truncate',
                  selectedOption ? 'text-[#1f1c14]' : 'font-bold text-[#9d9582]'
                )}
                title={selectedOption?.label ?? placeholder}
              >
                {selectedOption?.label ?? placeholder}
              </span>
            </span>
          )}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-[#a08e64] transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              ref={overlayRef}
              style={style}
              className={cn(
                'overflow-auto border border-[#efe7d1] bg-white shadow-[0_24px_60px_rgba(26,20,8,0.14)]',
                styles.menu,
                menuClassName
              )}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 text-left transition-colors',
                      'hover:bg-[#faf5e6]',
                      styles.item,
                      isSelected && 'bg-[#fff6d5]'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {option.icon ? <span className="shrink-0 text-[#b78910]">{option.icon}</span> : null}
                      <span className="min-w-0">
                        <span className={cn('block truncate text-[#1f1c14]', styles.itemLabel)}>{option.label}</span>
                        {option.sublabel ? <span className={cn('mt-1 block truncate', styles.itemMeta)}>{option.sublabel}</span> : null}
                      </span>
                    </span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#c69b08]" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function TaskMultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = 'Select staff',
  emptyLabel = 'Unassigned',
  size = 'modal',
  align = 'left',
  overlayMinWidth,
  className = '',
  triggerClassName = '',
  menuClassName = '',
}: {
  label?: string;
  options: TaskSelectOption[];
  values: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  size?: ControlSize;
  align?: AlignMode;
  overlayMinWidth?: number;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = CONTROL_STYLES[size];
  const { mounted, style, triggerRef, overlayRef, syncPosition } = useAnchoredOverlay({
    isOpen,
    onClose: () => setIsOpen(false),
    align,
    overlayMinWidth,
  });

  const selectedEntries = useMemo(
    () =>
      values.map((selectedValue) => {
        const matchedOption = options.find((option) => option.value === selectedValue);
        return matchedOption || { value: selectedValue, label: selectedValue };
      }),
    [options, values]
  );

  const summary = useMemo(() => {
    if (selectedEntries.length === 0) {
      return emptyLabel;
    }

    if (selectedEntries.length <= 2) {
      return selectedEntries.map((option) => option.label).join(', ');
    }

    return `${selectedEntries[0]?.label}, ${selectedEntries[1]?.label} +${selectedEntries.length - 2}`;
  }, [emptyLabel, selectedEntries]);

  return (
    <div className={cn('space-y-2', className)}>
      <TaskFieldLabel label={label} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          syncPosition();
          setIsOpen(true);
        }}
        className={cn(
          'flex w-full items-center justify-between gap-3 bg-white text-left text-[#1f1c14] transition-colors duration-200',
          'border-[#e7dfc9] hover:border-[#d7cbab] hover:bg-[#fffdf7]',
          'focus:outline-none focus:ring-2 focus:ring-[#f4d66f]/40',
          styles.trigger,
          triggerClassName
        )}
        title={selectedEntries.map((option) => option.label).join(', ') || emptyLabel}
      >
        <span className={cn(styles.label, 'truncate', selectedEntries.length === 0 && 'font-bold text-[#9d9582]')}>
          {selectedEntries.length === 0 ? emptyLabel || placeholder : summary}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-[#a08e64] transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              ref={overlayRef}
              style={style}
              className={cn(
                'overflow-auto border border-[#efe7d1] bg-white shadow-[0_24px_60px_rgba(26,20,8,0.14)]',
                styles.menu,
                menuClassName
              )}
            >
              {options.map((option) => {
                const isSelected = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onChange(
                        isSelected ? values.filter((value) => value !== option.value) : [...values, option.value]
                      )
                    }
                    className={cn(
                      'flex w-full items-center justify-between gap-3 text-left transition-colors',
                      'hover:bg-[#faf5e6]',
                      styles.item,
                      isSelected && 'bg-[#fff6d5]'
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn('block truncate text-[#1f1c14]', styles.itemLabel)}>{option.label}</span>
                      {option.sublabel ? <span className={cn('mt-1 block truncate', styles.itemMeta)}>{option.sublabel}</span> : null}
                    </span>
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected ? 'border-[#d2a721] bg-[#d2a721] text-white' : 'border-[#d8cfbb] bg-white text-transparent'
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function TaskDatePicker({
  label,
  value,
  onChange,
  minDate,
  placeholder = 'Select date',
  size = 'modal',
  className = '',
  triggerClassName = '',
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  placeholder?: string;
  size?: ControlSize;
  className?: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = CONTROL_STYLES[size];
  const initialMonth = useMemo(() => {
    if (value) {
      const parsed = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }

    const fallback = minDate ? new Date(`${minDate}T00:00:00`) : new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }, [minDate, value]);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const { mounted, style, triggerRef, overlayRef, syncPosition } = useAnchoredOverlay({
    isOpen,
    onClose: () => setIsOpen(false),
    overlayMinWidth: size === 'modal' ? 280 : 220,
    preferredHeight: 320,
  });

  useEffect(() => {
    setCurrentMonth(initialMonth);
  }, [initialMonth]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    const dayNumber = index - firstDay + 1;
    if (dayNumber <= 0) {
      return null;
    }

    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  });

  const buttonLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : placeholder;

  return (
    <div className={cn('space-y-2', className)}>
      <TaskFieldLabel label={label} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          syncPosition();
          setIsOpen(true);
        }}
        className={cn(
          'flex w-full items-center justify-between gap-3 bg-white text-left text-[#1f1c14] transition-colors duration-200',
          'border-[#e7dfc9] hover:border-[#d7cbab] hover:bg-[#fffdf7]',
          'focus:outline-none focus:ring-2 focus:ring-[#f4d66f]/40',
          styles.trigger,
          triggerClassName
        )}
      >
        <span className={cn(styles.label, 'truncate', value ? 'text-[#1f1c14]' : 'font-bold text-[#9d9582]')}>
          {buttonLabel}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#a08e64]" />
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              ref={overlayRef}
              style={style}
              className="overflow-hidden rounded-[26px] border border-[#efe7d1] bg-white p-4 shadow-[0_24px_60px_rgba(26,20,8,0.14)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="rounded-xl border border-[#e8e0ca] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d7a4b] transition-colors hover:bg-[#faf5e6]"
                >
                  Prev
                </button>
                <div className="text-[12px] font-black uppercase tracking-[0.16em] text-[#1f1c14]">{monthLabel}</div>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="rounded-xl border border-[#e8e0ca] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d7a4b] transition-colors hover:bg-[#faf5e6]"
                >
                  Next
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <span key={`${day}-${index}`} className="py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#b29d61]">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((dateValue, index) => {
                  if (!dateValue) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }

                  const isSelected = value === dateValue;
                  const isDisabled = Boolean(minDate && dateValue < minDate);

                  return (
                    <button
                      key={dateValue}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onChange(dateValue);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'h-10 rounded-xl text-[12px] font-black transition-colors',
                        isSelected && 'bg-[#d2a721] text-white',
                        !isSelected && !isDisabled && 'text-[#1f1c14] hover:bg-[#faf5e6]',
                        isDisabled && 'cursor-not-allowed text-[#c8c0ad] opacity-50'
                      )}
                    >
                      {dateValue.slice(-2)}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function TaskTimeField({
  label,
  value,
  onChange,
  min,
  placeholder = 'Select time',
  size = 'modal',
  className = '',
  triggerClassName = '',
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  size?: ControlSize;
  className?: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(12);
  const [draftMinute, setDraftMinute] = useState('00');
  const [draftPeriod, setDraftPeriod] = useState<'AM' | 'PM'>('AM');
  const styles = CONTROL_STYLES[size];
  const { mounted, style, triggerRef, overlayRef, syncPosition } = useAnchoredOverlay({
    isOpen,
    onClose: () => setIsOpen(false),
    overlayMinWidth: size === 'modal' ? 280 : 220,
    preferredHeight: 320,
  });

  useEffect(() => {
    if (!value) {
      return;
    }
    const [hourString, minuteString] = value.split(':');
    const hourValue = parseInt(hourString, 10);
    const periodValue = hourValue >= 12 ? 'PM' : 'AM';
    const hour12 = hourValue === 0 ? 12 : hourValue > 12 ? hourValue - 12 : hourValue;
    setDraftHour(hour12);
    setDraftMinute(minuteString);
    setDraftPeriod(periodValue);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

  const formatTime12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, mins] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${mins} ${period}`;
  };

  const convertTo24Hour = (hour: number, minute: string, period: 'AM' | 'PM') => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${String(hour24).padStart(2, '0')}:${minute}`;
  };

  const buttonLabel = value ? formatTime12Hour(value) : placeholder;

  const isTimeDisabled = (hour: number, minute: string, period: 'AM' | 'PM') => {
    if (!min) return false;
    const timeValue = convertTo24Hour(hour, minute, period);
    return timeValue < min;
  };

  const draftTimeValue = convertTo24Hour(draftHour, draftMinute, draftPeriod);
  const isConfirmDisabled = isTimeDisabled(draftHour, draftMinute, draftPeriod);

  return (
    <div className={cn('space-y-2', className)}>
      <TaskFieldLabel label={label} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          if (value) {
            const [hourString, minuteString] = value.split(':');
            const hourValue = parseInt(hourString, 10);
            const periodValue = hourValue >= 12 ? 'PM' : 'AM';
            const hour12 = hourValue === 0 ? 12 : hourValue > 12 ? hourValue - 12 : hourValue;
            setDraftHour(hour12);
            setDraftMinute(minuteString);
            setDraftPeriod(periodValue);
          }

          syncPosition();
          setIsOpen(true);
        }}
        className={cn(
          'flex w-full items-center justify-between gap-3 bg-white text-left text-[#1f1c14] transition-colors duration-200',
          'border-[#e7dfc9] hover:border-[#d7cbab] hover:bg-[#fffdf7]',
          'focus:outline-none focus:ring-2 focus:ring-[#f4d66f]/40',
          styles.trigger,
          triggerClassName
        )}
      >
        <span
          className={cn(
            styles.label,
            'truncate font-semibold tracking-normal',
            value ? 'text-[#1f1c14]' : 'text-[#9d9582]'
          )}
        >
          {buttonLabel}
        </span>
        <Clock className="h-4 w-4 shrink-0 text-[#a08e64]" />
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              ref={overlayRef}
              style={style}
              className="overflow-hidden rounded-2xl border border-[#efe7d1] bg-white p-3 shadow-[0_24px_60px_rgba(26,20,8,0.14)]"
            >
              <div className="grid grid-cols-3 gap-2 pb-2 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[#b29d61]">
                <span>Hour</span>
                <span>Min</span>
                <span>Period</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-48 space-y-1 overflow-y-auto pr-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => {
                        setDraftHour(hour);
                      }}
                      disabled={isTimeDisabled(hour, draftMinute, draftPeriod)}
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-[12px] font-semibold transition-colors',
                        draftHour === hour && 'bg-[#d2a721] text-white',
                        draftHour !== hour &&
                          !isTimeDisabled(hour, draftMinute, draftPeriod) &&
                          'text-[#1f1c14] hover:bg-[#faf5e6]',
                        isTimeDisabled(hour, draftMinute, draftPeriod) && 'cursor-not-allowed text-[#c8c0ad] opacity-50'
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>

                <div className="h-48 space-y-1 overflow-y-auto pr-1">
                  {minutes.map((minute) => {
                    const hour12 = draftHour;
                    const currentPeriod = draftPeriod;

                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => {
                          setDraftMinute(minute);
                        }}
                        disabled={isTimeDisabled(hour12, minute, currentPeriod)}
                        className={cn(
                          'w-full rounded-md px-2 py-2 text-[12px] font-semibold transition-colors',
                          draftMinute === minute && 'bg-[#d2a721] text-white',
                          draftMinute !== minute &&
                            !isTimeDisabled(hour12, minute, currentPeriod) &&
                            'text-[#1f1c14] hover:bg-[#faf5e6]',
                          isTimeDisabled(hour12, minute, currentPeriod) && 'cursor-not-allowed text-[#c8c0ad] opacity-50'
                        )}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>

                <div className="flex h-48 flex-col items-end">
                  <div className="space-y-1">
                    {(['AM', 'PM'] as const).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setDraftPeriod(slot)}
                        className={cn(
                          'w-full rounded-md px-2 py-2 text-[12px] font-semibold transition-colors',
                          draftPeriod === slot
                            ? 'border border-[#d2a721] bg-[#d2a721] text-white'
                            : 'border border-[#e8e0ca] text-[#8d7a4b] hover:bg-[#faf5e6]'
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(draftTimeValue);
                      setIsOpen(false);
                    }}
                    disabled={isConfirmDisabled}
                    className={cn(
                      'mt-auto inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                      isConfirmDisabled
                        ? 'cursor-not-allowed border-[#e8e0ca] text-[#c8c0ad]'
                        : 'border-[#d2a721] bg-[#d2a721] text-white hover:bg-[#c69b08]'
                    )}
                    aria-label="Confirm time"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
