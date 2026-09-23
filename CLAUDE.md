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
  **The same org holds a second project, `Fanbe-CRM` / `mfgjzkaabyltscgrkhdz`
  (ap-southeast-1), and it is not ours.** The dashboard opens whichever was
  last used, so "Edge Functions → Secrets" can silently be the wrong project —
  it already happened once with `WA_WEBHOOK_URL`, `WA_WEBHOOK_TOKEN` and
  `CRON_SECRET`, which looked set and left the function answering
  `403 not authorised`. Check the ref in the URL before saving a secret, and
  confirm from this side rather than from the screen: `select
  cb_send_attendance_report('attendance');` then read `net._http_response` —
  a 403 means the secret is not where you think it is.
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
`/admin/events`, `/admin/whatsapp`,
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

### Biometric punches from the eSSL machine

The office runs an **eSSL eTimeTrackLite 12** against device `192.168.1.201`.
Its punches now reach `cb_attendance` on their own, so the portal's manual
punch is a fallback rather than the only source.

```
machine → eTimeTrackLite → Parallel Database Export → local MS SQL
       → integrations/punch-bridge → cb_ingest_punches() → cb_device_punches
       → cb_fold_punches_into_attendance() → cb_attendance
```

- **eTimeTrackLite cannot write to Supabase directly.** Its Database Type list
  is MS SQL Server / MySQL / Oracle; Supabase is Postgres. Hence the bridge.
  It reads a table *we* create (`integrations/punch-bridge/schema.sql`) rather
  than eSSL's own database, so an eSSL update cannot move the columns under it
  and a bug here can never write to the attendance software's data.
- **`cb_employees.device_code`** maps the machine's Emp Code (1, 2, 3, 10…) to
  a person. It is neither `employee_code` nor the email. Punches for an
  unmapped code are still stored, and `cb_ingest_punches` returns
  `unknown_device_codes` so nobody has to notice on their own.
- **The fold resolves the person through `device_code`, never through the
  `employee_id` stored on the punch.** It used to read the stored id, which is
  set at ingest — so 48 real punches that arrived before the roster knew their
  codes sat attached to nobody, and filling the codes in afterwards changed
  nothing, silently. Joining on the code makes it self-healing: a punch
  recorded before the roster knew that code lands in the register the moment
  it does. `employee_id` stays on the row as a record of who the punch was
  attributed to on arrival; the register must not depend on it.
- **The bridge holds `cb_integration_secrets.punch_bridge`, never the
  service-role key.** It runs on a desktop people use; the worst a copied
  secret can do is submit punches.
- **It re-sends a 36-hour window every run** instead of keeping a watermark.
  A watermark is one lost file away from losing punches; re-sending is free
  because `cb_device_punches` is unique on `(device_code, punch_at)`.
- **A second punch under 60 minutes after the first is the same arrival tapped
  twice, not a departure.** The eSSL monitor itself shows `10:35,10:35,`;
  without that rule everyone reports zero hours. Verified both ways against
  the live function before shipping.
- **The machine never overrides a person or HR.** Check-in takes the earliest
  of machine and portal and check-out the latest (`least`/`greatest`), and
  `hr_status` is never touched — "Absent" must keep meaning genuinely
  unaccounted for.
- Punch times arrive as bare local IST and are stamped `+05:30` by the bridge.
  A bare timestamp is read as UTC and would file every arrival 5½ hours early.

### The machine posts to us directly (ADMS)

The bridge above is only as awake as the office desktop, and that desktop has
already taken the register down once for five days. So the terminal now also
posts its own punches straight to Supabase, over the ZKTeco **push (ADMS)**
protocol the firmware already speaks (`ZAM70-NF24HA-Ver3.3.12`, Push Ver
`3.1.2S-20250616`, serial `NYU7252102010`). With that on, attendance keeps
working with the PC switched off.

```
machine --(HTTPS)--> www.capitalbrix.co.in/iclock/* --> essl-adms Edge Function
       --> cb_ingest_punches() --> cb_device_punches --> cb_attendance
```

- **It is a second road, never a replacement.** `cb_device_punches` is unique
  on `(device_code, punch_at)`, so the PC bridge and the terminal can both
  send the same punch all day and the register cannot double-count. Leave both
  running: whichever is alive keeps attendance working.
- **`vercel.json` rewrites `/iclock/:path*` to the function**, and that rule
  must stay **above** the `/(.*)` → `/app.html` catch-all or the device gets
  the SPA shell. The path is served off the live site rather than the raw
  Supabase URL because the device has one address field and no path prefix.
- **The serial is the credential.** The terminal has no field for a bearer
  token — what it does send on every request is `SN`. `ADMS_ALLOWED_SN`
  (default: the office serial) is the allowlist; anything else gets 401. The
  ceiling on a forged serial is the same as the bridge's: it can submit
  punches, nothing more. The function reads
  `cb_integration_secrets.punch_bridge` server-side and calls the same RPC —
  the device never sees a key.
- **`getrequest` always answers `OK` and there is no command path.** This
  endpoint receives attendance; it must never be able to enrol, delete or
  unlock anybody.
- **A failed ingest answers 500, not `OK`.** An un-acknowledged batch stays on
  the terminal and is re-sent. Saying `OK` when the store failed throws those
  punches away.
- **Non-ATTLOG uploads (`OPERLOG`, `ATTPHOTO`) are acknowledged and
  discarded.** An upload the device cannot clear is retried until it blocks the
  punches queued behind it.
- Times arrive as the terminal's own wall clock and are stamped `+05:30`, for
  the same reason the bridge does it: a bare timestamp is read as UTC and files
  every arrival 5½ hours early. The in/out `status` flag is **not** acted on —
  people tap the same key both ways; the register decides direction from the
  times.
- **`cb_adms_log` is the heartbeat**, one row per contact, pruned to 14 days,
  and surfaced on `/admin/attendance` → Settings as "Attendance machine". With
  the PC out of the loop there is no screen in the office that shows whether the
  machine is talking to anybody, and the September stall proved that an
  unanswerable "is it working?" is how five days disappear.

Device settings (Menu → Comm. → Cloud Server / ADMS): **Enable Domain Name ON**,
Server Address `www.capitalbrix.co.in`, Server Port `443`. **If the terminal
refuses 443** — a good many eSSL push builds are HTTP-only — the panel above
stays on "never contacted us", and the answer is a small HTTP front door that
forwards to the function, not weakening anything here.

### Daily attendance report to WhatsApp

`attendance-whatsapp` Edge Function, fired by **five pg_cron jobs**
(`cb-morning-checkin-whatsapp`, `cb-daily-attendance-whatsapp`,
`cb-absent-list-whatsapp`, `cb-attendance-reminder`,
`cb-daily-logout-whatsapp`) through
`cb_send_attendance_report(kind)` → `pg_net`. An admin can
also call it with their JWT to send early, re-send (`force`), or preview
(`dry_run`).

- **The sending number is the founder session's, and there is no way around
  it.** The `callpro-baileys` worker exposes `POST /send {to,text}` with a
  bearer — byte-identical to what this function already sends, so no
  `WA_PAYLOAD_TEMPLATE` — but only for the founder session. Per-telecaller
  "rep" sessions are watch-only and their `send` action returns 403 on purpose.
  Scanning another phone therefore does not create a sender. **The founder
  session's number must be a member of the WhatsApp group**, since WhatsApp
  only lets an account post to groups it is in.

  **`/send` has no session parameter at all** — it always uses the founder
  socket, and there is no code path by which a message of ours could leave
  from a telecaller's or another product's session. Worth knowing because on
  21 September a Capital Brix report was reported as having reached somebody
  at Fanbe: whatever that was, it did not come from this function, which sent
  exactly two messages that day, to the group JID and to
  `917048917300`. Look at who can read the founder session on the Call Pro AI
  dashboard, not at this repo.
- **Proving the chain is four separate facts, and the log distinguishes
  them.** `select cb_send_attendance_report('attendance');` then read
  `net._http_response`: `403 not authorised` means `CRON_SECRET` is missing or
  in the wrong project; `200 {"sent":false,"reason":"daily report is switched
  off"}` means the cron leg works; anything after that lands in
  `cb_report_log.detail`. On 21 September that read
  `HTTP 503 … This WhatsApp is logged out` — which proves the URL and the
  bearer are both right and puts the fault squarely on the Baileys session,
  not on anything in this repo.
- **Meta's official WhatsApp Cloud API cannot post to a group** — it only
  messages individual numbers. Groups need a logged-in WhatsApp Web session
  (Baileys). So the function embeds no WhatsApp client: it builds the text and
  POSTs it to `WA_WEBHOOK_URL`, and that service owns the session. **When the
  report stops arriving, check the Baileys login before suspecting this.**
- Default body is `{"to", "text"}`; `WA_PAYLOAD_TEMPLATE` with `{{to}}` and
  `{{text}}` covers an endpoint wanting another shape. Substitution is
  JSON-escaped, so quotes and newlines in a message cannot break it.
- `cb_hr_settings.wa_group_id` + `daily_report_enabled` are HR-editable; the
  URL, token and `CRON_SECRET` are Edge Function secrets. A blank group falls
  back to `founder_whatsapp`.
- **A day with no punches is reported as a broken feed, not as everyone being
  absent.** The register cannot tell "nobody came" from "the machine stopped
  reaching the PC", and its answer either way is Absent against every name —
  which is the most damaging thing this message could say, and on 21 September
  it would have said it for five days running while every automated check was
  green. So `attendance-whatsapp` counts `cb_device_punches` for the IST day
  first, and when that is zero it sends a short warning naming the download
  step instead of the roll-call. On a real holiday the warning is still true.
- **The register is folded before it is published.** `cb_ingest_punches`
  folds as it stores, and `cb-fold-punches-10min` sweeps yesterday and today
  every ten minutes, but the report also folds its own date before reading —
  a register that is a few minutes stale is harmless in a console and not
  harmless in a message to fifty people. It happened once already: punches
  from a 13:56 download had arrived and the register still said five people
  were in.
- **`cb_report_log` is keyed on `(report_date, kind)`**, so the cron firing
  twice, a retry and HR tapping Send collapse to one message. Failures are
  logged too — a silent failure is how a team discovers three weeks later that
  nobody has seen a report.
- `cb_daily_attendance()` is gated on `cb_is_admin()`, which reads the JWT
  email — the service role has none. **`cb_daily_attendance_report()` exists
  for that reason**: same rows, granted to `service_role` alone. Do not weaken
  `cb_is_admin()` instead; it backs RLS on every `cb_*` table.
- **The summary is grouped into arrival windows**, matching the format HR
  already sends by hand: `Till 10:30`, `10:30 – 11:00`, `11:00 – 12:00`,
  `After 12:00`, then Absent and On leave. The founder reads this to see who
  drifted in late; grouped, the answer is the size of each block instead of a
  list to scan. There is no separate "Late" section — the windows are it.

  The first window is **"Till 10:30", not "9:00 – 10:30"**. Somebody arriving
  at 08:40 has to land somewhere, and every present person must appear in
  exactly one window — the windows always sum to the Present count. A report
  that silently drops the earliest person in the office would be worse than
  no report.

  **Headcount is not published.** The headline opened with
  `Strength 30`, and in a group this size that reads as a statement about how
  small the company is — a question nobody sent this report to ask. It is now
  `Present 24 · Absent 5`. Those still sum to the roster, so the size is
  inferable; what is gone is the sentence that announces it.

  **The tone is an HR notice, not a dashboard.** The first version carried
  emoji on every headline — 👥 strength, ✅ present, ❌ absent, 🌴 on leave.
  In a fifty-person company group a row of ticks and crosses against
  colleagues' names reads as a scoreboard, and the counts already said
  everything the icons did. Headline figures are now a plain
  `Strength 30 · Present 24 · Absent 5` line, the geofence section is
  "Punched away from the office" rather than a warning triangle, and both
  reports sign off `— Capital Brix HR`.

  Windows are computed from **IST explicitly**, never the browser's clock: an
  HR laptop left on another timezone would otherwise file people into the
  wrong block, and the blocks are the whole point.
- **The register holds real history, not just today.** `ettl-sync.ps1 -All`
  imported **26,674 punches back to 15 November 2025**, which folded into
  **2,922 attendance rows across 28 people**. Backfilling early is safe and
  was wrongly gated for a day: the fold resolves a person through
  `device_code` at fold time, so an unmapped code produces **no** row rather
  than a wrong one, and the punches attach themselves the moment the code is
  filled in. Re-run `cb_fold_punches_into_attendance(from, to)` after any
  mapping change.
- **Three Amits are enrolled on the machine; the roster's Amit is `59`.**
  Codes `6`, `59` and `66` are all named "Amit". Frequency alone points the
  wrong way — `6` has 1,132 punches since November against `59`'s 266 — but
  the pattern decides it: in September `59` punched on ten working days,
  arriving around 11:00 and leaving around 19:00, while `6` produced three
  lone evening taps and `66` none since July. The confirming evidence is an
  11:18:10 punch by `59` on 9 September against HR's own handwritten
  "Amit - 11:18".
- **"Parallel Database Download" is ticked in Device Management and points at
  nothing.** Its target is MS SQL `localhost` / `TimeTrack` / `AttendanceLogs`,
  and this PC has no SQL Server at all — that is the abandoned export route.
  The tick costs a failed write on every download. Untick it; the `.mdb` route
  does not use it.
- **eTimeTrackLite's download was never automatic.** `Devices.DownLoadType`
  was `1` (manual) and `eSSL_Schedular.exe.config` had `AutoStart = False`, so
  punches reached the PC only when somebody clicked Download — and the whole
  pipeline silently stopped on 19 September when nobody did. Turning the
  device's download to Auto/Online and ticking AutoStart is the fix, and it is
  a GUI action on the office PC: a background agent cannot restore a tray
  window and walk a Windows Forms menu. **The device is `Test Device`, id 14 —
  never rename, delete or re-add it.** A re-added device can renumber the
  person-to-code mapping, and all 26,722 historical punches are keyed on that
  code.
- **A silent stop is upstream, not in the bridge.** On 21 September the
  register had nothing after the 19th while the scheduled task's last result
  was `0x0` and the sync read every table without error. `DeviceLogs_9_2026`
  had simply stopped growing — eTimeTrackLite had stopped downloading from
  `192.168.1.201`. **A green sync proves the PC→Supabase half only.** The
  check that catches this is the day count, not the task's exit code.

  When it happens: ping the device, then read `Devices.LastLogDownloadDate`
  and `DevicesStatus` in the `.mdb`. On 21 September those said the device was
  reachable and the downloader had simply not polled since Saturday 11:14 —
  the punches were still in the terminal's own memory. **eSSL terminals
  overwrite their oldest logs once that buffer fills**, so a stalled download
  is a deadline, not an inconvenience. Restarting it is a GUI action
  (Device → Download Logs) that nothing on the command line can do.
- **Device code `32` is Jasveer Singh Chaudhary, not a test card.** The
  machine labels it `Card`, and on that reading it spent a day in
  `cb_ignored_device_codes` as "test card, not a person". The owner's own
  cross-check says the card belongs to Jasveer — one of three roster names
  that had no code — so it is mapped to him and no longer ignored. If his
  arrivals ever look like somebody else's, this is the line to revisit: a
  card named `Card` is the shape a shared visitor card would also have.

- **`cb_employees.in_daily_report = false` keeps somebody out of the
  summary** — the founder, people who do not punch, pantry staff, a test
  card. Leaving them merely unmapped does **not** work: an active employee
  with no punch is "Absent", so they would be listed absent every single day
  and the one section that needs reading fills with people nobody is asking
  about. It is deliberately **not** `is_active = false`, which means "no
  longer with us" and is read by the portal, logins and the register. The
  filter lives in `cb_daily_attendance_report()`, so the HR console still
  shows everyone — the console is the full picture, the report is the short
  list.
- **The evening message is one combined picture, at 18:45 IST** (13:15 UTC),
  `kind = 'reminder'` — three sections in one: **Logged out** (with hours),
  **No check-out yet**, and **No attendance recorded today**.

  It sits at 18:45 and not at 19:01 deliberately, and that choice is the whole
  design. An evening message to the group is only worth sending while somebody
  can still act on it; after 19:00 the person who forgot to tap has gone home.
  The logout list is not empty at that hour either — at 18:45, by definition,
  everyone on it left early, which is the part worth seeing. The founder's
  19:01 message remains the complete record, with the full departure windows.

  There are **no departure windows in the 18:45 message**: before the shift
  has ended, "18:00 – 19:00" and "19:00 onwards" describe time that has not
  happened yet.
- Originally this was a two-list nudge, `kind = 'reminder'`.
  Somebody who was in all day and forgot to tap is **indistinguishable from
  somebody who never came** — the machine has nothing either way. The register
  cannot solve that; a person can, if they are told while they are still in
  the building. At 19:01 it is too late, and the next morning it is a dispute
  nobody can settle. So the reminder names two groups and asks:

  - **no exit punch yet** — without a tap on the way out the day reads as
    zero hours;
  - **no attendance recorded** — either genuinely absent or present and never
    tapped, and only they know which, which is why they are *asked* rather
    than marked.

  Anyone with an `hr_status` is left out: somebody on approved leave is not
  being forgetful. **When both lists are empty it sends nothing** and logs
  `ok` with "nothing to remind" — a daily message that is usually empty is a
  daily message people stop reading. It sits fifteen minutes before the
  logout report on purpose: the reminder is the last chance to fix the day,
  the 19:01 summary is the record of it.
- **Four messages a day, two audiences, and the split is the product
  decision.**

  | Time | `kind` | What | To |
  |---|---|---|---|
  | 10:30 | `morning` | who has punched in so far | **group** |
  | 11:30 | `attendance` | arrivals by window, plus absent and on leave | **founder** |
  | 11:31 | `absent` | the absent list alone, no arrival times | **group** |
  | 18:45 | `reminder` | logged out so far, no check-out yet, no attendance | **group** |
  | 19:01 | `checkout` | who logged out, and who has no check-out | **founder** |

  Each target falls back to the other so a blank setting cannot silence a
  report.

  **The group's two both ask somebody to act while they still can.** The
  founder's two are the record and the decisions only he can make: fifty
  people can do nothing with a roll-call, and a daily list of colleagues'
  arrival times in a company group reads as surveillance however plainly it
  is worded.

  **The 10:30 message names who HAS punched, never who has not.** A list of
  late names in a fifty-person group is the scoreboard this module keeps
  being told not to become — but somebody scanning for their own name and not
  finding it learns exactly the same thing without being held up in front of
  colleagues, and can still walk to the machine. The deadline is stated
  ("the register is finalised at 11:30") and the absent list that follows
  goes to the founder. It returns null, and sends nothing, when nobody has
  punched at all: at 10:30 that is a holiday or a broken feed, and "nobody is
  in the office" is not a sentence to publish on the strength of a silent
  machine.

  **An owner's first sketch had five messages** — 10:30 and 11:15 present
  lists, 11:30 absent, 19:00 logout, 19:10 missing-punch. Two were merged
  because 11:15's list is the same list as 10:30's, and a message that
  repeats itself is how people stop reading the first one; stating the 11:30
  deadline inside the 10:30 message does the same work. And the evening nudge
  stayed at **18:45, not 19:10**: the shift ends at 19:00, so at 19:10 the
  person who forgot to tap has already left. The whole point of that message
  is that they are still in the building.

  **The broken-feed warning always goes to the founder**, whatever the kind.
  It asks for a specific click inside eTimeTrackLite; in the group it is an
  unactionable announcement that the company's attendance is broken.

  The founder's two messages carry a **`Register:` link to
  `/admin/attendance`** — a summary that names a problem and then leaves the
  reader hunting for the place to fix it is half a message.

  **The broken-feed warning always goes to the founder too**, whatever the
  kind. It asks for a specific click inside eTimeTrackLite; in the group it
  would be an unactionable announcement that the company's attendance is
  broken.

  The founder's two messages carry a **`Register:` link to
  `/admin/attendance`** — a summary that names a problem and then leaves the
  reader hunting for the place to fix it is half a message.
- **There are two Abhisheks, and only device code `61` is the pantry one.**
  `61` has been in `cb_ignored_device_codes` as "Abhishek - pantry staff"
  from the start. The roster's **Abhishek kumar is `19`** — 193 days
  recorded, and he stays in the report. The owner said "Abhishek kumar pantry
  hai" on 22 September and the change was **not** made, because the evidence
  points the other way and a name collision had already nearly cost the
  wrong Amit his record: since August, `61` punched 41 days arriving around
  **10:02** (earliest 09:12 — pantry staff open the office) while `19`
  punched 23 days arriving around **11:03** (earliest 10:44 — the sales
  floor's pattern). HR's own handwritten sheet for 3 September reads
  "Abhishek Kumar - 11:23", which is `19`, and marks him Absent on 5
  September and 29 August — so HR tracks him. The owner then confirmed: only
  `61` is pantry.
- **Seniority is decided by whether HR already counts them, not by job
  title.** `Kamal Mishra` was marked senior off the strength of "Business
  Head" and un-marked the next day: HR's own attendance sheets list him with
  the sales team. The title was the wrong signal. The four seniors are
  Neeraj Kulshrestha, Kalpana Kulshrestha, Manish Verma and Subrat.

  HR's August/September sheets are also the reason to trust this flag at all
  — not one Director appears in them. HR was already leaving seniors out by
  hand; `is_senior` only makes that automatic.
- **Who the messages name is HR's to change, from the Employees tab.**
  `in_daily_report` had no control anywhere — it was only ever set by hand in
  SQL, so every "keep so-and-so out of the report" needed a developer, which
  is not an answer for a decision the founder makes about his own team. Each
  roster row now carries the three switches that decide it, worded as what
  they do rather than as column names:

  | Switch | Effect |
  |---|---|
  | **In the report** (`in_daily_report`) | off → never named, even on days they punch |
  | **Senior** (`is_senior`) | never printed under Absent; still in the arrival list and On leave |
  | **Mark as left** (`is_active`) | gone from the register and every message; history kept |

  The tab opens with a live count — "N names can appear in the WhatsApp
  messages" — computed from the same three fields the server filters on, so
  the console and the message cannot drift apart. All three take effect on
  the next message; nothing is cached and there is nothing to re-publish.
- **`cb_employees.is_senior` keeps a name out of the Absent list, and
  nothing else.** Senior staff account for their own movements straight to
  the founder, so the register printing their name under Absent is not
  information — it is a name whose answer he already has, sitting in the one
  section that needs reading and pushing down the names that need a decision.

  The filter is deliberately narrow: a senior is dropped **only on days they
  have neither a punch nor an `hr_status`** — exactly the rows that would
  read as Absent. With a punch they appear in the arrival windows like
  everybody else; with an `hr_status` they still show under On leave, because
  HR recording something is a statement of fact rather than an accusation.
  So the counts always still match the names listed.

  It is **not** `in_daily_report = false`, which hides somebody on the days
  they do punch too, and **not** `is_active = false`, which means they have
  left. It lives in `cb_daily_attendance_report()` with the other report
  filter, so the HR console, the register and the CSV keep showing everyone.
  HR sets it from the Employees tab ("Mark senior").
- **Somebody who is not enrolled on the machine is left out of the report,
  and the gap is shown on the roster instead.** An active employee with no
  `device_code` can never produce a punch, so the register can only ever call
  them Absent — every day, forever, in the one section people actually read.
  They get `in_daily_report = false` (Pranav Arora and Sanjali kumari, 21 Sep).

  That is only safe because the roster tab now shows it: each row carries
  either `machine #<code>` or a **"Not on the machine"** badge, plus a
  **"Not in daily report"** badge, and the tab opens with an amber banner
  naming everybody unenrolled. Nothing on this console showed `device_code`
  before, so an unenrolled person looked exactly like an absent one. Hiding
  them from the report without surfacing them here would mean nobody ever
  enrols them.
- **The absent list is published to the group at 11:31, on the founder's
  explicit instruction.** He was told twice, plainly, that naming absent
  colleagues in a fifty-person group is the scoreboard the rest of this module
  avoids; he asked for it anyway, and it is his company. **Do not quietly
  remove it** — if it is ever to come off, that is his decision too.

  What is deliberately **not** published with it is the arrival roll-call: who
  walked in at 11:07 and who at 11:52. He asked for the absent list, so the
  absent list is what goes, and the minute-by-minute record of everybody else
  stays in his own 11:30 message. `buildAbsentSummary` returns null when
  nobody is absent, so a full-attendance day is silent rather than carrying a
  "nobody is absent today" nobody reads. On leave rides along only when there
  is an absent list to carry it — it is context, not news.

  It closes with "If any name here is wrong, please speak to HR", **not** an
  invitation to punch now: the 10:30 message said the register closes at
  11:30 and this is sent after that. A route to a person is honest recourse;
  reopening a register you just announced as closed is not.
- **The logout message does not claim anybody is still in the office.** It
  said "Still in office (15)", which is a fact the machine does not have: a
  missing check-out means either the exit punch was missed or the person is
  genuinely still there, and the two are identical from the register's side.
  It now reads "No check-out recorded" with the line *"Either the exit punch
  was missed, or they are still in the office."* — naming both possibilities
  is shorter than being wrong, and it hands the founder a question rather
  than a false conclusion.
- **Five messages a day, one function.** `kind` selects which:
  `morning` at **10:30 IST** (05:00 UTC); `attendance` at **11:30 IST**
  (06:00 UTC) — arrivals by window, plus absent
  and on leave; `absent` at **11:31 IST** (06:01 UTC); `reminder` at
  **18:45 IST** (13:15 UTC); `checkout` at
  **19:01 IST** (13:31 UTC) — who logged out and
  when, split `Before 18:00` / `18:00 – 19:00` / `19:00 onwards`, plus who is
  still checked in. `cb_report_log` is keyed on `(report_date, kind)`, so each
  is sent once a day and neither can suppress the other.

  19:01 is one minute after the 19:00 shift end, deliberately: what it catches
  is people who left **before** the end, which is the part worth a decision.
  Everyone still in the office appears under "Still checked in" rather than
  being omitted — a name in neither list is a bug.

  A check-out only exists when the day's last punch is at least an hour after
  the first. Somebody who tapped once and left has an arrival and no
  departure, and shows as still checked in — correctly, since the machine has
  no evidence they left.
- **`cb_ignored_device_codes` keeps the "unknown device codes" warning
  honest.** The founder's two IDs, pantry staff, a test card and the
  not-tracked staff punch every day; without this the bridge named all of
  them on every run, and a warning that is always there is one nobody reads.
  Anything the line still names is a real person nobody has mapped. Punches
  from ignored codes are still stored — deleting them would mean losing the
  evidence if one of those people ever does need tracking.
- The arrival summary is duplicated in `src/lib/attendanceReport.js` (console)
  and the function (cron). Change both or the two disagree. The checkout
  summary lives only in the function — the console has no Send button for it
  yet, and a copy nothing calls is a copy that drifts.

### `/admin/whatsapp` is the control room, not just a status page

Every recurring request in this module's first week was the same shape: *stop
that message*, *send it now*, *is so-and-so senior*, *what will it actually
say*. Each one needed a developer, and needing a developer to change a
sentence fifty colleagues will read is the real defect. The page now answers
all four.

- **The five messages, each its own card** — time, audience, what it says, an
  **on/off** switch, **Preview** and **Send now**. `MESSAGES` in
  `WhatsAppAdmin.jsx` is the single list the switches, previews and buttons
  all read from, so a message cannot appear in one place and be missing from
  another.
- **Preview is `dry_run` through the same Edge Function the cron calls**, so
  what it shows is what would go out — not a re-implementation that drifts.
  This is the change that makes the page usable by a founder: see the exact
  text fifty people are about to read, then decide.
- **`cb_hr_settings.wa_messages_enabled` is a per-message switch**, jsonb
  keyed by kind. **A missing key means ON**, so a message added later works
  before anybody touches the row — the alternative silently ships every new
  kind switched off. `daily_report_enabled` stays as the master switch above
  it. **An admin is exempt from the switch**: Preview and Send now still work
  on a paused message, because seeing what it would say is how you decide to
  un-pause it.
- **"Who the messages name" lives here too** — every active person with
  **In report** and **Senior / Junior** toggles, and a live count. The same
  controls are on the Attendance console's Employees tab; this copy exists
  because the question is asked while looking at the messages, not while
  looking at the roster. Adding, removing and machine-code mapping stay on
  the Attendance console, and the page says so.
- **The schedule is deliberately not editable here.** A schedule two screens
  can change is one nobody can trust; the times live in pg_cron. The page also
  no longer carries a second copy of the schedule list — it used to, and it
  went on claiming "12:10 arrivals, 19:01 logouts" for a day after the server
  had stopped running that.

### Call Pro AI is a different company's product. It is not ours.

**Capital Brix and Call Pro AI are separate systems with separate customers.
Call Pro AI's users — Fanbe, Ankita, anybody on their dashboard — have nothing
to do with Capital Brix, and nothing in this repo should ever read, write or
reason about them.**

The one thing the two share is a **WhatsApp login**: the founder's number
`7048917300` is linked as a device to the `callpro-baileys` worker, and Call
Pro AI sends its own product's messages through that same session. So messages
that were never composed here still leave from that phone. On 22 September a
*"Ankita | Daily Pulse | Fanbe … Auto Generated by Call Pro AI • Executive
Intelligence"* landed in a stranger's chat as an outgoing message from the
founder's WhatsApp, and it looked like Capital Brix had sent it.

**It did not come from here, and the proof is on this side, not theirs:**

- `cb_report_log` has sent to exactly **two** addresses, ever —
  `917048917300` and the group JID. Never that number, never any customer.
- The words *Daily Pulse*, *Fanbe*, *Ankita*, *Hot leads*, *Bookings*,
  *Executive Intelligence* appear nowhere in this repo except in comments that
  name Call Pro AI as the co-tenant of the session.
- `attendance-whatsapp` has no customer list to read from. It joins
  `cb_employees` to `cb_attendance` and nothing else.

**When something like this appears again, do not debug this repo.** Read
`cb_report_log`: if the target is not the founder's number or the group JID,
the message is not ours. The question is then who can drive the founder
session on the Call Pro AI dashboard, which is their console, not this code.

**The real fix is a WhatsApp number of our own.** One session serving two
products means each can be blamed for the other's messages, and neither
company can audit the other's dashboard. A separate number linked to the
worker — or a separate worker — ends the confusion permanently. Until then
this ambiguity is structural, not a bug to find.

### The WhatsApp connection console

`/admin/whatsapp` (admin-only, `noindex`, in `ADMIN_LINKS`) is where HR sees
whether the reports can actually leave the building, and re-links the phone
when they cannot.

It exists because the session that posts the register is **shared with Call Pro
AI**: it lives on a different dashboard, in another product's account, and
describes itself in that product's words — the failure we hit read *"the rep
needs to scan the QR again"*, which says nothing about Capital Brix
attendance. Worse, the only evidence anything was wrong was a `503` inside
`cb_report_log.detail`. Nobody was going to find that.

- **The page never holds the bearer token.** It calls the **`wa-session` Edge
  Function**, which is admin-JWT-only, holds `WA_WEBHOOK_TOKEN`, and proxies
  five actions: `status`, `qr`, `reconnect`, `test`, `groups`. It derives the worker's
  base URL by stripping `/send` off `WA_WEBHOOK_URL` rather than adding a
  second secret that can drift out of step; `WA_BASE_URL` overrides it.
- **The group is picked from a list, never typed.** A group's JID is shown
  nowhere inside WhatsApp, so setting `wa_group_id` used to mean SSHing into
  the worker and curling `/groups`. Nobody repeats that, which is how a wrong
  id sits in settings unnoticed — and a wrong id does not fail loudly, for the
  reason below: Baileys returns a message id for an address nobody holds. The
  `groups` action lists what the linked phone is in, and one click saves it.
  An empty list means the phone is not linked or the sending number is in no
  group at all.
- **There is no cron path in `wa-session` and there must not be one.** Every
  action either reveals the state of a WhatsApp account or sends a message.
- **The QR is polled, not fetched once.** It expires in seconds and the worker
  mints a fresh one, so a square fetched on page load is stale by the time a
  phone is unlocked. The poll also notices `connected` and stops on its own.
- `/health` is the one call that separates "the worker is down" from "the
  worker is up and logged out" — it needs no bearer and returns per-state
  session counts. Those two look identical from a failed send.
- **A phone number without its country code is accepted, acknowledged and
  delivered to nobody.** Baileys builds `<digits>@s.whatsapp.net` out of
  whatever it is handed, so `9999750049` produces a valid-looking JID for an
  account that does not exist — and returns a message id. The page went green,
  printed the id, and nothing arrived. `wa-session` therefore normalises: ten
  bare digits get `91`, a leading `0` is dropped, anything already carrying a
  code is left alone. `cb_hr_settings.founder_whatsapp` is stored as
  `917048917300` for the same reason; the fallback target is used verbatim.
  **A group JID is passed through whole by `wa-session`** — but that was
  only half the road, and the sentence that used to sit here ("which is why
  the group report worked") was wrong. **The worker did the same stripping
  one layer further down**, in its own `toJid()`:

  ```js
  const digits = String(phone || "").replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
  ```

  So `120363040760612538@g.us` reached Baileys as
  `120363040760612538@s.whatsapp.net`, an account that does not exist,
  and came back with a message id. **Every attendance report addressed to the
  group was logged `ok` and delivered to nobody** — for as long as the group
  was configured. Fixed in the worker on 21 September 2026: an address
  carrying an `@` is now returned untouched.

  The lesson is the one this module keeps relearning, and it is not about
  groups: **a message id is not delivery.** Two independent layers each
  "normalised" the same value, each looked correct alone, and the only
  evidence of the failure was that fifty people never saw a report. When a
  send looks fine and nothing arrives, check every hop that touches the
  address, not just ours.
- **The test result renders under the Send button, and stays there.** It
  first shipped as the page-wide flash banner at the very top — five screens
  above the button, gone after five seconds. The first person to use it
  pressed Send, saw nothing and reported that nothing had happened; the
  message had gone. It also now says when the target is the sending number
  itself, because WhatsApp files a message to yourself in the "Message
  yourself" chat rather than the chat list, which reads as silence.
- The page also owns `wa_group_id` and `daily_report_enabled`, and lists the
  last few `cb_report_log` rows with their `detail`, so the evidence that was
  buried in Postgres is the first thing on screen next time.

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

## Channel-partner recruitment

`/admin/partners` (admin-only, `noindex`, in `ADMIN_LINKS`) plus a **Channel
Partners** tab in the Employee Portal for the few people HR switches on.

The premise is **"who opened a real-estate business this week"**, not "every
broker in NCR". A newly registered agent needs inventory and a developer
relationship; an established one already has both. So `registered_on` is a
first-class column, the queue is ordered by it, and the console leads with
"Registered this week".

### Do not build a Google Maps scraper for this

The owner's first idea was crawling Google Maps for NCR brokers. It was not
built, and should not be:

- Scraping Maps breaches Google's terms, and the Places API forbids storing
  its content to build a database. The ban arrives **after** the work is done
  — an API key, sometimes the Google account — and there is nothing to fix.
- The data is bad for this purpose anyway: a Maps pin proves somebody paid for
  a listing, not that they are a working agent.

**The sources with a registration date are the ones that make "daily new"
possible at all:** state RERA agent registries (UP, Haryana, Delhi) and MCA
new incorporations filtered to real-estate activity. Both are published by
government for exactly this kind of verification, both carry the date, and a
RERA-registered agent is a better channel partner than a random pin.

Also worth knowing before anybody scales the calling: commercial calls in
India sit under TRAI's TCCCP 2018, and calling a DND-registered number is a
regulated offence rather than bad manners. That is why `do_not_contact` exists
and why it is one-way.

### How it holds together

```
registry CSV --> cb_import_partner_targets() --> cb_partner_targets
                                                       |
                        cb_assign_partner_targets() --> assigned_to (cb_employees)
                                                       |
                        Employee Portal tab (RLS: only your own rows)
```

- **`(source, source_ref)` is unique**, so the same registry file can be
  pasted every day for a month and never duplicate. On a conflict the import
  refreshes **only the source facts** — name, firm, phone, address,
  `registered_on`. **Status, owner, notes and follow-up dates are never
  overwritten by an import**; that is a week of calling silently undone.
  Verified against the live table before shipping.
- **Without a `source_ref` the importer derives one** from the RERA number, or
  from name+phone. A row with no stable key cannot be de-duplicated, and
  refusing it outright loses a lead nobody knows was dropped.
- **RLS is the boundary, not the UI.** A telecaller can select only rows where
  `assigned_to` resolves to them through `cb_my_employee()`, and their UPDATE
  policy has the same check on both sides — so they can work a row and cannot
  reassign one to themselves. They never see the queue and never see a
  colleague's list. `cb_employees.can_work_partners` only decides whether the
  tab is *shown*; hiding a tab is not security.
- **`do_not_contact` is one-way and global.** Set it and `cb_assign_partner_targets`
  never hands that name to anybody again. The telecaller's button for it is
  worded as a promise ("They asked not to be called again"), separate from the
  status buttons, because it is not a pipeline stage.
- **Assignment hands out the newest first** and skips rows another transaction
  has locked (`for update skip locked`), so two admins clicking at once cannot
  hand the same broker to two people.
- `cb_partner_board()` is the one place per-person counts are computed, same
  reason as the attendance RPCs: the console and any summary cannot disagree.
- The CSV parser in `src/lib/partnerTargets.js` handles quoted commas —
  registry addresses are full of them, and a naive split shifts every later
  column left, which puts a pin code in the phone field. Header names are
  matched loosely so most exports paste in unedited.
- **The outreach message names the relationship correctly**
  ("developed by Mirrikh Infratech Pvt. Ltd., marketed by Capital Brix LLP as
  an authorised sales channel partner") — the notice covers WhatsApp material,
  not only the website.



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

### `priceFrom` is the field that unblocks these pages

All 22 projects carry `price: 'On Request'` or `'Sold Out'` and not one real
number. That single gap explains three separate symptoms:

- Search Console reports the `Product` schema **invalid** — "Either 'price' or
  'priceSpecification.price' should be specified in 'offers'" — so no project
  page is eligible for any rich result. An `Offer` is therefore now emitted
  **only** when `project.priceFrom` is a number; without one the page ships a
  valid `Product` with no `Offer`. No Offer costs the price snippet; an invalid
  Offer costs the whole item.
- `<project> price` is the highest-intent query these pages can win, and a page
  that never states a number cannot answer it.
- "On Request" reads as "we will quote you depending on how you sound", which
  is the opposite of the title-clear, nothing-hidden position everywhere else.

Set `priceFrom: 7250` (rupees per sq yd, a plain number) and optionally
`priceFromUnit`, and the visible price block, the meta description and the
schema all pick it up with no code change. It is marked up as a
`UnitPriceSpecification` because the number is per square yard — marking a
per-yard rate as the price of a plot would publish a figure nobody can buy
anything for. Only put a number there that we will actually honour: a stale
rate is a misleading price claim of the same shape as the invented ₹2,500.

**Open contradiction for the owner, not for a tool to guess at:** the homepage
title leads with "from ₹7,250/sq yd" and the FAQ in `site.js` attributes that
rate to **Mayur Greenz II** — which is listed `Sold Out`. Either the rate needs
reattributing to a project someone can actually buy into, or the homepage title
needs a different lead. Do not simply copy ₹7,250 onto other projects to make
the schema validate.

### Every project page links to six siblings

Until this existed, `/projects` was the **only** page in the site linking to a
project detail page. All 22 sat at the same crawl depth behind one hub with
exactly one internal link each, and they are near-identical to begin with — so
a crawler worked through two or three and stopped. Search Console: 44 pages
submitted, **11 crawled, and one of the 11 was a project page.**

`siblingProjects()` in `ProjectDetail.jsx` takes the **next six in array
order, wrapping around** — not six by similarity and not six at random:

- Every project receives exactly six inbound links. A "most similar" rule
  piles links onto the popular projects and starves the ones that need
  discovering.
- It is stable across builds, so the link graph a crawler saw last week is the
  one it sees today. Random picks look like a different site on every render.

Project pages also now emit `BreadcrumbList`, which every other section already
had. Don't replace the sibling block with a carousel that renders client-side
only — the point is the `<a href>` in the prerendered HTML.

### Assistants and answer engines — `robots.txt`

`public/robots.txt` names the answer-engine crawlers **individually** and
allows each on the public site while refusing it the private consoles, rather
than leaving it to `User-agent: *`. The crawler that fetches a page to *answer*
a question is usually not the one that fetches it to train, and one operator
guessing wrong costs the citation:

- **`OAI-SearchBot`** is the one that decides whether we can be cited in
  ChatGPT. `ChatGPT-User` is browsing on a person's behalf; `GPTBot` is
  training.
- **`Google-Extended` is not a crawler** — it is the switch for whether pages
  Googlebot already has may be used in AI Overviews and Gemini. Blocking it
  removes us from the answer box and gains nothing.
- `PerplexityBot` / `Perplexity-User`, `ClaudeBot` / `Claude-User`,
  `Applebot-Extended` follow the same shape.

**Adding a private route means adding its `Disallow` to every block**, not just
the first — a per-agent block replaces `*` for that agent, it does not inherit
from it. That is the one real cost of listing them separately.

`public/llms.txt` is the companion: it names the nine guides and states the
relationship wording for anything that summarises the site rather than links it.

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
- **The form does its own validation, loudly.** It used to lean on the
  browser's `required`, which blocks the submit and shows a small native
  tooltip. On the first day the event page was live, the API received **eight**
  POSTs all day against far more people who said they had registered — somebody
  taps Reserve, the native bubble is missed, nothing seems to happen and they
  walk away believing they are on the list. Errors are now rendered in the
  layout with a red border, and the first bad field is scrolled to and focused.
  **Do not go back to bare `required`.** If sign-ups ever look short again,
  check the count of POSTs to `/rest/v1/cb_event_registrations` in the edge
  logs first — it separates "the form is turning people away" from "nobody
  came".
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
- **HR can add a seat by hand** from `/admin/events`. Registrations were lost
  twice — to a unique index that refused people, and to a form that failed
  quietly — and each time the only way to put someone back was a developer
  running SQL, which is no answer two days before an event. Bookings also come
  in by phone and at the desk. Only name and mobile are required; a seat with
  no email gets `no-email-<digits>@capitalbrix.invalid`, which keeps the NOT
  NULL column valid, is obviously not real to anyone reading it, and cannot
  collide. Every such row is stamped in `notes`, so a seat HR typed is never
  mistaken for one the person filled in themselves.
- HR console: `/admin/events` (admin-only, `noindex`), in `ADMIN_LINKS`. The
  headline figure is a **server-side `count`**, not the length of the loaded
  and filtered array — a filter left on used to make the hall look emptier than
  it was. When the two disagree the console says so and offers to clear the
  filters.
- RLS mirrors `cb_leads`: **anon may INSERT, only admins may SELECT/UPDATE.**
- **`src/lib/eventRegistration.js` mints the row id client-side and does NOT
  call `.select()` after the insert.** `RETURNING` needs a SELECT policy, and
  anon deliberately has none — an `.insert().select('id')` here fails every real
  registration even though the insert itself is allowed. Verified against the
  live policies, not assumed.
- **This table refuses nobody. There is no unique constraint and there must
  never be one again.** It went through three states in two days:
  unique on `(event_slug, lower(email))`, which rejected the second real person
  on any shared address and showed them a **success screen** anyway; then
  unique on `(event, name, phone, email)`, narrower but still a refusal; now
  none. A duplicate row costs HR ten seconds to spot. A rejected row costs a
  person who thinks they have a seat and does not. `cb_event_reg_person_lookup`
  is a plain index so HR can find a repeat fast — it does not reject.

  The double tap is handled where it belongs: the submit handler will not fire
  while a request is in flight.
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
- **Mail provider — SMTP, Gmail or Zoho, with the host derived from the
  address.** Set `SMTP_USER` (the mailbox) and `SMTP_PASSWORD` (an **app
  password** — neither provider accepts the account login password) and the
  function sends. `SMTP_HOST` comes from the domain of `SMTP_USER`
  (`@gmail.com` → `smtp.gmail.com`, Zoho → `smtp.zoho.in`), so the one
  configuration mistake that is easy to make — a Gmail address left pointing at
  the Zoho default — cannot be made. `SMTP_HOST`/`SMTP_PORT` still override.
  `EVENT_FROM_EMAIL` is **ignored when sending through Gmail**, because Google
  rewrites the From header to the authenticated account: printing a From line
  the provider overwrites is worse than sending from the address we are
  actually authenticated as. Gmail also caps at ~500 messages a day.
  `RESEND_API_KEY` is the alternative; SMTP wins if both are set. With neither,
  registrations still save and the page falls back to "our team will confirm on
  WhatsApp". Setup steps are in `supabase/functions/README.md`.

  The secrets go in **Project Settings → Edge Functions → Secrets**, which is
  not the Authentication → SMTP Settings page — that one only governs
  Supabase's own auth emails and has no effect here.
- **There is no "you had already registered" success. A pass is proof of a
  row.** `registerForEvent` used to read a `23505` as "your seat is held" and
  return no id; `EventPass` then drew the pass with `REF ——————`, because the
  reference is the last six characters of the row id. On 11 Sep 2026 at
  12:30:21 UTC that gave Sonia Gulati a saved, shareable pass for a seat the
  database had just refused — the blank REF was the only sign, and not one any
  registrant could be expected to read. Both halves are now closed: a `23505`
  takes the ordinary failure path (rescued to `cb_leads`, the person told the
  truth), and `EventPass` renders a "WhatsApp us" note instead of a pass when
  it has no row id. **Never reintroduce a success branch that has no id.**
  Exactly one person was hit — the full edge-log window from 10 Sep shows one
  `409` against every other POST at `201`. Her row was recovered by hand.

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
