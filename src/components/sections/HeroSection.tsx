"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col space-y-8"
          >
            <span className="text-[#e2ab34] font-bold tracking-[0.2em] uppercase text-xs">
              Curating Excellence
            </span>
            <h1 className="text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-extrabold text-[#1a1a1a] leading-[1.05] tracking-tight">
              Your Story, <br/>
              <span className="text-[#e2ab34] font-light italic font-serif inline-block -mt-2 -mb-2">Spectacularly</span> <br/>
              Told.
            </h1>
            <p className="text-[17px] text-[#5e7789] max-w-[480px] leading-relaxed pr-8">
              Bespoke event management for those who demand the unrivaled. We transform visions into luminous realities through meticulous curation and editorial precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link href="#contact" className="bg-[#e2ab34] hover:bg-[#d09d29] text-white px-10 py-5 rounded-[4px] font-bold text-center transition-all shadow-[0_10px_30px_-10px_rgba(226,171,52,0.5)] text-[11px] tracking-[0.15em] uppercase">
                Begin the Journey
              </Link>
              <Link href="#packages" className="bg-white border border-gray-100 text-[#314a5d] hover:text-[#1c2e3c] hover:border-gray-200 px-10 py-5 rounded-[4px] font-bold text-center transition-all text-[11px] tracking-[0.15em] uppercase shadow-[0_5px_20px_-15px_rgba(0,0,0,0.1)]">
                View Portfolio
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[700px] w-full hidden lg:block"
          >
            <div className="absolute right-0 top-10 w-[85%] h-[85%] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-10 transform rotate-3">
              <img src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop" alt="Grand Event Setup" className="w-full h-full object-cover" />
            </div>
            <div className="absolute left-0 bottom-20 w-[60%] aspect-square rounded bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.15)] z-20 transform -rotate-6 transition-transform hover:rotate-[-2deg] duration-500">
               <img src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=400&auto=format&fit=crop" alt="Catering Detail" className="w-full h-full object-cover rounded-sm" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}