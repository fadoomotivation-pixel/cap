import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, FileCheck, Handshake } from 'lucide-react';
import { partnership } from '../data/site';

const icons = {
  Award,
  Building2,
  FileCheck,
  Handshake,
};

export default function Partnership() {
  return (
    <section className="section-padding bg-white" id="partnership">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          className="bg-brand-gray p-8 md:p-12 rounded-lg border border-gray-200 shadow-sm text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-blue mb-4">
            {partnership.heading}
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-12">
            {partnership.intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {partnership.points.map((point, i) => {
              const Icon = icons[point.icon];
              return (
                <motion.div 
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-brand-orange mb-6">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">{point.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{point.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
