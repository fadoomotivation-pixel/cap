import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, Cpu, Plane, Route, TrendingUp, ShieldCheck } from 'lucide-react';
import { whyDholera } from '../data/site';

const icons = { Landmark, Cpu, Plane, Route, TrendingUp, ShieldCheck };

export default function WhyDholera() {
  return (
    <section className="section" id="why-dholera">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">The Opportunity</p>
          <h2>
            Why <span className="text-gold">Dholera Smart City</span> Is India&rsquo;s
            Biggest Land Story
          </h2>
          <p className="section__sub">
            A government-notified Special Investment Region on the Delhi–Mumbai Industrial
            Corridor — 920 km² of planned city, being built from scratch.
          </p>
        </motion.div>

        <div className="grid grid--3">
          {whyDholera.map((item, i) => {
            const Icon = icons[item.icon];
            return (
              <motion.article
                key={item.title}
                className="card card--tilt"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.12 }}
              >
                <div className="card__icon">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
