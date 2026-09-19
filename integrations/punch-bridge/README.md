# Biometric attendance → WhatsApp group

Every punch on the office eSSL machine reaches Supabase within two minutes,
and one summary goes to the team's WhatsApp group each evening. Nobody types
anything.

```
eSSL machine 192.168.1.201
      │  eTimeTrackLite downloads punches (already happening)
      ▼
Parallel Database Export  →  local MS SQL  TimeTrack.AttendanceLogs
      │  bridge.js, every 2 min
      ▼
Supabase  cb_device_punches  →  cb_attendance
      │  pg_cron, 7:30 PM IST  →  attendance-whatsapp Edge Function
      ▼
your Baileys service  →  WhatsApp group
```

## Which route

eTimeTrackLite's Database Type list offers **MS SQL Server, Oracle, My Sql** —
no PostgreSQL, so it cannot write to Supabase directly either way. Something
has to sit in between. Where that something lives is the choice:

| | **Route B — Hostinger MySQL** (recommended) | **Route A — local MS SQL** |
|---|---|---|
| On the office PC | nothing new | SQL Server Express, SSMS, Node, a scheduled task |
| Sync runs on | Hostinger cron, beside the Baileys service | the office PC |
| If the PC is off | punches queue on the device, nothing else breaks | nothing syncs |

**This office has no SQL Server at all** — `sc query` lists no SQL service and
the registry has no instance — so Route A starts with an installer and ends
with a second always-on program on a desktop people use. Capital Brix already
pays for MySQL on Hostinger. Use Route B.

eTimeTrackLite has to be open regardless, because it is what pulls punches off
the device. Route B just avoids adding anything *else* that can be closed by
accident.

---

# Route B — Hostinger MySQL

## 1 · Create the database

Hostinger hPanel → **Databases → MySQL Databases**. Create one (any name; the
panel prefixes it, e.g. `u123456789_attendance`) and note the user and
password — they are shown once.

Open **phpMyAdmin** for it and run **`schema.mysql.sql`** from this folder.

## 2 · Let the office PC reach it

hPanel → **Databases → Remote MySQL**. Add the office's public IP (search
"what is my IP" on the office PC). `%` allows any address — it works, but it
means anyone with the password can reach the database, so prefer the IP and
only fall back to `%` if the office connection has a changing IP.

If the ISP blocks outbound 3306 the connection will simply time out. Test from
the office PC before blaming eSSL:

```cmd
powershell -c "Test-NetConnection <mysql-host> -Port 3306"
```

## 3 · Point eTimeTrackLite at it

**Utilities → Parallel Database Export**

| Field | Value |
|---|---|
| Database Type | **My Sql** |
| Server Name / IP | the host from hPanel (not `localhost`) |
| Database Name | `u123456789_attendance` |
| User Name / Password | from step 1 |
| Table Name | `AttendanceLogs` |

Leave the field mapping alone, and **check `Employee Code = EmployeeCode` is
still filled in** — blank there means punches arrive with nobody attached to
them.

**Test Connection** → Save. Then **Utilities → Device Management** → tick
**Parallel Database Download** → **Start Download**.

If the MySQL option errors where MS SQL did not, install the **MySQL ODBC
Connector (32-bit)** — eTimeTrackLite is a 32-bit application and needs the
32-bit driver even on 64-bit Windows.

Punch once and check it arrived, in phpMyAdmin:

```sql
select * from AttendanceLogs order by LogDateTime desc limit 10;
```

## 4 · Run the sync on Hostinger

Upload **`hostinger-sync.php`** next to the Baileys service and fill in the
`$CFG` block at the top. Two values to fetch:

| Value | Where |
|---|---|
| `anon_key` | Supabase → Project Settings → API → anon public key |
| `ingest_secret` | Supabase → SQL Editor → `select secret from cb_integration_secrets where name = 'punch_bridge';` |

**The ingest secret is deliberately not the service-role key.** It can do
exactly one thing — submit punches. A service key on a web host would hand
over every row in the database.

Run it once by hand to check:

```
php hostinger-sync.php
```

Then hPanel → **Advanced → Cron Jobs**, every 2 minutes:

```
/usr/bin/php /home/USER/domains/<domain>/punch-sync/hostinger-sync.php
```

`db_host` stays `localhost` in the file — the cron runs on the same host as
the database, so that connection never leaves the server. Remote MySQL is
only for eTimeTrackLite reaching in from the office.

Skip to **step 3 · Match every employee to their machine code** below.

---

# Route A — local MS SQL Server

Only if Route B is impossible (no Remote MySQL on the plan, or the ISP blocks
3306). It needs SQL Server Express installed on the office PC first — this
one has none.

## 1 · On the office PC — create the table eSSL writes into

The Parallel Database Export screen already shows `TimeTrack` and
`AttendanceLogs`, but those are **placeholders eSSL ships with** — neither
exists yet, which is why **Test Connection** fails on a fresh install.

Open SQL Server Management Studio and run **`schema.sql`** from this folder.
It creates the database, the table, and an index, with column names that
match the mapping on that screen exactly — so you change nothing there.

Then in eTimeTrackLite:

1. **Utilities → Parallel Database Export**
2. Database Type **MS SQL Server**, Server `localhost`, Database `TimeTrack`,
   Table `AttendanceLogs`. Leave the field mapping as it is.
3. **Test Connection** → should pass now. **Save**.
4. **Utilities → Device Management** → tick **Parallel Database Download**
   (already ticked in your setup) → **Start Download**.

### "SQL Server does not exist or access denied"

```
[DBNETLIB][ConnectionOpen (Connect()).]SQL Server does not exist or access denied.
```

This is a **connection** failure, not a missing database — it never reached
the server, so whether `TimeTrack` exists is not the question yet. (Once it
connects, a missing database gives a different and much clearer error naming
`TimeTrack`. Seeing that is progress.)

Work down this list. The first item is the cause almost every time.

**1 · `localhost` is usually wrong — it is a named instance.**

eTimeTrackLite installs its own SQL Server Express instance, and a bare
`localhost` does not resolve to it. Find the real name:

```cmd
sc query state= all | findstr /i "MSSQL$"
```

`MSSQL$SQLEXPRESS` means the instance is `SQLEXPRESS`, so **Server Name / IP**
must read:

```
localhost\SQLEXPRESS
```

`.\SQLEXPRESS` works too. If the service shows as `MSSQLSERVER` with no `$`,
that is the default instance and plain `localhost` is correct — go to step 2.

**2 · Copy the connection eTimeTrackLite itself uses.**

The software is already talking to a SQL Server — that is where all your
employees and punches live. Whatever it connects with will work here. Open:

```
C:\Program Files (x86)\eSSL\eTimeTrackLite\eTimeTrackLite.exe.config
```

in Notepad and search for `Data Source`. That value is the answer, including
the user and password if it uses SQL authentication.

**3 · Blank User Name / Password.**

Left blank, eSSL attempts SQL authentication with an empty user, which the
server refuses — and reports as *access denied*. Put in the `sa` account and
the password set during the eTimeTrackLite install (step 2 shows it).

**4 · TCP/IP is switched off.**

SQL Server Express ships with TCP/IP disabled. Open **SQL Server
Configuration Manager** → *SQL Server Network Configuration* → *Protocols for
SQLEXPRESS* → **TCP/IP** → *Enable*, then restart the **SQL Server
(SQLEXPRESS)** service.

**5 · SQL Server Browser is not running.**

Named instances are resolved by this service, so `localhost\SQLEXPRESS` fails
without it. `services.msc` → **SQL Server Browser** → Start, and set Startup
type to *Automatic* so it survives a reboot.

Whatever server name ends up working here, use the same one in the bridge's
`.env` — `MSSQL_SERVER=localhost` plus `MSSQL_INSTANCE=SQLEXPRESS`.

---

Punch on the machine once and check the table has a row:

```sql
select top 10 * from TimeTrack.dbo.AttendanceLogs order by LogDateTime desc;
```

Nothing after a punch means eSSL is not exporting — re-check step 3.

---

## 2 · On the office PC — run the bridge (Route A only)

Install [Node.js LTS](https://nodejs.org), then in this folder:

```
npm install
copy .env.example .env
```

Fill in `.env`. Two values you need to fetch:

| Value | Where |
|---|---|
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `PUNCH_INGEST_SECRET` | Supabase → SQL Editor → `select secret from cb_integration_secrets where name = 'punch_bridge';` |

**The ingest secret is deliberately not the service-role key.** This PC is
used by people; the worst a copied ingest secret can do is submit punches. A
service key there would hand over every row in the database.

Test it:

```
npm start
```

You should see `connected to localhost/TimeTrack` and `sent N, new N`.

### Keep it running

Task Scheduler → Create Task:

- **General** → *Run whether user is logged on or not*
- **Triggers** → *At startup*, and tick *Repeat every 5 minutes* →
  *for: Indefinitely* (so a crash restarts itself)
- **Actions** → Start a program
  - Program: `C:\Program Files\nodejs\node.exe`
  - Arguments: `-r dotenv/config bridge.js`
  - Start in: this folder's full path

---

---

# Both routes

## 3 · Match every employee to their machine code

This is the step that decides whether the report has names in it.

The machine calls people `1`, `2`, `3`, `10`… (the **Emp Code** column in the
eSSL Employee Punch Monitor). Our roster does not know those numbers, so
until they are filled in, punches arrive and attach to nobody.

For each person, set **`cb_employees.device_code`** to their Emp Code.

The bridge tells you who is missing on every run:

```
⚠ device codes with no employee on the roster: 6, 17, 22
```

Those punches are **not lost** — they sit in `cb_device_punches` and attach
themselves the moment you fill the code in and the next fold runs.

---

## 4 · Point it at your WhatsApp group

### The bit worth knowing first

**Meta's official WhatsApp Cloud API cannot post to a group.** It only
messages individual numbers. Groups need a logged-in WhatsApp Web session,
which is what Baileys gives you — you already run one.

So this Edge Function does not contain a WhatsApp client. It builds the text
and POSTs it to your service. Two consequences:

- If the summary stops arriving, **check the Baileys session is still logged
  in before suspecting anything here.** That is the fragile part.
- Use a **separate company SIM**, not the founder's personal number.
  Automated group posting is outside WhatsApp's terms and numbers do get
  banned. Losing a spare SIM is an afternoon; losing the founder's number is
  every customer conversation on it.

### Supabase → Project Settings → Edge Functions → Secrets

| Secret | Value |
|---|---|
| `WA_WEBHOOK_URL` | your Baileys endpoint that sends a message |
| `WA_WEBHOOK_TOKEN` | whatever token it expects (optional) |
| `CRON_SECRET` | `select secret from cb_integration_secrets where name = 'report_cron';` |

Default body posted to your endpoint:

```json
{ "to": "120363XXXXXXXXXXXX@g.us", "text": "*CAPITAL BRIX — Attendance* …" }
```

If your service expects a different shape, don't change your service — set
`WA_PAYLOAD_TEMPLATE` instead, e.g.

```json
{"chatId":"{{to}}","message":"{{text}}"}
```

`{{to}}` and `{{text}}` are substituted already JSON-escaped, so a message
containing quotes or newlines cannot break the template.

### The group JID

Not a phone number — a group is `120363XXXXXXXXXXXX@g.us`. Any Baileys
session can list the groups it is in; take the id of yours and set it:

```sql
update cb_hr_settings
   set wa_group_id = '120363XXXXXXXXXXXX@g.us',
       daily_report_enabled = true;
```

Leave `wa_group_id` blank and the report falls back to the founder's number
from `founder_whatsapp` — a summary that reaches one person beats one that
reaches nobody because a JID was mistyped.

---

## Testing before you trust it

Dry run — builds the real summary, sends nothing (needs an admin login):

```bash
curl -X POST 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp' \
  -H 'Authorization: Bearer <your admin JWT>' \
  -H 'Content-Type: application/json' \
  -d '{"dry_run": true}'
```

Send a specific day for real:

```bash
-d '{"date": "2026-09-19", "force": true}'
```

`force` overrides the once-a-day rule. Without it, the cron firing twice, a
retry after a timeout, and HR tapping Send all collapse to one message —
`cb_report_log` is keyed on the date.

Every attempt, successful or not, is recorded:

```sql
select * from cb_report_log order by report_date desc limit 14;
```

A failed send that leaves no trace is how a team finds out three weeks later
that nobody has seen a report.

---

## Two rules the folding applies

- **A second punch less than an hour after the first is the same arrival
  tapped twice, not a departure.** Your own monitor shows `10:35,10:35,` —
  without this rule everyone would show zero hours worked.
- **The machine never overrides a person or HR.** Check-in takes the earliest
  of machine and portal, check-out the latest, and `hr_status` — an approved
  leave — is never touched. The register already treats "Absent" as
  *genuinely unaccounted for*, and a machine must not undo that.
