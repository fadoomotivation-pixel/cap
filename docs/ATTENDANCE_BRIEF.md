# Attendance, the eSSL machine, and the WhatsApp reports

**Hand this file to any AI tool or developer before they touch the attendance
module.** It is written to be pasted as a prompt on its own.

You are working on Capital Brix LLP's internal attendance system. It is live,
about fifty people depend on it, and five WhatsApp messages a day go out from
it to a company group. A mistake here is not a broken build — it is a wrong
sentence about a colleague, sent to everyone they work with. Read all of it.

`CLAUDE.md` in the repo root is the long-form memory: every decision below has
a paragraph there explaining what it cost to learn. This file is the map.

---

## 1. The shape of it

```
        ┌─ eSSL ZAM70 terminal (192.168.1.201, serial NYU7252102010)
        │
        ├─ ROAD 1 ─ eTimeTrackLite on the office PC → .mdb
        │           → integrations/punch-bridge (ettl-sync.ps1)
        │           → cb_ingest_punches()
        │
        └─ ROAD 2 ─ the terminal posts to us directly, over ZKTeco push/ADMS
                    → www.capitalbrix.co.in/iclock/*  (vercel.json rewrite)
                    → supabase/functions/essl-adms
                    → cb_ingest_punches()

                          ↓
                  cb_device_punches          raw taps, one row per tap
                          ↓  cb_fold_punches_into_attendance()
                  cb_attendance              one row per person per day
                          ↓  cb_daily_attendance_report()
                  supabase/functions/attendance-whatsapp
                          ↓  WA_WEBHOOK_URL  (a Baileys WhatsApp Web session)
                  the company group, and the founder
```

**There are two roads on purpose and you must not turn either off.**
`cb_device_punches` is unique on `(device_code, punch_at)`, so both can deliver
the same punch all day and the register cannot double-count. Road 1 is only as
awake as a desktop somebody might switch off — that already cost five silent
days in September. Road 2 keeps working with the PC off.

---

## 2. The five daily messages

| IST | `kind` | What it says | To |
|---|---|---|---|
| 10:30 | `morning` | juniors who HAVE punched so far — provisional | group |
| 11:30 | `attendance` | the register: arrival windows, absent, on leave, geofence | **group + founder** |
| 13:00 | `late` | recorded after the register closed | group |
| 13:05 | `welcome` | anybody whose first day this is | group |
| 19:02 | `evening` | logged out by departure window, no check-out, no attendance | group |

All five are one Edge Function, `attendance-whatsapp`, selected by `kind`.
`present`, `absent`, `reminder` and `checkout` still work by hand from
`/admin/whatsapp` but nothing schedules them.

### The editorial rules, which are not style

These were each learned the hard way and are enforced in code:

- **Never build a scoreboard.** The 10:30 message names who HAS punched, never
  who has not — somebody scanning for their own name learns the same thing
  without being held up in front of colleagues. The 13:00 message is headed
  "Register Update", not "Late Arrivals", for the same reason.
- **Group messages name juniors only** (`is_senior = false`). The 11:30
  register is the single exception: it is the whole company, which is what
  makes it the record rather than a roll-call, and it is the only message with
  two audiences.
- **Never publish a number the machine does not have.** "Still in office" was
  removed because a missing check-out means either a missed tap or a person
  still at their desk, and the two are identical from the register's side. It
  now names both possibilities.
- **Never describe time that has not happened yet.** The 11:30 windows end at
  11:30; the 18:45 message carried no departure windows for the same reason.
- **A usually-empty daily message is one people stop reading.** Every builder
  returns `null` when it has nothing, and the caller logs `ok` with a reason
  instead of sending.
- **Headcount is not published.** `Present 24 · Absent 5`, never `Strength 30`.
- **No emoji.** Ticks and crosses against colleagues' names read as a verdict.
- Every message signs off `— Capital Brix AI HR`. **"AI HR", not "HR"** — the
  team should know nobody is typing these. The two one-tap `wa.me` links a
  human actually sends (`CardsAdmin.jsx`, `EmployeePortal.jsx`) still say
  `Capital Brix HR`, because there a person is sending.

---

## 3. Rules you will break if nobody tells you

### Adding a message `kind` takes THREE places

1. the whitelist inside `cb_send_attendance_report()` (Postgres)
2. `KINDS` in `supabase/functions/attendance-whatsapp/index.ts`
3. `MESSAGES` in `src/pages/WhatsAppAdmin.jsx`

Miss the first and the cron raises `unknown report kind` **before** the HTTP
call — so `cb_report_log` gains no row, and "no row" looks exactly like "the
job never ran". This happened on 23 September and cost two messages.

**When a scheduled message does not arrive, read
`cron.job_run_details where status = 'failed'` BEFORE suspecting WhatsApp.**

### The register summary exists twice

`src/lib/attendanceReport.js` (the HR console) and the Edge Function (the
cron) each build it. **Change both or they disagree.** The evening and late
summaries live only in the function — the console has no Send button for them,
and a copy nothing calls is a copy that drifts.

### The fold resolves a person through `device_code`, never `employee_id`

`cb_fold_punches_into_attendance()` joins `cb_employees` on `device_code`. That
makes it self-healing: a punch recorded before the roster knew that code lands
in the register the moment somebody fills the code in.

**It also means reassigning a code rewrites history.** Code `11` carries 983
punches over 223 days. If you move it to another person and re-fold over old
dates, that person acquires somebody else's year. Fold **today only** after a
mapping change unless you have thought this through.

### `least()` / `greatest()` mean a re-fold cannot correct a time downward

Check-in takes the earliest of machine and portal, check-out the latest. So if
a wrong, earlier time is already stored, re-folding will **not** fix it — the
wrong one wins. Correcting stored times means updating `cb_attendance` first,
and only where the stored value equals the old punch exactly, which proves the
machine wrote it and protects a portal punch or an HR edit.

### `hr_status` is never touched by anything automatic

`leave` / `holiday` / `half-day` / `wfh-approved` / `on-duty` are HR's
decisions. "Absent" must keep meaning genuinely unaccounted for.

### A day with no punches is a broken feed, not an empty office

`attendance-whatsapp` counts `cb_device_punches` for the IST day first. Zero
sends a short warning to the founder naming the download step — never a
roll-call marking all fifty people absent.

### Times are IST, explicitly, everywhere

Punches arrive as the terminal's bare local clock and are stamped `+05:30` on
the way in. A bare timestamp is read as UTC and files every arrival 5½ hours
early. Arrival windows are computed from IST, never the browser's clock.

### Never send the terminal a `TimeZone`

The ADMS handshake used to answer `TimeZone=5.5`. The firmware reads that field
as an **integer number of hours**, so it became `5` and set the machine to
GMT+5:00 — exactly thirty minutes behind IST, on every contact, silently
undoing every manual fix. The line is gone and must not come back.

---

## 4. The files that matter

| Path | What it is |
|---|---|
| `supabase/functions/attendance-whatsapp/` | the five messages, and all their wording |
| `supabase/functions/essl-adms/` | the terminal's own endpoint: punches, commands, heartbeat |
| `supabase/sql/cb_send_attendance_report.sql` | the pg_cron entry point and its whitelist |
| `integrations/punch-bridge/` | the office-PC bridge (PowerShell + its own schema) |
| `integrations/wa-worker/` | our own Baileys sender, not yet switched on |
| `src/lib/attendanceReport.js` | the console's copy of the register summary |
| `src/pages/AttendanceAdmin.jsx` | `/admin/attendance` — register, roster, monthly, settings |
| `src/pages/WhatsAppAdmin.jsx` | `/admin/whatsapp` — the five message cards, preview, send |
| `src/pages/MachineAdmin.jsx` | `/admin/machine` — drive the terminal from a browser |

### The database objects

`cb_employees` · `cb_attendance` · `cb_device_punches` · `cb_device_users` ·
`cb_device_commands` · `cb_adms_log` · `cb_adms_state` · `cb_hr_settings` ·
`cb_report_log` · `cb_ignored_device_codes`

Computed in **one** place each, so the console, the CSV and the message can
never disagree: `cb_daily_attendance()` (console, admin JWT),
`cb_daily_attendance_report()` (cron, service role), `cb_new_joiners()`,
`cb_device_code_info()`, `cb_free_device_codes()`, `cb_set_device_code()`,
`cb_fold_punches_into_attendance()`, `cb_ingest_punches()`.

### The switches HR owns, without a developer

- `cb_hr_settings.daily_report_enabled` — master switch
- `cb_hr_settings.wa_messages_enabled` — jsonb per kind. **A missing key means
  ON**, so a message added later works before anybody edits the row
- `cb_employees.in_daily_report` — never named, even on days they punch
- `cb_employees.is_senior` — never printed under Absent, nothing else
- `cb_employees.is_active` — gone from everything; history kept
- `cb_employees.welcomed_at` — the welcome is once per person, ever

---

## 5. How to work on this

1. **`git fetch` first.** Several AI tools work in separate containers. Only
   what is pushed to GitHub is real. "I committed it locally" means nothing.
2. **Read the live schema, not a chat log.** `information_schema`,
   `pg_policies`, `pg_get_functiondef()`. They drift from any description.
3. **Verify against live data before shipping**, not after. Every claim in
   `CLAUDE.md` that reads like a fact was checked with a query first.
4. **Branch → PR into `main`.** Vercel auto-deploys `main`.
5. **`npx vite build` before pushing.** It is the only build check in the repo.
6. **Edge Function deploys are assembled by hand today**, so the repo is the
   authority and the deployed copy can drift from it. It already has. After
   changing a message, read back what actually went out — `cb_report_log`, or
   Preview on `/admin/whatsapp`.
7. **Never widen the blast radius to be helpful.** No `Clear Logs`, no
   `Clear Device`, never rename/delete/re-add the device in eTimeTrackLite —
   26,000+ punches are keyed on its code mapping.

### When something does not arrive, in this order

```sql
-- 1. did the cron even run?
select * from cron.job_run_details where status = 'failed' order by start_time desc;
-- 2. what did the function decide?
select * from cb_report_log order by sent_at desc limit 10;
-- 3. is the machine talking to us?
select * from cb_adms_log order by at desc limit 20;
-- 4. what did the device actually ask for?  (this named two bugs in one line)
select timestamp, event_message from logs
 where source = 'function_edge_logs' order by timestamp desc limit 20;
```

**A message id is not delivery.** This module's oldest failure: two layers each
"normalised" a group JID, each looked correct alone, and every report was
logged `ok` and delivered to nobody. When a send looks fine and nothing
arrives, check every hop that touches the address.

---

## 6. Two things that are not ours

- **Call Pro AI** is a different company's product. It shares only the founder's
  WhatsApp login. Its users — Fanbe, Ankita, anyone on their dashboard — have
  nothing to do with Capital Brix, and nothing in this repo should read, write
  or reason about them. If a strange message appears to come from us, read
  `cb_report_log`: if the target is not the founder's number or the group JID,
  it is not ours.
- **`public.attendance`** (no `cb_` prefix) belongs to the SalesAutoCall app.
  Never touch it. That is why every table here is namespaced `cb_*`.

---

## 7. Open, and genuinely undecided

- The WhatsApp session is still shared with Call Pro AI.
  `integrations/wa-worker/` is our own replacement and is written but not
  switched on: it needs a SIM, a box that runs a process and keeps a directory
  (**not** Vercel — see its README), and two secrets changed.
- Roughly forty machine codes map to nobody on the roster. Some are real people
  whose attendance is recorded nowhere.
- Code `11` reads **Pranav** on the machine and was reassigned to him in the
  roster on 24 September; Sandeep's 223 days stay on his own rows and code 11
  must not be re-folded over old dates.
