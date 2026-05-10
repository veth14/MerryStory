"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatDateLabel = (value: string) => {
  if (!value) return 'dd/mm/yyyy';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
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
  minWidth,
}: {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  minWidth?: number;
}) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const preferredWidth = Math.max(rect.width, minWidth || 0);
      const width = Math.min(preferredWidth, viewportWidth - 24);
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 300 && spaceAbove > spaceBelow;

      const nextStyle: React.CSSProperties = {
        position: 'fixed',
        width,
        left: Math.min(Math.max(12, rect.left), Math.max(12, viewportWidth - width - 12)),
        zIndex: 260,
        maxHeight: Math.max(180, Math.min(360, openUp ? spaceAbove : spaceBelow)),
        overflowY: 'auto',
      };

      if (openUp) {
        nextStyle.bottom = viewportHeight - rect.top + 8;
      } else {
        nextStyle.top = rect.bottom + 8;
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
  }, [anchorRef, isOpen, minWidth]);

  if (!isOpen || !style || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={panelRef} style={style} className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
      {children}
    </div>,
    document.body
  );
}

function ConsultationDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(`${value}T00:00:00`);
    }

    return new Date();
  });
  const { triggerRef, panelRef } = useDropdownLayer<HTMLDivElement, HTMLDivElement>(isOpen, () => setIsOpen(false));
  const today = getTodayDate();
  const monthNames = useMemo(
    () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  );

  useEffect(() => {
    if (!value) return;
    setCurrentMonth(new Date(`${value}T00:00:00`));
  }, [value]);

  const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full border-b border-gray-200 pb-3 text-sm text-left focus:outline-none focus:border-brand-yellow hover:border-brand-yellow text-gray-900 transition-colors bg-transparent flex items-center justify-between gap-3"
      >
        <span className={value ? 'text-gray-900 uppercase' : 'text-gray-300 uppercase'}>{formatDateLabel(value)}</span>
        <Calendar className="w-4 h-4 text-gray-600 shrink-0" />
      </button>

      <FloatingDropdown isOpen={isOpen} anchorRef={triggerRef} panelRef={panelRef} minWidth={340}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-[14px] font-extrabold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`${day}-${index}`} className="text-[10px] font-bold text-[#d4a017] uppercase">
                {day}
              </div>
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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    guests: '',
    vision: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/contacts/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'consultation', ...formData }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', date: '', guests: '', vision: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-gray-900 pb-32 pt-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* LEFT COLUMN - Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-5/12 flex flex-col"
        >
          {/* Top Image */}
          <div className="relative w-[85%] aspect-[3/4] mb-12 shadow-xl bg-gray-100">
            <Image 
              src="https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/differenceSection/about.jpg" 
              alt="Studio Production" 
              fill 
              className="object-cover grayscale"
              unoptimized
            />
            {/* Very slight offset accent shape */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-yellow/10 -z-10" />
          </div>

          <h1 className="text-5xl md:text-[4rem] font-bold leading-[0.9] tracking-tight mb-6">
            START YOUR <br/>
            <span className="text-brand-yellow">STORY.</span>
          </h1>

          <p className="text-gray-500 text-[15px] leading-[1.8] max-w-sm mb-16">
            We don't just capture events; we curate legacies. Schedule a private consultation to discuss your vision with our creative directors.
          </p>

          <div>
            <span className="text-brand-yellow font-bold uppercase tracking-[0.2em] text-[10px] mb-6 block">
              HOW TO REACH OUT
            </span>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-900 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.864-1.051l-3.218-.536a2.25 2.25 0 00-2.02.571l-1.155 1.155a11.97 11.97 0 01-5.69-5.69l1.155-1.155a2.25 2.25 0 00.571-2.02l-.536-3.218C10.666 4.601 10.215 4.25 9.7 4.25H4.5a2.25 2.25 0 00-2.25 2.25z" />
                 </svg>
                 <div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-tight">Private Line</h4>
                    <p className="text-gray-500 text-[13px] mt-1">+1 (212) 555 - 0198</p>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-900 mt-0.5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                 </svg>
                 <div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-tight">Email Studio</h4>
                    <p className="text-gray-500 text-[13px] mt-1">hello@merrystory.com</p>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 mt-0.5">
                   <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                 </svg>
                 <div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-tight">Facebook</h4>
                    <p className="text-gray-500 text-[13px] mt-1">facebook.com/merrystory</p>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-7/12"
        >
           <div className="bg-white p-10 md:p-16 lg:p-20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
              
              <form className="space-y-10" onSubmit={handleSubmit}>
                 
                 {/* Full Name */}
                 <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">FULL NAME</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="ALEXANDER VOGUE" 
                      className="w-full border-b border-gray-200 pb-3 text-sm focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors bg-transparent"
                    />
                 </div>

                 {/* Email Address */}
                 <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ALEXANDER@STUDIO.COM" 
                      className="w-full border-b border-gray-200 pb-3 text-sm focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors bg-transparent"
                    />
                 </div>

                 {/* Dual Row (Date & Guests) */}
                 <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">PREFERRED DATE</label>
                      <ConsultationDatePicker value={formData.date} onChange={(date) => setFormData((prev) => ({ ...prev, date }))} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">GUEST COUNT</label>
                      <input 
                        type="text" 
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        placeholder="ESTIMATED TOTAL" 
                        className="w-full border-b border-gray-200 pb-3 text-sm focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors bg-transparent uppercase"
                      />
                    </div>
                 </div>

                 {/* The Vision */}
                 <div className="pt-2">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">THE VISION</label>
                    <textarea 
                      name="vision"
                      value={formData.vision}
                      onChange={handleChange}
                      placeholder="DESCRIBE THE CINEMATIC SCOPE OF YOUR PRODUCTION..." 
                      rows={4}
                      className="w-full border-b border-gray-200 pb-3 text-sm focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors resize-none bg-transparent"
                    />
                 </div>

                 {/* Submit Button & Status Messages */}
                 <div className="pt-6 flex flex-col items-center">
                    <button 
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-brand-yellow hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 text-black py-5 px-8 flex justify-between items-center transition-colors duration-300 group"
                    >
                       <span className="font-bold text-[11px] uppercase tracking-[0.15em]">
                         {status === 'loading' ? 'SENDING CONSULTATION...' : 'REQUEST PRIVATE SESSION'}
                       </span>
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-2 transition-transform">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                       </svg>
                    </button>

                    {status === 'success' && (
                       <p className="mt-4 text-[10px] font-bold tracking-[0.1em] text-green-600 uppercase text-center w-full bg-green-50 p-3">
                         Consultation request sent successfully. Check your email.
                       </p>
                    )}
                    
                    {status === 'error' && (
                       <p className="mt-4 text-[10px] font-bold tracking-[0.1em] text-red-600 uppercase text-center w-full bg-red-50 p-3">
                         Failed to send consultation request. Please try again or email us directly.
                       </p>
                    )}

                    <span className="text-[8px] font-bold tracking-[0.2em] text-gray-400 uppercase mt-5 block">
                       EXPECTED RESPONSE TIME: WITHIN 24 BUSINESS HOURS
                    </span>
                 </div>
              </form>

              {/* Testimonial Footer inside the form card */}
              <div className="mt-12 bg-[#F4F4F4] p-8 relative">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-16 h-16 absolute -top-4 -right-2 text-white/80 opacity-50 rotate-180">
                   <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                 </svg>
                 <p className="text-gray-600 italic font-serif text-sm leading-relaxed relative z-10 w-[90%]">
                   "Merry Story didn't just film our gala; they translated the very soul of the evening into a visual masterpiece. It is pure art."
                 </p>
                 <div className="flex items-center gap-3 mt-6">
                    <div className="w-8 h-8 rounded-full bg-brand-yellow flex-shrink-0" />
                    <div>
                       <h5 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-900 leading-tight">HELENA THORNE</h5>
                       <span className="text-[8px] font-bold uppercase tracking-[0.05em] text-gray-500">GLOBAL ARTS FOUNDATION</span>
                    </div>
                 </div>
              </div>

           </div>
        </motion.div>
      </div>
    </main>
  );
}
