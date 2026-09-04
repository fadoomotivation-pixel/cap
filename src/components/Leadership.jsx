import React from 'react';
import { motion } from 'framer-motion';
import { Award, Globe, Handshake } from 'lucide-react';

// Leadership and Awards used to be two separate sections that both said
// "our founder won the Jagran Achievers Award" — 2,800px of phone scroll
// making one point. Merged into a single dark section, which also breaks up
// a homepage that was otherwise white all the way down.
const CREDENTIALS = [
  { Icon: Award, title: 'Jagran Achievers Award 2026', desc: 'For vision, leadership and achievement in real estate.' },
  { Icon: Globe, title: 'Honoured at Almaty, Kazakhstan', desc: 'Presented among global business leaders.' },
  { Icon: Handshake, title: 'Official Strategy Partner', desc: "Driving Mirrikh Infratech's growth across Dholera." },
];

export default function Leadership() {
  return (
    <section className="py-16 lg:py-28 bg-[#0A1016]" id="leadership">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20 items-center">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative max-w-sm mx-auto lg:max-w-none w-full"
          >
            <div className="relative rounded-sm overflow-hidden bg-[#141c26] aspect-[3/4]">
              <img
                src="/founder.jpg"
                alt="Jasvinder Singh, Founder and CEO of Capital Brix"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.target.src = '/award-jasvinder-singh-jagran-achievers-2026.jpg'; }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,16,22,0.95) 0%, rgba(10,16,22,0.15) 55%, transparent 100%)' }}
              />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[#D4AF37] font-semibold text-[10px] tracking-[0.2em] uppercase mb-1.5">Founder &amp; CEO</p>
                <h3 className="text-2xl sm:text-3xl font-heading text-white leading-tight">Jasvinder Singh</h3>
              </div>
            </div>

            {/* The award itself, small — it is evidence, not the headline. */}
            <div className="hidden sm:block absolute -bottom-8 -right-6 w-32 lg:w-40 rounded-sm overflow-hidden border-4 border-[#0A1016] shadow-xl">
              <img
                src="/award-jasvinder-singh-jagran-achievers-2026.jpg"
                alt="Jasvinder Singh receiving the Jagran Achievers Award 2026 at Almaty"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="mt-6 lg:mt-0"
          >
            <p className="text-[#D4AF37] font-semibold uppercase tracking-[0.2em] text-xs mb-5">
              Leadership &amp; recognition
            </p>

            <blockquote className="text-2xl sm:text-3xl lg:text-[2.75rem] font-heading text-white leading-[1.2] mb-7">
              “I truly believe that if you really want to do something, you&apos;ll find a way.
              If you don&apos;t, you&apos;ll find an excuse.”
            </blockquote>

            <div className="w-12 h-px bg-[#D4AF37] mb-7" />

            <p className="text-gray-400 font-light leading-relaxed mb-9 max-w-xl">
              <strong className="text-white font-medium">Jasvinder Singh</strong> built Capital Brix on
              transparency and long-term value creation. He was conferred the{' '}
              <strong className="text-white font-medium">Jagran Achievers Award 2026</strong> at Almaty,
              Kazakhstan — a reflection of the standard we bring to every plot we help you buy:
              verified inventory, transparent pricing, and documentation you can check yourself.
            </p>

            <ul className="grid sm:grid-cols-3 gap-x-6 gap-y-5 border-t border-white/10 pt-7">
              {CREDENTIALS.map(({ Icon, title, desc }) => (
                <li key={title}>
                  <Icon size={18} strokeWidth={1.5} className="text-[#D4AF37] mb-2.5" />
                  <p className="text-white text-sm font-medium leading-snug mb-1">{title}</p>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">{desc}</p>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
