import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

// Inline SVG social icons to avoid lucide version issues
const YTIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.7 12.57 12.57 0 00-8.45 0 4.83 4.83 0 01-3.77 2.7A48.78 48.78 0 002 12a48.78 48.78 0 001.6 5.31 4.83 4.83 0 003.77 2.7 12.57 12.57 0 008.45 0 4.83 4.83 0 003.77-2.7A48.78 48.78 0 0022 12a48.78 48.78 0 00-2.41-5.31zM10 15V9l5 3z"/>
  </svg>
);
const IGIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const LIIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const FBIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Dholera SIR', path: '/dholera' },
  { name: 'About Us', path: '/about' },
  {
    name: 'Our Projects',
    path: '/projects',
    hasDropdown: true,
    // Two-column dropdown: ongoing (left) + sold-out (right) — exact mirrikh.com order
    ongoing: [
      { name: 'Mayur NOVA', path: '/projects/mayur-nova' },
      { name: 'Mayur Aerocity II', path: '/projects/mayur-aerocity-ii' },
      { name: 'Mayur Park III', path: '/projects/mayur-park-iii' },
      { name: 'Mayur Forest Villa', path: '/projects/mayur-forest-villa' },
      { name: 'Mayur Greenz Courtyard', path: '/projects/mayur-greenz-courtyard' },
      { name: 'Mayur Ananta II', path: '/projects/mayur-ananta-ii' },
      { name: 'Mayur Industrial Landmark', path: '/projects/mayur-industrial-landmark' },
    ],
    soldOut: [
      { name: 'Mayur Signature', path: '/projects/mayur-signature' },
      { name: 'Mayur Enclave 5', path: '/projects/mayur-enclave-5' },
      { name: 'Mayur Swastik', path: '/projects/mayur-swastik' },
      { name: 'Mayur Greenz III', path: '/projects/mayur-greenz-iii' },
      { name: 'Mayur KALP', path: '/projects/mayur-kalp' },
      { name: 'Mayur Evana', path: '/projects/mayur-evana' },
      { name: 'Mayur Aerocity', path: '/projects/mayur-aerocity' },
      { name: 'Mayur Industrial Hub', path: '/projects/mayur-industrial-hub' },
      { name: 'Mayur Greenz II', path: '/projects/mayur-greenz-ii' },
      { name: 'Mayur Enclave 4', path: '/projects/mayur-enclave-4' },
      { name: 'Mayur Iconic', path: '/projects/mayur-iconic' },
      { name: 'Mayur Greenz', path: '/projects/mayur-greenz' },
      { name: 'Mayur Ananta', path: '/projects/mayur-ananta' },
      { name: 'Mayur Enclave III', path: '/projects/mayur-enclave-iii' },
      { name: 'Mayur Industrial Park II', path: '/projects/mayur-industrial-park-ii' },
    ]
  },
  { name: 'Events', path: '#' },
  { name: 'Our Blog', path: '#' },
  { name: 'Contact', path: '/contact' },
];

const socialLinks = [
  { icon: <YTIcon />, href: 'https://www.youtube.com/@mirrikhinfratech', label: 'YouTube' },
  { icon: <IGIcon />, href: 'https://www.instagram.com/mirrikhinfratech/', label: 'Instagram' },
  { icon: <LIIcon />, href: 'https://www.linkedin.com/company/mirrikh/', label: 'LinkedIn' },
  { icon: <XIcon />, href: 'https://twitter.com/mirrikhinfra', label: 'X' },
  { icon: <FBIcon />, href: 'https://www.facebook.com/mirrikhinfratech', label: 'Facebook' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  return (
    <header className="fixed w-full top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3 flex justify-between items-center gap-6">

        {/* ── Logo ── */}
        <Link to="/" className="flex-shrink-0 flex items-end gap-1.5">
          <div className="flex flex-col">
            <span className="font-extrabold text-[22px] text-[#10243E] leading-none tracking-tight">Capital Brix</span>
            <span className="text-[10px] text-[#f26522] font-bold uppercase tracking-[0.15em] mt-0.5">Exclusive Partner</span>
          </div>
        </Link>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden lg:flex items-center gap-1 text-[14.5px] font-medium text-[#10243E]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <div
                key={link.name}
                className="relative group"
                onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.path}
                  className={`px-3 py-2 rounded transition-colors hover:text-[#f26522] ${isActive ? 'text-[#f26522]' : ''}`}
                >
                  {link.name}
                  {link.hasDropdown && (
                    <span className="ml-1 inline-block text-[10px]">▾</span>
                  )}
                </Link>

                {link.hasDropdown && activeDropdown === link.name && (
                  <div className="absolute top-full left-0 bg-white shadow-2xl border border-gray-100 rounded-sm z-50 flex"
                    style={{ minWidth: '540px' }}>
                    {/* Left: Ongoing / Current */}
                    <div className="w-[240px] py-3 border-r border-gray-100">
                      <p className="px-4 py-1.5 text-[10px] font-black text-[#10243E] uppercase tracking-[0.2em]">Current Projects</p>
                      {link.ongoing.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-4 py-2 text-sm text-[#10243E] hover:text-[#f26522] hover:bg-orange-50 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="px-4 pt-3 mt-1 border-t border-gray-100">
                        <Link
                          to="/projects"
                          onClick={() => setActiveDropdown(null)}
                          className="text-[#f26522] text-xs font-bold hover:underline"
                        >
                          Sold Out Projects →
                        </Link>
                      </div>
                    </div>
                    {/* Right: Sold Out */}
                    <div className="w-[270px] py-3 bg-gray-50">
                      <p className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sold Out</p>
                      {link.soldOut.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-4 py-1.5 text-sm text-gray-500 hover:text-[#f26522] hover:bg-orange-50 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Right: Socials + Search + Login ── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <button aria-label="Search" className="w-8 h-8 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors">
            <Search size={20} />
          </button>
          <button className="bg-[#f26522] text-white px-7 py-2 rounded-sm hover:bg-[#d65116] transition-colors font-semibold text-sm ml-1">
            Login
          </button>
        </div>

        {/* ── Mobile Burger ── */}
        <button
          className="lg:hidden text-[#10243E] p-1"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-y-auto max-h-[80vh]">
          {navLinks.map((link) => (
            <div key={link.name}>
              <Link
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-6 py-3.5 font-medium text-[#10243E] hover:text-[#f26522] hover:bg-orange-50 border-b border-gray-50 transition-colors"
              >
                {link.name}
              </Link>
              {link.hasDropdown && link.ongoing && link.ongoing.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-10 py-2 text-sm text-gray-600 hover:text-[#f26522] hover:bg-orange-50 border-b border-gray-50 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              {link.hasDropdown && link.soldOut && (
                <>
                  <div className="px-10 py-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50">Sold Out</div>
                  {link.soldOut.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="block px-10 py-1.5 text-sm text-gray-400 hover:text-[#f26522] hover:bg-orange-50 border-b border-gray-50 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          ))}
          <div className="px-6 py-4 flex gap-4 items-center">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
