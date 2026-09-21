# Brief for Antigravity — set up the punch sync on the office PC

You have control of the office Windows PC. This is a **setup and verification**
job on that machine. Nothing in the repo needs changing, and nothing on
Supabase needs building — that side is deployed and tested already.

Read `integrations/punch-bridge/README.md` in full before you start. This page
is the task; that page is the reasoning.

---

## What already exists — do not rebuild any of it

On Supabase (project `rqgkzamuohdvttnkluzn`), live:

- `cb_device_punches`, `cb_integration_secrets`, `cb_report_log`
- `cb_ingest_punches(secret, punches)` — idempotent on `(device_code, punch_at)`
- `cb_fold_punches_into_attendance()` — folds punches into `cb_attendance`
- `cb_daily_attendance_report()` — the report reader, granted to `service_role`
- `attendance-whatsapp` Edge Function, v1
- `pg_cron` job `cb-daily-attendance-whatsapp`, 14:00 UTC = 19:30 IST
- `cb_employees.device_code`, `cb_hr_settings.wa_group_id`,
  `cb_hr_settings.daily_report_enabled`

In the repo, on branch `claude/biometric-whatsapp-attendance` (PR #50):

- `integrations/punch-bridge/ettl-sync.ps1`
- `integrations/punch-bridge/ettl-employee-map.ps1`

The owner has already created `C:\CapitalBrix\punch-sync\` on the PC.

---

## The job

### 1 · Place the scripts

Copy both `.ps1` files from the repo into `C:\CapitalBrix\punch-sync\`.

In `ettl-sync.ps1`, replace `PASTE_THE_INGEST_SECRET_HERE` with the value of:

```sql
select secret from cb_integration_secrets where name = 'punch_bridge';
```

Ask the owner for it if you cannot reach Supabase. **Do not substitute the
service-role key** — the ingest secret exists precisely so a desktop people use
never holds a key that can read the whole database.

### 2 · Run the employee mapping

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-employee-map.ps1
```

It prints `UPDATE` statements. Run them in Supabase, then run the check query
it prints last and **report who is still without a `device_code`** — those are
people whose punches will attach to nobody until fixed by hand. Do not guess
at a name match; hand the list back.

### 3 · Test the sync, twice

```
… -File C:\CapitalBrix\punch-sync\ettl-sync.ps1 -DryRun
… -File C:\CapitalBrix\punch-sync\ettl-sync.ps1
… -File C:\CapitalBrix\punch-sync\ettl-sync.ps1
```

Expected: a per-table count, then `sent N, new N` — and on the **second real
run, `new 0`**. A second run that stores rows again means idempotency is
broken; stop and report it rather than scheduling it.

### 4 · Schedule it

Task Scheduler → Create Task:

- General → *Run whether user is logged on or not*
- Triggers → *At startup*; tick *Repeat every 5 minutes* → *Indefinitely*
- Actions → Start a program
  - Program: `C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe`
  - Arguments: `-ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1`
  - Start in: `C:\CapitalBrix\punch-sync`

Then confirm it actually fired on its own — run it from the task list, and
check Last Run Result is `0x0`. A task that only works when you run the script
by hand is not done.

### 5 · Verify end to end, and report numbers

```sql
select count(*) as punches, max(punch_at) as newest from cb_device_punches;
select * from cb_daily_attendance(current_date);
```

Then have someone punch on the machine, wait five minutes, and confirm the row
appears. **Report the actual figures**, not "it works".

---

## Hard rules

**Everything here runs under 32-bit PowerShell.** eTimeTrackLite is a 32-bit
app in `Program Files (x86)` and the Access ODBC driver is registered 32-bit
only, so the 64-bit host fails with `IM002 Data source name not found` — an
error that says nothing about its own cause. Always:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe
```

Both scripts detect the 64-bit host and refuse. **Do not "fix" that check.**

**Do not touch Utilities → Parallel Database Export.** It is not part of this
design and two days were lost to it. Leave its settings exactly as they are.

**Do not install SQL Server, MySQL, or any ODBC connector.** Nothing here needs
one. The Access driver is already present because eTimeTrackLite uses it.

**Everything reads `eTimeTrackLite1.mdb` read-only, while eTimeTrackLite has
it open** — that open handle is the `.ldb` file beside it, and Access allows
it. Never write to, move, compact, repair or copy-over that file. It is the
company's entire attendance history and there is no second copy.

**Do not change the fold rules** in `cb_fold_punches_into_attendance()`. They
look arbitrary and are not: the machine writes **no** in/out direction, and it
records double taps (the eSSL monitor shows `10:35,10:35,`), so the first
punch of a day is the arrival, the last is the departure, and a second tap
inside 60 minutes is neither. Both cases were verified against the live
function before shipping.

**Do not enable the WhatsApp report yet.** `daily_report_enabled` stays false
until punches are confirmed arriving — a report sent while the sync is still
being set up tells 31 people's manager that everyone was absent.

---

## If it fails

Say what failed with the exact error, and stop. Specifically do not:

- switch to the Parallel Database Export route "as a fallback"
- install any driver to get past an ODBC error
- write anything into the `.mdb`

The two most likely problems, both already handled in the scripts — if you see
either, the cause is elsewhere and worth reporting:

- `DeviceLogs` reads as empty. It genuinely is; eSSL rolls punches into
  `DeviceLogs_<month>_<year>` and the script reads current month, previous
  month and `DeviceLogs` together.
- Punch times land five and a half hours early. `LogDate` is bare local IST;
  the script stamps `+05:30` explicitly for exactly this reason.
