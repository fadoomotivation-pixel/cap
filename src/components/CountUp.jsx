import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// A headline figure that counts up from zero when it scrolls into view.
//
// It takes the finished string — "₹91,000 Cr", "22.54 sq km", "8+" — rather
// than a number plus formatting props. The values live in content files that a
// non-developer edits, and asking them to split "₹91,000 Cr" into three fields
// is how those files start drifting from what the page shows.
//
// Anything with no number in it ("CIOC") passes straight through, so the
// component can be applied to a whole stats array without auditing it first.
// ─────────────────────────────────────────────────────────────

/** "₹91,000 Cr" -> { prefix: '₹', value: 91000, decimals: 0, suffix: ' Cr' } */
export function parseFigure(raw) {
  const s = String(raw ?? '');
  const m = s.match(/(-?[\d][\d,]*)(\.\d+)?/);
  if (!m) return null;
  const decimals = m[2] ? m[2].length - 1 : 0;
  const value = parseFloat(m[0].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  return {
    prefix: s.slice(0, m.index),
    suffix: s.slice(m.index + m[0].length),
    value,
    decimals,
    // Only re-introduce separators if the author wrote them. "2026" is a year
    // and must not come back as "2,026".
    grouped: m[0].includes(','),
  };
}

const fmt = (n, decimals, grouped) =>
  n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });

// Ease-out cubic: fast at the start, settling at the end. A linear count reads
// like a loading spinner; this reads like a number arriving.
const ease = (t) => 1 - Math.pow(1 - t, 3);

// useLayoutEffect does not exist on the server and React warns if you call it
// there. This component is rendered by scripts/prerender.mjs, so it needs the
// layout timing on the client and the plain effect on the server.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function CountUp({ value, duration = 1600, className = '', style }) {
  const parsed = parseFigure(value);
  const still = useReducedMotion();
  const ref = useRef(null);

  // Starts at the FINISHED figure, not at zero.
  //
  // Every public route is prerendered to real HTML at build time, and starting
  // at zero baked "₹0 Cr" into that HTML where "₹91,000 Cr" belongs — so the
  // one reader the prerender exists for, a crawler that does not run JS, was
  // told the Tata fab is worth nothing. The same HTML is also what a human
  // sees for the moment before hydration.
  //
  // The client resets to zero below, before the browser paints, so nothing
  // flashes and the animation is unchanged.
  const [shown, setShown] = useState(() => (parsed ? parsed.value : null));
  const [lifted, setLifted] = useState(true);

  useBeforePaint(() => {
    if (!parsed || still) return;
    setShown(0);
    setLifted(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // No number to animate, or the visitor asked for less motion — in both
    // cases the finished value is simply rendered.
    if (!parsed || still) { setLifted(true); return undefined; }
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    let done = false;

    const run = () => {
      const t0 = performance.now();
      setLifted(true);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        setShown(parsed.value * ease(t));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === 'undefined') { run(); return undefined; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting && !done) { done = true; run(); io.disconnect(); }
      }),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [parsed?.value, duration, still]); // eslint-disable-line react-hooks/exhaustive-deps

  // Not a figure: render the text and skip the machinery entirely.
  if (!parsed) return <span className={className} style={style}>{value}</span>;

  const text = parsed.prefix + fmt(shown ?? 0, parsed.decimals, parsed.grouped) + parsed.suffix;

  return (
    <span
      ref={ref}
      // The prerendered HTML and a crawler both need the real figure, not "0".
      // aria-label carries it, and the visible span is hidden from the
      // accessibility tree so a screen reader is not read a spinning number.
      aria-label={String(value)}
      className={className}
      style={{ perspective: '600px', display: 'inline-block', ...style }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          // The depth: the figure tips up out of the plane and settles flat.
          transform: lifted ? 'rotateX(0deg)' : 'rotateX(-75deg)',
          transformOrigin: '50% 100%',
          opacity: lifted ? 1 : 0,
          transition: still ? 'none' : 'transform 700ms cubic-bezier(.2,.7,.2,1), opacity 500ms ease-out',
          // Tabular figures stop the box from jittering as digit widths change
          // while it counts — without it the whole row twitches.
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {text}
      </span>
    </span>
  );
}
