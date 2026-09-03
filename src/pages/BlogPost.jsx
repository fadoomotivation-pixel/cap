import React, { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CalendarDays, ArrowLeft, ArrowRight, Plus, Minus, AlertTriangle, Lightbulb, ShieldCheck, MapPin, BadgeCheck } from 'lucide-react';
import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';
import BlogArt from '../components/BlogArt';
import { blogs, blogBySlug } from '../data/blogs';
import { blogPostSeo, blogPostJsonLd } from '../lib/seo';
import { site } from '../data/site';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/** Bold spans written as **…** in the content data. Keeps the data file
 *  readable without pulling in a markdown dependency for one feature. */
function RichText({ children }) {
  const parts = String(children).split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="font-semibold text-[#10243E]">{p.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogBySlug(slug);
  const [openFaq, setOpenFaq] = useState(0);

  if (!post) return <Navigate to="/blog" replace />;

  const related = (post.related || [])
    .map(blogBySlug)
    .filter(Boolean);

  const idx = blogs.findIndex((b) => b.slug === post.slug);
  const next = blogs[(idx + 1) % blogs.length];

  return (
    <article className="bg-white font-outfit">
      <Seo {...blogPostSeo(post)} jsonLd={blogPostJsonLd(post)} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative bg-[#0A1016] overflow-hidden">
        <div className="absolute inset-0">
          <BlogArt tone={post.tone} label={post.title} seed={idx} className="w-full h-full" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,16,22,0.97) 10%, rgba(10,16,22,0.72) 60%, rgba(10,16,22,0.5) 100%)' }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-14 lg:pt-40 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <ChevronRight size={13} />
            <Link to="/blog" className="hover:text-[#D4AF37]">Blog</Link>
            <ChevronRight size={13} />
            <span className="text-white/70 truncate">{post.category}</span>
          </nav>

          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{post.category}</p>
          <h1 className="text-white font-heading font-normal leading-[1.12] text-3xl sm:text-4xl lg:text-5xl mb-6">
            {post.h1}
          </h1>
          <p className="text-gray-300 text-lg font-light leading-relaxed max-w-2xl mb-7">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Updated {fmt(post.updated || post.date)}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readMinutes} min read</span>
            <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-[#D4AF37]" /> Capital Brix — Official Strategy Partner, Mirrikh Infratech</span>
          </div>
        </div>
      </header>

      {/* ── Body + sticky conversion rail ────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 lg:gap-16">

          <div className="min-w-0">
            {/* The query gets answered above the fold, then expanded. */}
            <p className="text-lg lg:text-xl text-[#10243E] leading-relaxed font-light border-l-2 border-[#D4AF37] pl-6 mb-12">
              {post.intro}
            </p>

            {post.sections.map((s, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                {s.h2 && (
                  <h2 className="text-2xl lg:text-3xl font-heading text-[#10243E] mb-5 leading-snug">{s.h2}</h2>
                )}

                {(s.p || []).map((para, j) => (
                  <p key={j} className="text-gray-600 leading-[1.85] mb-4 text-[15px] lg:text-base">
                    <RichText>{para}</RichText>
                  </p>
                ))}

                {s.list && (
                  s.list.ordered ? (
                    <ol className="space-y-3 my-6 counter-reset">
                      {s.list.items.map((it, j) => (
                        <li key={j} className="flex gap-4 text-gray-600 leading-[1.8] text-[15px] lg:text-base">
                          <span className="shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#9C7C1C] text-xs font-bold flex items-center justify-center mt-0.5">
                            {j + 1}
                          </span>
                          <span><RichText>{it}</RichText></span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="space-y-3 my-6">
                      {s.list.items.map((it, j) => (
                        <li key={j} className="flex gap-4 text-gray-600 leading-[1.8] text-[15px] lg:text-base">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-3" />
                          <span><RichText>{it}</RichText></span>
                        </li>
                      ))}
                    </ul>
                  )
                )}

                {s.table && (
                  <div className="overflow-x-auto my-7 -mx-6 px-6 lg:mx-0 lg:px-0">
                    <table className="w-full text-sm border border-gray-200 min-w-[560px]">
                      <thead>
                        <tr className="bg-[#10243E] text-white text-left">
                          {s.table.head.map((h, j) => (
                            <th key={j} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((row, j) => (
                          <tr key={j} className={j % 2 ? 'bg-gray-50' : 'bg-white'}>
                            {row.map((cell, k) => (
                              <td key={k} className={`px-4 py-3 border-t border-gray-100 align-top ${k === 0 ? 'text-[#10243E] font-medium' : 'text-gray-600'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {s.callout && (
                  <aside className={`my-7 rounded-xl border p-5 flex gap-4 ${
                    s.callout.tone === 'warn'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-[#F5F1E4] border-[#E3D6A8]'
                  }`}>
                    <span className="shrink-0 mt-0.5">
                      {s.callout.tone === 'warn'
                        ? <AlertTriangle size={20} className="text-amber-600" />
                        : <Lightbulb size={20} className="text-[#9C7C1C]" />}
                    </span>
                    <div>
                      <p className="font-semibold text-[#10243E] mb-1">{s.callout.title}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{s.callout.text}</p>
                    </div>
                  </aside>
                )}
              </motion.section>
            ))}

            {/* Mid-article CTA — a reader who is convinced here should not have
                to scroll to the end to act. */}
            <div className="my-14 rounded-2xl bg-[#10243E] text-white p-8 lg:p-10">
              <h2 className="text-2xl lg:text-3xl font-heading text-white mb-3 leading-snug">
                Want the approvals and the all-in cost before you decide?
              </h2>
              <p className="text-white/70 font-light mb-6 max-w-xl">
                We will send you the NA order, the plan approval, the plot layout and a single all-inclusive
                figure — land, development, stamp duty, registration — for the projects that match what you
                are looking for. No obligation.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-sm font-semibold transition-colors">
                  Get the documents <ArrowRight size={17} />
                </a>
                <Link to="/projects"
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white/60 text-white px-6 py-3 rounded-sm font-medium transition-colors">
                  See available plots
                </Link>
              </div>
            </div>

            {/* FAQ — rendered, because the FAQPage schema must match what is visible */}
            {post.faqs?.length > 0 && (
              <section className="mb-4">
                <h2 className="text-2xl lg:text-3xl font-heading text-[#10243E] mb-6">Frequently asked</h2>
                <div className="border-t border-gray-200">
                  {post.faqs.map((f, i) => (
                    <div key={i} className="border-b border-gray-200">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                        aria-expanded={openFaq === i}
                        className="w-full flex items-start justify-between gap-4 text-left py-5 group"
                      >
                        <span className="font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors">{f.q}</span>
                        <span className="shrink-0 text-[#D4AF37] mt-0.5">
                          {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                        </span>
                      </button>
                      {openFaq === i && (
                        <p className="text-gray-600 leading-[1.85] pb-6 pr-8 text-[15px]">{f.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Sticky rail ─────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <LeadForm
              source="blog"
              headline="Get a straight answer"
              sub="Tell us what you are considering. We will send the approvals, the layout and the all-in cost — and take you to the plot."
            />

            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-4">Why buyers use us</p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  [ShieldCheck, 'NA-approved, NOC-cleared, title-clear and plan-passed plots only'],
                  [BadgeCheck, 'Official Strategy Partner of Mirrikh Infratech — 8+ delivered projects since 2012'],
                  [MapPin, 'Direct developer pricing from ₹7,250 / sq yd — no intermediary margin'],
                ].map(([Icon, text]) => (
                  <li key={text} className="flex gap-3">
                    <Icon size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {related.length > 0 && (
              <div className="rounded-2xl border border-gray-200 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-4">Read next</p>
                <ul className="space-y-4">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/blog/${r.slug}`} className="group block">
                        <p className="text-sm font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug">
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{r.readMinutes} min read</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Closing conversion block ─────────────────────────── */}
      <section className="bg-[#0A1016] py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Next step</p>
            <h2 className="text-3xl lg:text-4xl font-heading text-white leading-tight mb-5">
              Stand on the plot before you buy it.
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-6">
              A site visit takes a morning from Ahmedabad. You will see the layout, the roads that exist,
              and the plot itself — and you will leave with the approvals and the title documents in hand,
              not a promise that they are coming.
            </p>
            <Link to="/projects" className="inline-flex items-center gap-2 text-white border-b border-[#D4AF37] pb-1 hover:text-[#D4AF37] transition-colors">
              Browse Dholera projects <ArrowRight size={16} />
            </Link>
          </div>
          <LeadForm dark source="blog-footer" headline="Book a site visit" sub="Give us a name and a number. We will call to fix a date that suits you." />
        </div>
      </section>

      {/* ── Post nav ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-wrap gap-4 justify-between items-center">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#9C7C1C] transition-colors">
          <ArrowLeft size={16} /> All guides
        </Link>
        {next && next.slug !== post.slug && (
          <Link to={`/blog/${next.slug}`} className="inline-flex items-center gap-2 text-sm text-[#10243E] hover:text-[#9C7C1C] transition-colors text-right">
            <span className="truncate max-w-[60vw]">{next.title}</span> <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}
