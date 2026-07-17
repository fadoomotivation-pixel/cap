import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Ruler, BadgeCheck, Phone } from 'lucide-react';
import { projects, site } from '../data/site';

export default function ProjectDetail() {
  const { id } = useParams();
  
  // Find project based on URL slug
  const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === id);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(
    `Hi Capital Brix! I'm highly interested in ${project.name} (${project.type}). Please share the brochure, plot layout, and pricing.`
  )}`;

  return (
    <main className="page-padding">
      <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        
        {/* Back Navigation */}
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', textDecoration: 'none', marginBottom: '2rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-2)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
          <ArrowLeft size={16} /> Back to All Projects
        </Link>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'rgba(18, 26, 38, 0.4)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${project.accent}40`,
            borderTop: `4px solid ${project.accent}`,
            borderRadius: '24px',
            padding: '3rem',
            marginBottom: '3rem',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: `${project.accent}20`, color: project.accent, padding: '4px 12px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600 }}>{project.status}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '0.85rem' }}>{project.type}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', color: '#fff', lineHeight: 1.1 }}>
            {project.name}
          </h1>
          
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '1.2rem', marginBottom: '2rem' }}>
            <MapPin size={20} color={project.accent} /> {project.location}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', borderTop: '1px solid var(--line)', paddingTop: '2rem' }}>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Starting Price</div>
              <div style={{ fontSize: '2rem', color: 'var(--gold-2)', fontWeight: 700 }}>{project.price}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{project.priceUnit}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Project Size</div>
              <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ruler size={24} color={project.accent} /> {project.size}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Highlights & Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr lg:1fr 300px', gap: '2rem', alignItems: 'start' }}>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Project Highlights</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {project.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--line-soft)' }}>
                  <BadgeCheck size={24} color={project.accent} style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text)', fontSize: '1.1rem', lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(201, 163, 92, 0.1) 0%, rgba(18, 26, 38, 0.8) 100%)',
              border: '1px solid var(--gold-2)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center',
              position: 'sticky',
              top: '100px'
            }}
          >
            <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Secure Your Plot</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: 1.6 }}>
              {project.status === 'Delivered' 
                ? "This project is delivered. Contact us to find out if any resale plots are available or explore similar upcoming projects." 
                : "Inventory is moving fast. Request the master plan and lock in early-growth pricing before the next revision."}
            </p>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn--gold" style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
              <Phone size={18} /> Request Layout & Price
            </a>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Guaranteed response within 15 minutes.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
