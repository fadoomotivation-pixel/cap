import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// Posts the daily attendance messages to WhatsApp.
//
// Four a day, off one function. `kind` picks which:
//   morning     10:30 IST — juniors punched in so far, so anyone missing can
//                           still fix it before the register closes  → group
//   attendance  11:30 IST — the register: arrivals by window, absent, on
//                           leave, and the HR line     → group AND founder
//   late        13:00 IST — juniors who punched in after 11:30        → group
//   evening     19:02 IST — the day's close: logged out with departure
//                           windows, no check-out recorded, no attendance
//                                                                     → group
//
// `present`, `absent`, `reminder` and `checkout` still work if called by
// hand, but nothing schedules them. All four were folded into the two
// messages above on 23 September, at the founder's instruction:
//
//   present  → the 11:30 register reaches the group now, and is a superset
//   absent   → the register's Absent section IS that list (see buildSummary)
//   reminder → merged into "evening"
//   checkout → merged into "evening"
//
// WHAT THAT MERGE GAVE UP, so nobody restores it by accident: the 18:45
// version sat before the shift ended precisely so somebody who had forgotten
// to tap could still fix it. At 19:02 they have gone home, so the evening
// message is a record rather than a request, and its closing line says so.
//
// ── The group's lists are juniors only ───────────────────────────────────
// On the founder's instruction of 23 September, every message addressed to
// the group names juniors only. Senior staff account for their movements
// straight to him, so their arrival time in a fifty-person group is neither
// news nor anybody's business — it is a name taking up room in a list the
// team is meant to scan for its own.
//
// The 11:30 register is the exception, and deliberately so: it is the whole
// company including seniors, which is what makes it the record rather than a
// roll-call of the people being watched. It is also the only message with two
// audiences, so the founder keeps his copy even if he ever leaves the group.
//
// So the day reads as a sequence rather than copies of one list: 10:30 is
// provisional and still worth walking to the machine for, 11:30 is the
// register closing with everything in it, 13:00 is who arrived after and has
// since been corrected into it, 19:02 is how the day ended.
//
// Each has its own on/off switch in cb_hr_settings.wa_messages_enabled, set
// from /admin/whatsapp; daily_report_enabled is the master switch above them.
//
// Called two ways:
//   · pg_cron, with the x-cron-secret header.
//   · An admin from /admin/attendance or /admin/whatsapp, with their JWT, to
//     preview (dry_run), send early, or re-send (force).
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
// The group JID and the switches live in cb_hr_settings instead, so HR can
// change them without a deploy.
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
  is_senior: boolean | null;
};

/**
 * The group's lists are about juniors.
 *
 * Senior staff account for their movements straight to the founder, so their
 * arrival time in a fifty-person group is neither news nor anybody's business
 * — it is a name taking up space in a list the team is meant to scan for its
 * own. `is_senior` already kept them out of Absent; on the founder's
 * instruction of 23 September it now decides every group list.
 *
 * The founder's own two messages (11:30 windows, 19:01 logout record) are
 * unfiltered: he is reading the whole company, which is the point of them.
 */
const juniors = (rows: Row[]) => rows.filter((r) => !r.is_senior);

/** 11:30 IST in minutes, the moment the register is declared final. */
const REGISTER_CLOSES = 11 * 60 + 30;

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
 * The 11:30 register — one message, both audiences, and since 23 September
 * the only attendance message of the middle of the day.
 *
 * It absorbed the separate 11:32 absent list on the founder's instruction.
 * Nothing was lost in that merge, and the reason is structural rather than
 * editorial: `cb_daily_attendance_report()` already drops a senior who has
 * neither a punch nor an `hr_status`, so **the Absent section here is juniors
 * only by construction** — exactly what the 11:32 message published. Sending
 * it twice was the same names, two minutes apart, to the same group.
 *
 * What the merge had to keep is the 11:32 message's closing line. A list of
 * absent colleagues needs a route to a person who can correct it, and the
 * register's `Register:` link is for the founder, not for the fifty people
 * who cannot open it.
 *
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

  // Absent is juniors only, because the report function has already dropped
  // any senior with neither a punch nor an hr_status. This section IS the
  // former 11:32 message.
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
  L.push("The register is now closed for today.");
  // Carried over from the 11:32 message this absorbed. Not "you can still
  // punch" \u2014 the 10:30 message said the register closes at 11:30 and this is
  // that closure. A route to a person is honest recourse; reopening a
  // register you have just announced as closed is not. Only printed when
  // there is a name that could be wrong.
  if (absent.length || onLeave.length) {
    L.push("If any name here is wrong, please speak to HR.");
  }

  L.push("");
  // For the founder. The fifty people who also receive this cannot open it,
  // which is why the line above exists for them.
  L.push("Register: https://www.capitalbrix.co.in/admin/attendance");
  L.push("");
  L.push("\u2014 Capital Brix AI HR");
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
    L.push("\u2014 Capital Brix AI HR");
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
  L.push("\u2014 Capital Brix AI HR");
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
  const present = juniors(rows).filter((r) => r.check_in_at);
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
  L.push("\u2014 Capital Brix AI HR");
  return L.join("\n");
}

/**
 * The final present list, at 11:30 \u2014 the register as it closes.
 *
 * The 10:30 list and this one were merged once, on the reasoning that a
 * message repeating itself is how people stop reading the first one. The
 * founder asked for both back on 23 September, and the distinction is real
 * enough to carry them: **10:30 is provisional and 11:30 is the record**. At
 * 10:30 a missing name is still a prompt to walk to the machine; at 11:30 it
 * is the answer. Saying so in each message is what keeps them from reading as
 * the same list twice.
 *
 * Returns null when nobody has punched, for the same reason the 10:30 one
 * does: "nobody is in the office" is not a sentence to publish on the
 * strength of a silent machine.
 */
function buildPresentSummary(rows: Row[], dateStr: string): string | null {
  const present = juniors(rows).filter((r) => r.check_in_at);
  if (!present.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Attendance*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`*Present (${present.length})*`);
  [...present]
    .sort((a, b) => istMinutes(a.check_in_at) - istMinutes(b.check_in_at))
    .forEach((r) =>
      L.push(`\u2022 ${r.full_name.trim()} \u2014 ${fmtTime(r.check_in_at)}`)
    );

  L.push("");
  L.push("The register is now closed for today.");
  L.push("");
  L.push("\u2014 Capital Brix AI HR");
  return L.join("\n");
}

/**
 * Who arrived after the register closed.
 *
 * Sent once, at 13:00, rather than the moment each person taps. A live feed
 * of "X arrived at 11:52" through the morning is the scoreboard this module
 * keeps being told not to become, and it would arrive in a fifty-person group
 * one name at a time, all day. One short list at one time says the same thing
 * and can be read in a glance.
 *
 * 13:00 and not the end of the day because a late arrival is worth raising
 * while the day can still be asked about. Returns null when nobody was late,
 * which on a good day is most days \u2014 and a message that is usually empty is
 * one people stop opening.
 */
function buildLateSummary(rows: Row[], dateStr: string): string | null {
  const late = juniors(rows)
    .filter((r) => r.check_in_at && istMinutes(r.check_in_at) > REGISTER_CLOSES)
    .sort((a, b) => istMinutes(a.check_in_at) - istMinutes(b.check_in_at));
  if (!late.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Late Arrivals*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`*Punched in after 11:30 (${late.length})*`);
  late.forEach((r) =>
    L.push(`\u2022 ${r.full_name.trim()} \u2014 ${fmtTime(r.check_in_at)}`)
  );

  L.push("");
  // They were marked absent at 11:32 and have since punched. Saying so is
  // the difference between a correction and a second accusation.
  L.push("These names appeared in the 11:32 absent list and have since");
  L.push("punched in. The register has been updated.");
  L.push("");
  L.push("\u2014 Capital Brix AI HR");
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
  const jr = juniors(rows);
  const absent = jr.filter((r) => !r.check_in_at && !r.hr_status);
  const onLeave = jr.filter((r) => !r.check_in_at && r.hr_status);
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
  L.push("\u2014 Capital Brix AI HR");
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
function buildEveningSummary(rows: Row[], dateStr: string): string | null {
  const jr = juniors(rows);
  const present = jr.filter((r) => r.check_in_at);
  const loggedOut = present.filter((r) => r.check_out_at);
  const noExit = present.filter((r) => !r.check_out_at);
  const noPunch = jr.filter((r) => !r.check_in_at && !r.hr_status);

  if (!loggedOut.length && !noExit.length && !noPunch.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX — Daily Logout*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`Logged out ${loggedOut.length}  ·  No check-out ${noExit.length}`);

  // Departure windows, which the 18:45 version deliberately did not carry —
  // before the shift ended, "19:00 onwards" described time that had not
  // happened yet. At 19:02 it has, so the full breakdown belongs here.
  if (loggedOut.length) {
    let remaining = [...loggedOut].sort(
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
          `• ${r.full_name.trim()} — in ${fmtTime(r.check_in_at)}, out ${
            fmtTime(r.check_out_at)
          }`,
        )
      );
    }
  }

  if (noExit.length) {
    L.push("");
    // The machine cannot tell a missed exit punch from somebody still at
    // their desk, and printing only one of the two makes the message assert
    // a fact it does not have. Naming both is shorter than being wrong.
    L.push(`*No check-out recorded (${noExit.length})*`);
    L.push("_Either the exit punch was missed, or they are still in the office._");
    noExit.forEach((r) =>
      L.push(`• ${r.full_name.trim()} — in ${fmtTime(r.check_in_at)}`)
    );
  }

  if (noPunch.length) {
    L.push("");
    L.push(`*No attendance recorded today (${noPunch.length})*`);
    noPunch.forEach((r) => L.push(`• ${r.full_name.trim()}`));
  }

  L.push("");
  // NOT "please punch on your way out". At 19:02 the shift has ended and the
  // people this would ask are already gone — an instruction nobody can act on
  // is what teaches a group to stop reading the message. The 18:45 version
  // could ask, and that is precisely what moving to 19:02 gave up.
  L.push("If anything here is wrong, please speak to HR tomorrow morning.");
  L.push("");
  L.push("— Capital Brix AI HR");
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

    // Five scheduled messages off one function. cb_report_log is keyed on
    // (report_date, kind), so each is sent once and none can suppress another.
    //
    // An unrecognised kind falls back to "attendance" rather than failing: a
    // typo in a cron job that silently sent nothing would be invisible for
    // weeks, and the founder's full register is the safest thing to send by
    // accident.
    const KINDS = [
      "attendance", // 11:30 BOTH  — the register: windows, absent, on leave
      "morning", //    10:30 group — juniors punched in so far
      "late", //       13:00 group — juniors who arrived after 11:30
      "evening", //    19:02 group — logout record, no check-out, no punch
      // Kept so a manual send still works and an old cron cannot 500, but
      // nothing schedules these any more — all four fold into the two above:
      "present", //    superseded — the 11:30 register is a superset
      "absent", //     superseded — it IS the register's Absent section
      "reminder", //   merged into "evening"
      "checkout", //   merged into "evening"
    ];
    const kind = KINDS.includes(rawKind ?? "") ? rawKind! : "attendance";

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
      .select("wa_group_id, founder_whatsapp, daily_report_enabled, wa_messages_enabled")
      .limit(1)
      .maybeSingle();

    if (!viaAdmin && !settings?.daily_report_enabled) {
      return json({ sent: false, reason: "daily report is switched off in HR settings" });
    }

    // Each message has its own switch, because they are separate decisions —
    // "stop the absent list but keep the reminder" used to have no answer
    // except asking a developer. A MISSING KEY MEANS ON: a message added
    // after this row was last saved must work without anybody editing it,
    // otherwise shipping a new kind silently ships it switched off.
    //
    // An admin is exempt, so Preview and Send now still work on a message
    // that is switched off — seeing what a paused message would say is how
    // you decide whether to turn it back on.
    const switches = (settings?.wa_messages_enabled ?? {}) as Record<string, unknown>;
    if (!viaAdmin && switches[kind] === false) {
      return json({ sent: false, reason: `the ${kind} message is switched off`, kind });
    }

    // Who each message is FOR decides where it goes, and they are not the
    // same audience.
    //
    // Only the 10:30 message still asks somebody to act — "your name is not
    // on this list, go and punch". Everything after the register closes is a
    // record, and the 19:02 evening message says so rather than asking people
    // who have gone home to fix something.
    //
    // The 11:30 register used to be the founder's alone, on the reasoning
    // that a daily list of colleagues' arrival times reads as surveillance in
    // a company group. He directed on 23 September that it go to BOTH — so it
    // is the one message with two audiences, and the founder keeps his copy
    // even if he ever leaves the group.
    const group = (settings?.wa_group_id || "").trim();
    const founder = (settings?.founder_whatsapp || "").replace(/\D/g, "");

    // Each falls back to the other: a summary that reaches one person beats
    // one that reaches nobody because a number was never filled in. Duplicates
    // are stripped, so a founder number that IS the group id sends once.
    const toGroup = ["morning", "present", "absent", "late", "evening", "reminder"];
    let targets = kind === "attendance"
      ? [founder, group]
      : toGroup.includes(kind)
      ? [group || founder]
      : [founder || group];
    targets = [...new Set(targets.filter(Boolean))];

    if (!targets.length) {
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
    if (punchCount === 0) targets = [founder || group].filter(Boolean);

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
        "— Capital Brix AI HR",
      ].join("\n")
      : kind === "checkout"
      ? buildCheckoutSummary((rows ?? []) as Row[], reportDate)
      : kind === "evening" || kind === "reminder"
      ? buildEveningSummary((rows ?? []) as Row[], reportDate)
      : kind === "morning"
      ? buildMorningSummary((rows ?? []) as Row[], reportDate)
      : kind === "present"
      ? buildPresentSummary((rows ?? []) as Row[], reportDate)
      : kind === "absent"
      ? buildAbsentSummary((rows ?? []) as Row[], reportDate)
      : kind === "late"
      ? buildLateSummary((rows ?? []) as Row[], reportDate)
      : buildSummary((rows ?? []) as Row[], reportDate);

    // Nothing to remind anyone about is the good day, and it gets no message.
    // Logged as ok so the console shows the reminder ran and found nothing,
    // rather than looking like it never fired.
    if (text === null) {
      await admin.from("cb_report_log").upsert({
        report_date: reportDate,
        kind,
        sent_at: new Date().toISOString(),
        target: targets.join(", "),
        ok: true,
        detail: kind === "morning"
          ? "nothing to post — nobody had punched in by 10:30"
          : kind === "present"
          ? "nothing to post — nobody had punched in by 11:30"
          : kind === "absent"
          ? "nothing to post — nobody was absent"
          : kind === "late"
          ? "nothing to post — nobody arrived after 11:30"
          : "nothing to report — every attendance was complete",
      });
      return json({
        sent: false,
        reason: kind === "morning"
          ? "nobody punched in yet"
          : kind === "present"
          ? "nobody punched in by 11:30"
          : kind === "absent"
          ? "nobody was absent"
          : kind === "late"
          ? "nobody was late"
          : "nothing to report",
        kind,
      });
    }

    if (dry_run && viaAdmin) {
      return json({ sent: false, dry_run: true, kind, target: targets.join(", "), text });
    }

    const url = Deno.env.get("WA_WEBHOOK_URL");
    if (!url) {
      return json({ sent: false, reason: "WA_WEBHOOK_URL is not set", text });
    }

    // Default body is {"to": …, "text": …}. WA_PAYLOAD_TEMPLATE covers an
    // endpoint that wants a different shape — JSON.stringify gives correctly
    // escaped values, so a message containing a quote or a newline cannot
    // break the template.
    const template = Deno.env.get("WA_PAYLOAD_TEMPLATE");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = Deno.env.get("WA_WEBHOOK_TOKEN");
    if (token) {
      const name = Deno.env.get("WA_AUTH_HEADER") ?? "Authorization";
      headers[name] = name.toLowerCase() === "authorization" ? `Bearer ${token}` : token;
    }

    /**
     * One send, reported honestly.
     *
     * The 11:30 register goes to two addresses, and the two can fail
     * independently — a group JID can be wrong while the founder's number is
     * fine. Recording a single ok for both would hide exactly that, which is
     * the failure this module has had twice already in other forms.
     */
    const sendTo = async (to: string) => {
      const payload = template
        ? template
          .replaceAll("{{to}}", JSON.stringify(to).slice(1, -1))
          .replaceAll("{{text}}", JSON.stringify(text).slice(1, -1))
        : JSON.stringify({ to, text });
      try {
        const res = await fetch(url, { method: "POST", headers, body: payload });
        const body = (await res.text()).slice(0, 200);
        return { to, ok: res.ok, detail: res.ok ? body : `HTTP ${res.status}: ${body}` };
      } catch (e) {
        return { to, ok: false, detail: String(e).slice(0, 200) };
      }
    };

    const results = [];
    for (const to of targets) results.push(await sendTo(to));

    // ok only when EVERY address took it. A partial success logged as success
    // is how "the report is working" and "half the company never sees it"
    // become the same row.
    const ok = results.every((r) => r.ok);
    const detail = results.map((r) => `${r.to}: ${r.ok ? "ok" : r.detail}`).join(" | ");

    // Logged either way. A failed send that leaves no trace is how a team
    // discovers three weeks later that nobody has seen a report.
    await admin.from("cb_report_log").upsert({
      report_date: reportDate,
      kind,
      sent_at: new Date().toISOString(),
      target: targets.join(", "),
      ok,
      detail: detail.slice(0, 400) || null,
    });

    return json({
      sent: ok,
      date: reportDate,
      kind,
      target: targets.join(", "),
      detail: ok ? undefined : detail,
    });
  } catch (e) {
    return json({ sent: false, reason: String(e).slice(0, 300) }, 500);
  }
});
