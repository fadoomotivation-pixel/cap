import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '../data/site';

export default function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <motion.div
          className="section__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="section__eyebrow">Investor Stories</p>
          <h2>
            Trusted by Investors <span className="text-gold">Across India</span>
          </h2>
        </motion.div>

        <div className="grid grid--3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              className="card testimonial"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <Quote size={26} className="testimonial__quote" aria-hidden="true" />
              <div className="testimonial__stars" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={15} fill="currentColor" />
                ))}
              </div>
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.city}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
