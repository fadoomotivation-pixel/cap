# Brief for Antigravity — office PC, punch sync

The sync is **built, deployed and running**. Punches reach Supabase every five
minutes, the scheduled task fires, and the register fills with real names and
times. Twenty-eight of thirty-one active employees are mapped to their machine code.

The history is in: **26,674 punches back to 15 November 2025** were imported
and folded into **2,922 attendance rows across 28 people**. The last ambiguous
mapping is settled — Amit is device code **59**, proved by an 11:18:10 punch on
9 September against HR's own handwritten "Amit - 11:18".

What is left is one live problem and one question. Task A is the problem and is
urgent.

Read `integrations/punch-bridge/README.md` before you start. This page is the
task; that page is the reasoning.

---

## Already done — do not rebuild, reinstall or re-route any of it

| | |
|---|---|
| Sync | `C:\CapitalBrix\punch-sync\ettl-sync.ps1`, reading `eTimeTrackLite1.mdb` |
| Scheduled task | `CapitalBrix-PunchSync`, every 5 min, last result `0x0` |
| Supabase | ingest, fold, report reader, `attendance-whatsapp` v3, two `pg_cron` jobs (12:10 IST attendance, 19:01 IST logout) |
| Mapping | 28 of 31 active employees have a `device_code` |
| Verified | 26,722 punches sent, a second run reports `new 0`, 2,922 attendance rows carry names, times and late flags |

**Parallel Database Export is not used and must not be touched.** Two days went
into it before `eTimeTrackLite1.mdb` was found; the record is at the bottom of
the README, and the files from those attempts sit in
`integrations/punch-bridge/abandoned/` precisely so nobody works on them again.
If you find yourself opening `diagnose.cmd`, `schema.sql` or
`schema.mysql.sql`, you are reading the wrong section.

---

## Task A — the device has stopped feeding eTimeTrackLite

**This is the only urgent item. Everything else on this page is answered.**

The register holds nothing after **19 September**, and 19 September itself is
half a normal day: 28 punches from 16 people, against 61 from 31 the day
before. 20 September was a Sunday, but **21 September is a Monday and at
13:33 IST the database had zero punches for it.** The `-All` run confirms it
from the other side — `DeviceLogs_9_2026` still holds exactly 1034 rows, the
same number it held days ago.

The sync script is not the problem. It read every table, sent 26,722 punches
and the scheduled task's last result is `0x0`. The gap is **upstream of it**:
eTimeTrackLite has stopped downloading from the device.

Check, in this order, and report what you find:

1. Open eTimeTrackLite → the device list. Is `192.168.1.201` showing
   **connected**? Report its exact status text.
2. `ping 192.168.1.201` — report the output.
3. In eTimeTrackLite, run **Download Logs** (or Device → Get Log Data) for
   19–21 September and report how many records it says it pulled.
4. If the device is unreachable, say so and stop. That is a cable, a power
   cut or a changed IP on the machine itself, and someone in the office has to
   look at it.

Do **not** reinstall, reconfigure or update eTimeTrackLite, and do not touch
the device's own settings. Report and stop.

---

## Task B — report the names behind five codes

The backfill's warning named five device codes that punch regularly and are on
nobody's roster row. Before any of them is mapped, the owner needs their names
as the machine has them. Print `EmployeeCodeInDevice`, `EmployeeName` and
`EmployeeCode` for codes **6, 41, 35, 52, 66**:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -Command "$c=New-Object System.Data.Odbc.OdbcConnection; $c.ConnectionString='Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb;ReadOnly=1;'; $c.Open(); $q=$c.CreateCommand(); $q.CommandText=\"select EmployeeCodeInDevice, EmployeeName, EmployeeCode from Employees where EmployeeCodeInDevice in ('6','41','35','52','66')\"; $r=$q.ExecuteReader(); while($r.Read()){ Write-Host ($r[0].ToString().Trim() + ' | ' + $r[1].ToString().Trim() + ' | ' + $r[2].ToString().Trim()) }; $r.Close(); $c.Close()"
```

Code `6` is the one that matters most: **1,132 punches since 15 November
2025**, which is a full-time employee nobody has on the roster. `41` has 261
and `35` has 248. `66` last punched on 29 July and is probably somebody who
left.

**Do not map any of them.** Names only.

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
