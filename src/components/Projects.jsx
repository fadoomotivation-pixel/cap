import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projects } from '../data/site';

const projectMeta = {
  // Ongoing Projects
  'Mayur NOVA':                 { logo: 'https://mirrikh.com/wp-content/uploads/2026/07/Mayur-NOVA-Logo1-1024x542.png', tag: 'Residential', hot: true },
  'Mayur Aerocity II':          { logo: 'https://mirrikh.com/wp-content/uploads/2026/07/Mayur-Aerocity-II-Logo1-scaled.png', tag: 'Residential', hot: true },
  'Mayur Ananta II':            { logo: 'https://mirrikh.com/wp-content/uploads/2026/02/Mayur-Ananta-logo2.png', tag: 'Residential', hot: false },
  'Mayur Forest Villa':         { logo: 'https://mirrikh.com/wp-content/uploads/2026/05/Mayur-Forest-Villa-Dholera-logo1.jpg', tag: 'Residential', hot: true },
  'Mayur Greenz Courtyard':     { logo: 'https://mirrikh.com/wp-content/uploads/2026/04/Mayur-Greenz-Courtyard-logo.svg', tag: 'Residential', hot: true },
  'Mayur Industrial Landmark':  { logo: 'https://mirrikh.com/wp-content/uploads/2026/01/Mayur-Industrial-Landmark-logo.png', tag: 'Industrial', hot: true },
  'Mayur Park III':             { logo: 'https://mirrikh.com/wp-content/uploads/2025/11/Mayur-Park-3-Logo.png', tag: 'Residential', hot: false },
  
  // Sold Out Projects
  'Mayur Greenz II':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-3-1.jpg',   tag: 'Residential', hot: true },
  'Mayur Evana':          { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-6-1.jpg',   tag: 'Residential', hot: true },
  'Mayur Enclave 5':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/1-9-1.jpg',   tag: 'Residential', hot: false },
  'Mayur Signature':      { img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-2-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Swastik':        { img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-5-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Industrial Park':{ img: 'https://mirrikh.com/wp-content/uploads/2023/10/10-6-1.jpg',  tag: 'Industrial',  hot: false },
  'Mayur Greenz':         { img: 'https://mirrikh.com/wp-content/uploads/2023/10/11-2-1.jpg',  tag: 'Residential', hot: false },
  'Mayur Park':           { img: 'https://mirrikh.com/wp-content/uploads/2023/10/11-5-1.jpg',  tag: 'Residential', hot: false },
};

function ProjectCard({ p }) {
  const meta = projectMeta[p.name] || {};
  const id = p.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-sm overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col group"
    >
      <div className="relative h-56 bg-[#f9fafb] overflow-hidden flex items-center justify-center">
        {meta.logo ? (
          <img
            src={meta.logo}
            alt={`${p.name} Logo`}
            className="w-2/3 h-2/3 object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : meta.img ? (
          <img
            src={meta.img}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-3xl font-bold">{p.name}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow text-center">
        <h3 className="text-xl font-bold text-[#101010] mb-2">{p.name}</h3>
        <p className="text-gray-500 text-sm mb-6">{p.location}</p>
        
        <div className="mt-auto">
          <Link
            to={`/projects/${id}`}
            className="inline-block bg-white border border-[#f37435] text-[#f37435] py-2 px-6 rounded-sm font-semibold text-sm uppercase tracking-wider hover:bg-[#f37435] hover:text-white transition-colors"
          >
            Explore
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const ongoing = projects.filter(p => p.category !== 'Sold Out');
  const soldOut = projects.filter(p => p.category === 'Sold Out');

  return (
    <section className="bg-gray-50 pt-10 pb-20" id="projects">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12">

        {/* Current Projects Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101010] mb-2">Our Current Projects</h2>
          <div className="w-16 h-1 bg-[#f37435] mx-auto"></div>
        </div>

        {/* Current Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-24">
          {ongoing.map(p => <ProjectCard key={p.name} p={p} />)}
        </div>


        {/* Sold Out Projects Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101010] mb-2">Sold Out Projects</h2>
          <div className="w-16 h-1 bg-[#f37435] mx-auto"></div>
        </div>

        {/* Sold Out Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {soldOut.slice(0, 8).map(p => <ProjectCard key={p.name} p={p} />)}
        </div>
        
        <div className="text-center mt-12">
          <Link
            to="/projects"
            className="inline-block bg-[#101010] text-white px-10 py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-[#f37435] transition-colors"
          >
            View All Sold Out Projects
          </Link>
        </div>

      </div>
    </section>
  );
}
