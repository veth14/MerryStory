"use client";

import { motion } from "framer-motion";
import { Award, Briefcase, Clock, Headphones, Lightbulb, Users } from "lucide-react";

export function ExpertiseSection() {
  const pillars = [
    {
       icon: <Briefcase className="w-8 h-8 text-brand-yellow font-light" />,
       title: "Experience",
       desc: "Our dedication aligns alongside a reputation of top-tier events."
    },
    {
       icon: <Lightbulb className="w-8 h-8 text-brand-yellow font-light" />,
       title: "Creativity",
       desc: "Elegant palettes merging style and bespoke innovation successfully."
    },
    {
       icon: <Award className="w-8 h-8 text-brand-yellow font-light" />,
       title: "Quality",
       desc: "Uncompromising curations and fine materials from elite providers."
    },
    {
       icon: <Users className="w-8 h-8 text-brand-yellow font-light" />,
       title: "Teamwork",
       desc: "A pure and driven synergy from our local network professionals."
    },
    {
       icon: <Clock className="w-8 h-8 text-brand-yellow font-light" />,
       title: "On-Time",
       desc: "Precise timing bringing you to front line execution smoothly."
    },
    {
       icon: <Headphones className="w-8 h-8 text-brand-yellow font-light" />,
       title: "Support",
       desc: "From pure arrangements to fast life help along the steps."
    }
  ];

  return (
    <section id="expertise" className="bg-brand-dark py-28 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.6 }}
        >
          <span className="text-brand-yellow font-semibold tracking-wider uppercase text-sm mb-4 block">
             Our Pillars
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-20 text-white">
             Unrivaled Expertise
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {pillars.map((pillar, idx) => (
             <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
             >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {pillar.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{pillar.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {pillar.desc}
                </p>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}