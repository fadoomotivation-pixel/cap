import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { blogs } from '../data/blogs';

export default function HomeArticles() {
  // Get latest 3 blogs
  const recentBlogs = blogs.slice(0, 3);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101010] mb-2">
            Our Articles
          </h2>
          <div className="w-16 h-1 bg-[#f37435] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentBlogs.map((blog, index) => (
            <motion.article 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-sm overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow group flex flex-col"
            >
              <div className="overflow-hidden aspect-video">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-[#f37435] text-xs font-bold uppercase tracking-wider mb-2">
                  {blog.date}
                </div>
                
                <h3 className="text-xl font-bold text-[#101010] mb-3 line-clamp-2 hover:text-[#f37435] transition-colors">
                  <Link to="/blog">{blog.title}</Link>
                </h3>
                
                <p className="text-gray-500 text-sm line-clamp-3 mb-6">
                  {blog.excerpt}
                </p>

                <div className="mt-auto">
                  <Link 
                    to="/blog"
                    className="inline-flex items-center text-sm font-semibold text-[#101010] hover:text-[#f37435] transition-colors group-hover:underline"
                  >
                    Read More 
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/blog"
            className="inline-block border-2 border-[#101010] text-[#101010] px-10 py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-[#101010] hover:text-white transition-colors"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
