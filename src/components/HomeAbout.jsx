import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import VirtualTourViewer from './VirtualTourViewer';

export default function HomeAbout() {
  return (
    <section className="py-16 lg:py-24 bg-[#FAFAFA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left: 360° Virtual Tour Experience */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-6 relative w-full"
        >
          <VirtualTourViewer className="w-full" />
        </motion.div>

        {/* Right: Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-6"
        >
          <p className="text-[#D4AF37] font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            The Capital Brix Vision
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading text-[#1A1A1A] leading-[1.1] mb-8">
            Buying plots in Dholera SIR, without the guesswork.
          </h2>
          <div className="space-y-6 text-gray-600 font-light text-lg">
            <p>
              Dholera Special Investment Region (DSIR) is India's first greenfield smart city. Designed to be a global manufacturing and trading hub, it is equipped with world-class infrastructure, seamless connectivity, and sustainable development practices.
            </p>
            <p>
              As an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd., Capital Brix markets plots in the developer’s Dholera projects and handles the sale end to end — availability, site visits, documentation and registration.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/dholera/virtual-tour"
              className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#B8860B] font-semibold text-sm transition-colors group"
            >
              <span>Explore all 25+ activation landmarks in the official 360° tour</span>
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          
          <div className="mt-10 pt-10 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-heading text-[#1A1A1A] mb-1">12+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-heading text-[#1A1A1A] mb-1">12k+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Happy Investors</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-4xl font-heading text-[#D4AF37] mb-1">25+</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">360° Ground Scenes</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
