import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, PlayCircle } from 'lucide-react';
import { stats } from '../data/site';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: i => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="hero" id="top">
      {/* Background is now handled purely in CSS via hero-bg.jpg */}
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__content">
        <motion.p className="hero__eyebrow" variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <MapPin size={16} /> Exclusive Channel Partner · Mirrikh Infratech · Dholera SIR
        </motion.p>

        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}>
          Own Land in <span className="text-gold">Dholera</span>
          <br />
          Before the World Moves In
        </motion.h1>

        <motion.p className="hero__sub" variants={fadeUp} initial="hidden" animate="show" custom={2}>
          Book NA-approved, title-clear Mirrikh Infratech plots at direct developer
          pricing — next to the ₹91,000 Cr semiconductor fab, the international airport
          and the Ahmedabad–Dholera Expressway. 8+ projects delivered since 2012.
        </motion.p>

        <motion.div className="hero__actions" variants={fadeUp} initial="hidden" animate="show" custom={3}>
          <a href="#projects" className="btn btn--gold btn--lg">
            Explore Projects <ArrowRight size={20} />
          </a>
          <a href="#contact" className="btn btn--ghost btn--lg">
            <PlayCircle size={20} /> Book Free Site Visit
          </a>
        </motion.div>

        <motion.ul className="hero__stats" variants={fadeUp} initial="hidden" animate="show" custom={4}>
          {stats.map(s => (
            <li key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </li>
          ))}
        </motion.ul>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
