"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white min-h-[90vh] flex items-center">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col space-y-8"
          >
            <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-xs">
              Curating Excellence
            </span>
            <h1 className="text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-extrabold text-gray-900 leading-[1.05] tracking-tight">
              Your Story, <br/>
              <span className="text-brand-yellow font-light italic font-serif inline-block -mt-2 -mb-2">Spectacularly</span> <br/>
              Told.
            </h1>
            <p className="text-[17px] text-gray-600 max-w-xl leading-relaxed">
              Bespoke event management for those who demand the unrivaled. We transform visions into luminous realities through meticulous curation and editorial precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link href="#contact" className="bg-brand-yellow hover:bg-yellow-500 text-white px-10 py-5 rounded-[4px] font-bold text-center transition-all shadow-lg text-[11px] tracking-[0.15em] uppercase">
                Begin the Journey
              </Link>
              <Link href="#packages" className="bg-white border border-gray-100 text-slate-700 hover:text-slate-900 hover:border-gray-200 px-10 py-5 rounded-[4px] font-bold text-center transition-all text-[11px] tracking-[0.15em] uppercase shadow-sm">
                View Portfolio
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[420px] sm:h-[520px] lg:h-[700px] w-full"
          >
            <div className="absolute right-0 top-0 w-[85%] h-[85%] rounded-xl overflow-hidden shadow-2xl z-10 transform rotate-2">
              <img src="https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/heroSection/heroBig.jpg" alt="Grand Event Setup" className="w-full h-full object-cover" />
            </div>
            <div className="absolute left-0 bottom-0 w-[62%] sm:w-[55%] aspect-square rounded bg-white p-4 shadow-xl z-20 transform -rotate-6 transition-transform hover:rotate-[-2deg] duration-500">
               <img src="https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/heroSection/heroSmall.jpg" alt="Catering Detail" className="w-full h-full object-cover rounded-sm" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}