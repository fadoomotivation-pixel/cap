# SEO launch checklist — the parts that live outside this repo

Everything technical on the site is done: 41 public routes ship as real HTML,
each page has one correct canonical, the blog is original, and leads are
captured. What is left cannot be done from the codebase — it needs sign-in to
Google with the Capital Brix account. This file is written so each step is
copy-paste rather than research.

Work top to bottom. Steps 1–2 take about 30 minutes. Step 3 is the one that
actually decides competitive Dholera rankings, and it is ongoing.

---

## 1. Google Search Console — submit the site

**Why:** Google will find the site eventually. Search Console makes it days
instead of weeks, and it is the only place that tells you *why* a page is not
ranking.

1. Go to <https://search.google.com/search-console> and sign in with the
   Capital Brix Google account (the same one that will own the Business
   Profile — do not use a personal account).
2. **Add property → Domain** → enter `capitalbrix.co.in`.
   - Domain (not URL-prefix) covers `www`, non-`www`, http and https in one
     property. Verification is a **TXT record**, added wherever the domain's
     DNS lives — the registrar, or Vercel if the nameservers point there.
   - Google gives you a string like `google-site-verification=abc123…`.
     Add a TXT record on the root (`@`) with that value, then click Verify.
     DNS can take a few minutes to propagate; if it fails, wait and retry.
3. **Sitemaps → Add a new sitemap** → enter `sitemap.xml` → Submit.
   The full URL is <https://www.capitalbrix.co.in/sitemap.xml> and it lists
   all 41 public URLs with a `lastmod` date.
4. **URL Inspection** — paste each of these and click *Request indexing*.
   Do the money pages first; Google rate-limits manual requests to roughly
   ten a day, so spread them over a few days:

   ```
   https://www.capitalbrix.co.in/
   https://www.capitalbrix.co.in/blog/dholera-plot-price-2026
   https://www.capitalbrix.co.in/blog/is-dholera-a-good-investment
   https://www.capitalbrix.co.in/blog/how-to-verify-a-dholera-plot
   https://www.capitalbrix.co.in/projects
   https://www.capitalbrix.co.in/dholera
   https://www.capitalbrix.co.in/blog/tata-semiconductor-plant-dholera
   https://www.capitalbrix.co.in/blog/dholera-international-airport
   ```

5. Also add **Bing Webmaster Tools** (<https://www.bing.com/webmasters>) — it
   imports directly from Search Console in two clicks, and Bing feeds
   ChatGPT and Copilot search results.

**What to expect:** indexing in days to a couple of weeks. Rankings for
competitive terms like "Dholera plots" take months and depend on step 3.
Check *Pages* → *Why pages aren't indexed* weekly for the first month.

---

## 2. Google Business Profile — the local entity

**Why:** for a Noida office selling Gujarat land, the Business Profile is what
puts you in Maps, in the local pack, and in the knowledge panel. It is also
the single strongest signal that Capital Brix is a real business rather than
a landing page.

Create it at <https://business.google.com>. Everything below is ready to paste.

### Core fields

| Field | Value |
|---|---|
| Business name | `Capital Brix` |
| Primary category | `Real estate agency` |
| Additional categories | `Property investment company`, `Land surveyor` *(pick what Google offers — do not force a bad fit)* |
| Address | `A-118, 6th Floor, The Diamond, Sector 136, Noida, Uttar Pradesh 201304` |
| Phone | `+91 70489 17300` |
| Website | `https://www.capitalbrix.co.in` |
| Service area | `Dholera, Gujarat` and `Noida, Uttar Pradesh` |

> **NAP consistency matters more than people think.** Name, Address and Phone
> must be byte-identical here, on the site, and on every directory in step 3.
> "A-118, 6th Floor" and "A 118 6th Floor" count as two different businesses
> to an aggregator.

### Description (750 char limit — this fits)

```
Capital Brix LLP is the Official Strategy Partner of Mirrikh Infratech Pvt.
Ltd., a Dholera developer with 8+ completed projects since 2012. We sell
NA-approved, NOC-cleared, title-clear and plan-passed residential and
industrial plots in Dholera SIR (Dholera Smart City), Gujarat, at direct
developer pricing from Rs 7,250 per sq yd — no intermediary margin.

Every purchase completes through a registered sale deed in the buyer's name,
with the NA order, plan approval and title chain handed over as part of the
process rather than chased afterwards. Our Noida office supports buyers and
NRIs end to end, from documentation to site visits.

Founder & CEO Jasvinder Singh received the Jagran Achievers Award 2026 at
Almaty, Kazakhstan.
```

### Services to add

```
Dholera residential plots
Dholera industrial plots
NA-approved plot sales
Title verification support
Registered sale deed assistance
NRI property purchase support
Dholera site visits
Investment consultation
```

### Photos to upload (minimum 10 — profiles with photos get materially more calls)

- Office exterior and interior at Sector 136
- Team photo
- The Jagran Achievers Award photo (already in the repo:
  `public/award-jasvinder-singh-jagran-achievers-2026.jpg`)
- Site visit photographs from Dholera projects
- Plot layout / masterplan images
- Logo (`public/logo-capital-brix.png`) as the profile picture

### Q&A — seed these yourself, then answer them

Google lets the owner post questions. Do it: an unanswered profile looks
abandoned, and these answers show in search.

1. *Are Capital Brix plots in Dholera NA approved and title clear?*
   → Yes. We sell only NA-converted, NOC-cleared, title-clear and plan-passed
   plots, completed through a registered sale deed in the buyer's name.
2. *What is the starting price of a plot in Dholera?*
   → Residential plots start from ₹7,250 per sq yd at direct developer
   pricing. A 150 sq yd plot works out to roughly ₹10–12 lakh on land value.
3. *Can NRIs buy a plot in Dholera through Capital Brix?*
   → Yes. NRIs may acquire residential and commercial property in India, and
   we support the process remotely from our Noida office.
4. *Do you arrange site visits?*
   → Yes, free. Dholera is about an hour from Ahmedabad on the expressway, so
   a visit fits in a morning.

### After it goes live

- **Ask every closed buyer for a review**, by name, with a direct link.
  Reviews are the heaviest local ranking factor there is.
- **Reply to every review**, good or bad, within a day or two.
- **Post weekly** — a project update, a site visit photo, a blog post link.
  A profile that posts outranks an identical one that does not.

---

## 3. Citations and backlinks — what actually decides competitive rankings

**Why:** the site is now technically correct and the content is original.
Beyond that, Google ranks on external signals. Nothing in this repo can move
them.

### Directory citations (free, do these first)

Same NAP as step 2, exactly, on each:

- Justdial
- IndiaMART
- Sulekha
- 99acres — business listing
- MagicBricks — agent profile
- Housing.com — agent profile
- CommonFloor
- India Business Directory (indiacom / tradeindia)
- Google Maps (via the Business Profile above)
- Bing Places
- Apple Business Connect
- Facebook Page — the address filled in on the existing page
- LinkedIn Company Page — the address filled in on the existing page

### Content-led links (slower, worth far more)

The 8 blog guides exist partly to earn these:

- **Local press and property portals.** The plot-price and legal-verification
  guides are genuinely citable; pitch them to Gujarat and Noida property
  publications rather than asking for a generic link.
- **Dholera investor communities.** Answer questions on Quora, Reddit and
  property forums honestly and link only where the guide actually answers the
  question. Drive-by link dropping gets removed and can hurt.
- **The Jagran Achievers Award.** Any coverage of the award is a natural,
  high-trust link. Chase the outlets that covered it.
- **Mirrikh Infratech.** As their Official Strategy Partner, a link from their
  site to ours is legitimate and easy to ask for.

### Social profiles — done in the repo, needs finishing on the platforms

The site now links Capital Brix's own accounts, and declares them as `sameAs`
in the organisation schema so Google can tie the profiles, the website and the
Business Profile to one entity:

```
https://www.youtube.com/@capitalbrixllp
https://www.instagram.com/capitalbrix
https://www.linkedin.com/company/capitalbrixofficial/
https://www.facebook.com/CapitalBrixOfficial/
```

Two things to do on the platforms themselves, because `sameAs` only works when
the link points back:

1. **Put `https://www.capitalbrix.co.in` in the website field of every profile.**
   Google confirms an entity by checking the link in both directions.
2. **Use the same name, logo and description across all four** — the Business
   Profile description in this document works for all of them.

There is no X / Twitter handle, so the X icon was removed rather than left
pointing at someone else's account. If one is created, add it to
`site.socials` in `src/data/site.js` and to `sameAs` in `index.html`.

---

## Measuring whether any of this worked

- **Search Console → Performance**: impressions first, clicks later.
  Impressions rising with flat clicks means you are ranking on page 2–3.
- **`/admin/leads` → "Which page brings the leads"**: the honest scoreboard.
  Whichever guide is at the top of that list is the kind to write more of.
- **Business Profile → Insights**: calls, direction requests, website clicks.

Do not judge any of it before six to eight weeks. Land buyers research for
months, and so does Google.
