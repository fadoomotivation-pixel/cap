import React from 'react';
import { motion } from 'framer-motion';

const leaders = [
  {
    name: 'Rajeel Jangir',
    title: 'Founder & Managing Director',
    img: 'https://mirrikh.com/wp-content/uploads/2024/02/member-1.jpg', // Placeholder
  },
  {
    name: 'Kashyap',
    title: 'Executive Director',
    img: 'https://mirrikh.com/wp-content/uploads/2024/02/member-2.jpg', // Placeholder
  },
  {
    name: 'Aarav Patel',
    title: 'Head of Operations',
    img: 'https://mirrikh.com/wp-content/uploads/2024/02/member-3.jpg', // Placeholder
  },
  {
    name: 'Priya Sharma',
    title: 'Sales Director',
    img: 'https://mirrikh.com/wp-content/uploads/2024/02/member-4.jpg', // Placeholder
  }
];

export default function Leadership() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101010] mb-2">
            Meet our leadership.
          </h2>
          <div className="w-16 h-1 bg-[#f37435] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {leaders.map((leader, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="relative overflow-hidden rounded-sm mb-4 bg-gray-200 aspect-[3/4]">
                <img 
                  src={leader.img} 
                  alt={leader.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=f37435&color=fff&size=512`;
                  }}
                />
              </div>
              <h3 className="text-xl font-bold text-[#101010]">{leader.name}</h3>
              <p className="text-[#f37435] text-sm font-semibold uppercase tracking-wider">{leader.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
