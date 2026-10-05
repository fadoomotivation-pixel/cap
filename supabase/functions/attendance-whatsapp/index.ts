import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// Posts the daily attendance messages to WhatsApp.
//
// Five a day, off one function. `kind` picks which:
//   morning     10:30 IST — juniors punched in so far, so anyone missing can
//                           still fix it before the register closes  → group
//   attendance  11:30 IST — the register: arrivals by window, absent, on
//                           leave, and the HR line     → group AND founder
//   late        13:00 IST — recorded after the register closed        → group
//   welcome     13:05 IST — anybody whose first day this is           → group
//   evening     19:02 IST — the day's close: logged out by departure
//                           window, and who has no check-out          → group
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

/** What cb_new_joiners() returns. */
type NewJoiner = {
  id: string;
  full_name: string;
  role_title: string | null;
  department: string | null;
  first_day: string | null;
  /** Their team's group, so a backend joiner is welcomed by their own team. */
  team_wa_group_id: string | null;
};

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
  team_id: string | null;
  team_name: string | null;
  team_wa_group_id: string | null;
};

/** One finished message and the address it goes to. */
type Delivery = { to: string; text: string; label: string };

/**
 * Split the day's rows by the WhatsApp group each person's attendance is
 * published to.
 *
 * The founder added a "Backend C.B" group on 29 September 2026 and asked for
 * the backend team's attendance to go there. This is NOT a second copy of the
 * register: a person belongs to exactly one group, so backend names leave the
 * main junior group and appear only in theirs. Naming two colleagues in a
 * fifty-person group and again in their own group is the scoreboard this
 * module keeps being told not to become.
 *
 * Anybody with no team, or on a team whose group HR has not picked yet, falls
 * back to the main group. A team configured halfway must never make somebody's
 * attendance disappear - a name in no list at all is the one outcome none of
 * these messages may produce.
 */
function splitByGroup(rows: Row[], mainGroup: string): { to: string; rows: Row[]; label: string }[] {
  const out = new Map<string, { to: string; rows: Row[]; label: string }>();
  for (const r of rows) {
    const own = (r.team_wa_group_id ?? "").trim();
    const to = own || mainGroup;
    if (!to) continue;
    if (!out.has(to)) {
      out.set(to, { to, rows: [], label: own ? (r.team_name ?? "team") : "main group" });
    }
    out.get(to)!.rows.push(r);
  }
  return [...out.values()];
}

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
 * 11:36 IST — the minute the register is actually PUBLISHED, and the only
 * honest boundary for "recorded after the register closed".
 *
 * THIS MUST MATCH THE `cb-daily-attendance-whatsapp` CRON (`6 6 * * *` UTC).
 * They are two copies of one number and nothing checks them against each
 * other, so changing one without the other reopens the hole below.
 *
 * WHY IT IS NOT 11:30. The cron used to fire at 11:30:00 and the message left
 * at 11:30:08. Kamal Mishra punched at 11:30:55 on 5 October: too late for a
 * message that had already gone, so the register called him Absent — and then
 * `istMinutes` truncated his 11:30:55 to 11:30, which is not `> 11:30`, so the
 * 13:00 correction skipped him too. Named absent, never corrected, while
 * standing in the office.
 *
 * Twenty first-punches landed in the five minutes after the cut-off in the
 * preceding thirty days, so this was close to a daily event.
 */
const REGISTER_PUBLISHED = 11 * 60 + 36;

/** HH:MM for a minutes-since-midnight constant, so a printed cut-off can
 *  never drift from the one actually used to filter. */
const fmtMins = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Seconds since midnight IST. `istMinutes` discards seconds, which is right
 * for sorting people into arrival windows and WRONG on a boundary comparison:
 * it turns the cut-off into a sixty-second trapdoor that a person can fall
 * through and never be corrected. Boundaries use this.
 */
const istSeconds = (ts: string | null): number => {
  if (!ts) return -1;
  const [h, m, s] = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ts)).split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

/**
 * Arrival windows, in the shape HR already sends by hand.
 *
 * `until` is minutes since midnight IST; the last window has none and takes
 * everything after. The first is "till 10:30" rather than "9:00-10:30" on
 * purpose: somebody arriving at 08:40 has to land somewhere, and a report
 * that silently drops the earliest person in the office is worse than none.
 */
const WINDOWS: {
  label: string;
  until: number | null;
  /** Print the count only. See "Till 10:30" below. */
  countOnly?: boolean;
}[] = [
  // NAMES ARE NOT REPEATED HERE. Everybody in this block was already named,
  // by name and to the minute, in the 10:30 message to the same group two
  // hours earlier. Printing them again is the longest part of this message
  // and the part carrying the least news, and it pushes the sections that do
  // need reading further down the screen.
  //
  // The COUNT stays, because the windows must always sum to the Present
  // figure in the headline. A block that silently vanished would leave a
  // message whose own arithmetic does not add up.
  { label: "Till 10:30", until: 10 * 60 + 30, countOnly: true },
  { label: "10:30 \u2013 11:00", until: 11 * 60 },
  // 11:00 - 11:30, NOT 11:00 - 12:00, and nothing after it.
  //
  // This message is sent at 11:30 and announces that the register is closed.
  // "11:00 - 12:00" and "After 12:00" described time that had not happened
  // yet - the same mistake the 18:45 departure windows had, which is why
  // they were dropped there too. Anyone arriving after this goes out in the
  // 13:00 register update, which exists for exactly that.
  { label: "11:00 \u2013 11:30", until: REGISTER_CLOSES },
  // A safety net, not a window anybody should see. At 11:30 it is empty by
  // definition. It exists because the message can also be sent by hand from
  // /admin/whatsapp, or by a cron that fired late - and then somebody who
  // punched at 11:45 would belong to no window at all and drop out of a
  // report that had just counted them. Printed only when it has somebody in
  // it, so on an ordinary day it never appears.
  { label: "After 11:30", until: null },
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
 * absent colleagues needs a route to a person who can correct it, and this
 * message is the only place fifty people are given one.
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
    if (w.countOnly) {
      // Said once, so the count is not mistaken for a list that went missing.
      L.push("_Named in the 10:30 update._");
      continue;
    }
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
 * The register, corrected: who was recorded after it closed.
 *
 * Its job is the record rather than the lateness - the founder asked for it
 * in those words on 24 September - which is why it is headed "Register
 * Update" and not "Late Arrivals".
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
function buildLateSummary(
  rows: Row[],
  dateStr: string,
  /**
   * Seconds-since-midnight IST after which a check-in counts as "recorded
   * after the register". Defaults to the scheduled publish minute, but the
   * CALLER PASSES THE REGISTER'S REAL `sent_at` when it has one.
   *
   * That difference is not academic. On 5 October the register went out at
   * 11:30:08 under the old schedule; a constant of 11:36 would have excluded
   * Kamal's 11:30:55 all over again, on the very day it was being fixed. A
   * cut-off read from what actually happened cannot drift from the cron, be
   * wrong on a day the register was sent by hand, or be wrong on a day the
   * job fired late.
   */
  cutoffSec: number = REGISTER_PUBLISHED * 60,
): string | null {
  // Measured in SECONDS against the minute the register was published, not in
  // truncated minutes against the minute it closed. Both halves of that matter:
  //
  //   - seconds, because `istMinutes` rounds 11:30:55 down to 11:30 and
  //     `> 11:30` is then false. That is the trapdoor Kamal fell through.
  //   - published, not closed, because the register now goes out at 11:36 and
  //     already names 11:30-11:36 arrivals under "After 11:30". Filtering on
  //     11:30 here would list them a second time under a line claiming the
  //     register had closed before they punched, which is not true of them.
  //
  // `>=` rather than `>` biases toward naming somebody twice over naming them
  // never. The register takes a few seconds to build, so an arrival inside
  // that sliver may appear in both messages — harmless. The opposite error
  // leaves a present colleague published as absent with no correction, which
  // is the bug this whole boundary exists to prevent.
  const late = juniors(rows)
    .filter((r) => r.check_in_at && istSeconds(r.check_in_at) >= cutoffSec)
    .sort((a, b) => istSeconds(a.check_in_at) - istSeconds(b.check_in_at));
  if (!late.length) return null;

  const L: string[] = [];
  // "Register Update", NOT "Late Arrivals".
  //
  // The founder asked on 24 September for this to read professionally, and
  // for its purpose to be the record: that these people came in. A headline
  // reading "Late Arrivals" over a list of colleagues' names delivers a
  // verdict before the reader is past the first line, and it is the
  // scoreboard this module keeps being told not to become. The facts are
  // identical either way - a name and a time - so the heading is free to be
  // the accurate one, which is that the register changed after publication.
  L.push("*CAPITAL BRIX \u2014 Register Update*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(`*Recorded after ${fmtMins(Math.floor(cutoffSec / 60))} (${late.length})*`);
  late.forEach((r) =>
    L.push(`\u2022 ${r.full_name.trim()} \u2014 ${fmtTime(r.check_in_at)}`)
  );

  L.push("");
  // Why they were missing from the 11:30 message, stated as a fact about the
  // register rather than about them - and the correction is the point, so it
  // is what the closing line says.
  //
  // "Had already closed" is also the only accurate wording. The old line said
  // they had been listed absent, which is not true of somebody HR had marked
  // on leave who then came in - that person appeared under On leave, and this
  // message would have called them absent to fifty colleagues.
  L.push(
    `The ${fmtMins(REGISTER_CLOSES)} register had already been published when these`,
  );
  L.push("check-ins were recorded. Their attendance for today now stands as");
  L.push("present.");
  L.push("");
  L.push("\u2014 Capital Brix AI HR");
  return L.join("\n");
}

/**
 * Welcome aboard, once per person, ever.
 *
 * The founder asked for this on 24 September: when somebody joins and turns
 * up for the first time, the group should say so.
 *
 * It is the one message here that is not about compliance, and it is written
 * that way \u2014 no times, no counts, no register. A first day is the day a new
 * colleague is most aware of being watched, and a feed that can publish an
 * absent list should be able to publish a welcome.
 *
 * WHO COUNTS AS NEW is decided in cb_new_joiners(), not here: active, junior,
 * in the daily report, never welcomed, and with at least one attendance row \u2014
 * because somebody on the roster who has not turned up yet is expected rather
 * than new, and welcoming them would announce a person who is not there.
 *
 * ONCE, EVER, is cb_employees.welcomed_at, stamped by the caller and only
 * AFTER the send succeeded. A failed send must not cost somebody their
 * welcome, and a retry must not send it twice.
 */
function buildWelcomeSummary(rows: NewJoiner[], dateStr: string): string | null {
  if (!rows.length) return null;

  const L: string[] = [];
  L.push("*CAPITAL BRIX \u2014 Welcome Aboard*");
  L.push(fmtDate(dateStr));
  L.push("");
  L.push(
    rows.length === 1
      ? "Please join us in welcoming our newest colleague:"
      : "Please join us in welcoming our newest colleagues:",
  );
  L.push("");
  rows.forEach((r) => {
    // Role and department only when the roster actually holds them. A bare
    // dash after somebody's name on their first day reads as a gap in their
    // own record. And they are not both printed when they are the same word \u2014
    // half this roster has role_title and department both set to "Sales".
    const role = (r.role_title ?? "").trim();
    const dept = (r.department ?? "").trim();
    const tail = role && dept && role.toLowerCase() !== dept.toLowerCase()
      ? `${role}, ${dept}`
      : role || dept;
    L.push(`\u2022 ${r.full_name.trim()}${tail ? ` \u2014 ${tail}` : ""}`);
  });

  L.push("");
  L.push("We are delighted to have you on board. Wishing you a strong start");
  L.push("and a long, successful innings with Capital Brix.");
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
 * The day's close, at 19:02 \u2014 the 18:45 reminder and the 19:01 logout record
 * merged into one.
 *
 * WHAT THE MERGE GAVE UP: 18:45 sat BEFORE the shift ended precisely so
 * somebody who had forgotten to tap could still walk to the machine. At 19:02
 * they have gone home. So this is a record rather than a request, and its
 * closing line says so. What it gained is the departure windows, which at
 * 18:45 described time that had not happened yet.
 *
 * Two lists, and nothing else:
 *   logged out        who left, and when, by departure window
 *   no check-out      in, with no tap on the way out \u2014 which the machine
 *                     cannot tell from somebody still at their desk, so the
 *                     message names both possibilities rather than choosing
 *
 * THERE IS NO ABSENT LIST HERE, on the founder's instruction of 25 September.
 * See the note inside.
 *
 * Returns null when both lists are empty, because a daily message that is
 * usually empty is one people stop reading.
 */
function buildEveningSummary(rows: Row[], dateStr: string): string | null {
  const jr = juniors(rows);
  const present = jr.filter((r) => r.check_in_at);
  const loggedOut = present.filter((r) => r.check_out_at);
  const noExit = present.filter((r) => !r.check_out_at);

  // No absent list here, on the founder's instruction of 25 September. The
  // 11:30 register already named everybody absent, to the same group, hours
  // earlier — and at 19:02 the name is no longer actionable by anybody: the
  // person has gone home and HR cannot mark a leave against a day that is
  // over from a WhatsApp message. So the evening message is about how the
  // day ENDED — who left, and when — and repeating the morning's absent list
  // under a "Daily Logout" heading is a second public naming that carries no
  // new fact. Nothing is lost: the register, the console and the CSV all
  // still hold it.
  if (!loggedOut.length && !noExit.length) return null;

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
      "welcome", //    13:05 group — anybody whose first day this is
      "evening", //    19:02 group — logout record and no check-out
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

    // Which kinds address a group at all. A team split only applies to these;
    // everything else is the founder's alone.
    const toGroup = ["morning", "present", "absent", "late", "evening", "reminder", "welcome"];

    if (!group && !founder) {
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

    // Who has started and never been welcomed. Read from cb_new_joiners() so
    // the rule for "new" lives in one place; see buildWelcomeSummary.
    let newJoiners: NewJoiner[] = [];
    if (kind === "welcome") {
      const { data: nj, error: njErr } = await admin.rpc("cb_new_joiners");
      if (njErr) return json({ error: njErr.message }, 500);
      newJoiners = (nj ?? []) as NewJoiner[];
    }

    // A DAY WITH NOT ONE PUNCH IS A BROKEN FEED UNTIL PROVEN OTHERWISE.
    //
    // Everything downstream of the eSSL machine can be green while the machine
    // itself has stopped reaching us. On 28 September the terminal went silent
    // at 15:30 the previous day and the register would have called all
    // thirty-two people absent.
    //
    // The register cannot tell that apart from a day nobody came, and its
    // answer either way is "Absent" against every name, which is the single
    // most damaging thing this message could say.
    const { count: punchCount } = await admin
      .from("cb_device_punches")
      .select("id", { count: "exact", head: true })
      .gte("punch_at", `${reportDate}T00:00:00+05:30`)
      .lt("punch_at", `${nextIstDay(reportDate)}T00:00:00+05:30`);

    // WHO GETS WHAT. Until 29 September this was one address list and one
    // block of text. It is now one block of text PER ADDRESS, because the
    // backend team publishes to its own group and must see its own names, not
    // the whole company's.
    //
    // The founder's copy of the 11:30 register stays the whole company across
    // every team - that is what makes it the record rather than a roll-call of
    // one group. He directed on 23 September that the register go to both.
    // WHEN THE REGISTER ACTUALLY WENT OUT, read rather than assumed.
    //
    // The 13:00 correction names people the register did not already carry,
    // so its boundary is the register's real `sent_at` — not the minute the
    // cron is configured for. Those two differ whenever the job fires late,
    // whenever HR sends by hand, and on any day the schedule is changed, which
    // is precisely the day somebody is most likely to fall through.
    //
    // Falls back to the scheduled minute when there is no row, which is the
    // only honest guess available then.
    let lateCutoffSec = REGISTER_PUBLISHED * 60;
    if (kind === "late") {
      const { data: reg } = await admin
        .from("cb_report_log")
        .select("sent_at, ok")
        .eq("report_date", reportDate)
        .eq("kind", "attendance")
        .maybeSingle();
      if (reg?.ok && reg.sent_at) lateCutoffSec = istSeconds(reg.sent_at);
    }

    const deliveries: Delivery[] = [];
    let builder: ((rows: Row[], d: string) => string | null) | null = null;
    switch (kind) {
      case "checkout": builder = buildCheckoutSummary; break;
      case "evening":
      case "reminder": builder = buildEveningSummary; break;
      case "morning": builder = buildMorningSummary; break;
      case "present": builder = buildPresentSummary; break;
      case "absent": builder = buildAbsentSummary; break;
      case "late":
        builder = (r, d) => buildLateSummary(r, d, lateCutoffSec);
        break;
      default: builder = buildSummary;
    }

    const all = (rows ?? []) as Row[];

    if (punchCount === 0 && kind !== "welcome") {
      // The broken-feed warning is HR's problem, never any group's: it asks
      // for a click inside eTimeTrackLite that forty-nine of fifty people
      // cannot act on, and it would read as the company's attendance being
      // broken. One address, and it is his.
      const to = founder || group;
      if (to) {
        deliveries.push({
          to,
          label: "founder",
          text: [
            "*CAPITAL BRIX \u2014 Daily Attendance*",
            fmtDate(reportDate),
            "",
            "No attendance records were received for today, so the register is not",
            "being published. This is either a non-working day, or the biometric",
            "system has stopped sending to the office computer.",
            "",
            "_HR: please check eTimeTrackLite \u2192 Utilities \u2192 Device Management \u2192",
            "Start Download._",
            "",
            "\u2014 Capital Brix AI HR",
          ].join("\n"),
        });
      }
    } else if (kind === "welcome") {
      // A backend joiner is welcomed by backend. Same rule as the register:
      // one person, one group.
      const byGroup = new Map<string, NewJoiner[]>();
      for (const j of newJoiners) {
        const to = (j.team_wa_group_id ?? "").trim() || group || founder;
        if (!to) continue;
        if (!byGroup.has(to)) byGroup.set(to, []);
        byGroup.get(to)!.push(j);
      }
      for (const [to, js] of byGroup) {
        const t = buildWelcomeSummary(js, reportDate);
        if (t) deliveries.push({ to, label: "welcome", text: t });
      }
    } else if (kind === "attendance") {
      const founderText = buildSummary(all, reportDate);
      if (founder && founderText) {
        deliveries.push({ to: founder, label: "founder", text: founderText });
      }
      for (const part of splitByGroup(all, group)) {
        // A group whose own JID IS the founder's number would send twice.
        if (part.to === founder) continue;
        const t = buildSummary(part.rows, reportDate);
        if (t) deliveries.push({ to: part.to, label: part.label, text: t });
      }
    } else if (toGroup.includes(kind)) {
      for (const part of splitByGroup(all, group || founder)) {
        const t = builder(part.rows, reportDate);
        if (t) deliveries.push({ to: part.to, label: part.label, text: t });
      }
    } else {
      const to = founder || group;
      const t = builder(all, reportDate);
      if (to && t) deliveries.push({ to, label: "founder", text: t });
    }

    // Nothing to say is the good day, and it gets no message. Logged as ok so
    // the console shows the job ran and found nothing, rather than looking
    // like it never fired.
    if (!deliveries.length) {
      const why = kind === "morning"
        ? "nobody had punched in by 10:30"
        : kind === "present"
        ? "nobody had punched in by 11:30"
        : kind === "absent"
        ? "nobody was absent"
        : kind === "late"
        ? `nobody was recorded after ${fmtMins(REGISTER_PUBLISHED)}`
        : kind === "welcome"
        ? "nobody new started"
        : "every attendance was complete";
      await admin.from("cb_report_log").upsert({
        report_date: reportDate,
        kind,
        sent_at: new Date().toISOString(),
        target: "",
        ok: true,
        detail: `nothing to post \u2014 ${why}`,
      });
      return json({ sent: false, reason: why, kind });
    }

    const targets = deliveries.map((d) => d.to);
    // Preview shows every message that would go out, separated, because a
    // page that previewed only the first would hide the one a team is about
    // to read.
    const text = deliveries.length === 1
      ? deliveries[0].text
      : deliveries.map((d) => `[\u2192 ${d.label}]\n${d.text}`).join("\n\n\u2014\u2014\u2014\n\n");

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
     * The 11:30 register goes to the founder and to every team's group, and
     * each can fail independently — a team's JID can be wrong while the
     * founder's number is fine. Recording a single ok for all of them would
     * hide exactly that, which is the failure this module has had twice
     * already in other forms.
     */
    // EACH DELIVERY CARRIES ITS OWN TEXT. It used to be one body sent to a
    // list of addresses, which is exactly wrong once teams exist: the backend
    // group would have received the whole company's register.
    const sendTo = async (d: Delivery) => {
      const payload = template
        ? template
          .replaceAll("{{to}}", JSON.stringify(d.to).slice(1, -1))
          .replaceAll("{{text}}", JSON.stringify(d.text).slice(1, -1))
        : JSON.stringify({ to: d.to, text: d.text });
      try {
        const res = await fetch(url, { method: "POST", headers, body: payload });
        const body = (await res.text()).slice(0, 200);
        return { to: d.to, ok: res.ok, detail: res.ok ? body : `HTTP ${res.status}: ${body}` };
      } catch (e) {
        return { to: d.to, ok: false, detail: String(e).slice(0, 200) };
      }
    };

    const results = [];
    for (const d of deliveries) results.push(await sendTo(d));

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

    // Once, ever — but only once it actually went out. Stamping before the
    // send would cost somebody their welcome the first time the WhatsApp
    // session was down, and nothing would ever say so.
    if (kind === "welcome" && ok && newJoiners.length) {
      await admin
        .from("cb_employees")
        .update({ welcomed_at: new Date().toISOString() })
        .in("id", newJoiners.map((j) => j.id))
        .then(() => {}, () => {});
    }

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
