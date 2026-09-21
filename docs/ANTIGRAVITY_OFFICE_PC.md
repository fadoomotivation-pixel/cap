# Brief for Antigravity — office PC, punch sync

The sync is **built, deployed and running**. Punches reach Supabase every five
minutes, the scheduled task fires, and the register fills with real names and
times. Twenty-nine of thirty-two active employees are mapped to their machine code.

The history is in: **26,674 punches back to 15 November 2025** were imported
and folded into **2,922 attendance rows across 28 people**. The last ambiguous
mapping is settled — Amit is device code **59**, proved by an 11:18:10 punch on
9 September against HR's own handwritten "Amit - 11:18".

What is left is Task A: the device's log download stopped on Saturday, and the
reason turns out to be that it was never automatic in the first place. It needs
somebody at the PC's screen.

Read `integrations/punch-bridge/README.md` before you start. This page is the
task; that page is the reasoning.

---

## Already done — do not rebuild, reinstall or re-route any of it

| | |
|---|---|
| Sync | `C:\CapitalBrix\punch-sync\ettl-sync.ps1`, reading `eTimeTrackLite1.mdb` |
| Scheduled task | `CapitalBrix-PunchSync`, every 5 min, last result `0x0` |
| Supabase | ingest, fold, report reader, `attendance-whatsapp` v3, two `pg_cron` jobs (12:10 IST attendance, 19:01 IST logout) |
| Mapping | 29 of 32 active employees have a `device_code` |
| Verified | 26,722 punches sent, a second run reports `new 0`, 2,922 attendance rows carry names, times and late flags |

**Parallel Database Export is not used and must not be touched.** Two days went
into it before `eTimeTrackLite1.mdb` was found; the record is at the bottom of
the README, and the files from those attempts sit in
`integrations/punch-bridge/abandoned/` precisely so nobody works on them again.
If you find yourself opening `diagnose.cmd`, `schema.sql` or
`schema.mysql.sql`, you are reading the wrong section.

---

## Task A — read the device directly, and stop depending on a click

The sync currently reads `eTimeTrackLite1.mdb`, which only fills when somebody
clicks **Download** in eTimeTrackLite. `Devices.DownLoadType = 1` means manual,
and that single fact stopped the register for five days in September while
every automated check stayed green.

The setting that fixes it lives in the **eSSL Online Downloader**'s tray
window, which a background agent cannot reach. So stop needing it: the device
speaks its own protocol on **192.168.1.201:4370**, and a script on this PC can
read the punches itself. eTimeTrackLite then keeps doing its own thing for HR's
local reports, and our chain no longer passes through it.

**Build `C:\CapitalBrix\punch-sync\zk-direct\`:**

1. Check for Node (`node -v`). If it is missing, install the current LTS.
2. `npm init -y` and `npm i node-zklib`.
3. A script that, every run:
   - connects to `192.168.1.201:4370` (comm key `0` — the device shows
     `Comm Key 000000`),
   - reads the attendance logs,
   - keeps only the last **36 hours**,
   - POSTs them to `cb_ingest_punches`,
   - **disconnects**, every time, including on error.

The request is exactly what `ettl-sync.ps1` already sends, so copy the URL, the
anon key and the ingest secret out of that file rather than asking for them:

```
POST https://rqgkzamuohdvttnkluzn.supabase.co/rest/v1/rpc/cb_ingest_punches
apikey: <AnonKey>        Authorization: Bearer <AnonKey>

{ "p_secret": "<IngestSecret>",
  "p_punches": [ { "device_code": "59",
                   "punch_at": "2026-09-22T10:18:04+05:30",
                   "direction": null, "device_name": null } ] }
```

Four things that are not negotiable, each of which has already cost a day:

- **`punch_at` must carry `+05:30`.** The device reports bare local time; a
  bare timestamp is read as UTC and files every arrival five and a half hours
  early.
- **`device_code` is the device's own user id** — the number on the machine
  (1, 13, 59, 95…), which is `Employees.EmployeeCodeInDevice`, not the email
  and not `employee_code`.
- **Re-send a window, do not keep a watermark.** A watermark is one lost file
  away from losing punches. `cb_device_punches` is unique on
  `(device_code, punch_at)`, so re-sending is free.
- **Never clear the device's logs.** Its memory is the last backup; the whole
  19-21 September recovery worked only because the punches were still in it.

Then a scheduled task, **every 5 minutes**, same shape as
`CapitalBrix-PunchSync`. Leave that existing task running: both are idempotent,
and two sources are how we find out if one stops.

**Report back:** the Node version, whether the connection opened, how many
records were read, and the exact JSON `cb_ingest_punches` returned
(`stored` and `unknown_device_codes`).

**If the device refuses the connection, stop and say so.** Do not retry in a
loop and do not try other ports — an eSSL terminal can be made unresponsive by
a client that opens sessions and never closes them, and it is the only copy of
the day's attendance.

---

## Task A — the download was never automatic

Diagnosed, and it is neither the network nor the bridge. `192.168.1.201`
answers ping with 0% loss, the sync reads every table without error, and the
scheduled task's last result is `0x0`. The cause is in eTimeTrackLite's own
settings:

```
Devices.DownLoadType            = 1        ← 1 means MANUAL
eSSL_Schedular.exe.config
  AutoStart                     = False    ← the scheduler never starts
  drp_DeviceLogsHour/Min        = 12 / 12
Devices.LastLogDownloadDate     = 19/09/2026 11:09:04
DevicesStatus                   = online at 19/09/2026 11:14:48, nothing after
```

So punches only ever reached the PC when **a person clicked Download**, and
they stopped on the 19th because nobody clicked again. Everything downstream —
the bridge, the fold, the register, the 12:10 report — has been sitting on top
of a manual step nobody knew was there.

The punches are still in the terminal's own memory, so nothing is lost yet.
**eSSL terminals overwrite their oldest logs once that buffer fills**, so this
is a deadline rather than an inconvenience.

**This needs a person at the PC's screen** (or AnyDesk/TeamViewer). A
background agent cannot restore a tray window and walk a Windows Forms menu,
and that limit is real — do not work around it by editing the `.mdb`.

1. Restore eTimeTrackLite from the system tray.
2. **Device → Download Logs** (some builds: *Get Log Data* / *Download
   Attendance Logs*), device `192.168.1.201`, **19-Sep-2026 to 21-Sep-2026**.
3. In the same screen, turn the download **automatic** so this cannot recur:
   set the device's download type to Auto/Online with an interval of a few
   minutes, and tick **AutoStart** on the eSSL scheduler so it survives a
   reboot. This is the one settings change that is wanted — everything else on
   that screen stays as it is.
4. Verify from the database (no GUI needed). It held **1034** rows before:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -Command "$c=New-Object System.Data.Odbc.OdbcConnection; $c.ConnectionString='Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb;ReadOnly=1;'; $c.Open(); $q=$c.CreateCommand(); $q.CommandText='select count(*) from DeviceLogs_9_2026'; Write-Host ('rows: ' + $q.ExecuteScalar()); $c.Close()"
```

5. The scheduled task runs every five minutes, so the new punches reach
   Supabase on their own. Run it once by hand if you want it immediately.

The device is registered as **`Test Device`, device id 14**. Do not rename,
re-add or delete it: a re-added device can renumber the mapping between a
person and their code, and every one of the 26,722 historical punches is keyed
on that code.

---

## Task B — three people punch daily and are on no roster row

Answered. The names behind the five unmapped codes are:

| Code | Name on the machine | Punches | Still punching? |
|---|---|---|---|
| `6` | Amit | 1,132 since 15 Nov 2025 | 3 in September, all single evening taps |
| `41` | Gaurav | 261 | yes, to 18 Sep |
| `35` | Kunal | 248 | yes, to 18 Sep |
| `52` | Anjali Tripathi | 136 | yes — **now on the roster** |
| `66` | Amit | 39 | no, stopped 29 July |

Anjali Tripathi is now on the roster and mapped to `52`; her 65 days of
history folded in on their own. **Gaurav (`41`) and Kunal (`35`) are still with
the owner**, who decides whether each is an employee to add, somebody
deliberately not tracked, or a card to ignore. Nothing to do on the PC.

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
