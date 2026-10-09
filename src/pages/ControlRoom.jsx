import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import AttendanceHealth from '../components/AttendanceHealth';
import Seo from '../components/Seo';
import { ADMIN_EMAILS } from '../lib/admin';
import { friendlyError } from '../lib/errors';
import {
  SlidersHorizontal, RefreshCw, AlertTriangle, CheckCircle2, Clock, Users,
  Cpu, Download, Power, Activity, CalendarOff, X, Search, UserPlus,
} from 'lucide-react';

/**
 * The Control Room — one screen for the machine and the messages.
 *
 * The founder asked on 9 October 2026 for a dashboard that runs the machine
 * without a developer: whose name to change, which group each person's
 * attendance goes to, and what time each message is sent. Two of those had
 * controls spread across three consoles; the time had none.
 *
 * Nothing here is a second copy. Names save to the roster, and the existing
 * trigger renames the person on the terminal; groups are cb_employees.team_id;
 * times are read from and written to pg_cron through cb_set_message_time(),
 * which is the ONE place a time can change. The detailed consoles —
 * /admin/machine, /admin/whatsapp, /admin/attendance — still exist for the
 * deep work; this page is the everyday one.
 *
 * It leads with what needs a decision. Ananya was put on the Backend team on
 * 7 October and never appeared in its message, because "on a team" and "named
 * in the messages" are two separate switches and nothing said so. That is the
 * first thing this page checks.
 */

// At module scope, not inside the page: a component declared during render is
// a new type every render and React remounts it each time.
function Note({ notes, k }) {
  const n = notes[k];
  if (!n) return null;
  return <p className={`text-xs mt-1 ${n.ok ? 'text-green-700' : 'text-red-600'}`}>{n.text}</p>;
}

const fmtIst = (mins) =>
  mins == null ? '—' : `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const todayIst = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

// ISO weekday, as cb_employees.weekly_off stores it.
const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']];

const minutesAgo = (ts) => (ts ? Math.round((Date.now() - new Date(ts).getTime()) / 60000) : null);

export default function ControlRoom() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [settings, setSettings] = useState(null);
  const [pauses, setPauses] = useState([]);
  const [machine, setMachine] = useState(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  // Results print beside the control that produced them — a banner at the top
  // is five screens from the button on a phone, and reads as "nothing happened".
  const [notes, setNotes] = useState({});
  const note = (key, text, ok = true) => setNotes((n) => ({ ...n, [key]: { text, ok } }));

  const [query, setQuery] = useState('');
  const [names, setNames] = useState({});   // unsaved name edits, by employee id
  const [times, setTimes] = useState({});   // unsaved time edits, by kind
  const [adding, setAdding] = useState(null);
  const [pauseDate, setPauseDate] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsAdmin(!!s && ADMIN_EMAILS.includes(s.user.email?.toLowerCase()));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setIsAdmin(!!s && ADMIN_EMAILS.includes(s.user.email?.toLowerCase()));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    const [emp, tb, dir, mism, sched, set, pz, mc] = await Promise.all([
      supabase.from('cb_employees')
        .select('id, full_name, device_code, team_id, in_daily_report, is_senior, is_active, left_on, weekly_off')
        .eq('is_active', true).is('left_on', null).order('full_name'),
      supabase.rpc('cb_team_board'),
      supabase.rpc('cb_device_code_directory'),
      supabase.rpc('cb_device_name_mismatches'),
      supabase.rpc('cb_message_schedule'),
      supabase.from('cb_hr_settings').select('id, daily_report_enabled, wa_messages_enabled').limit(1).maybeSingle(),
      supabase.from('cb_message_pauses').select('pause_date, reason, created_by')
        .gte('pause_date', todayIst()).order('pause_date'),
      supabase.rpc('cb_machine_console'),
    ]);
    const firstErr = [emp, tb, dir, sched, set].find((r) => r.error)?.error;
    setError(firstErr ? friendlyError(firstErr) : '');
    setPeople(emp.data || []);
    setTeams(tb.data || []);
    setDirectory(dir.data || []);
    setMismatches(mism.data || []);
    setSchedule(sched.data || []);
    setSettings(set.data || null);
    setPauses(pz.data || []);
    setMachine(mc.data || null);
  }, [isAdmin]);

  useEffect(() => { refresh(); }, [refresh]);

  const signIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setAuthError(friendlyError(err));
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const machineName = useMemo(
    () => Object.fromEntries(directory.map((d) => [d.device_code, d.machine_name])),
    [directory],
  );

  /**
   * Where a person's attendance is sent, in the words the founder uses.
   *
   * Mirrors cb_daily_attendance_report(): a team routes only when it is active
   * and has a group of its own (otherwise its people fall back to the main
   * group), and a senior is named in a group only on a team that includes
   * seniors. Everybody is in the founder's own 11:30 register regardless.
   */
  const routeOf = useCallback((p) => {
    const t = p.team_id ? teamById[p.team_id] : null;
    const routed = t && t.is_active && t.wa_group_id;
    const group = routed ? t.name : 'Main group';
    if (!p.in_daily_report) return { group, named: false, why: 'Not in the messages' };
    if (p.is_senior && !(routed && t.include_seniors)) {
      return { group, named: false, why: 'Senior — founder’s register only' };
    }
    return { group, named: true, why: '' };
  }, [teamById]);

  // Codes punching in the last 30 days with nobody on the roster behind them.
  const unowned = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return directory
      .filter((d) => d.status !== 'assigned' && d.last_seen && d.last_seen >= cutoff)
      .sort((a, b) => (b.last_seen || '').localeCompare(a.last_seen || ''));
  }, [directory]);

  const attention = useMemo(() => {
    const items = [];
    for (const p of people) {
      const t = p.team_id ? teamById[p.team_id] : null;
      if (t && !p.in_daily_report) {
        items.push({
          key: `team-${p.id}`,
          text: `${p.full_name.trim()} is on ${t.name} but is not named in any message — so ${t.name}'s group never sees their attendance.`,
          fix: 'Name them in the messages',
          run: () => updatePerson(p, { in_daily_report: true }, `team-${p.id}`),
        });
      }
      if (p.in_daily_report && !p.device_code) {
        items.push({
          key: `nocode-${p.id}`,
          text: `${p.full_name.trim()} is named in the messages but has no machine code, so they will read Absent every day. Enrol them on the machine, or mark them left if they have gone.`,
          fix: 'Take out of messages for now',
          run: () => updatePerson(p, { in_daily_report: false }, `nocode-${p.id}`),
        });
      }
    }
    const recentUnowned = unowned.filter((u) => u.status === 'unowned' || u.status === 'released');
    if (recentUnowned.length) {
      items.push({
        key: 'unowned',
        text: `${recentUnowned.length} machine code${recentUnowned.length === 1 ? ' is' : 's are'} punching with nobody on the roster — their attendance is stored and attached to no one. They are listed under "On the machine, not on the roster" below.`,
      });
    }
    if (mismatches.length) {
      items.push({
        key: 'mism',
        text: `${mismatches.length} name${mismatches.length === 1 ? '' : 's'} on the machine do${mismatches.length === 1 ? 'es' : ''} not match the roster.`,
        fix: 'Make the machine match the roster',
        run: async () => {
          for (const m of mismatches) {
            // eslint-disable-next-line no-await-in-loop
            await supabase.rpc('cb_queue_device_command', {
              p_kind: 'rename_user', p_args: { pin: m.device_code, name: m.roster_name },
            });
          }
          note('mism', `${mismatches.length} rename${mismatches.length === 1 ? '' : 's'} sent to the machine. It takes them one at a time.`);
          refresh();
        },
      });
    }
    if (settings && !settings.daily_report_enabled) {
      items.push({
        key: 'master',
        text: 'All WhatsApp messages are switched off.',
        fix: 'Switch them back on',
        run: () => saveSettings({ daily_report_enabled: true }, 'master'),
      });
    }
    if (machine && minutesAgo(machine.last_contact) > 30) {
      items.push({
        key: 'machine',
        text: `The machine has not contacted us for ${minutesAgo(machine.last_contact)} minutes. Punches will be stored on it until it reconnects — check its power and network.`,
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, teamById, unowned, mismatches, settings, machine]);

  // ── Writes ─────────────────────────────────────────────────────────────
  async function updatePerson(p, patch, key = p.id) {
    setBusy(key);
    const { error: err } = await supabase.from('cb_employees').update(patch).eq('id', p.id);
    setBusy('');
    if (err) return note(key, friendlyError(err), false);
    setPeople((list) => list.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    if ('full_name' in patch && p.device_code) {
      note(key, 'Saved. The machine is renamed automatically — it shows on the terminal within a minute.');
    } else {
      note(key, 'Saved.');
    }
    return null;
  }

  async function saveSettings(patch, key) {
    if (!settings?.id) return;
    const { error: err } = await supabase.from('cb_hr_settings').update(patch).eq('id', settings.id);
    if (err) return note(key, friendlyError(err), false);
    setSettings((s) => ({ ...s, ...patch }));
    return note(key, 'Saved.');
  }

  const toggleMessage = (kind, on) =>
    saveSettings({ wa_messages_enabled: { ...(settings?.wa_messages_enabled || {}), [kind]: on } }, `msg-${kind}`);

  const saveTime = async (row) => {
    const hhmm = times[row.kind];
    if (!hhmm) return;
    setBusy(`time-${row.kind}`);
    const { error: err } = await supabase.rpc('cb_set_message_time', { p_kind: row.kind, p_hhmm: hhmm });
    setBusy('');
    if (err) return note(`time-${row.kind}`, friendlyError(err), false);
    setTimes((t) => ({ ...t, [row.kind]: undefined }));
    note(`time-${row.kind}`, `Moved to ${hhmm}. It goes out at the new time from the next send.`);
    return refresh();
  };

  const markLeft = async (p) => {
    // Asked, never assumed: somebody is usually marked left a few days after
    // they actually stopped coming.
    const day = window.prompt(
      `Last working day for ${p.full_name.trim()} (YYYY-MM-DD)?\nTheir past attendance is kept, and their machine code is freed for somebody else.`,
      todayIst(),
    );
    if (!day) return;
    setBusy(p.id);
    const { error: err } = await supabase.rpc('cb_mark_employee_left', { p_employee: p.id, p_left_on: day });
    setBusy('');
    if (err) return note(p.id, friendlyError(err), false);
    note(p.id, `Marked as left on ${day}.`);
    return refresh();
  };

  const renameOnMachineOnly = async (code, name) => {
    const { error: err } = await supabase.rpc('cb_queue_device_command', {
      p_kind: 'rename_user', p_args: { pin: code, name },
    });
    if (err) return note(`code-${code}`, friendlyError(err), false);
    return note(`code-${code}`, `Rename sent to the machine as "${name}".`);
  };

  const addToRoster = async () => {
    const { code, name, team, named } = adding;
    if (!name.trim()) return note(`code-${code}`, 'Type a name first.', false);
    setBusy(`code-${code}`);
    const args = { p_code: code, p_name: name.trim(), p_senior: false };
    if (team) args.p_team = team;
    const { data: r, error: err } = await supabase.rpc('cb_adopt_device_code', args);
    if (!err && named && r?.employee_id) {
      await supabase.from('cb_employees').update({ in_daily_report: true }).eq('id', r.employee_id);
    }
    setBusy('');
    if (err) return note(`code-${code}`, friendlyError(err), false);
    note(`code-${code}`, `${name.trim()} added on #${code}${named ? ' and named in the messages' : ''}.`);
    setAdding(null);
    return refresh();
  };

  const queue = async (kind, key) => {
    setBusy(key);
    const { error: err } = await supabase.rpc('cb_queue_device_command', { p_kind: kind, p_args: {} });
    setBusy('');
    if (err) return note(key, friendlyError(err), false);
    return note(key, 'Sent. The machine picks it up within a few seconds.');
  };

  const addPause = async () => {
    if (!pauseDate) return;
    const { error: err } = await supabase.from('cb_message_pauses')
      .upsert({ pause_date: pauseDate, reason: pauseReason || null });
    if (err) return note('pause', friendlyError(err), false);
    setPauseDate(''); setPauseReason('');
    note('pause', 'No scheduled messages will go out that day.');
    return refresh();
  };

  const removePause = async (d) => {
    await supabase.from('cb_message_pauses').delete().eq('pause_date', d);
    refresh();
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Seo title="Control Room" noIndex />
        <form onSubmit={signIn} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-[#10243E] mb-1">Control Room</h1>
          <p className="text-sm text-gray-500 mb-6">Admin sign-in.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 outline-none focus:border-[#D4AF37]" />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {(authError || (session && !isAdmin)) && (
            <p className="text-sm text-red-600 mt-3">{authError || 'That account is not an admin.'}</p>
          )}
          <button className="w-full mt-4 py-2 rounded-md bg-[#10243E] text-white font-medium hover:bg-[#1b3a63]">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = people.filter((p) => !q
    || p.full_name.toLowerCase().includes(q)
    || String(p.device_code || '').includes(q)
    || (machineName[p.device_code] || '').toLowerCase().includes(q));

  const groups = [
    { name: 'Main group', members: [] },
    ...teams.filter((t) => t.is_active && t.wa_group_id).map((t) => ({ name: t.name, members: [] })),
  ];
  for (const p of people) {
    const r = routeOf(p);
    if (r.named) groups.find((g) => g.name === r.group)?.members.push(p.full_name.trim());
  }

  const pausedToday = pauses.some((p) => p.pause_date === todayIst());

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo title="Control Room" noIndex />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminNav className="mb-6" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-[#10243E] flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-[#f26522]" /> Control Room
          </h1>
          <button onClick={refresh} className="text-sm text-gray-500 hover:text-[#10243E] flex items-center gap-1.5">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Names, groups, message times and the machine — on one screen. Every change
          here takes effect straight away; nothing needs a developer.
        </p>

        {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

        <AttendanceHealth className="mb-6" />

        {/* ── Needs your attention ─────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-3 flex items-center gap-2">
            {attention.length
              ? <><AlertTriangle size={18} className="text-amber-600" /> Needs your attention — {attention.length}</>
              : <><CheckCircle2 size={18} className="text-green-600" /> Nothing needs your attention</>}
          </h2>
          {pausedToday && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3 mb-3">
              Today is marked as office closed — no scheduled messages will go out.
            </p>
          )}
          <ul className="space-y-3">
            {attention.map((a) => (
              <li key={a.key} className="text-sm text-gray-700 border-l-4 border-amber-300 pl-3">
                <p>{a.text}</p>
                {a.run && (
                  <button onClick={a.run} disabled={busy === a.key}
                    className="mt-1.5 text-xs px-2.5 py-1 rounded border border-[#10243E] text-[#10243E] hover:bg-[#10243E] hover:text-white disabled:opacity-50">
                    {a.fix}
                  </button>
                )}
                <Note notes={notes} k={a.key} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Messages and their times ─────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="font-semibold text-[#10243E] flex items-center gap-2">
              <Clock size={18} /> Messages and their times
            </h2>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={!!settings?.daily_report_enabled}
                onChange={(e) => saveSettings({ daily_report_enabled: e.target.checked }, 'master')} />
              All messages on
            </label>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Times are India time. Each message can move only within the window its own
            wording allows — the reason is written under it. To see exactly what a message
            will say, use Preview on <Link to="/admin/whatsapp" className="underline">WhatsApp</Link>.
          </p>
          <div className="divide-y divide-gray-50">
            {schedule.map((row) => {
              const isMsg = row.kind !== 'users';
              const draft = times[row.kind];
              return (
                <div key={row.kind} className="py-3 flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-medium text-[#10243E]">{row.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{row.rule}</p>
                    {!row.job_active && <p className="text-xs text-red-600 mt-0.5">This job is switched off in the scheduler.</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="time" value={draft ?? fmtIst(row.ist_minutes)}
                      onChange={(e) => setTimes((t) => ({ ...t, [row.kind]: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm tabular-nums" />
                    {draft && draft !== fmtIst(row.ist_minutes) && (
                      <button onClick={() => saveTime(row)} disabled={busy === `time-${row.kind}`}
                        className="text-xs px-2.5 py-1.5 rounded bg-[#10243E] text-white disabled:opacity-50">
                        Save time
                      </button>
                    )}
                    {isMsg && (
                      <label className="text-xs flex items-center gap-1.5 ml-2">
                        <input type="checkbox" checked={row.message_on}
                          onChange={(e) => toggleMessage(row.kind, e.target.checked).then(refresh)} />
                        On
                      </label>
                    )}
                  </div>
                  <div className="basis-full">
                    <Note notes={notes} k={`time-${row.kind}`} />
                    <Note notes={notes} k={`msg-${row.kind}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Office closed */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-[#10243E] flex items-center gap-2">
              <CalendarOff size={16} /> Office closed — no messages that day
            </p>
            <p className="text-xs text-gray-500 mb-2">
              For a holiday. Without this the group is told the machine sent nothing, or
              the one person who tapped in is the only one not called Absent. "Send now" on
              the WhatsApp page still works on a closed day.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <input type="date" value={pauseDate} min={todayIst()} onChange={(e) => setPauseDate(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm" />
              <input value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Reason (e.g. Diwali)"
                className="border border-gray-200 rounded px-2 py-1.5 text-sm flex-1 min-w-[140px]" />
              <button onClick={addPause} disabled={!pauseDate}
                className="text-sm px-3 py-1.5 rounded bg-[#10243E] text-white disabled:opacity-40">
                Close this day
              </button>
            </div>
            <Note notes={notes} k="pause" />
            {pauses.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {pauses.map((p) => (
                  <li key={p.pause_date} className="text-xs bg-amber-50 text-amber-900 rounded-full pl-3 pr-1 py-1 flex items-center gap-1">
                    {p.pause_date}{p.reason ? ` — ${p.reason}` : ''}
                    <button onClick={() => removePause(p.pause_date)} aria-label="Reopen this day" className="p-0.5 hover:text-red-700">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Who each group names ─────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
            <Users size={18} /> Who each group names
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Every person is in the founder&apos;s own register. These are the people each
            WhatsApp group sees. Move somebody by changing their group below; add or rename a
            group on <Link to="/admin/whatsapp" className="underline">WhatsApp</Link>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.name} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-[#10243E]">{g.name} <span className="text-gray-400 font-normal">— {g.members.length}</span></p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {g.members.length ? g.members.join(', ') : 'Nobody — this group gets no attendance message.'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── People ───────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="font-semibold text-[#10243E]">People — {people.length}</h2>
            <label className="relative">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or code"
                className="border border-gray-200 rounded pl-7 pr-2 py-1.5 text-sm w-52" />
            </label>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Change a name and press Save — the machine is renamed too. The group decides
            which WhatsApp group names them; &quot;In messages&quot; decides whether any
            message names them at all.
          </p>

          <div className="divide-y divide-gray-50">
            {shown.map((p) => {
              const r = routeOf(p);
              const draft = names[p.id];
              const onMachine = p.device_code ? machineName[p.device_code] : null;
              return (
                <div key={p.id} className="py-3 flex flex-wrap items-center gap-2">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${p.device_code ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-700'}`}>
                    {p.device_code ? `#${p.device_code}` : 'no code'}
                  </span>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex gap-1.5">
                      <input value={draft ?? p.full_name} onChange={(e) => setNames((n) => ({ ...n, [p.id]: e.target.value }))}
                        className="border border-gray-200 rounded px-2 py-1 text-sm text-[#10243E] w-full" />
                      {draft != null && draft.trim() && draft !== p.full_name && (
                        <button onClick={async () => { await updatePerson(p, { full_name: draft.trim() }); setNames((n) => ({ ...n, [p.id]: undefined })); }}
                          className="text-xs px-2 rounded bg-[#10243E] text-white">Save</button>
                      )}
                    </div>
                    {onMachine && onMachine.trim().toLowerCase() !== p.full_name.trim().toLowerCase() && (
                      <p className="text-[11px] text-gray-500 mt-0.5">Machine shows “{onMachine}”</p>
                    )}
                  </div>
                  <select value={p.team_id || ''} onChange={(e) => updatePerson(p, { team_id: e.target.value || null })}
                    className="border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                    <option value="">Main group</option>
                    {teams.filter((t) => t.is_active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={!!p.in_daily_report}
                      onChange={(e) => updatePerson(p, { in_daily_report: e.target.checked })} />
                    In messages
                  </label>
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={!!p.is_senior}
                      onChange={(e) => updatePerson(p, { is_senior: e.target.checked })} />
                    Senior
                  </label>
                  {/* One day, the way this office works. Somebody with no punch
                      on it is "Weekly off" — never Absent, never named. */}
                  <select value={p.weekly_off?.[0] ?? ''} title="Weekly off"
                    onChange={(e) => updatePerson(p, { weekly_off: e.target.value ? [Number(e.target.value)] : [] })}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white">
                    <option value="">No day off</option>
                    {WEEKDAYS.map(([n, d]) => <option key={n} value={n}>Off: {d}</option>)}
                  </select>
                  <button onClick={() => markLeft(p)} className="text-xs text-gray-400 hover:text-red-700">Left…</button>
                  <p className="basis-full text-[11px] text-gray-500 -mt-1">
                    {r.named ? `Named in: ${r.group}` : r.why}
                  </p>
                  <div className="basis-full"><Note notes={notes} k={p.id} /></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── On the machine, not on the roster ────────────────────── */}
        {unowned.length > 0 && (
          <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-[#10243E] mb-1">On the machine, not on the roster — {unowned.length}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Punched in the last 30 days. Their attendance is stored and attached to no one
              until they are added. Pantry staff and the founder&apos;s own IDs are here on
              purpose and marked so.
            </p>
            <div className="divide-y divide-gray-50">
              {unowned.map((u) => {
                const k = `code-${u.device_code}`;
                const open = adding?.code === u.device_code;
                return (
                  <div key={u.device_code} className="py-2.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{u.device_code}</span>
                    <span className="text-sm text-[#10243E] flex-1 min-w-[140px]">
                      {u.machine_name || 'No name on the machine'}
                      {u.status === 'ignored' && <span className="ml-2 text-[10px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">not tracked{u.note ? ` · ${u.note}` : ''}</span>}
                      {u.status === 'released' && u.previous_holder && <span className="ml-2 text-[11px] text-gray-500">was {u.previous_holder}</span>}
                    </span>
                    <span className="text-xs text-gray-500">{u.punches} punches · last {u.last_seen}</span>
                    {!open && (
                      <button onClick={() => setAdding({ code: u.device_code, name: u.machine_name || '', team: '', named: false })}
                        className="text-xs px-2 py-1 rounded border border-[#10243E] text-[#10243E] hover:bg-[#10243E] hover:text-white flex items-center gap-1">
                        <UserPlus size={13} /> Add to roster
                      </button>
                    )}
                    {open && (
                      <div className="basis-full p-3 bg-gray-50 rounded-lg flex flex-wrap items-end gap-2">
                        <label className="text-xs text-gray-600 flex-1 min-w-[160px]">Name
                          <input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })}
                            className="mt-1 w-full border border-gray-200 rounded px-2 py-1.5 text-sm" />
                        </label>
                        <label className="text-xs text-gray-600">Group
                          <select value={adding.team} onChange={(e) => setAdding({ ...adding, team: e.target.value })}
                            className="mt-1 block border border-gray-200 rounded px-2 py-1.5 text-sm bg-white">
                            <option value="">Main group</option>
                            {teams.filter((t) => t.is_active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </label>
                        <label className="text-xs flex items-center gap-1.5 pb-2">
                          <input type="checkbox" checked={adding.named} onChange={(e) => setAdding({ ...adding, named: e.target.checked })} />
                          Name them in the WhatsApp messages
                        </label>
                        <button onClick={addToRoster} disabled={busy === k}
                          className="text-sm px-3 py-1.5 rounded bg-[#10243E] text-white disabled:opacity-50">Add on #{u.device_code}</button>
                        <button onClick={() => {
                          if (adding.name.trim()) renameOnMachineOnly(u.device_code, adding.name.trim());
                        }} className="text-xs text-gray-600 underline pb-2">Only rename on the machine</button>
                        <button onClick={() => setAdding(null)} className="text-sm text-gray-500 pb-1.5">Cancel</button>
                      </div>
                    )}
                    <div className="basis-full"><Note notes={notes} k={k} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── The machine ──────────────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2"><Cpu size={18} /> The machine</h2>
          <p className="text-sm text-gray-500 mb-4">
            {machine?.last_contact
              ? <>Last heard from {minutesAgo(machine.last_contact)} min ago · {machine.punches_today ?? 0} punches today.</>
              : 'The machine has never contacted us.'}{' '}
            Enrolments, deletions and the full log are on the{' '}
            <Link to="/admin/machine" className="underline">Machine</Link> page.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { kind: 'query_users', Icon: Users, label: 'Read names from the machine' },
              { kind: 'refresh_all', Icon: Download, label: 'Fetch every stored punch' },
              { kind: 'sync_time', Icon: Activity, label: 'Set its clock to now' },
              { kind: 'reboot', Icon: Power, label: 'Restart the machine', confirm: 'Restart the attendance machine now? Punches stored on it survive a restart.' },
            ].map((a) => (
              <div key={a.kind}>
                <button
                  onClick={() => { if (!a.confirm || window.confirm(a.confirm)) queue(a.kind, `m-${a.kind}`); }}
                  disabled={busy === `m-${a.kind}`}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-[#10243E] text-[#10243E] flex items-center gap-2 disabled:opacity-50">
                  <a.Icon size={16} /> {a.label}
                </button>
                <Note notes={notes} k={`m-${a.kind}`} />
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-gray-400">
          Times are read live from the scheduler, so what this page shows is what will run.
        </p>
      </div>
    </div>
  );
}
