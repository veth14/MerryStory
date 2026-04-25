"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const collections = [
  {
    id: 1,
    title: 'Weddings',
    category: 'CATEGORY 1',
    investment: 'PHP 700,000',
    description: 'For the visionaries of love. We craft cinematic wedding experiences that blend heritage with modern luxury, ensuring every detail reflects your unique narrative.',
    image: 'https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/packagesSection/wedding.jpg',
    link: '/collections/weddings',
  },
  {
    id: 2,
    title: 'Corporate',
    category: 'CATEGORY 2',
    investment: 'PHP 1,000,000',
    description: 'Elevating corporate identity through high-impact production. From award ceremonies to milestone anniversaries, we deliver prestige and precision.',
    image: 'https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/packagesSection/corporate.jpg',
    link: '/collections/corporate',
  },
  {
    id: 3,
    title: 'Trade Shows',
    category: 'CATEGORY 3',
    investment: 'PHP 150,000',
    description: 'Command attention on the exhibition floor. We design and build immersive, high-traffic trade show experiences that amplify brand awareness and drive engagement.',
    image: 'https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/packagesSection/tradeshow.jpg',
    link: '/collections/trade-shows',
  },
  {
    id: 4,
    title: 'Birthdays',
    category: 'CATEGORY 4',
    investment: 'PHP 50,000',
    description: 'Cherishing the milestones that matter. We create bespoke atmospheres for intimate gatherings and grand soirees alike, focused on the art of celebration.',
    image: 'https://ppkvnopzbzkyefivffvc.supabase.co/storage/v1/object/public/images/packagesSection/birthday.jpg',
    link: '/collections/birthdays',
  },
];

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] text-gray-900 pt-10 pb-24 overflow-hidden">
      {/* Header Section */}
      <section className="px-4 sm:px-6 lg:px-10 2xl:px-16 max-w-screen-2xl mx-auto mb-20 md:mb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="text-brand-yellow font-bold tracking-[0.3em] uppercase text-[10px] mb-6 block">
            Curated Excellence
          </span>
          <h1 className="text-5xl md:text-[5.5rem] font-extrabold text-gray-900 leading-[0.9] tracking-tighter mb-8">
            <span className="block mb-1">Our</span>
            <span className="block text-brand-yellow font-bold mb-1">Signature</span>
            <span className="block text-gray-900">Collections</span>
          </h1>
          <p className="text-gray-500 max-w-xl leading-relaxed text-sm">
            A cinematic approach to ethereal design and flawless production. 
            We craft sensory atmospheres that linger in memory long after the lights dim.
          </p>
        </motion.div>
      </section>

      {/* Section 1: Bespoke Weddings */}
      <section className="px-4 sm:px-6 lg:px-10 2xl:px-16 max-w-screen-2xl mx-auto mb-32 md:mb-48 relative">
        <motion.div 
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="relative flex flex-col md:flex-row items-center"
        >
          {/* Main Image */}
          <div className="w-full md:w-[70%] relative aspect-[4/3] lg:aspect-[16/10] shadow-2xl overflow-hidden group">
            <Image src={collections[0].image} alt="Bespoke Weddings" fill className="object-cover group-hover:scale-105 transition-transform duration-[2s]" sizes="(max-width: 768px) 100vw, 70vw" priority unoptimized />
          </div>
          
          {/* Overlapping Text Card */}
          <div className="w-full md:w-[40%] md:-ml-[10%] mt-[-10%] md:mt-0 relative z-10 bg-white p-10 md:p-16 shadow-2xl border-l-[8px] border-brand-yellow mx-4 md:mx-0">
             <span className="text-brand-yellow font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">
                {collections[0].category}
             </span>
             <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                {collections[0].title}
             </h2>
             <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {collections[0].description}
             </p>
             <Link href={collections[0].link} className="bg-gray-900 hover:bg-brand-yellow text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors inline-block text-center w-full sm:w-auto">
                Explore Details
             </Link>
          </div>
        </motion.div>
      </section>

      {/* Section 2: Corporate Galas */}
      <section className="bg-gray-50 py-24 md:py-32 mb-32 md:mb-48">
        <div className="px-4 sm:px-6 lg:px-10 2xl:px-16 max-w-screen-2xl mx-auto">
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8 }}
             className="relative flex flex-col md:flex-row-reverse items-center"
           >
              {/* Main Image */}
              <div className="w-full md:w-[70%] relative aspect-[4/3] lg:aspect-[16/10] shadow-2xl overflow-hidden group">
                  <Image src={collections[1].image} alt="Corporate Galas" fill className="object-cover group-hover:scale-105 transition-transform duration-[2s]" sizes="(max-width: 768px) 100vw, 70vw" unoptimized />
              </div>

              {/* Overlapping Text Card */}
              <div className="w-full md:w-[40%] md:-mr-[10%] mt-[-10%] md:mt-0 relative z-10 bg-white p-10 md:p-16 shadow-2xl border-r-[8px] border-brand-yellow mx-4 md:mx-0">
                 <span className="text-brand-yellow font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">
                    {collections[1].category}
                 </span>
                 <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                    {collections[1].title}
                 </h2>
                 <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {collections[1].description}
                 </p>
                 <Link href={collections[1].link} className="bg-gray-900 hover:bg-brand-yellow text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors inline-block text-center w-full sm:w-auto">
                    Explore Details
                 </Link>
              </div>
           </motion.div>
        </div>
      </section>

      {/* Section 3: Trade Shows */}
      <section className="px-4 sm:px-6 lg:px-10 2xl:px-16 max-w-screen-2xl mx-auto mb-32 md:mb-48 relative">
        <motion.div 
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="relative flex flex-col md:flex-row items-center"
        >
          {/* Main Image */}
          <div className="w-full md:w-[70%] relative aspect-[4/3] lg:aspect-[16/10] shadow-2xl overflow-hidden group">
            <Image src={collections[2].image} alt="Trade Shows" fill className="object-cover group-hover:scale-105 transition-transform duration-[2s]" sizes="(max-width: 768px) 100vw, 70vw" unoptimized />
          </div>
          
          {/* Overlapping Text Card */}
          <div className="w-full md:w-[40%] md:-ml-[10%] mt-[-10%] md:mt-0 relative z-10 bg-white p-10 md:p-16 shadow-2xl border-l-[8px] border-brand-yellow mx-4 md:mx-0">
             <span className="text-brand-yellow font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">
                {collections[2].category}
             </span>
             <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                {collections[2].title}
             </h2>
             <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {collections[2].description}
             </p>
             <Link href={collections[2].link} className="bg-gray-900 hover:bg-brand-yellow text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors inline-block text-center w-full sm:w-auto">
                Explore Details
             </Link>
          </div>
        </motion.div>
      </section>

      {/* Section 4: Birthday Celebrations */}
      <section className="bg-gray-50 py-24 md:py-32 mb-32 md:mb-48">
        <div className="px-4 sm:px-6 lg:px-10 2xl:px-16 max-w-screen-2xl mx-auto">
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8 }}
             className="relative flex flex-col md:flex-row-reverse items-center"
           >
              {/* Main Image */}
              <div className="w-full md:w-[70%] relative aspect-[4/3] lg:aspect-[16/10] shadow-2xl overflow-hidden group">
                  <Image src={collections[3].image} alt="Birthday Celebrations" fill className="object-cover group-hover:scale-105 transition-transform duration-[2s]" sizes="(max-width: 768px) 100vw, 70vw" unoptimized />
              </div>

              {/* Overlapping Text Card */}
              <div className="w-full md:w-[40%] md:-mr-[10%] mt-[-10%] md:mt-0 relative z-10 bg-white p-10 md:p-16 shadow-2xl border-r-[8px] border-brand-yellow mx-4 md:mx-0">
                 <span className="text-brand-yellow font-bold tracking-[0.3em] uppercase text-[10px] mb-4 block">
                    {collections[3].category}
                 </span>
                 <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                    {collections[3].title}
                 </h2>
                 <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {collections[3].description}
                 </p>
                 <Link href={collections[3].link} className="bg-gray-900 hover:bg-brand-yellow text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors inline-block text-center w-full sm:w-auto">
                    Explore Details
                 </Link>
              </div>
           </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="bg-gray-50 pt-24 pb-44 text-center flex flex-col items-center border-t border-b border-gray-200 px-6 mt-16 mb-24">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="max-w-3xl w-full"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-8 flex flex-col md:flex-row justify-center items-center gap-x-3 gap-y-1">    
            <span>Ready to curate your</span>
            <span className="font-light italic text-brand-yellow block">next story?</span>
          </h2>
          <div className="h-px w-24 bg-brand-yellow/60 mx-auto mb-12" />
          <div className="flex justify-center mt-6">
             <Link
               href="/contact"
               className="bg-brand-yellow hover:bg-yellow-600 text-white px-12 py-5 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto text-center"
             >
               Book A Consultation
             </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
