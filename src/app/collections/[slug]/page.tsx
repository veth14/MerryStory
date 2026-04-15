"use client";

import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const collectionDetails = {
  'weddings': {
    heroTag: 'YOUR VISION, OUR CANVAS',
    heroTitle1: 'Infinite',
    heroTitle2: 'Possibilities.',
    heroDesc: 'For the visionaries of love. We craft cinematic wedding experiences that blend heritage with modern luxury, ensuring every detail reflects your unique narrative.',
    heroBtn: 'DISCOVER OUR PROCESS',
    heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1920',
    
    section2Title: 'The Consultation',
    section2Desc: 'Every masterpiece begins with a conversation. Our process starts with an absolute immersion into your vision and style. Because we offer a truly bespoke production, we craft an intricate blueprint that makes your dream a reality.',
    features: [
      { title: 'CONCEPTUAL BLUEPRINTING', desc: 'Detailed layouts, timelines, and visual mood boards.' },
      { title: 'FLORAL SELECTION', desc: 'Curated arrangements mapped beautifully to your palette.' }
    ],
    section2Image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200',
    
    section3Tag: 'THE SKILL & PASSION',
    section3Title: 'Artisanship.',
    section3Subtitle: 'The flawless execution of your event depends on the art of precision.',
    artisanshipImages: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800'
    ],
    
    section4Title: 'The Masterpieces',
    masterpieceMain: { src: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1200', label: 'The Golden Pavilion' },
    masterpieceTopR: { src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200', label: 'Ethereal Dining' },
    masterpieceBotR1: { src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800', label: 'Details' },
    masterpieceBotR2: { src: 'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=800', label: 'Atmosphere' }
  },
  'corporate': {
    heroTag: 'BRAND IMMERSION',
    heroTitle1: 'Corporate',
    heroTitle2: 'Excellence.',
    heroDesc: 'Elevating corporate identity through high-impact production. From award ceremonies to milestone anniversaries, we deliver prestige and precision.',
    heroBtn: 'EXPLORE CAPABILITIES',
    heroImage: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1920',
    
    section2Title: 'Strategic Design',
    section2Desc: 'We translate your brands core values into a tactile, memorable experience. When it comes to corporate events, professionalism meets boundless creativity.',
    features: [
      { title: 'BRAND INTEGRATION', desc: 'Seamlessly weaving your identity into the event fabric.' },
      { title: 'LOGISTICAL PRECISION', desc: 'Flawless execution of schedules, talent, and technical ops.' }
    ],
    section2Image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200',
    
    section3Tag: 'IMPACT & SCALE',
    section3Title: 'Production.',
    section3Subtitle: 'Environments that impress stakeholders and communicate your message dynamically.',
    artisanshipImages: [
      'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800'
    ],
    
    section4Title: 'The Showcases',
    masterpieceMain: { src: 'https://images.unsplash.com/photo-1561489396-888724a1543d?auto=format&fit=crop&q=80&w=1200', label: 'The Annual Gala' },
    masterpieceTopR: { src: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1200', label: 'Stage Architecture' },
    masterpieceBotR1: { src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800', label: 'VIP Areas' },
    masterpieceBotR2: { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800', label: 'Networking' }
  },
  'trade-shows': {
    heroTag: 'COMMAND ATTENTION',
    heroTitle1: 'Immersive',
    heroTitle2: 'Exhibitions.',
    heroDesc: 'Command attention on the exhibition floor. We design and build high-traffic experiences that amplify brand awareness and drive engagement.',
    heroBtn: 'VIEW STRATEGY',
    heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1920',
    
    section2Title: 'The Architecture',
    section2Desc: 'In a sea of competitors, your trade show presence must be an immediate visual anchor. We architect booths and exhibition zones designed to draw attendees in.',
    features: [
      { title: 'SPATIAL FLOW', desc: 'Intelligent booth mapping to maximize lead generation.' },
      { title: 'CUSTOM FABRICATION', desc: 'Bespoke structural builds that command the room.' }
    ],
    section2Image: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=1200',
    
    section3Tag: 'ENGAGEMENT',
    section3Title: 'Interaction.',
    section3Subtitle: 'Creating memorable touchpoints for every single visitor.',
    artisanshipImages: [
      'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1561489396-888724a1543d?auto=format&fit=crop&q=80&w=800'
    ],
    
    section4Title: 'The Pavilions',
    masterpieceMain: { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200', label: 'Tech Expo Alpha' },
    masterpieceTopR: { src: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=1200', label: 'Interactive Displays' },
    masterpieceBotR1: { src: 'https://images.unsplash.com/photo-1558403194-611308249627?auto=format&fit=crop&q=80&w=800', label: 'Lead Gen Kiosks' },
    masterpieceBotR2: { src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800', label: 'Lounges' }
  },
  'birthdays': {
    heroTag: 'THE ART OF CELEBRATION',
    heroTitle1: 'Unforgettable',
    heroTitle2: 'Milestones.',
    heroDesc: 'Cherishing the milestones that matter. We create bespoke atmospheres for intimate gatherings and grand soirees alike.',
    heroBtn: 'OUR APPROACH',
    heroImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1920',
    
    section2Title: 'The Planning',
    section2Desc: 'Birthdays are the markers of our personal journeys. We pour heart and soul into creating an atmosphere that perfectly represents the honorand.',
    features: [
      { title: 'THEMATIC CONCEPT', desc: 'From sophisticated galas to wildly creative visual motifs.' },
      { title: 'CURATED DINING', desc: 'Unforgettable culinary experiences tailored to your palate.' }
    ],
    section2Image: 'https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=1200',
    
    section3Tag: 'JOY & INTIMACY',
    section3Title: 'Gatherings.',
    section3Subtitle: 'Great food, gorgeous surroundings, and a night tailored around you.',
    artisanshipImages: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800'
    ],
    
    section4Title: 'The Memories',
    masterpieceMain: { src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200', label: 'The 50th Gala' },
    masterpieceTopR: { src: 'https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=1200', label: 'Intimate Dining' },
    masterpieceBotR1: { src: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800', label: 'Performances' },
    masterpieceBotR2: { src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800', label: 'Decor Details' }
  }
};

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const data = collectionDetails[slug as keyof typeof collectionDetails];

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-0 -mt-20 overflow-x-hidden relative">

      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] md:h-screen w-full flex items-center">
        <Image 
          src={data.heroImage} 
          alt={data.heroTitle1} 
          fill 
          className="object-cover object-center" 
          priority 
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        
        <div className="relative z-10 px-6 sm:px-12 lg:px-24 mx-auto w-full max-w-screen-2xl">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="max-w-2xl mt-16"
           >
             {/* SUBTLE BREADCRUMB / BACK LINK */}
             <button 
               onClick={() => router.back()}
               className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 group"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 group-hover:-translate-x-1 transition-transform">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
               </svg>
               <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Return to Collections</span>
             </button>

             <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-[10px] mb-6 block">
                {data.heroTag}
             </span>
             <h1 className="text-6xl md:text-8xl flex flex-col font-black text-white leading-[0.9] tracking-tighter mb-8">
                <span>{data.heroTitle1}</span>
                <span className="text-brand-yellow">{data.heroTitle2}</span>
             </h1>
             <p className="text-gray-300 text-sm md:text-[15px] leading-relaxed max-w-md mb-10 border-l-2 border-brand-yellow/50 pl-6">
                {data.heroDesc}
             </p>
             <Link href="#consultation" className="inline-flex items-center text-white text-[10px] font-bold uppercase tracking-[0.2em] border border-white/40 hover:border-brand-yellow hover:bg-brand-yellow px-10 py-5 transition-all duration-300">
                {data.heroBtn}
             </Link>
           </motion.div>
        </div>
      </section>

      {/* 2. CONSULTATION SECTION */}
      <section id="consultation" className="pb-12 pt-40 px-6 sm:px-12 lg:px-24 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
           {/* Text Left */}
           <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="w-full lg:w-1/2"
           >
              <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-bold tracking-tight text-gray-900 mb-8 leading-tight">
                {data.section2Title}
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm mb-16 max-w-lg pr-4">
                {data.section2Desc}
              </p>
              
              <div className="flex flex-col gap-10">
                {data.features.map((feat, idx) => (
                  <div key={idx} className="flex gap-5">
                     <div className="w-[8px] h-[8px] mt-1.5 bg-brand-yellow flex-shrink-0" />
                     <div>
                       <h4 className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-gray-900 mb-2">{feat.title}</h4>
                       <p className="text-gray-500 text-xs leading-relaxed max-w-[300px]">{feat.desc}</p>
                     </div>
                  </div>
                ))}
              </div>
           </motion.div>

           {/* Image Right */}
           <motion.div 
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="w-full lg:w-1/2 relative flex justify-end"
           >
              <div className="relative aspect-[4/3] md:aspect-[5/4] w-full md:w-[95%] shadow-md overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={data.section2Image} alt="Consultation" fill className="object-cover" unoptimized/>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -left-4 md:-left-16 -bottom-12 bg-white px-8 py-10 shadow-[0_30px_60px_rgba(0,0,0,0.1)] z-10 flex flex-col md:flex-row items-start md:items-center gap-4 min-w-[280px]">
                 <span className="text-brand-yellow text-[2.5rem] leading-none font-bold">01</span>
                 <div className="flex flex-col border-l border-gray-200 pl-4 md:ml-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-900 leading-tight">Philosophy and Value</span>
                    <span className="text-gray-400 text-[10px] mt-1">Curated perfection</span>
                 </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* 3. ARTISANSHIP SECTION */}
      <section className="pt-40 pb-20">
        <div className="px-6 sm:px-12 lg:px-24 mx-auto max-w-screen-2xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-gray-200 pb-10">
            <div>
               <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-[9px] mb-4 block">
                  {data.section3Tag}
               </span>
               <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
                  {data.section3Title}
               </h2>
            </div>
            <p className="text-gray-400 text-xs md:text-sm max-w-[280px] md:text-right leading-relaxed mb-2 font-serif italic">
              "{data.section3Subtitle}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-white">
            {data.artisanshipImages.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative aspect-square overflow-hidden group border border-gray-100"
              >
                <Image src={img} alt="Artisanship details" fill className="object-cover transition-transform duration-[1.5s]" unoptimized/>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MASTERPIECES BENTO GRID */}
      <section className="pt-24 pb-48 px-6 sm:px-12 lg:px-24 mx-auto max-w-[1400px]">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
              {data.section4Title}
            </h2>
            <div className="w-12 h-[3px] mx-auto bg-brand-yellow" />
         </div>

         {/* Grid Layout designed like the screenshot bento box */}
         <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 h-auto lg:h-[650px]">
            {/* Left Big Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] lg:h-full lg:w-[55%] group overflow-hidden bg-gray-100"
            >
               <Image src={data.masterpieceMain.src} alt={data.masterpieceMain.label} fill className="object-cover transition-transform duration-[2s]" unoptimized/>
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />
               <div className="absolute bottom-8 left-8">
                 <span className="text-brand-yellow text-[9px] uppercase tracking-[0.2em] font-bold block mb-3">MAIN PROJECT</span>
                 <h3 className="text-white text-3xl font-medium tracking-tight mb-2">{data.masterpieceMain.label}</h3>
               </div>
            </motion.div>

            {/* Right Column Stack */}
            <div className="flex flex-col gap-2 lg:gap-4 lg:w-[45%] h-full">
               {/* Top Wide Image */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6, delay: 0.2 }}
                 className="relative h-[250px] lg:h-[55%] w-full group overflow-hidden bg-gray-100"
               >
                  <Image src={data.masterpieceTopR.src} alt={data.masterpieceTopR.label} fill className="object-cover transition-transform duration-[2s]" unoptimized/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-gray-200 text-sm tracking-widest font-light">{data.masterpieceTopR.label}</h3>
                  </div>
               </motion.div>

               {/* Bottom 2 Images */}
               <div className="flex flex-col md:flex-row gap-2 lg:gap-4 h-[400px] md:h-[200px] lg:h-[45%]">
                 {[data.masterpieceBotR1, data.masterpieceBotR2].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 + (idx * 0.1) }}
                      className="relative w-full md:w-1/2 h-full group overflow-hidden bg-gray-100"
                    >
                      <Image src={item.src} alt={item.label} fill className="object-cover transition-transform duration-[2s]" unoptimized/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                      <div className="absolute bottom-5 left-5">
                        <span className="text-brand-yellow text-[8px] uppercase tracking-widest block">{item.label}</span>
                      </div>
                    </motion.div>
                 ))}
               </div>
            </div>
         </div>
      </section>

      {/* 5. BOTTOM CTA SECTION */}
      <section className="relative px-6 sm:px-12 py-32 lg:py-48 flex justify-center items-center bg-[#F9F9F8]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image 
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000" 
            alt="Background Texture" 
            fill 
            className="object-cover opacity-[0.03]" 
            unoptimized
          />
        </div>
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           whileInView={{ opacity: 1, scale: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 1 }}
           className="relative z-10 w-full max-w-4xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-2xl border border-gray-100 p-12 md:p-24 text-center flex flex-col items-center"
        >
          <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-[10px] mb-4 block">
            Next Steps
          </span>
          <h2 className="text-4xl md:text-[3.5rem] font-bold text-gray-900 tracking-tight mb-6 leading-tight">    
            Begin Your Journey.
          </h2>
          <p className="text-gray-500 text-sm md:text-[15px] mb-12 max-w-lg leading-[1.8]">
            Allow us to architect your next defining moment. Reach out for a bespoke inquiry and step into the extraordinary.
          </p>
          
          <Link
            href="/contact"
            className="bg-[#111111] hover:bg-black text-white px-12 py-5 text-[11px] font-bold tracking-[0.15em] uppercase shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Book a Consultation
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
