import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Ruler, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { projects, projectFilters, site } from '../data/site';

function ProjectCard({ p }) {
  const ref = useRef(null);
  const delivered = p.category === 'Delivered';

  // 3D tilt on pointer move
  const onMove = e => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${py * -8}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(
    `Hi Capital Brix! I'm interested in ${p.name} (${p.type}) by Mirrikh Infratech in Dholera. Please share the plot layout, pricing and payment plan.`
  )}`;

  const id = p.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div
      layout
      className="project"
      style={{ '--accent': p.accent }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45 }}
    >
      <Link
        to={`/projects/${id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
        className={`project__tilt ${delivered ? 'project__tilt--done' : ''}`}
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div className="project__top">
          <span className="project__status">{p.status}</span>
          <span className="project__type">{p.type}</span>
        </div>

        <h3 className="project__name">{p.name}</h3>
        <p className="project__loc">
          <MapPin size={15} /> {p.location}
        </p>

        <div className="project__price">
          <strong>{p.price}</strong>
          <span>{p.priceUnit}</span>
        </div>

        <p className="project__size">
          <Ruler size={15} /> {p.size}
        </p>

        <ul className="project__points">
          {p.highlights.map(h => (
            <li key={h}>
              <BadgeCheck size={15} /> {h}
            </li>
          ))}
        </ul>

        <div className="project__actions">
          <span className="btn btn--ghost" style={{ width: '100%', justifyContent: 'center' }}>
            View Full Details <ArrowUpRight size={16} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState('All');
  const visible = projects.filter(p => filter === 'All' || p.category === filter);

  return (
    <section className="section section--alt" id="projects">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">Mirrikh Infratech Portfolio</p>
          <h2>
            Real Projects. Real Delivery. <span className="text-gold">Real Dholera.</span>
          </h2>
          <p className="section__sub">
            Live inventory from Mirrikh Infratech — 8+ projects delivered in Dholera since
            2012. Every plot NA-approved, NOC cleared, title clear and plan passed.
          </p>
        </motion.div>

        <div className="filter" role="tablist" aria-label="Filter projects">
          {projectFilters.map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`filter__btn ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid--2">
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
