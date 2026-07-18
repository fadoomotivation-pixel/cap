import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Ruler, BadgeCheck, ArrowRight } from 'lucide-react';
import { projects, projectFilters } from '../data/site';

function ProjectCard({ p }) {
  const id = p.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col"
    >
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${p.category === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {p.status}
          </span>
          <span className="text-sm font-semibold text-gray-500">{p.type}</span>
        </div>

        <h3 className="text-xl font-heading font-bold text-brand-blue mb-2">{p.name}</h3>
        
        <p className="flex items-center gap-2 text-gray-600 mb-4 text-sm">
          <MapPin size={16} className="text-brand-orange" /> {p.location}
        </p>

        <div className="mb-4">
          <span className="text-2xl font-bold text-brand-blue">{p.price}</span>
          <span className="text-gray-500 ml-1 text-sm">{p.priceUnit}</span>
        </div>

        <p className="flex items-center gap-2 text-gray-600 mb-6 text-sm">
          <Ruler size={16} className="text-brand-orange" /> {p.size}
        </p>

        <ul className="space-y-2 mb-8 flex-grow">
          {p.highlights.map(h => (
            <li key={h} className="flex items-start gap-2 text-sm text-gray-600">
              <BadgeCheck size={16} className="text-brand-orange mt-0.5 flex-shrink-0" /> 
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <Link to={`/projects/${id}`} className="w-full flex justify-center items-center gap-2 border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors py-2 rounded font-semibold">
            View Details <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState('All');
  const visible = projects.filter(p => filter === 'All' || p.category === filter);

  return (
    <section className="section-padding bg-brand-gray" id="projects">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <p className="text-brand-orange font-bold uppercase tracking-wider text-sm mb-2">Mirrikh Infratech Portfolio</p>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-blue mb-4">
            Real Projects. Real Delivery. Real Dholera.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Live inventory from Mirrikh Infratech — 8+ projects delivered in Dholera since
            2012. Every plot NA-approved, NOC cleared, title clear and plan passed.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {projectFilters.map(f => (
            <button
              key={f}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${filter === f ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {visible.map(p => (
              <ProjectCard key={p.name} p={p} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
