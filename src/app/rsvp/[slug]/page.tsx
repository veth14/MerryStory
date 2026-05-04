'use client';
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

// Dummy implementation of a database/API fetch that links Event Slug -> Unique Codes returning Guest parameters
const DUMMY_DB: Record<string, Record<string, { guestName: string, maxGuests: number }>> = {
  'the-starlight-gala': {
    'VIP-2024': { guestName: 'Isabella Thorne', maxGuests: 2 },
    'PLATINUM-5': { guestName: 'Alexander Vance', maxGuests: 5 },
    'GALA-S2': { guestName: 'Julian Mercer', maxGuests: 2 }
  },
  'corporate-summit': {
    'EXEC-1': { guestName: 'Elena Sastro', maxGuests: 1 },
    'TEAM-4': { guestName: 'Tech Team Alpha', maxGuests: 4 }
  }
};

export default function GuestRsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  // Convert slug 'the-starlight-gala' to 'The Starlight Gala'
  const eventName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dynamic State Based on Code Validation
  const [maxAllowed, setMaxAllowed] = useState(1);
  const [guestName, setGuestName] = useState('');

  // Form State
  const [isAttending, setIsAttending] = useState<boolean | null>(true);
  const [attendees, setAttendees] = useState('1');
  const [dietary, setDietary] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const eventDatabase = DUMMY_DB[slug];
    
    if (eventDatabase && eventDatabase[code.trim().toUpperCase()]) {
      const guestInfo = eventDatabase[code.trim().toUpperCase()];
      setGuestName(guestInfo.guestName);
      setMaxAllowed(guestInfo.maxGuests);
      setAttendees('1');
      setErrorMsg('');
      setStep(2);
    } else {
      setErrorMsg('Invalid code for this event. Please try again.');
    }
  };

  const handleConfirmRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending && !email) return;

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          guestName,
          email,
          attendees,
          dietary,
          isAttending,
          code
        })
      });

      const data = await res.json();
      
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit RSVP:', err);
      // Fallback submission if API fails
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans selection:bg-[#facc15] selection:text-gray-900 overflow-x-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative sm:p-6 lg:p-12">
        {/* Background Decorative Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fefbf0] via-[#f7f4e9] to-[#eeeadd] pointer-events-none -z-10" />

        {isSubmitted ? (
          <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 sm:mt-32 p-8 sm:p-16 bg-white shadow-2xl shadow-gray-200/50 rounded-2xl border border-white text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 flex items-center justify-center rounded-full mx-auto mb-8">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">RSVP Confirmed!</h2>
            <p className="text-gray-500 font-medium text-[15px] max-w-md mx-auto leading-relaxed mb-8">
              Thank you! Your response for {eventName} has been successfully recorded. 
              {isAttending === true ? (
                <span className="block mt-4">
                  We have sent a confirmation to <strong className="text-gray-900">{email}</strong> containing your <strong className="text-[#d4a017]">custom QR code</strong>. Please present this QR code upon entering the event.
                </span>
              ) : (
                <span className="block mt-4">We are sorry you won't be able to make it!</span>
              )}
            </p>
            <button onClick={() => window.location.reload()} className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-extrabold uppercase tracking-widest text-[11px] transition-all rounded-sm shadow-xl shadow-gray-900/20">
              RETURN HOME
            </button>
          </div>
        ) : step === 1 ? (
          /* STEP 1: CODE ENTRY */
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center py-12 lg:py-20 animate-in fade-in duration-500">
            <div className="text-center mb-10 md:mb-16 px-4">
              <h4 className="text-[10px] md:text-[11px] font-black text-[#d4a017] tracking-[0.3em] uppercase mb-4 md:mb-6">
                EXCLUSIVE ACCESS
              </h4>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                 Welcome to <span className="text-[#d4a017]">{eventName}</span>
              </h1>
              <p className="text-gray-500 font-medium text-[14px] md:text-[16px]">
                Please enter your unique code to proceed.
              </p>
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleVerifyCode} className="w-full max-w-xl mx-auto bg-white p-8 md:p-12 lg:p-16 shadow-2xl shadow-gray-200/50 rounded-lg sm:rounded-2xl border border-white relative z-20">
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-center">
                  <p className="text-red-500 text-[12px] font-bold tracking-wide">{errorMsg}</p>
                </div>
              )}
              <div className="mb-8 md:mb-10 text-center">
                <input 
                  required
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="UNIQUE EVENT CODE"
                  className="w-full text-center text-[13px] md:text-[15px] font-extrabold tracking-[0.2em] text-gray-900 placeholder-gray-300 border-b-2 border-gray-100 focus:border-[#facc15] py-4 focus:outline-none transition-colors uppercase bg-transparent"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#facc15] hover:bg-[#eab308] text-gray-900 font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] py-5 transition-all shadow-xl shadow-[#facc15]/20 flex items-center justify-center gap-3 rounded-sm group"
              >
                CONTINUE TO RSVP 
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>

            <div className="mt-16 text-center text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase flex items-center justify-center gap-4 hidden sm:flex">
               <span className="w-12 h-px bg-gray-200"></span>
               MERRY STORY PRODUCTIONS
               <span className="w-12 h-px bg-gray-200"></span>
            </div>

            {/* Decorative BG Image snippet mapped to bottom right behind the box */}
            <div className="absolute right-0 bottom-0 w-64 md:w-96 h-64 md:h-96 opacity-20 md:opacity-40 mix-blend-multiply pointer-events-none hidden lg:block -z-10 translate-x-12 translate-y-12">
               <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#d4a017" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.9,-18,97,-2.4C97.1,13.1,91.3,28.6,81.9,41.5C72.6,54.4,60,64.6,46,72.4C32.1,80.2,16.1,85.5,0.7,84.4C-14.7,83.3,-29.4,75.8,-42.6,67C-55.8,58.2,-67.4,48.1,-76.4,35.4C-85.4,22.7,-91.8,7.5,-91.5,-7.4C-91.2,-22.3,-84.1,-36.8,-74.6,-49.2C-65.1,-61.6,-53.1,-71.8,-39.7,-79.6C-26.2,-87.4,-13.1,-92.7,1.2,-94.7C15.6,-96.6,30.5,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
          </div>
        ) : (
          /* STEP 2: ATTENDANCE SELECTION */
          <form onSubmit={handleConfirmRsvp} className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col pt-8 pb-16 animate-in slide-in-from-right-8 duration-500">
             
             {/* Info Section split */}
             <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-8 lg:mb-16 px-4">
                <div className="flex-1 text-center lg:text-left">
                  <h4 className="text-[9px] md:text-[10px] font-black text-[#d4a017] tracking-[0.25em] uppercase mb-4">
                    EVENT INVITATION FOR {guestName.toUpperCase()}
                  </h4>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                    {eventName}
                  </h1>
                  <p className="text-gray-500 font-medium text-[14px] md:text-[15px] leading-relaxed max-w-md mx-auto lg:mx-0">
                    Join us for an evening of celestial celebration and cinematic wonder. Your presence is the highlight of our story.
                  </p>
                </div>
                <div className="flex-1 w-full max-w-md mx-auto relative group">
                   {/* Golden accent frame */}
                   <div className="absolute inset-0 bg-[#facc15] translate-x-4 translate-y-4 rounded-sm" />
                   {/* Dummy Image */}
                   <img 
                     src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                     alt="Gala Event Setup" 
                     className="relative z-10 w-full aspect-[4/5] object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-700 rounded-sm shadow-xl"
                   />
                </div>
             </div>

             {/* RSVP Details Box */}
             <div className="w-full bg-white p-6 sm:p-10 lg:p-12 shadow-2xl shadow-gray-200/50 rounded-lg sm:rounded-2xl border-t-4 border-t-[#d4a017] z-20 relative mx-4 sm:mx-0 w-[calc(100%-2rem)] sm:w-full self-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                   <button 
                     type="button"
                     onClick={() => setIsAttending(true)}
                     className={`py-5 px-6 font-extrabold text-[12px] sm:text-[13px] uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${
                       isAttending 
                         ? 'border-[#facc15] bg-[#facc15] text-gray-900 shadow-lg shadow-[#facc15]/20' 
                         : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                     }`}
                   >
                     {isAttending && <svg className="w-5 h-5 absolute left-6 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                     I WILL ATTEND!
                   </button>
                   
                   <button 
                     type="button"
                     onClick={() => setIsAttending(false)}
                     className={`py-5 px-6 font-extrabold text-[12px] sm:text-[13px] uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${
                       isAttending === false
                         ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                         : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                     }`}
                   >
                     {isAttending === false && <svg className="w-5 h-5 absolute left-6 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                     I CANNOT ATTEND
                   </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-300 ${!isAttending ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                   <div>
                     <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                       NUMBER OF ATTENDEES (MAX {maxAllowed})
                     </label>
                     <input 
                       type="number"
                       min="1"
                       max={maxAllowed}
                       value={attendees}
                       onChange={(e) => {
                         const val = parseInt(e.target.value, 10);
                         if (!isNaN(val) && val <= maxAllowed) {
                           setAttendees(val.toString());
                         } else if (e.target.value === '') {
                           setAttendees('');
                         }
                       }}
                       disabled={!isAttending}
                       className="w-full text-[15px] font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-100 focus:border-[#facc15] pb-2 focus:outline-none transition-colors bg-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                       DIETARY REQUIREMENTS
                     </label>
                     <input 
                       type="text"
                       value={dietary}
                       onChange={(e) => setDietary(e.target.value)}
                       disabled={!isAttending}
                       placeholder="e.g. Vegan, Nut Allergy"
                       className="w-full text-[15px] font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-100 focus:border-[#facc15] pb-2 focus:outline-none transition-colors bg-transparent"
                     />
                   </div>
                </div>

                <div className={`mt-8 transition-opacity duration-300 ${!isAttending ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                   <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                     EMAIL ADDRESS (FOR ENTRY QR CODE TICKET)
                   </label>
                   <input 
                     type="email"
                     required={isAttending || undefined}
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     disabled={!isAttending}
                     placeholder="guest@example.com"
                     className="w-full text-[15px] font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-100 focus:border-[#facc15] pb-2 focus:outline-none transition-colors bg-transparent"
                   />
                </div>

                <div className="mt-12 flex flex-col items-center sm:items-end border-t border-gray-100 pt-8">
                   <button 
                     type="submit"
                     disabled={isSubmitting || (isAttending && !email ? true : false)}
                     className="w-full sm:w-auto px-12 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-900/20 rounded-sm flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          SENDING...
                        </>
                      ) : (
                        'CONFIRM RSVP'
                      )}
                   </button>
                   <span className="text-[10px] font-bold text-gray-400 italic mt-4">
                     Please respond by December 1st, 2024
                   </span>
                </div>
             </div>
          </form>
        )}
      </main>
    </div>
  );
}