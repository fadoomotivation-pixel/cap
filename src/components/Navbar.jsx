import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { site } from '../data/site';

const links = [
  { href: '/about', label: 'About Us' },
  { href: '/dholera', label: 'Dholera SIR' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav__inner">
        <Link to="/" className="nav__brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Capital Brix Logo" style={{ height: '50px', width: 'auto', borderRadius: '50%', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)' }} />
          <div className="nav__name">
            Capital <em>Brix</em>
            <small>A Global Expert</small>
          </div>
        </Link>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {links.map(l => (
            <Link 
              key={l.href} 
              to={l.href} 
              onClick={() => setOpen(false)}
              style={{ color: location.pathname === l.href ? 'var(--gold-2)' : '' }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/contact" className="btn btn--gold nav__cta" onClick={() => setOpen(false)}>
            <Phone size={16} /> Enquire Now
          </Link>
        </nav>

        <button
          className="nav__toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
