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
//   POST /iclock/cdata?SN=..&table=OPERLOG who is enrolled, and under which code
//   GET  /iclock/getrequest?SN=..          "any commands for me?"
//   POST /iclock/devicecmd                 how the command went
//
// getrequest used to always answer "no", and the reason it no longer does is
// that every question this module has lost days to lives on that machine and
// was invisible from here: who is actually enrolled and under which code,
// whether the punches are still sitting in its memory, whether its clock has
// drifted. Each answer cost a walk to the office and a Windows Forms menu -
// and the five silent days in September were that walk not happening.
//
// The command channel is deliberately narrow, and the narrowness does not
// live here: cb_queue_device_command builds the text from a whitelist of
// kinds, and this function never accepts a command string from anywhere. So
// there is no input by which clearing the device's data, clearing its logs or
// releasing the door lock can be expressed - those kinds do not exist.
// Enrolling still happens at the terminal, with a finger or a face in front
// of it. Nothing here can create a person.
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

/**
 * USER records out of an OPERLOG upload.
 *
 * The device answers `DATA QUERY USERINFO` by uploading lines shaped
 * `USER PIN=11<tab>Name=Sandeep<tab>Pri=0<tab>Card=...`. This is the only way
 * to learn what the machine itself believes, and it settles the question the
 * roster cannot: on 23 September a new joiner's punch displayed code 11,
 * which the roster says is Sandeep with 983 punches behind it. One of those
 * two readings is wrong, and only the terminal knows which.
 */
function parseUsers(body: string) {
  const out: Record<string, string>[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!/^USER\b/i.test(line)) continue;
    const f: Record<string, string> = {};
    for (const part of line.replace(/^USER\s+/i, "").split("\t")) {
      const eq = part.indexOf("=");
      if (eq < 1) continue;
      f[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
    }
    if (!f.pin) continue;
    out.push({
      device_code: f.pin,
      name: f.name ?? "",
      privilege: f.pri ?? "",
      card: f.card ?? "",
      raw: line.slice(0, 500),
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

  // Two different refusals, and they were logged identically until a line in
  // this table was mistaken for the terminal finally calling in. A request
  // carrying no serial at all is never the terminal - the firmware sends SN
  // on every single request - so it is somebody testing the URL, and saying
  // which is the difference between "it works now" and "that was us".
  if (!sn) {
    await log({
      path,
      method: req.method,
      sn: null,
      note: "refused - no serial sent (not the terminal; something fetched the URL)",
    });
    return text("Unauthorized", 401);
  }

  if (!allowedSerials().includes(sn.toUpperCase())) {
    await log({
      path,
      method: req.method,
      sn,
      note: `refused - serial ${sn} is not in ADMS_ALLOWED_SN`,
    });
    return text("Unauthorized", 401);
  }

  // "Any commands for me?" - asked every few seconds.
  //
  // One at a time, oldest first. A terminal handed a batch reports a single
  // result for the lot, so a failure could not be attributed to the
  // instruction that caused it - and an unattributable failure in a console
  // like this is worse than no console at all.
  if (path === "getrequest") {
    const { data: cmd } = await admin
      .from("cb_device_commands")
      .select("id, cmd")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!cmd) return text("OK");

    // Marked sent BEFORE it goes out, and conditionally on still being
    // pending. If this write failed after the device already had the
    // instruction, the same one would be handed over again on the next poll,
    // every few seconds, forever.
    const { error: markErr } = await admin
      .from("cb_device_commands")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", cmd.id)
      .eq("status", "pending");
    if (markErr) return text("OK");

    await log({ path, method: "GET", sn, note: `sent command #${cmd.id}` });
    return text(`C:${cmd.id}:${cmd.cmd}`);
  }

  // How it went. The terminal posts ID=<id>&Return=<code>&CMD=<what>, and
  // Return=0 means it worked. Recording the non-zero codes is the point: an
  // instruction that quietly did nothing is exactly the failure this console
  // exists to stop being invisible.
  if (path === "devicecmd") {
    const raw = await req.text();
    const f = new URLSearchParams(raw.replace(/\r?\n/g, "&"));
    const id = Number(f.get("ID") ?? f.get("id"));
    const ret = Number(f.get("Return") ?? f.get("return"));
    if (Number.isFinite(id) && id > 0) {
      await admin
        .from("cb_device_commands")
        .update({
          status: ret === 0 ? "done" : "failed",
          return_code: Number.isFinite(ret) ? ret : null,
          replied_at: new Date().toISOString(),
          reply: raw.slice(0, 500),
        })
        .eq("id", id)
        .then(() => {}, () => {});
      await log({ path, method: "POST", sn, note: `command #${id} returned ${ret}` });
    }
    return text("OK");
  }

  if (path === "ping") return text("OK");

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

    // OPERLOG carries the terminal's own user table, which is the one thing
    // the roster cannot tell us: what the machine believes about who is
    // enrolled under which code. The rest of it (door opened, menu entered)
    // and ATTPHOTO are not attendance, and are acknowledged so the terminal
    // clears them - an unacknowledged upload is retried until it blocks the
    // punches queued behind it.
    if (table && table !== "ATTLOG") {
      const users = table === "OPERLOG" ? parseUsers(body) : [];
      if (users.length) {
        await admin
          .from("cb_device_users")
          .upsert(
            users.map((u) => ({ ...u, seen_at: new Date().toISOString() })),
            { onConflict: "device_code" },
          )
          .then(() => {}, () => {});
      }
      await log({
        path,
        method: "POST",
        sn,
        table_name: table,
        rows_in: users.length || null,
        note: users.length
          ? `${users.length} enrolled users recorded`
          : "accepted, not attendance",
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
