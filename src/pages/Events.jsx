import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { events } from '../data/events';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { getEvent } from '../data/eventDetails';
import Seo from '../components/Seo';
import BlogArt from '../components/BlogArt';
import { pageSeo } from '../lib/seo';

export default function Events() {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  
  const totalPages = Math.ceil(events.length / eventsPerPage);
  
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

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

        <div className="flex flex-col gap-12">
          {currentEvents.map((event, i) => (
            <motion.div 
              key={`${currentPage}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-full"
            >
              <div className="w-full relative shadow-sm border border-gray-100 hover:shadow-lg transition-all group overflow-hidden bg-white">
                {/* The banners here were hotlinked from mirrikh.com — their
                    images on their bandwidth, and material we are not
                    authorised to use. Generated art until Capital Brix has
                    photographs of its own. */}
                <BlogArt
                  tone="navy"
                  label={`${event.title || 'Event'}${event.location ? ` · ${event.location}` : ''}`}
                  seed={indexOfFirstEvent + i}
                  className="w-full aspect-[16/7]"
                />
              </div>
              {event.title && (
                <p className="text-center text-sm font-semibold text-gray-500 mt-3">{event.title}</p>
              )}
            </motion.div>
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
