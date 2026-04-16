'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Mock Events Data
const eventsData = [
  {
    id: 1,
    title: "Sofia's 18th Birthday",
    date: new Date(2026, 2, 24), // March 24, 2026
    startTime: "06:00 PM",
    endTime: "11:00 PM",
    location: "Makati Shangri-La",
    status: "Scheduled",
  }
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Start at March 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof eventsData[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Today marker (pretend today is March 27, 2026 based on screenshot)
  const today = new Date(2026, 2, 27);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);       
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  // Filter events for this month
  const currentMonthEvents = eventsData.filter(
    (e) => e.date.getMonth() === currentDate.getMonth() && e.date.getFullYear() === currentDate.getFullYear()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Calendar Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}    
          </h2>
          <div className="flex items-center gap-6 text-sm font-bold">
            <button onClick={prevMonth} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goToToday} className="text-[#d4a017] hover:text-[#b8860b] transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-[#d4a017] font-bold text-[13px] tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
          {blanksArray.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[100px] p-2"></div>        
          ))}

          {daysArray.map((day) => {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();  

            // Check for events
            const dayEvents = currentMonthEvents.filter((e) => e.date.getDate() === day);

            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(dateObj);
                  setIsDayModalOpen(true);
                }}
                className="min-h-[100px] p-2 flex flex-col items-center rounded-xl relative hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold mb-2 transition-colors ${isToday ? 'bg-[#d4a017] text-white' : 'text-gray-700'}`}>
                  {day}
                </div>

                {/* Event Chips */}
                <div className="w-full flex flex-col gap-1 px-1">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                        setSelectedDate(dateObj);
                        setIsModalOpen(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/50 text-[10px] font-bold px-2 py-1.5 rounded-lg truncate w-full shadow-sm text-center transition-colors cursor-pointer"
                      title={ev.title}
                    >
                      {ev.title.length > 12 ? ev.title.substring(0,10) + '...' : ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-8 mt-8 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017]"></div>       
            Today
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-200"></div>
            Scheduled
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            Conflict
          </div>
        </div>
      </div>

      {/* Events This Month Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h3 className="text-[13px] font-extrabold text-gray-900 mb-6 tracking-widest uppercase">Event This Month</h3>

        <div className="flex flex-col gap-3">
          {currentMonthEvents.length > 0 ? currentMonthEvents.map((ev) => (     
            <div
              key={ev.id}
              className="flex items-center justify-between p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50 cursor-pointer"
              onClick={() => {
                setSelectedEvent(ev);
                setSelectedDate(ev.date);
                setIsModalOpen(true);
              }}
            >
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-1">{ev.title}</h4>
                <p className="text-[12px] font-medium text-gray-500">{ev.location}</p>
              </div>
              <div className="bg-blue-100 text-blue-500 text-[11px] font-bold px-4 py-1.5 rounded-full">
                {ev.status}
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-gray-400 text-sm font-medium">No events scheduled for this month.</div>
          )}
        </div>
      </div>

      {/* Dynamic Modal - Day Summary */}
      {mounted && isDayModalOpen && selectedDate && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsDayModalOpen(false)}></div>

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-extrabold text-gray-900">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
              </h3>
              <button onClick={() => setIsDayModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100">   
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {(() => {
                const dayEvs = eventsData.filter((e) => e.date.getDate() === selectedDate.getDate() && e.date.getMonth() === selectedDate.getMonth() && e.date.getFullYear() === selectedDate.getFullYear());
                if (dayEvs.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900">No events scheduled</p>
                      <p className="text-[13px] font-medium text-gray-500 mt-1">There are no events planned for this date.</p>
                    </div>
                  );
                }
                return dayEvs.map(ev => (
                  <div key={ev.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors cursor-pointer bg-white shadow-sm"
                    onClick={() => {
                        setIsDayModalOpen(false);
                        setSelectedEvent(ev);
                        setIsModalOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-[14px] font-extrabold text-gray-900">{ev.title}</h4>
                        <p className="text-[12px] font-medium text-gray-500 mt-0.5">{ev.location}</p>
                      </div>
                      <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap border border-blue-100/50">
                        {ev.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-gray-500">
                      <svg className="w-4 h-4 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {ev.startTime} - {ev.endTime}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dynamic Modal - Details Only */}
      {mounted && isModalOpen && selectedEvent && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-extrabold text-gray-900">Event Details</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-2xl font-extrabold text-gray-900">{selectedEvent.title}</h4>
                  <p className="text-gray-500 font-medium mt-1">{selectedEvent.location}</p>
                </div>
                <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-blue-100/50">
                  {selectedEvent.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col gap-4">
                <div className="flex items-start gap-4 text-sm">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mt-1">
                    <svg className="w-5 h-5 text-[#d4a017]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-base">
                      {monthNames[selectedEvent.date.getMonth()]} {selectedEvent.date.getDate()}, {selectedEvent.date.getFullYear()}
                    </p>
                    <p className="text-gray-500 text-sm font-bold mt-0.5">{selectedEvent.startTime} – {selectedEvent.endTime}</p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                This project is currently marked as <span className="font-bold text-gray-900">{selectedEvent.status}</span>. Access the full details page to view comprehensive budget allocations, coordinate with active vendors, track precise production milestones, and monitor real-time logistics.
              </p>
            </div>

            <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-[14px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">Close</button>
              <Link href={`/admin/events/${selectedEvent.id}`} className="px-6 py-2.5 bg-[#facc15] hover:bg-[#eab308] text-gray-900 text-[14px] font-extrabold rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2">
                View Full Details
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}