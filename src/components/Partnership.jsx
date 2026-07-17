import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, FileCheck, Handshake, BadgeCheck } from 'lucide-react';
import { partnership, site } from '../data/site';

const icons = { Award, Building2, FileCheck, Handshake };

export default function Partnership() {
  return (
    <section className="section partnership" id="partnership">
      <div className="container">
        <motion.div
          className="partnership__banner"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="partnership__seal" aria-hidden="true">
            <BadgeCheck size={30} />
          </div>
          <p className="section__eyebrow">Official Partnership</p>
          <h2>
            {site.name} × <span className="text-gold">{site.partner}</span>
          </h2>
          <p className="partnership__intro">{partnership.intro}</p>
        </motion.div>

        <div className="grid grid--4">
          {partnership.points.map((p, i) => {
            const Icon = icons[p.icon];
            return (
              <motion.article
                key={p.title}
                className="card"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
              >
                <div className="card__icon">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
