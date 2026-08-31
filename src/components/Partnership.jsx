import React from 'react';
import { partnership } from '../data/site';
import { ShieldCheck, Award, Building2, Handshake, Cpu, Route, Landmark } from 'lucide-react';
import { TiltIn, RiseIn } from './motion/Reveal';

const ICONS = { Award, Building2, FileCheck: ShieldCheck, Handshake, Landmark, Cpu, Route };

// Short label per point so the card leads with a claim, not a paragraph.
const KICKERS = {
  'Forbes-Featured Leadership': 'Track record',
  '8+ Projects Delivered': 'Delivery',
  '100% Legal & Transparent': 'Paperwork',
  'Direct Developer Pricing': 'Your price',
};

export default function Partnership() {
  return (
    <section className="relative py-20 lg:py-28 bg-[#071426] overflow-hidden">
      {/* Depth: two soft light sources rather than a flat panel */}
      <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-[#f26522]/12 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-52 right-0 w-[520px] h-[520px] rounded-full bg-[#D4A853]/10 blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <RiseIn className="max-w-3xl mb-14 lg:mb-16">
          <p className="text-[#F2C46B] font-bold uppercase tracking-[0.22em] text-[11px] sm:text-xs mb-4">
            The Partnership
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Why buying through us costs you less
          </h2>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed">
            {partnership.intro}
          </p>
        </RiseIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {partnership.points.map((pt, i) => {
            const Icon = ICONS[pt.icon] || Handshake;
            return (
              <TiltIn key={pt.title} delay={i * 0.05} className="h-full">
                <div className="group relative h-full bg-white/[0.045] hover:bg-white/[0.075] border border-white/10 hover:border-[#D4A853]/35 rounded-2xl p-6 lg:p-7 transition-colors duration-300 overflow-hidden">
                  {/* number watermark gives the card a sense of depth */}
                  <span className="absolute -top-3 right-4 text-[80px] font-black text-white/[0.035] leading-none select-none pointer-events-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-[#f26522]/15 text-[#F2A24B] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                      <Icon size={22} strokeWidth={2} />
                    </div>

                    <p className="text-[#D4A853] text-[10px] font-bold uppercase tracking-[0.18em] mb-2">
                      {KICKERS[pt.title] || 'Advantage'}
                    </p>
                    <h3 className="text-lg lg:text-xl font-bold text-white leading-snug mb-3">
                      {pt.title}
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed">
                      {pt.text}
                    </p>
                  </div>
                </div>
              </TiltIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
