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
// Each tile carries a one-line explanation as well as a label. A grid of
// twelve bare captions ("Technology", "Security") tells a buyer nothing and
// gives Google nothing to index — the sentence is what makes the tile worth
// its space on both counts.
// ─────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: IconInfrastructure, label: 'World-class infrastructure', text: 'Trunk roads, water, power and drainage laid before plots were sold, not after.' },
  { Icon: IconGovernance,     label: 'Ease of governance',         text: 'One development authority for the whole region, under the Gujarat SIR Act.' },
  { Icon: IconPlugPlay,       label: 'Plug and play',              text: 'Utilities already at the plot edge, so an occupier connects instead of building.' },
  { Icon: IconSocial,         label: 'Social infrastructure',      text: 'Hospital, school, hotel and civic amenities planned into the Activation Area.' },
  { Icon: IconBusiness,       label: 'Ease of business',           text: 'A single-window process for approvals rather than department-by-department.' },
  { Icon: IconExternal,       label: 'External connectivity',      text: 'Expressway to Ahmedabad, an international airport and port access nearby.' },
  { Icon: IconLiveWorkPlay,   label: 'Live, work and play',        text: 'Residential, industrial and recreation zones separated by plan, not by accident.' },
  { Icon: IconTechnology,     label: 'Technology',                 text: 'A city command centre and an ICT backbone running under the roads.' },
  { Icon: IconSustainability, label: 'Sustainability',             text: 'Treated water returned for re-use, and solar power generated in the region.' },
  { Icon: IconApprovals,      label: 'Fast-track approvals',       text: 'Clearances handled inside the region rather than routed through the state.' },
  { Icon: IconSecurity,       label: 'Security',                   text: 'Surveillance and emergency response coordinated from the operations centre.' },
  { Icon: IconInternal,       label: 'Internal connectivity',      text: '18 m to 70 m roads on a grid, with utilities in a corridor beneath them.' },
];

export default function WhatSetsUsApart() {
  // A phone is where most of this traffic lands, and a twelve-tile grid that
  // animates on every scroll is exhausting there — so the reveal runs once and
  // is skipped entirely for anyone who asked the OS for less motion.
  const still = useReducedMotion();

  return (
    <section className="py-16 lg:py-24 bg-white" aria-labelledby="sets-apart-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-10 lg:mb-14">
          <p className="text-[#9C7C1C] font-bold uppercase tracking-[0.2em] text-xs mb-3">
            Dholera SIR
          </p>
          <h2 id="sets-apart-heading" className="font-heading text-2xl sm:text-3xl lg:text-4xl text-[#10243E] leading-tight mb-4">
            What sets Dholera apart from every other plot you are shown
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Most land is sold on a promise that infrastructure will follow. Dholera was
            planned the other way round — these twelve things were decided before the
            first plot changed hands.
          </p>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map(({ Icon, label, text }, i) => (
            <motion.li
              key={label}
              initial={still ? false : { opacity: 0, y: 18 }}
              whileInView={still ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: still ? 0 : (i % 4) * 0.06 }}
              // Touch has no hover, so the press state is what gives a phone
              // user any feedback at all that the tile is a real element.
              whileTap={still ? {} : { scale: 0.97 }}
              className="group relative bg-white border border-gray-150 rounded-sm p-4 sm:p-5
                         border-gray-200 hover:border-[#D4AF37] hover:shadow-[0_6px_24px_-12px_rgba(16,36,62,0.35)]
                         transition-colors duration-300 active:border-[#D4AF37]"
            >
              <span className="absolute left-0 top-0 h-full w-[3px] bg-[#D4AF37] scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />
              <div className="w-11 h-11 rounded-sm bg-[#FAF6E9] text-[#9C7C1C] flex items-center justify-center mb-3.5
                              group-hover:bg-[#10243E] group-hover:text-[#D4AF37] transition-colors duration-300">
                <Icon width={22} height={22} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#10243E] text-sm sm:text-[15px] leading-snug mb-1.5">
                {label}
              </h3>
              <p className="text-gray-500 text-xs sm:text-[13px] leading-relaxed">{text}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
