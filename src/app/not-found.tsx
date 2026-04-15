"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">404</h1>
      <p className="text-gray-400 text-sm md:text-base tracking-widest uppercase mb-10 text-center">
        This page could not be found.
      </p>
      <Link 
        href="/"
        className="bg-brand-yellow hover:bg-yellow-500 text-black px-10 py-4 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300"
      >
        Return Home
      </Link>
    </main>
  );
}
