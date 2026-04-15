"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="py-28 bg-white overflow-hidden relative">
         <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          <motion.div
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.7 }}
          >
             <span className="text-brand-yellow font-semibold tracking-wider uppercase text-sm mb-4 block">
                Contact Us
             </span>
             <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Begin Your Story
             </h2>
             <p className="text-gray-600 max-w-lg mb-12 leading-relaxed">
                Whether you are planning a grand gala or an intimate milestone, our team ensures to provide an exceptional communication.
             </p>

             <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <div className="bg-yellow-50 p-4 rounded-full text-brand-yellow hover:text-yellow-600 transition-colors">
                     <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-gray-900 mb-1">Office</h4>
                     <p className="text-gray-600 text-sm">7901 E Broadway Planning, Austin TX</p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="bg-yellow-50 p-4 rounded-full text-brand-yellow hover:text-yellow-600 transition-colors">
                     <Phone className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                     <p className="text-gray-600 text-sm">+1 (555) 987-6543</p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="bg-yellow-50 p-4 rounded-full text-brand-yellow hover:text-yellow-600 transition-colors">
                     <Mail className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                     <p className="text-gray-600 text-sm">concierge@merrystory.com</p>
                  </div>
               </div>
             </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.7 }}
             className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100"
          >
             <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input type="text" id="name" placeholder="John Doe" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-shadow" />
                   </div>
                   <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input type="email" id="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-shadow" />
                   </div>
                </div>

                <div>
                   <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                   <select id="event" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent bg-white transition-shadow">
                      <option>Elegant Wedding</option>
                      <option>Birthday Celebration</option>
                      <option>Graduation Event</option>
                      <option>Product Launch</option>
                      <option>Other Event</option>
                   </select>
                </div>

                <div>
                   <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Your Needs</label>
                   <textarea id="message" rows={4} placeholder="Let us know what you invision for your event..." className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent resize-none transition-shadow"></textarea>
                </div>

                <button type="button" className="w-full bg-brand-yellow hover:bg-yellow-500 text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-xl hover:scale-[1.02] transform duration-200">
                   Submit Inquiry
                </button>
             </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}