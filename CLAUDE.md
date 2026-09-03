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

The petty-cash tables instead call the `cb_is_admin()` SQL function, which holds
the list once. New admin-only objects should use it; the older inline policies
above are still the reason an admin change means editing more than one place.

Auth note: Supabase "Confirm email" is OFF. Users created manually via SQL must have
the token columns (`confirmation_token`, `recovery_token`, `email_change_token_new`,
`email_change`, …) set to `''`, not NULL, or login fails with
"Database error querying schema".

## Routes

Public: `/`, `/about`, `/projects`, `/projects/:id`, `/dholera`, `/dholera/*`,
`/blog`, `/events`, `/contact`.
Public: also `/blog/:slug` (8 original guides — see below).
Private (must stay `noindex`): `/employee-kyc`, `/admin/interviews`,
`/admin/attendance`, `/admin/expenses`, `/admin/leads`, `/book/:token`,
`/book/confirm/:bookingId`.

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
- `cb_hr_settings` (single row) holds shift timing, late grace, office geofence
  (lat/lng + radius) and the founder's WhatsApp number.
- `cb_daily_attendance(date)` and `cb_monthly_attendance(month)` are admin-only
  SECURITY DEFINER RPCs that join the roster with attendance and compute late /
  geofence flags **server-side**, so the register, CSV and WhatsApp summary can
  never disagree with each other.
- HR marks approved absences via `cb_attendance.hr_status`
  (`leave` / `holiday` / `half-day` / `wfh-approved` / `on-duty`), so "Absent"
  in the register means genuinely unaccounted for.
- HR console `/admin/attendance` has four tabs: Daily Register (with absentees
  visible, late flags, geofence flags, map + selfie proof, CSV), Employees
  (roster + login creation), Monthly Report, and Settings.
- Employee self-service lives in the Employee Portal's "Attendance" tab.

### HR creates employee logins

Creating an auth user needs the service-role key, which must never reach the
browser. So it runs in the **`create-employee-login` Edge Function**: it verifies
the caller's JWT belongs to an admin email, then uses the service role to create
the user with `email_confirm: true` and a readable temp password, and links
`user_id` back onto the `cb_employees` row. If the account already exists it
resets the password instead. HR hands the credentials over via a copy button or
a prefilled WhatsApp message. Never move this into client code.

### Daily report to the founder

`src/lib/attendanceReport.js` builds a plain-text WhatsApp summary (headline
numbers, then only rows needing a decision: absent, late, site visits, geofence
flags). The HR console renders it with a one-tap `wa.me` link to the founder's
number from settings. There is no server-side scheduler — HR taps Send.

## Petty cash / office expenses

`/admin/expenses` — admin-only, `noindex`. Built on the **imprest (float) model**,
because a plain expense list can never be proved right: the office hands HR cash,
every spend draws it down, and cash in hand must equal what is physically in the tin.

- `cb_expense_categories` — seeded with what this office actually buys (milk,
  pantry, water, housekeeping, courier, cab…), each with an optional
  `monthly_budget`. The monthly report goes red when a budget is crossed.
- `cb_expense_topups` — cash handed to HR. **Only `source='cash'` adds to cash in
  hand**; a bank or UPI float does not put notes in the tin.
- `cb_expenses` — the ledger. `payment_mode` is `cash` / `upi` / `card` / `bank` /
  **`credit`**. Credit is how milk actually works: taken daily, settled at month
  end — so it sits under "unpaid dues" and only draws down cash on the day it is
  marked paid, and only if it was paid in cash. A `before` trigger
  (`cb_expenses_normalise`) keeps the settlement columns consistent so callers
  never have to remember that rule.
- `cb_expense_recurring` — daily/weekly/monthly items. `cb_recurring_due(date)`
  returns them with an `already_logged` flag, which is what makes the Daily Entry
  tab's one-tap buttons safe: an item disappears once entered, so nothing is
  double-counted or forgotten.
- `cb_cash_counts` — physical counts. `variance` is a generated column
  (counted − expected), and a non-zero one raises a banner across every tab.
- `cb_cash_position()` and `cb_expense_month(month)` are admin-only SECURITY
  DEFINER RPCs, so the on-screen figures, the CSV and the WhatsApp summary are
  computed from one place and cannot disagree.
- Bills live in the **private** `expense-bills` bucket (unlike `employee-photos`,
  which is public) — they carry amounts and vendor names, so the console opens
  them through short-lived signed URLs.
- `src/lib/expenses.js` builds the founder's WhatsApp money summary, same pattern
  as `attendanceReport.js`: headline numbers, then only the lines needing a
  decision (over budget, unpaid dues, a cash count that did not tally).
- An entry typed days after the spend is tagged "entered Nd later" in the table —
  not blocked, since late entry is legitimate, but visible.

Employees have **no access at all** to these tables — RLS is admin-only on every
one of them, including read.

## Interview slot autopilot

`cb_scheduler_settings` (single row) drives `cb_ensure_interview_slots()`, which
tops up a rolling window of open slots. The interview admin calls it on every
load, so HR never creates slots by hand — manual creation still exists but is
tucked behind "Show manual slot creation". The function is idempotent: it skips
times that already exist, past times, weekends/lunch per settings, and never
touches booked slots.

## Blog — original content only

`src/data/blogs.js` once held 252 stub entries whose titles, excerpts and images
were copied verbatim from mirrikh.com, with 243 images hotlinked from their
server. None had a body or a URL, so none could rank; together they read to a
crawler as a scraped, thin doorway page — a sitewide risk, not a `/blog` one.

They are gone. In their place are 8 original long-form guides, each with its own
`/blog/<slug>` URL, one keyword cluster, 800+ words, 3+ rendered FAQs, and
`BlogPosting` + `BreadcrumbList` + `FAQPage` schema.

- **Never paste content from mirrikh.com or any other site into this repo.**
  We are their strategy partner, not their mirror; duplicate content competes
  with the source and loses.
- Cover art is generated in `src/components/BlogArt.jsx` (SVG, per-post `tone`).
  Do not go back to hotlinking someone else's images — it breaks when they
  rename a folder and tells a crawler whose content it is.
- Adding a post: unique slug, a keyword nothing else on the site targets,
  real substance, and add the URL to `public/sitemap.xml`.

### The duplicate-canonical trap

`index.html` carries fallback SEO tags marked `data-static-seo`, for crawlers
that never run JS (the WhatsApp/Facebook/X scrapers). On React 19,
react-helmet-async **renders** its tags and lets React hoist them — it does not
remove those fallbacks. Left alone, every route served two descriptions and two
canonicals, and the canonical read first said `/` on every page, which tells
Google not to rank any of them. `src/components/Seo.jsx` therefore strips
`[data-static-seo]` on mount. If you add a tag to `index.html` that `Seo` also
emits, mark it `data-static-seo` too.

## Website leads

`cb_leads` — every enquiry from the site. Before this existed, `ContactForm`
called `preventDefault()` and nothing else, so every lead was silently dropped.

- RLS: **anon may INSERT, nobody but admins may SELECT.** A public read policy
  here would expose every enquiry the site has received to anyone with the anon
  key. Validation lives in column checks, not in the client.
- `source` / `source_path` record which page produced the lead, so
  `/admin/leads` can show which blog post actually earns enquiries.
- `src/lib/leads.js` is the only writer; `src/components/LeadForm.jsx` is the
  reusable conversion block used on blog posts and the blog index.
- HR sees them at `/admin/leads` with one-tap WhatsApp / call and a status
  pipeline (`new` → `contacted` → `site-visit` → `converted` / `lost`).

## SEO conventions

- Every public page renders `<Seo {...pageSeo.<key>} />` (`src/components/Seo.jsx`);
  page metadata lives in `src/lib/seo.js`. Private pages use `noIndex`.
- Each page targets **one** keyword cluster — don't let two pages chase the same query.
- `public/sitemap.xml` lists all public routes including the 22 project detail pages;
  regenerate it when projects are added. `public/robots.txt` disallows private routes.
- Structured data: `RealEstateAgent` + `FAQPage` in `index.html`, `Person` (founder,
  with award) on the homepage, `Product` per project detail page.
- **Public routes are prerendered at build time.** `npm run build` runs
  `vite build` and then `scripts/prerender.mjs`, which renders every public
  route to real HTML so a crawler that does not execute JS still sees the page.
  Routes come from `public/sitemap.xml`, so the prerendered set can never drift
  from the indexed set — **add a new public route to the sitemap or it will not
  be prerendered.** A failing route fails the build rather than shipping an
  empty page.
  - `src/entry-server.jsx` renders `AppContent` under a `StaticRouter`.
    React 19's `renderToString` hoists `<title>`/`<meta>`/`<link>` to the front
    of the returned string; the script peels them into `<head>`, otherwise every
    page hydrates with a mismatch.
  - Prerendered head tags are **not** marked `data-static-seo` — React adopts
    them during hydration, so removing them would strip the page's canonical.
  - `dist/app.html` is the plain SPA shell that `vercel.json` rewrites to.
    Private routes and unknown URLs get that, never the prerendered homepage.
  - `src/main.jsx` hydrates when `#root` has `data-prerendered`, else mounts fresh.

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
