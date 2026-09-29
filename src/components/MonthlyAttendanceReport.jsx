import React, { useMemo } from 'react';
import { STATES, fmtMinutes, istMinutes } from '../lib/monthlyAttendance';

/**
 * The monthly attendance report, built to be READ ON PAPER.
 *
 * The founder asked on 29 September 2026 for one or two pages he can look at
 * once and understand — who is late, how often, and whether it is a pattern.
 * That shaped three decisions:
 *
 *  · THE CHARTS ARE INLINE SVG, not a charting library. Nothing here needs a
 *    150KB dependency, and SVG is the only thing that prints crisp at any
 *    size — a canvas chart prints at screen resolution and looks like a fax.
 *  · IT IS ORDERED AS AN ANSWER, not as a dashboard: the four numbers, then
 *    the shape of the month, then the named ranking, then the full grid. A
 *    reader who stops after half a page has still had the answer.
 *  · COLOUR MEANS THE SAME THING EVERYWHERE. Amber is late in the ranking and
 *    amber is late in the grid, so the page reads as one system rather than
 *    two charts that happen to be adjacent. Amber is under 3:1 on white, so
 *    every amber mark carries a visible number — never colour alone.
 */

const INK = '#0b0b0b';
const INK_2 = '#52514e';
const MUTED = '#898781';
const GRID = '#e1e0d9';
const AXIS = '#c3c2b7';

const dayNum = (d) => Number(d.slice(8, 10));
const dayShort = (d) =>
  new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'narrow' });

/** Rounded only at the data end, anchored to the baseline. */
function topRoundedPath(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} `
    + `L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

function Legend({ keys }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
      {keys.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: INK_2 }}>
          <span className="w-2.5 h-2.5 rounded-[2px] inline-block"
            style={{ background: STATES[k].color, boxShadow: '0 0 0 1px rgba(11,11,11,0.10)' }} />
          {STATES[k].label}
        </span>
      ))}
    </div>
  );
}

/**
 * The shape of the month: every working day as one column, split on-time /
 * late / absent.
 *
 * A stacked column and not two lines, because the three parts are parts of one
 * whole — the roster — and the question is how that whole divided each day.
 * One scale, one axis: never two y-scales on one chart.
 */
function DailyColumns({ perDay }) {
  const W = 1000, H = 250, padL = 30, padR = 6, padT = 10, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = Math.max(1, ...perDay.map((d) => d.onTime + d.late + d.absent));
  const colW = plotW / Math.max(1, perDay.length);
  const barW = Math.min(colW - 3, 26);
  const y = (v) => padT + plotH - (v / max) * plotH;
  const ticks = [0, Math.round(max / 2), max];
  const everyOther = perDay.length > 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="People on time, late and absent on each working day">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
          <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill={MUTED}
            style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={AXIS} strokeWidth="1" />

      {perDay.map((d, i) => {
        const cx = padL + i * colW + (colW - barW) / 2;
        const parts = [
          { k: 'on-time', v: d.onTime },
          { k: 'late', v: d.late },
          { k: 'absent', v: d.absent },
        ].filter((p) => p.v > 0);
        let acc = 0;
        return (
          <g key={d.date}>
            {parts.map((p, idx) => {
              const h = (p.v / max) * plotH;
              const top = y(acc + p.v);
              acc += p.v;
              const isTop = idx === parts.length - 1;
              // A 2px surface gap between segments, so two fills never touch.
              const drawH = Math.max(1, h - (isTop ? 0 : 2));
              return (
                <g key={p.k}>
                  {isTop
                    ? <path d={topRoundedPath(cx, top, barW, drawH)} fill={STATES[p.k].color} />
                    : <rect x={cx} y={top} width={barW} height={drawH} fill={STATES[p.k].color} />}
                  <title>
                    {`${d.date} — ${STATES[p.k].label}: ${p.v}`}
                  </title>
                </g>
              );
            })}
            {(!everyOther || i % 2 === 0) && (
              <text x={cx + barW / 2} y={H - 12} textAnchor="middle" fontSize="9" fill={MUTED}
                style={{ fontVariantNumeric: 'tabular-nums' }}>{dayNum(d.date)}</text>
            )}
            <text x={cx + barW / 2} y={H - 3} textAnchor="middle" fontSize="8" fill={GRID === MUTED ? MUTED : '#b5b3ac'}>
              {dayShort(d.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Who is late most, ranked. This is the founder's actual question, so it gets
 * its own chart rather than a column in a table he has to sort himself.
 *
 * Sorted by COUNT of late days, with the share printed beside it: somebody
 * late 8 of 9 days is a different conversation from somebody late 8 of 26,
 * and a bare count cannot tell them apart.
 */
function LateRanking({ people, limit = 12 }) {
  const ranked = useMemo(
    () => people.filter((p) => p.late > 0).sort((a, b) => b.late - a.late || a.name.localeCompare(b.name)).slice(0, limit),
    [people, limit],
  );
  if (!ranked.length) {
    return <p className="text-sm" style={{ color: MUTED }}>Nobody was late this month.</p>;
  }
  const rowH = 24, labelW = 150, valueW = 96;
  const W = 1000, H = ranked.length * rowH + 6;
  const plotW = W - labelW - valueW;
  const max = Math.max(...ranked.map((p) => p.late));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="People ranked by number of late arrivals">
      {ranked.map((p, i) => {
        const y = i * rowH + 3;
        const w = Math.max(2, (p.late / max) * plotW);
        return (
          <g key={p.id}>
            <text x={labelW - 8} y={y + 13} textAnchor="end" fontSize="11" fill={INK}>
              {p.name.length > 22 ? `${p.name.slice(0, 21)}…` : p.name}
            </text>
            <path d={`M${labelW},${y + 3} L${labelW + w - 4},${y + 3} Q${labelW + w},${y + 3} ${labelW + w},${y + 7}
                      L${labelW + w},${y + 11} Q${labelW + w},${y + 15} ${labelW + w - 4},${y + 15} L${labelW},${y + 15} Z`}
              fill={STATES.late.color} />
            <title>{`${p.name} — late ${p.late} of ${p.present} days present`}</title>
            {/* Amber is sub-3:1 on white, so the number is not optional. */}
            <text x={labelW + w + 8} y={y + 13} fontSize="11" fill={INK} fontWeight="600"
              style={{ fontVariantNumeric: 'tabular-nums' }}>{p.late}</text>
            <text x={labelW + w + 8 + String(p.late).length * 7 + 6} y={y + 13} fontSize="10" fill={MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              of {p.present} · {p.latePct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The whole month, one cell per person per day.
 *
 * This is the part that answers "is it a pattern". A count says somebody was
 * late nine times; a row of amber says they are late every Monday, or that
 * they were fine until the 12th. Nothing else on the page can show that, and
 * it is the reason this report exists rather than another table of totals.
 */
function Heatmap({ days, people }) {
  const cell = 15, gap = 2, labelW = 150;
  const step = cell + gap;
  const W = labelW + days.length * step;
  const H = people.length * step + 18;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="Each person's attendance for each working day of the month">
      {days.map((d, i) => (
        (days.length <= 20 || i % 2 === 0) && (
          <text key={d} x={labelW + i * step + cell / 2} y={10} textAnchor="middle"
            fontSize="8" fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {dayNum(d)}
          </text>
        )
      ))}
      {people.map((p, r) => (
        <g key={p.id}>
          <text x={labelW - 8} y={18 + r * step + cell - 3} textAnchor="end" fontSize="10" fill={INK}>
            {p.name.length > 24 ? `${p.name.slice(0, 23)}…` : p.name}
          </text>
          {days.map((d, c) => {
            const row = p.cells.get(d);
            const state = row?.state ?? 'off';
            return (
              <rect key={d} x={labelW + c * step} y={18 + r * step}
                width={cell} height={cell} rx="2.5" fill={STATES[state].color}>
                <title>
                  {`${p.name} · ${d} · ${STATES[state].label}`}
                  {row?.check_in_at ? ` · in ${fmtMinutes(istMinutes(row.check_in_at))}` : ''}
                </title>
              </rect>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function Tile({ label, value, note }) {
  return (
    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-white">
      <p className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</p>
      <p className="text-2xl font-semibold leading-tight" style={{ color: INK }}>{value}</p>
      {note && <p className="text-[11px] mt-0.5" style={{ color: INK_2 }}>{note}</p>}
    </div>
  );
}

export default function MonthlyAttendanceReport({ data, month, lateAfter }) {
  const { days, people, perDay, totals } = data;
  const monthLabel = new Date(`${month}-01T12:00:00+05:30`)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (!days.length) {
    return (
      <p className="p-8 text-center text-gray-400">
        No attendance was recorded in {monthLabel}.
      </p>
    );
  }

  return (
    <div className="cb-report">
      <style>{`
        /* PRINT IS THE POINT, so it is not an afterthought. Landscape because
           a month is 26+ columns wide and portrait would either shrink the
           grid past reading or split it across two sheets. */
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: #fff; }
          .cb-no-print { display: none !important; }
          .cb-report { font-size: 11px; }
          /* Browsers drop background fills when printing unless told not to —
             and a heatmap with no fills is a blank grid. */
          .cb-report * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cb-page-break { break-before: page; page-break-before: always; }
          .cb-keep { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <header className="cb-keep mb-4">
        <h1 className="text-xl font-semibold" style={{ color: INK }}>
          Capital Brix — Monthly Attendance
        </h1>
        <p className="text-sm" style={{ color: INK_2 }}>
          {monthLabel} · {days.length} working days · {people.length} people
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          A day counts as a working day when somebody punched on it or HR recorded a status against it —
          this office works some Saturdays and Sundays, so the calendar is read from the register rather than assumed.
          {lateAfter ? ` “Late” means arriving after ${lateAfter}, from the shift timing in Settings.` : ''}
        </p>
      </header>

      <div className="cb-keep grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Tile label="Attendance" value={totals.attendancePct == null ? '—' : `${totals.attendancePct}%`}
          note={`${totals.present} present · ${totals.absent} absent`} />
        <Tile label="Arrived late" value={totals.latePct == null ? '—' : `${totals.latePct}%`}
          note={`${totals.late} of ${totals.present} attended days`} />
        <Tile label="Typical arrival" value={fmtMinutes(totals.medianArrival)}
          note="median across everyone" />
        <Tile label="Approved leave" value={totals.leave}
          note="days HR accounted for" />
      </div>

      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>Every working day</h2>
        <Legend keys={['on-time', 'late', 'absent']} />
        <DailyColumns perDay={perDay} />
      </section>

      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>Late arrivals, most first</h2>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          Count of late days, with the share of days they were in — eight of nine is a different
          conversation from eight of twenty-six.
        </p>
        <LateRanking people={people} />
      </section>

      <section className="cb-page-break mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>The month, person by person</h2>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          One square per person per working day. A run of amber is a habit; a scatter of it is a bad week.
        </p>
        <Legend keys={['on-time', 'late', 'absent', 'leave', 'off']} />
        <Heatmap days={days} people={people} />
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2" style={{ color: INK }}>The numbers</h2>
        <table className="w-full text-left text-[11px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: MUTED, borderBottom: `1px solid ${AXIS}` }}>
              <th className="py-1.5 pr-2 font-medium">Name</th>
              <th className="py-1.5 px-2 font-medium">Team</th>
              <th className="py-1.5 px-2 font-medium text-right">Present</th>
              <th className="py-1.5 px-2 font-medium text-right">On time</th>
              <th className="py-1.5 px-2 font-medium text-right">Late</th>
              <th className="py-1.5 px-2 font-medium text-right">Absent</th>
              <th className="py-1.5 px-2 font-medium text-right">Leave</th>
              <th className="py-1.5 px-2 font-medium text-right">Attendance</th>
              <th className="py-1.5 px-2 font-medium text-right">Typical arrival</th>
              <th className="py-1.5 pl-2 font-medium text-right">Avg hrs</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            {people.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${GRID}`, color: INK_2 }}>
                <td className="py-1.5 pr-2" style={{ color: INK, fontWeight: 600 }}>{p.name}</td>
                <td className="py-1.5 px-2">{p.team || 'Main'}</td>
                <td className="py-1.5 px-2 text-right">{p.present}</td>
                <td className="py-1.5 px-2 text-right">{p.onTime}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: p.late ? INK : MUTED, fontWeight: p.late ? 600 : 400 }}>
                  {p.late}
                </td>
                <td className="py-1.5 px-2 text-right">{p.absent}</td>
                <td className="py-1.5 px-2 text-right">{p.leave}</td>
                <td className="py-1.5 px-2 text-right">{p.attendancePct == null ? '—' : `${p.attendancePct}%`}</td>
                <td className="py-1.5 px-2 text-right">{fmtMinutes(p.medianArrival)}</td>
                <td className="py-1.5 pl-2 text-right">{p.avgHours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
