# Task for Antigravity — Dholera virtual tour + official-source content

**Repo:** `fadoomotivation-pixel/cap` · **Base:** `main` (current)
**Branch to create:** `antigravity/dholera-virtual-tour`
**Deliverable:** one new PR into `main`, plus the report at the bottom of this file.

---

## Why this is being handed to you

I (Claude) could not do it. Both of these are blocked by my network egress policy —
not rate-limited, not slow, hard-blocked at the proxy:

- `https://dholera.gujarat.gov.in/` — official Dholera SIR site
- `https://dholera.gujarat.gov.in/dholera_virtual_tours/static/src/DholeraSIR/index.htm` — official 360° virtual tour

You can reach them. **That is the only reason this is yours.** Everything below is
the working standard for this repo; it is not optional because the task came to you
second-hand.

I will review your PR. Write it so a reviewer who cannot open those URLs can still
tell whether you got it right — that means reporting what you actually saw, with
numbers and headers quoted, not summarised.

---

## Hard constraints — breaking any of these fails the PR

These are in `CLAUDE.md`. They are load-bearing and each one is there because it
already broke once.

1. **Never copy text or images from another site into this repo.** Not from
   mirrikh.com, and not from the government site either. Facts and figures are
   free to state; sentences are not. Rewrite everything in our own words.
   Cover art is generated in `src/components/BlogArt.jsx` — do not hotlink
   images from anyone's server. The homepage once rendered seven empty boxes
   because of exactly this.

2. **Never invent a number.** This site sells land. A wrong figure about a
   government master plan on a page selling plots is a real-world harm, not a
   typo. If the official site does not state it, it does not go on the page.

3. **A new public route must be added to `public/sitemap.xml` or it will not
   exist.** `npm run build` runs `scripts/prerender.mjs`, which takes its route
   list from the sitemap. Not in the sitemap → not prerendered → ships as an
   empty shell to any crawler that does not run JS.

4. **One keyword cluster per page.** Two pages chasing the same query means
   neither ranks. Existing clusters are already claimed — see the table below.
   Your new page must target something none of them do.

5. **Do not add a tag to `index.html` that `Seo.jsx` also emits** unless you
   mark it `data-static-seo`. `Seo.jsx` strips `[data-static-seo]` on mount;
   without the marker every route serves two canonicals and Google is told not
   to rank any of them. This has happened before.

6. **The domain lives in one place** — `SITE_URL` in `src/lib/seo.js`. Never
   hardcode `capitalbrix.com` or `capitalbrix.co.in` anywhere else.
   `capitalbrix.com` is **not** the live domain.

7. **Run `npm run build` before pushing.** It is the only build check in the
   repo, and a route that fails to prerender fails the build rather than
   shipping blank.

---

## Task A — the virtual tour

### A1. First, find out whether it can be embedded at all. Do not skip this.

This is the whole decision and I could not make it. Check the **response headers**
of the tour URL:

```
curl -sSI "https://dholera.gujarat.gov.in/dholera_virtual_tours/static/src/DholeraSIR/index.htm"
```

You are looking for exactly two things:

- `X-Frame-Options:` — `DENY` or `SAMEORIGIN` means **we cannot frame it**
- `Content-Security-Policy:` containing `frame-ancestors` — if present, does it
  permit `capitalbrix.co.in`?

Then **actually load it in an iframe in a browser and look at the console.**
Headers can be absent and the page can still break inside a frame — a 360° tour
is usually a panorama viewer (krpano / Pannellum / Marzipano) and those can rely
on WebGL, device orientation, or fullscreen permissions that need explicit
`allow` attributes. A tour that renders a black rectangle is worse than no tour.

Note also whether it is served over **HTTPS with a valid certificate**. Our site is
HTTPS; framing an HTTP page will be blocked as mixed content and you will get a
blank box with a console error and nothing else.

### A2. Then build for whichever answer you got

**If framing is permitted and it renders:**

- Embed it responsively — a fixed-height iframe is unusable on a phone, and this
  will mostly be opened on a phone. Aspect-ratio box, `width: 100%`.
- `loading="lazy"` — the tour is heavy and must not block our LCP. Our Core Web
  Vitals are the point of the prerendering work; do not spend them here.
- Give the `<iframe>` a real `title` (screen readers announce it) and
  `allowfullscreen`. Add `allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"`
  if the viewer needs motion controls.
- **Add a load-failure fallback anyway.** Government servers change. If the frame
  does not load, the visitor must still see the "open the official tour" link
  rather than a blank rectangle. Do this with an `onLoad` flag and a timeout, not
  by assuming it works.
- Below the frame, always a visible **"Open the official tour in a new tab"**
  link (`target="_blank" rel="noopener noreferrer"`).

**If framing is blocked:**

- **Do not ship a broken iframe.** Build a proper preview card that links out.
- Use generated art (`BlogArt.jsx` pattern) or an SVG you author — **not** a
  screenshot of the government tour, and not a hotlinked image.
- Make the card genuinely useful: say what the tour shows, that it is the
  Government of Gujarat's own, and what to look for in it.

**Either way — attribution is not optional.** Label it plainly as the
**official Government of Gujarat / DICDL virtual tour**, with a link to the
source. We are presenting a public government resource, not our own content, and
the page must never read as though we built it or as though we are the authority.

### A3. Where it goes

New route: **`/dholera/virtual-tour`**

- Add to `src/data/dholera.js` following the existing shape:
  `{ slug, tone, keyword, title, seoTitle, h1, excerpt, intro, sections: [{ h2, p: [], table: { head, rows }, callout: {} }], faqs, related }`
- If the page needs a component the data shape cannot express (the embed), render
  it in `src/pages/DholeraInnerPage.jsx` keyed off the slug, rather than putting
  JSX into the data file. Content stays data, layout stays component — that
  separation is deliberate.
- Add `/dholera/virtual-tour` to `public/sitemap.xml` (see constraint 3).
- Add a `pageSeo` entry in `src/lib/seo.js`.
- Link it from the `/dholera` hub, and cross-link from the other four Dholera
  pages via `related`. An orphan page with no internal links does not get crawled
  properly.

---

## Task B — information the official site has that we do not

### The sourcing rule

For each fact you add: **it must appear on `dholera.gujarat.gov.in`, and you must
record where.** In your PR report, list every figure as:

```
figure  |  exact wording on the official page  |  the page URL  |  date you accessed it
```

If it is not on the official site, it does not go in. No filling gaps from a
news article, a YouTube video, another broker's website, or memory.

### What to look for

Our four existing pages already cover the ground below. Read them first
(`src/data/dholera.js`) so you add what is **missing** rather than restating what
is there — restating creates the duplicate-content problem these pages were
rebuilt to fix.

Specifically worth checking on the official site:

- Town Planning (TP) scheme status and numbers — how many notified, which ones
- Activation Area — exact size, current status, what is complete inside it
- Phase-wise development plan and the area under each phase
- Land-use breakdown of the master plan (residential / industrial / commercial /
  knowledge / recreation percentages)
- The ABCD building and city command-and-control centre
- Water supply, desalination, sewage and drainage capacity figures
- Power supply and the solar park capacity
- Road network — lengths built vs planned inside the activation area
- Official investor / allotment procedure, and which authority does what
  (DICDL vs DSIRDA — get this right, they are different bodies)
- Any official notification dates or gazette references

### Conflicts

Our pages already state: **≈920 sq km planned area**, **109 km Ahmedabad–Dholera
Expressway**, **≈₹91,000 crore Tata semiconductor fab**, **airport at Navagam**.

If the official site states something different — **do not silently change our
page and do not silently keep ours.** Flag it in the PR with both figures and
both sources, and let it be decided. A quiet edit to a headline number is the
kind of change nobody notices until a customer does.

---

## Task C — UI/UX

The `/dholera` hub (`src/pages/Dholera.jsx`) is 49 lines and thin: a heading, a
subheading, and four cards in a white box. It is the entry point to our strongest
content cluster and it does not link to any of it.

- Make the hub actually route people: cards linking to all five sub-pages with
  real excerpts, not four static paragraphs that dead-end.
- Mobile first. Most traffic is a phone; check at 360px, 390px and 768px, not
  just a desktop window.
- Match the existing design language — do not introduce a new palette. Gold is
  `#D4AF37` for fills; **on white use `#9C7C1C`**, because `#D4AF37` on white is
  about 2:1 contrast and fails WCAG. Gold-filled buttons take dark `#0A1016`
  text.
- Eyebrow labels are `<p>`. The visible headline is the `<h2>`. Getting this
  backwards previously made Google read "Portfolio" as a section heading.
- One `<h1>` per page.

---

## Task D — SEO

**On-page (yours, in this PR):**

- `BreadcrumbList` schema on the new page — the other Dholera pages already have it.
- `FAQPage` schema, with the FAQs actually rendered in the HTML. Schema for
  content that is not on the page is a manual-action risk, not a shortcut.
- If you ship an embedded tour, consider `VideoObject` — **only if** it genuinely
  fits. Do not mark up a panorama as a video to farm a rich result.
- Unique `title` and `meta description` in `pageSeo`. Do not reuse another page's.
- Internal links both ways: hub → page, page → related pages, and from at least
  one relevant blog guide.
- Outbound `rel="noopener"` links to the official government pages you cite.
  Citing a `.gov.in` source is good for E-E-A-T; hiding it is not.
- Verify after building: `dist/dholera/virtual-tour/index.html` must contain the
  real text, exactly one `<title>`, exactly one canonical, and the canonical must
  be the page's own URL — not `/`.

**Off-repo (do not do — report it):**

List what needs doing in Google Search Console or elsewhere that you cannot do
from the repo: sitemap resubmission, URL inspection / indexing requests, any
redirect that needs adding, anything in `docs/SEO_LAUNCH.md` this affects. The
owner will action it.

---

## How to work — this is the part that matters

**Verify, do not assume.** Every claim in your PR description should be something
you observed. "The iframe works" is not a finding; "loaded at 390px in Chrome,
tour rendered, console clean, 2.1s to interactive" is. I have shipped bugs in
this repo by checking with a string search instead of a browser, and the browser
proved me wrong — do not repeat that.

**Report honestly, including what went wrong.** If the tour cannot be embedded,
say so plainly and ship the fallback; that is a successful outcome, not a
failure. If you could not find a figure, say you could not find it. Do not round
a gap into a claim.

**Comments explain why, not what.** The codebase convention is that a comment
justifies a decision that would otherwise look arbitrary — read the header of
`src/data/dholera.js` for the register. Do not narrate the code.

**Do not "clean up" things you did not come to change.** Load-bearing items that
look wrong but are not: the `data-static-seo` strip in `Seo.jsx`; the head-tag
peeling in `scripts/prerender.mjs` (React 19 hoists `<title>`/`<meta>`/`<link>` to
the front of the `renderToString` output); `dist/app.html` as the SPA fallback;
the `/dholera/airport` → blog 301 in `vercel.json`, which exists so two pages do
not compete for one query. Leave all of it alone.

**Push early.** Every AI tool on this repo runs in its own container. "I committed
it locally" means nothing to anyone else — only what is pushed to GitHub is real.
This has already caused a feature whose frontend never shipped and a URL that
404'd.

---

## Report back with this

Put it in the PR description:

1. **Framing verdict** — the exact `X-Frame-Options` and `Content-Security-Policy`
   headers you got, quoted, and which branch of A2 you took as a result.
2. **Browser evidence** — viewport sizes tested, whether the tour rendered,
   console output, and what happens when the frame fails.
3. **The sourcing table** from Task B — every figure with its official URL and
   access date.
4. **Conflicts** — any official figure that disagrees with what our pages already
   say, both values, both sources, unresolved.
5. **Build output** — `npm run build`, and confirmation that the prerendered
   `/dholera/virtual-tour` HTML has real text, one title, one correct canonical.
6. **Off-repo SEO list** — what the owner needs to do in Search Console.
7. **Anything you chose not to do, and why.**
