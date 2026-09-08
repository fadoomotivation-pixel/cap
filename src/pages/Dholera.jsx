import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Compass,
  Layers,
  Building2,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Seo from '../components/Seo';
import BlogArt from '../components/BlogArt';
import CountUp from '../components/CountUp';
import DholeraInfrastructure from '../components/DholeraInfrastructure';
import { pageSeo, absoluteUrl, SITE_URL, SITE_NAME } from '../lib/seo';
import { site } from '../data/site';

const pillarPages = [
  {
    slug: 'about',
    tone: 'navy',
    eyebrow: 'Statutory Framework',
    title: 'What Is Dholera SIR? India’s First Greenfield Smart City',
    desc: 'The legal designation under the Gujarat SIR Act 2009, DMIC corridor integration, and why trunk infrastructure was constructed before the population arrived.',
    highlights: ['Special Investment Region status', '≈ 920 sq km master plan', 'Tata semiconductor fab anchor', 'Statutory land pooling process'],
    icon: Building2,
  },
  {
    slug: 'overview',
    tone: 'teal',
    eyebrow: 'Master Plan & Zoning',
    title: 'Dholera Master Plan: Phases, Zones & Activation Area',
    desc: 'How the 6 Town Planning (TP) schemes and 27 sub-schemes are phased, the 22.54 sq km Activation Area, and zoning categories from residential to industrial.',
    highlights: ['TP Schemes 1 through 6', 'Activation Area (TP 2A & 4A)', 'Land-use zoning allocations', 'Phasing & investment time horizons'],
    icon: Layers,
  },
  {
    slug: 'city-highlights',
    tone: 'sky',
    eyebrow: 'Trunk Infrastructure',
    title: 'Dholera Smart City Infrastructure: What Is Actually Built',
    desc: 'Multi-utility underground corridors, 72 km completed road network, 50 MLD WTP, 20 MLD CETP, and the LEED Gold ABCD Building housing the CIOC command room.',
    highlights: ['Underground utility corridors', '72 km operational roads (18m–70m)', '50 MLD WTP & 20 MLD CETP', 'City Integrated Operations Centre (CIOC)'],
    icon: ShieldCheck,
  },
  {
    slug: 'renew-power',
    tone: 'green',
    eyebrow: 'Power & Sustainability',
    title: 'Dholera Solar Park: Renewable Power Behind the SIR',
    desc: 'The 5,000 MW Ultra Mega Solar Power Park and Torrent Power SCADA-automated 400/220 kV substation providing clean, uninterrupted power for high-tech industry.',
    highlights: ['5,000 MW Solar Park capacity', 'Torrent Power gas-insulated substation', 'Dual GETCO grid redundancy', 'Zero liquid discharge design'],
    icon: Zap,
  },
  {
    slug: 'virtual-tour',
    tone: 'amber',
    eyebrow: 'Official 360° Panorama',
    title: 'Official Dholera Virtual Tour: 360° Ground Reality & Sourcing',
    desc: 'Interactive 360° panoramas hosted by the Government of Gujarat and DICDL, capturing physical roads, utility plants, and the ABCD Building.',
    highlights: ['Official Government of Gujarat tour', '360° panoramic photographic nodes', 'Verified Activation Area footage', 'Viewer navigation & sourcing guide'],
    icon: Compass,
  },
];

const officialStats = [
  { value: '≈ 920 sq km', label: 'Total DSIR Area', sub: '22 villages in Ahmedabad district' },
  { value: '22.54 sq km', label: 'Activation Area', sub: 'TP 2A & 4A trunk infrastructure complete' },
  { value: '72 km', label: 'Internal Roads', sub: '18m to 70m ROW with underground ducts' },
  { value: '₹91,000 Cr', label: 'Tata Chip Fab', sub: 'Commercial semiconductor anchor industry' },
];

export default function Dholera() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': absoluteUrl('/dholera'),
        name: pageSeo.dholera.title,
        description: pageSeo.dholera.description,
        url: absoluteUrl('/dholera'),
        inLanguage: 'en-IN',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-capital-brix.png` },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Dholera SIR', item: absoluteUrl('/dholera') },
        ],
      },
    ],
  };

  return (
    <main className="bg-white font-outfit min-h-screen">
      <Seo
        title={pageSeo.dholera.title}
        description={pageSeo.dholera.description}
        path={pageSeo.dholera.path}
        jsonLd={jsonLd}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative bg-[#0A1016] text-white pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <BlogArt tone="gold" label="Dholera SIR Master Plan" seed={10} className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1016] via-[#0A1016]/80 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link to="/" className="hover:text-[#D4AF37] transition-colors">Home</Link>
            <ChevronRight size={13} />
            <span className="text-white/80">Dholera SIR</span>
          </nav>

          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            India’s First Greenfield Smart City · Gujarat
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl lg:leading-[1.15] max-w-4xl mb-6">
            Dholera Special Investment Region (DSIR): Master Plan, Infrastructure &amp; Ground Reality
          </h1>
          <p className="text-gray-300 text-base sm:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mb-10">
            A comprehensive, verified guide to Dholera SIR’s 920 sq km statutory master plan, the 22.54 sq km completed Activation Area, utility capacities, and the official Government of Gujarat 360° virtual tour.
          </p>

          <div className="flex flex-wrap gap-2 text-xs">
            {['DMIC Node', 'Gujarat SIR Act 2009', 'DSIRDA Sanctioned', 'DICDL Executed'].map((tag) => (
              <span key={tag} className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-white/90">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Statutory Stats Strip ───────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-200 py-10" aria-label="Trunk Infrastructure Key Figures">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {officialStats.map((st) => (
              <div key={st.label} className="border-l-2 border-[#D4AF37] pl-4">
                <p className="text-2xl sm:text-3xl font-bold text-[#10243E] font-heading"><CountUp value={st.value} /></p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9C7C1C] mt-1">{st.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{st.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built infrastructure with the official aerial film — the section a
          buyer actually wants before a site visit. */}
      <DholeraInfrastructure />

      {/* ── Five Pillar Routing Grid ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-3">
            In-Depth Guides
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-[#10243E] leading-tight mb-4">
            Explore the Five Pillars of Dholera SIR
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Every section below is backed by official statutory sources from the Government of Gujarat, DSIRDA, and DICDL. Select a pillar to inspect master plan specifications, legal governance, and ground reality.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillarPages.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.slug}
                className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-[#0A1016] overflow-hidden">
                    <BlogArt tone={pillar.tone} label={pillar.title} seed={i + 15} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1016]/90 via-[#0A1016]/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
                        {pillar.eyebrow}
                      </span>
                      <Icon size={18} className="text-[#D4AF37]" />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-heading font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug mb-3">
                      <Link to={`/dholera/${pillar.slug}`}>
                        {pillar.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {pillar.desc}
                    </p>

                    <div className="border-t border-gray-100 pt-4 mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                        Key Topics Covered:
                      </p>
                      <ul className="space-y-1.5">
                        {pillar.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 size={13} className="text-[#9C7C1C] shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Link
                    to={`/dholera/${pillar.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#9C7C1C] hover:text-[#B8860B] transition-colors"
                  >
                    Read Guide <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            );
          })}

          {/* Airport Blog Link Card */}
          <article className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="relative h-44 bg-[#0A1016] overflow-hidden">
                <BlogArt tone="sky" label="Dholera International Airport" seed={33} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1016]/90 via-[#0A1016]/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
                    Aviation Hub
                  </span>
                  <Building2 size={18} className="text-[#D4AF37]" />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-heading font-medium text-[#10243E] group-hover:text-[#9C7C1C] transition-colors leading-snug mb-3">
                  <Link to="/blog/dholera-international-airport">
                    Dholera International Airport at Navagam
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Detailed analysis of the greenfield cargo and passenger airport, 3,200m runway, AAI/DIACL partnership, and what airport proximity means for surrounding plot values.
                </p>

                <div className="border-t border-gray-100 pt-4 mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Key Topics Covered:
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#9C7C1C] shrink-0" />
                      <span>DIACL joint venture structure</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#9C7C1C] shrink-0" />
                      <span>Navagam location &amp; expressway connection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#9C7C1C] shrink-0" />
                      <span>Cargo handling capacity &amp; timeline</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <Link
                to="/blog/dholera-international-airport"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#9C7C1C] hover:text-[#B8860B] transition-colors"
              >
                Read Airport Guide <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ── Governance Clarification ───────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-200 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C7C1C] mb-3">
              Administrative Architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-heading text-[#10243E] leading-tight mb-4">
              Who Governs What in Dholera SIR?
            </h2>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              Dholera’s execution is separated into distinct statutory and operational bodies under Gujarat state law. Understanding this demarcation ensures investors verify approvals with the competent authority.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9C7C1C] mb-2">Apex Body</p>
              <h3 className="text-lg font-heading text-[#10243E] font-medium mb-3">GIDB</h3>
              <p className="text-xs text-gray-500 font-semibold mb-3">Gujarat Infrastructure Development Board</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Chaired by the Hon’ble Chief Minister of Gujarat. GIDB serves as the state-level apex authority steering infrastructure policy, public-private partnership concessions, and high-level approvals across Gujarat’s economic regions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9C7C1C] mb-2">Regulatory Authority</p>
              <h3 className="text-lg font-heading text-[#10243E] font-medium mb-3">DSIRDA</h3>
              <p className="text-xs text-gray-500 font-semibold mb-3">Dholera SIR Development Authority</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Constituted under the Gujarat SIR Act 2009. DSIRDA exercises statutory planning jurisdiction, sanctions Town Planning (TP) schemes, handles land pooling, administers development regulations, and enforces building bye-laws.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9C7C1C] mb-2">Implementation SPV</p>
              <h3 className="text-lg font-heading text-[#10243E] font-medium mb-3">DICDL</h3>
              <p className="text-xs text-gray-500 font-semibold mb-3">Dholera Industrial City Development Ltd.</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Joint venture SPV (51% Gujarat Govt via DSIRDA, 49% Central Govt via NICDIT). DICDL finances, tenders, constructs, and maintains trunk infrastructure, manages utilities, and executes 99-year industrial land lease allotments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="bg-[#0A1016] text-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Ground Verification
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-white leading-tight mb-4 max-w-2xl mx-auto">
            See the Infrastructure in Person Before You Invest
          </h2>
          <p className="text-gray-400 font-light text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Dholera is approximately an hour from Ahmedabad via the expressway. Inspect the operational roads, boundary demarcations, and verify the NA conversion order and title documents in hand.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3.5 rounded-sm font-semibold transition-colors shadow-md text-sm"
            >
              Book a Free Site Visit <ArrowRight size={16} />
            </a>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white/70 text-white px-6 py-3.5 rounded-sm font-medium transition-colors text-sm"
            >
              Browse Verified Projects
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
