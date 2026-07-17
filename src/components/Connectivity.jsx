import React from 'react';
import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { connectivity } from '../data/site';

export default function Connectivity() {
  return (
    <section className="section" id="connectivity">
      <div className="container connectivity">
        <motion.div
          className="section__head section__head--left"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">Location Advantage</p>
          <h2>
            Minutes from Everything That <span className="text-gold">Matters</span>
          </h2>
          <p className="section__sub">
            Our projects sit in the direct influence zone of Dholera SIR — where the
            airport, expressway and industrial belt converge.
          </p>
          <a href="#contact" className="btn btn--gold" style={{ marginTop: '1.5rem' }}>
            <Navigation size={16} /> Get Exact Location on WhatsApp
          </a>
        </motion.div>

        <ol className="timeline">
          {connectivity.map((c, i) => (
            <motion.li
              key={c.place}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <span className="timeline__km">{c.km}</span>
              <span className="timeline__place">{c.place}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
