import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="glass-panel" style={{
      position: 'fixed',
      top: '1rem',
      left: '5%',
      right: '5%',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100
    }}>
      <div className="logo" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.5rem',
        fontWeight: '700',
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Capital Brix Logo" style={{ height: '40px', width: 'auto', borderRadius: '50%' }} />
          <span><span className="gradient-text">Capital</span> Brix</span>
        </Link>
      </div>

      <nav style={{
        display: 'flex',
        gap: '2rem'
      }}>
        <Link to="#about" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>About</Link>
        <Link to="#ventures" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Ventures</Link>
        <Link to="#projects" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Projects</Link>
        <Link to="#contact" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Contact</Link>
      </nav>

      <button className="btn-primary">
        Book Consultation
      </button>
    </header>
  );
}
