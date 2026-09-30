import React, { useMemo, useState } from 'react';
import {
  STATES, fmtMinutes, istMinutes, weekdayBreakdown, personDays, arrivalDrift,
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
  // +38 rather than +24: the grace label now sits under the plot and needs a
  // strip of its own below the last row.
  const W = 1000, H = ranked.length * rowH + 38;
  const plotW = W - labelW - valueW;

  // The axis is padded half an hour either side of the real range and snapped
  // to the half hour, so the earliest and latest dots are never jammed against
  // an edge where they cannot be read.
  const lo = Math.min(...ranked.map((p) => p.arrivalP25 ?? p.medianArrival), lateAfterMin ?? 645);
  const hi = Math.max(...ranked.map((p) => p.arrivalP75 ?? p.medianArrival), lateAfterMin ?? 645);
  const from = Math.floor((lo - 30) / 30) * 30;
  const to = Math.ceil((hi + 30) / 30) * 30;
  const x = (m) => labelW + ((m - from) / (to - from)) * plotW;

  // ONLY THE HOURS ARE LABELLED. Every half hour was, which put nine numbers
  // across the top and collided one of them with the "late after 10:45" flag —
  // the chart was reported as complicated, and a row of numbers nobody needs is
  // most of why. Half hours keep their gridline, faintly, and lose the label.
  const ticks = [];
  for (let m = from; m <= to; m += 30) ticks.push(m);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label="Each person's typical arrival time, earliest first">
      {ticks.map((m) => (
        <g key={m}>
          <line x1={x(m)} x2={x(m)} y1={16} y2={H - 14} stroke={GRID} strokeWidth="1"
            opacity={m % 60 === 0 ? 1 : 0.45} />
          {m % 60 === 0 && (
            <text x={x(m)} y={10} textAnchor="middle" fontSize="9" fill={MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtMinutes(m)}</text>
          )}
        </g>
      ))}

      {/* The one line that turns thirty times into one question. Its label sits
          BELOW the plot: at the top it sat on the same baseline as the hour
          labels and overlapped whichever one the grace happened to fall near. */}
      {lateAfterMin != null && (
        <g>
          <line x1={x(lateAfterMin)} x2={x(lateAfterMin)} y1={14} y2={H - 14}
            stroke={STATES.late.color} strokeWidth="2" />
          <text x={x(lateAfterMin) + 4} y={H - 4} fontSize="9" fill={INK_2} fontWeight="600">
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
/**
 * `compact` is for the every-person section, where thirty-five of these are
 * stacked. It keeps the same facts and the same weekday answer, but prints the
 * weekday medians as one line of text instead of a row of boxes — the boxes are
 * 60px tall each and repeating them thirty-five times is most of a sheet of
 * paper per person, spent on whitespace.
 */
function PersonMonth({ person, days, lateAfterMin, compact = false }) {
  const week = useMemo(() => weekdayBreakdown(person, days), [person, days]);
  const rows = useMemo(() => personDays(person, days), [person, days]);

  return (
    <div>
      <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 ${compact ? 'mb-1' : 'mb-3'}`}>
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
      {compact ? (
        <p className="text-[10px] mb-1.5" style={{ color: INK_2, fontVariantNumeric: 'tabular-nums' }}>
          {week.map((w) => (
            <span key={w.label} className="mr-3 inline-block">
              <span style={{ color: MUTED }}>{w.label} </span>
              <span style={{
                color: lateAfterMin != null && w.typical != null && w.typical > lateAfterMin
                  ? '#8a5a00' : INK,
                fontWeight: 600,
              }}>
                {w.typical == null ? '—' : fmtMinutes(w.typical)}
              </span>
            </span>
          ))}
        </p>
      ) : (
      <>
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
      </>
      )}

      <table className={`w-full text-left ${compact ? 'text-[10px] cb-tight' : 'text-[11px]'}`}
        style={{ borderCollapse: 'collapse' }}>
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
 *
 * THE TIMES ARE DARK AND BOLD, not tinted text. They were mid-greys and soft
 * greens at 7px on paper \u2014 legible held at arm's length and not from across a
 * desk, which is how a register is actually read. The tint stayed pale (right)
 * and the ink went pale with it (wrong): the background carries the state, the
 * ink only has to carry the digits.
 */
const INK_OK = '#06450a';   // on time
const INK_LATE = '#6b3d00'; // late
const INK_ABS = '#7a1414';  // absent

function MusterRoll({ days, people, lateAfterMin }) {
  const mark = (row) => {
    if (!row) return { text: '\u00B7', bg: 'transparent', ink: MUTED, bold: false };
    if (row.state === 'leave') return { text: 'L', bg: '#86b6ef33', ink: INK, bold: true };
    if (row.state === 'absent') return { text: 'A', bg: `${STATES.absent.color}22`, ink: INK_ABS, bold: true };
    if (row.state === 'off') return { text: '\u00B7', bg: 'transparent', ink: MUTED, bold: false };
    const mins = istMinutes(row.check_in_at);
    const late = lateAfterMin != null && mins > lateAfterMin;
    return {
      text: fmtMinutes(mins),
      bg: late ? `${STATES.late.color}33` : `${STATES['on-time'].color}1f`,
      ink: late ? INK_LATE : INK_OK,
      bold: true,
    };
  };

  return (
    <div className="cb-wide">
      <table className="cb-muster" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th className="cb-name" style={{ color: INK_2 }}>Name</th>
            {days.map((d) => (
              <th key={d} style={{ color: INK, fontWeight: 700 }}>
                <span className="block">{dayNum(d)}</span>
                <span className="block cb-dow">{dayShort(d)}</span>
              </th>
            ))}
            <th style={{ color: INK, fontWeight: 700 }}>P</th>
            <th style={{ color: INK, fontWeight: 700 }}>Late</th>
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
                  <td key={d} style={{ background: m.bg, color: m.ink, fontWeight: m.bold ? 700 : 400 }}>
                    {m.text}
                  </td>
                );
              })}
              <td style={{ color: INK, fontWeight: 700 }}>{p.present}</td>
              <td style={{ color: p.late ? INK_LATE : INK_2, fontWeight: 700 }}>
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

/**
 * WHO CHANGED — the one question the rest of this page cannot answer.
 *
 * Everything above describes where a person IS. This describes where they are
 * GOING, by comparing each person's typical arrival in the second half of the
 * month with their own in the first. See `arrivalDrift` for why that is the
 * version still worth a conversation.
 *
 * It is drawn as a MOVE, not as a bar: the old time, an arrow, the new time,
 * and the size of the gap. A bar would need a zero, and there is no meaningful
 * zero in a time of day — the same reason the in-time chart is a dot plot.
 *
 * Silent when nobody moved. A panel that prints "no significant changes" every
 * month is a panel people stop reading, which is the failure this whole module
 * is built around.
 */
function Drift({ rows, tone, onPick }) {
  const worse = tone === 'worse';
  const color = worse ? STATES.late.color : STATES['on-time'].color;
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.id}>
          <button onClick={() => onPick?.(r.id)}
            className="w-full text-left flex items-baseline gap-2 py-0.5 hover:opacity-70">
            <span className="text-xs flex-1 truncate" style={{ color: INK }}>{r.name}</span>
            <span className="text-[11px] tabular-nums" style={{ color: MUTED }}>
              {fmtMinutes(r.was)}
            </span>
            <span className="text-[11px]" style={{ color: AXIS }}>→</span>
            <span className="text-[11px] tabular-nums font-medium" style={{ color: INK }}>
              {fmtMinutes(r.now)}
            </span>
            {/* The number carries the meaning, never the colour alone — amber
                is under 3:1 on white and this page is printed. */}
            <span className="text-[11px] tabular-nums font-semibold w-14 text-right"
              style={{ color }}>
              {worse ? '+' : ''}{Math.round(r.shift)} min
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * WHAT GOES ON THE PAGE, and therefore on the paper.
 *
 * The founder printed the September report on 30 September and Chrome offered
 * him TEN SHEETS. Everything on the page was worth having on some day and none
 * of it was worth having on every day, and the report gave him no way to say so
 * — the one button printed all of it.
 *
 * So each block is now a switch. The list is exported because the panel that
 * renders the switches lives on the console page, and a second hand-written
 * copy of it there is how a section ends up in one place and missing from the
 * other.
 *
 * `sheets` is a rough cost in A4 landscape sheets, used for the estimate beside
 * the Print button. It does not have to be exact; it has to make "this will be
 * nine sheets" visible BEFORE the paper is spent, which is the whole complaint.
 * `per` is the part that grows with the number of names.
 */
export const REPORT_SECTIONS = [
  { key: 'numbers', label: 'Headline numbers', note: 'Attendance, late, typical arrival, leave',
    sheets: 0.15, per: 0 },
  { key: 'drift', label: 'Who changed this month', note: 'Each person against their own earlier self',
    sheets: 0.3, per: 0 },
  { key: 'daily', label: 'Every working day', note: 'One column per day — turnout and lateness',
    sheets: 0.35, per: 0 },
  { key: 'intime', label: 'In-time chart', note: 'A dot per person on a clock. Detailed — off by default',
    sheets: 0.2, per: 0.02 },
  { key: 'late', label: 'Late arrivals, most first', note: 'The ranking',
    sheets: 0.35, per: 0 },
  { key: 'grid', label: 'The month, person by person', note: 'The colour grid',
    sheets: 0.3, per: 0.012 },
  { key: 'person', label: 'Each person, day by day', note: 'A block per name: in, out, hours, minutes late',
    sheets: 0.1, per: 0.26 },
  { key: 'table', label: 'The numbers table', note: 'Every figure per person',
    sheets: 0.2, per: 0.015 },
  // THE REGISTER IS A SECTION TOO, not only its own view. The founder wanted
  // the numbers table and the muster roll on one print job, and with the
  // register reachable only through the view toggle that was two trips to the
  // printer and two documents to staple together.
  { key: 'register', label: 'Full register (muster roll)',
    note: 'Names down, dates across, arrival time in the cell — the sheet you file',
    sheets: 0.45, per: 0.038 },
];

/** Sections that print by default: the page that answers the month in three or
 *  four sheets. The chart the founder called complicated and the per-person
 *  blocks (a quarter of a sheet each) are opt-in. */
export const DEFAULT_SECTIONS = ['numbers', 'drift', 'daily', 'late', 'grid', 'table'];

export function estimateSheets({ sections, view, peopleCount }) {
  if (view === 'register') {
    // The muster roll prints ~26 names to a landscape sheet at 7px.
    return Math.max(1, Math.ceil(0.4 + peopleCount / 26));
  }
  const on = new Set(sections);
  const total = REPORT_SECTIONS
    .filter((s) => on.has(s.key))
    .reduce((n, s) => n + s.sheets + s.per * peopleCount, 0.25); // 0.25 = the header
  return Math.max(total > 0.25 ? 1 : 0, Math.ceil(total));
}

/**
 * THE REGISTER AS A COMPONENT, so the "Full register" view and the printable
 * section render exactly the same document. A second copy of eight hundred
 * cells is a second copy that drifts.
 */
function RegisterDoc({ days, people, lateAfter, lateAfterMin, lowTurnoutDays = [], standalone = false }) {
  return (
        <section className={standalone ? undefined : "cb-page-break"}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: INK }}>
          Attendance register — every name, every working day
        </h2>

        {/* A key, not a paragraph. The reader is about to scan eight hundred
            boxes and needs to know what one means without reading a
            sentence about it. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2 text-[11px]"
          style={{ color: INK_2 }}>
          <Key swatch={`${STATES['on-time'].color}1f`} ink={INK_OK} sample="10:12" label="on time" />
          <Key swatch={`${STATES.late.color}33`} ink={INK_LATE} sample="11:24"
            label={lateAfter ? `after ${lateAfter}` : 'late'} />
          <Key swatch={`${STATES.absent.color}22`} ink={INK_ABS} sample="A" label="absent" />
          <Key swatch="#86b6ef33" ink={INK} sample="L" label="leave or holiday" />
          <Key swatch="transparent" ink={MUTED} sample="·" label="not a working day" />
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

        {standalone && (
          <p className="text-[11px] mb-3" style={{ color: MUTED }}>
            Prints as one document — A4 landscape, with the dates repeated at the
            top of every sheet.
          </p>
        )}
        <MusterRoll days={days} people={people} lateAfterMin={lateAfterMin} />
      </section>
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

export default function MonthlyAttendanceReport({
  data, month, lateAfter, lateAfterMin, view = 'summary', sections = DEFAULT_SECTIONS,
}) {
  const { days, people, perDay, totals, lowTurnoutDays = [] } = data;
  const [pickedId, setPickedId] = useState('');
  const picked = people.find((p) => p.id === pickedId) || null;
  const on = useMemo(() => new Set(sections), [sections]);
  // Folded from the same array as everything else on the page, so the panel
  // and the charts can never describe two different months.
  const drift = useMemo(() => arrivalDrift(people, days), [people, days]);
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

        /* EACH PERSON, DAY BY DAY — two to a row, so thirty-five names are not
           thirty-five sheets. A person's block never splits across a column or
           a page (.cb-keep), because half a day list with no name at the top of
           it is not a record anybody can read. */
        .cb-people { columns: 2; column-gap: 26px; }
        .cb-person { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
        .cb-tight td, .cb-tight th { padding-top: 1px !important; padding-bottom: 1px !important; }
        @media (max-width: 900px) { .cb-people { columns: 1; } }
        @media print { .cb-people { columns: 2; column-gap: 20px; } }

        /* The register is 28 columns wide. On screen it scrolls sideways; on
           paper it must not, so the scroller is unwrapped for print and the
           type steps down to fit A4 landscape. */
        .cb-wide { overflow-x: auto; }
        /* A register is read from across a desk, not held at arm's length, so
           the digits are as large as 29 date columns on A4 landscape allow and
           the negative tracking is what buys that last millimetre. */
        .cb-muster {
          font-size: 10.5px; table-layout: fixed; font-variant-numeric: tabular-nums;
          letter-spacing: -0.2px;
        }
        .cb-muster th, .cb-muster td {
          border: 1px solid #d5d4cb; padding: 2px 1px; text-align: center;
          white-space: nowrap; width: 34px;
        }
        .cb-muster .cb-name { text-align: left; width: 132px; padding-left: 5px; }
        .cb-muster .cb-dow { font-size: 7.5px; opacity: 0.75; font-weight: 400; }
        /* The header repeats on every printed sheet — a register whose second
           page has no dates across the top is unreadable. */
        .cb-muster thead { display: table-header-group; }
        .cb-muster tr { break-inside: avoid; page-break-inside: avoid; }
        @media print {
          .cb-wide { overflow: visible; }
          /* Was 7px, which prints legibly only close up. 8.5px bold is the
             largest that still fits 29 dates plus two totals across A4
             landscape — measured, not guessed. */
          .cb-muster { font-size: 8.5px; }
          .cb-muster th, .cb-muster td { padding: 1.5px 0; width: auto; }
          .cb-muster .cb-name { width: 96px; font-size: 8px; }
          .cb-muster .cb-dow { font-size: 6.5px; }
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
        <RegisterDoc days={days} people={people} lateAfter={lateAfter}
          lateAfterMin={lateAfterMin} lowTurnoutDays={lowTurnoutDays} standalone />
      ) : (
      <>
      {on.has('numbers') && (
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
      )}

      {/* FIRST, because it is the only section that names somebody you can
          still catch. Everything below describes where people are; this
          describes where they are heading. */}
      {on.has('drift') && (drift.slipped.length > 0 || drift.improved.length > 0) && (
        <section className="cb-keep mb-6">
          <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>
            Who changed this month
          </h2>
          <p className="text-[11px] mb-3" style={{ color: MUTED }}>
            Each person against their own earlier self — their typical arrival in the
            second half of the month against the first, not against anybody else.
            This is the only part of the page that names somebody before they are
            late enough to appear on a ranking.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {drift.slipped.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: INK_2 }}>
                  Coming in later ({drift.slipped.length})
                </p>
                <Drift rows={drift.slipped} tone="worse" onPick={setPickedId} />
              </div>
            )}
            {drift.improved.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: INK_2 }}>
                  Coming in earlier ({drift.improved.length})
                </p>
                <Drift rows={drift.improved} tone="better" onPick={setPickedId} />
              </div>
            )}
          </div>
          <p className="text-[10px] mt-3" style={{ color: MUTED }}>
            Typical arrival is a median, and a name appears only with at least three
            arrivals in each half and a shift of 15 minutes or more — so a fortnight
            of approved leave cannot read as a change somebody made. Tap a name for
            their day-by-day record.
          </p>
        </section>
      )}

      {on.has('daily') && (
      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>Every working day</h2>
        <Legend keys={['on-time', 'late', 'absent']} />
        <DailyColumns perDay={perDay} />
      </section>
      )}

      {on.has('intime') && (
      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>
          In-time — everybody, earliest first
        </h2>
        {/* HOW TO READ IT, in one sentence, first. This chart was reported as
            complicated, and an explanation that arrived after the picture was
            part of why. */}
        <p className="text-[11px] mb-2" style={{ color: INK_2 }}>
          <strong>Left of the amber line is on time; right of it is late.</strong>{' '}
          <span style={{ color: MUTED }}>
            The dot is their usual arrival. The faint bar through it is how much that
            arrival moves about — a short bar is somebody who walks in at the same
            minute every day, a long one is somebody you cannot predict.
          </span>
        </p>
        <ArrivalDots people={people} lateAfterMin={lateAfterMin} onPick={setPickedId} />
      </section>
      )}

      {on.has('late') && (
      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>Late arrivals, most first</h2>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          Count of late days, with the share of days they were in — eight of nine is a different
          conversation from eight of twenty-six.
        </p>
        <LateRanking people={people} />
      </section>
      )}

      {on.has('grid') && (
      <section className="cb-keep mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: INK }}>The month, person by person</h2>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>
          One square per person per working day. A run of amber is a habit; a scatter of it is a bad week.
        </p>
        <Legend keys={['on-time', 'late', 'absent', 'leave', 'off']} />
        <Heatmap days={days} people={people} onPick={setPickedId} />
      </section>
      )}

      {/* EACH PERSON, DAY BY DAY — every name, not one from a dropdown.
          It was one person at a time behind a select, which reads on paper as
          individual attendance having been removed from the report: print it and
          you got whichever single name happened to be picked, or a sentence
          asking you to pick one. The dropdown is still here, and it now NARROWS
          this section to one name rather than being the only way to see any. */}
      {on.has('person') && (
      <section className="cb-page-break mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold" style={{ color: INK }}>
            {picked ? `${picked.name} — day by day` : 'Each person, day by day'}
          </h2>
          {/* A plain select, not a search box: thirty names is a list you
              scroll, not one you have to spell. Clicking any name in the charts
              above lands here too. */}
          <select value={pickedId} onChange={(e) => setPickedId(e.target.value)}
            className="cb-no-print border border-gray-200 rounded-md px-2 py-1.5 text-xs outline-none focus:border-[#f26522]">
            <option value="">Everybody</option>
            {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <option key={p.id} value={p.id}>{p.name} only</option>
            ))}
          </select>
          {picked && (
            <button onClick={() => setPickedId('')}
              className="cb-no-print text-xs text-gray-500 hover:text-[#10243E] underline">
              show everybody
            </button>
          )}
        </div>
        <p className="text-[11px] mb-3" style={{ color: MUTED }}>
          Every working day for {picked ? 'this person' : `all ${people.length} names`} — the
          time they came in, the time they left, the hours, and how many minutes past
          the grace. Minutes rather than a flag: &ldquo;late&rdquo; is a verdict,
          &ldquo;9 minutes&rdquo; is a fact the person can answer.
          {!picked && ' Pick one name above to print just theirs.'}
        </p>

        {picked ? (
          <PersonMonth person={picked} days={days} lateAfterMin={lateAfterMin} />
        ) : (
          <div className="cb-people">
            {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <div key={p.id} className="cb-keep cb-person">
                <PersonMonth person={p} days={days} lateAfterMin={lateAfterMin} compact />
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {on.has('table') && (
      <section>
        <h2 className="text-sm font-semibold mb-2" style={{ color: INK }}>The numbers</h2>
        {/* THE FIGURES ARE INK, not grey. Every number here was INK_2 at 11px,
            which is a mid-grey read across a desk as smudge. The label column
            can be quiet; the numbers are the document. */}
        <table className="w-full text-left text-[12px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: INK_2, borderBottom: `1.5px solid ${INK_2}` }}>
              <th className="py-1.5 pr-2 font-semibold">Name</th>
              <th className="py-1.5 px-2 font-semibold">Team</th>
              <th className="py-1.5 px-2 font-semibold text-right">Present</th>
              <th className="py-1.5 px-2 font-semibold text-right">On time</th>
              <th className="py-1.5 px-2 font-semibold text-right">Late</th>
              <th className="py-1.5 px-2 font-semibold text-right">Absent</th>
              <th className="py-1.5 px-2 font-semibold text-right">Leave</th>
              <th className="py-1.5 px-2 font-semibold text-right">Attendance</th>
              <th className="py-1.5 px-2 font-semibold text-right">Typical arrival</th>
              <th className="py-1.5 px-2 font-semibold text-right">Usually between</th>
              <th className="py-1.5 pl-2 font-semibold text-right">Avg hrs</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            {people.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${GRID}`, color: INK, fontWeight: 600 }}>
                <td className="py-1.5 pr-2" style={{ color: INK, fontWeight: 600 }}>{p.name}</td>
                <td className="py-1.5 px-2" style={{ color: INK_2, fontWeight: 400 }}>{p.team || 'Main'}</td>
                <td className="py-1.5 px-2 text-right">{p.present}</td>
                <td className="py-1.5 px-2 text-right">{p.onTime}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: p.late ? INK_LATE : INK_2, fontWeight: 700 }}>
                  {p.late}
                </td>
                <td className="py-1.5 px-2 text-right">{p.absent}</td>
                <td className="py-1.5 px-2 text-right">{p.leave}</td>
                <td className="py-1.5 px-2 text-right">{p.attendancePct == null ? '—' : `${p.attendancePct}%`}</td>
                <td className="py-1.5 px-2 text-right">{fmtMinutes(p.medianArrival)}</td>
                <td className="py-1.5 px-2 text-right" style={{ color: INK_2, fontWeight: 400 }}>
                  {p.arrivalP25 == null ? '—' : `${fmtMinutes(p.arrivalP25)}–${fmtMinutes(p.arrivalP75)}`}
                </td>
                <td className="py-1.5 pl-2 text-right">{p.avgHours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}

      {on.has('register') && (
        <RegisterDoc days={days} people={people} lateAfter={lateAfter}
          lateAfterMin={lateAfterMin} lowTurnoutDays={lowTurnoutDays} />
      )}

      {/* NOTHING SELECTED IS A STATE, not a blank page. */}
      {on.size === 0 && (
        <p className="text-sm p-8 text-center" style={{ color: MUTED }}>
          Nothing is switched on. Use <strong>What prints</strong> above to choose the
          sections you want.
        </p>
      )}
      </>
      )}
    </div>
  );
}
