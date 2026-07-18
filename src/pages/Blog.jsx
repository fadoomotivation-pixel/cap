import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { blogs } from '../data/blogs';

export default function Blog() {
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;
  
  const totalPages = Math.ceil(blogs.length / postsPerPage);
  
  // Get current posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          {currentPosts.map((post, i) => (
            <motion.div 
              key={`${currentPage}-${i}`}
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
                <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                  {post.excerpt}
                </p>
                <button className="flex items-center text-[#10243E] font-bold hover:text-[#f26522] transition-colors">
                  Read More <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2 text-base font-medium flex-wrap">
            {/* Show first few pages */}
            {[1, 2].map((number) => (
              number <= totalPages && (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 flex items-center justify-center transition-colors rounded ${
                    currentPage === number
                      ? 'bg-[#f26522] text-white hover:bg-orange-600'
                      : 'text-[#10243E] hover:text-[#f26522] hover:bg-gray-100'
                  }`}
                >
                  {number}
                </button>
              )
            ))}

            {/* Ellipsis if current page is far from ends */}
            {currentPage > 3 && currentPage < totalPages - 1 && (
              <span className="w-8 h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Show current page if it's in the middle */}
            {currentPage > 2 && currentPage < totalPages && (
               <button
                 key={currentPage}
                 className="w-10 h-10 flex items-center justify-center bg-[#f26522] text-white rounded"
               >
                 {currentPage}
               </button>
            )}

            {/* Ellipsis */}
            {totalPages > 3 && currentPage < totalPages - 1 && (
              <span className="w-8 h-10 flex items-center justify-center text-gray-400">...</span>
            )}

            {/* Last Page */}
            {totalPages > 2 && (
              <button
                key={totalPages}
                onClick={() => paginate(totalPages)}
                className={`w-10 h-10 flex items-center justify-center transition-colors rounded ${
                  currentPage === totalPages
                    ? 'bg-[#f26522] text-white hover:bg-orange-600'
                    : 'text-[#10243E] hover:text-[#f26522] hover:bg-gray-100'
                }`}
              >
                {totalPages}
              </button>
            )}
            
            {/* Next Button */}
            {currentPage < totalPages && (
              <button 
                onClick={() => paginate(currentPage + 1)}
                className="px-2 h-10 flex items-center justify-center text-[#10243E] hover:text-[#f26522] transition-colors ml-2"
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
