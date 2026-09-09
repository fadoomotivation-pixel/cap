import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Aerial footage of Dholera, advanced by the scroll wheel rather than by a
// clock. The visitor's own scrolling flies the camera down the corridor.
//
// Why a frame sequence and not the <video> we already ship: seeking a video by
// setting currentTime from a scroll handler is unreliable on iOS Safari, which
// throttles and rounds seeks and drops frames — the effect stutters exactly
// where most of this traffic is. Thirty-six decoded images in memory scrub
// perfectly on every device.
//
// The budget was paid for, not added: this replaces hero-bg.jpg, a 1.2 MB
// AI-generated skyline of a city that does not exist, which sat on the
// homepage of a company selling real land. Thirty-six frames come to 1.41 MB
// and are the actual place.
// ─────────────────────────────────────────────────────────────

const COUNT = 36;
const src = (i) => `/media/seq/f${String(i + 1).padStart(2, '0')}.webp`;

export default function CinematicReveal() {
  const still = useReducedMotion();
  const wrap = useRef(null);
  const canvas = useRef(null);
  const frames = useRef([]);
  const [loaded, setLoaded] = useState(0);
  const [active, setActive] = useState(false);

  // Nothing is fetched until the section is near. Below that, and for anyone on
  // reduced motion or a metered connection, the poster alone is the section.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    if (still || navigator.connection?.saveData) return undefined;

    let cancelled = false;
    const begin = () => {
      if (cancelled) return;
      setActive(true);
      let done = 0;
      for (let i = 0; i < COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames.current[i] = img;
          done += 1;
          setLoaded(done);
          // Paint the first frame the moment it lands so the canvas is never
          // an empty box waiting on the other thirty-five.
          if (i === 0) draw(0);
        };
        img.src = src(i);
      }
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { begin(); io.disconnect(); } }),
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [still]);

  const draw = (idx) => {
    const c = canvas.current;
    const img = frames.current[idx] || frames.current.find(Boolean);
    if (!c || !img) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== w * dpr || c.height !== h * dpr) {
      c.width = w * dpr; c.height = h * dpr;
    }
    // object-fit: cover, by hand — the canvas box and the frame rarely share
    // an aspect ratio, and a stretched aerial reads instantly as wrong.
    const s = Math.max((w * dpr) / img.width, (h * dpr) / img.height);
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, ((w * dpr) - dw) / 2, ((h * dpr) - dh) / 2, dw, dh);
  };

  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const travel = r.height - window.innerHeight;
        if (travel <= 0) return draw(0);
        // 0 at the moment the section tops out, 1 when it is scrolled through.
        const p = Math.min(1, Math.max(0, -r.top / travel));
        draw(Math.min(COUNT - 1, Math.round(p * (COUNT - 1))));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [active, loaded]);

  return (
    <section aria-labelledby="cinematic-heading" className="bg-[#0A1016]">
      {/* Words first, on their own ground — nothing is laid over the footage. */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-8 lg:pb-12">
        <p className="text-[#D4AF37] font-semibold tracking-[0.2em] uppercase text-xs mb-4">
          Fly the corridor
        </p>
        <h2 id="cinematic-heading" className="font-heading font-semibold text-white text-2xl sm:text-3xl lg:text-[2.75rem] leading-[1.1] tracking-[-0.02em] max-w-3xl mb-5">
          Scroll, and you are flying over the road they already built.
        </h2>
        <p className="text-gray-400 leading-relaxed max-w-2xl">
          Not a rendering, and not a city stitched together by software. This is the
          Activation Area of Dholera SIR as it stands — 72 km of road on a grid, with
          water, gas and ICT running in a corridor beneath it.
        </p>
      </div>

      {/* Three viewport heights of scroll drive thirty-six frames. */}
      <div ref={wrap} className="relative h-[260svh] lg:h-[300svh]">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <img
            src="/media/dholera-aerial-poster.jpg"
            alt="Aerial view of the completed road and utility corridor in the Dholera SIR Activation Area"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {active && (
            <canvas
              ref={canvas}
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* A scroll cue, because a sticky full-screen frame otherwise reads
              as a page that has stopped responding. */}
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/60">
              {still ? 'Dholera SIR' : 'Keep scrolling'}
            </span>
            {!still && (
              <span className="w-px h-8 bg-gradient-to-b from-white/70 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
        <p className="text-[10px] text-white/40 tracking-wide text-right">
          Footage: official Dholera SIR film · Government of Gujarat / DICDL
        </p>
      </div>
    </section>
  );
}
