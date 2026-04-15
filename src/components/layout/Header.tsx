"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full fixed top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-2xl tracking-tighter">
              MERRY <span className="text-brand-yellow">STORY</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="#packages" className="text-gray-600 hover:text-brand-yellow transition-colors font-medium text-sm">Packages</Link>
            <Link href="#difference" className="text-gray-600 hover:text-brand-yellow transition-colors font-medium text-sm">About</Link>
            <Link href="#expertise" className="text-gray-600 hover:text-brand-yellow transition-colors font-medium text-sm">Services</Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-brand-yellow transition-colors font-medium text-sm">Reviews</Link>
          </nav>

          <div className="hidden md:flex">
            <Link href="#contact" className="bg-brand-yellow hover:bg-yellow-500 text-white px-6 py-2.5 rounded text-sm font-semibold transition-colors">
              Contact Us
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-brand-yellow focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
            <Link href="#packages" className="block px-3 py-2 text-gray-800 font-medium hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>Packages</Link>
            <Link href="#difference" className="block px-3 py-2 text-gray-800 font-medium hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link href="#expertise" className="block px-3 py-2 text-gray-800 font-medium hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>Services</Link>
            <Link href="#testimonials" className="block px-3 py-2 text-gray-800 font-medium hover:text-brand-yellow" onClick={() => setIsMenuOpen(false)}>Reviews</Link>
            <Link href="#contact" className="w-full mt-4 bg-brand-yellow hover:bg-yellow-500 text-white px-6 py-3 rounded text-center font-semibold" onClick={() => setIsMenuOpen(false)}>
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}