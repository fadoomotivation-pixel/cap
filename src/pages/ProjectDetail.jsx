import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Ruler, BadgeCheck, Phone } from 'lucide-react';
import { projects, site } from '../data/site';

export default function ProjectDetail() {
  const { id } = useParams();
  
  // Find project based on URL slug
  const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === id);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(
    `Hi Capital Brix! I'm highly interested in ${project.name} (${project.type}). Please share the brochure, plot layout, and pricing.`
  )}`;

  return (
    <main className="pt-32 pb-16 bg-brand-gray min-h-screen">
      <div className="container mx-auto max-w-7xl px-4">
        
        {/* Back Navigation */}
        <Link to="/projects" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors font-medium mb-8">
          <ArrowLeft size={18} /> Back to All Projects
        </Link>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-brand-orange p-8 md:p-12 mb-12"
        >
          <div className="flex gap-4 mb-6 flex-wrap">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${project.category === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-brand-blue/10 text-brand-blue'}`}>
              {project.status}
            </span>
            <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide">
              {project.type}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-brand-blue mb-4">
            {project.name}
          </h1>
          
          <p className="flex items-center gap-2 text-gray-600 text-lg md:text-xl mb-8">
            <MapPin size={24} className="text-brand-orange" /> {project.location}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-8">
            <div>
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Starting Price</div>
              <div className="text-4xl md:text-5xl font-bold text-brand-orange leading-none mb-2">{project.price}</div>
              <div className="text-gray-500 font-medium">{project.priceUnit}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Project Size</div>
              <div className="text-2xl md:text-3xl font-bold text-brand-blue flex items-center gap-3">
                <Ruler size={32} className="text-brand-orange" /> {project.size}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Highlights & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-heading font-bold text-brand-blue mb-6">Project Highlights</h2>
            <div className="grid gap-4">
              {project.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <BadgeCheck size={28} className="text-brand-orange flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-brand-blue rounded-lg shadow-lg border-b-4 border-b-brand-orange p-8 text-center sticky top-32"
          >
            <h3 className="text-2xl font-heading font-bold text-white mb-4">Secure Your Plot</h3>
            <p className="text-white/80 leading-relaxed mb-8">
              {project.status === 'Delivered' 
                ? "This project is delivered. Contact us to find out if any resale plots are available or explore similar upcoming projects." 
                : "Inventory is moving fast. Request the master plan and lock in early-growth pricing before the next revision."}
            </p>
            <a href={wa} target="_blank" rel="noreferrer" className="btn-orange w-full justify-center mb-4 text-lg py-4">
              <Phone size={20} /> Request Layout & Price
            </a>
            <p className="text-white/60 text-sm">Guaranteed response within 15 minutes.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
