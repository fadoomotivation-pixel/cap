import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// Posts the daily attendance messages to WhatsApp.
//
// Five a day, off one function, and they do NOT share an audience — see the
// routing block below. `kind` picks which:
//   morning     10:30 IST — who has punched in so far, so anyone missing can
//                           still fix it before the register closes  → group
//   attendance  11:30 IST — arrivals by window, and who is absent    → founder
//   absent      11:31 IST — the absent list alone, no arrival times   → group
//   reminder    18:45 IST — the evening picture: who has logged out, who
//                           has no check-out yet, and whose attendance is
//                           missing — while they can still fix it    → group
//   checkout    19:01 IST — who logged out and when, and who is still in
//                                                                    → founder
//
// The group's two both ask somebody to do something. The founder's two are
// the record, and the decisions only he can act on.
//
// Called two ways:
//   · pg_cron, with the x-cron-secret header.
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

  // TONE: this is read by fifty people in a company group, so it is written as
  // an HR notice rather than a dashboard. No emoji: a row of ticks and
  // crosses against colleagues' names reads as a scoreboard, and the counts
  // already say everything the icons did.
  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Daily Attendance*");
  L.push(fmtDate(dateStr));
  L.push("");
  // HEADCOUNT IS NOT PUBLISHED. An explicit "Strength 30" in a group this
  // size reads as a statement about how small the company is, and it answers
  // a question nobody sent this report to ask - the point is who came in
  // today, not how many people exist.
  const head = [
    `Present ${present.length}`,
    `Absent ${absent.length}`,
  ];
  if (onLeave.length) head.push(`On leave ${onLeave.length}`);
  L.push(head.join("  \u00B7  "));
  if (siteVisits.length || wfh.length) {
    const extra: string[] = [];
    if (siteVisits.length) extra.push(`Site visits ${siteVisits.length}`);
    if (wfh.length) extra.push(`Work from home ${wfh.length}`);
    L.push(extra.join("  \u00B7  "));
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
    L.push(`*On leave (${onLeave.length})*`);
    onLeave.forEach((r) => L.push(`\u2022 ${r.full_name.trim()} \u2014 ${r.hr_status}`));
  }

  if (flagged.length) {
    L.push("");
    L.push("*Punched away from the office*");
    flagged.forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 ${Math.round(r.distance_from_office ?? 0)} m away`)
    );
  }

  L.push("");
  L.push("Register: https://www.capitalbrix.co.in/admin/attendance");
  L.push("");
  L.push("\u2014 Capital Brix HR");
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
 * without a check-out is listed rather than left out; a name that appears in
 * neither list would be a bug. The report does not claim they are still
 * here: the machine cannot tell a missed exit punch from a late finish, so
 * the message names both possibilities and leaves the judgement to a person.
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
  L.push("*CAPITAL BRIX \u2014 Daily Logout*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`Logged out ${out.length}  \u00B7  No check-out ${stillIn.length}`);

  if (!present.length) {
    L.push("");
    L.push("_No attendance was recorded today._");
    L.push("");
    L.push("\u2014 Capital Brix HR");
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
    // "Still in office" states something the machine cannot know. A missing
    // check-out has two causes that look identical to it — the person left
    // without tapping, or they are genuinely still here — and printing only
    // one of them makes the report assert a fact it does not have. Saying
    // both is shorter than being wrong, and it tells the founder exactly
    // which names need a question rather than a conclusion.
    L.push(`*No check-out recorded (${stillIn.length})*`);
    L.push("_Either the exit punch was missed, or they are still in the office._");
    stillIn.forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 in ${fmtTime(r.check_in_at)}`)
    );
  }

  L.push("");
  L.push("Register: https://www.capitalbrix.co.in/admin/attendance");
  L.push("");
  L.push("\u2014 Capital Brix HR");
  return L.join("\n");
}

/**
 * The 10:30 check-in list, and the only attendance message the group sees in
 * the morning.
 *
 * It names who HAS punched, never who has not. A list of late names in a
 * fifty-person company group is a scoreboard, and it is the one thing this
 * module keeps being told not to become. But somebody scanning for their own
 * name and not finding it learns exactly the same thing, without anybody
 * being held up in front of their colleagues — and they can still walk to the
 * machine and fix it, which is the entire point of sending anything at 10:30.
 *
 * So the deadline is stated plainly: the register is finalised at 11:30, and
 * the absent list that follows goes to the founder, not here.
 *
 * Returns null when nobody has punched at all. At 10:30 that is either a
 * holiday or a broken feed, and "nobody is in the office" is not a sentence
 * to put in front of fifty people on the strength of a silent machine.
 */
function buildMorningSummary(rows: Row[], dateStr: string): string | null {
  const present = rows.filter((r) => r.check_in_at);
  if (!present.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Attendance Update*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`*Punched in so far (${present.length})*`);
  [...present]
    .sort((a, b) => istMinutes(a.check_in_at) - istMinutes(b.check_in_at))
    .forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 ${fmtTime(r.check_in_at)}`)
    );

  L.push("");
  L.push("If you are in the office and your name is not on this list, please");
  L.push("punch on the machine now. The register is finalised at 11:30.");
  L.push("");
  L.push("\u2014 Capital Brix HR");
  return L.join("\n");
}

/**
 * The absent list, published to the group at 11:31.
 *
 * The founder asked for this directly, twice, after being told plainly that
 * naming absent colleagues in a fifty-person group is the scoreboard the rest
 * of this module avoids. It is his call and it is implemented; what is NOT
 * published with it is the arrival roll-call — who walked in at 11:07 and who
 * at 11:52. He asked for the absent list, so that is what goes, and the
 * minute-by-minute record of everybody else stays in his own message.
 *
 * It follows the 11:30 report by a minute, mirroring 19:00/19:01: the
 * founder's copy is the record, the group's is the consequence.
 *
 * Returns null when nobody is absent. A daily "nobody is absent today" is a
 * message people stop reading, and on a full-attendance day silence says it
 * better. On leave is carried only when there is an absent list to carry it
 * with — it is context for the absences, not news of its own.
 */
function buildAbsentSummary(rows: Row[], dateStr: string): string | null {
  const absent = rows.filter((r) => !r.check_in_at && !r.hr_status);
  const onLeave = rows.filter((r) => !r.check_in_at && r.hr_status);
  if (!absent.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Attendance*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`*Absent (${absent.length})*`);
  absent.forEach((r) => L.push(`\u2022 ${r.full_name.trim()}`));

  if (onLeave.length) {
    L.push("");
    L.push(`*On leave (${onLeave.length})*`);
    onLeave.forEach((r) => L.push(`\u2022 ${r.full_name.trim()} \u2014 ${r.hr_status}`));
  }

  L.push("");
  // Not "you can still fix it" — the 10:30 message said the register closes
  // at 11:30 and this is sent after that. A route to a person is the honest
  // recourse; an invitation to reopen a closed register is not.
  L.push("If any name here is wrong, please speak to HR.");
  L.push("");
  L.push("\u2014 Capital Brix HR");
  return L.join("\n");
}

/**
 * The evening picture, fifteen minutes before the shift ends — the group's
 * one message about how the day closed.
 *
 * Somebody who was in all day and forgot to tap is indistinguishable from
 * somebody who never came: the machine has nothing either way. The register
 * cannot solve that, but a person can — if they are told while they are still
 * in the building. At 19:01 it is too late, and the next morning it is a
 * dispute nobody can settle. That is why the combined message sits here and
 * not after the shift ends: 18:45 is the last moment at which anything in it
 * can still be acted on.
 *
 * Three lists, and nothing else:
 *   logged out        who has already left, with their hours. At 18:45 that
 *                     is by definition the people who went early, which is
 *                     the part worth seeing
 *   no check-out yet  they are in and about to leave; without a tap on the
 *                     way out the day reads as zero hours
 *   no punch at all   either genuinely absent, or present and never tapped —
 *                     only they know which, which is exactly why they are
 *                     asked rather than marked
 *
 * There are no departure windows here, unlike the 19:01 record: before the
 * shift has ended, "18:00 – 19:00" and "19:00 onwards" describe time that
 * has not happened yet. The founder's 19:01 message keeps the full breakdown.
 *
 * Anyone HR has already accounted for is left out: somebody on approved leave
 * is not being forgetful. Returns null when all three lists are empty,
 * because a daily message that is usually empty is one people stop reading.
 */
function buildReminderSummary(rows: Row[], dateStr: string): string | null {
  const present = rows.filter((r) => r.check_in_at);
  const loggedOut = present.filter((r) => r.check_out_at);
  const noExit = present.filter((r) => !r.check_out_at);
  const noPunch = rows.filter((r) => !r.check_in_at && !r.hr_status);

  if (!loggedOut.length && !noExit.length && !noPunch.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX — Attendance Reminder*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push("Please complete today's attendance before you leave.");

  if (loggedOut.length) {
    L.push("");
    L.push(`*Logged out (${loggedOut.length})*`);
    [...loggedOut]
      .sort((a, b) => istMinutes(a.check_out_at) - istMinutes(b.check_out_at))
      .forEach((r) =>
        L.push(
          `• ${r.full_name.trim()} — in ${fmtTime(r.check_in_at)}, out ${
            fmtTime(r.check_out_at)
          }`,
        )
      );
  }

  if (noExit.length) {
    L.push("");
    L.push(`*No check-out yet (${noExit.length})*`);
    noExit.forEach((r) =>
      L.push(`• ${r.full_name.trim()} — in ${fmtTime(r.check_in_at)}`)
    );
    L.push("");
    L.push("Please punch on the machine on your way out, or the day is");
    L.push("recorded as zero hours.");
  }

  if (noPunch.length) {
    L.push("");
    L.push(`*No attendance recorded today (${noPunch.length})*`);
    noPunch.forEach((r) => L.push(`• ${r.full_name.trim()}`));
    L.push("");
    L.push("If you are in the office and your name is here, please punch on");
    L.push("the machine or tell HR — otherwise today will be marked absent.");
  }

  L.push("");
  L.push("— Capital Brix HR");
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

    // Five messages a day off one function. cb_report_log is keyed on
    // (report_date, kind), so each is sent once and none can suppress another.
    const kind =
      rawKind === "checkout" || rawKind === "reminder" ||
        rawKind === "morning" || rawKind === "absent"
        ? rawKind
        : "attendance";

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

    // Who each message is FOR decides where it goes, and they are not the
    // same audience.
    //
    // The group's messages ask somebody to act while they still can: at 10:30
    // "your name is not on this list, go and punch", and at 18:45 "finish
    // your attendance before you leave". The 11:31 absent list is the
    // exception, and it is there because the founder asked for it directly.
    //
    // The 11:30 roll-call and the 19:01 logout summary are management
    // information — who drifted in late, who left before the shift ended.
    // Fifty people cannot act on either, and a daily list of colleagues'
    // arrival times in a company group reads as surveillance however plainly
    // it is worded. Those go to the founder.
    const group = (settings?.wa_group_id || "").trim();
    const founder = (settings?.founder_whatsapp || "").replace(/\D/g, "");
    // Each falls back to the other: a summary that reaches one person beats
    // one that reaches nobody because a number was never filled in.
    let target = kind === "reminder" || kind === "morning" || kind === "absent"
      ? (group || founder)
      : (founder || group);
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

    // Fold first. Punches are folded into the register by cb_ingest_punches
    // and by a ten-minute cron, but a report that reads the register without
    // folding can still publish a figure that is minutes out of date - and
    // the one time that matters is the one time it is wrong in public.
    await admin.rpc("cb_fold_punches_into_attendance", {
      p_from: reportDate,
      p_to: reportDate,
    }).then(() => {}, () => {});

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

    // The broken-feed warning is HR's problem, never the group's. It asks for
    // a specific click inside eTimeTrackLite, which forty-nine of fifty people
    // cannot act on and would read as the company's attendance being broken.
    if (punchCount === 0) target = founder || group;

    const text = punchCount === 0
      ? [
        "*CAPITAL BRIX — Daily Attendance*",
        fmtDate(reportDate),
        "",
        "No attendance records were received for today, so the register is not",
        "being published. This is either a non-working day, or the biometric",
        "system has stopped sending to the office computer.",
        "",
        "_HR: please check eTimeTrackLite → Utilities → Device Management →",
        "Start Download._",
        "",
        "— Capital Brix HR",
      ].join("\n")
      : kind === "checkout"
      ? buildCheckoutSummary((rows ?? []) as Row[], reportDate)
      : kind === "reminder"
      ? buildReminderSummary((rows ?? []) as Row[], reportDate)
      : kind === "morning"
      ? buildMorningSummary((rows ?? []) as Row[], reportDate)
      : kind === "absent"
      ? buildAbsentSummary((rows ?? []) as Row[], reportDate)
      : buildSummary((rows ?? []) as Row[], reportDate);

    // Nothing to remind anyone about is the good day, and it gets no message.
    // Logged as ok so the console shows the reminder ran and found nothing,
    // rather than looking like it never fired.
    if (text === null) {
      await admin.from("cb_report_log").upsert({
        report_date: reportDate,
        kind,
        sent_at: new Date().toISOString(),
        target,
        ok: true,
        detail: kind === "morning"
          ? "nothing to post — nobody had punched in by 10:30"
          : kind === "absent"
          ? "nothing to post — nobody was absent"
          : "nothing to remind — every attendance was complete",
      });
      return json({
        sent: false,
        reason: kind === "morning"
          ? "nobody punched in yet"
          : kind === "absent"
          ? "nobody was absent"
          : "nothing to remind",
        kind,
      });
    }

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
