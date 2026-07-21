import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://mirrikh.com/wp-content/uploads/2024/12/mirrikh-group-hero.jpg')`,
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 max-w-5xl mx-auto pt-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-lg md:text-xl font-medium tracking-[0.2em] uppercase mb-4"
        >
          Building Futures
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8"
        >
          INVEST IN INDIA'S FIRST<br/>SMART CITY
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/projects"
            className="bg-[#f37435] text-white px-8 py-4 rounded-sm font-semibold hover:bg-black transition-colors text-sm tracking-widest uppercase"
          >
            Explore Projects
          </Link>
          <Link
            to="/contact"
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-sm font-semibold hover:bg-white hover:text-black transition-colors text-sm tracking-widest uppercase"
          >
            Contact Us
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
