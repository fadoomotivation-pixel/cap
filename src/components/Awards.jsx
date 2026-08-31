import React from 'react';
import { Parallax, RiseIn } from './motion/Reveal';
import { Award, Globe, TrendingUp } from 'lucide-react';

const highlights = [
  {
    icon: <Award size={20} />,
    title: 'Jagran Achievers Award 2026',
    desc: 'Recognised for vision, leadership and achievement in real estate.',
  },
  {
    icon: <Globe size={20} />,
    title: 'Honoured at Almaty, Kazakhstan',
    desc: 'Presented on an international stage among global business leaders.',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Official Strategy Partner',
    desc: 'Driving Mirrikh Infratech’s growth across Dholera Smart City.',
  },
];

export default function Awards() {
  return (
    <section className="py-20 md:py-24 bg-[#0A1F3F] relative overflow-hidden" id="recognition">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f26522]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Award creative — drifts against the copy as you scroll, which is
              what gives the section a sense of depth on a phone. */}
          <Parallax distance={34} className="relative mx-auto w-full max-w-md">
            <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img
                src="/award-jasvinder-singh-jagran-achievers-2026.jpg"
                alt="Jasvinder Singh, Founder & CEO of Capital Brix, receiving the Jagran Achievers Award 2026 at Almaty, Kazakhstan"
                width="900"
                height="1200"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-4 bg-[#f26522] text-white px-5 py-3 rounded-xl shadow-xl hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">Awarded</p>
              <p className="text-lg font-bold leading-none mt-0.5">2026</p>
            </div>
            </div>
          </Parallax>

          {/* Copy */}
          <RiseIn delay={0.1}>
            <span className="inline-block text-[#f26522] font-bold uppercase tracking-[0.2em] text-xs mb-4">
              Recognition
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-outfit leading-tight mb-6">
              Award-winning leadership behind your Dholera investment
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Our Founder &amp; CEO <strong className="text-white">Jasvinder Singh</strong> was conferred the{' '}
              <strong className="text-white">Jagran Achievers Award 2026</strong> at Almaty, Kazakhstan — awarded for
              vision, leadership and achievement. It is a reflection of the same standard we bring to every plot we
              help you buy in Dholera Smart City: verified inventory, transparent pricing and documentation you can
              trust.
            </p>

            <div className="space-y-4">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f26522]/15 text-[#f26522] flex items-center justify-center shrink-0">
                    {h.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{h.title}</p>
                    <p className="text-white/60 text-sm mt-0.5">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RiseIn>

        </div>
      </div>
    </section>
  );
}
