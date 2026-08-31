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
  atomic `UPDATE ... WHERE status='open'` to prevent double-booking, and also rejects
  inactive links, links past `expires_at`, and slots whose time has already passed.
  Public confirmation reads go through `get_booking_confirmation()` — never query
  `interview_bookings` directly from the anon key (that would expose every candidate's PII).
  Slot status values: `open` / `booked` / `blocked`. Link types: `generic` / `single-use`
  (single-use links are burned by setting `is_active = false` after one booking).
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
Private (must stay `noindex`): `/employee-kyc`, `/admin/interviews`,
`/admin/attendance`, `/book/:token`, `/book/confirm/:bookingId`.

## Attendance module

Tables are namespaced `cb_*` because `public.attendance` already exists and
belongs to the SalesAutoCall app (company_id/salesperson_id, live rows) — never
touch that one.

- `cb_employees` — HR-managed roster. The `email` must match the employee's login
  email; that's how punches are linked to a person.
- `cb_attendance` — one row per employee per day (unique constraint), with work
  mode (`office` / `site-visit` / `wfh`), check-in/out timestamps + GPS, optional
  selfie URL and a note.
- Employees have **no direct INSERT/UPDATE** on `cb_attendance`. Punching goes
  through `cb_punch_in()` / `cb_punch_out()`, SECURITY DEFINER RPCs that stamp
  `now()` server-side — so nobody can backdate their own arrival or edit someone
  else's row. `cb_my_employee()` resolves the caller to their roster record.
- Site-visit punches require location; the UI refuses to submit without it.
- HR console `/admin/attendance`: daily register (joined against the roster so
  **absentees are visible**, not just people who punched), map link + selfie
  thumbnail as proof, day stats, CSV export, and roster add/deactivate.
- Employee self-service lives in the Employee Portal's "Attendance" tab.

## Interview slot autopilot

`cb_scheduler_settings` (single row) drives `cb_ensure_interview_slots()`, which
tops up a rolling window of open slots. The interview admin calls it on every
load, so HR never creates slots by hand — manual creation still exists but is
tucked behind "Show manual slot creation". The function is idempotent: it skips
times that already exist, past times, weekends/lunch per settings, and never
touches booked slots.

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

## Interview Scheduler — what HR can do

`/admin/interviews` (admin-only, `noindex`):
- **Stats**: upcoming open slots, today's interviews, selected count, no-show rate,
  active links.
- **Slot generation**: single date or a date range (with weekend skip), configurable
  length (15/20/30/45/60 min), optional lunch-break skip. Re-running is safe —
  existing start times on a date are skipped, so no duplicates.
- **Slot management**: upcoming open slots grouped by day (Today/Tomorrow labels),
  per-slot delete and "clear day". Past slots are hidden.
- **Links**: generic or single-use, optional expiry, with copy / WhatsApp share /
  deactivate and Active / Expired / Inactive status.
- **Candidates**: tabs (Upcoming / Today / Past / All), search by name/email/phone,
  outcome filter, CSV export (includes outcome + notes).
- **Per candidate**: outcome tracking (`scheduled` / `attended` / `no-show` /
  `selected` / `rejected` / `on-hold`), free-text interview notes, one-click
  call / email / WhatsApp, reschedule to another open slot, and cancel.
- **Today's line-up** panel and a printable **Day Sheet** for the interview panel
  (`window.print()`, with blank outcome/notes columns to fill in by hand).

Rescheduling goes through the `reschedule_interview_booking()` RPC — it claims the
new slot atomically, frees the old one, and re-checks the caller is an admin
(SECURITY DEFINER functions run as their owner, so they must verify the caller).

`/book/:token` (public): validates the link (active + not expired), shows only
future open slots, collects name/email/phone, books via the RPC.
`/book/confirm/:bookingId`: reads via `get_booking_confirmation()` RPC, shows
time, office address, map and directions.

## Content rules

- **Never name Mirrikh Infratech's founder on the site.** Credibility claims should
  reference the company ("Mirrikh Infratech — featured in Forbes India") not an
  individual. The name previously appeared in `src/data/site.js` (partnership points)
  and the About page timeline and has been removed from both.
- Jasvinder Singh (Capital Brix Founder & CEO) IS named — that's our own leadership.

## Working alongside Antigravity (or any other AI tool)

Multiple AI tools work on this repo. Each runs in its own isolated container, so
"I committed it locally" in one tool means nothing to the others — only what is
**pushed to GitHub** is real. This has already caused two incidents: a feature
whose frontend was never pushed (the URL 404'd), and duplicated work when two
tools built the same feature at once.

Rules:
1. Always `git fetch` + `git log origin/<branch>` before starting — another tool
   may have pushed since your last look.
2. Push early; never end a session with work only committed locally.
3. Before building a feature someone says exists, verify it's actually on the
   remote branch, not just claimed.
4. If a schema was applied to Supabase by another tool, read the real schema
   (`information_schema`, `pg_policies`) and build against **that**, not against
   what a chat log describes — they drift.

## Conventions

- Run `npx vite build` before pushing — it's the only build check in the repo.
- Content copy lives in `src/data/site.js` (projects, FAQs, stats) and
  `src/data/blogs.js` — edit content there, not in components.
