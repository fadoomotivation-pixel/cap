import React, { useEffect, useState } from 'react';
import { Phone, Menu, X } from 'lucide-react';
import { site } from '../data/site';

const links = [
  { href: '#why-dholera', label: 'Why Dholera' },
  { href: '#projects', label: 'Projects' },
  { href: '#connectivity', label: 'Location' },
  { href: '#process', label: 'How It Works' },
  { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
<<<<<<< HEAD
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
=======
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand" aria-label={site.name}>
          <span className="nav__logo">CB</span>
          <span className="nav__name">
            Capital <em>Brix</em>
            <small>{site.tagline}</small>
          </span>
        </a>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#contact" className="btn btn--gold nav__cta" onClick={() => setOpen(false)}>
            <Phone size={16} /> Enquire Now
          </a>
        </nav>

        <button
          className="nav__toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
>>>>>>> 4e6139f1334cd7a63e829d2a317c2db4fb252bce
      </div>
    </header>
  );
}
