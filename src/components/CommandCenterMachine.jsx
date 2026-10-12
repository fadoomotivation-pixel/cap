import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';
import {
  Fingerprint, Search, Link2, Unlink, Trash2, UserPlus, RotateCcw, Save,
  CalendarClock, AlertTriangle, MessageSquare,
} from 'lucide-react';

/**
 * The attendance machine and the register, run from the Command Center.
 *
 * Built 12 October 2026, when the founder asked for HR to be able to do three
 * things without a developer: see which machine IDs are free, match an ID on
 * the machine to the right person (and take one off the machine), and fix a
 * day's attendance by hand.
 *
 * What prompted it: Sneha and Deepak were punching every day and "their
 * attendance was not coming". It was — 7 and 6 days in two weeks — but both
 * had been switched out of the WhatsApp messages, which from the outside looks
 * exactly like the machine not working. So the first thing this panel shows is
 * anybody in that state, with one button to put them back.
 */

const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const daysAgoIst = (n) => {
  const d = new Date(`${todayIst()}T12:00:00+05:30`);
  d.setDate(d.getDate() - n);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
};
const fmtDate = (d) => (d ? new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');
const fmtDay = (d) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const HR_STATUSES = [
  ['', 'Normal day'],
  ['leave', 'Leave'],
  ['half-day', 'Half day'],
  ['holiday', 'Holiday'],
  ['wfh-approved', 'Work from home (approved)'],
  ['on-duty', 'On duty / field'],
];

const card = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8';
const field = 'border border-gray-200 rounded px-2 py-1.5 text-sm text-[#10243E]';

const STATUS_LABEL = {
  assigned: { text: 'Matched', cls: 'bg-green-50 text-green-800' },
  unowned: { text: 'On machine, no person', cls: 'bg-amber-50 text-amber-800' },
  free: { text: 'Free', cls: 'bg-gray-100 text-gray-600' },
  released: { text: 'Free (person left)', cls: 'bg-gray-100 text-gray-600' },
  ignored: { text: 'Not tracked', cls: 'bg-gray-100 text-gray-500' },
};

/* ───────────────────────── Machine IDs ───────────────────────── */

export function MachineIdsPanel({ roster, onChanged }) {
  const [rows, setRows] = useState(null);
  const [free, setFree] = useState([]);
  const [filter, setFilter] = useState('problems');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState({});
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const [dir, fr] = await Promise.all([
      supabase.rpc('cb_device_code_directory'),
      supabase.rpc('cb_free_device_codes', { p_limit: 12 }),
    ]);
    if (dir.error) { setErr(friendlyError(dir.error)); setRows([]); return; }
    setErr('');
    setRows(dir.data || []);
    setFree(fr.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => (roster || []).filter((e) => e.is_active !== false && !e.left_on), [roster]);
  const withoutCode = useMemo(
    () => active.filter((e) => !e.device_code).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [active],
  );
  const byCode = useMemo(() => Object.fromEntries(active.filter((e) => e.device_code).map((e) => [e.device_code, e])), [active]);

  // The Sneha/Deepak shape: punching, and named in no message.
  const silent = useMemo(() => {
    if (!rows) return [];
    const recent = daysAgoIst(14);
    return rows
      .filter((r) => r.status === 'assigned' && r.last_seen && r.last_seen >= recent)
      .map((r) => byCode[r.device_code])
      .filter((e) => e && e.in_daily_report === false);
  }, [rows, byCode]);

  const say = (code, text, ok = true) => setMsg((m) => ({ ...m, [code]: { text, ok } }));

  const run = async (key, code, fn) => {
    setBusy(key);
    try { await fn(); } catch (e) { say(code, friendlyError(e), false); }
    setBusy('');
  };

  const match = (code) => run(`m${code}`, code, async () => {
    const empId = pick[code];
    if (!empId) return say(code, 'Pick a person first.', false);
    const current = byCode[code];
    if (current && current.id !== empId) {
      const { data: d0, error: e0 } = await supabase.rpc('cb_set_device_code', { p_employee: current.id, p_code: null });
      if (e0) throw e0;
      if (d0 && d0.ok === false) return say(code, d0.message, false);
    }
    const { data, error } = await supabase.rpc('cb_set_device_code', { p_employee: empId, p_code: code });
    if (error) throw error;
    if (data && data.ok === false) return say(code, data.message || 'Could not match.', false);
    const who = active.find((e) => e.id === empId)?.full_name?.trim();
    say(code, `ID ${code} is now ${who}. Their past punches on this ID were added to their attendance (${data?.attendance_rows ?? 0} days).`);
    setPick((p) => ({ ...p, [code]: '' }));
    load(); onChanged?.();
  });

  const unmatch = (code) => run(`u${code}`, code, async () => {
    const current = byCode[code];
    if (!current) return;
    if (!window.confirm(`Take ID ${code} away from ${current.full_name.trim()}?\n\nTheir punches stay stored, but stop counting as their attendance until an ID is matched again.`)) return;
    const { error } = await supabase.rpc('cb_set_device_code', { p_employee: current.id, p_code: null });
    if (error) throw error;
    say(code, `ID ${code} is no longer matched to ${current.full_name.trim()}.`);
    load(); onChanged?.();
  });

  const adopt = (r) => run(`a${r.device_code}`, r.device_code, async () => {
    const name = window.prompt(`Add a new person to the roster for machine ID ${r.device_code}.\n\nTheir name:`, r.machine_name || '');
    if (!name || !name.trim()) return;
    const { error } = await supabase.rpc('cb_adopt_device_code', { p_code: r.device_code, p_name: name.trim() });
    if (error) throw error;
    say(r.device_code, `${name.trim()} added with ID ${r.device_code}. They are NOT in the WhatsApp messages yet — switch that on under Manage if they should be.`);
    load(); onChanged?.();
  });

  const removeFromMachine = (r) => run(`d${r.device_code}`, r.device_code, async () => {
    const holder = byCode[r.device_code];
    const who = holder ? holder.full_name.trim() : (r.machine_name || `ID ${r.device_code}`);
    const ok = window.confirm(
      `Remove ${who} (ID ${r.device_code}) from the attendance machine?\n\n`
      + '• Their finger/face will stop working on the machine.\n'
      + '• Attendance already recorded is NOT deleted.\n'
      + '• They can be enrolled again at the machine later.'
      + (holder ? '\n\nIf they have left the company, also use "Has left the company" under Manage.' : ''),
    );
    if (!ok) return;
    const { error } = await supabase.rpc('cb_queue_device_command', { p_kind: 'delete_user', p_args: { pin: r.device_code } });
    if (error) throw error;
    say(r.device_code, 'Sent to the machine. It is removed within a minute; the Machine page shows the machine’s answer.');
  });

  const putInMessages = async (emp) => {
    setBusy(`r${emp.id}`);
    const { error } = await supabase.from('cb_employees').update({ in_daily_report: true }).eq('id', emp.id);
    setBusy('');
    if (error) return setErr(friendlyError(error));
    onChanged?.();
  };

  const shown = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle) {
        return String(r.device_code) === needle
          || (r.machine_name || '').toLowerCase().includes(needle)
          || (r.roster_name || '').toLowerCase().includes(needle);
      }
      if (filter === 'problems') return r.status === 'unowned' && r.last_seen && r.last_seen >= daysAgoIst(60);
      if (filter === 'all') return true;
      if (filter === 'free') return r.status === 'free' || r.status === 'released';
      return r.status === filter;
    });
  }, [rows, filter, q]);

  const neverUsed = free.filter((f) => f.kind === 'never-used');
  const released = free.filter((f) => f.kind !== 'never-used');

  return (
    <div className={card}>
      <h2 className="text-lg font-bold text-[#10243E] flex items-center gap-2"><Fingerprint size={20} className="text-[#9C7C1C]" /> Attendance machine IDs</h2>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Every ID on the machine, and which person it belongs to. Match an ID to the right person, give a new joiner a free ID, or take someone off the machine.
      </p>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      {silent.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5"><AlertTriangle size={15} /> Punching every day, but not in the WhatsApp messages</p>
          <p className="text-xs text-amber-800/80 mb-2">Their attendance is recorded. It just never appears in the group, so it looks like it is not coming.</p>
          <div className="flex flex-wrap gap-2">
            {silent.map((e) => (
              <button key={e.id} onClick={() => putInMessages(e)} disabled={busy === `r${e.id}`}
                className="text-xs px-2.5 py-1.5 rounded border border-amber-300 bg-white text-amber-900 flex items-center gap-1 disabled:opacity-50">
                <MessageSquare size={12} /> {e.full_name.trim()} (ID {e.device_code}) — put in messages
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 mb-4">
        <p className="text-sm font-semibold text-green-900">Free IDs for a new joiner</p>
        <p className="text-xs text-green-800/80 mb-2">Enrol them at the machine with one of these, then match it to them below.</p>
        <div className="flex flex-wrap gap-1.5">
          {neverUsed.length === 0 && <span className="text-xs text-gray-500">Loading…</span>}
          {neverUsed.map((f) => (
            <span key={f.device_code} className="font-mono text-sm px-2 py-0.5 rounded bg-white border border-green-200 text-green-900">{f.device_code}</span>
          ))}
        </div>
        {released.length > 0 && (
          <p className="text-xs text-gray-600 mt-2">
            Also free, used before by someone who left: {released.map((f) => `${f.device_code} (${f.previous_holder})`).join(', ')}. Prefer the ones above.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[
          ['problems', 'Needs matching'],
          ['assigned', 'Matched'],
          ['unowned', 'No person'],
          ['free', 'Free'],
          ['all', 'All'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => { setFilter(k); setQ(''); }}
            className={`text-xs px-3 py-1.5 rounded-full border ${filter === k && !q ? 'bg-[#10243E] text-white border-[#10243E]' : 'border-gray-200 text-gray-600'}`}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1 ml-auto">
          <Search size={13} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID or name" className="text-sm outline-none w-32" />
        </label>
      </div>
      {filter === 'problems' && !q && (
        <p className="text-xs text-gray-500 mb-2">IDs that punched in the last 60 days with nobody on the roster behind them — their attendance is stored and counts for no one.</p>
      )}

      {rows === null ? <p className="text-sm text-gray-400">Loading…</p> : shown.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing here.</p>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {shown.map((r) => {
            const st = STATUS_LABEL[r.status] || { text: r.status, cls: 'bg-gray-100 text-gray-600' };
            const holder = byCode[r.device_code];
            const code = r.device_code;
            return (
              <div key={code} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#10243E] w-12">#{code}</span>
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm text-[#10243E]">
                      {r.roster_name ? <strong>{r.roster_name.trim()}</strong> : <span className="text-gray-400">No person</span>}
                      {r.machine_name && r.machine_name.trim() !== (r.roster_name || '').trim() && (
                        <span className="text-xs text-gray-500"> · machine says “{r.machine_name.trim()}”</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className={`px-1.5 py-0.5 rounded mr-1 ${st.cls}`}>{st.text}</span>
                      {r.punches > 0 ? `${r.punches} punches · last ${fmtDate(r.last_seen)}` : 'never punched'}
                      {r.previous_holder && ` · was ${r.previous_holder}`}
                      {r.note && ` · ${r.note}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(r.status === 'unowned' || r.status === 'assigned' || r.status === 'free' || r.status === 'released') && (
                      <>
                        <select value={pick[code] || ''} onChange={(e) => setPick((p) => ({ ...p, [code]: e.target.value }))} className={`${field} max-w-[170px]`}>
                          <option value="">{holder ? 'Change person…' : 'Match to…'}</option>
                          {withoutCode.map((e) => <option key={e.id} value={e.id}>{e.full_name.trim()}</option>)}
                        </select>
                        <button onClick={() => match(code)} disabled={!pick[code] || busy === `m${code}`}
                          className="text-xs px-2.5 py-1.5 rounded bg-[#10243E] text-white flex items-center gap-1 disabled:opacity-40">
                          <Link2 size={12} /> Match
                        </button>
                      </>
                    )}
                    {r.status === 'unowned' && (
                      <button onClick={() => adopt(r)} disabled={busy === `a${code}`}
                        className="text-xs px-2.5 py-1.5 rounded border border-[#10243E] text-[#10243E] flex items-center gap-1 disabled:opacity-40">
                        <UserPlus size={12} /> New person
                      </button>
                    )}
                    {holder && (
                      <button onClick={() => unmatch(code)} disabled={busy === `u${code}`}
                        className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 flex items-center gap-1 disabled:opacity-40">
                        <Unlink size={12} /> Unmatch
                      </button>
                    )}
                    {r.status !== 'free' && (
                      <button onClick={() => removeFromMachine(r)} disabled={busy === `d${code}`}
                        className="text-xs px-2.5 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1 disabled:opacity-40">
                        <Trash2 size={12} /> Remove from machine
                      </button>
                    )}
                  </div>
                </div>
                {msg[code] && <p className={`text-xs mt-1.5 ml-14 ${msg[code].ok ? 'text-green-700' : 'text-red-600'}`}>{msg[code].text}</p>}
              </div>
            );
          })}
        </div>
      )}
      {withoutCode.length > 0 && (
        <p className="text-xs text-gray-500 mt-3">
          On the roster with no machine ID ({withoutCode.length}): {withoutCode.map((e) => e.full_name.trim()).join(', ')}. They can never punch until an ID is matched.
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Fix attendance ───────────────────────── */

function DayRow({ emp, d, onSaved }) {
  const [inT, setIn] = useState(d.check_in || '');
  const [outT, setOut] = useState(d.check_out || '');
  const [st, setSt] = useState(d.hr_status || '');
  const [note, setNote] = useState(d.hr_note || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const dirty = inT !== (d.check_in || '') || outT !== (d.check_out || '') || st !== (d.hr_status || '') || note !== (d.hr_note || '');

  const call = async (reset) => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc('cb_hr_fix_attendance', {
      p_employee: emp.id, p_date: d.work_date,
      p_in: inT || null, p_out: outT || null, p_hr_status: st || null, p_note: note || null,
      p_reset: reset,
    });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: friendlyError(error) });
    setMsg({ ok: true, text: reset ? 'Back to the machine’s times.' : 'Saved. The machine will not overwrite this.' });
    onSaved();
  };

  const absent = !d.check_in && !d.hr_status;
  return (
    <div className={`py-2.5 ${d.hr_edited_at ? 'bg-[#FAF6E9]/60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm w-28 ${absent ? 'text-red-700' : 'text-[#10243E]'}`}>{fmtDay(d.work_date)}</span>
        <input type="time" value={inT} onChange={(e) => setIn(e.target.value)} className={`${field} w-[105px]`} aria-label="In" />
        <span className="text-gray-400 text-xs">to</span>
        <input type="time" value={outT} onChange={(e) => setOut(e.target.value)} className={`${field} w-[105px]`} aria-label="Out" />
        <select value={st} onChange={(e) => setSt(e.target.value)} className={`${field} w-[150px]`}>
          {HR_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" className={`${field} flex-1 min-w-[120px]`} />
        <button onClick={() => call(false)} disabled={!dirty || busy}
          className="text-xs px-2.5 py-1.5 rounded bg-[#10243E] text-white flex items-center gap-1 disabled:opacity-30">
          <Save size={12} /> Save
        </button>
        {d.hr_edited_at && (
          <button onClick={() => call(true)} disabled={busy} title="Throw away the correction and use the machine’s times"
            className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-700 flex items-center gap-1 disabled:opacity-40">
            <RotateCcw size={12} /> Undo
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-1 ml-[120px]">
        Machine: {d.punches || 'no punches'}
        {d.hr_edited_at && ` · corrected by ${d.hr_edited_by || 'HR'} on ${new Date(d.hr_edited_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
        {absent && ' · reads as Absent'}
      </p>
      {msg && <p className={`text-xs mt-1 ml-[120px] ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}

/** One person's recent days, each editable. Used on its own and inside Manage. */
export function PersonAttendance({ emp, compact = false }) {
  const [span, setSpan] = useState(7);
  const [days, setDays] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!emp) return;
    const { data, error } = await supabase.rpc('cb_person_attendance', {
      p_employee: emp.id, p_from: daysAgoIst(span - 1), p_to: todayIst(),
    });
    if (error) { setErr(friendlyError(error)); setDays([]); return; }
    setErr(''); setDays(data || []);
  }, [emp, span]);
  useEffect(() => { setDays(null); load(); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {!compact && <p className="text-sm font-semibold text-[#10243E]">{emp.full_name.trim()}{emp.device_code ? ` · ID ${emp.device_code}` : ' · no machine ID'}</p>}
        <div className="flex gap-1 ml-auto">
          {[7, 14, 31].map((n) => (
            <button key={n} onClick={() => setSpan(n)}
              className={`text-xs px-2.5 py-1 rounded-full border ${span === n ? 'bg-[#10243E] text-white border-[#10243E]' : 'border-gray-200 text-gray-600'}`}>
              {n === 31 ? 'Month' : `${n} days`}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {days === null ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="divide-y divide-gray-100">
          {days.map((d) => <DayRow key={`${d.work_date}-${d.hr_edited_at || ''}-${d.check_in || ''}-${d.check_out || ''}-${d.hr_status || ''}`} emp={emp} d={d} onSaved={load} />)}
        </div>
      )}
    </div>
  );
}

export function FixAttendancePanel({ roster }) {
  const people = useMemo(
    () => (roster || []).filter((e) => e.is_active !== false && !e.left_on).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [roster],
  );
  const [id, setId] = useState('');
  const emp = people.find((e) => e.id === id);

  return (
    <div className={card}>
      <h2 className="text-lg font-bold text-[#10243E] flex items-center gap-2"><CalendarClock size={20} className="text-[#9C7C1C]" /> Fix attendance</h2>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Correct an arrival or leaving time, add a missed day, or mark leave / half day. What the machine recorded is shown under each day.
        A corrected day is kept as you set it — the machine does not overwrite it. <strong>Undo</strong> goes back to the machine’s times.
      </p>
      <select value={id} onChange={(e) => setId(e.target.value)} className={`${field} w-full max-w-sm mb-4`}>
        <option value="">Choose a person…</option>
        {people.map((e) => <option key={e.id} value={e.id}>{e.full_name.trim()}{e.device_code ? ` (ID ${e.device_code})` : ''}</option>)}
      </select>
      {emp && <PersonAttendance emp={emp} />}
    </div>
  );
}

/* ───────────────────────── Work settings (inside Manage) ───────────────────────── */

const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']];

/**
 * Everything about how a person is COUNTED, editable in one place: machine ID,
 * whether the messages name them, senior or junior, team, weekly off.
 * Each is the switch behind a real past mistake — see CLAUDE.md.
 */
export function WorkSettings({ row, onChanged }) {
  const [teams, setTeams] = useState([]);
  const [code, setCode] = useState(row?.device_code || '');
  const [free, setFree] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    supabase.from('cb_teams').select('id, name, is_active').order('name').then(({ data }) => setTeams(data || []));
    supabase.rpc('cb_free_device_codes', { p_limit: 6 }).then(({ data }) => setFree((data || []).filter((f) => f.kind === 'never-used')));
  }, []);
  useEffect(() => { setCode(row?.device_code || ''); }, [row?.device_code]);

  if (!row) return null;

  const patch = async (key, p, text) => {
    setBusy(key); setMsg(null);
    const { error } = await supabase.from('cb_employees').update(p).eq('id', row.id);
    setBusy('');
    if (error) return setMsg({ ok: false, text: friendlyError(error) });
    setMsg({ ok: true, text });
    onChanged();
  };

  const saveCode = async () => {
    setBusy('code'); setMsg(null);
    const { data, error } = await supabase.rpc('cb_set_device_code', { p_employee: row.id, p_code: code.trim() || null });
    setBusy('');
    if (error) return setMsg({ ok: false, text: friendlyError(error) });
    if (data && data.ok === false) return setMsg({ ok: false, text: data.message });
    setMsg({ ok: true, text: code.trim() ? `Machine ID ${code.trim()} saved — their punches on it now count (${data?.attendance_rows ?? 0} days).` : 'Machine ID removed.' });
    onChanged();
  };

  const off = row.weekly_off || [];
  const toggleOff = (n) => {
    const next = off.includes(n) ? off.filter((x) => x !== n) : [...off, n].sort();
    patch('off', { weekly_off: next }, next.length ? `Weekly off: ${WEEKDAYS.filter(([d]) => next.includes(d)).map(([, l]) => l).join(', ')}.` : 'No weekly off.');
  };

  const chip = (on) => `text-xs px-2.5 py-1.5 rounded-full border ${on ? 'bg-[#10243E] text-white border-[#10243E]' : 'border-gray-200 text-gray-600'}`;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attendance settings</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs text-gray-600 mb-1">Machine ID</p>
          <div className="flex gap-1.5">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="none" className={`${field} w-24`} />
            <button onClick={saveCode} disabled={busy === 'code' || code === (row.device_code || '')}
              className="text-xs px-2.5 rounded bg-[#10243E] text-white disabled:opacity-30">Save</button>
          </div>
          {!row.device_code && free.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">Free: {free.map((f) => (
              <button key={f.device_code} onClick={() => setCode(f.device_code)} className="font-mono underline mr-1.5">{f.device_code}</button>
            ))}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Team (which WhatsApp group)</p>
          <select value={row.team_id || ''} onChange={(e) => patch('team', { team_id: e.target.value || null }, 'Team saved.')} className={`${field} w-full`}>
            <option value="">Main group</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}{t.is_active === false ? ' (off)' : ''}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => patch('rep', { in_daily_report: !row.in_daily_report }, row.in_daily_report ? 'Taken out of the WhatsApp messages.' : 'Now named in the WhatsApp messages.')}
          className={chip(row.in_daily_report)} disabled={busy === 'rep'}>
          {row.in_daily_report ? '✓ In WhatsApp messages' : 'Not in WhatsApp messages'}
        </button>
        <button onClick={() => patch('sen', { is_senior: !row.is_senior }, row.is_senior ? 'Marked junior.' : 'Marked senior — no longer listed as Absent in the group.')}
          className={chip(row.is_senior)} disabled={busy === 'sen'}>
          {row.is_senior ? '✓ Senior' : 'Junior'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-xs text-gray-600 mr-1">Weekly off:</span>
        {WEEKDAYS.map(([n, l]) => (
          <button key={n} onClick={() => toggleOff(n)} disabled={busy === 'off'} className={chip(off.includes(n))}>{l}</button>
        ))}
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-2">Fix attendance</p>
      <PersonAttendance emp={row} compact />
    </div>
  );
}
