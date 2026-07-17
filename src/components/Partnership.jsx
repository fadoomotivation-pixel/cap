import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, FileCheck, Handshake } from 'lucide-react';
import { partnership } from '../data/site';

const icons = {
  Award,
  Building2,
  FileCheck,
  Handshake,
};

export default function Partnership() {
  return (
    <section className="section" id="partnership" style={{ position: 'relative', zIndex: 5, marginTop: '-60px' }}>
      <div className="container">
        <motion.div
          className="partnership-box"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          style={{
            background: 'rgba(18, 26, 38, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '4rem 3rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow)'
          }}
        >
          <h2 style={{ marginBottom: '1.5rem' }}>
            <span className="text-gold">{partnership.heading}</span>
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 3.5rem' }}>
            {partnership.intro}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            {partnership.points.map((point, i) => {
              const Icon = icons[point.icon];
              return (
                <motion.div 
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{
                    background: 'rgba(10, 14, 20, 0.4)',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '1px solid var(--line-soft)'
                  }}
                >
                  <div style={{ 
                    width: '50px', height: '50px', 
                    borderRadius: '50%', 
                    background: 'rgba(201, 163, 92, 0.1)', 
                    display: 'grid', placeItems: 'center',
                    color: 'var(--gold-2)',
                    marginBottom: '1.25rem'
                  }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.75rem' }}>{point.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{point.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
