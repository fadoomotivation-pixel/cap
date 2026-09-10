/**
 * Live events that take registrations.
 *
 * One entry per event, keyed by the slug that also goes into
 * `cb_event_registrations.event_slug` — so a registration row can always be
 * traced back to which event it was for, even after this file moves on to the
 * next one.
 *
 * ── Editing checklist ──────────────────────────────────────────────────────
 * `time`      may be null. The page prints "Timing confirmed on WhatsApp"
 *             while it is, rather than guessing — a wrong time on a live
 *             invite is worse than none.
 * `speakers`  is the platform for this event only. Jasvinder Singh is Founder
 *             & CEO of Capital Brix LLP and of nothing else; anyone from the
 *             co-host is listed exactly as the joint poster prints them, with
 *             no company attributed to them by us. See the note on the array
 *             itself before editing it.
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
    time: '10:30 AM – 2:00 PM',
    venue: 'Club GH-01, E Block, Gaur City 1, Sector 4',
    venueFull:
      'The Gaurs Sarovar Premiere, Club GH-01, E Block, Gaur City 1, Sector 4, Noida Extension, Greater Noida, Uttar Pradesh 201309',
    mapsUrl: 'https://maps.google.com/?q=Gaur+City+1+Club+GH-01+Sector+4+Noida+Extension+Greater+Noida',
    hosts: ['Mirrikh Group', 'Capital Brix LLP'],
    price: 'Free entry · registration required',
    seats: 'Limited seats',

    // ── Speaking ────────────────────────────────────────────────────────
    // A speaker list for a jointly hosted event is a statement about who is on
    // the platform that day. It is NOT a credibility claim about a corporate
    // relationship, which is what Mirrikh's notice of 8 Sep 2026 was about, and
    // it must never become one:
    //
    //   • Jasvinder Singh is titled Founder & CEO of Capital Brix LLP — our own
    //     leadership, always nameable, and never placed under Mirrikh branding
    //     or implied to hold any role there.
    //   • Rajeel Jangir is printed exactly as the joint poster prints him,
    //     "Founder & Director", with NO company attributed to him by us. We do
    //     not describe anyone else's corporate position on their behalf.
    //
    // Keep the written approval of the joint poster on file. If the co-host
    // ever asks for a name to come off, delete the entry — do not reword it.
    speakers: [
      { name: 'Jasvinder Singh', role: 'Founder & CEO, Capital Brix LLP' },
      { name: 'Rajeel Jangir', role: 'Founder & Director' },
    ],

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
        q: 'What time should I reach?',
        a: 'The seminar runs from 10:30 AM to 2:00 PM. Come a few minutes early so registration at the desk does not eat into the session.',
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
