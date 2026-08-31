# Capital Brix — Project Memory

Marketing site + internal employee tooling for **Capital Brix LLP**, built with
Vite + React 19 + Tailwind + Framer Motion, deployed on Vercel, backed by Supabase.

## Business facts (get these right in all copy)

- Capital Brix LLP is the **Official Strategy Partner of Mirrikh Infratech Pvt. Ltd.**
  (Do NOT write "exclusive channel partner" — that wording is retired.)
- Mirrikh Infratech is a Dholera developer with 8+ completed projects since 2012.
- Founder & CEO: **Jasvinder Singh** — recipient of the **Jagran Achievers Award 2026**
  (Almaty, Kazakhstan), awarded for vision, leadership and achievement.
- Office: A-118, 6th Floor, The Diamond, Sector 136, Noida 201304.
- Phone: +91 70489 17300 · Public email: info@capitalbrix.com
- Product: NA-approved, title-clear residential/industrial plots in Dholera SIR
  (Dholera Smart City), Gujarat, sold at direct developer pricing.

## Domains — important

- **Live domain is `https://www.capitalbrix.co.in`** (this is what's attached in Vercel).
- `capitalbrix.com` is NOT attached to the Vercel project. All canonical URLs,
  sitemap entries and JSON-LD previously pointed there, which tells Google to rank
  a domain we don't serve. Fixed — the domain now lives in **one** place:
  `SITE_URL` in `src/lib/seo.js` (and `site.domain` in `src/data/site.js`).
  If the primary domain ever changes, change it there and regenerate `public/sitemap.xml`.

## Infrastructure

- **Vercel project**: `cap` (team `fadoomotivation-pixels-projects`), auto-deploys
  `main` → production. Feature branches get preview deployments.
- **Supabase project**: `SalesAutoCall`, ref `rqgkzamuohdvttnkluzn` (ap-south-1).
  Client config is in `src/lib/supabase.js`.
- Repo: `fadoomotivation-pixel/cap`. Work happens on feature branches → PR into `main`.

## Supabase schema in use

- `employee_kyc` — employee KYC records (photo_url, pan_url, aadhaar_url, marksheet_url).
  RLS: employees see only their own row; admins (by email) can read all.
- `interview_slots` / `interview_links` / `interview_bookings` — interview scheduler.
  Booking goes through the `book_interview_slot()` SECURITY DEFINER RPC, which does an
  atomic `UPDATE ... WHERE status='open'` to prevent double-booking. Public confirmation
  reads go through `get_booking_confirmation()` — never query `interview_bookings`
  directly from the anon key (that would expose every candidate's PII).
- Storage bucket `employee-photos` (public read; authenticated insert).

### Admin emails — single source of truth

`src/lib/admin.js` exports `ADMIN_EMAILS` / `isAdminEmail`. Currently:
`admin@capitalbrix.co.in`, `ujjwal@capitalbrix.co.in`, `disha@capitalbrix.com`.

**Never hardcode a second copy of this list in a component.** The same list is also
enforced in Postgres RLS policies (`auth.jwt() ->> 'email' in (...)`) on
`employee_kyc`, `interview_slots`, `interview_links`, `interview_bookings` — so
adding an admin means updating **both** `src/lib/admin.js` and those policies.

Auth note: Supabase "Confirm email" is OFF. Users created manually via SQL must have
the token columns (`confirmation_token`, `recovery_token`, `email_change_token_new`,
`email_change`, …) set to `''`, not NULL, or login fails with
"Database error querying schema".

## Routes

Public: `/`, `/about`, `/projects`, `/projects/:id`, `/dholera`, `/dholera/*`,
`/blog`, `/events`, `/contact`.
Private (must stay `noindex`): `/employee-kyc`, `/admin/interviews`, `/book/:token`,
`/book/confirm/:bookingId`.

## SEO conventions

- Every public page renders `<Seo {...pageSeo.<key>} />` (`src/components/Seo.jsx`);
  page metadata lives in `src/lib/seo.js`. Private pages use `noIndex`.
- Each page targets **one** keyword cluster — don't let two pages chase the same query.
- `public/sitemap.xml` lists all public routes including the 22 project detail pages;
  regenerate it when projects are added. `public/robots.txt` disallows private routes.
- Structured data: `RealEstateAgent` + `FAQPage` in `index.html`, `Person` (founder,
  with award) on the homepage, `Product` per project detail page.
- Known limitation: this is a client-rendered SPA, so crawlers depend on JS rendering.
  The highest-impact next SEO step is prerendering/SSR for public routes.

## Conventions

- Run `npx vite build` before pushing — it's the only build check in the repo.
- Content copy lives in `src/data/site.js` (projects, FAQs, stats) and
  `src/data/blogs.js` — edit content there, not in components.
