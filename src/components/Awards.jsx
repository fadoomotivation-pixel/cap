import React from 'react';
import { motion } from 'framer-motion';
import { Award, Globe, TrendingUp } from 'lucide-react';

const highlights = [
  {
    icon: <Award size={20} strokeWidth={1.5} />,
    title: 'Jagran Achievers Award 2026',
    desc: 'Recognised for vision, leadership and achievement in real estate.',
  },
  {
    icon: <Globe size={20} strokeWidth={1.5} />,
    title: 'Honoured at Almaty, Kazakhstan',
    desc: 'Presented on an international stage among global business leaders.',
  },
  {
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    title: 'Official Strategy Partner',
    desc: 'Driving Mirrikh Infratech\'s growth across Dholera Smart City.',
  },
];

export default function Awards() {
  return (
    <section className="py-24 lg:py-32 bg-[#FAFAFA] relative overflow-hidden" id="recognition">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Award Image */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="rounded-sm overflow-hidden bg-gray-200">
              <img
                src="/award-jasvinder-singh-jagran-achievers-2026.jpg"
                alt="Jasvinder Singh receiving the Jagran Achievers Award 2026 at Almaty"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 shadow-sm border border-gray-100 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1">Awarded</p>
              <p className="text-xl font-heading text-[#1A1A1A]">2026</p>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <span className="inline-block text-[#D4AF37] font-semibold uppercase tracking-[0.2em] text-xs mb-4">
              Global Recognition
            </span>
            <h2 className="text-4xl md:text-5xl font-heading text-[#1A1A1A] leading-tight mb-8">
              Award-winning leadership behind your Dholera investment.
            </h2>
            <p className="text-gray-500 font-light text-lg leading-relaxed mb-10">
              Our Founder & CEO <strong className="text-[#1A1A1A] font-medium">Jasvinder Singh</strong> was conferred the{' '}
              <strong className="text-[#1A1A1A] font-medium">Jagran Achievers Award 2026</strong> at Almaty, Kazakhstan — awarded for
              vision, leadership and achievement. It is a reflection of the standard we bring to every plot we
              help you buy in Dholera Smart City: verified inventory, transparent pricing and documentation you can
              trust.
            </p>

            <div className="space-y-6">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-start gap-5">
                  <div className="text-[#D4AF37] mt-1 shrink-0">
                    {h.icon}
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-medium mb-1">{h.title}</p>
                    <p className="text-gray-500 text-sm font-light leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
