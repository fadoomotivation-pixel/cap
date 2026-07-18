import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const blogs = [
  {
    title: 'Jobs in Dholera SIR 2026: Growth, Sectors & Salary',
    img: 'https://mirrikh.com/wp-content/uploads/2026/02/Jobs-in-Dholera-SIR-2026-scaled.jpg',
    date: 'February 2026',
    excerpt: 'Dholera Special Investment Region (SIR) is rapidly emerging as a global industrial hub, creating immense job opportunities...',
  },
  {
    title: 'FD vs Land Investment: Which Offers Better Returns?',
    img: 'https://mirrikh.com/wp-content/uploads/2026/01/FD-vs-Land-Investment.png',
    date: 'January 2026',
    excerpt: 'When it comes to building long-term wealth in India, Fixed Deposits (FDs) and real estate, particularly land investment...',
  },
  {
    title: 'Waste Management in Dholera: Smart City Guide',
    img: 'https://mirrikh.com/wp-content/uploads/2025/12/Waste-Management-in-Dholera.jpg',
    date: 'December 2025',
    excerpt: 'Dholera Smart City is setting a global benchmark in sustainable urban development with its advanced waste management...',
  },
  {
    title: 'Water Management in Dholera Smart City | DSIR Infra Guide',
    img: 'https://mirrikh.com/wp-content/uploads/2025/11/water-management-in-dholera-1024x576.jpg',
    date: 'November 2025',
    excerpt: 'Discover how Dholera Smart City utilizes smart water management to ensure sustainable, efficient water supply...',
  },
  {
    title: 'Tata Semiconductor Plant in Dholera: Chip Manufacturing',
    img: 'https://mirrikh.com/wp-content/uploads/2024/03/Tata-Semiconductor-Plant-in-Dholera-1024x576.jpg',
    date: 'March 2024',
    excerpt: 'Explore the monumental Tata Semiconductor Plant in Dholera, setting a new era in chip manufacturing...',
  },
  {
    title: 'Dholera climate change Solutions for a Sustainable Future',
    img: 'https://mirrikh.com/wp-content/uploads/2024/02/dholera-climate-change.jpg',
    date: 'February 2024',
    excerpt: 'Dholera’s proactive strategies in tackling climate change and ensuring sustainable living...',
  },
];

export default function Blog() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50 font-outfit">
      {/* Header */}
      <div className="bg-[#10243E] text-white py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Discover. Learn. Grow. Stay updated with the latest news, insights, and developments around Dholera Smart City and Real Estate.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((post, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="h-56 overflow-hidden">
                <img 
                  src={post.img} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://mirrikh.com/wp-content/uploads/2024/12/banner-blog2.jpg' }}
                />
              </div>
              <div className="p-6">
                <p className="text-sm text-[#f26522] font-semibold mb-2">{post.date}</p>
                <h3 className="text-xl font-bold text-[#10243E] mb-3 line-clamp-2 group-hover:text-[#f26522] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <button className="flex items-center text-[#10243E] font-bold hover:text-[#f26522] transition-colors">
                  Read More <ChevronRight size={18} className="ml-1" />
                </button>
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
            28
          </button>
          <button className="px-2 h-10 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors ml-2">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
