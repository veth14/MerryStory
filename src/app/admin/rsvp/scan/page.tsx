'use client';
import React, { useState } from 'react';
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

      const payload = JSON.parse(rawValue);

      if (payload && payload.code) {
        setScannedData(payload);
        
        setTimeout(() => {
          const eventSlug = payload.eventName?.toLowerCase().replace(/\s+/g, '-') || 'default-event';
          router.push(`/admin/rsvp/${eventSlug}?scannedCode=${payload.code}`);
        }, 2000);
      } else {
        throw new Error("Invalid QR code format.");
      }

    } catch (error) {
      console.error('Scan Parse Error:', error);
      setErrorMsg('Unrecognized QR Code. Please scan a valid RSVP ticket.');
      setTimeout(() => {
        setIsProcessing(false);
        setErrorMsg('');
      }, 3000);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header aligned with other admin pages */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Ticket Scanner</h1>
          <p className="mt-2 text-sm text-gray-700">
            Scan guest QR codes to instantly authenticate and check them into the event registry.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/rsvp"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto transition-colors"
          >
            Back to RSVP
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        <div className="max-w-2xl mx-auto overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">
              Event QR Scanner
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 text-center">
              Ensure the code is well-lit and clearly visible in the camera frame.
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-10 flex justify-center bg-gray-50 relative">
            {!scannedData ? (
              <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden shadow-inner border-2 border-dashed border-gray-300 bg-black">
                <Scanner
                  onScan={handleScan}
                  onError={(err) => {
                    if (err && typeof err === 'string' && !err.includes("No QR code found")) {
                      console.log('Scanner Error:', err);
                    }
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { objectFit: 'cover' }
                  }}
                />
                
                {/* Minimal crosshair overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full text-center animate-in zoom-in duration-300 py-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Verified!</h2>
                
                <div className="bg-white rounded-lg p-6 my-6 border border-gray-200 shadow-sm mx-auto max-w-sm">
                  <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                    {scannedData.eventName || 'Event'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mb-4">
                    {scannedData.guestName || 'Guest'}
                  </p>
                  
                  <div className="flex justify-center flex-wrap gap-4">
                    <span className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-200">
                      <span className="text-gray-400 mr-2">Code:</span> {scannedData.code}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {scannedData.attendees || 1} Pax
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-500">
                  <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirecting to live registry...
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
            {errorMsg ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
              </div>
            ) : (
              <p className="text-xs text-center text-gray-500">
                Camera permissions are required. The scanner operates entirely on your device.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}