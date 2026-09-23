import { format, parseISO } from 'date-fns';

const IST = 'Asia/Kolkata';

/**
 * Minutes since midnight IST, or null.
 *
 * Deliberately computed in IST rather than from the browser's clock. An HR
 * laptop left on another timezone would otherwise sort people into the wrong
 * arrival window — and the windows are the whole point of this report.
 */
function istMinutes(ts) {
  if (!ts) return null;
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ts)).split(':');
  return Number(h) * 60 + Number(m);
}

const fmtTime = (ts) =>
  ts
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(ts))
    : '—';

/**
 * Arrival windows, in the shape HR already sends by hand.
 *
 * The founder reads this to see who drifted in late, and a list sorted by
 * time makes that a scanning exercise. Grouped, the answer is the size of
 * each block — and it matches what the team is already used to reading.
 *
 * `until` is minutes since midnight IST; the last window has none and takes
 * everything after. The first window is "till 10:30" rather than
 * "9:00–10:30" on purpose: somebody who arrives at 08:40 must land somewhere,
 * and a report that silently drops the earliest person in the office would be
 * worse than no report.
 */
const WINDOWS = [
  { label: 'Till 10:30',    until: 10 * 60 + 30 },
  { label: '10:30 – 11:00', until: 11 * 60 },
  { label: '11:00 – 12:00', until: 12 * 60 },
  { label: 'After 12:00',   until: null },
];

/**
 * Build the daily WhatsApp summary the founder actually reads on a phone.
 * Headline numbers, then arrivals by window, then only the rows that need a
 * decision — never a dump of everyone.
 */
export function buildDailyWhatsAppSummary(rows, dateStr) {
  const date = format(parseISO(dateStr), 'EEE, d MMM yyyy');

  const present = rows.filter((r) => r.check_in_at);
  const onLeave = rows.filter((r) => !r.check_in_at && r.hr_status);
  const absent = rows.filter((r) => !r.check_in_at && !r.hr_status);
  const siteVisits = present.filter((r) => r.work_mode === 'site-visit');
  const wfh = present.filter((r) => r.work_mode === 'wfh');
  const flagged = present.filter((r) => r.outside_geofence);

  // TONE: this is read by fifty people in a company group, so it is written
  // as an HR notice rather than a dashboard. No emoji — a row of ticks and
  // crosses against colleagues' names reads as a scoreboard, and the counts
  // already say everything the icons did.
  const L = [];
  L.push('*CAPITAL BRIX — Daily Attendance*');
  L.push(date);
  L.push('');
  // HEADCOUNT IS NOT PUBLISHED. An explicit "Strength 30" in a group this
  // size reads as a statement about how small the company is, and it answers
  // a question nobody sent this report to ask — the point is who came in
  // today, not how many people exist.
  const head = [`Present ${present.length}`, `Absent ${absent.length}`];
  if (onLeave.length) head.push(`On leave ${onLeave.length}`);
  L.push(head.join('  ·  '));
  if (siteVisits.length || wfh.length) {
    const extra = [];
    if (siteVisits.length) extra.push(`Site visits ${siteVisits.length}`);
    if (wfh.length) extra.push(`Work from home ${wfh.length}`);
    L.push(extra.join('  ·  '));
  }

  // Every present person lands in exactly one window, so the windows always
  // add up to the Present count above. If they ever do not, the bug is here.
  let remaining = [...present].sort(
    (a, b) => istMinutes(a.check_in_at) - istMinutes(b.check_in_at),
  );
  for (const w of WINDOWS) {
    const inWindow = w.until === null
      ? remaining
      : remaining.filter((r) => istMinutes(r.check_in_at) < w.until);
    remaining = w.until === null
      ? []
      : remaining.filter((r) => istMinutes(r.check_in_at) >= w.until);

    if (!inWindow.length) continue;
    L.push('');
    L.push(`*${w.label}* (${inWindow.length})`);
    inWindow.forEach((r) => L.push(`• ${r.full_name.trim()} — ${fmtTime(r.check_in_at)}`));
  }

  if (absent.length) {
    L.push('');
    L.push(`*Absent (${absent.length})*`);
    absent.forEach((r) => L.push(`• ${r.full_name.trim()}`));
  }

  if (onLeave.length) {
    L.push('');
    L.push(`*On leave (${onLeave.length})*`);
    onLeave.forEach((r) => L.push(`• ${r.full_name.trim()} — ${r.hr_status}`));
  }

  if (flagged.length) {
    L.push('');
    L.push('*Punched away from the office*');
    flagged.forEach((r) => L.push(`• ${r.full_name.trim()} — ${Math.round(r.distance_from_office)} m away`));
  }

  L.push('');
  L.push('The register is now closed for today.');
  // Carried over from the 11:32 absent message the register absorbed on
  // 23 September. A list of absent colleagues needs a route to a person who
  // can correct it — and not "you can still punch", because the 10:30 message
  // announced that the register closes at 11:30 and this is that closure.
  // Only printed when there is a name that could be wrong.
  if (absent.length || onLeave.length) {
    L.push('If any name here is wrong, please speak to HR.');
  }

  L.push('');
  L.push('— Capital Brix HR');
  return L.join('\n');
}

/** wa.me link. Number may be blank — WhatsApp then asks who to send it to. */
export function whatsappLink(number, text) {
  const digits = (number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildNudgeMessage(employeeName) {
  return `Hi ${employeeName?.split(' ')[0] || ''}, gentle reminder — please mark your attendance on the Capital Brix Employee Portal for today. Thanks!`;
}
