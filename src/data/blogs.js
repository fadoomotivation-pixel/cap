// ─────────────────────────────────────────────────────────────
// BLOG CONTENT — original, written for Capital Brix
//
// This file previously held 252 stub entries whose titles, excerpts and
// images were copied verbatim from mirrikh.com. None of them had a body or
// a URL, so none could ever rank; together they read to a crawler as a
// scraped, thin doorway page, which is a sitewide risk, not just a /blog one.
//
// They have been replaced with a small number of genuinely original articles
// that each own ONE keyword cluster, live at their own /blog/<slug> URL, and
// are written to convert as well as rank. Quality beats count here: eight
// pages that answer a real buyer question outrank two hundred that don't.
//
// Adding a post: give it a slug, a keyword nothing else on the site targets,
// 800+ words of real substance, 3+ FAQs, and add the URL to public/sitemap.xml.
// ─────────────────────────────────────────────────────────────

export const blogCategories = ['All', 'Investment', 'Infrastructure', 'Legal & Process', 'NRI'];

export const blogs = [
  // ══════════════════════════════════════════════════════════════
  {
    slug: 'dholera-plot-price-2026',
    category: 'Investment',
    keyword: 'Dholera plot price',
    date: '2026-08-12',
    updated: '2026-09-01',
    readMinutes: 8,
    tone: 'gold',
    title: 'Dholera Plot Price in 2026: What Land Actually Costs',
    h1: 'Dholera plot price in 2026: what land actually costs, and why',
    seoTitle: 'Dholera Plot Price 2026 | Rate Per Sq Yd & What Drives It',
    excerpt:
      'Residential plots in Dholera SIR run roughly ₹6,000–₹10,000 per sq yd in 2026, with entry pricing from ₹7,250. Here is what sets the rate, what the sticker price leaves out, and how to tell a fair quote from a padded one.',
    intro:
      'In 2026, NA-approved residential plots inside and around Dholera SIR transact in a band of roughly ₹6,000 to ₹10,000 per square yard, with Capital Brix inventory starting at ₹7,250 per sq yd at direct developer pricing. That band is wide for a reason: two plots ten minutes apart can differ by 40% on rate alone. This guide breaks down what you are actually paying for, what the quoted price usually excludes, and the questions that separate a fair number from a padded one.',
    sections: [
      {
        h2: 'The price band, and why it is a band',
        p: [
          'A single "Dholera rate" does not exist, and anyone quoting one is simplifying to make a sale. The Dholera Special Investment Region covers roughly 920 sq km — larger than most Indian cities — and land inside the activated development zone behaves nothing like land on the periphery.',
          'The practical spread you will encounter as a retail buyer in 2026:',
        ],
        table: {
          head: ['Plot type', 'Typical rate (₹/sq yd)', 'What drives it'],
          rows: [
            ['Residential, activation-zone adjacent', '₹8,000 – ₹10,000+', 'Proximity to the expressway interchange and airport corridor'],
            ['Residential, established township', '₹7,000 – ₹8,500', 'Plan-passed layout, internal roads laid, other plots already sold'],
            ['Residential, early-phase launch', '₹6,000 – ₹7,500', 'Entry pricing before infrastructure is visible on site'],
            ['Industrial / commercial', 'Quoted per project', 'Zoning, plot size, road frontage'],
          ],
        },
      },
      {
        h2: 'What actually moves the rate',
        p: [
          'Five factors explain most of the variation. Understanding them lets you argue a price rather than accept one.',
        ],
        list: {
          items: [
            '**Distance from the activation zone.** Dholera is being built in phases. Land inside or bordering the phase currently receiving trunk infrastructure — roads, water, power, drainage — carries a premium because the timeline to usable is short.',
            '**Approval status.** An NA (Non-Agricultural) converted, NOC-cleared, plan-passed plot costs more than agricultural land sold on a promise of future conversion. That premium is the cheapest insurance you will ever buy.',
            '**Road frontage and plot geometry.** A corner plot or one on a 30-foot internal road commands more than an interior plot of identical area. On resale, that gap widens rather than narrows.',
            '**Township versus loose land.** A plot inside a developed township comes with laid roads, boundary walls, street lighting and a maintenance structure. Loose agricultural land does not, and the cost of creating those things later falls on you.',
            '**Who you are buying from.** A plot passing through three intermediaries carries three margins. Direct developer pricing removes them.',
          ],
        },
      },
      {
        h2: 'What the quoted price does not include',
        p: [
          'The per-square-yard number is not the amount that leaves your account. Budget for these separately, and ask for them in writing before you pay a token:',
        ],
        list: {
          items: [
            '**Stamp duty and registration** — payable to the Government of Gujarat on the sale deed, calculated on the higher of transaction value or jantri (circle) rate.',
            '**Development / infrastructure charges** — where a township is laying internal roads, drainage and lighting, this is often quoted separately from the land rate.',
            '**Legal and documentation charges** — title search, drafting, and the cost of registering in your name.',
            '**Maintenance deposit** — some townships collect a one-time or annual amount for upkeep of common areas.',
          ],
        },
        callout: {
          tone: 'warn',
          title: 'Ask for the all-in number',
          text: 'Any seller who cannot give you a single all-inclusive figure — land + development + stamp duty + registration + legal — before you pay a token is either disorganised or leaving room to add charges later. Get it on paper.',
        },
      },
      {
        h2: 'Why Dholera pricing is where it is',
        p: [
          'Dholera SIR is India\'s first greenfield smart city, planned under the Delhi–Mumbai Industrial Corridor and backed by the Government of Gujarat. Unlike a city that grew organically and is now retrofitting infrastructure, Dholera\'s trunk network was designed before the population arrived.',
          'Three anchors underpin current demand. The Tata semiconductor fabrication plant, a project of roughly ₹91,000 crore, brings a manufacturing ecosystem rather than a single employer. Dholera International Airport is under construction at Navagam. The 109 km Ahmedabad–Dholera Expressway compresses the drive from Ahmedabad to roughly an hour.',
          'That combination is why land here trades above pure agricultural value and well below a functioning metro. You are pricing in execution risk on one side and a planned city on the other.',
        ],
      },
      {
        h2: 'Reading a quote like a buyer, not a target',
        p: [
          'When a rate is quoted to you, four questions will tell you almost everything about the deal:',
        ],
        list: {
          ordered: true,
          items: [
            '**"Is this NA converted and plan passed today, or pending?"** Pending is not the same as approved. Ask to see the order, not a summary of it.',
            '**"What is the survey number, and can I have the 7/12 and title chain?"** A seller who hesitates here has told you what you needed to know.',
            '**"What is the all-in cost including stamp duty and registration?"** See above.',
            '**"Am I buying from the developer or through an intermediary?"** Each layer is a margin you are paying and a party you cannot hold accountable later.',
          ],
        },
      },
      {
        h2: 'A worked example',
        p: [
          'A 150 sq yd residential plot at ₹7,250 per sq yd comes to ₹10.88 lakh on land value. Add stamp duty, registration and documentation, and the realistic all-in figure lands in the ₹12–13 lakh range depending on the project and the prevailing jantri rate. Payment plans are commonly structured across the construction and development milestones rather than demanded upfront.',
          'That is the honest arithmetic. Anyone showing you a much lower number is either quoting land value alone, or quoting land that is not yet NA converted.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is the minimum investment to buy a plot in Dholera?',
        a: 'Residential plots start from approximately ₹7,250 per sq yd. A typical 150 sq yd plot works out to around ₹10–12 lakh on land value, with the all-in figure including stamp duty, registration and documentation landing somewhat higher. Flexible payment plans across milestones are commonly available.',
      },
      {
        q: 'Will Dholera plot prices keep rising?',
        a: 'Nobody can promise a price movement, and you should be wary of anyone who does. What can be stated is the structural case: a planned city with committed trunk infrastructure, an operational-stage semiconductor ecosystem and an airport under construction attracts demand that unplanned land does not. Land prices in Dholera today sit at an early-growth stage relative to comparable corridors.',
      },
      {
        q: 'Is it cheaper to buy agricultural land and convert it myself?',
        a: 'On paper, yes. In practice the conversion process carries time, cost and outcome risk that most retail buyers are not equipped to absorb, and a failed conversion leaves you holding land you cannot build on or easily resell. The premium on an already NA-converted, plan-passed plot buys certainty.',
      },
      {
        q: 'What does "direct developer pricing" actually mean?',
        a: 'It means the price you pay is the developer\'s price, with no intermediary margin stacked on top. Capital Brix is the official strategy partner of Mirrikh Infratech, so inventory comes from the developer rather than through a resale chain.',
      },
    ],
    related: ['is-dholera-a-good-investment', 'how-to-verify-a-dholera-plot', 'dholera-land-vs-fd-gold-apartment'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'is-dholera-a-good-investment',
    category: 'Investment',
    keyword: 'Is Dholera a good investment',
    date: '2026-08-05',
    updated: '2026-09-01',
    readMinutes: 9,
    tone: 'navy',
    title: 'Is Dholera a Good Investment in 2026? An Honest Look',
    h1: 'Is Dholera a good investment in 2026? An honest look at both sides',
    seoTitle: 'Is Dholera a Good Investment in 2026? Honest Analysis',
    excerpt:
      'Dholera has a genuine structural case and genuine execution risk. Here is the argument for buying, the argument against, and the specific conditions under which it does and does not make sense for you.',
    intro:
      'Dholera is either India\'s most obvious long-term land play or its most over-marketed one, depending on whose brochure you last read. The truthful answer is that it is a real project with real risk, and whether it suits you depends less on Dholera and more on your time horizon and liquidity. This is the case for, the case against, and the test you should apply to yourself before you buy.',
    sections: [
      {
        h2: 'The case for',
        p: [
          'The bull argument is not about hype; it is about the unusual fact that the infrastructure came first.',
        ],
        list: {
          items: [
            '**It is planned, not accreted.** Dholera SIR spans roughly 920 sq km with a trunk network — arterial roads, water, power, drainage, ICT — laid out before the population arrived. Most Indian cities are retrofitting infrastructure into places people already live, at multiples of the cost.',
            '**The anchor is industrial, not residential speculation.** The Tata semiconductor fabrication plant, around ₹91,000 crore, does not arrive alone. Fabs pull suppliers, testing, packaging, logistics and services. Employment of that kind creates housing demand that does not depend on the next investor buying from the last one.',
            '**Connectivity is under construction, not under discussion.** The 109 km Ahmedabad–Dholera Expressway brings Ahmedabad to roughly an hour. Dholera International Airport is being built at Navagam.',
            '**State and corridor backing.** Dholera sits within the Delhi–Mumbai Industrial Corridor and carries Government of Gujarat commitment. That does not guarantee timelines, but it does change the probability distribution compared with a private township betting on a road that may never be funded.',
            '**Entry pricing is still early-stage.** Land in the ₹6,000–₹10,000 per sq yd band is priced for a place that is being built, not one that is built.',
          ],
        },
      },
      {
        h2: 'The case against — stated plainly',
        p: [
          'Any advisor who cannot articulate the bear case is selling, not advising. Here it is.',
        ],
        list: {
          items: [
            '**Timelines slip.** Large infrastructure programmes in India routinely run behind their announced schedule. If your thesis requires a specific facility to be operational by a specific year, your thesis is fragile.',
            '**Land is illiquid.** You cannot sell a plot on a Tuesday because you need money on Wednesday. Exit takes weeks to months and depends on finding a buyer at your price, not the last quoted price.',
            '**A plot produces no income.** Unlike a rented flat, bare land generates nothing while you hold it. Your entire return depends on appreciation, and you carry the holding cost meanwhile.',
            '**The market has genuine bad actors.** Dholera\'s visibility has attracted sellers offering unconverted agricultural land, disputed title, or plots outside the areas they imply. This is a risk you manage with documentation discipline, not optimism.',
            '**Concentration.** If a single fab or a single airport carries your entire thesis, you are more exposed than you think.',
          ],
        },
      },
      {
        h2: 'The honest test: is this suitable for you?',
        p: [
          'Suitability is personal. Work through these four questions truthfully.',
        ],
        list: {
          ordered: true,
          items: [
            '**Is this money you can leave alone for five to ten years?** If the answer involves a wedding, a down payment or school fees inside that window, land is the wrong instrument regardless of the location.',
            '**Would a delay of two or three years break your plan or merely annoy you?** If it breaks the plan, reduce the size or step away.',
            '**Is this a slice of a portfolio or the whole of it?** Land should be an allocation, not a bet.',
            '**Will you actually do the documentation work — or insist someone does it for you in writing?** If you would rather not read a title chain, buy only where the paperwork is handed to you complete.',
          ],
        },
        callout: {
          tone: 'tip',
          title: 'The pattern that works',
          text: 'Buyers who do well in land are the ones who bought a legally clean plot at a fair price, held it through at least one cycle of discouraging news, and were never forced to sell. Nothing about that pattern is exciting, which is exactly why it works.',
        },
      },
      {
        h2: 'What "good" would look like, concretely',
        p: [
          'Rather than a return promise, here is what a well-executed Dholera purchase looks like on the day it closes: an NA-converted, NOC-cleared, plan-passed plot; a clean title chain you have actually seen; a registered sale deed in your own name; an all-in cost you agreed before paying a token; and a payment plan that does not strain your cash flow.',
          'Get those five right and you have removed most of the risk that is actually within your control. What remains — the pace of national infrastructure — was never yours to control, and pretending otherwise is how people overpay.',
        ],
      },
      {
        h2: 'Where Capital Brix sits in this',
        p: [
          'We sell plots, so treat this section with appropriate scepticism and check what follows against documents. Capital Brix LLP is the official strategy partner of Mirrikh Infratech, a Dholera developer with 8+ completed projects since 2012. That matters for one narrow reason: a developer with delivered projects has a track record you can go and physically look at, which is not true of an entity formed last year.',
          'What we will not do is quote you a return figure. What we will do is put the approvals, the title chain and the all-in cost in front of you before you commit, and take you to the site so you can stand on the plot you are buying.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Dholera a good investment for a first-time land buyer?',
        a: 'It can be, provided two conditions hold: the money is genuinely long-term, and you buy a plot whose approvals and title are already clean rather than promised. First-time buyers get into trouble on documentation, not on location — so the safeguard is insisting on NA conversion, NOC, plan approval and a registered sale deed in your name.',
      },
      {
        q: 'What is the realistic holding period?',
        a: 'Treat five to ten years as the working assumption. Land in a city under construction rewards patience and punishes forced exits. If your horizon is under three years, the illiquidity risk outweighs the growth case.',
      },
      {
        q: 'What is the single biggest risk?',
        a: 'Buying the wrong paper, not the wrong place. Unconverted agricultural land sold as plot-ready, a disputed title chain, or a plot that is not where the brochure implies will cost you far more than a two-year delay in an airport.',
      },
      {
        q: 'Can I get a home loan against a Dholera plot?',
        a: 'Plot loans exist but are treated differently from home loans by most lenders, with different loan-to-value ratios and tenures. Availability depends on the lender, the project and the approval status of the land — so confirm with your bank against the specific project before you assume financing.',
      },
    ],
    related: ['dholera-plot-price-2026', 'how-to-verify-a-dholera-plot', 'dholera-land-vs-fd-gold-apartment'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'how-to-verify-a-dholera-plot',
    category: 'Legal & Process',
    keyword: 'verify Dholera plot documents',
    date: '2026-07-22',
    updated: '2026-09-01',
    readMinutes: 10,
    tone: 'green',
    title: 'How to Verify a Dholera Plot Before You Pay Anything',
    h1: 'How to verify a Dholera plot before you pay a single rupee',
    seoTitle: 'Verify a Dholera Plot: NA, NOC, Title Clear Checklist',
    excerpt:
      'NA conversion, NOC, plan approval, title chain, 7/12 extract, encumbrance. The documents that decide whether you own land or a dispute — what each one proves, and the order to check them in.',
    intro:
      'Almost every bad land purchase in India fails on paper, not on location. The plot exists, the city gets built, and the buyer still loses — because the land was never legally theirs to build on. This is the document checklist for a Dholera plot, in the order you should demand it, and what each item actually proves. Read it before you pay a token, not after.',
    sections: [
      {
        h2: 'The six documents that matter',
        p: [
          'Everything else is supporting material. These six decide whether you are buying an asset or a lawsuit.',
        ],
        table: {
          head: ['Document', 'What it proves', 'Red flag'],
          rows: [
            ['NA (Non-Agricultural) order', 'The land may legally be used for non-farm purposes', '"Conversion is in process" — that is not an approval'],
            ['NOC / clearances', 'The competent authorities have no objection to the development', 'A summary letter instead of the order itself'],
            ['Approved layout / plan passing', 'This specific plot exists in an approved layout', 'A marketing site plan with no approval stamp'],
            ['Title chain', 'An unbroken record of ownership up to the current seller', 'A gap of any length, or an unexplained transfer'],
            ['7/12 extract (Record of Rights)', 'Current recorded ownership and any noted rights', 'Names on the record that nobody has explained to you'],
            ['Encumbrance certificate', 'No registered mortgage, lien or charge on the land', 'A subsisting charge the seller says "will be cleared"'],
          ],
        },
      },
      {
        h2: 'NA conversion: the one people skip',
        p: [
          'Agricultural land in Gujarat cannot simply be built on. It must be converted to non-agricultural use through a formal order. Until that order exists, a plot marketed as residential is agricultural land with a brochure.',
          'The failure mode is specific and common: a buyer pays for land on the assurance that conversion is "in process", the process stalls or is refused, and the buyer is left holding agricultural land they cannot build on and struggle to resell at the price they paid.',
        ],
        callout: {
          tone: 'warn',
          title: 'Ask for the order, not a description of it',
          text: 'A seller who can describe an approval but not produce the document has, in effect, told you the document does not exist yet. Read the order, check that the survey number on it matches the plot you are being shown, and check the date.',
        },
      },
      {
        h2: 'Title chain: how far back is far enough',
        p: [
          'A title chain is the sequence of transfers that ends with your seller. You are checking for two things: that the sequence is unbroken, and that each transfer was one the transferor was entitled to make.',
          'Practitioners commonly examine the chain across the preceding decades rather than a single transfer, because a defect introduced two owners ago travels forward to you. Where the land has passed through inheritance, look specifically for whether all legal heirs joined in the transfer — an omitted heir is the most common latent defect in Indian land title.',
        ],
      },
      {
        h2: 'The order to check things in',
        p: [
          'Sequence matters, because each step can save you the cost of the next.',
        ],
        list: {
          ordered: true,
          items: [
            '**Confirm the survey number and physically locate the plot.** Stand on it. Match the boundaries against the layout. A surprising number of disputes begin with a buyer who never visited the land they bought.',
            '**Verify NA conversion and plan approval for that survey number.** If this fails, stop. Nothing further is worth your time.',
            '**Pull the 7/12 extract and read the names.** Ask about anyone you do not recognise.',
            '**Trace the title chain.** Have a lawyer do this if you are not confident; the fee is trivial against the exposure.',
            '**Obtain the encumbrance certificate.** Confirm there is no subsisting charge.',
            '**Only then discuss price and pay a token** — and pay it against a written agreement that names the survey number.',
          ],
        },
      },
      {
        h2: 'Registration: the step that makes it yours',
        p: [
          'Ownership transfers on a registered sale deed, executed at the sub-registrar\'s office with stamp duty paid. Not on an agreement to sell, not on a receipt, not on a power of attorney. Those instruments have their uses, but none of them makes you the owner.',
          'Insist that the deed is registered in your own name — or in the names of all intended owners, correctly spelled and matching your identity documents. Correcting a name after registration is possible but tedious, and correcting an ownership structure is worse.',
        ],
        callout: {
          tone: 'tip',
          title: 'Keep your own file',
          text: 'Keep originals of the registered sale deed, the NA order, plan approval, the title documents and every payment receipt, in one place, with digital scans backed up. The next person who needs this file is either you at resale or your family — and both will be grateful it exists.',
        },
      },
      {
        h2: 'What a clean purchase looks like at Capital Brix',
        p: [
          'We sell only NA-converted, NOC-approved, title-clear and plan-passed plots, completed through a registered sale deed in the buyer\'s name. The documentation is assembled and handed over as part of the purchase rather than chased afterwards, and our Noida office supports the process end to end.',
          'None of that is a reason to skip your own verification. It is a reason that your verification should be quick and uneventful — which is exactly how a land purchase ought to feel.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are plots in Dholera legal and title clear?',
        a: 'It depends entirely on the seller and the specific plot. Legitimate NA-converted, NOC-approved, plan-passed and title-clear plots exist in Dholera and are what Capital Brix sells. Unconverted agricultural land marketed as plot-ready also exists. The distinction is visible in the documents, which is why you should never buy without reading them.',
      },
      {
        q: 'Do I need a lawyer to buy a plot in Dholera?',
        a: 'For a title chain review, it is money well spent — the fee is small against the value at risk, and a lawyer will spot defects a buyer would not. For the rest of the process, a seller who hands over complete documentation makes the lawyer\'s job short.',
      },
      {
        q: 'What is a 7/12 extract?',
        a: 'It is the Record of Rights maintained by the Gujarat revenue authorities, showing the recorded owner of a survey number along with rights and liabilities noted against it. Reading it tells you whose name the land currently stands in, which should match the person selling it to you.',
      },
      {
        q: 'Is a power of attorney sale safe?',
        a: 'Ownership in India transfers on a registered sale deed. A power of attorney authorises someone to act, but a POA-based transaction does not give you the same standing as a registered deed in your own name. Prefer the registered sale deed, always.',
      },
    ],
    related: ['dholera-plot-price-2026', 'is-dholera-a-good-investment', 'nri-guide-buying-land-in-dholera'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'dholera-international-airport',
    category: 'Infrastructure',
    keyword: 'Dholera International Airport',
    date: '2026-07-08',
    updated: '2026-09-01',
    readMinutes: 7,
    tone: 'sky',
    title: 'Dholera International Airport and the Land Around It',
    h1: 'Dholera International Airport: what it is, and what it does to land nearby',
    seoTitle: 'Dholera International Airport: Status & Impact on Land',
    excerpt:
      'The airport under construction at Navagam is one of three anchors behind Dholera land demand. What is being built, how airports have historically affected surrounding land, and how to price that in without over-paying for a promise.',
    intro:
      'Dholera International Airport is being built at Navagam, within the Dholera Special Investment Region, and is one of the three infrastructure anchors — alongside the Ahmedabad–Dholera Expressway and the Tata semiconductor fab — that explain why land here trades above agricultural value. This is what the project is, what airports have historically done to land around them, and the discipline required not to over-pay for that expectation.',
    sections: [
      {
        h2: 'What is being built',
        p: [
          'The airport is a greenfield project at Navagam, planned to serve the Dholera SIR region and to relieve pressure on Ahmedabad. Being greenfield matters: unlike an expansion squeezed into an existing city, the surrounding land use is being planned around the airport rather than the other way round.',
          'For a land buyer, the practical significance is less about passenger numbers and more about what an airport forces into existence around it — approach roads, utilities, hotels, warehousing, and the commercial activity that follows freight and business travel.',
        ],
      },
      {
        h2: 'What airports historically do to nearby land',
        p: [
          'The pattern across Indian and international examples is consistent enough to be useful, though never a guarantee:',
        ],
        list: {
          items: [
            '**Connectivity infrastructure arrives first and is durable.** Approach roads and utility corridors built for an airport serve everything else around them.',
            '**Commercial and logistics demand concentrates within a corridor**, not evenly in a circle. Land on the access route behaves differently from land equidistant but off-route.',
            '**The largest re-rating typically happens between announcement and operation**, not after. By the time the first flight lands, much of the expectation is already in the price.',
            '**Immediately adjacent land can be constrained** by height restrictions, noise zoning and acquisition. Closest is not automatically best.',
          ],
        },
        callout: {
          tone: 'warn',
          title: 'Beware the "airport se 5 minute" pitch',
          text: 'Proximity claims are the most-abused line in Dholera marketing. Ask for the survey number, put it on a map yourself, and check what road actually connects it. A plot that is close in kilometres but not on an access route is not close in any way that matters.',
        },
      },
      {
        h2: 'How to price this in without over-paying',
        p: [
          'The mistake is treating an under-construction airport as though it were operational. The correction is to buy land that would still be defensible if the timeline slipped by several years.',
        ],
        list: {
          ordered: true,
          items: [
            '**Buy for the plot\'s own merits first.** Approvals, title, layout quality, road frontage. The airport is a tailwind, not a substitute for any of these.',
            '**Prefer land already served by a road that exists.** Planned connectivity is worth less than built connectivity.',
            '**Do not pay a premium priced for completion** when the project is under construction. If the quoted rate only makes sense on the assumption of an operational airport, the seller has already taken your upside.',
            '**Check the zoning of the specific plot**, not the region. Airport-adjacent land can carry use restrictions.',
          ],
        },
      },
      {
        h2: 'Where this fits with the other two anchors',
        p: [
          'Taken alone, an airport is a single point of failure. Taken with the 109 km Ahmedabad–Dholera Expressway — which brings the drive from Ahmedabad to roughly an hour — and the roughly ₹91,000 crore Tata semiconductor fabrication plant, it becomes part of a system where each element makes the others more useful.',
          'That is the honest strength of the Dholera case: not any single project, but three of them pointing the same way, in a region planned to receive them. And it is also why a buyer should not let any one of them carry the entire argument.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where is Dholera International Airport being built?',
        a: 'At Navagam, within the Dholera Special Investment Region in Gujarat, roughly 100 km south-west of Ahmedabad.',
      },
      {
        q: 'When will the airport be operational?',
        a: 'Large infrastructure timelines in India move, and we do not quote a completion date as a fact. Treat any date you are given — by us or anyone else — as a target rather than a commitment, and make sure your purchase still makes sense if it slips.',
      },
      {
        q: 'Should I buy the plot closest to the airport?',
        a: 'Not automatically. Land immediately adjacent to an airport can carry height, noise and zoning restrictions, and land on the access corridor often performs better than land that is merely nearby. Judge the specific plot: its approvals, its road, its layout.',
      },
      {
        q: 'How do I verify a plot is actually where the seller says?',
        a: 'Ask for the survey number, plot it on a map yourself, and visit the site. Every legitimate seller will give you the survey number without hesitation.',
      },
    ],
    related: ['ahmedabad-dholera-expressway', 'tata-semiconductor-plant-dholera', 'dholera-plot-price-2026'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'tata-semiconductor-plant-dholera',
    category: 'Infrastructure',
    keyword: 'Tata semiconductor plant Dholera',
    date: '2026-06-24',
    updated: '2026-09-01',
    readMinutes: 8,
    tone: 'violet',
    title: 'The Tata Semiconductor Fab in Dholera: Why It Matters',
    h1: 'The Tata semiconductor fab in Dholera: why one factory changes a region',
    seoTitle: 'Tata Semiconductor Plant Dholera: Impact on the Region',
    excerpt:
      'A roughly ₹91,000 crore fabrication plant is the largest single commitment in Dholera. Fabs do not arrive alone — here is what an ecosystem like this brings, and what it realistically means for land in the region.',
    intro:
      'Of everything happening in Dholera, the Tata semiconductor fabrication plant — a commitment of roughly ₹91,000 crore — is the item that most changes the region\'s economic profile. Not because of the factory itself, but because of what a fab requires around it. This explains the ecosystem effect in practical terms, and what it does and does not mean for someone considering land.',
    sections: [
      {
        h2: 'Why a fab is different from a factory',
        p: [
          'A conventional plant employs people and buys inputs. A semiconductor fabrication facility does that and also forces an entire supply chain into physical proximity, because the process demands it.',
          'Fabs need ultra-pure water and uninterrupted power at industrial scale. They need specialty gases and chemicals delivered reliably. They need assembly, testing, marking and packaging operations nearby. They need cleanroom construction and maintenance contractors, precision logistics, and a workforce spanning PhD-level process engineers to skilled technicians.',
          'Each of those is a business that locates near the fab. That is the ecosystem effect, and it is why a single fab announcement reshapes a region in a way that a single factory does not.',
        ],
      },
      {
        h2: 'What that means on the ground',
        list: {
          items: [
            '**Employment across skill levels**, not just at the top. Fabs are famously capital-intensive per job, but their supplier ecosystems are not.',
            '**Sustained housing demand from people who live where they work.** This is qualitatively different from demand created by investors selling to other investors.',
            '**Commercial and retail activity** following a resident population with disposable income.',
            '**Industrial land absorption** by suppliers who need to be close, which tightens availability of the good parcels first.',
            '**Infrastructure prioritisation.** A project of this scale concentrates official attention on power, water and road delivery in its vicinity.',
          ],
        },
      },
      {
        h2: 'The realistic reading',
        p: [
          'Two things are true at once, and a serious buyer holds both.',
          'The first: this is the most substantive industrial commitment Dholera has, and it is the kind that creates durable local demand rather than speculative churn. Semiconductor manufacturing is a strategic national priority, which makes sustained policy support more likely than for an ordinary industrial park.',
          'The second: fabs take years to move from commitment to volume production, and the ecosystem builds out over a longer period still. Anyone presenting this as a short-term catalyst is misrepresenting how the industry works.',
        ],
        callout: {
          tone: 'tip',
          title: 'The useful mental model',
          text: 'Treat the fab as raising the floor under long-term demand for well-located, legally clean land in the region — not as a timer counting down to a price event. Buy accordingly: on a long horizon, at a price that does not already assume the ecosystem is built.',
        },
      },
      {
        h2: 'How this interacts with the rest of Dholera',
        p: [
          'The fab is one of three anchors. Dholera International Airport is under construction at Navagam. The 109 km Ahmedabad–Dholera Expressway compresses the Ahmedabad drive to roughly an hour. Beneath all of it sits a planned 920 sq km region with trunk infrastructure designed before occupancy — which is the reason a project of this scale could site here at all.',
          'That sequencing is the actual story. Dholera did not attract a fab because the fab wanted a village; it attracted one because the land, power, water and connectivity were planned to industrial specification in advance.',
        ],
      },
      {
        h2: 'What to do with this information',
        p: [
          'If you are considering land in Dholera, the fab should inform your time horizon rather than your urgency. It supports a five-to-ten-year view. It does not justify overpaying today, skipping documentation, or buying a plot whose only merit is a claimed distance from the plant.',
          'The plot you buy still has to be NA-converted, NOC-cleared, plan-passed and title-clear, in a layout with real road access, at a price that reflects today rather than an assumed tomorrow. The fab changes the backdrop. It does not change the checklist.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How big is the Tata semiconductor plant in Dholera?',
        a: 'The project represents a commitment of roughly ₹91,000 crore, making it the largest single industrial investment associated with Dholera SIR.',
      },
      {
        q: 'Will the fab increase land prices in Dholera?',
        a: 'It strengthens the structural case for long-term demand, because a fab brings a supplier ecosystem and resident employment rather than speculative interest alone. Nobody can responsibly promise a price outcome, and you should be cautious of anyone who does.',
      },
      {
        q: 'How long before the ecosystem is actually built out?',
        a: 'Semiconductor facilities move from commitment to volume production over a period of years, and the surrounding supplier ecosystem develops over a longer period still. This is a long-horizon factor, not a short-term catalyst.',
      },
      {
        q: 'Should I buy industrial or residential land because of the fab?',
        a: 'That depends on your capital, horizon and intent rather than on the fab. Industrial plots serve buyers planning an operation or targeting supplier demand; residential plots serve buyers positioning for housing demand from the workforce. Both exist in the Mirrikh Infratech portfolio, and the right answer is the one that matches your situation.',
      },
    ],
    related: ['dholera-international-airport', 'ahmedabad-dholera-expressway', 'is-dholera-a-good-investment'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'ahmedabad-dholera-expressway',
    category: 'Infrastructure',
    keyword: 'Ahmedabad Dholera Expressway',
    date: '2026-06-10',
    updated: '2026-09-01',
    readMinutes: 6,
    tone: 'teal',
    title: 'The Ahmedabad–Dholera Expressway: An Hour That Changes Things',
    h1: 'The Ahmedabad–Dholera Expressway: why one hour changes everything',
    seoTitle: 'Ahmedabad Dholera Expressway: Route, Distance & Impact',
    excerpt:
      'A 109 km expressway that brings Dholera within roughly an hour of Ahmedabad. Why travel time, more than distance, decides whether a satellite region becomes part of a metro economy.',
    intro:
      'Dholera sits roughly 100 km south-west of Ahmedabad. On its own, that distance would keep it a separate place. The 109 km Ahmedabad–Dholera Expressway changes the number that actually matters — travel time, brought down to around an hour — and travel time is what decides whether a region becomes part of a metropolitan economy or stays outside it.',
    sections: [
      {
        h2: 'Distance is not the variable; time is',
        p: [
          'People do not plan their lives in kilometres. They plan them in hours. A location an hour from a major city is one where a professional can live and commute occasionally, a business can serve metro clients, a family can visit on a weekend, and goods can reach a market within a working day.',
          'Push that to two and a half hours and every one of those behaviours breaks. This is why expressways re-rate the land along them: they move a place across a behavioural threshold, not merely closer on a map.',
        ],
      },
      {
        h2: 'What the expressway actually enables',
        list: {
          items: [
            '**Access to Ahmedabad\'s labour market.** Industry in Dholera can recruit from a metro rather than only from its immediate surroundings.',
            '**Freight economics.** Predictable travel time is worth more to a logistics operation than raw distance; it is what makes same-day delivery cycles possible.',
            '**Weekend and second-home demand**, which historically follows fast road access out of large cities.',
            '**Investor and buyer footfall.** A site visit that fits in a morning happens far more often than one requiring an overnight stay — which matters more to a land market than people expect.',
          ],
        },
      },
      {
        h2: 'What it does not do',
        p: [
          'An expressway improves access to a region. It does not improve access to your specific plot.',
          'Land that sits on or near an interchange behaves very differently from land that is nominally in the same region but reached by an unmade road. The expressway is a trunk; what connects your plot to it is the question that decides your outcome.',
        ],
        callout: {
          tone: 'warn',
          title: 'Check the last mile, not the highway',
          text: 'Before you buy, ask which road connects the plot to the expressway, whether that road exists today, and drive it. The gap between "on the expressway corridor" and "reached by a track" is where a lot of buyers have been disappointed.',
        },
      },
      {
        h2: 'How to use this when choosing a plot',
        list: {
          ordered: true,
          items: [
            '**Establish the actual drive**, not the claimed one. Do it yourself, on a normal day.',
            '**Prefer layouts with completed internal roads.** A township that has laid its roads has demonstrated capability; one that has drawn them has demonstrated intent.',
            '**Weigh interchange proximity properly.** Being near an access point is worth more than being near the carriageway.',
            '**Do not pay for connectivity that does not exist yet.** Planned roads are worth less than built ones, and the price should reflect that.',
          ],
        },
      },
      {
        h2: 'The combined picture',
        p: [
          'The expressway, Dholera International Airport under construction at Navagam, and the roughly ₹91,000 crore Tata semiconductor fabrication plant form a set. Road access makes the region reachable; the airport makes it reachable from further away; the fab gives people a reason to come.',
          'Any one of the three alone would be a weaker argument than people make it. Together, inside a planned 920 sq km region with trunk infrastructure laid before occupancy, they are the reason Dholera is discussed differently from an ordinary township on a highway.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How long is the Ahmedabad–Dholera Expressway?',
        a: 'Approximately 109 km, connecting Ahmedabad to the Dholera Special Investment Region.',
      },
      {
        q: 'How far is Dholera from Ahmedabad?',
        a: 'Roughly 100 km south-west. The expressway brings the drive down to about an hour, which is the number that matters for commuting, freight and site visits.',
      },
      {
        q: 'Does being near the expressway guarantee a plot is well located?',
        a: 'No. What connects your specific plot to the expressway matters more than the expressway itself. Check the internal and approach roads, and drive them before you buy.',
      },
      {
        q: 'Can I visit Dholera and see plots in a single day from Ahmedabad?',
        a: 'Yes — that is precisely what the improved travel time enables, and it is why we encourage buyers to physically visit the plot they are considering rather than relying on a brochure.',
      },
    ],
    related: ['dholera-international-airport', 'tata-semiconductor-plant-dholera', 'dholera-plot-price-2026'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'nri-guide-buying-land-in-dholera',
    category: 'NRI',
    keyword: 'NRI buying land in Dholera',
    date: '2026-05-28',
    updated: '2026-09-01',
    readMinutes: 9,
    tone: 'indigo',
    title: 'NRI Guide: Buying Land in Dholera from Abroad',
    h1: 'NRI guide: buying land in Dholera without flying back twice',
    seoTitle: 'NRI Buying Land in Dholera: Rules, Process & Checklist',
    excerpt:
      'What an NRI can and cannot buy in India, how to pay for it, the power-of-attorney question, tax at sale, and how to run the whole process remotely without losing control of the documentation.',
    intro:
      'Buying land in India from abroad is not difficult, but it is unforgiving of shortcuts: distance makes it harder to verify what you are told, and easier for a seller to manage you rather than inform you. This guide covers what an NRI may buy, how payment works, the power-of-attorney decision, what happens at sale, and how to keep control of the process from another time zone.',
    sections: [
      {
        h2: 'What an NRI can and cannot buy',
        p: [
          'Under India\'s foreign exchange rules, a Non-Resident Indian may generally acquire residential and commercial immovable property in India. What NRIs generally may not acquire is agricultural land, plantation property and farmhouses — these require specific approval and are not available through an ordinary purchase.',
          'This distinction is exactly why NA conversion matters more to an NRI buyer than to a resident one. A plot that has not been converted from agricultural use is not merely a documentation problem; it can be a category you are not permitted to buy. Confirm NA status in writing, against the order, before anything else.',
        ],
        callout: {
          tone: 'warn',
          title: 'This is a summary, not advice',
          text: 'Foreign exchange and tax rules change, and their application depends on your residency status and your country of residence. Treat everything here as orientation, and confirm your specific position with a qualified chartered accountant or advisor before you transact.',
        },
      },
      {
        h2: 'How payment works',
        list: {
          items: [
            '**Funds are routed through normal banking channels** — typically an NRE, NRO or FCNR account — rather than cash or informal transfer.',
            '**Keep a clean paper trail from source to seller.** You will want it at resale and at repatriation, and reconstructing it years later is painful.',
            '**Get the all-in cost in writing before you remit:** land value, development charges, stamp duty, registration and legal costs.',
            '**Match the payment schedule to milestones** rather than paying ahead of them.',
          ],
        },
      },
      {
        h2: 'The power-of-attorney decision',
        p: [
          'Most NRI buyers cannot be physically present for every step, so a power of attorney to a trusted person in India is common and practical. Two cautions are worth stating plainly.',
          'First, a POA is an instrument of enormous authority. Give it to someone whose interests are aligned with yours — a family member — and scope it narrowly to the transaction rather than granting general powers.',
          'Second, a POA executed abroad usually requires attestation at an Indian mission or notarisation followed by apostille, depending on the country, and then must be handled correctly in India. Start this early; it is the step most likely to delay an otherwise ready transaction.',
          'What a POA should never do is replace your own review of the documents. Have the NA order, plan approval, title chain and encumbrance certificate sent to you as scans and read them yourself, or have your own lawyer read them.',
        ],
      },
      {
        h2: 'What happens when you sell',
        p: [
          'Plan the exit before the entry — it changes what you buy and how you hold it.',
          'When an NRI sells immovable property in India, the buyer is required to deduct tax at source on the sale consideration, at rates applicable to non-resident sellers, which are structured differently from the rate applied when a resident sells. Where the actual tax liability is lower than the deducted amount, the usual route is either a lower-deduction certificate obtained in advance, or a refund claimed through your return.',
          'Repatriating the proceeds abroad has its own procedure and limits, and depends on how the property was originally funded. The single practical thing you can do today to make that easier later is to retain complete records of how you paid for the property in the first place.',
        ],
      },
      {
        h2: 'Running the process remotely without losing control',
        list: {
          ordered: true,
          items: [
            '**Demand documents as files, not descriptions.** NA order, plan approval, 7/12 extract, title chain, encumbrance certificate — as scans, before you commit.',
            '**Appoint your own lawyer in India** for the title review. Not the seller\'s lawyer.',
            '**Have someone you trust physically visit the plot**, with the survey number, and send you photographs and a video walking the boundary.',
            '**Insist on a registered sale deed in your name.** Not an agreement to sell, not a POA-based transfer.',
            '**Keep one complete file** — deed, approvals, remittance records, receipts — backed up digitally.',
          ],
        },
        callout: {
          tone: 'tip',
          title: 'One visit, well planned, beats three rushed ones',
          text: 'With the Ahmedabad–Dholera Expressway bringing the drive to roughly an hour, a single trip can cover multiple site visits, the sub-registrar and a meeting at our Noida office. Tell us your dates and we will structure the visit around them.',
        },
      },
    ],
    faqs: [
      {
        q: 'Can an NRI buy a plot in Dholera?',
        a: 'An NRI may generally acquire residential and commercial immovable property in India, which includes NA-converted residential plots. Agricultural land, plantation property and farmhouses are generally not available to NRIs without specific approval — which makes confirming NA conversion the first thing to check.',
      },
      {
        q: 'Does an NRI need to be in India to buy property?',
        a: 'Not necessarily. Much of the process can be handled remotely, with a properly executed and attested power of attorney covering steps requiring physical presence. The documents should still be reviewed by you or your own lawyer.',
      },
      {
        q: 'What tax applies when an NRI sells property in India?',
        a: 'The buyer is required to deduct tax at source on the sale consideration at rates applicable to non-resident sellers. Where the actual liability is lower, a lower-deduction certificate obtained in advance or a refund via your return are the usual routes. Confirm your position with a chartered accountant, since it depends on your residency and holding period.',
      },
      {
        q: 'Can I repatriate the sale proceeds abroad?',
        a: 'Repatriation is permitted subject to conditions and limits that depend on how the property was originally funded and your residency status. Retaining complete records of your original remittances is the single most useful thing you can do to make this straightforward later.',
      },
    ],
    related: ['how-to-verify-a-dholera-plot', 'dholera-plot-price-2026', 'is-dholera-a-good-investment'],
  },

  // ══════════════════════════════════════════════════════════════
  {
    slug: 'dholera-land-vs-fd-gold-apartment',
    category: 'Investment',
    keyword: 'land investment vs FD gold apartment',
    date: '2026-05-14',
    updated: '2026-09-01',
    readMinutes: 8,
    tone: 'amber',
    title: 'Land vs FD vs Gold vs an Apartment: An Honest Comparison',
    h1: 'Land, FD, gold or an apartment: comparing them honestly',
    seoTitle: 'Land vs FD vs Gold vs Flat: Which Suits Your Money?',
    excerpt:
      'These four instruments are not competitors — they answer different questions. A clear comparison of liquidity, income, effort, risk and horizon, so you can decide what a plot should and should not be doing in your portfolio.',
    intro:
      'The question "is land better than an FD?" has no answer, because the two are not trying to do the same job. A fixed deposit protects capital and stays liquid. Land trades both of those away for a shot at growth. Gold hedges. An apartment produces income and demands upkeep. This is a straight comparison across the dimensions that actually differ, so you can decide what role — if any — a plot should play for you.',
    sections: [
      {
        h2: 'Side by side',
        table: {
          head: ['', 'Fixed deposit', 'Gold', 'Apartment', 'Land / plot'],
          rows: [
            ['Liquidity', 'High — days', 'High — days', 'Low — months', 'Low — months'],
            ['Income while held', 'Interest', 'None', 'Rent, minus costs', 'None'],
            ['Ongoing effort', 'None', 'Minimal', 'High — tenants, repairs', 'Low — but not zero'],
            ['Depreciation', 'None', 'None', 'The structure depreciates', 'Land does not depreciate'],
            ['Main risk', 'Inflation erodes returns', 'Price volatility', 'Vacancy, maintenance, ageing', 'Illiquidity, title, timeline'],
            ['Suits a horizon of', 'Months to 3 years', 'Any, as a hedge', '5+ years', '5–10 years'],
          ],
        },
      },
      {
        h2: 'What each one is genuinely good at',
        list: {
          items: [
            '**Fixed deposit** — money you might need. An emergency fund, a wedding next year, school fees. Its job is to be there, not to grow. Judging it on returns is judging a seatbelt on comfort.',
            '**Gold** — a hedge that behaves differently from your other holdings. Useful for exactly that reason, and rarely a growth engine.',
            '**An apartment** — income now, at the cost of ongoing work. Tenants, repairs, society dues, vacancy months, and a building that ages whether you attend to it or not.',
            '**Land** — growth on a long horizon, with no income and no depreciating structure. It asks for patience and gives nothing in the meantime.',
          ],
        },
      },
      {
        h2: 'The comparison people actually make: plot or flat?',
        p: [
          'This is the real decision for most buyers, and the honest framing is a trade rather than a winner.',
          'A flat gives you rent from month one and something you can occupy. It also gives you a structure that depreciates, maintenance you cannot defer, a society you must deal with, and vacancy risk between tenants. Your return is a mix of rental yield and appreciation, and in many Indian cities the yield component is thinner than buyers expect.',
          'A plot gives you no income at all. In exchange, you hold the component of real estate that does not decay — the land — with negligible carrying effort, and your entire return sits in appreciation. In a region under construction, that is precisely the component that responds to infrastructure arriving.',
          'So: if you need cash flow, a plot is the wrong instrument. If you are compounding capital over a decade and do not need income from it, a plot removes the parts of property ownership that consume time and money.',
        ],
        callout: {
          tone: 'tip',
          title: 'The allocation question, not the winner question',
          text: 'Most people who do well hold several of these at once, sized to their purpose: an FD for what they might need, gold as a hedge, and land or property for the money they can genuinely leave alone. The useful question is never "which is best" but "how much of each, and for what".',
        },
      },
      {
        h2: 'Where a Dholera plot fits',
        p: [
          'A plot in Dholera is a long-horizon, growth-oriented, illiquid allocation. It suits money you can leave untouched for five to ten years, held by someone who would find a two-year infrastructure delay annoying rather than ruinous.',
          'It does not suit an emergency fund, money earmarked for a near-term commitment, or a buyer who needs monthly income. No amount of enthusiasm about a semiconductor fab changes that, and anyone encouraging you past it is not acting in your interest.',
          'If it does suit you, the things that then decide your outcome are unglamorous: buy NA-converted, NOC-cleared, plan-passed, title-clear land, at a fair price, registered in your own name, in a layout with roads that exist.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is land a better investment than a fixed deposit?',
        a: 'They do different jobs. An FD protects capital and stays liquid; land trades liquidity and income for long-term growth potential. Money you might need belongs in the FD regardless of what land might do.',
      },
      {
        q: 'Plot or flat — which is better for investment?',
        a: 'A flat produces rent but includes a depreciating structure and ongoing maintenance. A plot produces nothing while held but holds the non-depreciating component with minimal effort. If you need income, choose the flat; if you are compounding capital over a decade, the plot removes the costly parts of ownership.',
      },
      {
        q: 'How much of my portfolio should be in land?',
        a: 'That depends on your total assets, income stability and horizon, and it is a question for a financial advisor who can see your whole position. The general principle is that illiquid long-horizon assets should be sized so that you are never forced to sell one at a bad moment.',
      },
      {
        q: 'Does land really not depreciate?',
        a: 'The land itself does not wear out the way a building does — which is why a 30-year-old flat needs significant repair while the land under it does not. That does not mean land cannot fall in value; it means its value is not eroded by physical ageing.',
      },
    ],
    related: ['is-dholera-a-good-investment', 'dholera-plot-price-2026', 'how-to-verify-a-dholera-plot'],
  },
];

export const blogBySlug = (slug) => blogs.find((b) => b.slug === slug);

/** Word count of a post's prose — used for the reading estimate and as a
 *  guard against thin content creeping back in. */
export const wordCount = (post) => {
  const parts = [post.intro];
  post.sections.forEach((s) => {
    if (s.h2) parts.push(s.h2);
    (s.p || []).forEach((x) => parts.push(x));
    (s.list?.items || []).forEach((x) => parts.push(x));
    (s.table?.rows || []).forEach((r) => parts.push(r.join(' ')));
    if (s.callout) parts.push(s.callout.text);
  });
  (post.faqs || []).forEach((f) => parts.push(f.q, f.a));
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
};
