import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';
import BlogArt from '../components/BlogArt';
import { blogs, blogCategories } from '../data/blogs';
import { pageSeo, absoluteUrl } from '../lib/seo';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// An ItemList of the actual posts, so a crawler can find every URL from the
// index even before it follows a link.
const listJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: blogs.map((b, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: absoluteUrl(`/blog/${b.slug}`),
    name: b.title,
  })),
};

export default function Blog() {
  const [cat, setCat] = useState('All');

  const shown = useMemo(
    () => (cat === 'All' ? blogs : blogs.filter((b) => b.category === cat)),
    [cat]
  );
  const [lead, ...rest] = shown;

  return (
    <div className="bg-white font-outfit">
      <Seo {...pageSeo.blog} jsonLd={listJsonLd} />

      {/* Header */}
      <section className="bg-[#0A1016] pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Dholera, explained</p>
          <h1 className="text-white font-heading font-normal leading-[1.12] text-4xl lg:text-5xl mb-5 max-w-3xl">
            The guides we wish buyers had read first.
          </h1>
          <p className="text-gray-400 text-lg font-light max-w-2xl leading-relaxed">
            What land actually costs, which documents decide whether you own an asset or a dispute, and what
            the airport, the expressway and the Tata fab really mean. Written by us, not borrowed.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div className="border-b border-gray-200 sticky top-[72px] bg-white/95 backdrop-blur z-30">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto scrollbar-none">
          {blogCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                cat === c ? 'border-[#D4AF37] text-[#9C7C1C]' : 'border-transparent text-gray-500 hover:text-[#10243E]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
        {/* Lead article */}
        {lead && (
          <motion.div
            key={lead.slug}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <Link to={`/blog/${lead.slug}`} className="group grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="aspect-[16/10] overflow-hidden rounded-sm">
                <BlogArt tone={lead.tone} label={lead.title} seed={0}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div>
                <p className="text-[#9C7C1C] text-xs font-semibold uppercase tracking-[0.2em] mb-3">{lead.category}</p>
                <h2 className="text-3xl lg:text-4xl font-heading text-[#10243E] leading-tight mb-4 group-hover:text-[#9C7C1C] transition-colors">
                  {lead.title}
                </h2>
                <p className="text-gray-500 font-light leading-relaxed mb-5">{lead.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                  <span>{fmt(lead.updated || lead.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {lead.readMinutes} min read</span>
                </div>
                <span className="inline-flex items-center gap-2 text-[#10243E] font-medium border-b border-[#D4AF37] pb-1 group-hover:gap-3 transition-all">
                  Read the guide <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {/* The rest */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {rest.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden rounded-sm mb-5">
                  <BlogArt tone={post.tone} label={post.title} seed={i + 1}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                </div>
                <p className="text-[#9C7C1C] text-[11px] font-semibold uppercase tracking-[0.18em] mb-2">{post.category}</p>
                <h3 className="text-xl font-heading text-[#10243E] leading-snug mb-3 group-hover:text-[#9C7C1C] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-3 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{fmt(post.updated || post.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readMinutes} min</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="text-gray-400 text-center py-16">No guides in this category yet.</p>
        )}
      </div>

      {/* Conversion */}
      <section className="bg-[#0A1016] py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Rather just ask?</p>
            <h2 className="text-3xl lg:text-4xl font-heading text-white leading-tight mb-5">
              Skip the reading. Ask us the question directly.
            </h2>
            <p className="text-gray-400 font-light leading-relaxed">
              Tell us what you are trying to work out — price, approvals, which project, whether it suits your
              horizon — and we will answer it straight, with the documents attached.
            </p>
          </div>
          <LeadForm dark source="blog-index" />
        </div>
      </section>
    </div>
  );
}
