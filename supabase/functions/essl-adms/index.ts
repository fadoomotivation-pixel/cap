import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// The attendance terminal talking to us directly.
//
// Until now every punch reached Supabase by way of the office PC:
//
//   machine -> eTimeTrackLite -> .mdb -> ettl-sync.ps1 -> cb_ingest_punches
//
// which means the register is only as awake as that desktop. It has already
// cost five silent days: eTimeTrackLite's download was set to manual, nobody
// clicked it, and the register simply stopped while every check stayed green.
// A PC that is switched off, asleep, updating or logged out is the same
// failure with a different cause.
//
// The eSSL ZAM70 terminal in the office speaks the ZKTeco "push" (ADMS)
// protocol - firmware ZAM70-NF24HA-Ver3.3.12, Push Ver 3.1.2S - which means it
// can post its own punches over HTTP to a server, with nothing else running.
// This is that server:
//
//   GET  /iclock/cdata?SN=..&options=all   handshake; we answer with config
//   POST /iclock/cdata?SN=..&table=ATTLOG  the punches themselves
//   GET  /iclock/getrequest?SN=..          "any commands for me?" - always no
//   POST /iclock/devicecmd                 command results - accepted, ignored
//
// It is deliberately a *second* road, not a replacement. cb_device_punches is
// unique on (device_code, punch_at), so the PC bridge and the terminal can
// both send the same punch all day and the register cannot double-count. Turn
// neither off: whichever one is alive keeps attendance working.
//
// Auth: the terminal cannot send a bearer token - it has no field for one.
// What it does send, on every request, is its serial number, and only one
// terminal is ours. So the serial is the credential, and the worst a forged
// one can do is submit punches (the same ceiling the PC bridge has). It never
// gets the service-role key: the ingest secret is read here and handed to
// cb_ingest_punches, which is the same door the bridge knocks on.
//
// Secrets: ADMS_ALLOWED_SN (comma-separated; defaults to the office terminal).

const ALLOWED_SN_DEFAULT = "NYU7252102010";

/** Punch times arrive as the terminal's own wall clock, which is IST. */
const IST = "+05:30";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * Plain text, CRLF, no JSON.
 *
 * The device is not a browser and does not parse anything else; a JSON body
 * or a bare LF is read as a failed transfer and it retries forever.
 */
function text(body: string, status = 200) {
  return new Response(body.replace(/\n/g, "\r\n"), {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function allowedSerials(): string[] {
  return (Deno.env.get("ADMS_ALLOWED_SN") ?? ALLOWED_SN_DEFAULT)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Every contact is written down.
 *
 * With the PC out of the loop there is no longer a screen in the office that
 * shows whether the terminal is talking to anybody. "Did it reach us, and
 * when" has to be answerable from here, or a stall is invisible again.
 */
async function log(entry: Record<string, unknown>) {
  await admin.from("cb_adms_log").insert(entry).then(() => {}, () => {});
}

/** The ingest secret the PC bridge uses. Read here, never shipped anywhere. */
async function ingestSecret(): Promise<string | null> {
  const { data } = await admin
    .from("cb_integration_secrets")
    .select("secret")
    .eq("name", "punch_bridge")
    .maybeSingle();
  return data?.secret ?? null;
}

/**
 * One ATTLOG line.
 *
 * Tab separated: PIN, time, status, verify mode, work code, then reserved
 * fields that differ between firmwares. Only the first two are load-bearing,
 * and the rest are read defensively for that reason.
 *
 * `status` is the terminal's in/out flag, and on this machine it is not
 * trustworthy - people tap the same key on the way in and the way out. The
 * register already decides direction from the times themselves (earliest is
 * the arrival, latest is the departure, and a second tap inside an hour is
 * the same arrival tapped twice), so the flag is recorded and not acted on.
 */
function parseAttlog(body: string): { device_code: string; punch_at: string }[] {
  const out: { device_code: string; punch_at: string }[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const f = line.split("\t");
    const pin = (f[0] ?? "").trim();
    const when = (f[1] ?? "").trim();
    if (!pin || !when) continue;
    // "2026-09-21 10:35:00" -> an instant, stamped IST explicitly. A bare
    // timestamp is read as UTC and would file every arrival 5.5 hours early.
    const m = when.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
    );
    if (!m) continue;
    const [, y, mo, d, hh, mi, ss] = m;
    out.push({
      device_code: pin,
      punch_at: `${y}-${mo}-${d}T${hh}:${mi}:${ss ?? "00"}${IST}`,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Vercel rewrites /iclock/* here, and Supabase prefixes /functions/v1/<fn>,
  // so match on the last meaningful segment rather than the whole path.
  const path = url.pathname.replace(/\/+$/, "").split("/").pop()?.toLowerCase() ??
    "";
  const q = url.searchParams;
  const sn = (q.get("SN") ?? q.get("sn") ?? "").trim();

  if (!sn || !allowedSerials().includes(sn.toUpperCase())) {
    await log({
      path,
      method: req.method,
      sn: sn || null,
      note: "refused - serial not allowed",
    });
    return text("Unauthorized", 401);
  }

  // "Any commands for me?" - asked every few seconds. There are none, and
  // there must not be: this endpoint receives attendance, it does not drive
  // the terminal. Nothing here can enrol, delete or unlock anybody.
  if (path === "getrequest") return text("OK");

  // The terminal reporting how a command went. We send none, so this only
  // ever arrives after a reboot; accept it so the device does not retry.
  if (path === "devicecmd" || path === "ping") return text("OK");

  if (path === "cdata" && req.method === "GET") {
    await log({ path, method: "GET", sn, note: "handshake" });
    // Realtime=1 is the point of the whole exercise: the terminal pushes each
    // punch as it happens instead of waiting to be asked. TransTimes is the
    // belt-and-braces catch-up window for anything a dropped connection lost.
    return text(
      [
        `GET OPTION FROM: ${sn}`,
        "Stamp=9999",
        "OpStamp=9999",
        "ATTLOGStamp=9999",
        "ErrorDelay=30",
        "Delay=10",
        "TransTimes=00:00;12:00",
        "TransInterval=1",
        "TransFlag=1111000000",
        "TimeZone=5.5",
        "Realtime=1",
        "Encrypt=0",
        "",
      ].join("\n"),
    );
  }

  if (path === "cdata" && req.method === "POST") {
    const table = (q.get("table") ?? "").toUpperCase();
    const body = await req.text();

    // OPERLOG (door opened, menu entered, user enrolled) and ATTPHOTO are not
    // attendance. Accept them so the terminal clears them from its queue -
    // an unacknowledged upload is retried until it blocks the punches behind
    // it - and record nothing.
    if (table && table !== "ATTLOG") {
      await log({
        path,
        method: "POST",
        sn,
        table_name: table,
        note: "accepted, not attendance",
      });
      return text("OK");
    }

    const punches = parseAttlog(body);
    if (!punches.length) {
      await log({
        path,
        method: "POST",
        sn,
        table_name: "ATTLOG",
        rows_in: 0,
        note: "empty upload",
      });
      return text("OK: 0");
    }

    const secret = await ingestSecret();
    if (!secret) {
      await log({
        path,
        method: "POST",
        sn,
        table_name: "ATTLOG",
        rows_in: punches.length,
        note: "punch_bridge secret missing - NOT stored",
      });
      // Deliberately not "OK": an un-acknowledged batch is kept on the
      // terminal and sent again. Saying OK here would throw the punches away.
      return text("Server error", 500);
    }

    const { data, error } = await admin.rpc("cb_ingest_punches", {
      p_secret: secret,
      p_punches: punches,
    });

    if (error) {
      await log({
        path,
        method: "POST",
        sn,
        table_name: "ATTLOG",
        rows_in: punches.length,
        note: `ingest failed: ${String(error.message).slice(0, 200)}`,
      });
      return text("Server error", 500);
    }

    const stored = Number((data as { stored?: number } | null)?.stored ?? 0);
    const unknown =
      (data as { unknown_device_codes?: string[] } | null)?.unknown_device_codes ??
        [];
    await log({
      path,
      method: "POST",
      sn,
      table_name: "ATTLOG",
      rows_in: punches.length,
      stored,
      note: unknown.length ? `unmapped device codes: ${unknown.join(", ")}` : null,
    });

    // Housekeeping, cheap and occasional: this table is a heartbeat, not an
    // archive, and the punches themselves are kept elsewhere.
    if (Math.random() < 0.02) {
      await admin
        .from("cb_adms_log")
        .delete()
        .lt("at", new Date(Date.now() - 14 * 864e5).toISOString())
        .then(() => {}, () => {});
    }

    return text(`OK: ${stored}`);
  }

  await log({ path, method: req.method, sn, note: "unhandled path" });
  return text("OK");
});
