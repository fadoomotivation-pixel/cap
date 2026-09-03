// ─────────────────────────────────────────────────────────────
// SEO CONFIG — single source of truth for domain + page metadata
//
// IMPORTANT: SITE_URL must match the domain that actually serves
// the site (the one attached in Vercel). A canonical pointing at a
// domain you don't serve tells Google to rank that other domain
// instead, which kills rankings. Change it in ONE place here.
// ─────────────────────────────────────────────────────────────

export const SITE_URL = 'https://www.capitalbrix.co.in';
export const SITE_NAME = 'Capital Brix';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-capital-brix.jpg`;

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Page-level metadata. Each entry targets a distinct keyword cluster so
// pages don't compete with each other for the same query.
export const pageSeo = {
  home: {
    title: 'Dholera Smart City Plots | Capital Brix — Official Strategy Partner of Mirrikh Infratech',
    description:
      'Buy NA-approved, title-clear plots in Dholera SIR from ₹7,250/sq yd at direct developer pricing. Capital Brix is the official strategy partner of Mirrikh Infratech. Near Dholera International Airport & the Ahmedabad–Dholera Expressway. Free site visit.',
    path: '/',
  },
  about: {
    title: 'About Capital Brix | Official Strategy Partner of Mirrikh Infratech in Dholera',
    description:
      'Capital Brix LLP is the official strategy partner of Mirrikh Infratech, a Dholera developer with 8+ completed projects since 2012. Award-winning leadership, verified inventory and end-to-end buyer support.',
    path: '/about',
  },
  projects: {
    title: 'Dholera Plot Projects | Mayur Greenz II, Evana, Enclave 5 & Signature',
    description:
      'Compare residential and industrial plot projects in Dholera Smart City — Mayur Greenz II, Mayur Evana, Mayur Enclave 5, Mayur Signature and Mayur Industrial Park. Current pricing, sizes, approvals and payment plans.',
    path: '/projects',
  },
  dholera: {
    title: 'Dholera SIR Guide 2026 | Smart City Investment, Airport & Expressway',
    description:
      'Everything about Dholera Special Investment Region — India\'s first greenfield smart city. Tata semiconductor fab, Dholera International Airport, the Ahmedabad–Dholera Expressway, master plan, land prices and investment outlook.',
    path: '/dholera',
  },
  contact: {
    title: 'Contact Capital Brix | Book a Free Dholera Site Visit',
    description:
      'Talk to the Capital Brix team about plots in Dholera Smart City. Call +91 70489 17300 or book a free, no-obligation site visit from our Noida office.',
    path: '/contact',
  },
  blog: {
    title: 'Dholera Insights: Price, Legal & Infrastructure Guides',
    description:
      'Practical guides for Dholera plot buyers — what land costs in 2026, how to verify NA/NOC/title documents, what the airport, expressway and Tata fab actually mean, and an NRI buying checklist.',
    path: '/blog',
  },
  events: {
    title: 'Capital Brix Events | Dholera Site Visits & Investor Meets',
    description:
      'Upcoming Capital Brix site visits, investor meets and property expos for Dholera Smart City plot buyers.',
    path: '/events',
  },
};

// Private/utility routes must never be indexed.
export const noIndexRoutes = ['/employee-kyc', '/admin/interviews', '/book'];

// ── Blog posts ───────────────────────────────────────────────
// Each post owns one keyword cluster and gets its own canonical URL, so the
// blog can actually rank instead of being one page of truncated excerpts.

export const blogPostSeo = (post) => ({
  title: post.seoTitle || post.title,
  description: post.excerpt,
  path: `/blog/${post.slug}`,
});

/** BlogPosting + FAQPage + BreadcrumbList for a post. Only marks up content
 *  that is actually rendered on the page — invisible schema is a manual-action
 *  risk, not a shortcut. */
export const blogPostJsonLd = (post) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      inLanguage: 'en-IN',
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/blog/${post.slug}`) },
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-capital-brix.png` },
      },
      about: post.keyword,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
        { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
      ],
    },
    ...(post.faqs?.length
      ? [{
          '@type': 'FAQPage',
          mainEntity: post.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }]
      : []),
  ],
});
