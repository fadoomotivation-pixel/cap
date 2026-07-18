import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { site } from '../data/site';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed w-full top-0 z-50 transition-all duration-300 shadow-md">
      {/* Top Bar - Mirrikh Blue */}
      <div className={`bg-brand-blue text-white py-2 transition-all duration-300 ${isScrolled ? 'hidden' : 'block'}`}>
        <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="mailto:info@mirrikh.com" className="flex items-center gap-2 hover:text-brand-orange transition-colors">
              <Mail size={14} /> info@mirrikh.com
            </a>
            <a href={`tel:${site.phone}`} className="flex items-center gap-2 hover:text-brand-orange transition-colors">
              <Phone size={14} /> +91 70489 17300
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {/* Social icons removed temporarily */}
          </div>
        </div>
      </div>

      {/* Main Navbar - White */}
      <nav className="bg-white py-4 transition-all duration-300">
        <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center">
          
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Mirrikh Infratech" className="h-12 object-contain" onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2316315c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 22h20'/%3E%3Cpath d='M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18'/%3E%3Cpath d='M10 12h4'/%3E%3C/svg%3E";
            }} />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-brand-blue leading-none">Capital Brix</span>
              <span className="text-[10px] uppercase text-brand-orange font-bold tracking-widest mt-1">Exclusive Partner</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 font-medium text-brand-blue">
            <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
            <Link to="/about" className="hover:text-brand-orange transition-colors">About Us</Link>
            <Link to="/projects" className="hover:text-brand-orange transition-colors">Projects</Link>
            <Link to="/dholera" className="hover:text-brand-orange transition-colors">Dholera SIR</Link>
            <Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link>
            <a href={`https://wa.me/${site.phone}`} target="_blank" rel="noreferrer" className="btn-orange text-sm px-5 py-2">
              Book Plot
            </a>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden text-brand-blue" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-4 font-medium text-brand-blue">
            <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setIsOpen(false)}>About Us</Link>
            <Link to="/projects" onClick={() => setIsOpen(false)}>Projects</Link>
            <Link to="/dholera" onClick={() => setIsOpen(false)}>Dholera SIR</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)}>Contact Us</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
