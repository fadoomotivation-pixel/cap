import React from 'react';

// ─────────────────────────────────────────────────────────────
// Twelve icons drawn here rather than copied from anyone's site.
//
// The reference was a screenshot of dholera.gujarat.gov.in. Lifting those PNGs
// would have been someone else's artwork on our server, in a palette that is
// not ours — and we have already taken one IP notice on this site. These are
// stroke-only paths on a 24×24 grid, so they inherit currentColor, sit in the
// Capital Brix gold/navy, weigh nothing, and stay sharp on every screen.
//
// Stroke-only also buys the animation for free: a single path length can be
// drawn on, which is what makes the grid feel alive on a phone. See
// WhatSetsUsApart.jsx.
// ─────────────────────────────────────────────────────────────

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Skyline over a baseline — built infrastructure. */
export const IconInfrastructure = (p) => (
  <svg {...base} {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V9l4-3v15" />
    <path d="M9 21V5l5-2v18" />
    <path d="M14 21v-9l5 3v6" />
    <path d="M7 12h0M7 15h0M11 9h0M11 13h0M16 16h0" />
  </svg>
);

/** Government building — governance. */
export const IconGovernance = (p) => (
  <svg {...base} {...p}>
    <path d="M3 21h18" />
    <path d="M12 3 3 8h18L12 3Z" />
    <path d="M6 11v7M10 11v7M14 11v7M18 11v7" />
  </svg>
);

/** Plug meeting a socket — plug and play. */
export const IconPlugPlay = (p) => (
  <svg {...base} {...p}>
    <path d="M9 3v5M15 3v5" />
    <path d="M7 8h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8Z" />
    <path d="M12 16v5" />
  </svg>
);

/** People around a shared centre — social infrastructure. */
export const IconSocial = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7" r="2.6" />
    <path d="M7.5 20a4.5 4.5 0 0 1 9 0" />
    <circle cx="4.5" cy="11" r="1.9" />
    <path d="M1.5 19a3.3 3.3 0 0 1 4.2-3" />
    <circle cx="19.5" cy="11" r="1.9" />
    <path d="M22.5 19a3.3 3.3 0 0 0-4.2-3" />
  </svg>
);

/** Rising bars inside a briefcase — ease of business. */
export const IconBusiness = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M8 16v-2M12 16v-4M16 16v-6" />
  </svg>
);

/** Roads leaving the frame — external connectivity. */
export const IconExternal = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9V2M12 22v-7M9 12H2M22 12h-7" />
    <path d="M4.9 4.9 8 8M19.1 4.9 16 8M4.9 19.1 8 16M19.1 19.1 16 16" />
  </svg>
);

/** Figure at leisure by a home — live, work and play. */
export const IconLiveWorkPlay = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11 8 6l5 5" />
    <path d="M5 11v9h6v-9" />
    <circle cx="18" cy="6" r="2" />
    <path d="M18 8v5M15.5 10.5h5M16.5 20l1.5-7 1.5 7" />
  </svg>
);

/** Chip with legs — technology. */
export const IconTechnology = (p) => (
  <svg {...base} {...p}>
    <rect x="8" y="8" width="8" height="8" rx="1.4" />
    <path d="M10 3v5M14 3v5M10 16v5M14 16v5M3 10h5M3 14h5M16 10h5M16 14h5" />
  </svg>
);

/** Leaf over water — sustainability. */
export const IconSustainability = (p) => (
  <svg {...base} {...p}>
    <path d="M12 15c0-5 3.5-8 8-8 0 5-3.2 8-8 8Z" />
    <path d="M12 15c0-4-2.8-6.5-6.5-6.5C5.5 12.4 8.2 15 12 15Z" />
    <path d="M12 15v5" />
    <path d="M3 21c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0" />
  </svg>
);

/** Document with a tick and a motion cue — fast-track approvals. */
export const IconApprovals = (p) => (
  <svg {...base} {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 14.5 11 17l4.5-4.5" />
  </svg>
);

/** Shield — security. */
export const IconSecurity = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/** Grid of streets — internal connectivity. */
export const IconInternal = (p) => (
  <svg {...base} {...p}>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    <circle cx="9" cy="9" r="1.1" />
    <circle cx="15" cy="15" r="1.1" />
  </svg>
);
