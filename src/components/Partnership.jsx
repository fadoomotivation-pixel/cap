import React from 'react';
import { partnership } from '../data/site';
import { ShieldCheck, Award, Building2, Handshake, Cpu, Route, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

const ICONS = { Award, Building2, FileCheck: ShieldCheck, Handshake, Landmark, Cpu, Route };

export default function Partnership() {
  return (
    <section className="py-24 lg:py-32 bg-[#0A1016]">
      <div className="max-w-7xl mx-auto px-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mb-20"
        >
          <p className="text-[#D4AF37] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
            The Partnership
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading text-white leading-tight mb-6">
            Why buying through us costs you less.
          </h2>
          <p className="text-gray-400 font-light text-lg lg:text-xl leading-relaxed">
            {partnership.intro}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10"
        >
          {partnership.points.map((pt, i) => {
            const Icon = ICONS[pt.icon] || Handshake;
            return (
              <div key={pt.title} className="bg-[#0A1016] p-8 lg:p-10 group hover:bg-[#0f1823] transition-colors duration-500">
                <div className="text-[#D4AF37] mb-8">
                  <Icon size={32} strokeWidth={1} />
                </div>
                <h3 className="text-xl font-heading text-white mb-4">
                  {pt.title}
                </h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  {pt.text}
                </p>
              </div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
