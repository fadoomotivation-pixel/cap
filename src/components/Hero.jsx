import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { site } from '../data/site';

const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

export default function Hero() {
  const video = useRef(null);
  const [ready, setReady] = useState(false);

  // Deliberately starts false and is decided in the effect below, never in the
  // initial state. Reading window during render makes the prerendered HTML and
  // the first client render disagree — the server has no <video>, the browser
  // does — and React throws a hydration mismatch (#418) on every homepage.
  // That is precisely the bug the prerendering work exists to avoid.
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Two reasons to stay on the still image: the visitor asked their OS for
    // less motion, or they are on a metered connection with Save-Data set.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    if (reduced || saveData) return undefined;
    setShowVideo(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (!showVideo) return undefined;
    let cancelled = false;

    // Deferred to idle so the fetch queues behind the fonts, CSS and JS the
    // page actually needs to render. A hero video that delays first paint is
    // worse than no hero video.
    const attach = () => {
      const el = video.current;
      if (!el || cancelled || el.dataset.loaded) return;
      el.dataset.loaded = '1';
      [['/media/dholera-aerial.webm', 'video/webm'],
       ['/media/dholera-aerial.mp4', 'video/mp4']].forEach(([src, type]) => {
        const source = document.createElement('source');
        source.src = src; source.type = type;
        el.appendChild(source);
      });
      el.load();
      // Rejection is fine and expected on some battery-saver settings — the
      // poster stays, which is a perfectly good hero.
      el.play().catch(() => {});
    };

    const id = 'requestIdleCallback' in window
      ? window.requestIdleCallback(attach, { timeout: 2500 })
      : window.setTimeout(attach, 1200);
    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [showVideo]);

  return (
    <section className="relative w-full bg-[#0A1016]">

      {/* The film gets a clean band of its own. Nothing is laid over it — the
          headline used to sit on top, and a dark scrim plus white type across
          the middle of the frame is exactly what stops aerial footage reading
          as footage. The top padding clears the fixed navbar, so the video is
          never behind it either.

          The poster paints first and is what Largest Contentful Paint
          measures; the clip is attached at idle, after the page is
          interactive, so 1.2 MB never sits in front of first render. */}
      <div className="pt-[68px] lg:pt-[76px]">
        <div className="relative w-full h-[42svh] sm:h-[52svh] lg:h-[64svh] overflow-hidden bg-[#141c26]">
          <img
            src="/media/dholera-aerial-poster.jpg"
            alt="Aerial view of completed roads and utility infrastructure in the Dholera SIR Activation Area"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {showVideo && (
            <video
              ref={video}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
              loop muted playsInline preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setReady(true)}
            />
          )}
        </div>

        {/* Credit sits under the frame rather than on it, for the same reason. */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-[10px] text-white/40 tracking-wide text-right pt-2">
            Footage: official Dholera SIR film · Government of Gujarat / DICDL
          </p>
        </div>
      </div>

      {/* ── The words, on their own ground ───────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6 pb-16 lg:pt-10 lg:pb-24">
        <div className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-7"
          >
            <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-5">
              Authorised Sales Channel Partner • Mirrikh Infratech
            </p>
            {/* No forced <br>: at 4rem the first clause did not fit the column
                and "City," fell to a line of its own. text-wrap:balance lets the
                browser even the lines out at whatever width it actually gets. */}
            <h1
              className="text-white font-heading font-semibold leading-[1.08] tracking-[-0.02em] text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem]"
              style={{ textWrap: 'balance' }}
            >
              Plots in Dholera Smart City, where India&apos;s next city is being built.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mb-10 font-light"
          >
            NA-approved, title-clear plots in Dholera Smart City from ₹7,250 / sq yd, in projects
            developed by Mirrikh Infratech. Full documentation support from our Noida office.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href={wa} target="_blank" rel="noreferrer"
              className="group inline-flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-8 py-4 rounded-sm font-semibold transition-colors duration-300"
            >
              Book a Site Visit
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center gap-3 border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-sm font-medium transition-colors duration-300"
            >
              View Projects
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
