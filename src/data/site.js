// ─────────────────────────────────────────────────────────────
// CAPITAL BRIX — SITE CONTENT
// Capital Brix LLP · Exclusive Channel Partner of Mirrikh Infratech
// Yahan se saara content edit kar sakte ho: phone, projects,
// prices, FAQs. Code change karne ki zaroorat nahi.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Capital Brix',
  tagline: 'Exclusive Partner · Mirrikh Infratech',
  partner: 'Mirrikh Infratech',
  // WhatsApp/call number (country code ke saath, bina + ke)
  phone: '917048917300',
  phoneDisplay: '+91 70489 17300',
  // Public email (site par dikhta hai)
  email: 'info@capitalbrix.com',
  // Form leads is inbox me aati hain (FormSubmit)
  leadEmail: 'musicofmajor@gmail.com',
  address: 'A-118, 6th Floor, The Diamond, Sector 136, Noida 201304',
  domain: 'https://capitalbrix.com',
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
  heading: 'Exclusive Channel Partner of Mirrikh Infratech',
  intro:
    'Capital Brix LLP is the exclusive channel partner of Mirrikh Infratech Pvt. Ltd. — one of the most trusted developers in Dholera Smart City. You get direct developer pricing, verified inventory and end-to-end support from our Noida office.',
  points: [
    {
      icon: 'Award',
      title: 'Forbes-Featured Leadership',
      text: 'Mirrikh Infratech founder Rajeel Jangir — featured in Forbes India (March 2025) — has a track record in Dholera real estate since 2012.',
    },
    {
      icon: 'Building2',
      title: '8+ Projects Delivered',
      text: 'A solid portfolio of completed residential, commercial and industrial projects across Dholera, with new phases under development.',
    },
    {
      icon: 'FileCheck',
      title: '100% Legal & Transparent',
      text: 'Every project is NA, NOC, title clear and plan passed — sold only through registered sale deeds in your name.',
    },
    {
      icon: 'Handshake',
      title: 'Direct Developer Pricing',
      text: 'As exclusive partner you book at official developer rates with pre-launch discounts — no middlemen, no markup.',
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
export const projectFilters = ['All', 'Residential', 'Industrial', 'Delivered'];

export const projects = [
  {
    name: 'Mayur Greenz II',
    type: 'Residential Plots',
    category: 'Residential',
    location: 'Dholera–Dhandhuka Highway · 0.5 km from SIR boundary',
    price: '₹7,250',
    priceUnit: 'per sq yd onwards',
    size: '76 bighas township',
    status: 'Pre-Launch',
    highlights: [
      'Lavish clubhouse + 2,000 sq yd lawn',
      'Swimming pool, gym & sports zone',
      'Near expressway & Dholera Intl. Airport',
      'NA · NOC · Title Clear · Plan Passed',
    ],
    accent: '#8fd48f',
  },
  {
    name: 'Mayur Evana',
    type: 'Residential Plots',
    category: 'Residential',
    location: 'Kasindra · 500 m from Dholera SIR boundary',
    price: '₹8,000',
    priceUnit: 'per sq yd onwards',
    size: '523 premium plots',
    status: 'New Launch',
    highlights: [
      'Gated community with clubhouse & pool',
      'Kids play area, lounge & CCTV security',
      '7 km from Ahmedabad–Dholera Expressway',
      '9 km from Dholera International Airport',
    ],
    accent: '#7fc8e8',
  },
  {
    name: 'Mayur Enclave 5',
    type: 'Residential Plots',
    category: 'Residential',
    location: 'Near Dholera SIR Boundary (TP Area)',
    price: '₹8,250',
    priceUnit: 'per sq yd onwards',
    size: '20 bighas enclave',
    status: 'Selling Fast',
    highlights: [
      'Well-planned internal roads & lighting',
      'Green open areas & recreation spaces',
      'Secure, well-defined project boundary',
      'Registered sale deed with every plot',
    ],
    accent: '#e8c774',
  },
  {
    name: 'Mayur Signature',
    type: 'Luxury Residential',
    category: 'Residential',
    location: 'Rojka, Dholera Smart City region',
    price: '₹9,250',
    priceUnit: 'per sq yd onwards',
    size: 'Premium large plots',
    status: 'Pre-Launch',
    highlights: [
      'Flagship luxury plotting project',
      'Nature + smart infrastructure blend',
      'Pre-launch discount for early buyers',
      '100% legal documentation support',
    ],
    accent: '#b99cf0',
  },
  {
    name: 'Mayur Swastik',
    type: 'Residential Plots',
    category: 'Residential',
    location: 'Near Ahmedabad–Dholera Expressway',
    price: 'On Request',
    priceUnit: 'limited inventory',
    size: 'Multiple plot sizes',
    status: 'Open',
    highlights: [
      'Exclusive development amid greens',
      'Right next to expressway corridor',
      'Peaceful temple in the vicinity',
      'NA · NOC · Title Clear',
    ],
    accent: '#f0a3a3',
  },
  {
    name: 'Mayur Industrial Park',
    type: 'Industrial Plots',
    category: 'Industrial',
    location: 'Anandpur · 0.5 km from Ahmedabad–Dholera Expressway',
    price: 'On Request',
    priceUnit: 'large-format plots',
    size: '1,000 sq yd onwards',
    status: 'Open',
    highlights: [
      'Warehousing, logistics & manufacturing',
      'Unit plan passed industrial zoning',
      'Near semiconductor & industrial belt',
      'Heavy-vehicle friendly access roads',
    ],
    accent: '#9ab8d9',
  },
  {
    name: 'Mayur Greenz',
    type: 'Residential Plots',
    category: 'Delivered',
    location: 'Rojka, Dholera–Dhandhuka State Highway',
    price: 'Sold Out',
    priceUnit: 'phase delivered',
    size: '133 – 830 sq yd',
    status: 'Delivered',
    highlights: [
      'Golf course & club house',
      'Shopping complex & event lawn',
      'Direct access to Knowledge & IT Zone',
      'Proof of Mirrikh delivery track record',
    ],
    accent: '#86d993',
  },
  {
    name: 'Mayur Park',
    type: 'Residential Plots',
    category: 'Delivered',
    location: 'Valinda village, Dholera',
    price: 'Sold Out',
    priceUnit: '115 units delivered',
    size: '150 – 280 sq yd',
    status: 'Delivered',
    highlights: [
      'Fully sold & delivered community',
      'NA · NOC · Title Clear executed',
      'Early investors saw strong gains',
      'Registered deeds completed',
    ],
    accent: '#c9a35c',
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
    q: 'What does "Exclusive Channel Partner of Mirrikh Infratech" mean?',
    a: 'Capital Brix LLP is the authorised exclusive partner for Mirrikh Infratech projects. You book directly at official developer rates with pre-launch discounts, verified inventory and full documentation support — with the delivery track record of a developer that has completed 8+ projects in Dholera since 2012.',
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
