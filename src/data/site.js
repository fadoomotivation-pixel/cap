// ─────────────────────────────────────────────────────────────
// CAPITAL BRIX — SITE CONTENT
// Capital Brix LLP · Authorised Sales Channel Partner for Mirrikh Infratech
//
// The relationship wording is legally constrained. Mirrikh Infratech's notice of
// 8 Sep 2026 states that Capital Brix is a sales channel partner and is NOT the
// owner, promoter, management entity, subsidiary, group company or strategic
// partner, and required every "Official Strategy Partner" / "Strategy Partner"
// reference removed. Do not reintroduce that phrasing, and do not describe
// Mirrikh's pricing, discounts or commission structure on our behalf — see the
// "Mirrikh relationship" section of CLAUDE.md before editing anything here.
// Yahan se saara content edit kar sakte ho: phone, projects,
// prices, FAQs. Code change karne ki zaroorat nahi.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Capital Brix',
  tagline: 'Authorised Sales Channel Partner · Mirrikh Infratech',
  partner: 'Mirrikh Infratech',
  // WhatsApp/call number (country code ke saath, bina + ke)
  phone: '917048917300',
  phoneDisplay: '+91 70489 17300',
  // Public email (site par dikhta hai)
  email: 'info@capitalbrix.com',
  // Form leads is inbox me aati hain (FormSubmit)
  leadEmail: 'musicofmajor@gmail.com',
  address: 'A-118, 6th Floor, The Diamond, Sector 136, Noida 201304',
  // Capital Brix's OWN profiles. These previously pointed at Mirrikh
  // Infratech's accounts, which told Google the site belonged to them.
  // Also emitted as `sameAs` in the organisation schema — keep both in sync.
  socials: [
    { name: 'YouTube',   href: 'https://www.youtube.com/@capitalbrixllp' },
    { name: 'Instagram', href: 'https://www.instagram.com/capitalbrix' },
    { name: 'LinkedIn',  href: 'https://www.linkedin.com/company/capitalbrixofficial/' },
    { name: 'Facebook',  href: 'https://www.facebook.com/CapitalBrixOfficial/' },
  ],
  domain: 'https://www.capitalbrix.co.in',
  whatsappMessage:
    'Hi Capital Brix! I am interested in Mirrikh Infratech projects in Dholera Smart City. Please share current prices and plot availability.',
};

// Owner confirmed 6 Oct 2026, from the Mirrikh deck. This is the rate band
// Capital Brix sells at. It is not a claim about the developer's margin,
// and it is not a forecast of what the land will be worth later.
// Do not copy `from` onto every project's priceFrom — the rate depends on
// the project and the plot, up to `to`.
export const plotRates = {
  from: 9250,
  to: 14950,
  unit: 'sq yd',
  verified: '6 October 2026',
  fromLabel: 'from ₹9,250/sq yd',
  rangeLabel: '₹9,250 to ₹14,950 per sq yd',
  sentence:
    'Plots marketed by Capital Brix start from ₹9,250 per sq yd and run up to about ₹14,950 per sq yd, depending on the project and the plot.',
};

export const stats = [
  { value: '₹91,000 Cr', label: 'Tata Semiconductor Fab in Dholera' },
  // Mirrikh's own figure is "30+ projects launched" (not "delivered") over
  // 25 lakh+ sq yd — keep the verb and the attribution.
  { value: '30+', label: 'Projects launched in Dholera by Mirrikh Infratech since 2012' },
  { value: '920 km²', label: "India's Largest Planned Smart City" },
  { value: '2026', label: 'First aircraft landed at Dholera International Airport' },
];

export const partnership = {
  heading: 'Authorised Sales Channel Partner for Mirrikh Infratech',
  intro:
    'Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd., a Dholera developer. We market Mirrikh Infratech projects; we are not the developer, owner or promoter of them. What we provide is the sales and documentation side — verified paperwork, guided site visits and end-to-end support from our Noida office.',
  points: [
    {
      icon: 'Award',
      title: 'An award-recognised developer',
      text: 'Mirrikh Infratech has worked in Dholera since 2012 and was named Pride of Gujarat in 2022 and 2025, Navratna in 2024, and Most Preferred Brand in Smart City Projects in 2023 (with The Economic Times).',
    },
    {
      icon: 'Building2',
      title: '30+ Projects Launched',
      text: 'Mirrikh Infratech has launched 30+ residential, industrial and villa projects in and around Dholera Smart City, covering 25 lakh+ sq yd of land.',
    },
    {
      icon: 'FileCheck',
      title: '100% Legal & Transparent',
      text: 'NA, NOC, title clear and plan passed \u2014 and the plot is registered in your name by sale deed, not an allotment letter.',
    },
    {
      // Was "Direct Developer Pricing — you pay the developer's own rate, plus
      // pre-launch discounts, no broker commission." That represented Mirrikh's
      // pricing and commission policy on their behalf, which we are not
      // authorised to do. Replaced with what we actually control: our own service.
      icon: 'Handshake',
      title: 'Booking Handled End to End',
      text: 'Current availability and rates confirmed with the developer before you book, documentation checked, and the paperwork run through to registration.',
    },
  ],
};

// ─── THE DEVELOPER — Mirrikh Infratech Pvt. Ltd. ─────────────────────────
// Every figure here is Mirrikh's, from their own current collateral (the
// "Promotional Materials" folder, checked 6 Oct 2026), and must be rendered
// with that attribution — never as Capital Brix's numbers.
// The founder of Mirrikh is deliberately NOT named here: CLAUDE.md "Content
// rules" says credibility claims reference the company, not an individual.
// Award photographs show the awards being received; captions name the award,
// the year and the presenter, nothing more.
export const developer = {
  name: 'Mirrikh Infratech Pvt. Ltd.',
  brand: 'Mirrikh Group',
  since: 2012,
  logo: '/media/mirrikh/mirrikh-group-logo-white.webp',
  source: 'Mirrikh Infratech project and company collateral, checked 6 October 2026',
  stats: [
    { value: '14+', label: 'Years in Dholera, since 2012' },
    { value: '30+', label: 'Projects launched, over 25 lakh+ sq yd' },
    { value: '7.5K+', label: 'Plot holders' },
    { value: '12,000+', label: 'Investors' },
    { value: '15+', label: 'Countries buyers come from' },
  ],
  awards: [
    { year: 2025, title: 'Pride of Gujarat Award', note: 'Leading Land Developer in Dholera Smart City. Presented by Gujarat Chief Minister Shri Bhupendra Patel (Divya Bhaskar).', image: '/media/mirrikh/award-2025-pride-of-gujarat.webp', w: 800, h: 622 },
    { year: 2024, title: 'Navratna Award', note: '“Bharat ke Navratna Gujarat Se”, presented by Divya Bhaskar.', image: '/media/mirrikh/award-2024-navratna.webp', w: 800, h: 528 },
    { year: 2023, title: 'Most Preferred Brand in Smart City Projects in India', note: 'In association with The Economic Times.', image: '/media/mirrikh/award-2023-most-preferred-brand.webp', w: 800, h: 528 },
    { year: 2022, title: 'Pride of Gujarat', note: 'Excellence in Real Estate Projects at Dholera Smart City.', image: '/media/mirrikh/award-2022-pride-of-gujarat.webp', w: 800, h: 529 },
    { year: 2021, title: 'Gujarat Icon Award', note: 'Excellence in Real Estate Projects at Dholera Smart City.' },
  ],
  event: {
    name: 'SPARK Celebrations 2025',
    when: '28 December 2025',
    where: 'New Delhi',
    text: 'Mirrikh’s annual celebration for its investors, partners and team, held in New Delhi on 28 December 2025.',
    photos: [
      { src: '/media/mirrikh/spark-2025-stage.webp', w: 960, h: 540, alt: 'The stage at SPARK Celebrations 2025, Mirrikh’s annual event in New Delhi' },
      { src: '/media/mirrikh/spark-2025-audience.webp', w: 960, h: 540, alt: 'Investors and partners in the audience at SPARK Celebrations 2025, New Delhi' },
      { src: '/media/mirrikh/spark-2025-team.webp', w: 960, h: 540, alt: 'The Mirrikh team on stage at SPARK Celebrations 2025, New Delhi' },
    ],
  },
};

// Real photographs from Dholera (frames from site footage), not renders and
// not stock. Anything illustrative stays out of this list.
export const groundPhotos = [
  { src: '/media/dholera/tata-semiconductor-site-gate.webp', w: 720, h: 1063, alt: 'Gate of the Tata Electronics semiconductor fab site in Dholera', caption: 'Tata Electronics semiconductor site gate' },
  { src: '/media/dholera/tata-fab-construction.webp', w: 720, h: 871, alt: 'Cranes over the Tata semiconductor fab construction site in Dholera', caption: 'Fab construction, Activation Area' },
  { src: '/media/dholera/renew-factory.webp', w: 720, h: 1063, alt: 'ReNew solar manufacturing factory building in Dholera', caption: 'ReNew solar cell & module factory' },
  { src: '/media/dholera/abcd-building.webp', w: 900, h: 704, alt: 'The ABCD (Administrative and Business Centre for Dholera) building', caption: 'ABCD building — single-window office' },
];

export const projectsMap = {
  src: '/media/dholera/mirrikh-project-locations-map.webp',
  w: 1400,
  h: 860,
  alt: 'Dholera SIR master plan detail showing Mirrikh project villages around the SIR boundary, the expressway and the airport',
  credit: 'Base map: DSIRDA development plan. Project pins: Mirrikh Infratech.',
};

export const whyDholera = [
  {
    icon: 'Landmark',
    title: 'Government-Backed SIR',
    text: "Dholera is a Gujarat Government notified Special Investment Region under the Delhi–Mumbai Industrial Corridor (DMIC) — India's first and largest greenfield smart city, with plug-and-play trunk infrastructure already built.",
  },
  {
    icon: 'Cpu',
    title: '₹91,000 Cr Semiconductor Hub',
    text: "Tata Electronics' mega semiconductor fabrication plant — producing India's first homegrown chips — anchors Dholera's industrial ecosystem, drawing suppliers, engineers and housing demand.",
  },
  {
    icon: 'Plane',
    title: 'International Airport',
    text: 'Dholera International Airport at Navagam is in advanced construction, designed for both cargo and passenger operations. Phase 1 was approved in 2022, after clearance in 2014–15.',
  },
  {
    icon: 'Route',
    title: 'Expressway Connectivity',
    text: 'The 109 km, 4-lane Ahmedabad–Dholera Expressway cuts travel time to under an hour, with high-speed rail and metro links planned along the corridor.',
  },
  {
    icon: 'TrendingUp',
    title: 'Current plot rates',
    text: 'Plots marketed by Capital Brix start from ₹9,250 per sq yd and run up to about ₹14,950 per sq yd, depending on the project and the plot. Verified 6 October 2026. That is a price, not a forecast.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Clear-Title, Legal Plots',
    text: 'Every Mirrikh Infratech plot is NA (Non-Agricultural), NOC-approved, title clear and plan passed — sold with registered sale deed for a fully transparent purchase.',
  },
];

// Projects developed by Mirrikh Infratech Pvt. Ltd., marketed by Capital Brix
// LLP as an authorised sales channel partner. Capital Brix is not the developer
// or owner of any project listed here.
export const projectFilters = ['All', 'Ongoing', 'Industrial', 'Sold Out'];

// ─── ONGOING / CURRENT PROJECTS (from mirrikh.com dropdown) ───────────────
// Each project renders a detail page at /projects/<slug>. Optional fields that
// make that page rank better — add them wherever you have the real detail:
//   about:     one paragraph specific to this project (why a buyer picks it)
//   aboutMore: a second paragraph if there is more to say
//   image:     '/projects/<slug>.webp' — a photo WE host, in public/projects/.
//              Never a URL on another company's server: it breaks when they
//              rename a folder, and it tells a crawler whose content it is.
// Without them, pages fall back to copy composed from the fields below, which
// can only be as distinct as the data is. See src/lib/projectContent.js.
//
// priceFrom — THE SINGLE HIGHEST-VALUE FIELD ON THIS PAGE, and the one that is
// empty on all 22 projects.
//
//   priceFrom: 9250,              // rupees per sq yd, only if this project actually starts there
//   priceFromUnit: 'sq yd',       // optional, defaults to 'sq yd'
//
// Three things switch on the moment a project has one:
//
//   1. The Product schema becomes VALID. Google Search Console currently
//      reports "Either 'price' or 'priceSpecification.price' should be
//      specified in 'offers'" as a critical issue, which means not one project
//      page is eligible for a price-carrying rich result. Offers are emitted
//      ONLY for a project with a real number — an Offer with no price is worse
//      than no Offer, because it is the invalid one.
//   2. The page can rank for price queries. "<project> price", "dholera plot
//      price per sq yard" and "dholera plot rate" are the highest-intent
//      searches this site can realistically win, and a page that never states
//      a number cannot answer them.
//   3. "On Request" stops costing enquiries. It reads as "we will quote you
//      depending on how you sound", which is the opposite of the title-clear,
//      nothing-hidden position the rest of the site takes.
//
// Only put a number here that we will actually honour, and keep it current —
// a stale or aspirational rate is a misleading price claim. State the price
// WE sell at; never describe it as the developer's own rate, and never claim a
// discount (see CLAUDE.md, "Never describe Mirrikh's commercial policy").
export const projects = [
  // ─── CURRENT SALES FOCUS — verified against Mirrikh's own collateral ──────
  // Source: the Mirrikh "Promotional Materials" folder the owner shared on
  // 6 Oct 2026 (project standees + A4 leaflets). Unit counts, villages and
  // the "starting at" figures below are printed there. Nothing else is:
  //   • no plot sizes, no per-sq-yd rate per project, no RERA numbers.
  //     Do not add any of those until Mirrikh confirms them in writing.
  //   • location wording is "near Dholera Smart City" (Mirrikh's own words).
  //     These projects sit around the SIR boundary, NOT inside the SIR.
  //   • the leaflets also print a monthly "Business Promotion Commission",
  //     "12% per annum" and an "assured" villa rental. Those are return
  //     promises and stay OFF this site — see CLAUDE.md, "Content rules".
  // `startingPrice` is the lump-sum "starting at" figure in rupees. It drives
  // the visible price and an AggregateOffer (lowPrice) in the Product schema.
  {
    name: 'Mayur Prime',
    verified: true,
    image: '/projects/mayur-prime.webp',
    imageW: 1200,
    imageH: 900,
    imageAlt: 'Mayur Prime entrance road with fountain roundabout — developer render, Fedra near Dholera Smart City',
    logo: '/projects/mayur-prime-logo.webp',
    gallery: [
      { src: '/projects/mayur-prime-garden.webp', w: 989, h: 667, alt: 'Mayur Prime landscaped garden, aerial view — developer render' },
    ],
    type: 'Residential Plots',
    offering: 'premium residential plots',
    category: 'Ongoing',
    location: 'Fedra, near Dholera Smart City',
    price: '₹20 Lakh',
    priceUnit: 'Starting price',
    startingPrice: 2000000,
    units: '503 premium residential plots',
    status: 'Now Selling',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      '503 premium residential plots at Fedra',
      'Gated entry, club house, boundary wall & security cabin',
      'Inside roads, water supply, electricity & tree plantation',
    ],
    about:
      'Mayur Prime is a premium residential plotting project at Fedra, near Dholera Smart City, with 503 plots. The layout is planned around a gated entrance, a club house and landscaped open space, with inside roads, water and electricity supply, a boundary wall and a security cabin listed by the developer. Plots start at ₹20 lakh.',
    accent: '#D4AF37',
  },
  {
    name: 'Mayur Swastik II',
    verified: true,
    image: '/projects/mayur-swastik-ii.webp',
    imageW: 1200,
    imageH: 897,
    imageAlt: 'Mayur Swastik II, Kamiyala near Dholera Smart City — developer render of homes on the layout',
    logo: '/projects/mayur-swastik-ii-logo.webp',
    type: 'Residential Plots',
    offering: 'residential plots',
    category: 'Ongoing',
    location: 'Kamiyala, near Dholera Smart City',
    price: '₹12.75 Lakh',
    priceUnit: 'Starting price',
    startingPrice: 1275000,
    units: '433 residential plots',
    status: 'Now Selling',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      '433 residential plots at Kamiyala',
      'Club house, gated entry, boundary wall & security cabin',
      'Inside roads, plot demarcation, water & power supply',
    ],
    about:
      'Mayur Swastik II is the second phase of the Mayur Swastik residential project at Kamiyala, near Dholera Smart City, with 433 plots. The developer lists a club house, gated entry, boundary wall, inside roads, plot demarcation, tree plantation, a security cabin and water and power supply. It has the lowest entry price of the current projects, starting at ₹12.75 lakh.',
    accent: '#c9a35c',
  },
  {
    name: 'Mayur Industrial Landmark',
    verified: true,
    image: '/projects/mayur-industrial-landmark.webp',
    imageW: 885,
    imageH: 613,
    imageAlt: 'Mayur Industrial Landmark industrial sheds along an internal road — developer render, Moti Boru near Dholera Smart City',
    logo: '/projects/mayur-industrial-landmark-logo.webp',
    gallery: [
      { src: '/projects/mayur-industrial-landmark-units.webp', w: 886, h: 615, alt: 'Mayur Industrial Landmark warehouse units — developer render' },
    ],
    type: 'Industrial Plots',
    offering: 'industrial plots for warehouse, workshop and MSME use',
    category: 'Industrial',
    location: 'Moti Boru, near Dholera Smart City',
    price: '₹26.5 Lakh',
    priceUnit: 'Starting price',
    startingPrice: 2650000,
    units: '436 units · warehouse / workshop / MSME',
    status: 'Now Selling',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      '436 units for warehouse, workshop & MSME use',
      'Gated entry, boundary wall, street lights & security cabin',
      'Internal roads, plot demarcation, power & water supply',
    ],
    about:
      'Mayur Industrial Landmark is an industrial project at Moti Boru, near Dholera Smart City, with 436 units planned for warehouse, workshop and MSME use. The developer lists gated entry, a boundary wall, street lights, internal roads, plot demarcation, a garden area, tree plantation, a security cabin and power and water supply. Units start at ₹26.5 lakh.',
    accent: '#f59e0b',
  },
  {
    name: 'Mayur Business Park',
    verified: true,
    image: '/projects/mayur-business-park.webp',
    imageW: 1200,
    imageH: 900,
    imageAlt: 'Mayur Business Park entrance gate — developer render, Haripura (Dhandhuka) near Dholera Smart City',
    logo: '/projects/mayur-business-park-logo.webp',
    type: 'Industrial Plots',
    offering: 'industrial units',
    category: 'Industrial',
    location: 'Haripura, Dhandhuka, near Dholera Smart City',
    price: '₹31 Lakh',
    priceUnit: 'Starting price',
    startingPrice: 3100000,
    units: '277 industrial units',
    status: 'Now Selling',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      '277 industrial units at Haripura, Dhandhuka',
      'Gated entry, boundary wall, street lights & security cabin',
      'Internal roads, plot demarcation, garden, water & power supply',
    ],
    about:
      'Mayur Business Park is an industrial project at Haripura in Dhandhuka taluka, near Dholera Smart City, with 277 units. The developer lists gated entry, a boundary wall, street lights, internal roads, plot demarcation, a garden area, a temple, tree plantation, a security cabin and water and power supply. Units start at ₹31 lakh.',
    accent: '#7fc8e8',
  },
  {
    name: 'Mayur Greenz Courtyard',
    verified: true,
    image: '/projects/mayur-greenz-courtyard.webp',
    imageW: 1200,
    imageH: 900,
    imageAlt: 'Mayur Greenz Courtyard 3BHK luxury villas at dusk — developer render, Rojka near Dholera Smart City',
    logo: '/projects/mayur-greenz-courtyard-logo.webp',
    gallery: [
      { src: '/projects/mayur-greenz-courtyard-clubhouse.webp', w: 1200, h: 755, alt: 'Mayur Greenz Courtyard club house — developer render' },
    ],
    type: '3BHK Luxury Villas',
    offering: '3BHK luxury villas',
    category: 'Ongoing',
    location: 'Rojka, near Dholera Smart City',
    price: 'On Request',
    priceUnit: 'Price on request',
    units: '3BHK luxury villas',
    status: 'Now Selling',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      '3BHK luxury villa community at Rojka',
      'Club house, swimming pool, indoor games & event lawn',
      'Jogging track, sports, children’s play area & senior citizen park',
    ],
    about:
      'Mayur Greenz Courtyard is a 3BHK luxury villa project at Rojka, near Dholera Smart City. The developer lists a club house, swimming pool, indoor games, event lawn, jogging track, outdoor sports, a children’s play area and a senior citizen park, with gated entry, inside roads, a boundary wall, a security cabin and water and electricity supply. Price on request — ask us for the current villa price and availability.',
    accent: '#84cc16',
  },

  // ─── OTHER ONGOING PROJECTS ───────────────────────────────────────────────
  {
    name: 'Mayur NOVA',
    image: '/projects/mayur-nova.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Ratanpur, near Dholera Smart City',
    price: 'On Request',
    priceUnit: 'New Launch',
    size: '90 plots · 132–655 sq yd',
    status: 'New Launch',
    highlights: [
      'NA, NOC, Title Clear & Unit Plan Pass',
      'Gated Community with Club House',
      '10 km from Dholera International Airport',
      '9 km from Ahmedabad–Dholera Expressway',
    ],
    accent: '#f26522',
  },
  {
    name: 'Mayur Aerocity II',
    image: '/projects/mayur-aerocity-ii.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Near Dholera International Airport',
    price: 'On Request',
    priceUnit: 'On request',
    size: 'Multiple plot sizes',
    status: 'Pre-Launch',
    highlights: [
      'Closest project to Dholera Airport',
      'Rate quoted for the plot you choose',
      'NA · NOC · Title Clear',
      'Registered sale deed in the buyer’s name',
    ],
    accent: '#3b82f6',
  },
  {
    name: 'Mayur Park III',
    // Asset supplied for this slug is the MAYUR PARK-II brand mark, not Park III.
    // Re-enable once Mirrikh sends the correct one.
    // image: '/projects/mayur-park-iii.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Dholera Smart City',
    price: 'On Request',
    priceUnit: 'Ongoing',
    size: 'Multiple plot sizes',
    status: 'Ongoing',
    highlights: [
      'Well-planned internal roads',
      'Green open areas & recreation spaces',
      'CCTV security & boundary wall',
      'NA · NOC · Title Clear',
    ],
    accent: '#10b981',
  },
  {
    name: 'Mayur Forest Villa',
    image: '/projects/mayur-forest-villa.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Dholera Smart City',
    price: 'On Request',
    priceUnit: 'Ongoing',
    size: 'Villa plots',
    status: 'Ongoing',
    highlights: [
      'Forest-themed residential community',
      'Lush greenery & landscaped spaces',
      'Gated community with premium amenities',
      'NA · NOC · Title Clear',
    ],
    accent: '#22c55e',
  },
  {
    name: 'Mayur Ananta II',
    image: '/projects/mayur-ananta-ii.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Dholera Smart City',
    price: 'On Request',
    priceUnit: 'Ongoing',
    size: 'Multiple plot sizes',
    status: 'Ongoing',
    highlights: [
      'Premium residential plotting',
      'Excellent connectivity to SIR',
      'Modern infrastructure & amenities',
      'NA · NOC · Title Clear',
    ],
    accent: '#a855f7',
  },

  // ─── SOLD OUT PROJECTS (from mirrikh.com dropdown — exact order) ──────────
  {
    name: 'Mayur Signature',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Rojka, Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Premium large plots',
    status: 'Sold Out',
    highlights: ['Flagship luxury project', 'Early investors saw strong ROI', 'NA · NOC · Title Clear', 'Registered deeds executed'],
    accent: '#b99cf0',
  },
  {
    name: 'Mayur Enclave 5',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Near Dholera SIR Boundary (TP Area)',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '20 bighas enclave',
    status: 'Sold Out',
    highlights: ['Well-planned internal roads & lighting', 'Green open areas', 'Registered sale deed completed', 'NA · NOC · Title Clear'],
    accent: '#e8c774',
  },
  {
    name: 'Mayur Swastik',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Near Ahmedabad–Dholera Expressway',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Exclusive development amid greens', 'Expressway corridor access', 'NA · NOC · Title Clear', 'Registered deeds executed'],
    accent: '#f0a3a3',
  },
  {
    name: 'Mayur Greenz III',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Rojka, Dholera–Dhandhuka State Highway',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Phase III of successful Greenz series', 'Club house & amenities', 'NA · NOC · Title Clear', 'Delivered on time'],
    accent: '#86d993',
  },
  {
    name: 'Mayur KALP',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Serene residential community', 'Lush greenery & parks', 'NA · NOC · Title Clear', 'Registered deeds executed'],
    accent: '#6ee7b7',
  },
  {
    name: 'Mayur Evana',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Kasindra · Near Dholera SIR boundary',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '523 premium plots',
    status: 'Sold Out',
    highlights: ['Gated community with clubhouse & pool', 'Kids play area & CCTV', '7 km from expressway', 'Delivered successfully'],
    accent: '#7fc8e8',
  },
  {
    name: 'Mayur Aerocity',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Near Dholera International Airport',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Phase I of Aerocity series', 'Airport proximity premium', 'NA · NOC · Title Clear', 'All deeds registered'],
    accent: '#60a5fa',
  },
  {
    name: 'Mayur Industrial Hub',
    type: 'Industrial Plots',
    category: 'Sold Out',
    location: 'Dholera Industrial Zone',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '1,000 sq yd onwards',
    status: 'Sold Out',
    highlights: ['Industrial & warehousing use', 'Plan passed zoning', 'Near DMIC industrial belt', 'Delivered successfully'],
    accent: '#fbbf24',
  },
  {
    name: 'Mayur Greenz II',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera–Dhandhuka Highway',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '76 bighas township',
    status: 'Sold Out',
    highlights: ['Lavish clubhouse + 2,000 sq yd lawn', 'Swimming pool, gym & sports zone', 'Near expressway & Airport', 'Delivered'],
    accent: '#4ade80',
  },
  {
    name: 'Mayur Enclave 4',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Phase IV of Enclave series', 'Gated community', 'NA · NOC · Title Clear', 'All units registered'],
    accent: '#c084fc',
  },
  {
    name: 'Mayur Iconic',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Iconic residential community', 'Premium infrastructure', 'NA · NOC · Title Clear', 'Delivered on schedule'],
    accent: '#f472b6',
  },
  {
    name: 'Mayur Greenz',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Rojka, Dholera–Dhandhuka State Highway',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '133 – 830 sq yd',
    status: 'Sold Out',
    highlights: ['Golf course & club house', 'Shopping complex & event lawn', 'Knowledge & IT Zone access', 'First Mirrikh green township'],
    accent: '#86d993',
  },
  {
    name: 'Mayur Ananta',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Phase I of Ananta series', 'Residential plotting', 'NA · NOC · Title Clear', 'Registered deeds executed'],
    accent: '#818cf8',
  },
  {
    name: 'Mayur Enclave III',
    type: 'Residential Plots',
    category: 'Sold Out',
    location: 'Dholera Smart City',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: 'Multiple plot sizes',
    status: 'Sold Out',
    highlights: ['Phase III of Enclave series', 'Gated secure community', 'NA · NOC · Title Clear', 'Delivered successfully'],
    accent: '#c9a35c',
  },
  {
    name: 'Mayur Industrial Park II',
    type: 'Industrial Plots',
    category: 'Sold Out',
    location: 'Dholera Industrial Zone',
    price: 'Sold Out',
    priceUnit: 'Delivered',
    size: '1,000 sq yd onwards',
    status: 'Sold Out',
    highlights: ['Phase II of Industrial Park', 'Warehousing & logistics ready', 'Near DMIC industrial zone', 'Delivered on time'],
    accent: '#9ab8d9',
  },
];

export const connectivity = [
  { km: '0.5 km', place: 'Dholera SIR boundary (Mayur Greenz II / Evana)' },
  { km: '0.5 km', place: 'Ahmedabad–Dholera Expressway (Industrial Park)' },
  { km: '9 km', place: 'Dholera International Airport (under construction)' },
  { km: '30 min', place: 'Tata Semiconductor Fab & Activation Area' },
  { km: '60 min', place: 'Ahmedabad city via new expressway' },
  { km: 'Planned', place: 'Metro rail & freight corridor to Ahmedabad' },
];

export const process = [
  {
    step: '01',
    title: 'Free Consultation',
    text: 'Call ya WhatsApp karo — our Dholera expert explains zones, Mirrikh inventory and the right project for your budget.',
  },
  {
    step: '02',
    title: 'Guided Site Visit',
    text: 'We arrange a full guided tour of Dholera SIR, the airport site, expressway and Mirrikh projects — pickup from Ahmedabad.',
  },
  {
    step: '03',
    title: 'Verify Everything',
    text: 'Check NA/NOC orders, title reports and plan-pass documents yourself. We encourage independent legal verification.',
  },
  {
    step: '04',
    title: 'Book & Register',
    text: 'Reserve with a token amount and complete a registered sale deed in your name.',
  },
];

export const testimonials = [
  {
    name: 'Rohit Sharma',
    city: 'Delhi NCR',
    text: 'I compared 5 companies before investing in Dholera. Capital Brix showed me every Mirrikh document upfront and arranged a proper site visit. Booked 2 plots in Mayur Enclave 5.',
  },
  {
    name: 'Priya Patel',
    city: 'Ahmedabad',
    text: 'The team explained the SIR zones and activation area better than anyone. I booked a Mayur Greenz II plot near the expressway after the site visit.',
  },
  {
    name: 'Amitabh Verma',
    city: 'Mumbai',
    text: 'As an NRI-family investor I needed everything transparent. Registered sale deed, clear title, and constant updates on Dholera development. Very satisfied.',
  },
];

export const faqs = [
  {
    q: 'Why is Dholera Smart City a good investment in 2026?',
    a: "Dholera SIR is India's first greenfield smart city, backed by the Government of Gujarat and the Delhi–Mumbai Industrial Corridor. The ₹91,000 crore Tata semiconductor fab, Dholera International Airport and the Ahmedabad–Dholera Expressway are the infrastructure a buyer can check in 2026. Plots marketed by Capital Brix start from ₹9,250 per sq yd. That is a current rate, not a forecast of returns.",
  },
  {
    q: 'What is Capital Brix\u2019s relationship with Mirrikh Infratech?',
    a: 'Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd. We market and sell plots in Mirrikh Infratech projects; we are not the developer, owner, promoter or a group company of Mirrikh Infratech, and we are not part of its management. The projects are developed by Mirrikh Infratech, which has worked in Dholera since 2012 and has launched 30+ residential, industrial and villa projects there. Capital Brix handles the sales process: availability, site visits, documentation and support through to registration.',
  },
  {
    q: 'Are the plots legal and title clear?',
    a: 'Yes. Every Mirrikh Infratech project is NA (Non-Agricultural), NOC-approved, title clear and plan passed. Sales are completed only through a registered sale deed in your name, and we encourage independent legal verification before booking.',
  },
  {
    q: 'What is the minimum investment to buy a plot in Dholera?',
    a: 'Plots marketed by Capital Brix start from ₹9,250 per sq yd and run up to about ₹14,950 per sq yd, depending on the project and the plot. A 150 sq yd plot at the starting rate is ₹13.88 lakh on land value, before stamp duty, registration and development charges.',
  },
  {
    q: 'Where is Dholera and how do I reach it?',
    a: 'Dholera is about 100 km south-west of Ahmedabad, Gujarat. The new 109 km Ahmedabad–Dholera Expressway brings travel time to around an hour, and Dholera International Airport is under construction at Navagam.',
  },
  {
    q: 'Can I visit the site before booking?',
    a: 'Absolutely — we recommend it. Capital Brix arranges guided site visits covering Dholera SIR, the airport site, the expressway and all Mirrikh projects, with pickup from Ahmedabad.',
  },
  {
    q: 'Is Dholera investment safe for NRIs?',
    a: 'Yes. NRIs can legally purchase non-agricultural residential and commercial plots in India. Our NA-approved, registered-deed process is fully NRI friendly and we assist with documentation end to end.',
  },
];
