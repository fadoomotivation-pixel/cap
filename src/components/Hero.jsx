import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, PlayCircle } from 'lucide-react';
import { stats } from '../data/site';

// three.js scene alag chunk me — pehla paint fast rehta hai
const HeroScene = lazy(() => import('./canvas/HeroScene'));

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: i => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__content">
        <motion.p className="hero__eyebrow" variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <MapPin size={14} /> Dholera SIR · Gujarat · India&rsquo;s First Greenfield Smart City
        </motion.p>

        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}>
          Own Land in <span className="text-gold">Dholera</span>
          <br />
          Before the World Moves In
        </motion.h1>

        <motion.p className="hero__sub" variants={fadeUp} initial="hidden" animate="show" custom={2}>
          Premium NA-approved, title-clear residential &amp; industrial plots inside the
          Dholera Smart City growth corridor — next to the ₹91,000 Cr semiconductor fab,
          the international airport and the Ahmedabad–Dholera Expressway.
        </motion.p>

        <motion.div className="hero__actions" variants={fadeUp} initial="hidden" animate="show" custom={3}>
          <a href="#projects" className="btn btn--gold btn--lg">
            Explore Projects <ArrowRight size={18} />
          </a>
          <a href="#contact" className="btn btn--ghost btn--lg">
            <PlayCircle size={18} /> Book Free Site Visit
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
