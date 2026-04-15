"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star, Target } from "lucide-react";

export function DifferenceSection() {
  const points = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-brand-yellow" />,
      title: "Licensed & Insured",
      desc: "Merry Story Event Planners holds all professional certifications and liability protection for your peace of mind."
    },
    {
      icon: <Target className="w-6 h-6 text-brand-yellow" />,
      title: "Creative Visionaries",
      desc: "We don't just plan, we design the soul of a tale—bringing unique, out-of-the-box themes tailored just for you."
    },
    {
      icon: <Star className="w-6 h-6 text-brand-yellow" />,
      title: "Client-Centric Ethos",
      desc: "You are the center of all we handle. We remain deeply connected, ensuring true signature outcomes unfold."
    }
  ];

  return (
    <section id="difference" className="py-24 bg-white overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.7 }}
             className="relative h-[600px] rounded-2xl overflow-hidden group shadow-2xl"
          >
            <img 
               src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop" 
               alt="Dinner table place setting" 
               className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
            />
            {/* The Floating Badge */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.5, type: "spring" }}
               className="absolute bottom-10 right-10 bg-brand-yellow px-8 py-6 rounded-xl shadow-xl border-4 border-white transform rotate-3"
            >
              <div className="text-center text-white">
                 <span className="text-4xl font-extrabold block">10+</span>
                 <span className="text-sm font-semibold tracking-wide uppercase mt-1 block">Years of Excellence</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.7 }}
          >
             <span className="text-brand-yellow font-semibold tracking-wider uppercase text-sm mb-4 block">
                Why You Should Trust Us
             </span>
             <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-10 leading-tight">
                The Merry Story <br/> Difference
             </h2>

             <div className="space-y-8">
               {points.map((pt, idx) => (
                 <div key={idx} className="flex gap-6 items-start">
                   <div className="flex-shrink-0 bg-yellow-50 p-4 rounded-full">
                      {pt.icon}
                   </div>
                   <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{pt.title}</h4>
                      <p className="text-gray-600 leading-relaxed text-sm">{pt.desc}</p>
                   </div>
                 </div>
               ))}
             </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}