import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const projects = [
  {
    id: 1,
    name: 'Mayur NOVA',
    type: 'Premium Residential',
    features: ['Strategic Location', 'Modern Amenities', 'High ROI'],
    price: 'Inquire for Pricing',
    description: 'A cutting-edge residential development in Dholera Smart City offering astute planning and contemporary infrastructure.'
  },
  {
    id: 2,
    name: 'Mayur Aerocity II',
    type: 'Future-Ready Development',
    features: ['Airport Corridor', 'Excellent Connectivity', 'Smart Infrastructure'],
    price: 'Inquire for Pricing',
    description: 'Positioned strategically near the Dholera International Airport, blending nature with modern innovation for professionals and families.'
  },
  {
    id: 3,
    name: 'Mayur Forest Villa',
    type: 'Premium Smart Villas',
    features: ['Forest Theme', 'Peacock Boulevard', 'Smart Home Automation'],
    price: 'Inquire for Pricing',
    description: 'A tranquil, eco-friendly oasis blending nature with advanced smart home technology. Located just minutes from the upcoming international airport.'
  },
  {
    id: 4,
    name: 'Mayur Greenz Courtyard',
    type: 'Luxury Villa Plots',
    features: ['Mini Golf Course', 'Roman Architecture', 'Mammoth Clubhouse'],
    price: 'Inquire for Pricing',
    description: 'Experience unparalleled luxury with world-class amenities including Dholera\'s first mini golf practice course.'
  },
  {
    id: 5,
    name: 'Mayur Industrial Landmark',
    type: 'Commercial / Industrial',
    features: ['Plug-and-play', 'Logistics Hub', 'DMIC Integration'],
    price: 'High ROI Potential',
    description: 'Aimed at supporting the "Make in India" initiative, offering world-class infrastructure for manufacturing and warehousing.'
  }
];

export default function ProjectShowcase() {
  const [selectedId, setSelectedId] = useState(projects[0].id);

  return (
    <section id="projects" style={{
      minHeight: '100vh',
      padding: '6rem 5%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>
          Mirrikh Portfolio
        </h2>
        <h3 style={{ fontSize: '3rem', margin: 0 }}>
          Featured <span className="gradient-text">Developments</span>
        </h3>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layoutId={`card-container-${project.id}`}
            onClick={() => setSelectedId(project.id)}
            className="glass-panel"
            style={{
              padding: '2rem',
              cursor: 'pointer',
              border: selectedId === project.id ? 'var(--border-accent)' : 'var(--glass-border)',
              boxShadow: selectedId === project.id ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5 }}
          >
            <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{project.name}</h4>
            <p style={{ color: 'var(--accent-primary)', marginBottom: '1rem', fontWeight: '500' }}>{project.type}</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {project.description}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {project.features.map(f => (
                <span key={f} style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '4px 10px', 
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#ccc'
                }}>
                  {f}
                </span>
              ))}
            </div>

            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.1)', 
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Investment</span>
              <strong style={{ color: '#fff' }}>{project.price}</strong>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
