import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import { developer } from '../data/site';

/**
 * The developer's track record — Mirrikh Infratech's figures, awards and
 * annual event — rendered with the attribution on every element, because
 * none of it is Capital Brix's own history (see CLAUDE.md, "The Mirrikh
 * relationship"). Capital Brix appears only as the sales channel partner.
 *
 * `compact` drops the award photographs and event gallery (homepage); the
 * full version lives on /projects#developer.
 */
export default function DeveloperTrust({ compact = false }) {
  const { stats, awards, event } = developer;

  return (
    <section id="developer" className="bg-[#0A1016] text-white py-20 lg:py-28 scroll-mt-20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14">
          <div className="lg:col-span-8">
            <p className="text-[#C9A962] text-xs font-medium tracking-[0.18em] uppercase mb-4">
              The developer · {developer.name}
            </p>
            <h2 className="text-white font-heading text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-5">
              In Dholera since {developer.since}. Recognised for it.
            </h2>
            <p className="text-white/65 text-base lg:text-lg leading-relaxed max-w-2xl">
              Every project on this site is developed by {developer.name}. Capital Brix LLP is an
              authorised sales channel partner of Mirrikh Infratech Pvt. Ltd. — we sell, they build.
              The figures and awards below are Mirrikh Infratech’s.
            </p>
          </div>
          <div className="lg:col-span-4 lg:justify-self-end">
            <img
              src={developer.logo}
              alt="Mirrikh Group logo — developer of the projects marketed by Capital Brix"
              width="480"
              height="267"
              loading="lazy"
              decoding="async"
              className="w-40 lg:w-48 h-auto opacity-90"
            />
          </div>
        </div>

        {/* Figures — Mirrikh's, attributed in the caption below the grid */}
        <dl className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 border border-white/10">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0A1016] p-6 lg:p-8 last:col-span-2 lg:last:col-span-1">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-3xl lg:text-4xl text-white mb-2">{s.value}</dd>
              <dd className="text-[11px] uppercase tracking-[0.14em] text-white/50 leading-relaxed">{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-white/40">
          Mirrikh Infratech figures, from the developer’s own collateral (checked 6 October 2026).
        </p>

        {/* Awards */}
        <div className="mt-16">
          <h3 className="text-white font-heading text-2xl lg:text-3xl mb-8">Awards and recognition — Mirrikh Infratech</h3>
          {compact ? (
            <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/10 border border-white/10">
              {awards.map((a) => (
                <li key={a.year} className="bg-[#0A1016] p-6">
                  <p className="text-[#C9A962] font-heading text-2xl mb-2">{a.year}</p>
                  <p className="text-white text-sm font-medium leading-snug mb-1">{a.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{a.note}</p>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {awards.map((a) => (
                <li key={a.year} className="flex flex-col">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={`${a.title} ${a.year}, received by Mirrikh Infratech`}
                      width={a.w}
                      height={a.h}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[3/2] object-cover object-top rounded-sm bg-white/5"
                    />
                  ) : (
                    <div className="w-full aspect-[3/2] rounded-sm border border-white/10 flex items-center justify-center">
                      <Award size={40} strokeWidth={1} className="text-[#C9A962]" aria-hidden="true" />
                    </div>
                  )}
                  <p className="text-[#C9A962] font-heading text-xl mt-4">{a.year}</p>
                  <p className="text-white font-medium leading-snug">{a.title}</p>
                  <p className="text-white/55 text-sm leading-relaxed mt-1">{a.note}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Annual event */}
        {!compact && (
          <div className="mt-20">
            <h3 className="text-white font-heading text-2xl lg:text-3xl mb-2">{event.name}</h3>
            <p className="text-white/60 text-sm mb-8 max-w-2xl">{event.text}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {event.photos.map((ph) => (
                <figure key={ph.src}>
                  <img
                    src={ph.src}
                    alt={ph.alt}
                    width={ph.w}
                    height={ph.h}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-video object-cover rounded-sm bg-white/5"
                  />
                </figure>
              ))}
            </div>
          </div>
        )}

        {compact && (
          <Link
            to="/projects#developer"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:gap-3 transition-all"
          >
            The awards, with photographs <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </section>
  );
}
