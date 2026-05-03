'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  ArrowRight,
  AlertCircle,
  ScanLine,
  Loader2,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

type CheckInPayload = {
  guestName?: string;
  eventName?: string;
  code?: string;
};

function AdminScanInner() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';
  const { user } = useAuth();

  const [scannedData, setScannedData] = useState<CheckInPayload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const backHref = eventId ? `/admin/rsvp/${eventId}` : '/admin/events';

  const handleScan = async (result: unknown) => {
    if (isProcessing || !eventId) return;

    try {
      let rawValue = '';
      if (Array.isArray(result) && result.length > 0 && typeof (result as { rawValue?: string }[])[0]?.rawValue === 'string') {
        rawValue = (result as { rawValue: string }[])[0].rawValue;
      } else if (typeof result === 'string') {
        rawValue = result;
      } else if (result && typeof result === 'object') {
        const r = result as { text?: string; rawValue?: string };
        if (r.text) rawValue = r.text;
        else if (r.rawValue) rawValue = r.rawValue;
      }

      if (!rawValue) return;

      setIsProcessing(true);
      setErrorMsg('');

      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Missing or invalid authorization token.');
      }

      const response = await fetch('/api/rsvp/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId,
          rawValue,
        }),
      });

      const payload = (await response.json()) as CheckInPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Invalid QR code format.');
      }

      setScannedData(payload);

      setTimeout(() => {
        setScannedData(null);
        setIsProcessing(false);
      }, 3000);
    } catch (error) {
      console.error('Scan error:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unrecognized QR format. Please scan a valid check-in ticket.');
      setTimeout(() => {
        setIsProcessing(false);
        setErrorMsg('');
      }, 3000);
    }
  };

  return (
    <div className="animate-in fade-in mt-2 w-full duration-500 px-4 pb-12 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="group mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-900"
      >
        <ChevronLeft size={14} strokeWidth={3} className="transition-transform group-hover:-translate-x-1" />
        Back to Registry
      </Link>

      {!eventId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-950">
          Open the scanner from an event&apos;s Guest Registry so we know which event to check guests into ({' '}
          <Link href="/admin/events" className="font-bold underline">
            Events
          </Link>
          ).
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa]">
                Invitations <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Authentication</span>
              </p>
              <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f]">
                Ticket <span className="pr-2 italic text-[#eebf43]">Scanner</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed text-[#71717a]">
                Point your camera at a guest&apos;s unique QR code. The system will authenticate their invitation and update the live registry check-in status.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Connection</p>
                <p className="text-sm font-bold text-gray-900">Secure & Encrypted</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-black shadow-2xl ring-1 ring-gray-900/5 md:aspect-video lg:aspect-[16/10]">
                {!scannedData ? (
                  <>
                    <Scanner
                      onScan={handleScan}
                      onError={(err: unknown) => {
                        const msg = typeof err === 'string' ? err : '';
                        if (msg && !msg.includes('No QR code found')) console.log('Scanner Error:', msg);
                      }}
                      styles={{
                        container: { width: '100%', height: '100%' },
                        video: { objectFit: 'cover' },
                      }}
                    />

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="relative h-56 w-56 rounded-3xl border-[3px] border-white/20 sm:h-72 sm:w-72">
                        <div className="absolute -left-1 -top-1 h-10 w-10 rounded-tl-3xl border-l-[4px] border-t-[4px] border-[#eebf43]" />
                        <div className="absolute -right-1 -top-1 h-10 w-10 rounded-tr-3xl border-r-[4px] border-t-[4px] border-[#eebf43]" />
                        <div className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-3xl border-b-[4px] border-l-[4px] border-[#eebf43]" />
                        <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-3xl border-b-[4px] border-r-[4px] border-[#eebf43]" />

                        <div className="animate-[scan_2s_ease-in-out_infinite] absolute left-0 right-0 top-0 h-0.5 bg-[#eebf43] opacity-50 shadow-[0_0_20px_#eebf43]" />
                      </div>
                    </div>

                    <div className="pointer-events-none absolute left-6 right-6 top-6 z-10 flex items-center justify-between">
                      <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        Camera Active
                      </span>
                      {isProcessing && (
                        <span className="flex items-center gap-2 rounded-full bg-[#eebf43]/90 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-lg shadow-[#eebf43]/20 backdrop-blur-md">
                          <Loader2 size={12} className="animate-spin" /> Analyzing
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 z-20 flex animate-in zoom-in duration-300 items-center justify-center bg-gray-900">
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                      </div>
                      <h2 className="mb-3 text-3xl font-black tracking-tight text-white">Access Granted</h2>
                      <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
                        <Loader2 size={16} className="animate-spin" /> Ready for next ticket shortly...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg ? (
                <div className="mt-4 flex animate-in slide-in-from-top-2 items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 lg:hidden">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-bold">{errorMsg}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
              {scannedData ? (
                <div className="animate-in slide-in-from-right-8 relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] duration-500 sm:p-10">
                  <div className="absolute left-0 top-0 h-2 w-full bg-emerald-500" />
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h3 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Valid Credential</h3>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 pb-1.5 text-[10px] font-black uppercase leading-none tracking-widest text-emerald-700">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-6">
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Guest Name</p>
                      <p className="text-2xl font-black tracking-tight text-gray-900">{scannedData.guestName || 'Unknown Guest'}</p>
                    </div>
                    <div className="border-b border-gray-100 pb-6">
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Event Assignment</p>
                      <p className="text-lg font-bold text-gray-900">{scannedData.eventName || 'Unassigned Event'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Pass Code</p>
                      <p className="pt-1 font-mono text-sm font-extrabold text-gray-600">{scannedData.code}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-center rounded-[2rem] border border-gray-100 bg-[#fafafa] p-8 sm:p-10">
                  <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-200 bg-white text-gray-400 shadow-sm xl:mx-0">
                    <ScanLine size={32} />
                  </div>
                  <h3 className="mb-4 text-center text-xl font-black text-gray-900 xl:text-left">Awaiting Scan</h3>
                  <p className="mb-8 text-center text-sm font-medium leading-relaxed text-gray-500 xl:text-left">
                    Keep the QR code within frame with good lighting until you hear confirmation.
                  </p>
                  {errorMsg ? (
                    <div className="animate-in fade-in hidden items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 lg:flex">
                      <AlertCircle size={20} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold tracking-tight">Invalid Scan</p>
                        <p className="mt-1 text-xs font-medium text-red-500/80">{errorMsg}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-center gap-2 pt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400 xl:justify-start">
                    <ShieldCheck size={14} /> Scanner verifies against this event registry
                  </div>
                </div>
              )}
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `,
            }}
          />
        </>
      )}
    </div>
  );
}

export default function AdminRsvpScannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading scanner…</div>}>
      <AdminScanInner />
    </Suspense>
  );
}
