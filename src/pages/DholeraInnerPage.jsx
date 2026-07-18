import React from 'react';
import { motion } from 'framer-motion';

export default function DholeraInnerPage({ title, bannerImg, content }) {
  return (
    <div className="pt-20 min-h-screen bg-gray-50 font-outfit">
      {/* Banner */}
      <div 
        className="w-full h-[300px] md:h-[400px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${bannerImg})` }}
      >
        <div className="absolute inset-0 bg-[#10243E]/60"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wider text-center px-4">
            {title}
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100"
        >
          {content}
        </motion.div>
      </div>
    </div>
  );
}
