# Brief for Antigravity — finish the punch sync on the office PC

The sync is **already built, deployed and running**. Punches reach Supabase,
the scheduled task fires, and the register fills with real names and times.

What is left is data, not code: seven people on the roster still have no
machine code, because their names are ambiguous on the machine and nobody may
guess. Your job is to produce the evidence that settles them.

Read `integrations/punch-bridge/README.md` before you start. This page is the
task; that page is the reasoning.

---

## Already done — do not rebuild, reinstall or re-route any of it

| | |
|---|---|
| Sync | `C:\CapitalBrix\punch-sync\ettl-sync.ps1`, reading `eTimeTrackLite1.mdb` |
| Scheduled task | `CapitalBrix-PunchSync`, every 5 min, last result `0x0` |
| Supabase | ingest, fold, report reader, `attendance-whatsapp` v2, `pg_cron` at 06:40 UTC (12:10 IST) |
| Mapping | 24 of 31 active employees have a `device_code` |
| Verified | 48 punches ingested, second run `new 0`, 9 attendance rows for 19 Sep with names, times and late flags |

**Parallel Database Export is not used and must not be touched.** Two days
went into it before `eTimeTrackLite1.mdb` was found; the record is at the
bottom of the README, and the files from those attempts sit in
`integrations/punch-bridge/abandoned/` precisely so nobody works on them
again. If you find yourself opening `diagnose.cmd`, `schema.sql` or
`schema.mysql.sql`, you are reading the wrong section.

---

## Task 1 — the punch-frequency table (the actual job)

Seven roster names cannot be matched because the machine has several
candidates, or the right one is not obvious:

| Roster name | Candidates on the machine |
|---|---|
| Amit | `6 Amit`, `59 Amit`, `66 Amit` |
| Abhishek kumar | `19 Abhishek Kumar`, `61 Abhishek` — and **61 is the one punching** |
| Jai Prakash | `70 Jai`, `56 JP sir` |
| Kamal | only `18 Kamal Mishra` exists, and the roster has a separate "Kamal Mishra" |
| jasveer singh chaudhary | `1 Mr. Jasvinder`, `57 Jasvinder Sir 2` — both are the founder's IDs, so probably neither |
| Pranav Arora | nothing on the machine |
| Sanjali kumari | nothing on the machine |

The owner's rule for Amit is *"whichever code has punched in the last 15
days"*. The same evidence settles the others, so produce it once, for every
code:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -Command "$c=New-Object System.Data.Odbc.OdbcConnection; $c.ConnectionString='Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb;ReadOnly=1;'; $c.Open(); $names=@{}; $cm=$c.CreateCommand(); $cm.CommandText='select EmployeeCodeInDevice, EmployeeName from Employees'; $r=$cm.ExecuteReader(); while($r.Read()){ $names[\"$($r[0])\".Trim()]=\"$($r[1])\".Trim() }; $r.Close(); $since=(Get-Date).AddDays(-15).ToString('yyyy-MM-dd HH:mm:ss'); $cnt=@{}; $last=@{}; foreach($t in @('DeviceLogs','DeviceLogs_9_2026','DeviceLogs_8_2026')){ try{ $q=$c.CreateCommand(); $q.CommandText=\"select UserId, LogDate from [$t] where LogDate >= {ts '$since'}\"; $rr=$q.ExecuteReader(); while($rr.Read()){ $u=\"$($rr[0])\".Trim(); if(-not $u){continue}; $cnt[$u]=[int]$cnt[$u]+1; $d=[datetime]$rr[1]; if(-not $last[$u] -or $d -gt $last[$u]){ $last[$u]=$d } }; $rr.Close() } catch {} }; Write-Host 'CODE | PUNCHES | LAST | NAME'; $cnt.Keys | Sort-Object { -$cnt[$_] } | %{ Write-Host ($_ + ' | ' + $cnt[$_] + ' | ' + $last[$_].ToString('dd MMM HH:mm') + ' | ' + $names[$_]) }; $c.Close()"
```

**Return the whole table verbatim.** Do not decide the mappings yourself and
do not run any `UPDATE` against Supabase. A wrong code puts one person's
arrival time under another person's name in a report the founder reads — worse
than a blank.

---

## Task 2 — confirm the sync is still healthy

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
- **The "unknown device codes" line.** It now lists only codes that need a
  decision; the founder's two IDs, pantry staff, a test card and the
  not-tracked staff are filtered out by `cb_ignored_device_codes`. **Anything
  it names is a real person nobody has mapped** — report it, do not map it.

---

## Task 3 — backfill the history (only after Task 1 is answered)

`eTimeTrackLite1.mdb` holds **26,722 punches back to November 2025**. Parallel
Export would never have produced those, and they are worth having.

Do this **after** the owner has confirmed the seven mappings, not before:
folding history now would write months of attendance rows under whichever
names happen to be mapped today, and re-folding does not delete a row created
for the wrong person.

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1 -All
```

Importing punches is safe on its own — `cb_device_punches` is idempotent and
folding is a separate step. Say when it is done and how many landed; the fold
across the full range is run from Supabase, not from the PC.

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

**The `.mdb` is read-only and there is no second copy.** It is the company's
entire attendance history, and eTimeTrackLite has it open while you read —
that open handle is the `.ldb` beside it, and Access allows the read. Never
write to it, move it, compact it, repair it or copy over it.

**Do not run any `UPDATE`, `INSERT` or `DELETE` against Supabase.** Produce
evidence and hand it back. Every mapping so far was decided by a human looking
at two lists side by side, and the ambiguous ones are ambiguous for a reason.

**Do not enable the WhatsApp report.** `daily_report_enabled` stays false
until the mappings are settled. Switched on now, the first message tells 31
people's manager that seven of them were absent when they were not.

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
