'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check } from 'lucide-react';

import { toDateInputValue } from '../utils';
import type { SelectOption } from '../types';

const overlayPanelClassName = 'z-[360] overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';
const overlayOptionClassName = 'px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap';
const calendarPanelClassName = 'z-[360] min-w-[22rem] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.14)]';

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

const useOverlayMenuPosition = ({
  isOpen,
  preferredHeight,
  preferredWidth,
  triggerRef,
  menuRef,
}: {
  isOpen: boolean;
  preferredHeight: number;
  preferredWidth?: number;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>();

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

    updatePosition();
    const frameId = window.requestAnimationFrame(updatePosition);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updatePosition())
      : null;

    resizeObserver?.observe(triggerRef.current);
    if (menuRef.current) {
      resizeObserver?.observe(menuRef.current);
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [isOpen, menuRef, preferredHeight, preferredWidth, triggerRef]);

  return menuStyle;
};

export const OverlaySelect = ({
  value,
  options,
  onChange,
  triggerWrapperClassName,
  renderTrigger,
  renderOption,
  panelClassName,
  preferredWidth,
  preferredHeight = 300,
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);
  const menuStyle = useOverlayMenuPosition({
    isOpen,
    preferredHeight,
    preferredWidth,
    triggerRef,
    menuRef,
  });

  useEffect(() => {
    if (!isOpen) return;

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

export const OverlayDatePicker = ({
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
  const menuStyle = useOverlayMenuPosition({
    isOpen,
    preferredHeight: 392,
    preferredWidth,
    triggerRef,
    menuRef,
  });

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
