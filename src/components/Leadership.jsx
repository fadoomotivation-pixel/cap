import React from 'react';
import { motion } from 'framer-motion';

export default function Leadership() {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-5/12 relative"
          >
            <div className="relative rounded-sm overflow-hidden bg-gray-100 aspect-[3/4]">
              <img 
                src="/founder.jpg" 
                alt="Jasvinder Singh - Founder & CEO" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/award-jasvinder-singh-jagran-achievers-2026.jpg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1016] via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white z-10">
                <p className="text-[#D4AF37] font-semibold text-xs tracking-widest uppercase mb-2">Founder & CEO</p>
                <h3 className="text-3xl font-heading text-white">Jasvinder Singh</h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full lg:w-7/12"
          >
            <div className="mb-12 relative">
              <span className="text-[#D4AF37]/20 text-[120px] font-heading absolute -top-16 -left-8 -z-10 leading-none">"</span>
              <blockquote className="text-3xl md:text-4xl lg:text-5xl font-heading text-[#1A1A1A] leading-tight">
                I truly believe that if you really want to do something, you'll find a way. If you don't, you'll find an excuse.
              </blockquote>
            </div>

            <div className="w-12 h-px bg-[#D4AF37] mb-8"></div>

            <div className="space-y-6 text-gray-500 font-light text-lg">
              <p>
                A dynamic and visionary leader, <strong className="text-[#1A1A1A] font-medium">Mr. Jasvinder Singh</strong> has built Capital Brix on the principles of transparency and long-term value creation. His exemplary contributions to the real estate sector have been recognized globally, culminating in the prestigious Jagran Achievers Award.
              </p>
              <p>
                His deep understanding of market dynamics ensures that every investor secures not just land, but a cornerstone for their future wealth in India's fastest-growing smart city.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
