/**
 * Everything the monthly report shows, derived from ONE server-side source.
 *
 * cb_monthly_matrix() returns a row per person per working day with the day's
 * state already decided. Every figure on the page — the headline numbers, both
 * charts, the grid and the CSV — is summed from that same array here, so the
 * printout a founder signs off and the table beside it cannot disagree. This
 * is the same rule the daily register follows, and the reason it has one.
 */

/** The five states a day can be in, and what each one is called on screen. */
export const STATES = {
  'on-time': { label: 'On time', color: '#0ca30c' },
  late: { label: 'Late', color: '#fab219' },
  absent: { label: 'Absent', color: '#d03b3b' },
  // Leave is not a severity — HR recording something is a statement of fact,
  // not a mark against anybody — so it is deliberately not a status hue.
  leave: { label: 'Leave / holiday', color: '#86b6ef' },
  off: { label: 'Not applicable', color: '#e1e0d9' },
};

/** Minutes since midnight from a timestamp, read in IST explicitly. A laptop
 *  left on another timezone would otherwise shift every arrival time on the
 *  page, and arrival time is most of what this report is about. */
export function istMinutes(ts) {
  if (!ts) return null;
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ts)).split(':');
  return Number(h) * 60 + Number(m);
}

export const fmtMinutes = (mins) => {
  if (mins == null || Number.isNaN(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Fold the matrix into the shape the page renders.
 *
 * `onlyReported` drops people the WhatsApp messages never name. The console is
 * the full picture and the report is the short list — but a founder reading a
 * printout is asking the report's question, so the page offers the switch and
 * defaults to the short list.
 */
export function buildMonthly(rows, { onlyReported = true, exclude } = {}) {
  // `exclude` is the founder's own list — names he has switched off for this
  // register. It is deliberately separate from `in_daily_report`, which is a
  // standing HR setting about the WhatsApp messages: turning somebody off a
  // printout for one conversation must not quietly change who the company
  // gets messaged about every morning.
  const off = exclude instanceof Set ? exclude : new Set(exclude ?? []);
  const used = rows.filter((r) => (onlyReported ? r.in_daily_report : true))
    .filter((r) => !off.has(r.employee_id));

  const days = [...new Set(used.map((r) => r.work_date))].sort();

  // Days the office was plainly not open — see the quorum rule in
  // cb_monthly_matrix. Named on the page rather than silently dropped.
  const lowTurnoutDays = [...new Set(
    used.filter((r) => r.low_turnout).map((r) => r.work_date),
  )].sort();

  const byPerson = new Map();
  for (const r of used) {
    if (!byPerson.has(r.employee_id)) {
      byPerson.set(r.employee_id, {
        id: r.employee_id,
        name: (r.full_name || '').trim(),
        department: (r.department || '').trim(),
        team: r.team_name || null,
        isSenior: !!r.is_senior,
        // Why somebody may be off this report by default — shown on their chip
        // so the founder can see what he is switching on rather than guessing.
        inReport: r.in_daily_report !== false,
        cells: new Map(),
        onTime: 0, late: 0, absent: 0, leave: 0, off: 0,
        arrivals: [],
        lateMinutes: 0,
        hours: 0,
      });
    }
    const p = byPerson.get(r.employee_id);
    p.cells.set(r.work_date, r);
    if (r.state === 'on-time') p.onTime += 1;
    else if (r.state === 'late') p.late += 1;
    else if (r.state === 'absent') p.absent += 1;
    else if (r.state === 'leave') p.leave += 1;
    else p.off += 1;
    if (r.check_in_at) p.arrivals.push(istMinutes(r.check_in_at));
    if (r.state === 'late' && r.late_minutes) p.lateMinutes += r.late_minutes;
    if (r.hours) p.hours += Number(r.hours);
  }

  const people = [...byPerson.values()].map((p) => {
    const present = p.onTime + p.late;
    // Days they were EXPECTED — leave is accounted for and `off` is before
    // they joined, so neither belongs in the denominator. Without this a new
    // joiner's first month reads as 30% attendance.
    const expected = present + p.absent;
    return {
      ...p,
      present,
      expected,
      attendancePct: expected ? Math.round((present / expected) * 100) : null,
      // The median, not the mean: one 3pm site visit would drag an average
      // half an hour and make a punctual person look late on paper.
      medianArrival: median(p.arrivals),
      // The middle half of their arrivals. This is what makes the in-time
      // chart worth more than a column of times: a narrow band is somebody
      // who arrives at the same time every day, a wide one is somebody whose
      // arrival is a coin toss — and those are different conversations even
      // when the median is identical.
      arrivalP25: quantile(p.arrivals, 0.25),
      arrivalP75: quantile(p.arrivals, 0.75),
      latePct: present ? Math.round((p.late / present) * 100) : null,
      avgHours: present ? Math.round((p.hours / present) * 10) / 10 : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const perDay = days.map((d) => {
    const cells = used.filter((r) => r.work_date === d);
    const onTime = cells.filter((c) => c.state === 'on-time').length;
    const late = cells.filter((c) => c.state === 'late').length;
    const absent = cells.filter((c) => c.state === 'absent').length;
    const leave = cells.filter((c) => c.state === 'leave').length;
    return { date: d, onTime, late, absent, leave, present: onTime + late };
  });

  const totals = {
    days: days.length,
    people: people.length,
    present: people.reduce((n, p) => n + p.present, 0),
    late: people.reduce((n, p) => n + p.late, 0),
    absent: people.reduce((n, p) => n + p.absent, 0),
    leave: people.reduce((n, p) => n + p.leave, 0),
  };
  totals.expected = totals.present + totals.absent;
  totals.attendancePct = totals.expected
    ? Math.round((totals.present / totals.expected) * 100) : null;
  totals.latePct = totals.present
    ? Math.round((totals.late / totals.present) * 100) : null;
  totals.medianArrival = median(people.map((p) => p.medianArrival).filter((v) => v != null));

  return { days, people, perDay, totals, lowTurnoutDays };
}

function median(xs) {
  return quantile(xs, 0.5);
}

/** Mon-first, because a working week starts on Monday and the founder's
 *  question is literally "what time does he get in on Mondays". */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** JS getDay() is Sunday-first; this repo is not. */
const weekdayIndex = (dateStr) => (new Date(`${dateStr}T12:00:00+05:30`).getDay() + 6) % 7;

/**
 * One person's month, split by day of the week.
 *
 * This is the answer to a question the grid could not give: "he says he is on
 * time — what about Mondays?" A monthly median hides it completely, because
 * four bad Mondays inside twenty-six good days barely move the middle. Split
 * by weekday, four out of four late on a Monday is unmissable.
 *
 * Only weekdays that actually have a working day are returned — this office
 * works some Saturdays and Sundays and not others, and printing an empty
 * "Sun" column would read as somebody skipping it.
 */
export function weekdayBreakdown(person, days) {
  return WEEKDAYS.map((label, i) => {
    const dates = days.filter((d) => weekdayIndex(d) === i);
    const rows = dates.map((d) => person.cells.get(d)).filter(Boolean);
    const arrivals = rows.map((r) => istMinutes(r.check_in_at)).filter((v) => v != null);
    return {
      label,
      days: dates.length,
      present: rows.filter((r) => r.state === 'on-time' || r.state === 'late').length,
      late: rows.filter((r) => r.state === 'late').length,
      absent: rows.filter((r) => r.state === 'absent').length,
      typical: median(arrivals),
    };
  }).filter((w) => w.days > 0);
}

/** A person's month as rows, oldest first — the day-by-day record. */
export function personDays(person, days) {
  return days.map((d) => {
    const r = person.cells.get(d);
    return {
      date: d,
      weekday: WEEKDAYS[weekdayIndex(d)],
      state: r?.state ?? 'off',
      checkIn: r?.check_in_at ?? null,
      checkOut: r?.check_out_at ?? null,
      hours: r?.hours ?? null,
      lateMinutes: r?.late_minutes ?? null,
    };
  });
}

/** Linear-interpolated quantile. Returns null rather than 0 for no data —
 *  0 would plot as midnight and read as somebody arriving at 00:00. */
function quantile(xs, q) {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  if (v.length === 1) return v[0];
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(v[lo] + (v[hi] - v[lo]) * (pos - lo));
}

/** One row per person, matching what the page shows — so the spreadsheet and
 *  the printout are the same report. */
export function monthlyCsv({ people, days }, month) {
  const head = [
    'Name', 'Department', 'Team', 'Working days', 'Present', 'On time', 'Late',
    'Absent', 'Leave', 'Attendance %', 'Late %', 'Typical arrival',
    'Usually between', 'Avg hours',
  ];
  const lines = people.map((p) => [
    p.name, p.department, p.team || 'Main', days.length, p.present, p.onTime,
    p.late, p.absent, p.leave,
    p.attendancePct == null ? '' : `${p.attendancePct}%`,
    p.latePct == null ? '' : `${p.latePct}%`,
    fmtMinutes(p.medianArrival),
    p.arrivalP25 == null ? '' : `${fmtMinutes(p.arrivalP25)}-${fmtMinutes(p.arrivalP75)}`,
    p.avgHours ?? '',
  ]);
  return [head, ...lines]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
