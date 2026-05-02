'use client';

import React, { useState, use } from 'react';

type ValidationResponse = {
  guestId: string;
  guestName: string;
  email: string;
  tier: string;
  status: string;
  eventName: string;
};

export default function GuestRsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const fallbackEventName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [attending, setAttending] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const eventName = validation?.eventName || fallbackEventName;

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsValidated(true);

    try {
      const response = await fetch('/api/rsvp/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: slug,
          code: code.trim().toUpperCase(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to validate this RSVP code.');
      }

      setValidation(payload);
      setStep(2);
    } catch (error) {
      setValidation(null);
      setErrorMsg(error instanceof Error ? error.message : 'Unable to validate this RSVP code.');
    } finally {
      setIsValidated(false);
    }
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rsvp/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: slug,
          code: code.trim().toUpperCase(),
          attending,
          notes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save your RSVP response.');
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to save your RSVP response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans selection:bg-[#facc15] selection:text-gray-900 overflow-x-hidden">
      <main className="flex-1 flex flex-col relative sm:p-6 lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fefbf0] via-[#f7f4e9] to-[#eeeadd] pointer-events-none -z-10" />

        {isSubmitted ? (
          <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 sm:mt-32 p-8 sm:p-16 bg-white shadow-2xl shadow-gray-200/50 rounded-2xl border border-white text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 flex items-center justify-center rounded-full mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              RSVP {attending ? 'Confirmed' : 'Recorded'}
            </h2>
            <p className="text-gray-500 font-medium text-[15px] max-w-md mx-auto leading-relaxed mb-8">
              Thank you, {validation?.guestName || 'Guest'}. Your response for {eventName} has been saved.
              {attending && validation?.email ? (
                <span className="block mt-4">
                  We have sent your QR ticket to <strong className="text-gray-900">{validation.email}</strong>.
                </span>
              ) : attending ? (
                <span className="block mt-4">Your coordinator can provide your QR ticket if needed.</span>
              ) : (
                <span className="block mt-4">We are sorry you won&apos;t be able to make it.</span>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-extrabold uppercase tracking-widest text-[11px] transition-all rounded-sm shadow-xl shadow-gray-900/20"
            >
              RETURN HOME
            </button>
          </div>
        ) : step === 1 ? (
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center py-12 lg:py-20 animate-in fade-in duration-500">
            <div className="text-center mb-10 md:mb-16 px-4">
              <h4 className="text-[10px] md:text-[11px] font-black text-[#d4a017] tracking-[0.3em] uppercase mb-4 md:mb-6">
                EXCLUSIVE ACCESS
              </h4>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                Welcome to <span className="text-[#d4a017]">{eventName}</span>
              </h1>
              <p className="text-gray-500 font-medium text-[14px] md:text-[16px]">
                Please enter your unique RSVP code to proceed.
              </p>
            </div>

            <form
              onSubmit={handleVerifyCode}
              className="w-full max-w-xl mx-auto bg-white p-8 md:p-12 lg:p-16 shadow-2xl shadow-gray-200/50 rounded-lg sm:rounded-2xl border border-white relative z-20"
            >
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
                disabled={isValidated}
                className="w-full bg-[#facc15] hover:bg-[#eab308] disabled:bg-[#f8dc7a] text-gray-900 font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] py-5 transition-all shadow-xl shadow-[#facc15]/20 flex items-center justify-center gap-3 rounded-sm group"
              >
                {isValidated ? 'VERIFYING...' : 'CONTINUE TO RSVP'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            <div className="mt-16 text-center text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase flex items-center justify-center gap-4 hidden sm:flex">
              <span className="w-12 h-px bg-gray-200"></span>
              MERRY STORY PRODUCTIONS
              <span className="w-12 h-px bg-gray-200"></span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRsvp} className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col pt-8 pb-16 animate-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-8 lg:mb-16 px-4">
              <div className="flex-1 text-center lg:text-left">
                <h4 className="text-[9px] md:text-[10px] font-black text-[#d4a017] tracking-[0.25em] uppercase mb-4">
                  EVENT INVITATION FOR {(validation?.guestName || 'Guest').toUpperCase()}
                </h4>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                  {eventName}
                </h1>
                <p className="text-gray-500 font-medium text-[14px] md:text-[15px] leading-relaxed max-w-md mx-auto lg:mx-0">
                  Confirm your attendance using your one-time RSVP code. Once submitted, the same code cannot be used again.
                </p>
              </div>
              <div className="flex-1 w-full max-w-md mx-auto relative group">
                <div className="absolute inset-0 bg-[#facc15] translate-x-4 translate-y-4 rounded-sm" />
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Event Setup"
                  className="relative z-10 w-full aspect-[4/5] object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-700 rounded-sm shadow-xl"
                />
              </div>
            </div>

            <div className="w-full bg-white p-6 sm:p-10 lg:p-12 shadow-2xl shadow-gray-200/50 rounded-lg sm:rounded-2xl border-t-4 border-t-[#d4a017] z-20 relative mx-4 sm:mx-0 w-[calc(100%-2rem)] sm:w-full self-center">
              {errorMsg && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-sm text-center">
                  <p className="text-red-500 text-[12px] font-bold tracking-wide">{errorMsg}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <button
                  type="button"
                  onClick={() => setAttending(true)}
                  className={`py-5 px-6 font-extrabold text-[12px] sm:text-[13px] uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${
                    attending
                      ? 'border-[#facc15] bg-[#facc15] text-gray-900 shadow-lg shadow-[#facc15]/20'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  I WILL ATTEND
                </button>

                <button
                  type="button"
                  onClick={() => setAttending(false)}
                  className={`py-5 px-6 font-extrabold text-[12px] sm:text-[13px] uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${
                    !attending
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  I CANNOT ATTEND
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                    RSVP NOTES
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add optional notes for the coordinator"
                    className="w-full text-[15px] font-medium text-gray-900 placeholder-gray-300 border border-gray-100 focus:border-[#facc15] p-4 focus:outline-none transition-colors bg-transparent rounded-xl resize-none"
                  />
                </div>
              </div>

              <div className="mt-12 flex flex-col items-center sm:items-end border-t border-gray-100 pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-12 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-900/20 rounded-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'SAVING...' : 'CONFIRM RSVP'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
