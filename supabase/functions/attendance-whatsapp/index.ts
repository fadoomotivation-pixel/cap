import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// Posts the daily attendance summary to the team's WhatsApp group.
//
// Called two ways:
//   · pg_cron, once an evening, with the x-cron-secret header.
//   · An admin from /admin/attendance, with their JWT, to send early or
//     re-send a day.
//
// ── Why a webhook and not the WhatsApp API ───────────────────────────────
// Meta's official WhatsApp Cloud API cannot post to a group at all — it only
// messages individual numbers. Posting into a group needs a logged-in
// WhatsApp Web session, which is what Baileys (and whatsapp-web.js, and the
// providers that wrap them) gives you. Capital Brix already runs one, so this
// function does not embed a WhatsApp client: it hands the finished text to
// whatever endpoint is configured and lets that service own the session.
//
// That also means the session is the fragile part, not this. If the summary
// stops arriving, check the Baileys service is still logged in before
// suspecting anything here — cb_report_log records what this function
// actually did.
//
// ── Secrets (Project Settings → Edge Functions → Secrets) ────────────────
//   WA_WEBHOOK_URL    the Baileys endpoint that sends a message   (required)
//   WA_WEBHOOK_TOKEN  bearer token that endpoint expects          (optional)
//   WA_AUTH_HEADER    header name for the token, default Authorization
//   WA_PAYLOAD_TEMPLATE  JSON with {{to}} and {{text}} placeholders, for an
//                        endpoint whose body shape differs from the default
//                        {"to": …, "text": …}
//   CRON_SECRET       what pg_cron sends in x-cron-secret         (required)
//
// The group JID and the on/off switch live in cb_hr_settings instead, so HR
// can change the group without a deploy.
// ─────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
  "admin@capitalbrix.co.in",
  "ujjwal@capitalbrix.co.in",
  "disha@capitalbrix.com",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IST = "Asia/Kolkata";

/** Today in IST. The server runs in UTC, so "today" here is not today there
 *  for five and a half hours of every day — long enough to send an empty
 *  register at 6am IST and call it a day's attendance. */
const istToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** The day after an IST date string, for a half-open punch_at range. Built by
 *  stepping the UTC instant that IST midnight maps to, so a month or year
 *  boundary cannot drift. */
const nextIstDay = (d: string): string => {
  const t = new Date(`${d}T00:00:00+05:30`);
  t.setUTCDate(t.getUTCDate() + 1);
  return new Date(t.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
};


const fmtTime = (ts: string | null) =>
  ts
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: IST,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(ts))
    : "\u2014";

/** Minutes since midnight IST, for sorting people into arrival windows. */
const istMinutes = (ts: string | null): number => {
  if (!ts) return -1;
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts)).split(":");
  return Number(h) * 60 + Number(m);
};

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${d}T12:00:00+05:30`));

type Row = {
  full_name: string;
  department: string | null;
  work_mode: string | null;
  hr_status: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  is_late: boolean | null;
  late_minutes: number | null;
  distance_from_office: number | null;
  outside_geofence: boolean | null;
  note: string | null;
};

/**
 * Arrival windows, in the shape HR already sends by hand.
 *
 * `until` is minutes since midnight IST; the last window has none and takes
 * everything after. The first is "till 10:30" rather than "9:00-10:30" on
 * purpose: somebody arriving at 08:40 has to land somewhere, and a report
 * that silently drops the earliest person in the office is worse than none.
 */
const WINDOWS: { label: string; until: number | null }[] = [
  { label: "Till 10:30", until: 10 * 60 + 30 },
  { label: "10:30 \u2013 11:00", until: 11 * 60 },
  { label: "11:00 \u2013 12:00", until: 12 * 60 },
  { label: "After 12:00", until: null },
];

/**
 * The same summary src/lib/attendanceReport.js builds for the HR console.
 * Change one and change the other, or the console and the cron disagree.
 */
function buildSummary(rows: Row[], dateStr: string) {
  const present = rows.filter((r) => r.check_in_at);
  const onLeave = rows.filter((r) => !r.check_in_at && r.hr_status);
  const absent = rows.filter((r) => !r.check_in_at && !r.hr_status);
  const siteVisits = present.filter((r) => r.work_mode === "site-visit");
  const wfh = present.filter((r) => r.work_mode === "wfh");
  const flagged = present.filter((r) => r.outside_geofence);

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Attendance*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`\u{1F465} Strength: ${rows.length}`);
  L.push(`\u2705 Present: ${present.length}   \u274C Absent: ${absent.length}`);
  if (onLeave.length) L.push(`\u{1F334} On leave: ${onLeave.length}`);
  if (siteVisits.length || wfh.length) {
    L.push(
      `\u{1F697} Site visits: ${siteVisits.length}${
        wfh.length ? `   \u{1F3E0} WFH: ${wfh.length}` : ""
      }`,
    );
  }

  // Every present person lands in exactly one window, so the windows always
  // add up to the Present count above. If they ever do not, the bug is here.
  let remaining = [...present].sort(
    (a, b) => istMinutes(a.check_in_at) - istMinutes(b.check_in_at),
  );
  for (const w of WINDOWS) {
    const inWindow = w.until === null
      ? remaining
      : remaining.filter((r) => istMinutes(r.check_in_at) < w.until!);
    remaining = w.until === null
      ? []
      : remaining.filter((r) => istMinutes(r.check_in_at) >= w.until!);

    if (!inWindow.length) continue;
    L.push("");
    L.push(`*${w.label}* (${inWindow.length})`);
    inWindow.forEach((r) => L.push(`\u2022 ${r.full_name.trim()} \u2014 ${fmtTime(r.check_in_at)}`));
  }

  if (absent.length) {
    L.push("");
    L.push(`*Absent (${absent.length})*`);
    absent.forEach((r) => L.push(`\u2022 ${r.full_name.trim()}`));
  }

  if (onLeave.length) {
    L.push("");
    L.push("*On leave*");
    onLeave.forEach((r) => L.push(`\u2022 ${r.full_name.trim()} \u2014 ${r.hr_status}`));
  }

  if (flagged.length) {
    L.push("");
    L.push("*\u26A0\uFE0F Punched outside the office geofence*");
    flagged.forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 ${Math.round(r.distance_from_office ?? 0)}m away`)
    );
  }

  L.push("");
  L.push("\u2014 Sent from Capital Brix HR");
  return L.join("\n");
}

/**
 * Departure windows. The shift ends at 19:00, so these split the day at the
 * two points that mean something: gone before 18:00 is an early exit worth a
 * question, gone between 18:00 and 19:00 is a little early, and after 19:00
 * is simply the end of the day.
 */
const OUT_WINDOWS: { label: string; until: number | null }[] = [
  { label: "Before 18:00", until: 18 * 60 },
  { label: "18:00 \u2013 19:00", until: 19 * 60 },
  { label: "19:00 onwards", until: null },
];

/**
 * Who logged out, and when.
 *
 * Sent at 19:01, a minute after the shift ends, so it is mostly a list of
 * people who left before the end — which is the part worth reading. Anyone
 * still in the office has no check-out yet and is listed as such rather than
 * left out; a name that appears in neither list would be a bug.
 *
 * A check-out only exists when the day's last punch is at least an hour
 * after the first. Somebody who tapped once and left has an arrival and no
 * departure, and shows under "still checked in" — correctly, because the
 * machine has no evidence they left.
 */
function buildCheckoutSummary(rows: Row[], dateStr: string) {
  const present = rows.filter((r) => r.check_in_at);
  const out = present.filter((r) => r.check_out_at);
  const stillIn = present.filter((r) => !r.check_out_at);

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Logout*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`\u{1F6AA} Logged out: ${out.length}   \u23F3 Still in: ${stillIn.length}`);

  if (!present.length) {
    L.push("");
    L.push("_Nobody punched in today._");
    L.push("");
    L.push("\u2014 Sent from Capital Brix HR");
    return L.join("\n");
  }

  let remaining = [...out].sort(
    (a, b) => istMinutes(a.check_out_at) - istMinutes(b.check_out_at),
  );
  for (const w of OUT_WINDOWS) {
    const inWindow = w.until === null
      ? remaining
      : remaining.filter((r) => istMinutes(r.check_out_at) < w.until!);
    remaining = w.until === null
      ? []
      : remaining.filter((r) => istMinutes(r.check_out_at) >= w.until!);

    if (!inWindow.length) continue;
    L.push("");
    L.push(`*${w.label}* (${inWindow.length})`);
    inWindow.forEach((r) =>
      L.push(
        `\u2022 ${r.full_name.trim()} \u2014 in ${fmtTime(r.check_in_at)}, out ${
          fmtTime(r.check_out_at)
        }`,
      )
    );
  }

  if (stillIn.length) {
    L.push("");
    L.push(`*Still checked in (${stillIn.length})*`);
    stillIn.forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 in ${fmtTime(r.check_in_at)}`)
    );
  }

  L.push("");
  L.push("\u2014 Sent from Capital Brix HR");
  return L.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const { date, force, dry_run, kind: rawKind } = body as {
      date?: string;
      force?: boolean;
      dry_run?: boolean;
      kind?: string;
    };

    // Two reports a day off one function: the arrival summary at 12:10 and
    // the logout summary at 19:01. cb_report_log is keyed on
    // (report_date, kind), so each is sent once and neither blocks the other.
    const kind = rawKind === "checkout" ? "checkout" : "attendance";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Two callers, two proofs. The cron secret is a header rather than a body
    // field so it never ends up in a log line that records the payload.
    const cronSecret = Deno.env.get("CRON_SECRET");
    const viaCron = !!cronSecret &&
      req.headers.get("x-cron-secret") === cronSecret;

    let viaAdmin = false;
    if (!viaCron) {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (jwt) {
        const { data: u } = await admin.auth.getUser(jwt);
        viaAdmin = !!u?.user?.email &&
          ADMIN_EMAILS.includes(u.user.email.toLowerCase());
      }
    }
    if (!viaCron && !viaAdmin) return json({ error: "not authorised" }, 403);

    // Only an admin may force a repeat, and only an admin may dry-run: the
    // cron has no business doing either.
    const reportDate = (viaAdmin && date) || istToday();

    const { data: settings } = await admin
      .from("cb_hr_settings")
      .select("wa_group_id, founder_whatsapp, daily_report_enabled")
      .limit(1)
      .maybeSingle();

    if (!viaAdmin && !settings?.daily_report_enabled) {
      return json({ sent: false, reason: "daily report is switched off in HR settings" });
    }

    // Group first, founder's number as the fallback. A summary that reaches
    // one person beats one that reaches nobody because a JID was mistyped.
    const target = (settings?.wa_group_id || "").trim() ||
      (settings?.founder_whatsapp || "").replace(/\D/g, "");
    if (!target) {
      return json({ sent: false, reason: "no WhatsApp group or founder number configured" });
    }

    // Already sent? cb_report_log is keyed on (report_date, kind), so the
    // cron firing twice, a retry after a timeout and HR tapping Send all
    // collapse to one message in the group.
    if (!force) {
      const { data: prior } = await admin
        .from("cb_report_log")
        .select("sent_at, ok")
        .eq("report_date", reportDate)
        .eq("kind", kind)
        .maybeSingle();
      if (prior?.ok) {
        return json({ sent: false, reason: "already sent", sent_at: prior.sent_at });
      }
    }

    const { data: rows, error } = await admin.rpc("cb_daily_attendance_report", {
      p_date: reportDate,
    });
    if (error) return json({ error: error.message }, 500);

    // A DAY WITH NOT ONE PUNCH IS A BROKEN FEED UNTIL PROVEN OTHERWISE.
    //
    // Everything downstream of the eSSL machine can be green while the machine
    // itself has stopped reaching the office PC. On 21 September the scheduled
    // task's last result was 0x0 and the sync read every table without error,
    // and the register had been five days stale — eTimeTrackLite's download is
    // manual and nobody had clicked it.
    //
    // The register cannot tell that apart from a day nobody came, and its
    // answer either way is "Absent" against every name, which is the single
    // most damaging thing this message could say. So when no punch has arrived
    // for the day, say that instead of reading out a roll-call nobody should
    // act on. On a real holiday it is still true and still the right message.
    const { count: punchCount } = await admin
      .from("cb_device_punches")
      .select("id", { count: "exact", head: true })
      .gte("punch_at", `${reportDate}T00:00:00+05:30`)
      .lt("punch_at", `${nextIstDay(reportDate)}T00:00:00+05:30`);

    const text = punchCount === 0
      ? [
        `⚠️ *CAPITAL BRIX — Attendance*`,
        fmtDate(reportDate),
        "",
        "No punches have reached the system for today, so the register is not",
        "being read out. Either nobody punched, or the biometric machine has",
        "stopped sending to the office PC.",
        "",
        "Check: eTimeTrackLite → Utilities → Device Management → Start Download.",
        "",
        "— Sent from Capital Brix HR",
      ].join("\n")
      : kind === "checkout"
      ? buildCheckoutSummary((rows ?? []) as Row[], reportDate)
      : buildSummary((rows ?? []) as Row[], reportDate);

    if (dry_run && viaAdmin) return json({ sent: false, dry_run: true, kind, target, text });

    const url = Deno.env.get("WA_WEBHOOK_URL");
    if (!url) {
      return json({ sent: false, reason: "WA_WEBHOOK_URL is not set", text });
    }

    // Default body is {"to": …, "text": …}. WA_PAYLOAD_TEMPLATE covers an
    // endpoint that wants a different shape — JSON.stringify gives correctly
    // escaped values, so a message containing a quote or a newline cannot
    // break the template.
    const template = Deno.env.get("WA_PAYLOAD_TEMPLATE");
    const payload = template
      ? template
        .replaceAll("{{to}}", JSON.stringify(target).slice(1, -1))
        .replaceAll("{{text}}", JSON.stringify(text).slice(1, -1))
      : JSON.stringify({ to: target, text });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = Deno.env.get("WA_WEBHOOK_TOKEN");
    if (token) {
      const name = Deno.env.get("WA_AUTH_HEADER") ?? "Authorization";
      headers[name] = name.toLowerCase() === "authorization" ? `Bearer ${token}` : token;
    }

    let ok = false;
    let detail = "";
    try {
      const res = await fetch(url, { method: "POST", headers, body: payload });
      detail = (await res.text()).slice(0, 400);
      ok = res.ok;
      if (!ok) detail = `HTTP ${res.status}: ${detail}`;
    } catch (e) {
      detail = String(e).slice(0, 400);
    }

    // Logged either way. A failed send that leaves no trace is how a team
    // discovers three weeks later that nobody has seen a report.
    await admin.from("cb_report_log").upsert({
      report_date: reportDate,
      kind,
      sent_at: new Date().toISOString(),
      target,
      ok,
      detail: detail || null,
    });

    return json({ sent: ok, date: reportDate, kind, target, detail: ok ? undefined : detail });
  } catch (e) {
    return json({ sent: false, reason: String(e).slice(0, 300) }, 500);
  }
});
