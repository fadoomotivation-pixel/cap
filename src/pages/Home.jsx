import React from 'react';
import { motion } from 'framer-motion';
import ProjectShowcase from '../components/ProjectShowcase';
import DholeraInfo from '../components/DholeraInfo';
import ContactForm from '../components/ContactForm';

export default function Home() {
  return (
    <div style={{ paddingTop: '100px' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 5%'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ maxWidth: '800px', pointerEvents: 'none' }}
        >
          <h2 style={{ 
            color: 'var(--accent-primary)',
            fontSize: '1.25rem',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            Exclusive Partner of Mirrikh Group
          </h2>
          <h1 style={{
            fontSize: 'clamp(3rem, 5vw, 5rem)',
            lineHeight: 1.1,
            marginBottom: '2rem'
          }}>
            Curating the Future of <br/>
            <span className="gradient-text">Real Estate</span>
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Experience world-class living and investment opportunities in Dholera Smart City through our exclusive partnerships.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', pointerEvents: 'auto' }}>
            <button className="btn-primary" style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
              Explore Projects
            </button>
            <button className="btn-primary">
              Our Vision
            </button>
          </div>
        </motion.div>
      </section>

      {/* Dholera Info Section */}
      <DholeraInfo />

      {/* Projects Section */}
      <ProjectShowcase />

      {/* Contact Section */}
      <ContactForm />
    </div>
  );
}
