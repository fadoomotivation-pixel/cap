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
export function buildMonthly(rows, { onlyReported = true } = {}) {
  const used = rows.filter((r) => (onlyReported ? r.in_daily_report : true));

  const days = [...new Set(used.map((r) => r.work_date))].sort();

  const byPerson = new Map();
  for (const r of used) {
    if (!byPerson.has(r.employee_id)) {
      byPerson.set(r.employee_id, {
        id: r.employee_id,
        name: (r.full_name || '').trim(),
        department: (r.department || '').trim(),
        team: r.team_name || null,
        isSenior: !!r.is_senior,
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

  return { days, people, perDay, totals };
}

function median(xs) {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = Math.floor(v.length / 2);
  return v.length % 2 ? v[i] : Math.round((v[i - 1] + v[i]) / 2);
}

/** One row per person, matching what the page shows — so the spreadsheet and
 *  the printout are the same report. */
export function monthlyCsv({ people, days }, month) {
  const head = [
    'Name', 'Department', 'Team', 'Working days', 'Present', 'On time', 'Late',
    'Absent', 'Leave', 'Attendance %', 'Late %', 'Median arrival', 'Avg hours',
  ];
  const lines = people.map((p) => [
    p.name, p.department, p.team || 'Main', days.length, p.present, p.onTime,
    p.late, p.absent, p.leave,
    p.attendancePct == null ? '' : `${p.attendancePct}%`,
    p.latePct == null ? '' : `${p.latePct}%`,
    fmtMinutes(p.medianArrival), p.avgHours ?? '',
  ]);
  return [head, ...lines]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
