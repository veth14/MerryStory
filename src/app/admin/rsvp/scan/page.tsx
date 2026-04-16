'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';

export default function RsvpScannerPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = (result: any) => {
    if (isProcessing) return;
    
    try {
      // Result could be an array (v2.x) or string (v1.x)
      let rawValue = '';
      if (Array.isArray(result) && result.length > 0) {
        rawValue = result[0].rawValue;
      } else if (typeof result === 'string') {
        rawValue = result;
      } else if (result?.text) {
        rawValue = result.text;
      } else if (result?.rawValue) {
        rawValue = result.rawValue;
      }

      if (!rawValue) return;

      setIsProcessing(true);
      setErrorMsg('');

      // We expect the QR code to be a JSON string like:
      // { eventName, guestName, code, attendees }
      const payload = JSON.parse(rawValue);

      if (payload && payload.code) {
        setScannedData(payload);
        
        // Simulate a tiny networking delay to show the nice success UI
        setTimeout(() => {
          // Redirect the admin to the "live guest registry" view for this event.
          // Fallback to a default generic ID if the eventName isn't easily map-able 
          // (Right now, /admin/rsvp/[id] expects a slug-like string)
          const eventSlug = payload.eventName.toLowerCase().replace(/\s+/g, '-');
          
          // Pass the scanned code as a query param so the registry could highlight it
          router.push(`/admin/rsvp/${eventSlug}?scannedCode=${payload.code}`);
        }, 2000);
      } else {
        throw new Error("Invalid QR code format.");
      }

    } catch (error) {
      console.error('Scan Parse Error:', error);
      setErrorMsg('Unrecognized QR Code. Please scan a valid Merry Story ticket.');
      // Auto-clear error and let them try again in 2s
      setTimeout(() => {
        setIsProcessing(false);
        setErrorMsg('');
      }, 3000);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-2 flex flex-col items-center">
      {/* Breadcrumb / Back Navigation */}
      <div className="w-full mb-6">
        <Link href="/admin/rsvp" className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          BACK TO DASHBOARD
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2 text-center md:text-left">
          Ticket Scanner
        </h1>
        <p className="text-gray-500 text-[14px] font-medium leading-relaxed text-center md:text-left">
          Position the guest's QR code within the frame to authenticate their pass and mark their attendance.
        </p>
      </div>

      {scannedData ? (
        // SUCCESS STATE UI
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full mx-auto mb-6">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Guest Verified</h2>
          <div className="bg-gray-50 p-4 border border-gray-100 rounded-lg mt-6 mb-6">
             <p className="text-[10px] font-extrabold text-[#d4a017] uppercase tracking-widest mb-1">
               {scannedData.eventName}
             </p>
             <p className="text-[18px] font-bold text-gray-900">
               {scannedData.guestName}
             </p>
             <div className="flex items-center justify-center gap-4 mt-3">
               <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 font-mono text-[11px] font-bold rounded-md tracking-wider">
                 {scannedData.code}
               </span>
               <span className="text-[12px] font-bold text-gray-500">
                 {scannedData.attendees} Pax
               </span>
             </div>
          </div>
          <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            REDIRECTING TO LIVE REGISTRY...
          </p>
        </div>
      ) : (
        // SCANNER UI
        <div className="w-full max-w-sm relative">
           <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl aspect-square relative border-4 border-gray-900">
              <Scanner
                onScan={handleScan}
                onError={(err) => {
                  // Only log significant errors, ignore generic ones
                  if (err && typeof err === 'string' && !err.includes("No QR code found")) {
                    console.log('Scanner Error:', err);
                  }
                }}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { objectFit: 'cover' }
                }}
              />
              
              {/* Overlay graphics */}
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                 <div className="w-full h-full border-2 border-[#d4a017]/80 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#facc15] -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#facc15] translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#facc15] -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#facc15] translate-x-1 translate-y-1"></div>
                 </div>
              </div>
           </div>

           {errorMsg && (
             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center animate-in slide-in-from-bottom-2">
                <p className="text-red-500 text-[12px] font-bold tracking-wide">{errorMsg}</p>
             </div>
           )}

           <div className="mt-8 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-8">
                 Ensure the QR code is well-lit and fits entirely inside the golden target box.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
