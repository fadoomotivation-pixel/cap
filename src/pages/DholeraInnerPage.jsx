import React, { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronRight, Plus, Minus, ArrowRight, ShieldCheck, BadgeCheck, MapPin } from 'lucide-react';
import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';
import BlogArt from '../components/BlogArt';
import ArticleBody from '../components/ArticleBody';
import { dholeraPages, dholeraPageBySlug } from '../data/dholera';
import { absoluteUrl, SITE_URL, SITE_NAME } from '../lib/seo';
import { site } from '../data/site';

/**
 * The Dholera pillar sub-pages. These five routes used to render the same
 * placeholder paragraph over a hotlinked mirrikh.com banner — five duplicate
 * thin URLs in the sitemap. Each now carries its own long-form content and
 * owns a distinct keyword cluster.
 */
export default function DholeraInnerPage() {
  const { slug } = useParams();
  const page = dholeraPageBySlug(slug);
  const [openFaq, setOpenFaq] = useState(0);

  if (!page) return <Navigate to="/dholera" replace />;

  const idx = dholeraPages.findIndex((p) => p.slug === page.slug);
  const related = (page.related || []).map(dholeraPageBySlug).filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: page.title,
        description: page.excerpt,
        inLanguage: 'en-IN',
        mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/dholera/${page.slug}`) },
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-capital-brix.png` },
        },
        about: page.keyword,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Dholera SIR', item: absoluteUrl('/dholera') },
          { '@type': 'ListItem', position: 3, name: page.title, item: absoluteUrl(`/dholera/${page.slug}`) },
        ],
      },
      ...(page.faqs?.length
        ? [{
            '@type': 'FAQPage',
            mainEntity: page.faqs.map((f) => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <article className="bg-white font-outfit">
      <Seo
        title={page.seoTitle || page.title}
        description={page.excerpt}
        path={`/dholera/${page.slug}`}
        jsonLd={jsonLd}
      />

      <header className="relative bg-[#0A1016] overflow-hidden">
        <div className="absolute inset-0">
          <BlogArt tone={page.tone} label={page.title} seed={idx + 20} className="w-full h-full" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,16,22,0.97) 10%, rgba(10,16,22,0.72) 60%, rgba(10,16,22,0.5) 100%)' }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-14 lg:pt-40 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <ChevronRight size={13} />
            <Link to="/dholera" className="hover:text-[#D4AF37]">Dholera SIR</Link>
          </nav>
          <h1 className="text-white font-heading font-normal leading-[1.12] text-3xl sm:text-4xl lg:text-5xl mb-6">
            {page.h1}
          </h1>
          <p className="text-gray-300 text-lg font-light leading-relaxed max-w-2xl">{page.excerpt}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 lg:gap-16">
          <div className="min-w-0">
            <p className="text-lg lg:text-xl text-[#10243E] leading-relaxed font-light border-l-2 border-[#D4AF37] pl-6 mb-12">
              {page.intro}
            </p>

            <ArticleBody sections={page.sections} />

            <div className="my-14 rounded-2xl bg-[#10243E] text-white p-8 lg:p-10">
              <h2 className="text-2xl lg:text-3xl font-heading text-white mb-3 leading-snug">
                See it for yourself before you decide
              </h2>
              <p className="text-white/70 font-light mb-6 max-w-xl">
                Dholera is about an hour from Ahmedabad on the expressway, so a site visit fits in a
                morning. You will see the roads that exist, the plot itself, and leave with the
                approvals and title documents in hand.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-sm font-semibold transition-colors">
                  Book a site visit <ArrowRight size={17} />
                </a>
                <Link to="/projects"
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white/60 text-white px-6 py-3 rounded-sm font-medium transition-colors">
                  See available plots
                </Link>
              </div>
            </div>

            {page.faqs?.length > 0 && (
              <section>
                <h2 className="text-2xl lg:text-3xl font-heading text-[#10243E] mb-6">Frequently asked</h2>
                <div className="border-t border-gray-200">
                  {page.faqs.map((f, i) => (
                    <div key={i} className="border-b border-gray-200">
                      <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}
                        className="w-full flex items-start justify-between gap-4 text-left py-5 group">
                        <span className="font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors">{f.q}</span>
                        <span className="shrink-0 text-[#D4AF37] mt-0.5">{openFaq === i ? <Minus size={18} /> : <Plus size={18} />}</span>
                      </button>
                      {openFaq === i && <p className="text-gray-600 leading-[1.85] pb-6 pr-8 text-[15px]">{f.a}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <LeadForm
              source="dholera"
              headline="Ask us about Dholera"
              sub="Tell us what you are trying to work out. We will answer straight, with the approvals and the all-in cost attached."
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-4">More on Dholera</p>
                <ul className="space-y-4">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link to={`/dholera/${r.slug}`} className="group block">
                        <p className="text-sm font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug">
                          {r.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/blog/dholera-international-airport" className="group block">
                      <p className="text-sm font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug">
                        Dholera International Airport and the land around it
                      </p>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}
