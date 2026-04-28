'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';

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
