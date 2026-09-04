import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { blogs } from '../data/blogs';
import BlogArt from './BlogArt';

export default function HomeArticles() {
  // Get latest 3 blogs
  const recentBlogs = blogs.slice(0, 3);

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10 lg:mb-14">
          <h2 className="text-4xl md:text-5xl font-heading text-[#1A1A1A] mb-4">
            Dholera, explained
          </h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
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
                <BlogArt tone={blog.tone} label={blog.title} seed={index}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
              </div>
              
              <div className="p-5 lg:p-6 flex flex-col flex-grow">
                <div className="text-[#9C7C1C] text-xs font-bold uppercase tracking-wider mb-2">
                  {blog.category}
                </div>
                
                <h3 className="text-xl lg:text-2xl font-heading text-[#1A1A1A] mb-2 line-clamp-2 hover:text-[#D4AF37] transition-colors">
                  <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h3>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {blog.excerpt}
                </p>

                <div className="mt-auto">
                  <Link 
                    to={`/blog/${blog.slug}`}
                    className="inline-flex items-center text-sm font-semibold text-[#101010] hover:text-[#9C7C1C] transition-colors group-hover:underline"
                  >
                    Read the guide 
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
            Read all guides
          </Link>
        </div>
      </div>
    </section>
  );
}
