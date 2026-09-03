import React from 'react';

/**
 * Generated cover art, one per post `tone`.
 *
 * The blog previously hotlinked 243 images from mirrikh.com's server — which
 * is bandwidth taken from someone else, breaks the moment they rename a
 * folder or add hotlink protection, and tells a crawler whose content this
 * really is. These are drawn in SVG instead: nothing to load, nothing to
 * break, and unmistakably ours.
 */
const TONES = {
  gold:   { from: '#1a1408', to: '#0A1016', accent: '#D4AF37' },
  navy:   { from: '#0d1c2e', to: '#0A1016', accent: '#7FB3D5' },
  green:  { from: '#0c1c16', to: '#0A1016', accent: '#5FD3A0' },
  sky:    { from: '#0a1a24', to: '#0A1016', accent: '#67C7E8' },
  violet: { from: '#161029', to: '#0A1016', accent: '#A78BFA' },
  teal:   { from: '#08201f', to: '#0A1016', accent: '#48C9B0' },
  indigo: { from: '#101431', to: '#0A1016', accent: '#8FA0F5' },
  amber:  { from: '#241703', to: '#0A1016', accent: '#F0B429' },
};

export default function BlogArt({ tone = 'gold', label, className = '', seed = 0 }) {
  const t = TONES[tone] || TONES.gold;
  const id = `${tone}-${seed}`;

  // Contour-style bands — a nod to a masterplan drawing, and different enough
  // per seed that two cards side by side don't look like the same image.
  const rings = Array.from({ length: 7 }, (_, i) => 46 + i * 26 + ((seed * 13 + i * 7) % 11));

  return (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" role="img"
      aria-label={label ? `${label} — Capital Brix` : 'Capital Brix'} className={className}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.from} />
          <stop offset="100%" stopColor={t.to} />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="78%" cy="18%" r="62%">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="450" fill={`url(#g-${id})`} />
      <rect width="800" height="450" fill={`url(#glow-${id})`} />

      <g stroke={t.accent} fill="none" opacity="0.22">
        {rings.map((r, i) => (
          <circle key={r} cx="620" cy="80" r={r} strokeWidth={i % 3 === 0 ? 1.4 : 0.6} />
        ))}
      </g>

      {/* plot-grid motif */}
      <g stroke={t.accent} opacity="0.16" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => <line key={`h${i}`} x1="0" y1={300 + i * 34} x2="800" y2={276 + i * 34} />)}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={`v${i}`} x1={60 + i * 108} y1="290" x2={40 + i * 108} y2="450" />)}
      </g>

      <rect x="0" y="0" width="6" height="450" fill={t.accent} opacity="0.9" />
    </svg>
  );
}

export const artTone = (post) => post.tone || 'gold';
