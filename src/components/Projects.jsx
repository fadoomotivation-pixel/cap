import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projects } from '../data/site';

const projectMeta = {
  // Ongoing Projects
  'Mayur NOVA':                 { logo: 'https://mirrikh.com/wp-content/uploads/2026/07/Mayur-NOVA-Logo1-1024x542.png', tag: 'Residential' },
  'Mayur Aerocity II':          { logo: 'https://mirrikh.com/wp-content/uploads/2026/07/Mayur-Aerocity-II-Logo1-scaled.png', tag: 'Residential' },
  'Mayur Ananta II':            { logo: 'https://mirrikh.com/wp-content/uploads/2026/02/Mayur-Ananta-logo2.png', tag: 'Residential' },
  'Mayur Forest Villa':         { logo: 'https://mirrikh.com/wp-content/uploads/2026/05/Mayur-Forest-Villa-Dholera-logo1.jpg', tag: 'Residential' },
  'Mayur Greenz Courtyard':     { logo: 'https://mirrikh.com/wp-content/uploads/2026/04/Mayur-Greenz-Courtyard-logo.svg', tag: 'Residential' },
  'Mayur Industrial Landmark':  { logo: 'https://mirrikh.com/wp-content/uploads/2026/01/Mayur-Industrial-Landmark-logo.png', tag: 'Industrial' },
  'Mayur Park III':             { tag: 'Residential' },
  'Mayur Greenz III':           { tag: 'Residential' },
  'Mayur KALP':                 { tag: 'Residential' },
  'Mayur Aerocity':             { tag: 'Commercial' },
  'Mayur Industrial Hub':       { tag: 'Industrial' },
};

function ProjectCard({ p }) {
  const meta = projectMeta[p.name] || {};
  const id = p.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="group block"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-6">
        {meta.logo ? (
          <div className="w-full h-full flex items-center justify-center p-8 bg-white border border-gray-100">
            <img
              src={meta.logo}
              alt={`${p.name} Logo`}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex flex-col items-center justify-center text-white border border-gray-100 group-hover:scale-105 transition-transform duration-700 ease-out">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase mb-2 text-[#D4AF37]">MAYUR</span>
            <span className="text-3xl font-heading font-light uppercase tracking-wide">
              {p.name.replace('Mayur ', '')}
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-2">{meta.tag || p.category}</p>
        <h3 className="text-2xl font-heading text-[#1A1A1A] mb-1">{p.name}</h3>
        <p className="text-gray-500 text-sm font-light mb-4">{p.location}</p>
        
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] hover:text-[#D4AF37] transition-colors uppercase tracking-widest"
        >
          View Details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const ongoing = projects.filter(p => p.category !== 'Sold Out');

  return (
    <section className="py-24 lg:py-32 bg-white" id="projects">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 lg:mb-24">
          <div className="max-w-2xl">
            <p className="text-[#D4AF37] font-semibold tracking-[0.2em] uppercase text-xs mb-4">Portfolio</p>
            <h2 className="text-4xl md:text-5xl font-heading text-[#1A1A1A] leading-tight">Dholera plot projects by Mirrikh Infratech</h2>
          </div>
          <p className="text-gray-500 font-light mt-6 md:mt-0 max-w-sm text-sm">
            Discover our premium NA-approved plots designed for exceptional appreciation and world-class living in Dholera SIR.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {ongoing.map(p => <ProjectCard key={p.name} p={p} />)}
        </div>

      </div>
    </section>
  );
}
