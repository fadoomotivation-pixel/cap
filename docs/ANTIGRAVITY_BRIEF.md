# Brief for Antigravity — project images, without undoing the SEO work

Read this fully before touching anything. The last two days were spent fixing
the reasons this site could not rank, and several of those fixes look like
things worth "cleaning up" if you don't know why they're there.

---

## Part 1 — What changed in the last two days

All of it is on branch `claude/supabase-email-confirmation-scxq4a`, in PR #14.
`git fetch` and read the branch before you start — only what is pushed is real.

### The blog was 252 pages copied from mirrikh.com

`src/data/blogs.js` held 252 entries whose titles and excerpts were copied
verbatim from mirrikh.com, with 243 images hotlinked from their server. None
had a body or a URL — "Read More" was a `<button>` that did nothing — so the
whole blog was one page of truncated excerpts, which reads to a crawler as a
scraped doorway page and is a risk to the entire domain, not just `/blog`.

All 252 are gone. In their place are **8 original long-form guides**, each at
its own `/blog/<slug>` with `BlogPosting` + `BreadcrumbList` + `FAQPage`
schema, rendered FAQs and internal links.

### Every page served two canonicals, and the first said `/`

Not just blog — homepage, projects, everything. That tells Google the canonical
version of every page is the homepage, which alone is enough to stop the site
ranking. Cause: `index.html` carries fallback SEO tags, and on React 19
`react-helmet-async` renders its tags and lets React hoist them rather than
replacing the existing ones.

Fix: the fallbacks are marked `data-static-seo`, and `src/components/Seo.jsx`
strips them on mount.

### Three forms were throwing every lead away

`ContactForm` called `preventDefault()` and nothing else. The project enquiry
form had no `onSubmit` at all. Every enquiry the site ever received was
discarded. Leads now go to the `cb_leads` table (anon INSERT only, admin-only
SELECT) via `src/lib/leads.js`, and HR works them at `/admin/leads`.

### Public routes are prerendered at build time

This is a client-rendered SPA, so every URL used to serve a near-empty
`<div id="root">`. `npm run build` now runs `vite build` **and then**
`scripts/prerender.mjs`, which renders all 41 public routes to real HTML.
A blog post that shipped 0 words of markup now ships ~1,500.

### The five `/dholera/*` pages were the same placeholder

All five rendered one shared paragraph over hotlinked mirrikh.com banners —
five near-identical ~215-word URLs in the sitemap. Each now has 830–1,010 words
of its own from `src/data/dholera.js`. `/dholera/airport` is retired and 301s
to the blog guide that owns that query.

### Project pages, heading semantics, homepage

22 project pages went from ~220 near-identical words to real content composed
in `src/lib/projectContent.js`. Eyebrow labels were marked `<h2>` while the
real headline was an `<h3>`, so Google read "Portfolio" as the section heading —
now corrected. The homepage H1 carries its keyword. Social links point at
Capital Brix's own accounts instead of Mirrikh's, and are declared as `sameAs`.

The homepage project cards were rebuilt: they used to render a **logo hotlinked
from mirrikh.com** in a 4:3 white box, so the biggest commercial section on the
page was seven empty rectangles. They now show generated art with the project
name, a status badge, location, plot sizes and pricing.

---

## Part 2 — Your task: real project photographs

The cards look good but the imagery is generated SVG. Real photographs would be
better. That is the job.

### Before you start: get permission, in writing

Capital Brix is the **Official Strategy Partner** of Mirrikh Infratech and sells
their projects, so using their project photography is a normal partner activity
— but confirm it with Mirrikh first and keep the confirmation. Ask specifically
for the **original high-resolution files**; asking is faster than scraping and
gives you better source material than a resized web copy.

If they send files, skip straight to "How to add them". Only fall back to
collecting from their public site if they tell you to.

### The rule that matters: host the files yourself

The previous code pointed `<img src>` at `mirrikh.com`. Never do that. It:

- breaks the moment they rename a folder or add hotlink protection — which is
  exactly why the homepage rendered seven empty boxes;
- serves our visitors off their bandwidth;
- tells a crawler the asset belongs to them, not us.

Download, optimise, commit to this repo, serve from our own domain.

### How to add them

1. Save each photo to `public/projects/<slug>.webp`, where `<slug>` is the
   project name lowercased with hyphens — the same slug as the
   `/projects/<slug>` URL. For example `public/projects/mayur-nova.webp`.
2. Add one line to that project in `src/data/site.js`:
   ```js
   image: '/projects/mayur-nova.webp',
   ```
3. That's it. `src/components/Projects.jsx` already picks it up and falls back
   to generated art when `image` is absent. **You should not need to edit any
   component for this task.** See `public/projects/README.md`.

### Image requirements

| | |
|---|---|
| Format | WebP |
| Aspect | 4:3 (cards use `aspect-[4/3]`) |
| Size | ~1600×1200, **under 200 KB** each |
| Naming | `<project-slug>.webp`, lowercase, hyphens |

Page weight is a ranking factor. A 2 MB JPEG dropped in unoptimised will cost
more in Core Web Vitals than the photo gains in appeal.

**Prefer site photographs over logos.** A logo in a 4:3 box is what made the
old cards look empty. A photo of the land, the layout, the entrance gate or
the roads is worth far more to a buyer than a wordmark.

### Alt text

The card generates alt text from project data automatically. If you add images
anywhere else, write alt text that describes **what is in the photograph**, not
a keyword string:

- Good: `Internal roads and plot demarcation at Mayur NOVA, Ratanpur`
- Bad: `dholera plots buy plot in dholera cheap plots dholera smart city`

Keyword-stuffed alt text is an over-optimisation signal and can hurt.

---

## Part 3 — Do NOT touch these. Each one is load-bearing.

If any of these seems wrong, ask before changing it. Every one was a bug that
took real work to find.

1. **`data-static-seo` in `index.html` and the `useEffect` in `Seo.jsx`.**
   Deleting either brings back two canonicals on every page. The `<!-- -->`
   comment above them explains the mechanism.

2. **`scripts/prerender.mjs` and the `build` script in `package.json`.**
   `"build": "vite build && node scripts/prerender.mjs"`. If you change the
   build command to just `vite build`, every public page ships empty again.

3. **Routes come from `public/sitemap.xml`.** That is deliberate: the
   prerendered set can never drift from the indexed set. **If you add a public
   route, add it to `sitemap.xml` or it will not be prerendered.**

4. **`dist/app.html`.** `vercel.json` rewrites unmatched URLs there, not to
   `index.html`. `index.html` is now the prerendered homepage, so pointing the
   fallback at it would make `/admin/*` hydrate against homepage markup.

5. **The 301 in `vercel.json`** for `/dholera/airport` → the blog guide. Do not
   recreate a `/dholera/airport` page; it would cannibalise the guide.

6. **`src/data/blogs.js` and `src/data/dholera.js` are original content.**
   Never paste text from mirrikh.com or anywhere else into this repo. Duplicate
   content competes with the source and loses. Images with permission are fine;
   text is not.

7. **No shared prose block across the 22 project pages.** An earlier attempt
   added the same "how to verify a plot" paragraphs to all 22 — word count went
   up and the pages stayed 90% identical, which is duplicate content wearing a
   longer coat. `src/lib/projectContent.js` links the guides instead. The
   comment in that file says so.

8. **Eyebrow labels are `<p>`, headlines are `<h2>`.** Do not swap them back.

9. **`src/lib/seo.js` holds the domain once** (`SITE_URL`). Never hardcode a
   domain anywhere else. It must stay `https://www.capitalbrix.co.in` — the
   domain actually attached in Vercel.

10. **Social links live once in `site.socials`** and are mirrored in the
    `sameAs` block in `index.html`. They are Capital Brix's own accounts. Do
    not point them at Mirrikh's again.

---

## Part 4 — Before you push

```bash
npm run build     # must end with "prerender: 41 routes written"
```

Then confirm you have not regressed the two things most easily broken:

```bash
# exactly 1 of each, and the canonical must match the route
grep -c 'rel="canonical"' dist/blog/dholera-plot-price-2026/index.html   # 1
grep -o 'rel="canonical" href="[^"]*"' dist/index.html                   # the homepage URL

# a prerendered page must contain real content, not an empty div
wc -c dist/blog/dholera-plot-price-2026/index.html                       # ~60 KB, not ~8 KB
```

Push to `claude/supabase-email-confirmation-scxq4a`. Do not open a second PR
from that branch — PR #14 already tracks it. Push early; work that only exists
in your container does not exist.

If you disagree with anything in Part 3, say so in the PR rather than changing
it quietly. Two tools silently undoing each other is how this repo lost a
feature once already.
