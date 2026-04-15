"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    event: "Elegant Wedding",
    message: ""
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    setStatus('loading');
    
    try {
      const payload = {
        type: 'inquiry',
        name: formData.name,
        email: formData.email,
        eventType: formData.event,
        message: formData.message
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: "", email: "", event: "Elegant Wedding", message: "" });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

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
             className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 relative"
          >
             <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                         type="text" 
                         id="name" 
                         value={formData.name}
                         onChange={handleChange}
                         required
                         placeholder="John Doe" 
                         className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-shadow bg-transparent" 
                      />
                   </div>
                   <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                         type="email" 
                         id="email" 
                         value={formData.email}
                         onChange={handleChange}
                         required
                         placeholder="john@example.com" 
                         className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-shadow bg-transparent" 
                      />
                   </div>
                </div>

                <div>
                   <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                   <select 
                      id="event" 
                      value={formData.event}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent bg-white transition-shadow"
                   >
                      <option>Elegant Wedding</option>
                      <option>Birthday Celebration</option>
                      <option>Graduation Event</option>
                      <option>Product Launch</option>
                      <option>Other Event</option>
                   </select>
                </div>

                <div>
                   <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Your Needs</label>
                   <textarea 
                      id="message" 
                      rows={4} 
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Let us know what you invision for your event..." 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent resize-none transition-shadow bg-transparent"
                   ></textarea>
                </div>

                <div className="pt-2">
                   {status === 'success' ? (
                      <div className="w-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium py-4 px-4 rounded-lg text-center">
                         Thank you! Your inquiry has been sent.
                      </div>
                   ) : status === 'error' ? (
                      <div className="w-full bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-4 px-4 rounded-lg text-center">
                         Failed to send message. Please try again.
                      </div>
                   ) : (
                      <button 
                         type="submit" 
                         disabled={status === 'loading'}
                         className="w-full bg-brand-yellow hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] transform duration-200"
                      >
                         {status === 'loading' ? 'Sending...' : 'Submit Inquiry'}
                      </button>
                   )}
                </div>
             </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}