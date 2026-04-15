"use client";

import { motion } from "framer-motion";

export function TestimonialsSection() {
  const reviews = [
    {
      name: "Marcus Sterling",
      role: "CMO, VANTGARD CORP",
      text: "“Merry Story transformed our product launch into a cultural event. Their attention to detail is simply unparalleled in the industry.”",
    },
    {
       name: "Helena Thorne",
       role: "CLIENT",
       text: "“Our wedding was a dream manifested. Every single guest commented on the luminous atmosphere and perfect flow of the evening.”",
    },
    {
       name: "Dr. Arthur Vance",
       role: "UNIVERSITY DEAN",
       text: "“Professionalism at its finest. They handled a complex multi-day graduation gala with incredible grace and zero friction.”",
    }
  ];

  return (
    <section id="testimonials" className="py-28 bg-gray-50 overflow-hidden relative">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.6 }}
          >
            <span className="text-brand-yellow font-bold tracking-widest uppercase text-xs mb-2 block">
               THE EXPERIENCE
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
               Voices of Delight
            </h2>
          </motion.div>
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="hidden md:block w-16 h-[2px] bg-brand-yellow mb-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-start">
          {reviews.map((rev, idx) => (
            <motion.div
               key={idx}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6, delay: idx * 0.15 }}
               className={`bg-white p-8 rounded-lg shadow-lg border-t-[3px] border-t-brand-yellow flex flex-col relative h-full ${
                 idx === 1 ? 'md:mt-12' : ''
               }`}
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-1.5 pt-2">
                    {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-brand-yellow fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-yellow-100 font-serif text-6xl leading-none h-10 select-none pointer-events-none">
                    ”
                  </div>
               </div>

               <p className="text-gray-600 italic text-[15px] leading-relaxed mb-10 flex-grow">
                 {rev.text}
               </p>

               <div className="flex items-center gap-4 mt-auto">
                 <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${rev.name}`} alt={rev.name} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h4 className="font-bold text-[#1a1a1a] text-sm">{rev.name}</h4>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">{rev.role}</p>
                 </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}