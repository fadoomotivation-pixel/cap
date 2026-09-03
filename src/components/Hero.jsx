import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { site } from '../data/site';

const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

export default function Hero() {
  return (
    <section className="relative w-full min-h-[90svh] flex items-end pb-16 lg:pb-24 overflow-hidden bg-[#0A1016]">
      {/* Real photography background, gently dimmed */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      
      {/* Simple, elegant dark overlay for text readability, avoiding complicated arbitrary class gradients */}
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(10,16,22,1) 0%, rgba(10,16,22,0.4) 50%, rgba(10,16,22,0) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-40">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-5">
              Official Strategy Partner • Mirrikh Infratech
            </p>
            <h1 className="text-white font-heading font-normal leading-[1.1] tracking-tight mb-6 text-4xl md:text-5xl lg:text-[4.25rem]">
              Plots in Dholera Smart City,<br/>where India&apos;s next city is being built.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mb-12 font-light"
          >
            NA-approved, title-clear plots in Dholera Smart City at direct developer pricing—from ₹7,250 / sq yd. Full documentation support from our Noida office.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <a
              href={wa} target="_blank" rel="noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-8 py-4 rounded-sm font-semibold transition-colors duration-300"
            >
              Book a Site Visit
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center gap-3 border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-sm font-medium transition-colors duration-300"
            >
              View Projects
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
