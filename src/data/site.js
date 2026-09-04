// ─────────────────────────────────────────────────────────────
// CAPITAL BRIX — SITE CONTENT
// Capital Brix LLP · Official Strategy Partner of Mirrikh Infratech
// Yahan se saara content edit kar sakte ho: phone, projects,
// prices, FAQs. Code change karne ki zaroorat nahi.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Capital Brix',
  tagline: 'Official Strategy Partner · Mirrikh Infratech',
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

export const stats = [
  { value: '₹91,000 Cr', label: 'Tata Semiconductor Fab in Dholera' },
  { value: '8+', label: 'Mirrikh Projects Delivered in Dholera' },
  { value: '920 km²', label: "India's Largest Planned Smart City" },
  { value: '2026', label: 'International Airport Operational' },
];

export const partnership = {
  heading: 'Official Strategy Partner of Mirrikh Infratech',
  intro:
    'Capital Brix LLP is the official strategy partner of Mirrikh Infratech Pvt. Ltd. — one of the most trusted developers in Dholera Smart City. You get direct developer pricing, verified inventory and end-to-end support from our Noida office.',
  points: [
    {
      icon: 'Award',
      title: 'Forbes-Featured Leadership',
      text: 'Mirrikh Infratech — featured in Forbes India (March 2025) — has a track record in Dholera real estate since 2012.',
    },
    {
      icon: 'Building2',
      title: '8+ Projects Delivered',
      text: 'A solid portfolio of completed residential, commercial and industrial projects across Dholera, with new phases under development.',
    },
    {
      icon: 'FileCheck',
      title: '100% Legal & Transparent',
      text: 'NA, NOC, title clear and plan passed \u2014 and the plot is registered in your name by sale deed, not an allotment letter.',
    },
    {
      icon: 'Handshake',
      title: 'Direct Developer Pricing',
      text: 'You pay the developer\u2019s own rate \u2014 the same price the builder sells at, plus pre-launch discounts. No broker commission stacked on top.',
    },
  ],
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
    text: 'Dholera International Airport (Navagam) is in advanced construction, designed for both cargo and passenger operations — a direct catalyst for land appreciation around the SIR.',
  },
  {
    icon: 'Route',
    title: 'Expressway Connectivity',
    text: 'The 109 km, 4-lane Ahmedabad–Dholera Expressway cuts travel time to under an hour, with high-speed rail and metro links planned along the corridor.',
  },
  {
    icon: 'TrendingUp',
    title: 'Early-Growth Pricing',
    text: 'Plot rates in Dholera are still in the early phase — roughly ₹6,000–₹10,000 per sq yd against mature Ahmedabad markets, giving investors a rare ground-floor entry.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Clear-Title, Legal Plots',
    text: 'Every Mirrikh Infratech plot is NA (Non-Agricultural), NOC-approved, title clear and plan passed — sold with registered sale deed for a fully transparent purchase.',
  },
];

// Real Mirrikh Infratech projects — Capital Brix exclusive inventory
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
export const projects = [
  {
    name: 'Mayur NOVA',
    image: '/projects/mayur-nova.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Ratanpur, Dholera Smart City',
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
    priceUnit: 'Pre-Launch Pricing',
    size: 'Multiple plot sizes',
    status: 'Pre-Launch',
    highlights: [
      'Closest project to Dholera Airport',
      'High appreciation potential',
      'NA · NOC · Title Clear',
      'Registered sale deed guaranteed',
    ],
    accent: '#3b82f6',
  },
  {
    name: 'Mayur Park III',
    image: '/projects/mayur-park-iii.webp',
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
    name: 'Mayur Greenz Courtyard',
    image: '/projects/mayur-greenz-courtyard.webp',
    type: 'Residential Plots',
    category: 'Ongoing',
    location: 'Dholera Smart City',
    price: 'On Request',
    priceUnit: 'Ongoing',
    size: 'Multiple plot sizes',
    status: 'Ongoing',
    highlights: [
      'Courtyard-style community layout',
      'Clubhouse & open green spaces',
      'Near Dholera SIR boundary',
      'NA · NOC · Title Clear',
    ],
    accent: '#84cc16',
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
  {
    name: 'Mayur Industrial Landmark',
    image: '/projects/mayur-industrial-landmark.webp',
    type: 'Industrial Plots',
    category: 'Industrial',
    location: 'Dholera Smart City Industrial Zone',
    price: 'On Request',
    priceUnit: 'Large-format plots',
    size: '1,000 sq yd onwards',
    status: 'Ongoing',
    highlights: [
      'Warehousing, logistics & manufacturing',
      'Unit plan passed industrial zoning',
      'Near semiconductor & industrial belt',
      'Heavy-vehicle friendly access roads',
    ],
    accent: '#f59e0b',
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
    text: 'Book at direct developer pricing with a token amount and complete a registered sale deed in your name.',
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
    text: 'The team explained the SIR zones and activation area better than anyone. My Mayur Greenz II plot near the expressway has already appreciated since booking.',
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
    a: "Dholera SIR is India's first greenfield smart city — backed by the Government of Gujarat and the Delhi–Mumbai Industrial Corridor. With the ₹91,000 crore Tata semiconductor fab, the international airport nearing completion and the Ahmedabad–Dholera Expressway, land prices are still at an early-growth stage (₹6,000–₹10,000/sq yd), giving strong long-term appreciation potential.",
  },
  {
    q: 'What does "Official Strategy Partner of Mirrikh Infratech" mean?',
    a: 'Capital Brix LLP is the authorised official strategy partner for Mirrikh Infratech projects. You book directly at official developer rates with pre-launch discounts, verified inventory and full documentation support — with the delivery track record of a developer that has completed 8+ projects in Dholera since 2012.',
  },
  {
    q: 'Are the plots legal and title clear?',
    a: 'Yes. Every Mirrikh Infratech project is NA (Non-Agricultural), NOC-approved, title clear and plan passed. Sales are completed only through a registered sale deed in your name, and we encourage independent legal verification before booking.',
  },
  {
    q: 'What is the minimum investment to buy a plot in Dholera?',
    a: 'Residential plots start from ₹7,250 per sq yd in Mayur Greenz II. A typical 150 sq yd plot starts around ₹11–12 lakh depending on project and location. Flexible payment plans are available.',
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
