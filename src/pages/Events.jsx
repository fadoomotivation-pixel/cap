import React from 'react';
import { motion } from 'framer-motion';

const events = [
  {
    title: 'Success Celebrations SPARK 2024',
    location: 'Delhi',
    date: '29 Dec 2024',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/SPARK-2024-thumbnail.jpg',
  },
  {
    title: 'Achiever\'s Celebration',
    location: 'Delhi',
    date: '17 Sept 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/banner-event-17-Sept-2023-1.jpg',
  },
  {
    title: 'Dholera Awareness Program',
    location: 'Gurgaon',
    date: '30 Apr 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/dholera-awareness-program.jpg',
  },
  {
    title: 'Holi Milan Samaroh',
    location: 'Surat',
    date: '04 Mar 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/Holi-Milan-Samaroh-3.jpg',
  },
  {
    title: 'Riyadh Real Estate Exhibition',
    location: 'Saudi Arabia',
    date: '02 Feb 2023',
    img: 'https://mirrikh.com/wp-content/uploads/2025/01/mirrikh-events-exhibition-4.jpg',
  },
];

export default function Events() {
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

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={event.img} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://mirrikh.com/wp-content/uploads/2025/01/banner-event-17-Sept-2023-1.jpg' }}
                />
                <div className="absolute top-4 left-4 bg-[#f26522] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                  {event.date}
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 font-semibold mb-2 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {event.location}
                </p>
                <h3 className="text-xl font-bold text-[#10243E] mb-2 group-hover:text-[#f26522] transition-colors">
                  {event.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination (Mock to match Mirrikh) */}
        <div className="mt-16 flex items-center justify-center gap-2 text-base font-medium">
          <button className="w-10 h-10 flex items-center justify-center bg-[#f26522] text-white hover:bg-orange-600 transition-colors">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors">
            2
          </button>
          <span className="w-8 h-10 flex items-center justify-center text-gray-400">...</span>
          <button className="w-10 h-10 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors">
            12
          </button>
          <button className="px-2 h-10 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors ml-2">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
