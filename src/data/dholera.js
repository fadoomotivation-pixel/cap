// ─────────────────────────────────────────────────────────────
// DHOLERA PILLAR PAGES — /dholera/<slug>
//
// These five routes previously rendered the SAME placeholder paragraph, from
// a <PlaceholderContent> component in App.jsx, over hotlinked mirrikh.com
// banners. Five near-identical ~215-word URLs sitting in the sitemap is
// textbook duplicate thin content: none of them could rank, and together they
// dilute the site.
//
// Each now owns one keyword cluster that nothing else on the site targets.
// /dholera/airport is deliberately absent — the blog guide already owns that
// query, so the route 301s there via vercel.json rather than competing with it.
//
// The hub at /dholera links to all four; each links back and across.
// ─────────────────────────────────────────────────────────────

export const dholeraPages = [
  // ══════════════════════════════════════════════════════════════
  {
    slug: 'about',
    tone: 'navy',
    keyword: 'What is Dholera SIR',
    title: 'What Is Dholera SIR? India’s First Greenfield Smart City',
    seoTitle: 'What Is Dholera SIR? India’s First Greenfield Smart City',
    h1: 'What is Dholera SIR, and why was it built from nothing?',
    excerpt:
      'Dholera Special Investment Region is a ~920 sq km planned city in Gujarat, notified under the Delhi–Mumbai Industrial Corridor. What that designation actually means, who governs it, and why the infrastructure came before the population.',
    intro:
      'Dholera Special Investment Region (DSIR) is a roughly 920 sq km planned region in Ahmedabad district, Gujarat, notified by the Government of Gujarat and developed under the Delhi–Mumbai Industrial Corridor. It is described as India’s first greenfield smart city because nothing was retrofitted: the trunk infrastructure — arterial roads, water, power, drainage and an ICT backbone — was laid out before residents and industry arrived. That single fact explains most of what is different about Dholera, including why land here is priced the way it is.',
    sections: [
      {
        h2: '“Special Investment Region” is a legal status, not a slogan',
        p: [
          'A Special Investment Region is a designation under Gujarat state law that creates a defined area with its own development authority, its own master plan, and a mandate to attract large-scale industrial investment. It is not a marketing label a developer can apply to a township.',
          'Practically, that status brings three things a private project cannot manufacture: a statutory master plan that governs what may be built where, a single authority responsible for delivering trunk infrastructure, and a land pooling and Town Planning scheme process that reorganises fragmented agricultural holdings into serviced, buildable plots.',
        ],
      },
      {
        h2: 'The numbers that define it',
        table: {
          head: ['', 'Dholera SIR'],
          rows: [
            ['Planned area', '≈ 920 sq km — larger than most Indian cities'],
            ['State', 'Gujarat, Ahmedabad district'],
            ['Distance from Ahmedabad', '≈ 100 km south-west'],
            ['Corridor', 'Delhi–Mumbai Industrial Corridor (DMIC)'],
            ['Anchor industry', 'Semiconductor manufacturing — Tata fabrication plant, ≈ ₹91,000 crore'],
            ['Air connectivity', 'Dholera International Airport, under construction at Navagam'],
            ['Road connectivity', '109 km Ahmedabad–Dholera Expressway'],
          ],
        },
      },
      {
        h2: 'Why “greenfield” changes the economics',
        p: [
          'Retrofitting a functioning city is brutally expensive. Every water main, every power cable, every metre of drainage has to be dug in under roads people are already using, past buildings that are already standing, with compensation and disruption at every step.',
          'A greenfield region inverts that. Utilities go into planned corridors before anything is built above them; road widths are set once and are not negotiated down by encroachment; industrial, residential and commercial zones are separated by design rather than by later regulation.',
          'For a buyer this matters in a specific way: the cost of servicing a plot in Dholera has largely already been committed by the state, rather than sitting as a future liability against the land you buy.',
        ],
        callout: {
          tone: 'tip',
          title: 'The honest counterweight',
          text: 'A planned city is only as real as its delivery schedule, and Indian infrastructure timelines move. Buy on the assumption that phases will take longer than announced — the case for Dholera should survive that, and if a particular purchase only works on the fastest timeline, it is the purchase that is wrong.',
        },
      },
      {
        h2: 'Who governs what',
        list: {
          items: [
            '**Dholera Special Investment Region Development Authority (DSIRDA)** — the regional authority responsible for the master plan and development control.',
            '**Government of Gujarat** — the notifying state authority, and the origin of the SIR designation itself.',
            '**Delhi–Mumbai Industrial Corridor Development Corporation** — the national corridor programme Dholera sits within.',
            '**Private developers** — companies like Mirrikh Infratech, which develop individual townships inside the approved framework. This is the layer a retail plot buyer actually transacts with.',
          ],
        },
      },
      {
        h2: 'What this means if you are buying a plot',
        p: [
          'The SIR designation tells you the region is planned and governed. It tells you nothing about whether the specific plot in front of you is legal to build on.',
          'Those are separate questions, and the second one is where buyers lose money: an NA (Non-Agricultural) conversion order, an NOC, plan approval and a clean title chain belong to the plot, not to the region. A plot inside Dholera SIR without them is agricultural land with a good postcode.',
        ],
      },
    ],
    faqs: [
      { q: 'What does Dholera SIR stand for?', a: 'Special Investment Region — a designation under Gujarat state law that gives a defined area its own development authority, statutory master plan and mandate to attract industrial investment.' },
      { q: 'How big is Dholera SIR?', a: 'Approximately 920 sq km, which makes it larger in planned area than most existing Indian cities.' },
      { q: 'Is Dholera a government project or a private one?', a: 'The region, its master plan and its trunk infrastructure are government-led, under the Government of Gujarat and the Delhi–Mumbai Industrial Corridor. Individual townships within it are built by private developers working inside that framework.' },
      { q: 'How far is Dholera from Ahmedabad?', a: 'Roughly 100 km south-west. The 109 km Ahmedabad–Dholera Expressway brings the drive to about an hour.' },
    ],
    related: ['overview', 'city-highlights', 'renew-power'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'overview',
    tone: 'teal',
    keyword: 'Dholera master plan phases',
    title: 'Dholera Master Plan: Phases, Zones and Activation Area',
    seoTitle: 'Dholera Master Plan: Phases, Zones & Activation Area',
    h1: 'The Dholera master plan: phases, zones, and what “activation area” means',
    excerpt:
      'Dholera is being built in phases, and where a plot sits relative to the activation area matters more to its value than its distance in kilometres. How the plan is structured and how to read it before you buy.',
    intro:
      'Dholera SIR is not being built all at once. The ~920 sq km region is developed in phases, and within the first phase sits a smaller area — commonly called the activation area — that receives trunk infrastructure first. For anyone buying land, understanding that structure matters more than any single amenity claim: two plots the same distance from a landmark can be a decade apart in when they become genuinely usable.',
    sections: [
      {
        h2: 'How the plan is layered',
        p: [
          'The master plan works at three levels, and confusing them is how buyers misread a location.',
        ],
        list: {
          ordered: true,
          items: [
            '**The region.** The full ~920 sq km SIR, with land use allocated across industrial, residential, commercial, recreational, knowledge and institutional zones.',
            '**The Town Planning (TP) scheme.** Within the region, land pooling schemes reorganise fragmented agricultural holdings into serviced plots with roads and utilities, returning a proportion of developed land to the original owners.',
            '**The activation area.** The portion prioritised for trunk infrastructure delivery, so that the first industry and residents have a functioning environment rather than a plan.',
          ],
        },
      },
      {
        h2: 'Land use zones, and why the zone decides your options',
        table: {
          head: ['Zone', 'What it is for', 'Relevance to a plot buyer'],
          rows: [
            ['Residential', 'Housing and neighbourhood amenities', 'The category most retail plots fall in'],
            ['Industrial', 'Manufacturing, including the semiconductor ecosystem', 'Larger parcels, different buyers, different economics'],
            ['Commercial / mixed use', 'Offices, retail, hospitality', 'Typically along arterial corridors'],
            ['Knowledge & institutional', 'Education, research, healthcare', 'Supports long-term residential demand nearby'],
            ['Recreation / green', 'Open space, parks, buffers', 'Cannot be built on — check what borders your plot'],
          ],
        },
        callout: {
          tone: 'warn',
          title: 'Check the zone of the plot, not of the area',
          text: 'A plot marketed as “residential” must be residential in the approved plan and NA-converted for that use. Zoning belongs to the survey number, not to the neighbourhood — ask for the plan approval showing your plot, and check the survey number on it matches.',
        },
      },
      {
        h2: 'Reading a location honestly',
        p: [
          'Distance to a landmark is the weakest of the useful signals, because a plot five kilometres from an interchange on a made road is better placed than one two kilometres away across unmade land.',
          'A more reliable order of questions:',
        ],
        list: {
          items: [
            '**Is there a built road to the plot today?** Drive it. Planned roads are worth materially less than built ones.',
            '**Is the plot inside a TP scheme that has been sanctioned?** That determines whether servicing is a schedule or an intention.',
            '**How far is it from the activation area boundary?** Adjacency to the phase currently being serviced carries a real premium and it is a fair one.',
            '**What is on the neighbouring land in the plan?** A green buffer is a permanent amenity; an industrial allocation is a permanent neighbour.',
          ],
        },
      },
      {
        h2: 'What phasing means for your time horizon',
        p: [
          'Phased development is why Dholera rewards patience rather than timing. Trunk infrastructure arrives area by area, and the gap between “allocated in the plan” and “serviced on the ground” is measured in years.',
          'This is not a criticism of the project — it is how every large planned city has ever been built. It is an argument for buying land you would be comfortable holding for five to ten years, in a location whose case does not depend on the next phase arriving on schedule.',
        ],
      },
    ],
    faqs: [
      { q: 'What is the activation area in Dholera?', a: 'The portion of the region prioritised for trunk infrastructure delivery, so early industry and residents get a functioning environment rather than a plan on paper. Proximity to it is one of the strongest drivers of land value inside the SIR.' },
      { q: 'What is a TP scheme?', a: 'A Town Planning scheme is a land pooling mechanism that reorganises fragmented agricultural holdings into serviced plots with roads and utilities, returning a share of the developed land to the original owners. Whether a plot sits inside a sanctioned TP scheme affects when it will actually be serviced.' },
      { q: 'Does being inside Dholera SIR mean a plot is approved for building?', a: 'No. The region’s designation says nothing about a specific plot. NA conversion, NOC and plan approval belong to the survey number and must be checked separately.' },
      { q: 'How long will Dholera take to complete?', a: 'It is a multi-decade, phased programme, and published timelines for individual components have moved before. Plan your purchase so that a delay of a few years is an inconvenience rather than a problem.' },
    ],
    related: ['about', 'city-highlights', 'renew-power'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'city-highlights',
    tone: 'sky',
    keyword: 'Dholera smart city infrastructure',
    title: 'Dholera Smart City Infrastructure: What Is Actually Built',
    seoTitle: 'Dholera Smart City Infrastructure: What’s Actually Built',
    h1: 'Dholera smart city infrastructure: what is designed, and what is built',
    excerpt:
      'Underground utility corridors, an ICT backbone, a central command centre, water and drainage designed before occupancy. What Dholera’s infrastructure plan includes — and how to check what exists on the ground today.',
    intro:
      'Dholera’s infrastructure is the reason the region is described as a smart city rather than a large township, and the specifics are unusual for India: utilities run in planned underground corridors, road widths are set by the master plan rather than by whatever survived encroachment, and the water, power and data networks were sized for a city that does not exist yet. This page sets out what the plan includes and, more usefully, how to verify what has actually been delivered near a plot you are considering.',
    sections: [
      {
        h2: 'What the infrastructure plan covers',
        list: {
          items: [
            '**Underground utility corridors.** Power, water, sewerage, gas and data run in dedicated ducts beneath the road network, so a future upgrade does not mean digging up a functioning street.',
            '**An ICT backbone and command centre.** City systems — utilities, traffic, safety — designed to be monitored centrally rather than department by department.',
            '**Water supply and treatment.** A planned potable supply with treatment, plus separate handling of waste water rather than discharge into the environment.',
            '**Drainage and flood management.** Storm water designed into the layout — significant in a coastal, low-lying region where retrofitting drainage later is close to impossible.',
            '**Arterial and internal road hierarchy.** Widths and junctions fixed by plan, with utility corridors beneath them.',
            '**Power.** Industrial-scale supply, with renewable generation in the region (see the Dholera solar park).',
          ],
        },
      },
      {
        h2: 'Designed, delivered, and the gap between them',
        p: [
          'Every item above is in the plan. That is not the same as being available at a given plot today, and the honest position is that delivery follows the phasing described on the master plan page — trunk infrastructure first in the activation area, then outward.',
          'Sellers rarely make that distinction, which is why it is worth making it yourself.',
        ],
        callout: {
          tone: 'warn',
          title: 'Three questions that cut through a brochure',
          text: 'Is there a metalled road to this plot today? Is there a power connection available at the boundary, or a date for one? Where does water for this township come from right now? Any seller worth transacting with can answer all three plainly.',
        },
      },
      {
        h2: 'What a developed township adds on top',
        p: [
          'Regional infrastructure gets services to the edge of a township. Inside it, the developer is responsible for the layer buyers actually live with:',
        ],
        list: {
          items: [
            'Internal roads, street lighting and boundary walls',
            'Plot demarcation and layout compliance with the approved plan',
            'Landscaping, open space and, in some projects, a club house',
            'Security and ongoing maintenance arrangements',
          ],
        },
        p2: [],
      },
      {
        h2: 'Why this matters more than the amenity list',
        p: [
          'Amenity lists are easy to write and hard to verify. Infrastructure is the opposite: you can stand on the plot and see whether the road exists.',
          'For a buyer, the practical test is simple — visit. Dholera is roughly an hour from Ahmedabad on the expressway, so a site visit fits inside a morning. What you see on that visit is worth more than any specification sheet, and any seller reluctant to arrange one has told you something.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Dholera’s infrastructure actually built or just planned?', a: 'Both, depending on where you stand. Trunk infrastructure is delivered in phases, starting with the activation area. The correct question is never "is Dholera built" but "what is built at this specific plot today" — which a site visit answers.' },
      { q: 'What makes Dholera a “smart” city?', a: 'Chiefly that utilities, road hierarchy and a data backbone were designed together before occupancy, with city systems intended to be monitored centrally — rather than services being retrofitted into a place people already live.' },
      { q: 'Does a plot come with a water and power connection?', a: 'Availability depends on the township and the phase. Ask specifically whether a connection exists at the plot boundary today or whether there is a committed date, and get the answer in writing.' },
      { q: 'Can I visit and see the infrastructure myself?', a: 'Yes, and you should. Capital Brix arranges free site visits; the drive from Ahmedabad is about an hour on the expressway.' },
    ],
    related: ['about', 'overview', 'renew-power'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'renew-power',
    tone: 'green',
    keyword: 'Dholera solar park renewable energy',
    title: 'Dholera Solar Park: Renewable Power Behind the Smart City',
    seoTitle: 'Dholera Solar Park: The Renewable Power Behind the SIR',
    h1: 'Dholera’s renewable power: why a solar park sits next to a chip fab',
    excerpt:
      'Large-scale solar generation in the Dholera region is not an environmental footnote — it is what makes energy-intensive manufacturing viable here. How renewable capacity and industrial demand fit together.',
    intro:
      'Gujarat has built large-scale solar generation capacity in the Dholera region, and it is easy to read that as a sustainability line in a brochure. It is more concrete than that: semiconductor fabrication and the industries around it are among the most power-hungry activities in manufacturing, and they need supply that is both large and uninterrupted. Renewable capacity located near the demand is part of what makes an industrial region of this kind workable at all.',
    sections: [
      {
        h2: 'Why an industrial region needs its own generation',
        p: [
          'A semiconductor fab does not simply consume a lot of electricity; it consumes it continuously and cannot tolerate interruption. A momentary outage during a process step can ruin work in progress worth far more than the power itself.',
          'That requirement shapes where such industries locate. Proximity to generation reduces transmission losses and exposure to grid congestion, and a region that has planned generation alongside industrial land is offering something a random industrial park cannot.',
        ],
      },
      {
        h2: 'What the region offers',
        list: {
          items: [
            '**Large-scale solar generation** in the Dholera region, developed under Gujarat’s renewable energy programme.',
            '**Land suited to it.** The terrain is flat, open and receives high solar irradiation — the conditions large solar installations are built for.',
            '**Co-location with demand.** Generation near an industrial region rather than hundreds of kilometres from it.',
            '**A policy environment** in which Gujarat has been among the more consistent Indian states on renewable capacity.',
          ],
        },
      },
      {
        h2: 'What it means for land in the region',
        p: [
          'The connection to plot values is indirect but real, and worth stating precisely rather than overselling.',
          'Renewable capacity does not make a residential plot more valuable by itself. What it does is strengthen the case for industry locating here — and industrial employment is what creates resident housing demand, which is the demand a residential plot actually depends on.',
        ],
        callout: {
          tone: 'tip',
          title: 'How to weigh it',
          text: 'Treat power infrastructure the way you would treat the airport or the expressway: a factor that makes the region more likely to work, not a reason to pay more for a specific plot today. The plot still has to stand on its own approvals, title and access.',
        },
      },
      {
        h2: 'The wider sustainability design',
        p: [
          'Renewable generation sits alongside the rest of Dholera’s environmental design — waste water treated rather than discharged, storm water drainage built into the layout rather than added later, and green and recreational land allocated in the master plan rather than left over.',
          'For a low-lying coastal region, drainage in particular is not a nicety. Designing it in from the start is one of the more consequential advantages of building greenfield.',
        ],
      },
    ],
    faqs: [
      { q: 'Is there a solar park in Dholera?', a: 'Yes — Gujarat has developed large-scale solar generation capacity in the Dholera region, taking advantage of flat, open land with high solar irradiation.' },
      { q: 'Does renewable power increase the value of a plot?', a: 'Not directly. It strengthens the case for industry locating in the region, and industrial employment is what creates the resident housing demand a residential plot depends on. It is a supporting factor, not a reason to pay a premium for a specific plot.' },
      { q: 'Why does a semiconductor plant need so much power?', a: 'Fabrication runs continuously and cannot tolerate interruption — a momentary outage during a process step can ruin work in progress. That makes large, reliable and nearby supply a siting requirement rather than a preference.' },
      { q: 'Is Dholera’s development environmentally planned?', a: 'The master plan allocates green and recreational land, treats waste water rather than discharging it, and builds storm water drainage into the layout — which matters in a low-lying coastal region where retrofitting drainage later is close to impossible.' },
    ],
    related: ['about', 'overview', 'city-highlights'],
  },
];

export const dholeraPageBySlug = (slug) => dholeraPages.find((p) => p.slug === slug);
