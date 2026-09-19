#!/usr/bin/env node
/**
 * Punch bridge — office PC → Supabase.
 *
 * eTimeTrackLite has a "Parallel Database Export" that writes every punch it
 * downloads from the machine into a second database, as it downloads it. We
 * point that at a local MS SQL table we own (see schema.sql), and this script
 * forwards new rows from that table to Supabase.
 *
 * Why not point eTimeTrackLite straight at Supabase? Its Database Type list
 * offers MS SQL Server, MySQL and Oracle. Supabase is PostgreSQL, so there is
 * no direct option — hence this hop. It is about forty lines of real work.
 *
 * Why read the parallel table rather than eTimeTrackLite's own database?
 * Because we created the parallel table, so we know its columns will not move
 * under us on the next eSSL update, and a mistake here can never write to the
 * attendance software's own data.
 *
 * Design notes that matter if you change this:
 *
 * · It re-sends a LOOKBACK window every run instead of trusting a stored
 *   watermark. A watermark is one file away from being lost or corrupted, and
 *   losing it silently means losing punches. Re-sending is free because
 *   cb_ingest_punches is idempotent on (device_code, punch_at).
 *
 * · It holds the ingest secret, not the service-role key. This machine sits
 *   in an office where people use it; the worst a copied secret can do is
 *   submit punches.
 *
 * · Punch times from the machine are local IST with no zone attached. They
 *   are stamped +05:30 explicitly, because a bare timestamp is read as UTC by
 *   Postgres and would file everyone's arrival five and a half hours early.
 */

const sql = require('mssql');

const CFG = {
  // ── Supabase ──
  supabaseUrl: process.env.SUPABASE_URL || 'https://rqgkzamuohdvttnkluzn.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  ingestSecret: process.env.PUNCH_INGEST_SECRET || '',

  // ── Local MS SQL (the Parallel Database Export target) ──
  mssql: {
    server: process.env.MSSQL_SERVER || 'localhost',
    database: process.env.MSSQL_DATABASE || 'TimeTrack',
    user: process.env.MSSQL_USER || undefined,
    password: process.env.MSSQL_PASSWORD || undefined,
    options: {
      trustServerCertificate: true,
      // Windows login when no user/password is given, which is how a default
      // SQL Server Express install on an office PC is set up.
      trustedConnection: !process.env.MSSQL_USER,
      instanceName: process.env.MSSQL_INSTANCE || undefined,
    },
  },
  table: process.env.MSSQL_TABLE || 'AttendanceLogs',

  lookbackHours: Number(process.env.LOOKBACK_HOURS || 36),
  intervalSeconds: Number(process.env.INTERVAL_SECONDS || 120),
};

const log = (...a) => console.log(new Date().toISOString(), ...a);

/** IST has no daylight saving, so a fixed offset is correct all year. */
function toIsoIst(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}+05:30`;
}

async function readPunches(pool) {
  const since = new Date(Date.now() - CFG.lookbackHours * 3600 * 1000);
  const r = await pool.request()
    .input('since', sql.DateTime, since)
    .query(`
      select EmployeeCode, LogDateTime, Direction
      from ${CFG.table}
      where LogDateTime >= @since
      order by LogDateTime asc
    `);

  return r.recordset
    .filter((row) => row.EmployeeCode != null && row.LogDateTime)
    .map((row) => ({
      device_code: String(row.EmployeeCode).trim(),
      punch_at: toIsoIst(new Date(row.LogDateTime)),
      direction: row.Direction ? String(row.Direction).trim().toLowerCase() : null,
      device_name: null,
    }));
}

async function send(punches) {
  const res = await fetch(`${CFG.supabaseUrl}/rest/v1/rpc/cb_ingest_punches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: CFG.anonKey,
      Authorization: `Bearer ${CFG.anonKey}`,
    },
    body: JSON.stringify({ p_secret: CFG.ingestSecret, p_punches: punches }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ingest ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function tick(pool) {
  const punches = await readPunches(pool);
  if (!punches.length) return log('no punches in window');

  // Chunked so one run after a long outage does not send a single enormous
  // body that the API rejects, losing the whole catch-up.
  let stored = 0;
  const unknown = new Set();
  for (let i = 0; i < punches.length; i += 500) {
    const out = await send(punches.slice(i, i + 500));
    stored += out.stored || 0;
    (out.unknown_device_codes || []).forEach((c) => unknown.add(c));
  }

  log(`sent ${punches.length}, new ${stored}`);
  if (unknown.size) {
    // Not a crash — these punches are safely stored and will attach to the
    // right person the moment HR fills in the device code.
    log(`⚠ device codes with no employee on the roster: ${[...unknown].join(', ')}`);
    log('  Fix: /admin/attendance → Employees → set "Device code" to match the');
    log('  Emp Code column in the eSSL Employee Punch Monitor.');
  }
}

async function main() {
  for (const [k, v] of Object.entries({
    SUPABASE_ANON_KEY: CFG.anonKey,
    PUNCH_INGEST_SECRET: CFG.ingestSecret,
  })) {
    if (!v) {
      console.error(`${k} is not set. Copy .env.example to .env and fill it in.`);
      process.exit(1);
    }
  }

  const pool = await sql.connect(CFG.mssql);
  log(`connected to ${CFG.mssql.server}/${CFG.mssql.database}, reading ${CFG.table}`);

  const run = async () => {
    try {
      await tick(pool);
    } catch (e) {
      // Never exit on a bad tick. A dropped network or a locked table is
      // normal on an office PC, and the next run re-sends the same window
      // anyway — so there is nothing to recover, only to wait for.
      log('ERROR', e.message);
    }
  };

  await run();
  setInterval(run, CFG.intervalSeconds * 1000);
}

main().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});
