import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Plane, Cpu, ArrowRight, Phone, Star } from 'lucide-react';
import { site } from '../data/site';

// Why these three: they are the reasons a Dholera plot appreciates, and the
// three things a buyer actually checks before paying.
const proofPoints = [
  { Icon: ShieldCheck, title: 'NA · NOC · Title Clear', sub: 'Registered sale deed in your name' },
  { Icon: Cpu, title: '₹91,000 Cr Tata Fab', sub: "India's first chip plant, next door" },
  { Icon: Plane, title: 'Airport + Expressway', sub: 'Ahmedabad an hour away' },
];

const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

export default function Hero() {
  return (
    <section className="relative w-full min-h-[100svh] flex items-center overflow-hidden bg-[#071426]">
      {/* Photograph, dimmed enough that type stays readable at every size */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Phones put the copy right on top of the photo, so they need a near
          solid scrim; desktop can afford a gradient because the text column
          only covers the left half. */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: 'linear-gradient(180deg, rgba(7,20,38,.93) 0%, rgba(7,20,38,.90) 55%, rgba(7,20,38,.97) 100%)' }}
      />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: 'linear-gradient(90deg, rgba(5,16,31,.97) 0%, rgba(7,20,38,.88) 45%, rgba(7,20,38,.55) 100%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, #071426 0%, rgba(7,20,38,0) 45%, rgba(7,20,38,.6) 100%)' }}
      />
      {/* Warm brand glow */}
      <div className="absolute -top-32 -right-24 w-[620px] h-[620px] rounded-full bg-[#f26522]/20 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-10 pt-28 pb-16 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* ── Left: the pitch ── */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 bg-white/[0.07] border border-[#D4A853]/40 backdrop-blur-sm rounded-full pl-3 pr-4 py-1.5 mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f26522]" />
              <span className="text-[#F2C46B] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] whitespace-nowrap">
                Official Strategy Partner<span className="hidden sm:inline"> · Mirrikh Infratech</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="text-white font-black leading-[1.04] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)' }}
            >
              Own land where India&apos;s<br className="hidden sm:block" />{' '}
              <span className="text-[#F2A24B]">next city</span> is being built
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}
              className="text-white/70 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mb-9"
            >
              NA-approved, title-clear plots in Dholera Smart City at{' '}
              <strong className="text-white font-semibold">direct developer pricing</strong> — from{' '}
              <strong className="text-white font-semibold">₹7,250 / sq yd</strong>. No middlemen, no markup,
              full documentation support from our Noida office.
            </motion.p>

            {/* Primary actions — talking to a human is the real conversion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10"
            >
              <a
                href={wa} target="_blank" rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#f26522] hover:bg-[#ff7733] text-white px-7 py-4 rounded-xl font-bold text-[15px] shadow-xl shadow-orange-900/40 transition-colors"
              >
                Book a Free Site Visit
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href={`tel:+${site.phone}`}
                className="inline-flex items-center justify-center gap-2.5 bg-white/[0.07] hover:bg-white/[0.14] border border-white/20 text-white px-7 py-4 rounded-xl font-semibold text-[15px] backdrop-blur-sm transition-colors"
              >
                <Phone size={17} /> {site.phoneDisplay}
              </a>
            </motion.div>

            {/* Award — the credibility line, not a decoration */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.36 }}
              className="flex items-start sm:items-center gap-2.5 text-white/55 text-sm"
            >
              <Star size={15} className="text-[#D4A853] fill-[#D4A853] shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Founder <strong className="text-white/80 font-semibold">Jasvinder Singh</strong> — Jagran Achievers Award 2026, Almaty
              </span>
            </motion.div>
          </div>

          {/* ── Right: the three checks a buyer makes ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5 lg:pl-6"
          >
            <div className="space-y-3">
              {proofPoints.map(({ Icon, title, sub }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 transition-colors"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#f26522]/15 text-[#F2A24B] flex items-center justify-center shrink-0">
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[15px] sm:text-base leading-tight">{title}</p>
                    <p className="text-white/55 text-xs sm:text-sm mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/projects"
              className="mt-4 group flex items-center justify-between gap-3 bg-[#D4A853]/10 hover:bg-[#D4A853]/16 border border-[#D4A853]/35 rounded-2xl p-4 sm:p-5 transition-colors"
            >
              <div>
                <p className="text-[#F2C46B] font-bold text-[15px] sm:text-base">See all live projects</p>
                <p className="text-white/50 text-xs sm:text-sm mt-0.5">Plot sizes, pricing and approvals</p>
              </div>
              <ArrowRight size={20} className="text-[#F2C46B] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
