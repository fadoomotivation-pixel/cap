import React from 'react';
import { motion } from 'framer-motion';

export default function Stats() {
  const stats = [
    { value: '+ 25 LACS', label: 'SQ.YD. OF LAND' },
    { value: '+ 15', label: 'COUNTRIES' },
    { value: '28', label: 'STATES/UT' },
    { value: '+ 550', label: 'CITIES' },
    { value: '+ 12,000', label: 'HAPPY CLIENTS' },
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="max-w-[1500px] mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 text-center">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <span className="text-4xl md:text-5xl font-outfit font-black text-[#101010] mb-2">{stat.value}</span>
              <span className="text-xs md:text-sm font-semibold text-gray-500 tracking-widest uppercase">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
