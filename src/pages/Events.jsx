import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { events } from '../data/events';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getEvent } from '../data/eventDetails';
import Seo from '../components/Seo';
import { pageSeo } from '../lib/seo';

function getEventMeta(event) {
  const parts = (event.date || '').trim().split(/\s+/);
  let dateInfo;
  let year = '2024';

  if (parts.length === 3) {
    year = parts[2];
    dateInfo = {
      day: parts[0].padStart(2, '0'),
      month: parts[1].toUpperCase(),
      year: parts[2],
    };
  } else if (/^\d{4}$/.test(parts[0])) {
    year = parts[0];
    dateInfo = {
      day: 'SUMMIT',
      month: 'ANNUAL',
      year: parts[0],
    };
  } else {
    dateInfo = {
      day: 'MEET',
      month: 'EVENT',
      year: event.date || 'ARCHIVE',
    };
  }

  let categoryTag = 'Investor Meet';
  let displayTitle = event.title;
  let descriptionText = `Investor briefing on Dholera SIR infrastructure, master planning, and land opportunities in ${event.location}.`;

  if (event.title === 'SPARK 2024') {
    categoryTag = 'Annual Convention';
    displayTitle = 'SPARK 2024 Investor Summit';
    descriptionText = 'Annual channel partners & major investors meet in Delhi focusing on Dholera SIR project milestones.';
  } else if (event.title === 'Vibrant Gujarat 2024') {
    categoryTag = 'Global Summit';
    displayTitle = 'Vibrant Gujarat Global Summit 2024';
    descriptionText = 'Participation at Gandhinagar showcasing smart city industrial zoning and trunk infrastructure.';
  } else if (event.title.startsWith('GPBS')) {
    categoryTag = 'Trade Expo';
    displayTitle = `${event.title} Business Summit`;
    descriptionText = `Business convention delegation in ${event.location} presenting residential and industrial plots in Dholera SIR.`;
  } else if (event.title === 'IVY 2024') {
    categoryTag = 'Business Expo';
    displayTitle = 'IVY 2024 Industry Expo';
    descriptionText = 'Surat trade expo showcasing Dholera Special Investment Region masterplan and connectivity.';
  } else if (event.title.includes('Awareness')) {
    categoryTag = 'Awareness Seminar';
    displayTitle = `Dholera SIR Awareness Seminar`;
    descriptionText = `Public awareness programme in ${event.location} on town planning schemes, title verification, and NA plots.`;
  } else if (event.title === 'Mirrikh Event') {
    categoryTag = 'Investor Meet';
    displayTitle = `Dholera Investor Meet — ${event.location}`;
    descriptionText = `Executive investor meet in ${event.location} hosted by Mirrikh Infratech with ground development briefings.`;
  }

  return { dateInfo, categoryTag, displayTitle, descriptionText, year };
}

export default function Events() {
  const [selectedYear, setSelectedYear] = useState('all');
  
  // Newest first. `sort` exists precisely because "2024" and "29 Dec 2024"
  // cannot be compared as text.
  const ordered = useMemo(() => {
    const list = [...events].map((e) => ({ ...e, meta: getEventMeta(e) }));
    list.sort((a, b) => (b.sort || '').localeCompare(a.sort || ''));
    return list;
  }, []);

  const years = useMemo(() => {
    const set = new Set(ordered.map((e) => e.meta.year));
    return ['all', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [ordered]);

  const filteredEvents = useMemo(() => {
    if (selectedYear === 'all') return ordered;
    return ordered.filter((e) => e.meta.year === selectedYear);
  }, [ordered, selectedYear]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50 font-outfit">
      <Seo {...pageSeo.events} />

      {/* Header */}
      <div className="bg-[#10243E] text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Events</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Success celebrations, awareness programmes and exhibitions hosted by
            Mirrikh Infratech Pvt. Ltd., the developer whose Dholera projects Capital Brix
            markets as an authorised sales channel partner.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* The one event currently taking registrations sits above the archive
            below — otherwise the live seminar is buried under years of past
            ones and nobody signs up. */}
        <UpcomingEvent />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-4 mb-8">
          <div>
            <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-1.5">Archive Ledger</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#10243E] leading-tight">Where we have been</h2>
          </div>
          
          {/* Year Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {years.map((yr) => {
              const count = yr === 'all' ? ordered.length : ordered.filter((e) => e.meta.year === yr).length;
              const active = selectedYear === yr;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-[#10243E] text-[#D4AF37] shadow-sm'
                      : 'bg-white text-gray-600 hover:text-[#10243E] border border-gray-200'
                  }`}
                >
                  {yr === 'all' ? 'All' : yr} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Executive Conference Ledger Cards — Designed to look authoritative,
            structured, and intentional without requiring any photos. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, i) => {
            const { meta } = event;
            return (
              <motion.article
                key={`${event.title}-${event.location}-${event.date}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
                className="group relative bg-white rounded-xl border border-gray-200/90 hover:border-[#D4AF37] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top luxury accent stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#10243E] via-[#9C7C1C] to-[#D4AF37]" />

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Date badge & Status pill */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Executive Calendar Stamp */}
                        <div className="shrink-0 w-14 h-14 rounded-lg bg-[#10243E] text-white flex flex-col items-center justify-center shadow-inner border border-white/10">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#D4AF37] leading-none">
                            {meta.dateInfo.month}
                          </span>
                          <span className="font-heading text-lg font-bold leading-tight my-0.5 text-white">
                            {meta.dateInfo.day}
                          </span>
                          <span className="text-[9px] text-gray-300 leading-none">
                            {meta.dateInfo.year}
                          </span>
                        </div>

                        <div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#9C7C1C] bg-[#9C7C1C]/10 px-2 py-0.5 rounded">
                            {meta.categoryTag}
                          </span>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {event.date}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 size={11} className="text-emerald-600" /> Concluded
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-heading text-lg font-bold text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug">
                      {meta.displayTitle}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {meta.descriptionText}
                    </p>
                  </div>

                  {/* Location & Host Footer */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-800 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1">
                      <MapPin size={13} className="text-[#9C7C1C] shrink-0" />
                      {event.location}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Mirrikh × Capital Brix
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The live, registerable event. Reads the same source of truth the
 *  registration page and the admin console read, so the two can never
 *  advertise different details. */
function UpcomingEvent() {
  const ev = getEvent('dholera-wealth-2026');
  if (!ev) return null;

  return (
    <Link
      to={`/events/${ev.slug}`}
      className="group block relative overflow-hidden rounded-xl bg-[#0A1016] text-white p-7 sm:p-10 mb-12"
    >
      <div
        aria-hidden
        className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 65%)' }}
      />
      <div className="relative">
        <p className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/35 rounded-full px-3 py-1 mb-4">
          Registrations open
        </p>
        <h2 className="font-heading text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3" style={{ textWrap: 'balance' }}>
          {ev.title}
        </h2>
        <p className="text-white/70 max-w-xl mb-5">{ev.tagline}</p>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80 mb-7">
          <span className="flex items-center gap-2"><CalendarDays size={15} className="text-[#D4AF37]" /> {ev.dateLabel}</span>
          <span className="flex items-center gap-2"><MapPin size={15} className="text-[#D4AF37]" /> {ev.venue}</span>
        </p>
        <span className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0A1016] font-bold px-6 py-3 rounded-sm group-hover:gap-3 transition-all">
          Reserve a free seat <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
