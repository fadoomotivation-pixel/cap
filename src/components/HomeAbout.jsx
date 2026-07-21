import React from 'react';
import { motion } from 'framer-motion';

export default function HomeAbout() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[#f37435] font-semibold tracking-wider uppercase text-sm mb-3">
            About Dholera SIR
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-[#101010] leading-tight mb-6">
            Building Futures in Dholera’s Special Investment Region
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Dholera Special Investment Region (DSIR) is India's first greenfield smart city. Designed to be a global manufacturing and trading hub, it is equipped with world-class infrastructure, seamless connectivity, and sustainable development practices.
          </p>
          <p className="text-gray-600 leading-relaxed">
            As an exclusive channel partner of Mirrikh Infratech, Capital Brix provides unmatched investment opportunities in this rapidly growing region. Secure your future in a city that promises exponential growth and world-class living standards.
          </p>
          
          <div className="mt-8 flex gap-8">
            <div>
              <div className="text-4xl font-bold text-[#f37435] mb-1">12+</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#f37435] mb-1">12k+</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Happy Investors</div>
            </div>
          </div>
        </motion.div>

        {/* Right: Images Grid (Mirrikh style) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          <img 
            src="https://mirrikh.com/wp-content/uploads/2024/02/dholera-climate-change.jpg" 
            alt="Dholera Infrastructure"
            className="w-full h-48 md:h-64 object-cover rounded-sm shadow-sm"
          />
          <img 
            src="https://mirrikh.com/wp-content/uploads/2026/02/Jobs-in-Dholera-SIR-2026-scaled.jpg" 
            alt="Dholera Smart City"
            className="w-full h-48 md:h-64 object-cover rounded-sm shadow-sm mt-8"
          />
        </motion.div>

      </div>
    </section>
  );
}
