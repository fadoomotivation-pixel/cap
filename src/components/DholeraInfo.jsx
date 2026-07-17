import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Area', value: '920 sq. km', desc: 'India\'s largest greenfield smart city' },
  { label: 'Tata Semiconductor', value: '₹91,000 Cr', desc: 'Mega fabrication plant investment' },
  { label: 'Solar Park', value: '5,000 MW', desc: 'Massive renewable energy project' },
  { label: 'Connectivity', value: 'Expressway', desc: 'Ahmedabad–Dholera high-speed corridor' }
];

export default function DholeraInfo() {
  return (
    <section id="about" style={{
      padding: '8rem 5%',
      position: 'relative',
      zIndex: 10,
      background: 'linear-gradient(180deg, transparent 0%, rgba(10, 10, 10, 0.9) 100%)'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
            Why Dholera SIR?
          </h2>
          <h3 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>
            The Global <span className="gradient-text">Manufacturing Hub</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.8' }}>
            Dholera Special Investment Region (SIR) is India's first Platinum-Rated Greenfield Smart City. Designed for sustainable living and industrial excellence, it is rapidly becoming the epicenter of global investments.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass-panel"
              style={{
                padding: '2.5rem 2rem',
                borderTop: '3px solid var(--accent-primary)',
                textAlign: 'center'
              }}
            >
              <h4 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                {stat.value}
              </h4>
              <h5 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                {stat.label}
              </h5>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
