import React, { useMemo, useState } from 'react';
import {
  STATES, fmtMinutes, istMinutes, weekdayBreakdown, personDays,
} from '../lib/monthlyAttendance';

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
 * EVERYBODY'S IN-TIME, on one line each.
 *
 * The founder asked on 29 September for everyone's monthly in-time to be easy
 * to understand at a glance. A column of times in a table is not that — you
 * have to read thirty numbers and hold a threshold in your head while you do.
 *
 * So arrival is drawn as POSITION ON A CLOCK, not as a bar. A bar would start
 * at midnight and make 10:15 look like a large quantity of something; there is
 * no meaningful zero in a time of day. Each person is a row, the dot is their
 * typical (median) arrival, and one vertical line marks the moment "late"
 * begins. Left of the line is on time. That comparison is the whole chart, and
 * it needs no reading.
 *
 * The bar THROUGH the dot is the middle half of their arrivals — 25th to 75th
 * percentile. It is what makes this worth more than a list of times: a short
 * bar is somebody who walks in at the same minute every day, a long one is
 * somebody whose arrival is a coin toss, and those are different conversations
 * even when the median is identical.
 *
 * Sorted earliest first, so the page reads top-to-bottom from most punctual to
 * least — which is the order the question is actually asked in.
 */
function ArrivalDots({ people, lateAfterMin, onPick }) {
  const ranked = useMemo(
    () => people
      .filter((p) => p.medianArrival != null)
      .sort((a, b) => a.medianArrival - b.medianArrival || a.name.localeCompare(b.name)),
    [people],
  );
  if (!ranked.length) {
    return <p className="text-sm" style={{ color: MUTED }}>Nobody has an arrival time this month.</p>;
  }

  const rowH = 19, labelW = 150, valueW = 118;
  const W = 1000, H = ranked.length * rowH + 24;
  const plotW = W - labelW - valueW;

  // The axis is padded half an hour either side of the real range and snapped
  // to the half hour, so the earliest and latest dots are never jammed against
  // an edge where they cannot be read.
  const lo = Math.min(...ranked.map((p) => p.arrivalP25 ?? p.medianArrival), lateAfterMin ?? 645);
  const hi = Math.max(...ranked.map((p) => p.arrivalP75 ?? p.medianArrival), lateAfterMin ?? 645);
  const from = Math.floor((lo - 30) / 30) * 30;
  const to = Math.ceil((hi + 30) / 30) * 30;
  const x = (m) => labelW + ((m - from) / (to - from)) * plotW;

  const ticks = [];
  for (let m = from; m <= to; m += 30) ticks.push(m);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="Each person's typical arrival time, earliest first">
      {ticks.map((m) => (
        <g key={m}>
          <line x1={x(m)} x2={x(m)} y1={16} y2={H - 4} stroke={GRID} strokeWidth="1" />
          <text x={x(m)} y={10} textAnchor="middle" fontSize="9" fill={MUTED}
            style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMinutes(m)}</text>
        </g>
      ))}

      {/* The one line that turns thirty times into one question. */}
      {lateAfterMin != null && (
        <g>
          <line x1={x(lateAfterMin)} x2={x(lateAfterMin)} y1={14} y2={H - 4}
            stroke={STATES.late.color} strokeWidth="2" />
          <text x={x(lateAfterMin) + 4} y={10} fontSize="9" fill={INK_2} fontWeight="600">
            late after {fmtMinutes(lateAfterMin)}
          </text>
        </g>
      )}

      {ranked.map((p, i) => {
        const y = 22 + i * rowH + rowH / 2 - 4;
        const late = lateAfterMin != null && p.medianArrival > lateAfterMin;
        const c = late ? STATES.late.color : STATES['on-time'].color;
        const a = x(p.arrivalP25 ?? p.medianArrival);
        const b = x(p.arrivalP75 ?? p.medianArrival);
        return (
          <g key={p.id}>
            <text x={labelW - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill={INK}
              className="cb-pick" onClick={() => onPick?.(p.id)}>
              {p.name.length > 24 ? `${p.name.slice(0, 23)}\u2026` : p.name}
            </text>
            {/* The middle half, drawn thin so the dot stays the thing you read. */}
            <line x1={a} x2={b} y1={y} y2={y} stroke={c} strokeWidth="3"
              strokeLinecap="round" opacity="0.32" />
            {/* A surface ring, so a dot overlapping the band still reads as one mark. */}
            <circle cx={x(p.medianArrival)} cy={y} r="4.5" fill={c}
              stroke="#ffffff" strokeWidth="1.5" />
            <title>
              {`${p.name} \u2014 typically ${fmtMinutes(p.medianArrival)}`}
              {p.arrivalP25 != null
                ? `, usually between ${fmtMinutes(p.arrivalP25)} and ${fmtMinutes(p.arrivalP75)}`
                : ''}
              {` \u00B7 ${p.present} days in, ${p.late} late`}
            </title>
            {/* Amber is under 3:1 on white, so the time is never colour-only. */}
            <text x={W - valueW + 8} y={y + 4} fontSize="10.5" fill={INK} fontWeight="600"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtMinutes(p.medianArrival)}
            </text>
            <text x={W - valueW + 52} y={y + 4} fontSize="9.5" fill={MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {p.late}/{p.present} late
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
function Heatmap({ days, people, onPick }) {
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
          <text x={labelW - 8} y={18 + r * step + cell - 3} textAnchor="end" fontSize="10" fill={INK}
            className="cb-pick" onClick={() => onPick?.(p.id)}>
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

const fmtDay = (d) =>
  new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const fmtClock = (ts) => (ts ? fmtMinutes(istMinutes(ts)) : '\u2014');

function StateBadge({ state }) {
  const s = STATES[state];
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: `${s.color}22`, color: state === 'late' ? '#8a5a00' : s.color }}>
      {s.label}
    </span>
  );
}

/**
 * ONE PERSON, DAY BY DAY — the question the grid could not answer.
 *
 * The founder put it plainly on 29 September: "if I ask, on Monday he did not
 * come in until such a time" — and nothing on this page could tell him. The
 * grid carried the times in a hover tooltip, which is no use on paper and no
 * use on a phone, and the table carried monthly totals, which is the wrong
 * altitude entirely. A colour is not evidence; a date and a time is.
 *
 * So this is built the way the conversation actually goes. Somebody says they
 * were on time. You pick their name, and you have every working day of the
 * month with the clock reading beside it — in, out, hours, and how late.
 *
 * ABOVE THAT SITS THE WEEKDAY STRIP, which is the part a monthly median
 * actively hides: four bad Mondays inside twenty-six good days barely move the
 * middle, so "he is usually on time" survives a pattern anybody in the office
 * could already see. Split by weekday it is unmissable, and it is the
 * difference between a number and a reason to have a conversation.
 */
function PersonMonth({ person, days, lateAfterMin }) {
  const week = useMemo(() => weekdayBreakdown(person, days), [person, days]);
  const rows = useMemo(() => personDays(person, days), [person, days]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
        <h3 className="text-base font-semibold" style={{ color: INK }}>{person.name}</h3>
        <span className="text-[11px]" style={{ color: INK_2 }}>
          {person.team || 'Main'}{person.department ? ` \u00B7 ${person.department}` : ''}
        </span>
        <span className="text-[11px]" style={{ color: INK_2 }}>
          Typically <strong>{fmtMinutes(person.medianArrival)}</strong>
          {' \u00B7 '}Present {person.present}/{person.expected}
          {' \u00B7 '}Late {person.late}
        </span>
      </div>

      {/* The weekday answer, before the day list, because it is the one a
          month of dates does not give you by itself. */}
      <p className="text-[11px] mb-1.5" style={{ color: MUTED }}>
        Typical arrival by day of the week
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {week.map((w) => {
          const late = lateAfterMin != null && w.typical != null && w.typical > lateAfterMin;
          return (
            <div key={w.label}
              className="border rounded-lg px-3 py-2 min-w-[78px]"
              style={{ borderColor: late ? STATES.late.color : '#e5e5e0' }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>{w.label}</p>
              <p className="text-sm font-semibold" style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {w.typical == null ? '\u2014' : fmtMinutes(w.typical)}
              </p>
              <p className="text-[10px]" style={{ color: late ? '#8a5a00' : MUTED }}>
                {w.late ? `${w.late}/${w.present} late` : `${w.present}/${w.days} in`}
              </p>
            </div>
          );
        })}
      </div>

      <table className="w-full text-left text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: MUTED, borderBottom: `1px solid ${AXIS}` }}>
            <th className="py-1.5 pr-2 font-medium">Date</th>
            <th className="py-1.5 px-2 font-medium">Day</th>
            <th className="py-1.5 px-2 font-medium">In</th>
            <th className="py-1.5 px-2 font-medium">Out</th>
            <th className="py-1.5 px-2 font-medium text-right">Hours</th>
            <th className="py-1.5 px-2 font-medium text-right">How late</th>
            <th className="py-1.5 pl-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
          {rows.map((r) => (
            <tr key={r.date} style={{ borderBottom: `1px solid ${GRID}`, color: INK_2 }}>
              <td className="py-1.5 pr-2" style={{ color: INK, fontWeight: 600 }}>{fmtDay(r.date)}</td>
              <td className="py-1.5 px-2">{r.weekday}</td>
              <td className="py-1.5 px-2" style={{ color: r.state === 'late' ? '#8a5a00' : INK_2, fontWeight: r.checkIn ? 600 : 400 }}>
                {fmtClock(r.checkIn)}
              </td>
              <td className="py-1.5 px-2">{fmtClock(r.checkOut)}</td>
              <td className="py-1.5 px-2 text-right">{r.hours ?? '\u2014'}</td>
              {/* Minutes past the grace, not a flag, and not minutes past the
                  shift start. "Late" is a verdict; "9 minutes" is a fact the
                  person can answer, and the two read very differently when the
                  page is put in front of them. */}
              <td className="py-1.5 px-2 text-right">
                {r.state === 'late' && r.checkIn && lateAfterMin != null
                  ? `${Math.max(0, istMinutes(r.checkIn) - lateAfterMin)} min`
                  : '\u2014'}
              </td>
              <td className="py-1.5 pl-2"><StateBadge state={r.state} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * THE MUSTER ROLL — everybody's whole month, with times, on one document.
 *
 * The founder asked on 29 September how he would print the full month for the
 * whole company in one go. The per-person view answers one name at a time, and
 * thirty-two of those is thirty-two page-turns, not a document. The grid above
 * is one page but carries colour rather than clock readings, and a colour
 * cannot be filed, signed or handed to somebody in a dispute.
 *
 * So this is the register in the shape every Indian office already knows: names
 * down the side, dates across the top, and **the actual in-time in the cell**.
 * One or two sheets of A4 landscape for the entire company and the entire
 * month.
 *
 * WHAT IS IN A CELL is the arrival time, not a tick. A tick answers "did they
 * come"; the founder's question has always been "when". Absent, leave and
 * days before joining get a letter instead, so a blank never has to be
 * interpreted — a blank cell in an attendance register is the thing people
 * argue about.
 *
 * The tint behind each cell is the same colour language as the rest of the
 * page, and it survives printing because of `print-color-adjust: exact`. It is
 * deliberately pale: the time has to stay the thing you read.
 */
function MusterRoll({ days, people, lateAfterMin }) {
  const mark = (row) => {
    if (!row) return { text: '\u00B7', bg: 'transparent', ink: MUTED };
    if (row.state === 'leave') return { text: 'L', bg: '#86b6ef33', ink: INK_2 };
    if (row.state === 'absent') return { text: 'A', bg: `${STATES.absent.color}22`, ink: '#8c2020' };
    if (row.state === 'off') return { text: '\u00B7', bg: 'transparent', ink: MUTED };
    const mins = istMinutes(row.check_in_at);
    const late = lateAfterMin != null && mins > lateAfterMin;
    return {
      text: fmtMinutes(mins),
      bg: late ? `${STATES.late.color}33` : `${STATES['on-time'].color}1f`,
      ink: late ? '#7a4f00' : '#0a5c0a',
    };
  };

  return (
    <div className="cb-wide">
      <table className="cb-muster" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th className="cb-name" style={{ color: MUTED }}>Name</th>
            {days.map((d) => (
              <th key={d} style={{ color: MUTED }}>
                <span className="block">{dayNum(d)}</span>
                <span className="block cb-dow">{dayShort(d)}</span>
              </th>
            ))}
            <th style={{ color: MUTED }}>P</th>
            <th style={{ color: MUTED }}>Late</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td className="cb-name" style={{ color: INK, fontWeight: 600 }}>
                {p.name.length > 20 ? `${p.name.slice(0, 19)}\u2026` : p.name}
              </td>
              {days.map((d) => {
                const m = mark(p.cells.get(d));
                return (
                  <td key={d} style={{ background: m.bg, color: m.ink }}>{m.text}</td>
                );
              })}
              <td style={{ color: INK, fontWeight: 600 }}>{p.present}</td>
              <td style={{ color: p.late ? '#7a4f00' : MUTED, fontWeight: p.late ? 600 : 400 }}>
                {p.late}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One entry in the register's key: the mark exactly as it appears in a cell,
 *  then what it means. Showing the real thing beats describing it. */
function Key({ swatch, ink, sample, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block rounded text-[10px] font-semibold px-1.5 py-0.5 border"
        style={{
          background: swatch, color: ink, minWidth: 30, textAlign: 'center',
          borderColor: '#e1e0d9', fontVariantNumeric: 'tabular-nums',
        }}
      >
        {sample}
      </span>
      {label}
    </span>
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

export default function MonthlyAttendanceReport({ data, month, lateAfter, lateAfterMin, view = 'summary' }) {
  const { days, people, perDay, totals, lowTurnoutDays = [] } = data;
  const [pickedId, setPickedId] = useState('');
  const picked = people.find((p) => p.id === pickedId) || null;
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
          /* A name is only clickable on screen; on paper it is just a name. */
          .cb-pick { text-decoration: none !important; }
        }
        .cb-pick { cursor: pointer; }
        .cb-pick:hover { text-decoration: underline; }

        /* The register is 28 columns wide. On screen it scrolls sideways; on
           paper it must not, so the scroller is unwrapped for print and the
           type steps down to fit A4 landscape. */
        .cb-wide { overflow-x: auto; }
        .cb-muster { font-size: 9px; table-layout: fixed; font-variant-numeric: tabular-nums; }
        .cb-muster th, .cb-muster td {
          border: 1px solid #e1e0d9; padding: 2px 1px; text-align: center;
          white-space: nowrap; width: 34px;
        }
        .cb-muster .cb-name { text-align: left; width: 132px; padding-left: 5px; }
        .cb-muster .cb-dow { font-size: 7px; opacity: 0.6; }
        /* The header repeats on every printed sheet — a register whose second
           page has no dates across the top is unreadable. */
        .cb-muster thead { display: table-header-group; }
        .cb-muster tr { break-inside: avoid; page-break-inside: avoid; }
        @media print {
          .cb-wide { overflow: visible; }
          .cb-muster { font-size: 7px; }
          .cb-muster th, .cb-muster td { padding: 1px 0; width: auto; }
          .cb-muster .cb-name { width: 108px; }
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

      {view === 'register' ? (
        <section>
          <h2 className="text-sm font-semibold mb-2" style={{ color: INK }}>
            Attendance register \u2014 every name, every working day
          </h2>

          {/* A key, not a paragraph. The reader is about to scan eight hundred
              boxes and needs to know what one means without reading a
              sentence about it. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2 text-[11px]"
            style={{ color: INK_2 }}>
            <Key swatch={`${STATES['on-time'].color}1f`} ink="#0a5c0a" sample="10:12" label="on time" />
            <Key swatch={`${STATES.late.color}33`} ink="#7a4f00" sample="11:24"
              label={lateAfter ? `after ${lateAfter}` : 'late'} />
            <Key swatch={`${STATES.absent.color}22`} ink="#8c2020" sample="A" label="absent" />
            <Key swatch="#86b6ef33" ink={INK_2} sample="L" label="leave or holiday" />
            <Key swatch="transparent" ink={MUTED} sample="\u00B7" label="not a working day" />
          </div>

          {lowTurnoutDays.length > 0 && (
            /* Named, never silently dropped. The founder is entitled to
               disagree with the rule, and he cannot if the page does not say
               which dates it applied to. */
            <p className="text-[11px] mb-2 px-2.5 py-1.5 rounded border"
              style={{ color: INK_2, borderColor: '#e1e0d9', background: '#faf9f5' }}>
              <strong>
                {lowTurnoutDays.map((d) => fmtDay(d)).join(', ')}
              </strong>
              {lowTurnoutDays.length === 1 ? ' had ' : ' had '}
              almost nobody in, so the office was treated as closed and nobody is
              marked absent on {lowTurnoutDays.length === 1 ? 'it' : 'them'}. Whoever
              did come still shows their time.
            </p>
          )}

          <p className="text-[11px] mb-3" style={{ color: MUTED }}>
            Prints as one document \u2014 A4 landscape, with the dates repeated at the
            top of every sheet.
          </p>
          <MusterRoll days={days} people={people} lateAfterMin={lateAfterMin} />
        </section>
      ) : (
      <>
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

      <section className="cb-page-break mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>
          In-time — everybody, earliest first
        </h2>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          The dot is their typical arrival; the bar through it is the middle half of
          their arrivals, so a short bar means they come in at the same time every day.
          Anyone right of the amber line is typically late.
        </p>
        <ArrivalDots people={people} lateAfterMin={lateAfterMin} onPick={setPickedId} />
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
        <Heatmap days={days} people={people} onPick={setPickedId} />
      </section>

      <section className="cb-page-break mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold" style={{ color: INK }}>One person, day by day</h2>
          {/* A plain select, not a search box: thirty names is a list you
              scroll, not one you have to spell. Clicking any name in the two
              charts above lands here too. */}
          <select value={pickedId} onChange={(e) => setPickedId(e.target.value)}
            className="cb-no-print border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-[#f26522]">
            <option value="">Pick a name…</option>
            {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {picked && (
            <button onClick={() => setPickedId('')}
              className="cb-no-print text-xs text-gray-500 hover:text-[#10243E] underline">
              clear
            </button>
          )}
        </div>

        {picked ? (
          <PersonMonth person={picked} days={days} lateAfterMin={lateAfterMin} />
        ) : (
          <p className="text-[11px]" style={{ color: MUTED }}>
            Pick a name above, or tap any name in the two charts, to see every working
            day of the month — the time they came in, the time they left, and how
            late. This is the answer to &ldquo;what time did he get in on Monday?&rdquo;.
          </p>
        )}
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
              <th className="py-1.5 px-2 font-medium text-right">Usually between</th>
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
                <td className="py-1.5 px-2 text-right">
                  {p.arrivalP25 == null ? '—' : `${fmtMinutes(p.arrivalP25)}–${fmtMinutes(p.arrivalP75)}`}
                </td>
                <td className="py-1.5 pl-2 text-right">{p.avgHours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </>
      )}
    </div>
  );
}
