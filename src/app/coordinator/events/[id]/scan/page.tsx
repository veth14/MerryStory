'use client';
import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, ScanLine, Loader2, UserCheck, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CoordinatorScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  const [scannedData, setScannedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = async (result: any) => {
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
          eventId: id,
          rawValue,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Invalid QR code format.');
      }

      setScannedData(payload);
      
      setTimeout(() => {
        setScannedData(null);
        setIsProcessing(false);
      }, 3000);

    } catch (error) {
      console.error('Scan Parse Error:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unrecognized QR format. Please scan a valid check-in ticket.');
      setTimeout(() => {
        setIsProcessing(false);
        setErrorMsg('');
      }, 3000);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full pb-12 mt-2 max-w-none text-[#1d1d1f]">
      {/* Breadcrumb / Back Navigation */}
      <button 
        onClick={() => router.push(`/coordinator/events/${id}?tab=rsvp`)} 
        className="inline-flex items-center gap-2 text-[11px] font-extrabold text-gray-400 hover:text-[#d4a017] uppercase tracking-widest transition-colors mb-4 group"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
        BACK TO EVENT
      </button>

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="max-w-3xl">
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Operations <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Authentication</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Ticket <span className="text-[#d4a017] italic pr-2">Scanner</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-lg leading-relaxed font-medium">
            Point your camera at a guest's unique QR code. The system will instantly authenticate their invitation and check them into the event.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl shrink-0">
          <ShieldCheck size={20} className="text-emerald-500" />
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Connection</p>
            <p className="text-sm font-bold text-gray-900">Secure & Encrypted</p>
          </div>
        </div>
      </div>

      {/* Split Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 items-start">
        
        {/* Left Col: Camera View */}
        <div className="lg:col-span-7 xl:col-span-8">
           <div className="relative bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] md:aspect-video lg:aspect-[16/10] ring-1 ring-gray-900/5">
             
             {!scannedData ? (
                <>
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
                  
                  {/* Floating targeting reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 sm:w-72 sm:h-72 border-[3px] border-white/20 rounded-3xl relative transition-all duration-300">
                      {/* Corner accents */}
                      <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[4px] border-l-[4px] border-[#d4a017] rounded-tl-3xl"></div>
                      <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[4px] border-r-[4px] border-[#d4a017] rounded-tr-3xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[4px] border-l-[4px] border-[#d4a017] rounded-bl-3xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[4px] border-r-[4px] border-[#d4a017] rounded-br-3xl"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4a017] opacity-50 shadow-[0_0_20px_#d4a017] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>

                  {/* Camera overlay UI */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                     <span className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-extrabold tracking-widest uppercase">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       Camera Active
                     </span>
                     {isProcessing && (
                       <span className="flex items-center gap-2 bg-[#d4a017]/90 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-extrabold tracking-widest uppercase shadow-lg shadow-[#d4a017]/20">
                         <Loader2 size={12} className="animate-spin" /> Analyzing
                       </span>
                     )}
                  </div>
                </>
             ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20 animate-in zoom-in duration-300">
                  <div className="text-center p-8">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white mb-6 animate-bounce shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Access Granted</h2>
                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                       <Loader2 size={16} className="animate-spin" /> Ready for next ticket shortly...
                    </p>
                  </div>
                </div>
             )}

           </div>

           {/* Mobile error msg (shows below camera on small screens) */}
           {errorMsg && (
             <div className="mt-4 lg:hidden animate-in slide-in-from-top-2 flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
               <AlertCircle size={20} className="shrink-0" />
               <p className="text-sm font-bold">{errorMsg}</p>
             </div>
           )}
        </div>

        {/* Right Col: Info & Scan Results */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
           
           {scannedData ? (
             <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-right-8 duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Valid Credential</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 pb-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 leading-none">
                      Verified
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-100">
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Guest Name</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{scannedData.guestName || 'Unknown Guest'}</p>
                  </div>
                  
                  <div className="pb-6 border-b border-gray-100">
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Event Assignment</p>
                    <p className="text-lg font-bold text-gray-900">{scannedData.eventName || 'Unassigned Event'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Party Size</p>
                      <p className="text-xl font-black text-[#d4a017]">1 PAX</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Pass Code</p>
                      <p className="text-sm font-extrabold font-mono text-gray-600 pt-1">{scannedData.code}</p>
                    </div>
                  </div>
                </div>
             </div>
           ) : (
             <div className="bg-[#fafafa] rounded-[2rem] p-8 sm:p-10 border border-gray-100 h-full flex flex-col justify-center">
                <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 mb-8 mx-auto xl:mx-0">
                  <ScanLine size={32} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-4 text-center xl:text-left">Awaiting Scan</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed text-center xl:text-left mb-8">
                  Hover the camera over the guest's QR code. Ensure adequate lighting and keep the code completely within the gold markers.
                </p>

                {errorMsg && (
                  <div className="hidden lg:flex animate-in fade-in items-start gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold tracking-tight">Invalid Scan</p>
                      <p className="text-xs font-medium mt-1 text-red-500/80">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                  <ShieldCheck size={14} /> Scanner operates entirely on-device
                </div>
             </div>
           )}

        </div>
      </div>
      
      {/* Custom keyframes for scanning line */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
