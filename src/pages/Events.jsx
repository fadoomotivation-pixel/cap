import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { events } from '../data/events';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { getEvent } from '../data/eventDetails';
import Seo from '../components/Seo';
import BlogArt from '../components/BlogArt';
import { pageSeo } from '../lib/seo';

const TONES = ['navy', 'gold', 'teal', 'indigo', 'green', 'violet'];

export default function Events() {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 12;
  
  // Newest first. `sort` exists precisely because "2024" and "29 Dec 2024"
  // cannot be compared as text.
  const ordered = useMemo(
    () => [...events].sort((a, b) => (b.sort || '').localeCompare(a.sort || '')),
    []
  );

  const totalPages = Math.ceil(ordered.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = ordered.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

        <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-4 mb-8">
          <div>
            <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-1.5">Archive</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#10243E] leading-tight">Where we have been</h2>
          </div>
          <p className="text-sm text-gray-400 shrink-0">{events.length} events</p>
        </div>

        {/* A grid, not a stack. Eighteen full-width banners was 9,000px of
            scrolling to read eighteen place names. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {currentEvents.map((event, i) => (
            <motion.article
              key={`${currentPage}-${event.title}-${event.date}-${i}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
            >
              {/* A photograph when we host one ourselves, generated art
                  otherwise. Never an <img src> pointing at someone else's
                  server — that is what left seven empty boxes on the homepage
                  and drew an IP objection. */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#0A1016] border border-gray-100">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={`${event.title}${event.location ? ` in ${event.location}` : ''}, ${event.date}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <BlogArt
                    tone={TONES[(indexOfFirstEvent + i) % TONES.length]}
                    label={`${event.title}${event.location ? ` · ${event.location}` : ''}`}
                    seed={indexOfFirstEvent + i}
                    className="absolute inset-0 w-full h-full"
                  />
                )}
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm bg-[#0A1016]/85 text-white backdrop-blur-sm">
                  {event.date}
                </span>
              </div>

              <h3 className="font-heading text-lg text-[#10243E] leading-snug mt-3">{event.title}</h3>
              {event.location && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin size={13} className="text-[#9C7C1C] shrink-0" /> {event.location}
                </p>
              )}
            </motion.article>
          ))}
        </div>

        {/* Dynamic Pagination */}
        {totalPages > 1 && (
          <div className="mt-20 flex items-center justify-center gap-2 text-base font-medium flex-wrap">
            {[1, 2, 3].map((number) => (
              number <= totalPages && (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 flex items-center justify-center transition-colors rounded-sm ${
                    currentPage === number
                      ? 'bg-[#D4AF37] text-[#0A1016]'
                      : 'text-[#10243E] hover:text-[#9C7C1C] hover:bg-gray-100 bg-white border border-gray-200'
                  }`}
                >
                  {number}
                </button>
              )
            ))}

            {currentPage < totalPages && (
              <button 
                onClick={() => paginate(currentPage + 1)}
                className="px-4 h-10 flex items-center justify-center text-[#10243E] bg-white border border-gray-200 hover:text-[#9C7C1C] hover:border-[#D4AF37] transition-colors ml-2 rounded-sm"
              >
                Next →
              </button>
            )}
          </div>
        )}
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
