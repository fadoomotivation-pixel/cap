// ─────────────────────────────────────────────────────────────
// CAPITAL BRIX — SITE CONTENT
// Yahan se saara content edit kar sakte ho: phone, projects,
// prices, FAQs. Code change karne ki zaroorat nahi.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Capital Brix',
  tagline: 'Dholera Smart City Investments',
  // Apna number yahan daalo (country code ke saath, bina + ke)
  phone: '919999999999',
  phoneDisplay: '+91 99999 99999',
  // Leads is email par aayengi (form + mailto)
  email: 'musicofmajor@gmail.com',
  address: 'Dholera SIR, Gujarat & Ahmedabad, India',
  whatsappMessage:
    'Hi Capital Brix! I am interested in Dholera Smart City plots. Please share project details and current prices.',
};

export const stats = [
  { value: '₹91,000 Cr', label: 'Tata Semiconductor Fab in Dholera' },
  { value: '8,00,000+', label: 'Jobs Projected in Dholera SIR' },
  { value: '920 km²', label: "India's Largest Planned Smart City" },
  { value: '2026', label: 'International Airport Operational' },
];

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
    text: 'Every Capital Brix plot is NA (Non-Agricultural), NOC-approved, title clear and plan passed — sold with registered sale deed for a fully transparent purchase.',
  },
];

export const projects = [
  {
    name: 'Brix Greenz',
    type: 'Residential Plots',
    location: 'Dholera–Dhandhuka Highway · 0.5 km from SIR boundary',
    price: '₹7,250',
    priceUnit: 'per sq yd onwards',
    size: '150 – 500 sq yd',
    status: 'Pre-Launch',
    highlights: [
      'Clubhouse, gym & swimming pool',
      'Jogging track & landscaped gardens',
      'Near upcoming expressway interchange',
      'NA · NOC · Title Clear · Plan Passed',
    ],
    accent: '#8fd48f',
  },
  {
    name: 'Brix Enclave',
    type: 'Residential Plots',
    location: 'Adjacent to Dholera SIR Boundary',
    price: '₹8,250',
    priceUnit: 'per sq yd onwards',
    size: '120 – 400 sq yd',
    status: 'New Launch',
    highlights: [
      '20-bigha gated community',
      'Internal RCC roads & street lighting',
      '9 km from Dholera International Airport',
      'Registered sale deed with every plot',
    ],
    accent: '#e8c774',
  },
  {
    name: 'Brix Signature',
    type: 'Premium Residential',
    location: 'Rojka, Dholera SIR influence zone',
    price: '₹9,250',
    priceUnit: 'per sq yd onwards',
    size: '200 – 1,000 sq yd',
    status: 'Selling Fast',
    highlights: [
      'Premium corner & park-facing plots',
      'Grand entrance gate & security',
      'Close to activation area of SIR',
      '100% legal documentation support',
    ],
    accent: '#b99cf0',
  },
  {
    name: 'Brix Industrial Park',
    type: 'Industrial Plots',
    location: 'Ratanpur, near Dholera industrial zone',
    price: 'On Request',
    priceUnit: 'large-format plots',
    size: '1,000 sq yd onwards',
    status: 'Open',
    highlights: [
      'Ideal for warehousing & logistics',
      'Manufacturing-ready large plots',
      'Near semiconductor & industrial belt',
      'Heavy-vehicle friendly access roads',
    ],
    accent: '#7fc8e8',
  },
];

export const connectivity = [
  { km: '0 km', place: 'Inside / touching Dholera SIR influence zone' },
  { km: '9 km', place: 'Dholera International Airport (under construction)' },
  { km: '7 km', place: 'Ahmedabad–Dholera Expressway (109 km, 4-lane)' },
  { km: '30 min', place: 'Tata Semiconductor Fab & Activation Area' },
  { km: '60 min', place: 'Ahmedabad city via new expressway' },
  { km: 'Planned', place: 'Metro rail & freight corridor to Ahmedabad' },
];

export const process = [
  {
    step: '01',
    title: 'Free Consultation',
    text: 'Call ya WhatsApp karo — our Dholera expert explains zones, pricing and the right project for your budget.',
  },
  {
    step: '02',
    title: 'Guided Site Visit',
    text: 'We arrange a full guided tour of Dholera SIR, the airport site, expressway and our projects — free pickup from Ahmedabad.',
  },
  {
    step: '03',
    title: 'Verify Everything',
    text: 'Check NA/NOC orders, title reports and plan-pass documents yourself. We encourage independent legal verification.',
  },
  {
    step: '04',
    title: 'Book & Register',
    text: 'Book your plot with a token amount and complete a registered sale deed in your name. Full documentation support.',
  },
];

export const testimonials = [
  {
    name: 'Rohit Sharma',
    city: 'Delhi NCR',
    text: 'I compared 5 companies before investing in Dholera. Capital Brix was the only one that showed me every document upfront and arranged a proper site visit. Booked 2 plots.',
  },
  {
    name: 'Priya Patel',
    city: 'Ahmedabad',
    text: 'The team explained the SIR zones and activation area better than anyone. My plot near the expressway has already appreciated since booking.',
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
    q: 'Are Capital Brix plots legal and title clear?',
    a: 'Yes. Every plot we sell is NA (Non-Agricultural), NOC-approved, title clear and plan passed. Sales are completed only through a registered sale deed in your name, and we encourage independent legal verification before booking.',
  },
  {
    q: 'What is the minimum investment to buy a plot in Dholera?',
    a: 'Residential plots start from approximately ₹7,250 per sq yd. A typical 150 sq yd plot can start around ₹10–12 lakh depending on project and location. Flexible payment plans are available.',
  },
  {
    q: 'Where is Dholera and how do I reach it?',
    a: 'Dholera is about 100 km south-west of Ahmedabad, Gujarat. The new 109 km Ahmedabad–Dholera Expressway brings travel time to around an hour, and Dholera International Airport is under construction at Navagam.',
  },
  {
    q: 'Can I visit the site before booking?',
    a: 'Absolutely — we recommend it. Capital Brix arranges guided site visits covering Dholera SIR, the airport site, the expressway and our projects, with free pickup from Ahmedabad.',
  },
  {
    q: 'Is Dholera investment safe for NRIs?',
    a: 'Yes. NRIs can legally purchase non-agricultural residential and commercial plots in India. Our NA-approved, registered-deed process is fully NRI friendly and we assist with documentation end to end.',
  },
];
