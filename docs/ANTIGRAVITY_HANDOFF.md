# Handoff prompt for Antigravity (or any other AI tool on this repo)

Paste the block below into Antigravity at the start of a session. It explains the
current state of the project and the rules that keep multiple AI tools from
overwriting or duplicating each other's work.

---

## PROMPT — copy from here

You are working on the **Capital Brix** repo (`fadoomotivation-pixel/cap`) —
a Vite + React 19 + Tailwind + Framer Motion site deployed on Vercel, backed by
Supabase. Read `CLAUDE.md` in the repo root first; it is the source of truth for
business facts, domains, schema and conventions.

### Critical: you are not the only tool working on this repo

Claude Code also works on this repository, in a **separate container with a
separate filesystem**. Your local commits are invisible to it and vice versa.
Only what is **pushed to GitHub** exists as far as anyone else is concerned.

This has already broken things twice:
- You reported an Interview Scheduler as "committed locally" — it wasn't pushed,
  so `/admin/interviews` 404'd on the live site and had to be rebuilt.
- Both tools then built the same feature simultaneously, and the duplicate had
  to be thrown away.

So, every session:
1. **Start with `git fetch origin && git log --oneline origin/<branch> -10`.**
   Someone else may have pushed since you last looked.
2. **Push before you finish.** Work that only exists locally is lost work.
3. **Verify before you rebuild.** If a feature is said to exist, check the remote
   branch for it rather than trusting a chat log.
4. **Read the real Supabase schema** (`information_schema.columns`, `pg_policies`,
   `pg_get_functiondef`) before writing code against it. Chat descriptions of the
   schema drift from what is actually deployed — this bit us on the scheduler,
   where the real table used `link_token`/`status` and not what the notes said.
5. Never invent a second copy of the admin-email list, the domain, or SEO
   metadata — each lives in exactly one file (see below).

### Deployment

`main` auto-deploys to production (`https://www.capitalbrix.co.in`) via Vercel.
Feature branches get preview deployments. There is no separate "builder memory"
to sync — GitHub is the only source of truth.

### Single sources of truth (do not duplicate these)

| Thing | Lives in |
|---|---|
| Admin emails | `src/lib/admin.js` (+ matching Postgres RLS policies) |
| Live domain / canonical | `SITE_URL` in `src/lib/seo.js` |
| Page metadata | `pageSeo` in `src/lib/seo.js` |
| Site copy, projects, FAQs | `src/data/site.js` |
| Blog content | `src/data/blogs.js` |

### What has been built so far

**Employee Portal** (`/employee-kyc`) — Supabase auth signup/login, multi-step KYC
form (personal details, documents, live photo capture), admin dashboard showing all
employee KYC records, upcoming birthdays, and document submission status.

**Interview Scheduler**
- `/admin/interviews` — HR admin: slot generation (configurable length, lunch-break
  skip, duplicate-safe), open slots grouped by day with delete/clear-day, shareable
  links (generic or single-use, optional expiry) with copy/WhatsApp/deactivate,
  upcoming interviews, searchable bookings with CSV export and cancel, stats cards.
- `/book/:token` — public booking page; validates link is active and unexpired,
  shows only future open slots.
- `/book/confirm/:bookingId` — confirmation with time, office address, map, directions.
- Double-booking is prevented in the **database**, not the UI: `book_interview_slot()`
  is a SECURITY DEFINER function doing an atomic `UPDATE ... WHERE status = 'open'`.
  Always book through that RPC; never insert into `interview_bookings` directly.

**SEO foundation** — per-route meta via `react-helmet-async` (`src/components/Seo.jsx`),
canonical pointing at the real live domain, 34-URL sitemap, robots.txt disallowing
private routes, JSON-LD (RealEstateAgent, FAQPage, Person for the founder, Product
per project).

### Security rules that must not be regressed

- RLS "admin" policies must check the **actual admin email list**, not just
  `authenticated` — otherwise any logged-in employee can edit everything. This was
  a real bug that got fixed; don't reintroduce it.
- Candidate PII (`interview_bookings`) must never be readable by the anon key with a
  blanket `using (true)` policy — that lets anyone dump every candidate's contact
  details. Public reads go through `get_booking_confirmation(booking_id)` only.
- Private routes (`/employee-kyc`, `/admin/*`, `/book/*`) must stay `noindex` and
  stay listed in `public/robots.txt`.

### Content rules

- Capital Brix is the **Official Strategy Partner of Mirrikh Infratech** — never
  "exclusive channel partner".
- **Do not name Mirrikh Infratech's founder anywhere on the site.** Reference the
  company instead. Our own founder, Jasvinder Singh (Jagran Achievers Award 2026),
  is named intentionally.

### Before you push

Run `npx vite build` — it is the only build check in the repo. Don't push a build
that fails.

## PROMPT — copy to here
