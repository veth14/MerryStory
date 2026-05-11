"use client";

import { motion } from "framer-motion";

export function TestimonialsSection() {
  const reviews = [
    {
      name: "Francis John Deniega Tabilin",
      role: "PROPOSAL CLIENT",
      avatar: "https://scontent.fmnl17-2.fna.fbcdn.net/v/t1.6435-9/76184067_2749611725059281_4564264502828204032_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeExs_4pcJ9tIjvNv9-uzPMUDuylk20sB-oO7KWTbSwH6kg3pfDylyoAL3Lp-dSGX6vMfkyNf47oPxMaw05ZlUHU&_nc_ohc=9mQqWWEGTcAQ7kNvwF9NNEV&_nc_oc=Adr0IUJj1zrduOY2q3lBxm0QGPmPq8ytf5KSYtc1zEif-bjMrmByGv0FJIAb0OAmNG8&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=JQMfSQV0JRXJguxM3p-V0g&_nc_ss=7b2a8&oh=00_Af5QDk39U7WLVOggoGUYdeWOTQHbwR20krV5-QiZqrRFFg&oe=6A2963FB",
      text: "Thank you so much Merry Story! Maam Merry and her partner, Thank you! 🥰 Napakaresponsive niyo at sobrang bait. Maraming changes at pahabol na nangyari pero lahat namanage natin. It felt like we're really in a group, napakahelpful. Good job! Godbless! 🙏🏻💖"
    },
    {
       name: "Khryz Ann",
       role: "BIRTHDAY CLIENT",
       avatar: "https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/646071202_26537203835877700_2453633519771627213_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=61e847&_nc_eui2=AeG8KNZd_gnKaOOt4Exiu4uhJmPrCHA-uComY-sIcD64KsL1BPX29A386H_hGt2S5S7A0iuUHjliRU_zCIAH5HAA&_nc_ohc=FZ0Ps7psNBYQ7kNvwFOBRxM&_nc_oc=Adqp1dcwnuoiVXSSGD4-UXE_D3lt9MOb_35r6cEF6T4n1-Jt2SaPQQJmeTTBv8iv_mU&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=cxp_stLhDhKDddy50dixSg&_nc_ss=7b2a8&oh=00_Af7pg1dKnY29BfWrB6MryE-Ahxtm4qmMk3ksWJQalyPJMQ&oe=6A07BC2E",
       text: "Hi. Thank you for covering our event last Jan14 🙂 Nakakasatisfy ang mga shots, knowing na baby ang kukunan at talagang mabilis kayo kumuha and maganda pa 🙂 more clients and bookings. GODBLESS!"
    },
    {
       name: "Jinky Dela Pena-Fogota",
       role: "WEDDING CLIENT",
       avatar: "https://scontent.fmnl17-1.fna.fbcdn.net/v/t39.30808-6/570384973_10229660757359537_7444618743629508161_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=100&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGBn-bDWGVbE1pdwAmlplEp-CMn0SNffmD4IyfRI19-YGsdjDEO5Ke9hRgnNXkA5zJool9o-oyWe5F1DUCTDf3X&_nc_ohc=tW1dfZmRoI8Q7kNvwHYQe7P&_nc_oc=AdoD96Rkvd1SrsE4tVi2nT-S6jgkJVgF9YrPOl92c2qysXqvVxHeaowKoa9PhWdNl5Y&_nc_zt=23&_nc_ht=scontent.fmnl17-1.fna&_nc_gid=H3b755DRJkKWqljBzQRiTQ&_nc_ss=7b2a8&oh=00_Af6UAOyTlEZF1IImGGxp02zuNXv75YVE3Lgtd091CwicgA&oe=6A07BF46",
       text: "Recommending MerryStory Productions Event Management Services, di po kayo magsisisi. Promise! You will just enjoy your special moments 🥰🥰🥰 From planning na di namin alam ang gagawin, they got you!From di makadecide which is better, they discuss pros and cons to you. Reminders and anythings else, sila ng bahala sa inyo. Magiging Merry talang ang Wedding nyo.."
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
                    <img src={rev.avatar} alt={rev.name} className="w-full h-full object-cover" />
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