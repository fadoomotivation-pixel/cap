import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  IconInfrastructure, IconGovernance, IconPlugPlay, IconSocial,
  IconBusiness, IconExternal, IconLiveWorkPlay, IconTechnology,
  IconSustainability, IconApprovals, IconSecurity, IconInternal,
} from './DholeraIcons';

// ─────────────────────────────────────────────────────────────
// The twelve things Dholera SIR is planned around.
//
// Laid out to the reference the owner supplied: a tinted rounded tile per
// icon, the name in navy, and a small uppercase line under it. Each tile
// carries its own accent, which is what stops twelve items in one brand colour
// reading as a wall.
//
// The icons themselves are still ours — hand-drawn strokes in DholeraIcons.jsx
// rather than the reference PNGs, so they take colour from the tile, stay sharp
// at any size, and raise no question about whose artwork is on our server.
// ─────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: IconInfrastructure, label: 'World-Class Infrastructure', tag: 'Built for generations',        fg: '#3F6EA8', bg: '#EEF3FA' },
  { Icon: IconGovernance,     label: 'Ease of Governance',         tag: 'Simple. Transparent. Efficient.', fg: '#9C7C1C', bg: '#FAF6E9' },
  { Icon: IconPlugPlay,       label: 'Plug & Play',                tag: 'Ready for growth',             fg: '#1E8A72', bg: '#E9F6F2' },
  { Icon: IconSocial,         label: 'Social Infrastructure',      tag: 'People at the core',           fg: '#D2653A', bg: '#FDF0E9' },
  { Icon: IconBusiness,       label: 'Ease of Business',           tag: 'Opportunities without barriers', fg: '#6A5AA8', bg: '#F1EFFA' },
  { Icon: IconExternal,       label: 'External Connectivity',      tag: 'Well connected to the world',  fg: '#2C7F8F', bg: '#E8F4F6' },
  { Icon: IconLiveWorkPlay,   label: 'Live, Work and Play',        tag: 'A vibrant lifestyle',          fg: '#D08A2C', bg: '#FCF3E4' },
  { Icon: IconTechnology,     label: 'Technology',                 tag: 'Enabling a smarter future',    fg: '#6A5AA8', bg: '#F1EFFA' },
  { Icon: IconSustainability, label: 'Sustainability',             tag: 'A greener tomorrow',           fg: '#4A8A3C', bg: '#EDF6EA' },
  { Icon: IconApprovals,      label: 'Fast Track Approvals',       tag: 'From vision to reality',       fg: '#3F6EA8', bg: '#EEF3FA' },
  { Icon: IconSecurity,       label: 'Security',                   tag: 'A safer tomorrow',             fg: '#2F5C8A', bg: '#ECF1F8' },
  { Icon: IconInternal,       label: 'Internal Connectivity',      tag: 'Seamlessly integrated',        fg: '#9C7C1C', bg: '#FAF6E9' },
];

export default function WhatSetsUsApart() {
  // A twelve-tile grid that re-animates on every scroll is punishing on a
  // phone, so the reveal runs once — and not at all if the OS asked for less.
  const still = useReducedMotion();

  return (
    <section className="py-14 lg:py-24 bg-white" aria-labelledby="sets-apart-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">

        <div className="text-center mb-10 lg:mb-16">
          <h2
            id="sets-apart-heading"
            className="font-heading font-semibold text-[#10243E] text-xl sm:text-3xl lg:text-[2.6rem] tracking-[0.14em] uppercase leading-tight"
          >
            A Smarter Tomorrow
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="h-px w-10 sm:w-20 bg-gray-300" />
            <span className="text-gray-500 tracking-[0.3em] uppercase text-[11px] sm:text-sm">Built Today</span>
            <span className="h-px w-10 sm:w-20 bg-gray-300" />
          </div>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10">
          {FEATURES.map(({ Icon, label, tag, fg, bg }, i) => (
            <motion.li
              key={label}
              initial={still ? false : { opacity: 0, y: 16 }}
              whileInView={still ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: still ? 0 : (i % 6) * 0.05 }}
              className="group text-center"
            >
              <div
                className="mx-auto w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-2xl flex items-center justify-center
                           transition-transform duration-300 group-hover:-translate-y-1"
                style={{ backgroundColor: bg, color: fg }}
              >
                <Icon width={34} height={34} aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 font-semibold text-[#10243E] text-[13px] sm:text-[15px] leading-snug px-1">
                {label}
              </h3>
              <p className="mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-gray-400 leading-relaxed px-1">
                {tag}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
