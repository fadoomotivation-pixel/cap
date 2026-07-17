import React from 'react';
import { motion } from 'framer-motion';
import { process } from '../data/site';

export default function Process() {
  return (
    <section className="section section--alt" id="process">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">Simple &amp; Transparent</p>
          <h2>
            From Enquiry to <span className="text-gold">Registered Sale Deed</span> in 4 Steps
          </h2>
        </motion.div>

        <div className="grid grid--4">
          {process.map((s, i) => (
            <motion.article
              key={s.step}
              className="step"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <span className="step__num">{s.step}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
