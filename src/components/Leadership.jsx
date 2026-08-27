import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function Leadership() {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#10243E]/5 transform skew-x-[-15deg] translate-x-20 z-0 hidden lg:block"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-5/12 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
              <img 
                src="/founder.jpg" 
                alt="Jasvinder Singh - Founder & CEO" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10243E] via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white z-10">
                <p className="text-[#f26522] font-bold text-sm tracking-widest uppercase mb-1 drop-shadow-md">Founder & CEO</p>
                <h3 className="text-3xl font-bold font-outfit text-white drop-shadow-lg">Jasvinder Singh</h3>
              </div>
            </div>
            {/* Decorative block behind image */}
            <div className="absolute -bottom-6 -left-6 w-3/4 h-3/4 border-[12px] border-[#f26522] rounded-2xl -z-10"></div>
          </motion.div>

          {/* Text Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-7/12"
          >
            <div className="mb-8 relative">
              <Quote className="text-[#f26522]/20 w-24 h-24 absolute -top-8 -left-8 -z-10" />
              <blockquote className="text-2xl md:text-3xl font-bold text-[#10243E] font-outfit leading-tight italic">
                "I truly believe that if you really want to do something, you'll find a way. If you don't, you'll find an excuse."
              </blockquote>
            </div>

            <div className="w-16 h-1 bg-[#f26522] mb-8"></div>

            <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
              <p>
                Said by Dynamic, successful and high profile personality, Founder of Capital Brix <strong className="text-[#10243E]">Mr. Jasvinder Singh</strong>, a successful entrepreneur owning multiple ventures and flamboyant enough to be covered many times by the most renowned medias.
              </p>
              <p>
                Among the multitude, he is also conferred with many prestigious awards because of his visionary approach and his exemplary contributions. The professionalism he has endured in this sector has helped immensely in understanding the pulse of the market and prospective buyers.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
