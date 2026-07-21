import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { events } from '../data/events';

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
      {/* Header */}
      <div className="bg-[#10243E] text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Success celebrations, awareness programs, and global exhibitions hosted by Mirrikh Infratech.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
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
                <img 
                  src={event.img} 
                  alt={event.title || 'Mirrikh Event'}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://mirrikh.com/wp-content/uploads/2025/01/banner-event-17-Sept-2023-1.jpg' }}
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
                      ? 'bg-[#f26522] text-white'
                      : 'text-[#10243E] hover:text-[#f26522] hover:bg-gray-100 bg-white border border-gray-200'
                  }`}
                >
                  {number}
                </button>
              )
            ))}

            {currentPage < totalPages && (
              <button 
                onClick={() => paginate(currentPage + 1)}
                className="px-4 h-10 flex items-center justify-center text-[#10243E] bg-white border border-gray-200 hover:text-[#f26522] hover:border-[#f26522] transition-colors ml-2 rounded-sm"
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
