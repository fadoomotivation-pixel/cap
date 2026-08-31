import React from 'react';
import { motion } from 'framer-motion';
import { stats } from '../data/site';

// These are the facts that make Dholera land appreciate — infrastructure a
// buyer can verify, not vanity numbers about how many cities we've sold in.
export default function Stats() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-8 lg:mb-10">
          Why Dholera, in four numbers
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-center lg:border-r lg:last:border-r-0 border-gray-100 px-2"
            >
              <p className="text-2xl sm:text-3xl lg:text-[2.6rem] font-black text-[#10243E] leading-none tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 font-medium mt-3 leading-snug max-w-[190px] mx-auto">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
