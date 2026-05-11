import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="font-bold text-2xl tracking-tighter text-white block mb-4">
            MERRY <span className="text-brand-yellow">STORY</span>
          </Link>
          <p className="text-gray-400 max-w-sm mb-6 text-sm">
            Your story, spectacularly told. Creating unforgettable event experiences through passion and meticulous attention to detail.
          </p>
          <div className="flex space-x-4">
            <a href="https://www.facebook.com/MerryStoryProductions" className="text-gray-400 hover:text-brand-yellow transition-colors"><Facebook size={20} /></a>
            <a href="https://www.instagram.com/merrystory/" className="text-gray-400 hover:text-brand-yellow transition-colors"><Instagram size={20} /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wider text-white uppercase mb-4">Quick Links</h4>
          <ul className="space-y-3">
            <li><Link href="/#packages" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Collections</Link></li>
            <li><Link href="/#difference" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">About Us</Link></li>
            <li><Link href="/#expertise" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Services</Link></li>
            <li><Link href="/#testimonials" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Reviews</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wider text-white uppercase mb-4">Legal</h4>
          <ul className="space-y-3">
            <li><Link href="/privacy-policy" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms-of-service" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Terms of Service</Link></li>
            <li><Link href="/refund-policy" className="text-gray-400 hover:text-brand-yellow text-sm transition-colors">Refund & Cancellation Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Merry Story Productions. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Made for unforgettable moments.</p>
      </div>
    </footer>
  );
}