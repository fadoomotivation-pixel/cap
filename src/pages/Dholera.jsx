import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, MessageCircle, MapPin } from 'lucide-react';
import Seo from '../components/Seo';
import Prose from '../components/Prose';
import DholeraTimeline, { timelineItemList } from '../components/DholeraTimeline';
import DholeraInfrastructure from '../components/DholeraInfrastructure';
import VirtualTourViewer from '../components/VirtualTourViewer';
import { pageSeo, absoluteUrl, SITE_URL, SITE_NAME } from '../lib/seo';
import { faqsFromMarkdown, whatsappHref, setWhatsappPhone } from '../lib/prose';
import { site } from '../data/site';
import pillarMarkdown from '../content/dholera-pillar.md?raw';

const H1 = "Dholera Special Investment Region: Gujarat's 920 sq km Greenfield Industrial Smart City";
const faqs = faqsFromMarkdown(pillarMarkdown);

const pillarGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'RealEstateAgent'],
      '@id': `${SITE_URL}/#organization`,
      name: 'Capital Brix',
      legalName: 'Capital Brix LLP',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo-capital-brix.png`,
      telephone: '+91-7048917300',
      areaServed: ['Dholera', 'Gujarat', 'India'],
      description: 'Authorised sales channel partner for Mirrikh Infratech Pvt. Ltd., marketing Dholera SIR plots.',
      sameAs: site.socials.map((s) => s.href),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${absoluteUrl('/dholera')}#webpage`,
      url: absoluteUrl('/dholera'),
      name: pageSeo.dholera.title,
      description: pageSeo.dholera.description,
      inLanguage: 'en-IN',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${absoluteUrl('/dholera')}#place` },
      primaryImageOfPage: absoluteUrl('/og/dholera-pillar.jpg'),
      datePublished: '2026-09-03',
      dateModified: '2026-10-06',
      author: { '@id': `${SITE_URL}/#organization` },
      breadcrumb: { '@id': `${absoluteUrl('/dholera')}#breadcrumb` },
    },
    {
      '@type': 'Place',
      '@id': `${absoluteUrl('/dholera')}#place`,
      name: 'Dholera Special Investment Region',
      alternateName: ['Dholera SIR', 'DSIR', 'Dholera Smart City'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dholera',
        addressRegion: 'Gujarat',
        addressCountry: 'IN',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 22.25, longitude: 72.19 },
      sameAs: ['https://en.wikipedia.org/wiki/Dholera_Special_Investment_Region'],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${absoluteUrl('/dholera')}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Dholera', item: absoluteUrl('/dholera') },
      ],
    },
  ],
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${absoluteUrl('/dholera')}#faq`,
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

function track(id) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'cta_click', { cta_id: id });
  }
}

export default function Dholera() {
  setWhatsappPhone(site.phone);
  const wa = whatsappHref();

  return (
    <main className="bg-white font-outfit min-h-screen pb-20 lg:pb-0">
      <Seo
        title={pageSeo.dholera.title}
        description={pageSeo.dholera.description}
        path={pageSeo.dholera.path}
        ogTitle={pageSeo.dholera.ogTitle}
        ogDescription={pageSeo.dholera.ogDescription}
        twitterDescription="920 sq km SIR on the DMIC. Expressway open, airport near-ready, Tata fab rising."
        ogType="article"
        image={absoluteUrl('/og/dholera-pillar.jpg')}
        imageAlt="Dholera SIR, verified 2026 — activation area, expressway and airport"
        jsonLd={[pillarGraph, faqLd, timelineItemList(SITE_URL)]}
      >
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:modified_time" content="2026-10-06T00:00:00+05:30" />
      </Seo>

      <header className="relative bg-[#0A1016] text-white pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link to="/" className="hover:text-[#D4AF37] transition-colors">Home</Link>
            <ChevronRight size={13} />
            <span className="text-white/80">Dholera</span>
          </nav>
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Verified 6 October 2026
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] mb-6">
            {H1}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
            Capital Brix Research Desk. Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd.
          </p>
        </div>
      </header>

      <article className="py-12 lg:py-16">
        <Prose
          markdown={pillarMarkdown}
          slots={{
            timeline: <DholeraTimeline />,
            tour: (
              <div className="my-8 max-w-5xl mx-auto px-6">
                <VirtualTourViewer className="w-full" />
                <p className="sr-only">
                  Map of Dholera SIR showing the activation area, Ahmedabad–Dholera Expressway, Dholera International Airport and Gulf of Khambhat.
                </p>
              </div>
            ),
            infra: <DholeraInfrastructure />,
          }}
        />
      </article>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 bg-[#0A1016] text-white border-t border-white/10">
        <a href={`tel:+${site.phone}`} data-cta="bar-call" onClick={() => track('bar-call')} className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold">
          <Phone size={14} /> Call
        </a>
        <a href={wa} target="_blank" rel="noreferrer" data-cta="bar-whatsapp" onClick={() => track('bar-whatsapp')} className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#D4AF37]">
          <MessageCircle size={14} /> WhatsApp
        </a>
        <Link to="/contact" data-cta="bar-visit" onClick={() => track('bar-visit')} className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold">
          <MapPin size={14} /> Visit
        </Link>
      </div>
    </main>
  );
}
