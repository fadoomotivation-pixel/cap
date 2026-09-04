import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Maximize2 } from 'lucide-react';
import { projects } from '../data/site';
import BlogArt from './BlogArt';

// Cover art per project. These cards used to render a LOGO hotlinked from
// mirrikh.com inside a 4:3 white box — so the homepage's most important
// commercial section was seven large empty rectangles, and it broke entirely
// whenever their server did. Generated SVG instead, same system as the blog.
const TONES = ['gold', 'navy', 'teal', 'green', 'sky', 'violet', 'indigo', 'amber'];

const STATUS_STYLE = {
  'New Launch':  'bg-[#D4AF37] text-[#0A1016]',
  'Pre-Launch':  'bg-white text-[#0A1016]',
  Ongoing:       'bg-white/15 text-white backdrop-blur-sm',
  Delivered:     'bg-white/15 text-white backdrop-blur-sm',
};

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

function ProjectCard({ p, i }) {
  const id = slug(p.name);
  const hasPrice = p.price && p.price !== 'On Request';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: 'easeOut' }}
    >
      <Link to={`/projects/${id}`} className="group block">
        {/* Cover — the project name lives ON the art, so the card has presence
            even before a photograph exists for it. */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#0A1016]">
          <BlogArt
            tone={TONES[i % TONES.length]}
            seed={i + 3}
            label={p.name}
            className="absolute inset-0 w-full h-full group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(10,16,22,0.88) 0%, rgba(10,16,22,0.25) 55%, rgba(10,16,22,0.1) 100%)' }}
          />

          <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm ${
            STATUS_STYLE[p.status] || 'bg-white/15 text-white backdrop-blur-sm'
          }`}>
            {p.status}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">
              {p.type}
            </p>
            <h3 className="text-white font-heading text-2xl lg:text-[1.65rem] leading-tight">
              {p.name}
            </h3>
          </div>
        </div>

        {/* The facts a plot buyer actually scans for. The old card showed a
            logo, a category and a city — none of which help anyone choose. */}
        <div className="pt-4">
          <p className="flex items-start gap-2 text-sm text-gray-500 mb-3">
            <MapPin size={14} className="text-[#9C7C1C] shrink-0 mt-0.5" />
            <span className="leading-snug">{p.location}</span>
          </p>

          <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-gray-100 pt-3">
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400">Plot sizes</dt>
              <dd className="text-sm text-[#10243E] font-medium truncate">{p.size || 'Multiple sizes'}</dd>
            </div>
            <div className="ml-auto text-right">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400">
                {hasPrice ? 'Starting' : 'Pricing'}
              </dt>
              <dd className={`text-sm font-semibold ${hasPrice ? 'text-[#9C7C1C]' : 'text-[#10243E]'}`}>
                {hasPrice ? p.price : 'On request'}
              </dd>
            </div>
          </dl>

          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#10243E] group-hover:text-[#9C7C1C] group-hover:gap-3 transition-all">
            View project <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Projects() {
  const ongoing = projects.filter((p) => p.category !== 'Sold Out');
  // Six on the homepage, not every one. A shorter grid with a clear route to
  // the full list reads better — and on a phone, where the cards stack into a
  // single column, the last two are hidden entirely: six stacked cards is
  // 3,000px of scroll before anyone reaches the rest of the page.
  const featured = ongoing.slice(0, 6);

  return (
    <section className="py-20 lg:py-28 bg-white" id="projects">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">Portfolio</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-[#1A1A1A] leading-tight">
              Dholera plot projects by Mirrikh Infratech
            </h2>
          </div>
          <Link
            to="/projects"
            className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-[#10243E] border-b border-[#D4AF37] pb-1 hover:text-[#9C7C1C] hover:gap-3 transition-all"
          >
            All {ongoing.length} projects <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {featured.map((p, i) => (
            <div key={p.name} className={i >= 4 ? 'hidden sm:block' : ''}>
              <ProjectCard p={p} i={i} />
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-8">
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Maximize2 size={15} className="text-[#D4AF37]" />
            Every plot is NA-converted, NOC-cleared, title-clear and plan-passed.
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-sm text-sm font-semibold transition-colors"
          >
            Browse all projects <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  );
}
