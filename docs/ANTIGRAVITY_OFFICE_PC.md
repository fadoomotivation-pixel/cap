# Brief for Antigravity — office PC, punch sync

The sync is **built, deployed and running**. Punches reach Supabase every five
minutes, the scheduled task fires, and the register fills with real names and
times. Twenty-seven of thirty-one active employees are now mapped to their
machine code.

Two things are left. Task A is one query — the last ambiguous mapping. Task B
is the history backfill, which is now unblocked.

Read `integrations/punch-bridge/README.md` before you start. This page is the
task; that page is the reasoning.

---

## Already done — do not rebuild, reinstall or re-route any of it

| | |
|---|---|
| Sync | `C:\CapitalBrix\punch-sync\ettl-sync.ps1`, reading `eTimeTrackLite1.mdb` |
| Scheduled task | `CapitalBrix-PunchSync`, every 5 min, last result `0x0` |
| Supabase | ingest, fold, report reader, `attendance-whatsapp` v3, two `pg_cron` jobs (12:10 IST attendance, 19:01 IST logout) |
| Mapping | 27 of 31 active employees have a `device_code` |
| Verified | punches ingested, a second run reports `new 0`, attendance rows carry names, times and late flags |

**Parallel Database Export is not used and must not be touched.** Two days went
into it before `eTimeTrackLite1.mdb` was found; the record is at the bottom of
the README, and the files from those attempts sit in
`integrations/punch-bridge/abandoned/` precisely so nobody works on them again.
If you find yourself opening `diagnose.cmd`, `schema.sql` or
`schema.mysql.sql`, you are reading the wrong section.

---

## Task A — settle "Amit", and report two undecided codes

The machine has **three** enrolled Amits — `6 Amit`, `59 Amit`, `66 Amit` — and
the roster has one. `66` is already eliminated: zero punches in fifteen days.
`6` and `59` both punch, so frequency alone does not separate them.

What separates them is HR's own handwritten list for **9 September 2026**,
which records **"Amit - 11:18"**. Exactly one of the two codes punched near
11:18 that morning. Run this and return the output verbatim:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -Command "$c=New-Object System.Data.Odbc.OdbcConnection; $c.ConnectionString='Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb;ReadOnly=1;'; $c.Open(); foreach($t in @('DeviceLogs','DeviceLogs_9_2026')){ try{ $q=$c.CreateCommand(); $q.CommandText=\"select UserId, LogDate from [$t] where UserId in ('6','59','66') and LogDate >= {ts '2026-09-09 00:00:00'} and LogDate < {ts '2026-09-10 00:00:00'} order by LogDate\"; $r=$q.ExecuteReader(); while($r.Read()){ Write-Host ($t + ' | ' + $r[0] + ' | ' + ([datetime]$r[1]).ToString('dd MMM HH:mm:ss')) }; $r.Close() } catch { Write-Host ($t + ' | ERROR ' + $_.Exception.Message) } }; $c.Close()"
```

Also report, from the fifteen-day table you already produced, the punch count
and last punch for **`52 Anjali Tripathi`** and **`35 Kunal`**. Both are on the
machine, neither is on the roster, and the owner has not said what they are.

**Do not decide any mapping and do not run any `UPDATE` against Supabase.** A
wrong code files one person's arrival under another person's name in a report
the founder reads every day at 12:10 — worse than a blank.

Three roster names are **not enrolled on the machine at all**:
`jasveer singh chaudhary` is now mapped to code `32` by the owner, but
`Pranav Arora` and `Sanjali kumari` have no code anywhere in `Employees`.
Nothing on the PC can fix that — HR has to enrol them on the device. Just
confirm they are genuinely absent from the table.

---

## Task B — backfill the history (run it now)

`eTimeTrackLite1.mdb` holds **26,722 punches back to November 2025**. Parallel
Export would never have produced those, and they are worth having.

This was previously gated on the mappings being settled. It no longer is, and
the reason matters: **the fold resolves a person through `device_code` at fold
time, not through anything stored on the punch.** An unmapped code produces no
attendance row at all — it does not produce a wrong one — and the moment the
code is filled in, every punch already stored attaches itself. So importing
history early costs nothing and loses nothing.

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1 -All
```

It sends in batches of 500 and `cb_device_punches` is unique on
`(device_code, punch_at)`, so a re-run is safe and a partial run can simply be
repeated. Report the per-table counts it prints and the final `sent N, new N`.

The fold across the full range is run from Supabase afterwards, **not** from
the PC.

---

## Task C — confirm the sync is still healthy

Report the actual output of each, not a summary:

```
schtasks /query /tn "CapitalBrix-PunchSync" /v /fo LIST | findstr /i "Status Result Run"
```

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1
```

Two things to check in that second output, both of which have caught real
problems already:

- **The per-table counts.** `DeviceLogs : 0` is correct and expected — eSSL
  rolls punches into monthly `DeviceLogs_<month>_<year>` tables and the live
  one is empty. A **zero on the current month's table during a working day**
  is the real alarm.
- **The "unknown device codes" line.** It lists only codes that need a
  decision; the founder's two IDs, pantry staff and the not-tracked staff are
  filtered out by `cb_ignored_device_codes`. **Anything it names is a real
  person nobody has mapped** — report it, do not map it.

---

## Hard rules

**Everything runs under 32-bit PowerShell.** eTimeTrackLite lives in
`Program Files (x86)` and the Access ODBC driver is registered 32-bit only, so
the 64-bit host fails with `IM002 Data source name not found` — an error that
says nothing about its own cause and already cost an afternoon. Always:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe
```

The script detects the 64-bit host and refuses. **Do not "fix" that check.**

**Never edit `$IngestSecret` to a placeholder.** A second
`$IngestSecret = 'placeholder-for-dryrun'` was once added *below* the real
line. PowerShell takes the last assignment, so every sync would have failed
"not authorised" while the script's own missing-secret check still passed —
silent, and caught only by reading the diff. There is exactly one assignment
in that file and it holds the real secret.

**The `.mdb` is read-only and there is no second copy.** It is the company's
entire attendance history, and eTimeTrackLite has it open while you read —
that open handle is the `.ldb` beside it, and Access allows the read. Never
write to it, move it, compact it, repair it or copy over it.

**Do not run any `UPDATE`, `INSERT` or `DELETE` against Supabase.** Produce
evidence and hand it back. Every mapping so far was decided by a human looking
at two lists side by side, and the ambiguous ones are ambiguous for a reason.

**Do not enable the WhatsApp report.** `daily_report_enabled` stays false
until the owner switches it on with the Baileys endpoint in place.

**Do not change the fold rules or the arrival windows.** They look arbitrary
and are not: the machine records **no in/out direction at all** and it logs
double taps (its own monitor shows `10:35,10:35,`), so the first punch of a
day is the arrival, the last is the departure, and a second tap inside 60
minutes is neither. The windows — `Till 10:30`, `10:30–11:00`, `11:00–12:00`,
`After 12:00` — match the format HR already sends by hand, and every present
person must land in exactly one of them.

---

## If something fails

Say what failed, with the exact error, and stop. Specifically do not:

- fall back to Parallel Database Export
- install any ODBC driver to get past an error
- write anything into the `.mdb`
- guess a mapping to make a warning go away
