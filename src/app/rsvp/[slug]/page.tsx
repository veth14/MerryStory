'use client';

import React, { useState, use } from 'react';

type ValidationResponse = {
  guestId: string;
  guestName: string;
  email: string;
  tier: string;
  status: string;
  eventName: string;
  eventType: string;
  location: string;
  coverImageUrl: string;
  date: string | null;
};

const formatEventDate = (dateValue?: string | null) => {
  if (!dateValue) return 'Date to be announced';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatEventTime = (dateValue?: string | null) => {
  if (!dateValue) return 'Time to be announced';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'Time to be announced';
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Two-line hero: navy line(s) except last word, last word gold (matches RSVP invite layout). */
const splitEventTitle = (eventName: string): { leading: string; last: string | null } => {
  const words = eventName.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { leading: eventName.trim(), last: null };
  }
  return {
    leading: words.slice(0, -1).join(' '),
    last: words[words.length - 1] ?? null,
  };
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

  const titleParts = splitEventTitle(eventName);

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#0F172A] selection:bg-[#C5A028]/30 selection:text-[#0F172A]">
      <main className="relative min-h-screen">
        {isSubmitted ? (
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
            <div className="w-full rounded-2xl border border-[rgba(197,160,40,0.2)] bg-white px-8 py-12 text-center shadow-[0_24px_64px_-12px_rgba(15,23,42,0.1)] sm:px-14">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
                RSVP {attending ? 'Confirmed' : 'Recorded'}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium leading-8 text-[#64748B]">
                Thank you, {validation?.guestName || 'Guest'}. Your response for {eventName} has been saved.
                {attending && validation?.email ? (
                  <span className="mt-4 block">
                    Your QR ticket has been sent to <strong className="text-[#0F172A]">{validation.email}</strong>.
                  </span>
                ) : attending ? (
                  <span className="mt-4 block">Your coordinator can provide your QR ticket if needed.</span>
                ) : (
                  <span className="mt-4 block">We are sorry you won&apos;t be able to make it.</span>
                )}
              </p>
              <p className="mx-auto mt-6 max-w-xl text-[13px] font-medium leading-relaxed text-[#94a3b8]">
                You can use your RSVP code to return and update your response at any time before check-in. Once your QR code is scanned at the event, your RSVP will be locked.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-10 inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-8 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#0f172a]/90"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h4 className="mb-5 text-[10px] font-black uppercase tracking-[0.34em] text-[#C5A028]">
                Exclusive Access
              </h4>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-[#0F172A] sm:text-6xl">
                Welcome to <span className="text-[#C5A028]">{eventName}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-[15px] font-medium leading-8 text-[#64748B]">
                Please enter your unique RSVP code to proceed. You can update your response at any time until check-in.
              </p>
            </div>

            <form
              onSubmit={handleVerifyCode}
              className="mx-auto mt-12 w-full max-w-2xl rounded-2xl border border-[rgba(197,160,40,0.2)] bg-white px-8 py-10 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.08)] sm:px-12 sm:py-14"
            >
              {errorMsg && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center">
                  <p className="text-[12px] font-bold tracking-wide text-red-500">{errorMsg}</p>
                </div>
              )}
              <div className="mb-8 text-center">
                <input
                  required
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="UNIQUE EVENT CODE"
                  className="w-full border-b-2 border-gray-100 bg-transparent py-4 text-center text-[14px] font-extrabold uppercase tracking-[0.22em] text-[#0F172A] placeholder:text-gray-300 focus:border-[#C5A028] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isValidated}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#C5A028] px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_40px_-8px_rgba(197,160,40,0.45)] transition-colors hover:bg-[#b89120] disabled:bg-[#C5A028]/50"
              >
                {isValidated ? 'Verifying...' : 'Continue To RSVP'}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-12 px-5 pb-20 pt-10 sm:px-8 lg:flex-row lg:items-start lg:gap-14 lg:pt-14 xl:px-10">
            <div className="w-full shrink-0 text-left lg:max-w-[42%]">
              <div className="mb-8 flex max-w-xl items-center gap-3">
                <span className="h-px w-8 shrink-0 bg-[#C5A028]" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#C5A028]">
                  Event Invitation For {validation?.guestName?.toUpperCase() || 'Guest'}
                </p>
              </div>

              <div className="max-w-xl">
                {titleParts.last ? (
                  <>
                    <span className="block text-[2.625rem] font-black leading-[1.06] tracking-[-0.02em] text-[#0F172A] sm:text-[3.375rem] sm:leading-[1.04]">
                      {titleParts.leading}
                    </span>
                    <span className="mt-1 block text-[2.625rem] font-black leading-[1.06] tracking-[-0.02em] text-[#C5A028] sm:mt-2 sm:text-[3.375rem]">
                      {titleParts.last}
                    </span>
                  </>
                ) : (
                  <span className="block text-[2.625rem] font-black leading-[1.06] tracking-[-0.02em] text-[#0F172A] sm:text-[3.375rem]">
                    {titleParts.leading}
                  </span>
                )}
              </div>

              <p className="mt-7 max-w-lg text-[16px] font-medium leading-[1.75] text-[#64748B]">
                You&apos;re invited to join us for this special gathering. Confirm your attendance using your one-time RSVP code. Once
                submitted, the same code cannot be used again.
              </p>

              <div className="mt-9 max-w-md space-y-3">
                <div className="flex items-center gap-4 rounded-2xl border border-[rgba(197,160,40,0.32)] bg-white px-5 py-[18px] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)]">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(197,160,40,0.14)] text-[#C5A028]"
                    aria-hidden
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#64748B]">Date</p>
                    <p className="mt-1 text-[17px] font-bold text-[#0F172A]">{formatEventDate(validation?.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-[rgba(197,160,40,0.32)] bg-white px-5 py-[18px] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)]">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(197,160,40,0.14)] text-[#C5A028]"
                    aria-hidden
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#64748B]">Time</p>
                    <p className="mt-1 text-[17px] font-bold text-[#0F172A]">{formatEventTime(validation?.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-[rgba(197,160,40,0.32)] bg-white px-5 py-[18px] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)]">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(197,160,40,0.14)] text-[#C5A028]"
                    aria-hidden
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#64748B]">Venue</p>
                    <p className="mt-1 text-[17px] font-bold text-[#0F172A]">{validation?.location || 'Venue to be announced'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-none">
              <form
                onSubmit={handleSubmitRsvp}
                className="rounded-2xl border border-[rgba(197,160,40,0.18)] bg-white px-8 py-9 shadow-[0_28px_64px_-20px_rgba(15,23,42,0.14)] sm:px-10 sm:py-10"
              >
                <header className="text-center">
                  <h2 className="text-[1.875rem] font-black tracking-tight text-[#0F172A]">Confirm Your Attendance</h2>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#64748B]">
                    Let us know if you&apos;ll be joining us
                  </p>
                </header>

                {errorMsg ? (
                  <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
                    <p className="text-[12px] font-bold tracking-wide text-red-600">{errorMsg}</p>
                  </div>
                ) : null}

                <div className="mt-10 rounded-[14px] bg-[#EFEBE3] p-1.5">
                  <div className="relative grid grid-cols-2 items-stretch">
                    <div
                      className={`pointer-events-none absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl border border-neutral-100/90 bg-white shadow-[0_6px_20px_-4px_rgba(15,23,42,0.12)] transition-[left] duration-300 ease-out ${
                        attending ? 'left-1.5' : 'left-[calc(50%+3px)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setAttending(true)}
                      className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-4 py-[18px] text-[14px] font-bold transition-colors ${
                        attending ? 'text-[#0F172A]' : 'text-[#64748B]'
                      }`}
                    >
                      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      I Will Attend
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttending(false)}
                      className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-4 py-[18px] text-[14px] font-bold transition-colors ${
                        attending ? 'text-[#64748B]' : 'text-[#0F172A]'
                      }`}
                    >
                      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      I Cannot Attend
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <label htmlFor="rsvp-note" className="block text-[10px] font-bold tracking-[0.2em] text-[#64748B]">
                    <span className="uppercase">RSVP note </span>
                    <span className="normal-case lowercase tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    id="rsvp-note"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Add optional notes for the coordinator..."
                    className="mt-3 w-full rounded-2xl border border-[rgba(197,160,40,0.15)] bg-[#F9F7F2] px-5 py-[18px] text-[15px] font-medium leading-relaxed text-[#0F172A] outline-none transition-[border-color,box-shadow] placeholder:text-[#94a3b8] focus:border-[#C5A028]/50 focus:ring-2 focus:ring-[#C5A028]/20 resize-none"
                  />
                </div>

                <div className="mt-10 flex flex-col gap-6 border-t border-[#E2E8F0] pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
                    <svg className="h-4 w-4 shrink-0 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 016 0v2H9z" />
                    </svg>
                    Your response is private & secure
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-xl bg-[#0F172A] px-10 py-[18px] text-[11px] font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_-12px_rgba(15,23,42,0.45)] transition-colors hover:bg-[#0f172a]/92 disabled:bg-slate-400 sm:w-auto"
                  >
                    {isSubmitting ? 'Saving…' : 'Confirm RSVP'}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}