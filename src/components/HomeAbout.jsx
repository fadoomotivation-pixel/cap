import React from 'react';
import { motion } from 'framer-motion';

export default function HomeAbout() {
  return (
    <section className="py-24 lg:py-32 bg-[#FAFAFA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
        
        {/* Left: Founder Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="md:col-span-5 relative"
        >
          <div className="aspect-[3/4] overflow-hidden rounded-sm bg-gray-200">
            <img 
              src="/hero-bg.jpg" 
              alt="Dholera Smart City Infrastructure"
              className="w-full h-full object-cover"
            />
          </div>

        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="md:col-span-7"
        >
          <h2 className="text-[#D4AF37] font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            The Capital Brix Vision
          </h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading text-[#1A1A1A] leading-[1.1] mb-8">
            Pioneering wealth creation in Dholera SIR.
          </h3>
          <div className="space-y-6 text-gray-600 font-light text-lg">
            <p>
              Dholera Special Investment Region (DSIR) is India's first greenfield smart city. Designed to be a global manufacturing and trading hub, it is equipped with world-class infrastructure, seamless connectivity, and sustainable development practices.
            </p>
            <p>
              As the official strategy partner of Mirrikh Infratech, Capital Brix provides unmatched investment opportunities in this rapidly growing region. Secure your future in a city that promises exponential growth and world-class living standards.
            </p>
          </div>
          
          <div className="mt-12 pt-12 border-t border-gray-200 grid grid-cols-2 gap-8">
            <div>
              <div className="text-4xl font-heading text-[#1A1A1A] mb-2">12+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-heading text-[#1A1A1A] mb-2">12k+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Happy Investors</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
