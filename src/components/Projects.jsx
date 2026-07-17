import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Ruler, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { projects, site } from '../data/site';

function ProjectCard({ p, i }) {
  const ref = useRef(null);

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
    `Hi Capital Brix! I'm interested in ${p.name} (${p.type}) in Dholera. Please share the plot layout, pricing and payment plan.`
  )}`;

  return (
    <motion.article
      className="project"
      style={{ '--accent': p.accent }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (i % 2) * 0.12 }}
    >
      <div className="project__tilt" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
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
          <Ruler size={15} /> Plot sizes: {p.size}
        </p>

        <ul className="project__points">
          {p.highlights.map(h => (
            <li key={h}>
              <BadgeCheck size={15} /> {h}
            </li>
          ))}
        </ul>

        <div className="project__actions">
          <a className="btn btn--gold" href={wa} target="_blank" rel="noreferrer">
            Get Price List <ArrowUpRight size={16} />
          </a>
          <a className="btn btn--ghost" href="#contact">
            Enquire
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export default function Projects() {
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
          <p className="section__eyebrow">Our Projects</p>
          <h2>
            Handpicked Plots in the <span className="text-gold">Dholera Growth Corridor</span>
          </h2>
          <p className="section__sub">
            Every project is NA-approved, NOC cleared, title clear and plan passed — sold
            with a registered sale deed. No exceptions.
          </p>
        </motion.div>

        <div className="grid grid--2">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
