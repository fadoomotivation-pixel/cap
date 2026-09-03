// ─────────────────────────────────────────────────────────────
// Per-project page content, composed from the real fields in site.js.
//
// The 22 project detail pages carried ~220 indexable words each and read as
// near-duplicates — which is why none of them ranked for the long-tail brand
// queries ("mayur greenz ii dholera price") that are the most winnable traffic
// this site has.
//
// Everything here is derived from data we actually hold: name, type, location,
// size, status, price and the project's own highlights. Nothing is invented.
// Where a fact is not in the data, the copy says so plainly and asks the buyer
// to request it, which is both honest and a conversion prompt.
//
// LIMIT worth knowing: the 22 projects share most of their data — many are
// `price: 'On Request'`, `size: 'Multiple plot sizes'`, `location: 'Dholera
// Smart City'` with similar highlights. Composed copy can only be as distinct
// as the facts behind it, and inventing distances or amenities for a real
// project would be worse than thin content. Main-content overlap between the
// most similar pair is still ~97%.
//
// The fix is data, not code: give a project a real `location`, `size`, `price`
// and an `about` paragraph in src/data/site.js and these pages differentiate
// themselves with no further changes here.
// ─────────────────────────────────────────────────────────────

const isIndustrial = (p) => /industrial/i.test(p.type) || /industrial/i.test(p.name);
const isDelivered = (p) => p.status === 'Delivered' || p.category === 'Sold Out';

/** The opening paragraph — answers "what is this" before anything else. */
export const projectIntro = (p) => {
  const what = isIndustrial(p) ? 'industrial plots' : 'residential plots';
  const where = p.location.replace(/,\s*Dholera Smart City$/i, '');
  const inDholera = /dholera/i.test(p.location) ? p.location : `${p.location}, Dholera Smart City`;

  if (isDelivered(p)) {
    return `${p.name} is a delivered ${what} project at ${inDholera}, developed by Mirrikh Infratech. ` +
      `Fresh inventory is no longer available, but the project is worth seeing on a site visit: it shows what a ` +
      `completed Mirrikh layout actually looks like on the ground, which is the most useful thing you can do before ` +
      `buying into an ongoing one. Ask us about resale availability, or about the current launches near ${where}.`;
  }

  const stage = p.status === 'New Launch'
    ? 'a new launch'
    : p.status === 'Pre-Launch'
      ? 'at pre-launch stage'
      : 'an ongoing project';

  return `${p.name} is ${stage} offering ${what} at ${inDholera}, developed by Mirrikh Infratech and sold through ` +
    `Capital Brix at direct developer pricing. ${p.size ? `The project covers ${p.size.toLowerCase()}. ` : ''}` +
    `Like every plot we sell, it is NA-converted, NOC-cleared, title-clear and plan-passed, and completes through a ` +
    `registered sale deed in your own name.`;
};

/** The specification table — the facts a buyer scans for. */
export const projectSpecs = (p) => ({
  head: ['Detail', p.name],
  rows: [
    ['Project type', p.type],
    ['Location', p.location],
    ['Plot sizes', p.size || 'Multiple sizes — ask us for the current layout'],
    ['Stage', p.status],
    ['Pricing', p.price === 'On Request' ? `${p.priceUnit} — quoted on request` : `${p.price} (${p.priceUnit})`],
    ['Approvals', 'NA converted · NOC cleared · title clear · plan passed'],
    ['Ownership', 'Registered sale deed in the buyer’s name'],
    ['Developer', 'Mirrikh Infratech Pvt. Ltd.'],
    ['Sold by', 'Capital Brix LLP — Official Strategy Partner'],
  ],
});

/** Sections rendered by ArticleBody. Shapes vary by project stage and type,
 *  so two pages do not read as the same paragraph with the nouns swapped. */
export const projectSections = (p) => {
  const where = p.location.replace(/,\s*Dholera Smart City$/i, '');
  const sections = [];

  sections.push({
    h2: `${p.name} at a glance`,
    table: projectSpecs(p),
  });

  // The one field that can genuinely differentiate these pages is copy only
  // Capital Brix has. Add `about: '...'` (and optionally `aboutMore`) to a
  // project in src/data/site.js and it renders here — see the note at the top
  // of this file about why that matters.
  if (p.about) {
    sections.push({
      h2: `Why buyers choose ${p.name}`,
      p: [p.about, p.aboutMore].filter(Boolean),
    });
  }

  sections.push({
    h2: 'What this project offers',
    p: [
      `These are the points Mirrikh Infratech lists for ${p.name} specifically — not a generic amenity list:`,
    ],
    list: { items: p.highlights.map((h) => `**${h}**`) },
  });

  // Deliberately NO shared prose block here. An earlier version added the same
  // "how to verify a plot" and "why buy through us" paragraphs to all 22 pages;
  // it took each page from ~220 to ~650 words but left them 90% word-identical,
  // which is duplicate content wearing a longer coat. The guides that own those
  // queries are linked instead — unique and shorter beats padded and duplicated,
  // and the links push authority to the pages that should rank for them.
  sections.push({
    h2: isDelivered(p) ? 'Worth seeing even though it is sold out' : `Before you buy at ${where}`,
    p: [
      isDelivered(p)
        ? `A completed project answers what a brochure cannot: what this developer actually hands over. Roads, ` +
          `boundary walls, plot demarcation and open space either exist or they do not, and you can stand on them. ` +
          `If you are weighing an ongoing Mirrikh project, twenty minutes at ${p.name} is the most useful due ` +
          `diligence available to you, and it costs nothing.`
        : `The approvals listed above belong to this project. Read them against the documents rather than taking ` +
          `anyone's word for it — ours included. We hand the NA order, plan approval, title chain and encumbrance ` +
          `certificate over as part of the purchase, and quote a single all-in figure before you pay a token.`,
    ],
  });

  return sections;
};

/** FAQs that vary with the project's own facts, so the FAQPage schema on each
 *  URL describes that project rather than repeating one answer 22 times. */
export const projectFaqs = (p) => {
  const faqs = [
    {
      q: `Where is ${p.name} located?`,
      a: `${p.name} is at ${p.location}${/dholera/i.test(p.location) ? '' : ', within Dholera Smart City'}, Gujarat — roughly 100 km south-west of Ahmedabad, about an hour on the Ahmedabad–Dholera Expressway.`,
    },
    {
      q: `Is ${p.name} NA approved and title clear?`,
      a: `Yes. ${p.name} is NA-converted, NOC-cleared, title-clear and plan-passed, and the purchase completes through a registered sale deed in your own name. We hand over the NA order, plan approval and title documents as part of the process — you should read them rather than take our word for it.`,
    },
  ];

  faqs.push(
    p.price === 'On Request'
      ? {
          q: `What is the price of a plot in ${p.name}?`,
          a: `Pricing for ${p.name} is quoted on request at ${p.priceUnit.toLowerCase()}, because the rate depends on the plot you choose within the layout. Dholera residential plots generally run ₹6,000–₹10,000 per sq yd, with Capital Brix inventory starting at ₹7,250. Ask us and we will send the current rate for this project plus a single all-in figure including stamp duty and registration.`,
        }
      : {
          q: `What is the price of a plot in ${p.name}?`,
          a: `${p.name} starts at ${p.price} (${p.priceUnit}). That is the land rate — ask us for the all-in figure, which adds development charges, stamp duty, registration and legal costs.`,
        }
  );

  if (p.size && !/multiple/i.test(p.size)) {
    faqs.push({
      q: `What plot sizes are available in ${p.name}?`,
      a: `${p.size}. Availability changes as plots sell, so ask us for the current layout with the unsold plots marked before you plan around a particular size.`,
    });
  } else {
    faqs.push({
      q: `What plot sizes are available in ${p.name}?`,
      a: `Multiple plot sizes are offered. Availability changes as plots sell — ask us for the current layout with the unsold plots marked.`,
    });
  }

  faqs.push(
    isDelivered(p)
      ? {
          q: `Can I still buy in ${p.name}?`,
          a: `${p.name} is delivered and fresh inventory is no longer available. We can check resale availability, and we will show you the current launches nearby. Visiting a completed project is also the best way to judge what an ongoing one will look like.`,
        }
      : {
          q: `Can I visit ${p.name} before buying?`,
          a: `Yes, and you should. Site visits are free and Dholera is about an hour from Ahmedabad on the expressway, so it fits in a morning. You will see the plot, the roads that exist today, and the layout against the approved plan.`,
        }
  );

  return faqs;
};
