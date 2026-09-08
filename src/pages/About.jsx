import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck2, MapPin, Phone, Award, Handshake } from 'lucide-react';
import Seo from '../components/Seo';
import { pageSeo } from '../lib/seo';
import { site } from '../data/site';

// ─────────────────────────────────────────────────────────────
// This page used to be Mirrikh Infratech's About page hosted on our domain:
// the eyebrow read "Mirrikh Infratech Pvt. Ltd.", the H1 read "Who We Are",
// and underneath came Mirrikh's founding story, vision, mission, corporate
// timeline and delivery statistics — followed by "The Team Behind Mirrikh"
// with our own founder under it. A visitor could reasonably conclude that
// Capital Brix was Mirrikh, or that Jasvinder Singh sat on Mirrikh's board.
//
// Mirrikh's notice of 8 Sep 2026 objected to exactly that. The page is now
// about Capital Brix LLP: what this company does, where the boundary with the
// developer sits, and who runs it. Facts about Mirrikh are limited to the
// short, clearly attributed block near the end.
//
// Nothing here should be padded with invented Capital Brix history — founding
// year, client counts, team size. If those are wanted, get them from the
// owner; do not compose them.
// ─────────────────────────────────────────────────────────────

const whatWeDo = [
  {
    Icon: Handshake,
    title: 'We sell, the developer builds',
    text: 'Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd. We market plots in the developer’s Dholera projects. We do not design, build, own or promote them.',
  },
  {
    Icon: FileCheck2,
    title: 'Documentation, checked before you pay',
    text: 'NA conversion, NOC, title and the approved layout plan — we put the paperwork in front of you and encourage you to have it independently verified before booking.',
  },
  {
    Icon: MapPin,
    title: 'Site visits you can actually make',
    text: 'A guided visit covering Dholera SIR, the airport site and the expressway, with pickup from Ahmedabad, so you see the location before deciding.',
  },
  {
    Icon: ShieldCheck,
    title: 'Registered sale deed, in your name',
    text: 'A purchase completes with a registered sale deed in the buyer’s own name — not an allotment letter or an agreement to sell.',
  },
];

export default function About() {
  return (
    <main className="pt-[72px] bg-[#F0F5FA] min-h-screen font-outfit">
      <Seo {...pageSeo.about} />

      {/* ── Banner ─────────────────────────────────────────── */}
      <div className="bg-[#10243E] py-16 md:py-20 text-center text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.25em] text-xs sm:text-sm mb-3">
            Capital Brix LLP · Noida
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">Who We Are</h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">
            A Dholera plot sales and advisory firm, and an authorised sales channel partner
            for Mirrikh Infratech Pvt. Ltd.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 md:py-20">

        {/* ── The boundary, said plainly and early ─────────── */}
        <section className="bg-white border-l-4 border-[#D4AF37] rounded-sm p-6 md:p-10 shadow-sm mb-16">
          <p className="text-[#9C7C1C] font-bold uppercase tracking-[0.25em] text-xs mb-3">
            Our Role
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-[#10243E] mb-5">
            What Capital Brix is — and what it is not
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            <strong className="text-[#10243E]">Capital Brix LLP</strong> is an independent firm
            based in Noida. We are an authorised sales channel partner for{' '}
            <strong className="text-[#10243E]">Mirrikh Infratech Pvt. Ltd.</strong>, which means
            we market and sell plots in projects that Mirrikh Infratech develops.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Capital Brix is <strong className="text-[#10243E]">not</strong> the owner, promoter,
            developer, management entity, subsidiary, group company or strategic partner of
            Mirrikh Infratech Pvt. Ltd. The two are separate companies. Every project shown on
            this website is developed and owned by Mirrikh Infratech; pricing, payment terms and
            project decisions are the developer’s to set, not ours to represent.
          </p>
        </section>

        {/* ── What we actually do ──────────────────────────── */}
        <section className="mb-16">
          <p className="text-[#9C7C1C] font-bold uppercase tracking-[0.25em] text-xs mb-3">
            What We Do
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-[#10243E] mb-8">
            The part of the purchase we handle
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {whatWeDo.map(({ Icon, title, text }) => (
              <div key={title} className="bg-white rounded-sm border border-gray-100 shadow-sm p-6">
                <div className="w-11 h-11 rounded-sm bg-[#FAF6E9] text-[#9C7C1C] flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-black text-[#10243E] mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Leadership — of Capital Brix, and labelled as such ── */}
        <section className="mb-16">
          <p className="text-[#9C7C1C] font-bold uppercase tracking-[0.25em] text-xs mb-3 text-center">
            Leadership
          </p>
          {/* Was "The Team Behind Mirrikh". The heading now names the company
              this person actually leads, so the role cannot be misread. */}
          <h2 className="text-2xl md:text-3xl font-black text-[#10243E] mb-10 text-center">
            The team behind Capital Brix
          </h2>
          <div className="flex justify-center">
            <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 max-w-md text-center">
              <img
                src="/founder.jpg"
                alt="Jasvinder Singh, Founder and CEO of Capital Brix LLP"
                className="w-28 h-28 rounded-full object-cover mx-auto mb-5 border-4 border-[#D4AF37]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://ui-avatars.com/api/?name=Jasvinder+Singh&background=10243E&color=fff&size=120';
                }}
              />
              <h3 className="text-xl font-black text-[#10243E] mb-1">Jasvinder Singh</h3>
              <p className="text-[#9C7C1C] font-bold text-sm uppercase tracking-wide mb-4">
                Founder &amp; CEO, Capital Brix LLP
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Jasvinder Singh founded Capital Brix LLP and leads its sales and advisory team
                from the firm’s Noida office. He holds no position in Mirrikh Infratech Pvt. Ltd.
              </p>
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#9C7C1C] bg-[#FAF6E9] border border-[#EADFBF] rounded-sm px-3 py-2">
                <Award size={14} /> Jagran Achievers Award 2026 · Almaty, Kazakhstan
              </p>
            </div>
          </div>
        </section>

        {/* ── The developer, briefly and attributed ────────── */}
        <section className="bg-[#10243E] rounded-sm p-6 md:p-10 text-white mb-16">
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.25em] text-xs mb-3">
            The Developer
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-5">
            About Mirrikh Infratech Pvt. Ltd.
          </h2>
          <p className="text-white/80 leading-relaxed mb-4">
            The projects marketed on this site are developed by Mirrikh Infratech Pvt. Ltd., a
            Dholera developer with 8+ completed projects since 2012, featured in Forbes India in
            March 2025.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Mirrikh Infratech Pvt. Ltd. and MAYUR are trademarks of their respective owner and
            are used here to identify the projects Capital Brix LLP is authorised to market. For
            the developer’s own corporate information, please refer to Mirrikh Infratech directly.
          </p>
        </section>

        {/* ── Contact ──────────────────────────────────────── */}
        <section className="bg-white rounded-sm border border-gray-100 shadow-sm p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-black text-[#10243E] mb-6">Where to find us</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <p className="flex items-start gap-3 text-gray-600">
              <MapPin size={18} className="text-[#9C7C1C] shrink-0 mt-0.5" />
              <span>{site.address}</span>
            </p>
            <p className="flex items-start gap-3 text-gray-600">
              <Phone size={18} className="text-[#9C7C1C] shrink-0 mt-0.5" />
              <a href={`tel:+${site.phone}`} className="hover:text-[#9C7C1C]">
                {site.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/contact"
              className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-sm text-sm font-bold transition-colors"
            >
              Book a site visit
            </Link>
            <Link
              to="/projects"
              className="border border-gray-300 hover:border-gray-500 text-[#10243E] px-6 py-3 rounded-sm text-sm font-semibold transition-colors"
            >
              See the projects
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
