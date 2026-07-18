import React from 'react';
import { Link } from 'react-router-dom';

const YTIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.7 12.57 12.57 0 00-8.45 0 4.83 4.83 0 01-3.77 2.7A48.78 48.78 0 002 12a48.78 48.78 0 001.6 5.31 4.83 4.83 0 003.77 2.7 12.57 12.57 0 008.45 0 4.83 4.83 0 003.77-2.7A48.78 48.78 0 0022 12a48.78 48.78 0 00-2.41-5.31zM10 15V9l5 3z"/></svg>);
const IGIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>);
const LIIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);
const XIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const FBIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);

const socials = [
  { icon: <YTIcon />, href: 'https://www.youtube.com/@mirrikhinfratech', label: 'YouTube' },
  { icon: <IGIcon />, href: 'https://www.instagram.com/mirrikhinfratech/', label: 'Instagram' },
  { icon: <LIIcon />, href: 'https://www.linkedin.com/company/mirrikh/', label: 'LinkedIn' },
  { icon: <XIcon />, href: 'https://twitter.com/mirrikhinfra', label: 'X' },
  { icon: <FBIcon />, href: 'https://www.facebook.com/mirrikhinfratech', label: 'Facebook' },
];

const currentProjects = [
  { name: 'Mayur NOVA', path: '/projects/mayur-nova' },
  { name: 'Mayur Aerocity II', path: '/projects/mayur-aerocity-ii' },
  { name: 'Mayur Park III', path: '/projects/mayur-park-iii' },
  { name: 'Mayur Forest Villa', path: '/projects/mayur-forest-villa' },
  { name: 'Mayur Greenz Courtyard', path: '/projects/mayur-greenz-courtyard' },
  { name: 'Mayur Ananta II', path: '/projects/mayur-ananta-ii' },
  { name: 'Mayur Industrial Landmark', path: '/projects/mayur-industrial-landmark' },
];

export default function Footer() {
  return (
    <footer className="bg-[#10243E] text-white">
      {/* Top CTA Strip */}
      <div className="bg-[#f26522] py-5">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-bold text-white text-lg text-center md:text-left">
            Ready to invest in Dholera Smart City? Get direct developer pricing today!
          </p>
          <Link
            to="/contact"
            className="bg-white text-[#f26522] font-bold px-8 py-3 rounded-sm hover:bg-gray-100 transition-colors whitespace-nowrap text-sm uppercase tracking-wide"
          >
            Book A Plot
          </Link>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Col 1: Brand */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <span className="font-black text-2xl text-white leading-none block tracking-tight">Capital Brix</span>
              <span className="text-[10px] text-[#f26522] font-bold uppercase tracking-[0.15em] mt-1 block">Exclusive Channel Partner</span>
              <span className="text-xs text-white/60 mt-0.5 block">Mirrikh Infratech Pvt. Ltd.</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Bringing the best investment opportunities in India's first greenfield smart city — Dholera SIR — with 100% transparent and legal transactions.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#f26522] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: About Dholera SIR */}
          <div>
            <h4 className="text-[#f26522] font-bold uppercase tracking-wider text-sm mb-5 pb-2 border-b border-white/10">
              About Dholera SIR
            </h4>
            <ul className="space-y-2.5 text-white/70 text-sm">
              <li><Link to="/dholera" className="hover:text-[#f26522] transition-colors">About Dholera SIR</Link></li>
              <li><Link to="/dholera" className="hover:text-[#f26522] transition-colors">City Highlights</Link></li>
              <li><Link to="/dholera" className="hover:text-[#f26522] transition-colors">Dholera International Airport</Link></li>
              <li><Link to="/dholera" className="hover:text-[#f26522] transition-colors">Ahmedabad–Dholera Expressway</Link></li>
              <li><Link to="/dholera" className="hover:text-[#f26522] transition-colors">Dholera Renew Power</Link></li>
            </ul>
          </div>

          {/* Col 3: About Us */}
          <div>
            <h4 className="text-[#f26522] font-bold uppercase tracking-wider text-sm mb-5 pb-2 border-b border-white/10">
              About Capital Brix
            </h4>
            <ul className="space-y-2.5 text-white/70 text-sm">
              <li><Link to="/about" className="hover:text-[#f26522] transition-colors">Who We Are</Link></li>
              <li><Link to="/about" className="hover:text-[#f26522] transition-colors">Our Story</Link></li>
              <li><Link to="/about" className="hover:text-[#f26522] transition-colors">Why Choose Us</Link></li>
              <li><Link to="/contact" className="hover:text-[#f26522] transition-colors">Plan A Site Visit</Link></li>
              <li><Link to="/contact" className="hover:text-[#f26522] transition-colors">Book A Plot</Link></li>
            </ul>
          </div>

          {/* Col 4: Quick Links */}
          <div>
            <h4 className="text-[#f26522] font-bold uppercase tracking-wider text-sm mb-5 pb-2 border-b border-white/10">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-white/70 text-sm">
              <li><Link to="/projects" className="hover:text-[#f26522] transition-colors">All Projects</Link></li>
              <li><Link to="/contact" className="hover:text-[#f26522] transition-colors">Contact Us</Link></li>
              <li><a href="tel:917048917300" className="hover:text-[#f26522] transition-colors">+91 70489 17300</a></li>
              <li><a href="mailto:info@capitalbrix.com" className="hover:text-[#f26522] transition-colors">info@capitalbrix.com</a></li>
              <li><a href={`https://wa.me/917048917300`} target="_blank" rel="noreferrer" className="hover:text-[#f26522] transition-colors">WhatsApp Us</a></li>
            </ul>
          </div>

          {/* Col 5: Current Projects */}
          <div>
            <h4 className="text-[#f26522] font-bold uppercase tracking-wider text-sm mb-5 pb-2 border-b border-white/10">
              Current Projects
            </h4>
            <ul className="space-y-2.5 text-white/70 text-sm">
              {currentProjects.map((p) => (
                <li key={p.name}>
                  <Link to={p.path} className="hover:text-[#f26522] transition-colors">{p.name}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Office Address */}
        <div className="border-t border-white/10 mt-12 pt-10">
          <h4 className="text-[#f26522] font-bold uppercase tracking-wider text-sm mb-5">Office</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-white/60 text-sm">
            <div>
              <p className="text-white font-semibold mb-1">Capital Brix (Noida)</p>
              <p>A-118, 6th Floor, The Diamond,<br />Sector 136, Noida – 201304</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Mirrikh Infratech (Corporate)</p>
              <p>802/707, The Montessa, Dumas Road,<br />Surat – 395007, Gujarat</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Mirrikh Infratech (Ahmedabad)</p>
              <p>#707, Navratna Corporate Park, Bopal–Ambali Road,<br />Ahmedabad – 380058</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#0b1a2c]">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-white/50 text-xs">
          <p>© {new Date().getFullYear()} Capital Brix LLP. Exclusive Channel Partner of Mirrikh Infratech Pvt. Ltd. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Terms &amp; Conditions</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
