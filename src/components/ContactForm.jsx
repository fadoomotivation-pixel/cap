import React from 'react';
import { motion } from 'framer-motion';

export default function ContactForm() {
  return (
    <section id="contact" style={{
      padding: '8rem 5%',
      position: 'relative',
      zIndex: 10,
      background: 'var(--bg-primary)'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
            Secure Your <span className="gradient-text">Legacy</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '400px' }}>
            Book a site visit or request a detailed portfolio of our Mirrikh properties in Dholera SIR.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email Us</h5>
              <a href="mailto:invest@capitalbrix.co.in" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>invest@capitalbrix.co.in</a>
            </div>
            <div>
              <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Call Us</h5>
              <a href="tel:+919999999999" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>+91 99999 99999</a>
            </div>
            <div>
              <h5 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Corporate Office</h5>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', maxWidth: '300px' }}>
                Centrade Business Park, Noida, Uttar Pradesh, India
              </p>
            </div>
          </div>
        </div>

        <motion.form 
          className="glass-panel"
          style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#fff',
              outline: 'none'
            }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Email Address</label>
            <input type="email" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#fff',
              outline: 'none'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Interested In</label>
            <select style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#fff',
              outline: 'none'
            }}>
              <option value="residential">Mayur Park Series (Residential)</option>
              <option value="luxury">Mayur Greenz (Luxury Villas)</option>
              <option value="commercial">Mayur Industrial Hub (Commercial)</option>
            </select>
          </div>

          <button className="btn-primary" style={{ marginTop: '1rem', background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
            Submit Inquiry
          </button>
        </motion.form>

      </div>
    </section>
  );
}
