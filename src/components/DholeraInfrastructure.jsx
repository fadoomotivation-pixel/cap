import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import CountUp from './CountUp';

// ─────────────────────────────────────────────────────────────
// What is actually built inside the Activation Area, with the official aerial
// film looping alongside it.
//
// Every figure here is DICDL's published number and is credited on-page. The
// prose is ours — the point of the section is that a buyer can check these
// against the source, so the source is named rather than absorbed.
// ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'ABCD Building',
    sub: 'Administrative and Business Centre for Dholera',
    body: 'The region’s administrative hub, and home to the City Integrated Operations Centre — the control room from which traffic, utilities and surveillance across the city are monitored in one place.',
    stat: 'CIOC', statLabel: 'City command centre',
    img: null,
  },
  {
    title: 'Road network & utility corridor',
    sub: 'Inside the Activation Area',
    body: 'Roads from 18 m to 70 m wide, built on a grid, with water, gas and ICT running through a corridor underneath rather than being dug in later. Footpaths, cycle lanes and a reserved transit corridor are part of the same section.',
    stat: '72 km', statLabel: 'Internal roads built',
    img: '/media/dholera-road-corridor.jpg',
    alt: 'Aerial view of a wide dual-carriageway road with an underground utility corridor at Dholera SIR',
  },
  {
    title: 'Water Treatment Plant',
    sub: 'Piped supply across the Activation Area',
    body: 'Treated water is held in balancing reservoirs and distributed through a piped network with elevated service reservoirs, so pressure holds across industrial, residential and institutional zones alike.',
    stat: '50 MLD', statLabel: 'Scalable to 150 MLD',
    img: '/media/dholera-treatment-plant.jpg',
    alt: 'Aerial view of the water treatment facility at Dholera SIR',
  },
  {
    title: 'Common Effluent Treatment Plant',
    sub: 'Industrial wastewater',
    body: 'A shared effluent plant sized for a range of industrial sectors, so an occupier is not left building its own treatment capacity before it can operate.',
    stat: '20 MLD', statLabel: 'Scalable to 60 MLD',
    img: null,
  },
  {
    title: 'Sewage Treatment Plant',
    sub: 'Water returned for re-use',
    body: 'Recycled water from the sewage plant is provisioned back for domestic use, which is what makes the region’s water infrastructure a loop rather than a one-way line.',
    stat: '10 MLD', statLabel: 'Scalable to 30 MLD',
    img: null,
  },
  {
    title: 'Canal Front',
    sub: 'Stormwater management and public space',
    body: 'A canal front that carries stormwater runoff and doubles as public realm — a green belt with space for art, culture and recreation rather than a bare drainage channel.',
    stat: '6.5 km', statLabel: 'Canal front developed',
    img: null,
  },
];

const AUTO_MS = 6000;

export default function DholeraInfrastructure() {
  const still = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const go = useCallback((n) => setI((c) => (n + SLIDES.length) % SLIDES.length), []);

  // Auto-advance, but never against the user: it stops while they are
  // interacting, and never starts at all if the OS asked for reduced motion.
  useEffect(() => {
    if (paused || still) return undefined;
    timer.current = setTimeout(() => go(i + 1), AUTO_MS);
    return () => clearTimeout(timer.current);
  }, [i, paused, still, go]);

  // The 1.1 MB clip is fetched only once the section is actually on screen, and
  // then played by hand. Attaching src up front costs every visitor the file
  // whether they scroll this far or not; `preload="none"` alone stops the fetch
  // but also stops autoplay, so the source is attached here and play() called.
  const video = useRef(null);
  useEffect(() => {
    const el = video.current;
    if (!el || el.dataset.loaded) return undefined;

    const start = () => {
      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      // Two encodes, chosen by the browser. WebM/VP9 is preferred where it is
      // supported; H.264 in MP4 is the one Safari and iOS will actually decode,
      // so neither alone covers everyone.
      [['/media/dholera-aerial.webm', 'video/webm'],
       ['/media/dholera-aerial.mp4', 'video/mp4']].forEach(([src, type]) => {
        const source = document.createElement('source');
        source.src = src; source.type = type;
        el.appendChild(source);
      });
      el.load();
      // A rejected play() is normal — a data-saver setting or an OS-level
      // battery mode can refuse it. The poster stays up, which is a fine
      // outcome, so the rejection is swallowed rather than logged as an error.
      el.play().catch(() => {});
    };

    if (typeof IntersectionObserver === 'undefined') { start(); return undefined; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { start(); io.disconnect(); } }),
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const s = SLIDES[i];

  return (
    <section
      className="py-16 lg:py-24 bg-[#0A1016] text-white overflow-hidden"
      aria-labelledby="infra-heading"
      aria-roledescription="carousel"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-8 lg:mb-12">
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-xs mb-3">
            Built, not proposed
          </p>
          <h2 id="infra-heading" className="font-heading text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4">
            The infrastructure already standing in the Activation Area
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Dholera is easy to sell on renderings. These are the pieces that exist on the
            ground today, with the capacities published by the development authority.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-6 lg:gap-10 items-stretch">

          {/* ── The film ───────────────────────────────────── */}
          <figure className="relative rounded-sm overflow-hidden bg-[#141c26] m-0">
            <video
              ref={video}
              className="w-full h-full object-cover aspect-video"
              // Muted + playsInline is the only combination iOS Safari will
              // autoplay at all. There is deliberately no `autoPlay` and no
              // `src` here — see the effect above: preload="none" and autoPlay
              // together mean the browser never fetches the file and the video
              // simply never starts, which is exactly what happened the first
              // time this shipped.
              loop
              muted
              playsInline
              preload="none"
              poster="/media/dholera-aerial-poster.jpg"
              aria-label="Aerial footage of completed roads and utility infrastructure at Dholera SIR"
            />
            <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-10 pb-3">
              <span className="text-[11px] text-white/70">
                Footage from the official Dholera SIR film · Government of Gujarat / DICDL
              </span>
            </figcaption>
          </figure>

          {/* ── The slider ─────────────────────────────────── */}
          <div
            className="relative bg-[#111a24] rounded-sm p-5 sm:p-7 flex flex-col"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className="flex-1 min-h-[320px] sm:min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={s.title}
                  initial={still ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={still ? {} : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  aria-live="polite"
                >
                  {s.img && (
                    <img
                      src={s.img}
                      alt={s.alt}
                      loading="lazy"
                      className="w-full aspect-[16/9] object-cover rounded-sm mb-4"
                    />
                  )}
                  <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-1.5">
                    {s.sub}
                  </p>
                  <h3 className="font-heading text-xl sm:text-2xl mb-3">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">{s.body}</p>
                  <p className="inline-flex items-baseline gap-2 border-l-2 border-[#D4AF37] pl-3">
                    <span className="text-2xl font-bold text-white font-heading"><CountUp key={s.title} value={s.stat} /></span>
                    <span className="text-xs text-gray-400">{s.statLabel}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Controls ─────────────────────────────────── */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
              <button
                onClick={() => go(i - 1)} aria-label="Previous"
                className="w-9 h-9 rounded-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
              ><ChevronLeft size={17} /></button>
              <button
                onClick={() => go(i + 1)} aria-label="Next"
                className="w-9 h-9 rounded-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
              ><ChevronRight size={17} /></button>

              <div className="flex gap-1.5 flex-1 justify-center">
                {SLIDES.map((sl, n) => (
                  <button
                    key={sl.title}
                    onClick={() => go(n)}
                    aria-label={`Go to ${sl.title}`}
                    aria-current={n === i}
                    className={`h-1.5 rounded-full transition-all ${
                      n === i ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* An auto-advancing carousel with no way to stop it is a WCAG
                  failure, and genuinely irritating mid-sentence on a phone. */}
              {!still && (
                <button
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? 'Resume automatic slides' : 'Pause automatic slides'}
                  className="w-9 h-9 rounded-sm border border-white/15 flex items-center justify-center text-white/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                >{paused ? <Play size={15} /> : <Pause size={15} />}</button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6 max-w-3xl">
          Capacities and lengths as published by Dholera Industrial City Development Limited
          (DICDL), Government of Gujarat. Capital Brix LLP is an authorised sales channel
          partner for Mirrikh Infratech Pvt. Ltd. and is not connected to DICDL or the
          Government of Gujarat.
        </p>
      </div>
    </section>
  );
}
