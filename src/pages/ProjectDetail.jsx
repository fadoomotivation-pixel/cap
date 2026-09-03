import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { projects, site } from '../data/site';
import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';
import ArticleBody from '../components/ArticleBody';
import { projectIntro, projectSections, projectFaqs } from '../lib/projectContent';

// Feature icons inline SVG
const LegalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
  </svg>
);
const FamilyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const FutureIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

const projectFeatures = [
  { Icon: LegalIcon, title: 'NA, NOC, TITLE CLEAR & UNIT PLAN PASS' },
  { Icon: FamilyIcon, title: 'PERFECT FOR FAMILIES, BUILT FOR LIFE' },
  { Icon: FutureIcon, title: 'THOUGHTFULLY PLANNED. FUTURE READY.' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const [openFaq, setOpenFaq] = useState(0);
  const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === id);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!project) return <Navigate to="/projects" replace />;

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(
    `Hi Capital Brix! I'm interested in ${project.name} (${project.type}). Please share the brochure, plot layout, and pricing.`
  )}`;

  // Use project name words for display
  const nameParts = project.name.split(' ');
  const projectBrand = nameParts.slice(0, 2).join(' ');    // e.g., "Mayur Greenz"
  const projectSub = nameParts.slice(2).join(' ') || '';   // e.g., "II"

  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60000!2d71.9686971!3d22.516858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959b8c2d8c36ba5%3A0x6e288e7a6ed7f766!2sDholera%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`;

  // Per-project SEO: each plot project targets its own long-tail query
  // ("mayur greenz ii dholera price") instead of all of them competing
  // for the same generic "Dholera plots" term.
  const seoTitle = `${project.name} Dholera | ${project.type} in ${project.location} — Capital Brix`;
  const seoDescription = `${project.name} — ${project.type} at ${project.location}. ${project.size}. ${
    project.price === 'On Request' ? 'Pricing on request' : `Starting ${project.price}`
  }. NA/NOC approved, title-clear plots via Capital Brix, official strategy partner of Mirrikh Infratech.`;

  const faqs = projectFaqs(project);
  const sections = projectSections(project);

  const projectSchema = {
    '@context': 'https://schema.org',
    '@graph': [{
    '@type': 'Product',
    name: `${project.name}, Dholera Smart City`,
    description: seoDescription,
    category: project.type,
    brand: { '@type': 'Brand', name: 'Mirrikh Infratech' },
    offers: {
      '@type': 'Offer',
      availability: project.category === 'Sold Out'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      priceCurrency: 'INR',
      seller: { '@type': 'Organization', name: 'Capital Brix' },
    },
  }, {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }],
  };

  return (
    <main className="pt-[72px] min-h-screen bg-[#F0F5FA]">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/projects/${id}`}
        jsonLd={projectSchema}
      />

      {/* ── HERO BANNER: 3-column split ── */}
      <div className="flex flex-col xl:flex-row w-full" style={{ minHeight: '80vh' }}>

        {/* COL 1: Project Brand + Tagline + Feature Icons */}
        <div className="w-full xl:w-[58%] bg-white relative overflow-hidden flex flex-col justify-between py-14 px-8 lg:px-16">

          {/* BG: subtle project color */}
          <div
            className="absolute top-0 right-0 w-[55%] h-full opacity-[0.06] pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${project.accent || '#D4AF37'}, transparent 70%)` }}
          />

          <div className="relative z-10 max-w-xl">
            {/* Project Logo Area */}
            <div className="mb-3">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
                A {project.type} Project
              </p>
              <h1
                className="font-black text-[#10243E] leading-none tracking-tight mb-2"
                style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)' }}
              >
                {projectBrand}
              </h1>
              {projectSub && (
                <span
                  className="inline-block font-black text-[#9C7C1C] leading-none tracking-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
                >
                  {projectSub}
                </span>
              )}
              {/* Underline curve */}
              <div className="mt-3 mb-8">
                <svg width="120" height="12" viewBox="0 0 120 12">
                  <path d="M0 10 Q60 0 120 10" stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Tagline */}
            <h2
              className="font-bold text-[#10243E] leading-tight mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              Rise. <span className="text-[#9C7C1C]">Live.</span> Belong.
            </h2>

            {/* Price & Location */}
            <div className="flex flex-wrap gap-6 mb-10">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Starting Price</p>
                <p className="text-3xl font-black text-[#9C7C1C]">{project.price}</p>
                <p className="text-sm text-gray-500">{project.priceUnit}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Location</p>
                <p className="text-base font-bold text-[#10243E]">{project.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                  project.category === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-[#9C7C1C]'
                }`}>{project.status}</span>
              </div>
            </div>

            {/* Feature Icons */}
            <div className="flex flex-col sm:flex-row gap-6">
              {projectFeatures.map(({ Icon, title }) => (
                <div key={title} className="flex flex-col items-center text-center max-w-[130px]">
                  <div className="w-12 h-12 rounded-full bg-[#10243E] flex items-center justify-center text-white mb-3 flex-shrink-0">
                    <Icon />
                  </div>
                  <p className="text-[10px] font-bold text-[#10243E] uppercase leading-tight tracking-wide">{title}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="bg-[#D4AF37] text-[#0A1016] px-8 py-3.5 rounded-sm font-bold hover:bg-[#B8860B] transition-colors text-sm uppercase tracking-wide"
              >
                Request Price & Layout
              </a>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-[#10243E] text-[#10243E] px-8 py-3.5 rounded-sm font-bold hover:bg-[#10243E] hover:text-white transition-colors text-sm uppercase tracking-wide"
              >
                Download Brochure
              </a>
            </div>
          </div>

          {/* Orange decorative arch (background) */}
          <div
            className="absolute -right-16 -bottom-16 w-[300px] h-[300px] rounded-full bg-[#D4AF37] text-[#0A1016] opacity-10 pointer-events-none"
          />
        </div>

        {/* COL 2: Google Map (right third) */}
        <div className="w-full xl:w-[42%] flex flex-col border-l-4 border-[#F0F5FA]">
          {/* Project name text in dark */}
          <div className="bg-[#10243E] flex items-center justify-center px-8 py-10 flex-shrink-0">
            <h2
              className="text-white font-black uppercase tracking-widest text-center leading-tight"
              style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
            >
              {project.name.split(' ').slice(-1)[0]}
            </h2>
          </div>
          {/* Full Google Map */}
          <div className="flex-grow relative" style={{ minHeight: '400px' }}>
            <iframe
              title="Project Location"
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0, position: 'absolute', inset: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* ── HIGHLIGHTS SECTION ── */}
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-16">
        <h2 className="text-3xl font-black text-[#10243E] mb-8">Project Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {project.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-4 bg-white p-5 rounded shadow-sm border border-gray-100">
              <span className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0A1016] flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">✓</span>
              <span className="text-[#10243E] font-medium text-base leading-relaxed">{h}</span>
            </div>
          ))}
        </div>

        {/* ── ABOUT THIS PROJECT ──
            These 22 pages carried ~220 indexable words each and read as
            near-duplicates, which is why none of them ranked for the long-tail
            brand queries they should own. Everything below is built from this
            project's own fields — see src/lib/projectContent.js. */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 lg:gap-16 mt-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-black text-[#10243E] mb-5">About {project.name}</h2>
            <p className="text-lg text-[#10243E] leading-relaxed font-light border-l-2 border-[#D4AF37] pl-6 mb-12">
              {projectIntro(project)}
            </p>

            <ArticleBody sections={sections} />

            {/* Hub-and-spoke: the project page owns the brand query, the guides
                own the topic queries. Linking rather than repeating keeps every
                URL unique and pushes authority to the page that should rank. */}
            <div className="rounded-2xl border border-gray-200 p-6 mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-4">
                Read before you buy
              </p>
              <ul className="space-y-4">
                {[
                  ['/blog/how-to-verify-a-dholera-plot', 'How to verify a Dholera plot before you pay anything', 'NA, NOC, title chain, 7/12, encumbrance — what each one proves'],
                  ['/blog/dholera-plot-price-2026', 'What a Dholera plot actually costs in 2026', 'The price band, what drives it, and what the quote leaves out'],
                  ['/dholera/overview', 'The Dholera master plan: phases and zones', 'Why where a plot sits in the phasing matters more than distance'],
                ].map(([href, title, sub]) => (
                  <li key={href}>
                    <Link to={href} className="group block">
                      <p className="text-sm font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <section className="mb-4">
              <h2 className="text-2xl lg:text-3xl font-heading text-[#10243E] mb-6">
                {project.name} — frequently asked
              </h2>
              <div className="border-t border-gray-200">
                {faqs.map((f, i) => (
                  <div key={i} className="border-b border-gray-200">
                    <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}
                      className="w-full flex items-start justify-between gap-4 text-left py-5 group">
                      <span className="font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors">{f.q}</span>
                      <span className="shrink-0 text-[#D4AF37] mt-0.5 text-xl leading-none">{openFaq === i ? '\u2212' : '+'}</span>
                    </button>
                    {openFaq === i && <p className="text-gray-600 leading-[1.85] pb-6 pr-8 text-[15px]">{f.a}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* This used to be a custom <form> with no onSubmit handler at all —
              submitting it reloaded the page and dropped the enquiry. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <LeadForm
              source={`project:${id}`}
              headline={`Enquire about ${project.name}`}
              sub={project.status === 'Delivered'
                ? 'This project is delivered. Ask us about resale availability, or about the current launches nearby.'
                : 'We will send the plot layout, the approvals and a single all-in cost — land, stamp duty, registration and legal.'}
            />
          </aside>
        </div>
      </div>

      {/* WhatsApp float */}
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-50"
        aria-label="WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>
    </main>
  );
}
