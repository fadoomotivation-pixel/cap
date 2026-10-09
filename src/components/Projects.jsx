import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, MessageCircle, CalendarCheck, BadgeCheck } from 'lucide-react';
import { projects, site } from '../data/site';
import { track } from '../lib/track';
import BlogArt from './BlogArt';

// Cover art per project. Real images are files WE host in public/projects/
// (Mirrikh gave permission for their project images on 10 Sep 2026) — never a
// URL on someone else's server, which is what once rendered seven empty boxes.
// A project without an image falls back to generated SVG art.
//
// The five `verified: true` projects come first: their units, village and
// starting price are printed in Mirrikh's own collateral. Each card carries
// its own call / WhatsApp / site-visit row, OUTSIDE the card link (a link
// inside a link is invalid HTML and breaks on some phones).
const TONES = ['gold', 'navy', 'teal', 'green', 'sky', 'violet', 'indigo', 'amber'];

const STATUS_STYLE = {
  'Now Selling': 'bg-[#D4AF37] text-[#0A1016]',
  'New Launch':  'bg-[#D4AF37] text-[#0A1016]',
  'Pre-Launch':  'bg-white text-[#0A1016]',
  Ongoing:       'bg-white/15 text-white backdrop-blur-sm',
  Delivered:     'bg-white/15 text-white backdrop-blur-sm',
};

export const projectSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');

export const projectWhatsApp = (p) =>
  `https://wa.me/${site.phone}?text=${encodeURIComponent(
    `Hi Capital Brix! I'm interested in ${p.name} (${p.location}). Please share the current price, availability and layout.`
  )}`;

/** Call · WhatsApp · Site visit — the three ways people actually enquire. */
export function ProjectCtas({ p, compact = false, dark = false }) {
  const id = projectSlug(p.name);
  const base = compact
    ? 'flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] rounded-sm transition-colors'
    : 'inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] rounded-sm transition-colors';
  const ghost = dark
    ? 'border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]'
    : 'border border-gray-200 text-[#10243E] hover:border-[#D4AF37] hover:text-[#9C7C1C]';
  return (
    <div className={`flex ${compact ? 'gap-2' : 'flex-wrap gap-3'}`}>
      <a
        href={`tel:+${site.phone}`}
        data-cta={`project-call:${id}`}
        onClick={() => track('cta_click', { cta_id: 'project-call', project: id })}
        className={`${base} ${ghost}`}
        aria-label={`Call Capital Brix about ${p.name}`}
      >
        <Phone size={13} /> Call
      </a>
      <a
        href={projectWhatsApp(p)}
        target="_blank"
        rel="noreferrer"
        data-cta={`project-whatsapp:${id}`}
        onClick={() => track('cta_click', { cta_id: 'project-whatsapp', project: id })}
        className={`${base} ${ghost}`}
        aria-label={`WhatsApp Capital Brix about ${p.name}`}
      >
        <MessageCircle size={13} /> WhatsApp
      </a>
      <Link
        to="/contact"
        data-cta={`project-visit:${id}`}
        onClick={() => track('cta_click', { cta_id: 'project-visit', project: id })}
        className={`${base} bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016]`}
        aria-label={`Book a site visit to ${p.name}`}
      >
        <CalendarCheck size={13} /> Site visit
      </Link>
    </div>
  );
}

function ProjectCard({ p, i }) {
  const id = projectSlug(p.name);
  const hasPrice = p.price && p.price !== 'On Request';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <Link to={`/projects/${id}`} className="group block">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-sm ${p.image ? 'bg-gray-100' : 'bg-[#0A1016]'}`}>
          {p.image ? (
            <img
              src={p.image}
              alt={p.imageAlt || `${p.name} — ${p.type.toLowerCase()}, developed by Mirrikh Infratech`}
              width={p.imageW || 1200}
              height={p.imageH || 900}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <>
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
            </>
          )}

          <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm ${
            p.image ? (p.status === 'Now Selling' ? STATUS_STYLE['Now Selling'] : 'bg-[#0A1016] text-white') : STATUS_STYLE[p.status] || 'bg-white/15 text-white backdrop-blur-sm'
          }`}>
            {p.status}
          </span>
        </div>

        <div className="pt-4">
          <p className="text-[#9C7C1C] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">{p.type}</p>
          <h3 className="font-heading text-2xl text-[#10243E] leading-tight mb-2 group-hover:text-[#9C7C1C] transition-colors">
            {p.name}
          </h3>
          <p className="flex items-start gap-2 text-sm text-gray-500 mb-3">
            <MapPin size={14} className="text-[#9C7C1C] shrink-0 mt-0.5" />
            <span className="leading-snug">{p.location}</span>
          </p>

          <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-gray-100 pt-3">
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400">{p.units ? 'Project' : 'Plot sizes'}</dt>
              <dd className="text-sm text-[#10243E] font-medium">{p.units || p.size || 'Multiple sizes'}</dd>
            </div>
            <div className="ml-auto text-right">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400">
                {hasPrice ? 'Starting at' : 'Pricing'}
              </dt>
              <dd className={`text-sm font-semibold ${hasPrice ? 'text-[#9C7C1C]' : 'text-[#10243E]'}`}>
                {hasPrice ? p.price : (p.priceUnit === 'Price on request' ? 'Price on request' : 'On request')}
              </dd>
            </div>
          </dl>

          {p.verified && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
              <BadgeCheck size={13} className="text-[#9C7C1C] shrink-0" />
              NA, NOC, Title Clear &amp; Unit Plan Pass
            </p>
          )}
        </div>
      </Link>

      <div className="mt-auto pt-4">
        <ProjectCtas p={p} compact />
      </div>
    </motion.article>
  );
}

/**
 * `variant="home"` — the five verified projects plus one more, with a route to
 * the full list. `variant="all"` — every ongoing project as a card, and the
 * sold-out ones as a plain crawlable link list.
 */
export default function Projects({ variant = 'home' }) {
  const ongoing = projects.filter((p) => p.category !== 'Sold Out');
  const soldOut = projects.filter((p) => p.category === 'Sold Out');
  const verified = ongoing.filter((p) => p.verified);
  const others = ongoing.filter((p) => !p.verified);
  const all = variant === 'all';
  const featured = all ? verified : ongoing.slice(0, 6);

  return (
    <section className="py-20 lg:py-28 bg-white" id="projects">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">
              {all ? 'Now selling' : 'Portfolio'}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-[#1A1A1A] leading-tight">
              {all ? 'Current Mirrikh Infratech projects near Dholera Smart City' : 'Dholera projects by Mirrikh Infratech'}
            </h2>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Developed by Mirrikh Infratech Pvt. Ltd., marketed by Capital Brix LLP as an authorised
              sales channel partner. Every project: NA, NOC, Title Clear &amp; Unit Plan Pass.
            </p>
          </div>
          {!all && (
            <Link
              to="/projects"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-[#10243E] border-b border-[#D4AF37] pb-1 hover:text-[#9C7C1C] hover:gap-3 transition-all"
            >
              All {ongoing.length} current projects <ArrowRight size={15} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {featured.map((p, i) => (
            <div key={p.name} className={!all && i >= 4 ? 'hidden sm:block' : ''}>
              <ProjectCard p={p} i={i} />
            </div>
          ))}
        </div>

        {all && others.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl md:text-3xl font-heading text-[#1A1A1A] mb-2">More Mirrikh projects we market</h2>
            <p className="text-sm text-gray-500 mb-10">Ask us for current pricing and availability on any of these.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {others.map((p, i) => <ProjectCard key={p.name} p={p} i={i + featured.length} />)}
            </div>
          </div>
        )}

        {all && soldOut.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-10">
            <h2 className="text-xl font-heading text-[#1A1A1A] mb-1">Completed and sold-out Mirrikh projects</h2>
            <p className="text-xs text-gray-500 mb-6">Worth seeing on a site visit: they show what a finished Mirrikh layout looks like.</p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
              {soldOut.map((p) => (
                <li key={p.name}>
                  <Link to={`/projects/${projectSlug(p.name)}`} className="group flex items-baseline justify-between gap-3 border-b border-gray-100 py-2.5">
                    <span className="text-sm font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors">{p.name}</span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{p.type.replace(' Plots', '')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!all && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-500">
              Residential plots start at ₹12.75 lakh. Plot rates run from ₹9,250 to about ₹14,950 per sq yd, depending on the project and the plot.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-sm text-sm font-semibold transition-colors"
            >
              Browse all projects <ArrowRight size={16} />
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
