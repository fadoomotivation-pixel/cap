# Biometric attendance → WhatsApp group

Every punch on the office eSSL machine reaches Supabase within minutes, and one
summary goes to the team's WhatsApp group each evening. Nobody types anything.

```
eSSL device 192.168.1.201
      │  eTimeTrackLite downloads punches (already happening, unchanged)
      ▼
C:\Program Files (x86)\essl\eTimeTrackLite\eTimeTrackLite1.mdb
      │  ettl-sync.ps1, every 5 min, read-only
      ▼
Supabase   cb_ingest_punches() → cb_device_punches → cb_attendance
      │  pg_cron 19:30 IST → attendance-whatsapp Edge Function
      ▼
Baileys service → WhatsApp group
```

**Everything from Supabase rightwards is already built, deployed and tested.**
What remains is the office PC: two PowerShell scripts and a scheduled task.

---

## The route: read eTimeTrackLite's own database

eTimeTrackLite stores everything in **MS Access** — `eTimeTrackLite1.mdb`, 442
MB, in its install folder. So the punches are already on the PC, and the Access
ODBC driver needed to read them is already installed, because eTimeTrackLite
itself uses it.

That means **Parallel Database Export is not used and does not need to work.**
No MySQL, no SQL Server, no ODBC connector to install, no DSN. It also means
months of history are available, not just punches from today onward.

### Everything below was learned by looking, not assuming

Four facts the software does not advertise, each of which breaks the sync if
ignored. They are handled in the scripts; they are written down because the
next person will not otherwise believe them:

- **`DeviceLogs` is empty.** Verified: 0 rows, while `DeviceLogs_9_2026` held
  1034. eSSL rolls punches into monthly `DeviceLogs_<month>_<year>` tables, so
  the sync reads the current month, the previous month, *and* plain
  `DeviceLogs`. Read only the obvious table and the register stops every 1st
  of the month, silently.
- **`Direction` and `AttDirection` are always blank.** The machine records no
  in/out at all — just a timestamp per tap. This is why the fold rule is what
  it is: first punch of the day is the arrival, last is the departure, and a
  second tap inside 60 minutes is neither.
- **`DeviceLogs.UserId` is the machine's own code**, matching
  `Employees.EmployeeCodeInDevice` — not `EmployeeCode`, not an email.
- **Deleted employees stay in the table**, renamed `del_<name>` with their
  device code zeroed. Both tests are needed when filtering.

### Anything 32-bit stays 32-bit

eTimeTrackLite installs into `C:\Program Files (x86)`, so it is a 32-bit
application, and the Access ODBC driver is registered **32-bit only**. Every
script here must run under:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe
```

Run from the normal 64-bit PowerShell they fail with `IM002 Data source name
not found`, which says nothing about the real cause. Both scripts check and
refuse rather than letting that happen.

---

## 1 · Put the scripts on the office PC

Copy from this folder into `C:\CapitalBrix\punch-sync\`:

- `ettl-sync.ps1`
- `ettl-employee-map.ps1`

Open `ettl-sync.ps1` and set **`$IngestSecret`**:

```
Supabase → SQL Editor →
select secret from cb_integration_secrets where name = 'punch_bridge';
```

**That is deliberately not the service-role key.** This is a desktop people
use; the worst a copied ingest secret can do is submit punches. A service key
there would hand over every row in the database.

Nothing else in the file needs changing — the Supabase URL and the public anon
key are already filled in.

## 2 · Map every employee to their machine code

This step decides whether the report has names in it. The machine knows people
as `1`, `3`, `4`, `32`, `52`, `102`; until those are on the roster, punches
arrive and attach to nobody.

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-employee-map.ps1
```

It prints ready-to-run SQL out of eSSL's own mapping — paste it into the
Supabase SQL editor. It matches on **name**, the only field both systems
share, so run the check query it prints at the end: anyone still without a
`device_code` needs doing by hand.

Punches for an unmapped code are **not lost**. They sit in `cb_device_punches`,
and because the fold resolves the person through `device_code` at fold time —
never through anything stored on the punch — they attach themselves the moment
the code is filled in. Re-run the fold for the dates concerned:

```sql
select cb_fold_punches_into_attendance('2026-09-01'::date, current_date);
```

## 3 · Test the sync

Reads and reports, sends nothing:

```
… -File C:\CapitalBrix\punch-sync\ettl-sync.ps1 -DryRun
```

Then for real:

```
… -File C:\CapitalBrix\punch-sync\ettl-sync.ps1
```

Expect `DeviceLogs_9_2026 : 240` and `sent 240, new 240`. Run it twice — the
second run should say `new 0`, which is the idempotency doing its job.

`-All` imports every month in the database instead of the recent window, to
backfill the register in one go.

## 4 · Schedule it

Task Scheduler → Create Task:

- **General** → *Run whether user is logged on or not*
- **Triggers** → *At startup*, tick *Repeat every 5 minutes* → *Indefinitely*
- **Actions** → Start a program
  - Program: `C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe`
  - Arguments: `-ExecutionPolicy Bypass -File C:\CapitalBrix\punch-sync\ettl-sync.ps1`
  - Start in: `C:\CapitalBrix\punch-sync`

The **32-bit** PowerShell path, for the reason above.

## 5 · Point the report at the WhatsApp group

Supabase → **Project Settings → Edge Functions → Secrets** (*not* the
Authentication → SMTP Settings page):

| Secret | Value |
|---|---|
| `WA_WEBHOOK_URL` | the Baileys endpoint that sends a message |
| `WA_WEBHOOK_TOKEN` | whatever token it expects (optional) |
| `CRON_SECRET` | `select secret from cb_integration_secrets where name = 'report_cron';` |

Then:

```sql
update cb_hr_settings
   set wa_group_id = '120363XXXXXXXXXXXX@g.us',
       daily_report_enabled = true;
```

**Meta's official WhatsApp Cloud API cannot post to a group** — it only
messages individual numbers. Groups need a logged-in WhatsApp Web session,
which is what Baileys is. So the Edge Function contains no WhatsApp client: it
builds the text and POSTs it. **If the report stops arriving, check the Baileys
login before suspecting anything else** — that session is the fragile part.

Default body is `{"to": …, "text": …}`. If the Baileys endpoint wants another
shape, do not change the endpoint — set `WA_PAYLOAD_TEMPLATE`, e.g.
`{"chatId":"{{to}}","message":"{{text}}"}`. Substitution is JSON-escaped, so
quotes and newlines in a message cannot break it.

Use a **separate company SIM**, not the founder's number. Automated group
posting is outside WhatsApp's terms and numbers do get banned. Losing a spare
SIM is an afternoon; losing the founder's number is every customer
conversation on it.

---

## Checking it afterwards

```sql
-- punches arriving
select count(*), max(punch_at) from cb_device_punches;

-- anyone the machine knows and the roster does not
select distinct p.device_code
from cb_device_punches p
left join cb_employees e on e.device_code = p.device_code
where e.id is null;

-- today's register
select * from cb_daily_attendance(current_date);

-- every report send, successful or not
select * from cb_report_log order by report_date desc limit 14;
```

---

## Abandoned: Parallel Database Export

Two days went into exporting from eTimeTrackLite to an external database
before the `.mdb` was found. Recorded so nobody repeats it.

The Database Type list offers **MS SQL Server, Oracle, My Sql** — no
PostgreSQL, so it can never reach Supabase directly, and something always has
to sit in between. Both attempts died:

- **Local MS SQL Server.** `[DBNETLIB] SQL Server does not exist or access
  denied`, through every instance spelling. Cause: `sc query` lists no SQL
  service and the registry has no registered instance — **this PC has no SQL
  Server at all**, because eTimeTrackLite never needed one.
- **MySQL on Hostinger.** Network was fine — both 3306 and the SSH port tested
  open, the database and table were created, Remote MySQL was allowed, and a
  System DSN tested **Connection Successful**. eTimeTrackLite still answered
  `IM002` with the MySQL ODBC 5.3 driver registered and a working DSN named in
  every field that could take one. It asks ODBC for something that could not
  be made to exist, and ODBC tracing produced no log to say what.

If anyone ever revisits this, the diagnostic that would settle it is ODBC
tracing with **Machine-Wide tracing** ticked — the per-user setting produced
no file. `diagnose.cmd`, `schema.sql` and `schema.mysql.sql` in this folder
belong to those attempts and are kept only as a record.

The `.mdb` route is better anyway, and not only because it works: it needs
nothing installed, it cannot be broken by an eSSL settings screen, and it can
read history that Parallel Export would never have produced.
