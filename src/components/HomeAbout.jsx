import React from 'react';
import { motion } from 'framer-motion';

export default function HomeAbout() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop" 
            alt="Dholera Infrastructure"
            className="w-full h-48 md:h-64 object-cover rounded-sm shadow-sm"
          />
          <img 
            src="https://images.unsplash.com/photo-1541888009-8b01c18251e0?q=80&w=800&auto=format&fit=crop" 
            alt="Dholera Smart City"
            className="w-full h-48 md:h-64 object-cover rounded-sm shadow-sm mt-8"
          />
        </motion.div>

      </div>
    </section>
  );
}
