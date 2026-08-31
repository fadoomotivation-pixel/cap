import React from 'react';
import { stats } from '../data/site';
import { motion } from 'framer-motion';

export default function Stats() {
  return (
    <section className="bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] mb-12"
        >
          Why Dholera, in four numbers
        </motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              className="text-center pt-8 lg:pt-0 px-4 flex flex-col items-center justify-center first:pt-0"
            >
              <p className="text-4xl md:text-5xl font-heading text-[#1A1A1A] mb-3">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed max-w-[180px]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
