---
name: dholera-seo
description: SEO, content and conversion work for the Capital Brix Dholera site — adding or optimising a page for search, writing meta/schema, publishing a blog post, keyword targeting, internal linking, or auditing why pages aren't ranking. Use whenever the task mentions SEO, ranking, Google, keywords, organic leads, meta tags, sitemap, schema/structured data, or new marketing content for this site.
---

# Dholera SEO & Content Playbook

How to add or improve search-visible content on the Capital Brix site without
breaking the SEO setup already in place.

## Before you touch anything

1. Read `CLAUDE.md` for business facts (partner wording, founder, live domain).
2. The live domain is `https://www.capitalbrix.co.in`, defined once in
   `src/lib/seo.js` (`SITE_URL`). Never hardcode a domain anywhere else.
3. Copy lives in `src/data/site.js` and `src/data/blogs.js`, not in components.

## Adding a new public page

1. Add a metadata entry to `pageSeo` in `src/lib/seo.js`:
   - **Title**: ≤60 chars, primary keyword first, brand last.
   - **Description**: 140–160 chars, includes the keyword plus a reason to click
     (price, approval status, free site visit).
   - `path` must exactly match the route.
2. Render `<Seo {...pageSeo.<key>} />` as the first child of the page's root element.
3. Add the route to `public/sitemap.xml` with a sensible priority
   (money pages 0.8–1.0, supporting pages 0.6–0.7).
4. Add at least two internal links pointing at the new page from existing pages —
   orphan pages don't rank.
5. Private/internal pages get `<Seo title="..." noIndex />` and a `Disallow` line in
   `public/robots.txt` instead.

## Keyword targeting rules

- **One page = one keyword cluster.** Two pages chasing "dholera plots" cannibalise
  each other; give one the generic term and the other a qualifier
  ("dholera plot price", "residential plots dholera sir").
- Project detail pages own long-tail brand queries
  (`mayur greenz ii dholera price`) — this is where most winnable traffic is, since
  generic "Dholera" is dominated by large portals.
- Buyer-intent modifiers worth targeting: `price`, `NA NOC approved`, `title clear`,
  `near airport`, `expressway`, `investment 2026`, `site visit`, `NRI`.
- Put the target keyword in: `<title>`, H1, first 100 words, one H2, image alt text.
  Do not repeat it more than that — over-optimisation is a demotion signal.

## Structured data

Existing schema — extend, don't duplicate:
- `index.html`: `RealEstateAgent` (with founder + award) and `FAQPage`.
- Homepage: `Person` for the founder (E-E-A-T for money/trust queries).
- Project detail: `Product` + `Offer` per project.

When adding schema, pass it via the `jsonLd` prop on `<Seo>`. Only mark up content
that is actually visible on the page — invisible schema is a manual-action risk.

## Writing content that ranks

- Answer the query in the first paragraph, then expand. Google rewards pages that
  resolve intent above the fold.
- Every claim that sells (price, approvals, timelines) should be specific and true —
  vague copy neither ranks nor converts.
- Target 800+ words for guide/blog pages; thin pages don't compete for "Dholera".
- End every content page with one clear CTA (site visit / WhatsApp / call).

## Conversion (organic traffic is only half the job)

- Keep the WhatsApp float and phone CTA reachable on mobile without scrolling back up.
- Forms should ask for the minimum: name, phone, interest. Every extra field costs leads.
- Trust signals near CTAs: NA/NOC approved, registered sale deed, award, partner status.

## Auditing why something isn't ranking

Work down this list in order:
1. **Canonical/domain mismatch** — canonical must point at the domain actually served.
2. **Indexability** — is the URL in `sitemap.xml`, not blocked in `robots.txt`, not `noIndex`?
3. **Rendering** — this is a client-rendered SPA; crawlers must execute JS to see content.
   If rankings stay flat despite good content, prerendering/SSR for public routes is the
   highest-impact fix.
4. **Content depth** vs. the pages currently ranking for that query.
5. **Internal links** into the page.
6. **Off-page**: Google Business Profile, directory citations, backlinks — these are
   done outside the repo and usually decide competitive queries.

## After any SEO change

- Run `npx vite build` — it's the only build check in the repo.
- Verify the rendered `<head>`: title, description, canonical, robots, og:image.
- Remind the user to resubmit `sitemap.xml` in Google Search Console; indexing of new
  pages typically takes days to weeks, and competitive rankings take months.
