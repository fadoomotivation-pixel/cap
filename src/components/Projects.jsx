import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from '../data/site';

// Project image mapping using Mirrikh CDN or fallback colors
const projectMeta = {
  'Mayur Greenz II':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-3-1.jpg',   tag: 'Residential', hot: true },
  'Mayur Evana':          { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-6-1.jpg',   tag: 'Residential', hot: true },
  'Mayur Enclave 5':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-9-1.jpg',   tag: 'Residential', hot: false },
  'Mayur Signature':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-2-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Swastik':        { img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-5-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Industrial Park':{ img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-6-1.jpg',  tag: 'Industrial',  hot: false },
  'Mayur Greenz':         { img: 'https://mirrikh.com/wp-content/uploads/2023/10/11-2-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Park':           { img: 'https://mirrikh.com/wp-content/uploads/2023/10/11-5-1.jpg',  tag: 'Residential', hot: false },
};

const filters = ['All', 'Residential', 'Industrial', 'Delivered'];

function ProjectCard({ p }) {
  const meta = projectMeta[p.name] || {};
  const id = p.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-sm overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col group"
    >
      {/* Card Image */}
      <div className="relative h-48 bg-[#10243E] overflow-hidden">
        {meta.img ? (
          <img
            src={meta.img}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#10243E] to-[#1a3a5c]">
            <span className="text-white/30 text-5xl font-black">{p.name.split(' ')[1]?.[0] || p.name[0]}</span>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
            p.category === 'Delivered' ? 'bg-green-500 text-white' : 'bg-[#f26522] text-white'
          }`}>
            {p.status}
          </span>
          {meta.tag && (
            <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-[#10243E] text-white">
              {meta.tag}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-[#10243E] mb-1 tracking-tight">{p.name}</h3>
        <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {p.location}
        </p>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-black text-[#f26522]">{p.price}</span>
          <span className="text-gray-400 text-xs">{p.priceUnit}</span>
        </div>

        <p className="text-gray-500 text-sm mb-5 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          {p.size}
        </p>

        <div className="mt-auto">
          <Link
            to={`/projects/${id}`}
            className="block w-full text-center bg-[#10243E] text-white py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide hover:bg-[#f26522] transition-colors"
          >
            Know More
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState('All');
  const visible = projects.filter(p =>
    filter === 'All' ? true
    : filter === 'Delivered' ? p.category === 'Delivered'
    : p.category === filter
  );

  return (
    <section className="py-20 bg-[#F0F5FA]" id="projects">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12">

        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3">Mirrikh Infratech Portfolio</p>
          <h2 className="text-4xl md:text-5xl font-black text-[#10243E] mb-4">
            Our Projects in Dholera
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Every project is NA, NOC, Title Clear and Plan Passed — sold through registered sale deeds.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide transition-colors ${
                filter === f
                  ? 'bg-[#f26522] text-white'
                  : 'bg-white text-[#10243E] border border-gray-200 hover:border-[#f26522] hover:text-[#f26522]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {visible.map(p => <ProjectCard key={p.name} p={p} />)}
          </AnimatePresence>
        </motion.div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            to="/projects"
            className="inline-block bg-[#10243E] text-white px-10 py-4 rounded-sm font-bold uppercase tracking-wide text-sm hover:bg-[#f26522] transition-colors"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
