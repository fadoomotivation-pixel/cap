# Capital Brix — Project Memory

Marketing site + internal employee tooling for **Capital Brix LLP**, built with
Vite + React 19 + Tailwind + Framer Motion, deployed on Vercel, backed by Supabase.

## Business facts (get these right in all copy)

- Capital Brix LLP is an **authorised sales channel partner for Mirrikh Infratech
  Pvt. Ltd.** See "The Mirrikh relationship" below before writing any copy that
  mentions Mirrikh. **"Official Strategy Partner" / "Strategy Partner" is
  forbidden** — it was removed under a legal notice, not for style.
- Mirrikh Infratech is a Dholera developer with 8+ completed projects since 2012.
- Founder & CEO: **Jasvinder Singh** — recipient of the **Jagran Achievers Award 2026**
  (Almaty, Kazakhstan), awarded for vision, leadership and achievement.
- Office: A-118, 6th Floor, The Diamond, Sector 136, Noida 201304.
- Phone: +91 70489 17300 · Public email: info@capitalbrix.com
- Product: NA-approved, title-clear residential/industrial plots in Dholera SIR
  (Dholera Smart City), Gujarat, sold at direct developer pricing.

## The Mirrikh relationship — legally constrained, do not soften

Mirrikh Infratech Pvt. Ltd. served a notice on **8 September 2026** requiring the
removal of website wording that portrayed Capital Brix as having a corporate,
strategic, management or ownership relationship with them. The corrections
landed the same day. **This section is not a style preference. Reverting any of
it re-creates the breach.**

**The relationship, stated correctly:** Capital Brix LLP is an *authorised sales
channel partner* for Mirrikh Infratech Pvt. Ltd. Capital Brix is **not** the
owner, promoter, developer, management entity, subsidiary, group company or
strategic partner of Mirrikh Infratech. They are separate companies.

### Never write these again

| Forbidden | Use instead |
|---|---|
| "Official Strategy Partner", "Strategy Partner" | "authorised sales channel partner" (short: "Sales Channel Partner") |
| "Partner of Mirrikh Infratech Pvt. Ltd." | the full designation — a generic "Partner of" is what they objected to |
| "Driving Mirrikh Infratech's growth" | nothing. Jasvinder Singh has no role at Mirrikh |
| "The Team Behind Mirrikh" | "The team behind Capital Brix" |
| "Our Projects" over Mirrikh/MAYUR projects | "Mirrikh Infratech Projects", marketed by Capital Brix |
| "direct developer pricing" | nothing — see below |
| "You pay the developer's own rate", "no broker commission", "pre-launch discounts" | nothing — see below |

### Two rules behind the table

1. **Never describe Mirrikh's commercial policy on their behalf.** Pricing,
   discounts, commission structure and payment terms are the developer's to
   set. We may state a price we sell at; we may not claim it *is* the
   developer's own rate, that no margin is added, or that discounts exist.

2. **Jasvinder Singh is Founder & CEO of Capital Brix LLP — and of nothing
   else.** He must never be presented, even by page layout or adjacency, as a
   founder, CEO, director, promoter or leadership member of Mirrikh Infratech.
   Watch the *structure*, not just the sentence: a "Leadership" heading sitting
   under Mirrikh branding was itself the objection.

### The footer — fixed 10 September 2026

`src/components/Footer.jsx` carried **Mirrikh Group's own corporate boilerplate**
("a diversified business conglomerate dedicated to creating enduring value…")
directly under the Capital Brix logo and name, on every page of the site. No
sentence there claimed a relationship; the *layout* did — which is the same
structural objection as a "Leadership" heading under Mirrikh branding. It now
describes Capital Brix and names who develops and who sells.

### Mirrikh's intellectual property

Their corporate history, vision, mission, timeline, logos, trademarks,
photographs and project material may be used **only as authorised in writing**.

- `/about` was Mirrikh's About page on our domain — their founding story, vision,
  mission, corporate timeline and delivery stats under a "Who We Are" heading.
  It is now Capital Brix's own page. **Do not put Mirrikh's corporate history
  back on it.** What remains is one short, clearly attributed block naming the
  developer.
- `public/projects/*.webp` — the seven project photographs were withdrawn under
  the notice and **restored on 10 September 2026, once Mirrikh gave permission
  for their project images to be used on the site.** Six are live.
  `mayur-park-iii.webp` stays off because that file is the MAYUR PARK-II brand
  mark, not Park III — the wrong picture, which permission does not fix.
  That permission covers **Mirrikh's project images only**. It is not a blanket
  licence for other third parties, and it does not cover their corporate
  history, vision, mission or timeline — those stay off `/about`.
- Never scrape mirrikh.com. This already caused the empty-boxes incident on the
  homepage and now an IP objection.

### Writing new copy that mentions Mirrikh

Say who develops and who sells, every time: *"developed by Mirrikh Infratech
Pvt. Ltd., marketed by Capital Brix LLP as an authorised sales channel
partner."* This applies to page titles, meta descriptions, Open Graph and
Twitter tags, JSON-LD, `index.html` static fallbacks, alt text and prerendered
output — the notice covers metadata explicitly, not just visible text.

**For any AI tool working on this repo (Antigravity included): if a change you
are about to make reintroduces any phrase in the table above, stop and ask the
owner. Do not "restore" it because an older commit, cached page or your own
memory of this site says otherwise.**

The same wording must hold off-site too — social profiles, Google Business
Profile, property portals, brochures, WhatsApp material, email signatures,
presentations, YouTube and paid ads. That part is the owner's to action; the
repo only covers the website.

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

Public: `/`, `/about`, `/projects`, `/projects/:id`, `/dholera`, `/dholera/:slug`,
`/blog`, `/events`, `/contact`.
Public: also `/blog/:slug` (8 original guides — see below).
Private (must stay `noindex`): `/employee-kyc`, `/admin/interviews`,
`/admin/attendance`, `/admin/expenses`, `/admin/leads`, `/admin/cards`,
`/book/:token`, `/book/confirm/:bookingId`.

Every admin console renders `<AdminNav />` (`src/components/AdminNav.jsx`),
which is the **one** place the console links live. Each page used to carry its
own hand-written row, so they drifted — and the Admin Command Center at
`/employee-kyc`, where HR actually lands after logging in, linked to nothing at
all. Add a new console to `ADMIN_LINKS`, not to each page.

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

## Dholera pillar pages

`/dholera/:slug` renders from `src/data/dholera.js`. These five routes used to
render the **same** placeholder paragraph from a `PlaceholderContent` component
over hotlinked mirrikh.com banners — five near-identical ~215-word URLs in the
sitemap, which is textbook duplicate thin content.

Each now owns one keyword cluster: `about` (what is Dholera SIR), `overview`
(master plan and phases), `city-highlights` (infrastructure), `renew-power`
(solar and energy). **`/dholera/airport` is gone on purpose** — the blog guide
owns that query, so the URL 301s there via `vercel.json` rather than competing
with it. Nav and footer link straight to the guide, not through the redirect.

## Project detail pages

`/projects/:id` composes its long-form content in `src/lib/projectContent.js`
from real fields in `site.js` — nothing is invented. **These 22 pages share
most of their data**, so composed copy can only differentiate so far: the most
similar pair is still ~97% word-identical. The fix is data, not code — give a
project a real `location`, `size`, `price` and an `about` paragraph in
`site.js` and the page picks it up with no code change.

An earlier attempt added shared "how to verify a plot" prose to all 22, which
raised word count and left them 90% identical. Don't do that: link the guide
that owns the query instead.

### Animated figures start at the finished number

`src/components/CountUp.jsx` used to initialise at zero, which baked **"₹0 Cr"**
into the prerendered HTML where "₹91,000 Cr" belongs — telling the one reader
prerendering exists for, a crawler that does not run JS, that the Tata fab is
worth nothing. It is also what a human sees before hydration. It now renders the
finished figure and the client resets to zero in a layout effect, before paint.

### Heading semantics

Several sections marked the tiny uppercase eyebrow label as the `<h2>` and the
real headline as an `<h3>`, so Google read "Portfolio" and "The Capital Brix
Vision" as the section headings. Eyebrows are `<p>`; the visible headline is
the `<h2>`.

### The duplicate-canonical trap

`index.html` carries fallback SEO tags marked `data-static-seo`, for crawlers
that never run JS (the WhatsApp/Facebook/X scrapers). On React 19,
react-helmet-async **renders** its tags and lets React hoist them — it does not
remove those fallbacks. Left alone, every route served two descriptions and two
canonicals, and the canonical read first said `/` on every page, which tells
Google not to rank any of them. `src/components/Seo.jsx` therefore strips
`[data-static-seo]` on mount. If you add a tag to `index.html` that `Seo` also
emits, mark it `data-static-seo` too.

## Visiting / ID card requests

`cb_card_requests` — an employee raises a request from the Employee Portal's
Cards tab; HR works it at `/admin/cards` through
`requested → approved → printing → ready → delivered` (or `rejected`).

- The printed fields (`print_name`, `designation`, `print_phone`, `print_email`)
  are asked for explicitly rather than read off the roster. A card is printed
  once and a misprint costs money, so the employee confirms exactly what goes
  on it. The form prefills from `cb_employees` but every field stays editable.
- RLS: an employee may INSERT only `user_id = auth.uid()` and SELECT only their
  own rows; **only admins may UPDATE**, so nobody marks their own card
  delivered. `admin_notes` is visible to the employee — it is how HR replies.
- "Print spec" copies a plain-text batch of every approved/printing request,
  formatted for the printer, so one order covers everyone.

## Event registrations

`cb_event_registrations` — sign-ups for a live event. The first one is
**"How to Create Wealth in Dholera?"**, Sunday 13 September 2026 at Club GH-01,
E Block, Gaur City 1, Sector 4, Greater Noida, hosted jointly by **Mirrikh Group
and Capital Brix LLP** (two separate companies co-hosting — never one entity,
and Capital Brix is still only an authorised sales channel partner).

- Public page: `/events/dholera-wealth-2026` (in the sitemap, so it prerenders).
  Event facts live in `src/data/eventDetails.js` — one entry per slug, keyed by
  the same `event_slug` written to the table, so a row can always be traced back
  to which event it was for. The seminar runs **10:30 AM – 2:00 PM**.
- **The speaker list is not a credibility claim.** `speakers` names who is on the
  platform that day, which is a fact about the event and must never drift into a
  statement about a corporate relationship. Jasvinder Singh is titled Founder &
  CEO of **Capital Brix LLP** and is never placed under Mirrikh branding.
  Rajeel Jangir is printed exactly as the joint poster prints him, "Founder &
  Director", with **no company attributed to him by us** — we do not describe
  anyone else's corporate position on their behalf. If the co-host asks for a
  name to come off, delete the entry rather than rewording it. This is the one
  narrow exception to "never name Mirrikh Infratech's founder on the site": it
  applies to a jointly hosted event's own platform, not to marketing copy.
- **The ₹2,500 delegate fee is now a real, declared price.** It first appeared
  as an invented struck-through number with nothing behind it, which is a
  misleading price claim under the Consumer Protection Act and the pattern the
  CCPA's misleading-advertisement guidelines name directly; it was removed for
  that reason. The owner then **set ₹2,500 as the seminar's actual delegate fee
  on 10 September 2026**, waived for online registrations, and it is shown
  struck through again on that basis.

  It lives in **one** place — `delegateFee` / `delegateFeeNote` in
  `src/data/eventDetails.js` — and two things must stay true or it goes back to
  being a fabricated reference price:

  1. **₹2,500 has to be what a walk-in without a registration is actually
     asked for.** A fee nobody is ever charged is not a fee.
  2. **The waiver is always printed as a condition** ("waived when you register
     online before the day"), never as a bare "was ₹2,500".

  Set `delegateFee: null` and the strike-through, the hero line and the schema
  description all fall back to plain "free" on their own. **Never leave the
  number there as decoration.** Every surface that mentions price — hero facts
  bar, coupon card, FAQ, meta description, `Offer` in JSON-LD and the
  confirmation email — reads from this decision and must not drift apart.
- **The coupon applies itself.** `DEFAULT_CODE` (`CAPITALBRIX`) is prefilled on
  arrival, so the delegate-fee waiver is visibly applied before anyone types.
  The field stays editable for campaign codes from a poster or a forward
  (`PRIORITY_CODES`).

  Because everyone now carries the default, **`/admin/events` badges PRIORITY
  and counts a code in the rollup only when it is NOT the default** — a badge
  on every row is a badge on none. `DEFAULT_CODE` is declared in both
  `EventRegistration.jsx` and `EventsAdmin.jsx`; change it in both or the
  console starts flagging every registration.
- **Do not say who is bearing the cost of the event.** The same block read
  "sponsored by Capital Brix & Mirrikh Infratech" — a statement about Mirrikh's
  commercial arrangements made on their behalf, which is rule 1 above. Say the
  seat is free and nothing is being sold.
- On success the registrant gets a **downloadable pass**
  (`src/components/EventPass.jsx`): a 1080×1350 PNG drawn on a canvas, plus an
  `.ics` calendar file. Canvas rather than html2canvas — no 200KB dependency, a
  fixed size that looks the same on every phone, and no external font or image
  to fail at the moment someone wants to save it. The `REF` on the pass is the
  last six characters of the row id, short enough to read out on a call.
  "Add to calendar" is a **Google Calendar** link first — a downloaded `.ics` on
  Android lands in Downloads and is never opened — with the `.ics` kept as a
  quiet secondary link for Apple Calendar and Outlook.
- **Every field is on the form; nothing hides behind a disclosure.** City and
  referrer sat behind a "+ Add details" toggle and were arriving empty — almost
  nobody opens a disclosure on a sign-up form. They are visible and marked
  Optional. "What are you looking at?" was dropped entirely on 10 Sep 2026: the
  `interest` column stays for existing rows and the console still shows it, but
  nothing writes it. The form must also not promise "Instant confirmation" while
  no mail provider is configured.
- **The page is ordered as a funnel, not as a brochure.** Headline → countdown
  → form → details. Date, venue and fee are the *reassurance* layer and sit
  **below the Reserve my seat button**, for the reader who has already decided
  to act and wants one last check. Above the form they are three more chances
  to decide no, so do not move them back up. The tagline was removed from the
  hero for the same reason — it delayed the clock.
- **One registration is one seat.** No seat picker: it is a micro-decision on
  the way to the button and a second way for the hall count to be wrong.
  Someone bringing a guest registers them separately, which is also how we get
  that guest's name and number. `guests` is written as 1.
- **"Who invited you?" is required.** Every seat should be attributable to
  whoever brought that person — it is how the team gets credit and how we know
  which channel filled the room. Left optional it was simply skipped. Enforced
  on the form and again in `src/lib/eventRegistration.js`; deliberately **not**
  a NOT NULL on the column, because rows registered before this rule would fail
  it. Still free text, never a dropdown of staff names.
- **The hero keeps its boxes.** A weightless, Apple-style pass — no borders,
  huge type, one plain line of facts — was built and rejected by the owner: it
  read as a poster rather than as an event you can sign up to. The boxed facts
  bar and the ticking countdown earn their place. Refine spacing and type scale
  there; do not strip the structure again.
- **The coupon card is Antigravity's and stays.** "Entry: Free / NO CHARGE" on
  the left, an applied-coupon chip on the right. An already-applied code reads
  as a small win before anyone has typed. Only two things were changed and must
  not come back: the struck-through ₹2,500, and "100% OFF" — a discount off a
  price that was never charged.
- **The phone field strips a pasted country code rather than truncating it.**
  "+91 98765 43210" is twelve digits; keeping the first ten gives 9198765432 —
  a plausible-looking number that is not theirs and cannot be dialled.
- `invited_by` records who brought this person — free text, deliberately not a
  dropdown of staff names, because a dropdown silently drops the existing
  customer who referred a friend, which is the answer worth having. The console
  rolls it up into "who is filling the hall", counting seats rather than rows.
- HR console: `/admin/events` (admin-only, `noindex`), in `ADMIN_LINKS`.
- RLS mirrors `cb_leads`: **anon may INSERT, only admins may SELECT/UPDATE.**
- **`src/lib/eventRegistration.js` mints the row id client-side and does NOT
  call `.select()` after the insert.** `RETURNING` needs a SELECT policy, and
  anon deliberately has none — an `.insert().select('id')` here fails every real
  registration even though the insert itself is allowed. Verified against the
  live policies, not assumed.
- **One email is not one person — this cost us a real attendee.** The unique
  index was on `(event_slug, lower(email))`, so the *second* real person
  registered from any address already used was rejected — a salesperson signing
  up walk-ins from their own inbox, a couple sharing an inbox, a parent
  registering a son. And because the client reads `23505` as "your seat is
  already held", every one of them was shown a **success screen** for a seat
  that did not exist. Confirmed in the Postgres log, 11 Sep 2026 12:30:21 UTC.

  The index is now `cb_event_reg_unique_person` on
  `(event_slug, name, phone, email)` — an exact repeat of one person is still
  blocked, a different human on a shared address gets in. The double tap was
  never the database's job anyway: the submit handler already refuses to run
  while a request is in flight. **Do not put a unique constraint back on email
  alone.**
- **A failed insert is never silently swallowed.** Any error that is not a
  genuine duplicate writes the attempt to `cb_leads` with
  `source = 'event-registration-failed'`, and `/admin/events` shows those at the
  top in red — a rescued registration filed in a different console is one
  nobody looks at. The visitor is told the team will confirm by hand, never
  shown a success they did not get.
- Confirmation email: the **`event-confirmation` Edge Function** (source in
  `supabase/functions/`). It takes only a row id — never an address from the
  browser — refuses to send twice, and returns `{ sent: false }` instead of
  failing when `RESEND_API_KEY` is unset, because the registration is already
  saved by then and a missing mail provider must not look like a failed sign-up.
  `resend: true` bypasses the once-only rule and therefore requires an admin JWT.
- **Mail provider — Zoho by default.** Capital Brix already owns
  `hr@capitalbrix.co.in`, so the function sends over SMTP when `SMTP_PASSWORD`
  is set (Zoho needs an **app-specific password**, not the login password;
  `SMTP_HOST`/`SMTP_PORT` default to `smtp.zoho.in`/`465`, `SMTP_USER` to
  `hr@capitalbrix.co.in`). `RESEND_API_KEY` is the alternative; SMTP wins if
  both are set. With neither, registrations still save and the page falls back
  to "our team will confirm on WhatsApp". Setup steps are in
  `supabase/functions/README.md`.

### Past events

`src/data/events.js` is the archive rendered on `/events`. It was scraped: 31
rows, one titled "1", eight identical "India / 2024" placeholders, Dehradun
listed twice for the same day, two misspellings. It is now 18 rows we can name a
place and a date for, each with a `sort` key because "2024" and "29 Dec 2024"
cannot be compared as text.

**Photographs:** drop the file in `public/events/` and set
`image: '/events/<file>.webp'` — same convention as `public/projects/`. Without
one the card renders generated art. The 10 Sep 2026 permission covers Mirrikh's
**project images only**, not event photographs, so do not assume an event photo
is cleared just because a project photo is. Never point an `<img src>` at
mirrikh.com again.

## Scroll behaviour

`src/components/ScrollToTop.jsx` runs inside the router and puts every new page
at the top. React Router does not touch scroll on navigation, so before this
existed, tapping an event from two-thirds down `/events` landed the visitor a
quarter of the way into the sign-up page, and going Home from anywhere deep
landed them around the virtual tour with no idea they were mid-page. Only
`ProjectDetail` had noticed and fixed it locally for itself, which is why the
bug survived everywhere else.

Three cases, in this order: a **`#hash`** wins outright (checked first, because
React Router reports the initial page load as POP and a shared `…#register`
link would otherwise be swallowed); **POP** — back/forward — is left alone, so
the browser's restored position survives; everything else goes to the top
instantly, never smoothly.

**A second cause of the same symptom** was `VirtualTourViewer`, which called
`el.scrollIntoView({ block: 'nearest', inline: 'center' })` to centre the active
landmark chip. That scrolls the *whole page*, and the tour sits below the fold —
so every homepage load dragged the visitor down to it. It now moves the strip's
own `scrollLeft` and skips the first run. **Never use `scrollIntoView` to move a
horizontal strip.**

### The tour renders blurry unless the iframe is oversampled

3DVista sizes its WebGL canvas in **CSS pixels and never multiplies by
`devicePixelRatio`**. Measured on a DPR-3 phone: a 362×531 backing store
stretched across 1086×1593 device pixels — a 3× upscale of a render that was
never done at that size. That is the blur, not the panorama: tiles are 512px in
a 3×3 grid, so 1536px per cube face is available and ample for that box.

The player is not ours to patch, so `VirtualTourViewer` lays the iframe out
`oversample` times larger in CSS pixels and scales it back down with a
transform. The tour believes it has a bigger viewport, sizes its canvas to
match, and the result is displayed at the original size. **Capped at 2** —
oversampling costs the square of the factor — and decided in an effect, never a
`useState` initialiser, or the server and client disagree on `devicePixelRatio`
and hydration tears the tree down. Verified: backing store 362×531 → 724×1061
with the on-screen size and the framing unchanged.

The mobile "Tap to explore in 360°" gate also carried
`bg-black/30 backdrop-blur-[1px]`, which greyed and softened the one thing the
section exists to show. A tap gate does not need to obscure what it is gating;
the pill has its own background and shadow. **Do not put a blur back there.**

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

`docs/ANTIGRAVITY_BRIEF.md` is the current handoff: what the SEO work changed,
the project-photo task, and the list of load-bearing things not to "clean up".
Update it when the state of the repo moves on.

**Project photos:** drop a file in `public/projects/<slug>.webp` and add
`image: '/projects/<slug>.webp'` to that project in `site.js`. The card uses it
and falls back to generated art otherwise. Files must be **self-hosted** —
pointing an `<img src>` at mirrikh.com is what made the homepage render seven
empty boxes.

## Conventions

- Run `npx vite build` before pushing — it's the only build check in the repo.
- Content copy lives in `src/data/site.js` (projects, FAQs, stats) and
  `src/data/blogs.js` — edit content there, not in components.
