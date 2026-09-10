/**
 * Live events that take registrations.
 *
 * One entry per event, keyed by the slug that also goes into
 * `cb_event_registrations.event_slug` — so a registration row can always be
 * traced back to which event it was for, even after this file moves on to the
 * next one.
 *
 * ── Editing checklist ──────────────────────────────────────────────────────
 * `time`      is null until the organisers confirm it. The page prints
 *             "Timing confirmed on WhatsApp" while it is null rather than
 *             guessing — a wrong time on a live invite is worse than none.
 * Adding an event: give it a slug, add the route to src/App.jsx AND to
 * public/sitemap.xml (routes come from the sitemap, so a page missing there is
 * never prerendered and a crawler sees an empty div).
 *
 * ── Wording ────────────────────────────────────────────────────────────────
 * `hosts` names the two organisations that host the seminar. It must not
 * describe Mirrikh as anything Capital Brix owns, manages or is part of, and
 * must not describe Mirrikh's pricing, discounts or commission policy — see
 * "The Mirrikh relationship" in CLAUDE.md. Capital Brix is an authorised sales
 * channel partner, nothing more and nothing less.
 */

export const events = {
  'dholera-wealth-2026': {
    slug: 'dholera-wealth-2026',
    title: 'How to Create Wealth in Dholera?',
    tagline: 'A free investor seminar on India’s first greenfield smart city',
    date: '2026-09-13',
    dateLabel: 'Sunday, 13 September 2026',
    time: null,
    venue: 'Club GH-01, E Block, Gaur City 1, Sector 4',
    venueFull:
      'The Gaurs Sarovar Premiere, Club GH-01, E Block, Gaur City 1, Sector 4, Noida Extension, Greater Noida, Uttar Pradesh 201309',
    mapsUrl: 'https://maps.google.com/?q=Gaur+City+1+Club+GH-01+Sector+4+Noida+Extension+Greater+Noida',
    hosts: ['Mirrikh Group', 'Capital Brix LLP'],
    price: 'Free entry · registration required',
    seats: 'Limited seats',

    // What someone actually gets for giving up a Saturday. Every line here is
    // something the seminar covers — nothing about pricing policy, discounts
    // or commission, which are the developer's to state, not ours.
    agenda: [
      {
        title: 'Why Dholera, and why now',
        body: 'The Special Investment Region in plain language — what is actually built, what is under construction, and what is still on paper.',
      },
      {
        title: 'The infrastructure that moves land value',
        body: 'Dholera International Airport, the Ahmedabad–Dholera Expressway, the Tata semiconductor fab and the trunk infrastructure already laid.',
      },
      {
        title: 'Reading a plot before you buy it',
        body: 'NA conversion, title clearance, NOCs, plan approval and the TP scheme — the five documents that separate a real plot from a story.',
      },
      {
        title: 'Building a position, not a punt',
        body: 'Holding periods, entry sizes, resale realities and the mistakes first-time land buyers make.',
      },
      {
        title: 'Open Q&A',
        body: 'Bring your questions. Nothing is sold from the stage — you leave with answers, and a site visit if you want one.',
      },
    ],

    faqs: [
      {
        q: 'Is there any charge to attend?',
        a: 'No. Entry is free, but seats are limited and allocated by registration, so please register before you travel.',
      },
      {
        q: 'Do I have to buy anything?',
        a: 'No. It is an information seminar. If you want to see the land afterwards, the team will arrange a site visit — that is your choice, not a condition of attending.',
      },
      {
        q: 'Can I bring my family?',
        a: 'Yes. Tell us how many of you are coming when you register so we hold the right number of seats.',
      },
      {
        q: 'Who is organising it?',
        a: 'The seminar is hosted jointly by Mirrikh Group and Capital Brix LLP. Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd. — they are separate companies.',
      },
    ],
  },
};

export const getEvent = (slug) => events[slug] || null;
