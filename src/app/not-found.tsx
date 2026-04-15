"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[75vh] bg-[#FDFDFD] flex flex-col items-center justify-center text-gray-900 px-6 relative overflow-hidden">
      {/* Background elegant accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl -z-10" />

      {/* Giant Background Number */}
      <div className="text-[12rem] md:text-[18rem] font-bold tracking-tighter text-gray-100 select-none leading-none mb-12">
        404
      </div>
      
      {/* Foreground Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center mt-12 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-2xl">
          Page Not Found
        </h2>
        <p className="text-gray-500 text-[11px] md:text-xs tracking-[0.2em] uppercase mb-10 text-center max-w-md bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          The story you are looking for has been misplaced or does not exist.
        </p>
        
        <Link 
          href="/"
          className="bg-brand-yellow hover:bg-yellow-500 text-black px-10 py-5 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 overflow-hidden group relative"
        >
          <span className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 will-change-transform" />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Return to Homepage
        </Link>
      </div>
    </main>
  );
}
