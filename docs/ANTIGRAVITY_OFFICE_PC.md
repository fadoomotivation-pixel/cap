# Brief for Antigravity — office PC, punch sync

The sync is **built, deployed and running**. Punches reach Supabase every five
minutes, the scheduled task fires, and the register fills with real names and
times. Twenty-eight of thirty-one active employees are mapped to their machine code.

The history is in: **26,674 punches back to 15 November 2025** were imported
and folded into **2,922 attendance rows across 28 people**. The last ambiguous
mapping is settled — Amit is device code **59**, proved by an 11:18:10 punch on
9 September against HR's own handwritten "Amit - 11:18".

What is left is restarting the device's log download, which stopped on
Saturday — Task A, and the only urgent item on this page.

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

## Task A — restart the log download (the device is fine)

Diagnosed, and it is **not** a network problem. `192.168.1.201` answers ping
with 0% loss. eTimeTrackLite's own `Devices` row says:

```
LastLogDownloadDate : 09/19/2026 11:09:04
DevicesStatus       : online at 09/19/2026 11:14:48   (nothing after that)
```

Both `eTimeTrackLite.exe` and `eSSL Online Downloader.exe` are running, in the
tray, with `MainWindowHandle: 0`. So the downloader process is alive and has
simply not polled the device since Saturday midday. The punches are still
**inside the device's own memory** — nothing is lost yet, but eSSL terminals
overwrite the oldest logs when their buffer fills, so this is worth doing today
rather than next week.

Do this on the PC's screen:

1. Restore the eTimeTrackLite window from the system tray.
2. **Device → Download Logs** (some builds call it *Get Log Data* or
   *Download Attendance Logs*), pick device `192.168.1.201`, date range
   **19-Sep-2026 to 21-Sep-2026**, and run it. Report how many records it says
   it pulled.
3. Confirm it worked by re-reading the database — this needs no GUI:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -Command "$c=New-Object System.Data.Odbc.OdbcConnection; $c.ConnectionString='Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb;ReadOnly=1;'; $c.Open(); $q=$c.CreateCommand(); $q.CommandText='select count(*) from DeviceLogs_9_2026'; Write-Host ('DeviceLogs_9_2026 rows: ' + $q.ExecuteScalar()); $c.Close()"
```

It held **1034** rows before. A higher number means the download worked.

4. Then run the sync once so the new punches reach Supabase:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1
```

5. Finally, report **why the downloader stopped**: in eTimeTrackLite, open the
   device's settings and say whether *Auto Download* / *Online Download* is
   ticked and what interval it is set to. Report it — do not change it.

The device is registered as **`Test Device`, device id 14**. Do not rename,
re-add or delete it. A re-added device can renumber the mapping between a
person and their code, and every historical punch is keyed on that code.

---

## Task B — three people punch daily and are on no roster row

Answered. The names behind the five unmapped codes are:

| Code | Name on the machine | Punches | Still punching? |
|---|---|---|---|
| `6` | Amit | 1,132 since 15 Nov 2025 | 3 in September, all single evening taps |
| `41` | Gaurav | 261 | yes, to 18 Sep |
| `35` | Kunal | 248 | yes, to 18 Sep |
| `52` | Anjali Tripathi | 136 | yes, to 19 Sep |
| `66` | Amit | 39 | no, stopped 29 July |

**Gaurav, Kunal and Anjali Tripathi are with the owner**, who decides whether
each is an employee to add to the roster, somebody deliberately not tracked, or
a card to ignore. Nothing to do on the PC.

The three Amits are settled: the roster's Amit is **`59`**. In September, `59`
punched on ten working days arriving around 11:00 and leaving around 19:00,
while `6` produced three lone evening taps and `66` nothing at all.

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
