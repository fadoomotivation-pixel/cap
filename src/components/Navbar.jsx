import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isProjectsActive = location.pathname.includes('/projects');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dholera SIR', path: '/dholera' },
    { name: 'About Us', path: '/about' },
    { name: 'Our Projects', path: '/projects', hasDropdown: true },
    { name: 'Events', path: '#' },
    { name: 'Our Blog', path: '#' },
    { name: 'Contact', path: '/contact' }
  ];

  const projectsDropdown = [
    'Mayur NOVA',
    'Mayur Aerocity II',
    'Mayur Park III',
    'Mayur Forest Villa',
    'Mayur Greenz Courtyard',
    'Mayur Ananta II',
    'Mayur Industrial Landmark',
    'Sold Out Projects'
  ];

  return (
    <header className="fixed w-full top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src="https://mirrikh.com/wp-content/uploads/2023/10/Group-1355.svg" 
            alt="Mirrikh Group" 
            className="h-12 md:h-14 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/logo.png";
            }}
          />
        </Link>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#10243E]">
          {navLinks.map((link) => (
            <div key={link.name} className="relative group py-4">
              <Link 
                to={link.path} 
                className={`hover:text-[#f15b22] transition-colors ${
                  (link.name === 'Our Projects' && isProjectsActive) || location.pathname === link.path 
                    ? 'text-[#f15b22]' 
                    : ''
                }`}
              >
                {link.name}
              </Link>
              
              {/* Dropdown for Our Projects */}
              {link.hasDropdown && (
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-64 bg-white shadow-xl border border-gray-100 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-2">
                  {projectsDropdown.map((proj) => (
                    <Link 
                      key={proj} 
                      to={`/projects/${proj.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block px-6 py-2.5 text-sm hover:text-[#f15b22] hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      {proj}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Side Icons & Login */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <a href="#" className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors text-xs font-bold">Y</a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors text-xs font-bold">In</a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors text-xs font-bold">L</a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors text-xs font-bold">X</a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#f26522] flex items-center justify-center text-white hover:bg-[#d65116] transition-colors text-xs font-bold">f</a>
          </div>
          
          <button className="text-[#10243E] hover:text-[#f26522] transition-colors mr-2">
            <Search size={20} />
          </button>
          
          <button className="bg-[#f26522] text-white px-8 py-2.5 rounded hover:bg-[#d65116] transition-colors font-medium">
            Login
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-[#10243E]" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-4 font-medium text-[#10243E]">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className="hover:text-[#f26522]">
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
