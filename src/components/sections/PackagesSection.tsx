"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function PackagesSection() {
  const packages = [
    {
      title: "Elegant Wedding",
      price: "700,000",
      description: "Atmospheric curation for the day two souls become an eternal legacy.",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    },
    {
      title: "Birthday Celebration",
      price: "50,000",
      description: "Marking the milestones of life with unrivaled vibrance and joy.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
    },
    {
      title: "Graduation Events",
      price: "1,000,000",
      description: "Sophisticated galas celebrating academic triumphs and new beginnings.",
      image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop",
    },
    {
      title: "Trade Shows",
      price: "1,000,000",
      description: "Strategic brand experiences designed to ignite market desire.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <section id="packages" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-6">
          <div className="flex-1">
            <span className="text-brand-yellow font-bold tracking-widest uppercase text-xs mb-3 block">
              The Portfolio
            </span>
            <h2 className="text-4xl md:text-[3.25rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Premium Event <br className="hidden md:block" /> Packages
            </h2>
          </div>
          <div className="flex-1 flex justify-end items-end h-full pt-4 md:pt-14">
             <p className="text-gray-500 max-w-sm text-sm leading-relaxed text-left md:text-right">
                Exclusivity is our baseline. Each package is tailored to reflect your individual legacy.
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          {packages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -10 }}
              className={`bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 group ${index % 2 === 0 ? 'h-[500px]' : 'h-[460px]'}`}
            >
              <div className="relative h-3/5 overflow-hidden flex-shrink-0">
                <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute bottom-5 left-6 text-white">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300 font-semibold block mb-1">STARTING FROM</span>
                  <span className="font-bold text-2xl tracking-tight">₱{pkg.price}</span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{pkg.title}</h3>
                <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">{pkg.description}</p>
                <div className="mt-auto">
                    <button className="text-brand-yellow font-bold uppercase tracking-widest text-[10px] hover:text-yellow-600 flex items-center group-hover:underline">
                    Explore Details
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}