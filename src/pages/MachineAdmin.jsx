import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import Seo from '../components/Seo';
import { ADMIN_EMAILS } from '../lib/admin';
import { friendlyError } from '../lib/errors';
import {
  Cpu, RefreshCw, Users, Clock, Download, Power, AlertTriangle,
  CheckCircle2, Trash2, Pencil, Activity, Radio, X,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * The attendance machine, driven from here instead of from eTimeTrackLite.
 *
 * Every question this module has lost days to lives on that terminal and has
 * been invisible from this side: who is actually enrolled and under which
 * code, whether the punches are still sitting in its memory, whether its
 * clock has drifted. Each answer cost somebody a walk to the office and a
 * Windows Forms menu — and the five silent days in September were exactly
 * that walk not happening.
 *
 * The ADMS protocol already carries a command channel: the terminal asks
 * "anything for me?" every few seconds, and a server may answer with one
 * instruction. `essl-adms` answered "no" for good reasons. This is the
 * narrow, audited version of yes.
 *
 * What it cannot do is as important as what it can. The command text is built
 * in `cb_queue_device_command` from a whitelist of kinds — the browser sends a
 * kind and arguments, never a command string. There is no input by which
 * clearing the device's data, clearing its logs or releasing the door lock
 * can be expressed. And enrolling a person needs their finger or face in
 * front of the terminal: nothing here can create somebody.
 */

/**
 * The instructions, in the words of what they answer rather than the
 * protocol's.
 *
 * `danger` is not styling. Deleting an enrolment is the one action here a
 * person would want back, so it asks twice and says what survives.
 */
const ACTIONS = [
  {
    kind: 'refresh_all',
    Icon: Download,
    title: 'Send me everything you have',
    blurb:
      'The machine uploads its stored punches and its user list. This is what replaces walking to the office PC and clicking Device → Download Logs.',
    cta: 'Ask now',
  },
  {
    kind: 'query_users',
    Icon: Users,
    title: 'Who is enrolled, and under which code',
    blurb:
      'The machine reports its own user table. The only way to settle a code the roster and the terminal disagree about.',
    cta: 'Ask now',
  },
  {
    kind: 'query_attlog',
    Icon: Clock,
    title: 'Re-send the punches for these dates',
    blurb:
      'For a gap. eSSL terminals overwrite their oldest logs once the buffer fills, so ask early — a stalled feed is a deadline, not an inconvenience.',
    cta: 'Ask for the range',
    dates: true,
  },
  {
    kind: 'sync_time',
    Icon: Activity,
    title: 'Set its clock to now',
    blurb:
      'A drifting clock files arrivals at the wrong minute, and the arrival windows in the daily report are the whole point of it.',
    cta: 'Set the clock',
  },
  {
    kind: 'reboot',
    Icon: Power,
    title: 'Restart the machine',
    blurb:
      'For a terminal that has stopped responding. Punches already stored on it survive a restart.',
    cta: 'Restart',
    confirm: 'Restart the attendance machine now?',
  },
];

const STATUS_TONE = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  done: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const when = (v) => (v ? format(new Date(v), 'd MMM, h:mm a') : '—');

export default function MachineAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [busy, setBusy] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [renaming, setRenaming] = useState(null); // { code, name }
  // Every ID the machine has ever seen, and which numbers are free to give out.
  const [directory, setDirectory] = useState([]);
  const [freeCodes, setFreeCodes] = useState([]);
  const [dirFilter, setDirFilter] = useState('all');
  // Where the machine's idea of a name and the roster's disagree, and how old
  // our copy of the machine's list actually is.
  const [mismatches, setMismatches] = useState([]);
  const [usersAsOf, setUsersAsOf] = useState(null);
  // Who the terminal has seen today, and enrolments it still holds for people
  // who are long gone.
  const [inOffice, setInOffice] = useState([]);
  const [stale, setStale] = useState([]);
  const [quietDays, setQuietDays] = useState(60);
  // "Add to roster" on a Seen-today row: { code, name, team } while the form
  // is open; teams to choose from; and the outcome per code, shown on the row
  // itself — a result at the top of the page is five screens from the button.
  const [adding, setAdding] = useState(null);
  const [teams, setTeams] = useState([]);
  const [added, setAdded] = useState({});

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
    const { data: d, error: err } = await supabase.rpc('cb_machine_console');
    if (err) return setError(friendlyError(err));
    setData(d);

    // Read straight from the punches, not only from what an OPERLOG upload
    // happened to tell us — a code can punch every day and never appear in an
    // upload, and 53 codes on this terminal do exactly that.
    const [dir, free, mism, asOf] = await Promise.all([
      supabase.rpc('cb_device_code_directory'),
      supabase.rpc('cb_free_device_codes', { p_limit: 12 }),
      supabase.rpc('cb_device_name_mismatches'),
      supabase.rpc('cb_device_users_as_of'),
    ]);
    setDirectory(dir.data || []);
    setFreeCodes(free.data || []);
    setMismatches(mism.data || []);
    setUsersAsOf(asOf.data || null);

    const [live, old, tm] = await Promise.all([
      supabase.rpc('cb_in_office_now'),
      supabase.rpc('cb_device_stale_enrolments', { p_quiet_days: quietDays }),
      supabase.from('cb_teams').select('id, name').eq('is_active', true).order('sort'),
    ]);
    setInOffice(live.data || []);
    setStale(old.data || []);
    setTeams(tm.data || []);
  }, [isAdmin, quietDays]);

  /*
    Put somebody the machine knows onto the roster, from the row where they
    were first noticed.

    cb_adopt_device_code does the whole thing in one transaction: the roster
    row, the code (refusing one a current colleague holds, stamping the
    handover date on one released by a leaver), and a re-fold, so their
    punches — today's and every earlier one — attach to them at once.

    They land OUT of the daily WhatsApp report on purpose. Being added here
    must never quietly start naming somebody to fifty colleagues; that is a
    separate switch on the Attendance console.
  */
  const addToRoster = async () => {
    const name = (adding?.name || '').trim();
    if (!name) return setAdded((a) => ({ ...a, [adding.code]: { error: 'Type a name first.' } }));
    setBusy(`add-${adding.code}`);
    // p_team only when chosen, so the call also works against the older
    // three-argument version of the function.
    const args = { p_code: adding.code, p_name: name, p_senior: false };
    if (adding.team) args.p_team = adding.team;
    const { data: r, error: err } = await supabase.rpc('cb_adopt_device_code', args);
    // The adoption itself always lands OUT of the messages; the checkbox is how
    // that is overruled on purpose. Without it, Ananya was put on Backend on
    // 7 October and Backend's group never saw her name.
    if (!err && adding.named && r?.employee_id) {
      await supabase.from('cb_employees').update({ in_daily_report: true }).eq('id', r.employee_id);
    }
    setBusy('');
    if (err) {
      setAdded((a) => ({ ...a, [adding.code]: { error: friendlyError(err) } }));
      return;
    }
    const team = teams.find((t) => t.id === adding.team)?.name;
    const days = r?.fold?.attendance_rows;
    setAdded((a) => ({
      ...a,
      [adding.code]: {
        ok: `${name} is on the roster${team ? ` in ${team}` : ''}`
          + (days != null ? ` — ${days} day${days === 1 ? '' : 's'} of attendance attached.` : '.')
          + (adding.named
            ? ` Named in ${team || 'the main group'}'s messages from the next send.`
            : ' Not in the WhatsApp messages — tick "In messages" in the Control Room to add them.'),
      },
    }));
    setAdding(null);
    await refresh();
  };

  useEffect(() => { refresh(); }, [refresh]);

  /*
    A queued instruction is not a delivered one.

    The terminal collects its commands by polling, so nothing happens until it
    next calls in — and if it has never called in, a command sits pending
    forever. The page polls while anything is outstanding so the status moves
    on its own rather than needing a reload, which is the difference between
    "did that work?" and watching it work.
  */
  useEffect(() => {
    const outstanding = (data?.commands || []).some(
      (c) => c.status === 'pending' || c.status === 'sent',
    );
    if (!outstanding) return undefined;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [data, refresh]);

  const signIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setAuthError(friendlyError(err));
  };

  const queue = async (kind, args = {}) => {
    setError('');
    setFlash('');
    setBusy(kind);
    try {
      const { data: r, error: err } = await supabase.rpc('cb_queue_device_command', {
        p_kind: kind,
        p_args: args,
      });
      if (err) throw err;
      setFlash(
        data?.last_contact
          ? 'Queued. The machine picks it up within a few seconds.'
          : 'Queued — but the machine has never contacted us, so it will sit here until it does.',
      );
      await refresh();
      return r;
    } catch (e) {
      setError(friendlyError(e));
      return null;
    } finally {
      setBusy('');
    }
  };

  const cancel = async (id) => {
    await supabase.rpc('cb_cancel_device_command', { p_id: id });
    refresh();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Seo title="Attendance machine" noIndex />
        <form onSubmit={signIn} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-[#10243E] mb-1">Attendance machine</h1>
          <p className="text-sm text-gray-500 mb-6">Admin sign-in.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 outline-none focus:border-[#D4AF37]" />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {(authError || (session && !isAdmin)) && (
            <p className="text-sm text-red-600 mt-3">
              {authError || 'That account is not an admin.'}
            </p>
          )}
          <button className="w-full mt-4 py-2 rounded-md bg-[#10243E] text-white font-medium hover:bg-[#1b3a63]">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  const silent = !data?.last_contact;
  const users = data?.users || [];
  const commands = data?.commands || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo title="Attendance machine" noIndex />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* INSIDE the padded container, like every other console. It used to
            sit outside it with no margin, so on this one page the nav was
            flush against the viewport edge with no gap under it and read as
            missing. Nine consoles render it the same way; this was the tenth. */}
        <AdminNav className="mb-6" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-[#10243E] flex items-center gap-2">
            <Cpu size={22} className="text-[#f26522]" /> Attendance machine
          </h1>
          <button onClick={refresh}
            className="text-sm text-gray-500 hover:text-[#10243E] flex items-center gap-1.5">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          The eSSL terminal in the office, asked things directly. No eTimeTrackLite,
          no office PC.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {flash && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{flash}</p>
        )}

        {/* ── Is it talking to us at all ───────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Last contact', value: when(data?.last_contact) },
              {
                label: 'Contacts, 24h',
                value: data?.contacts_24h ?? 0,
                note: data?.refused_24h ? `${data.refused_24h} refused` : null,
              },
              { label: 'Punches today', value: data?.punches_today ?? 0 },
              { label: 'Newest punch', value: when(data?.last_punch) },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">{s.label}</p>
                <p className="font-semibold text-[#10243E]">{s.value}</p>
                {/*
                  A refusal is not a contact, and it used to be counted as one:
                  a single "refused" row made this panel announce that the
                  machine was reaching us. Shown, because a request that was
                  turned away is worth seeing — just never as success.
                */}
                {s.note && <p className="text-[11px] text-amber-700">{s.note}</p>}
              </div>
            ))}
          </div>

          {/*
            Said plainly, because everything else on this page depends on it.
            A command queued for a terminal that has never called in is not
            slow — it is never going to happen, and a console that lets you
            believe otherwise is worse than one that does nothing.
          */}
          {silent ? (
            <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                <strong>The machine has never contacted us.</strong> Everything below
                will queue and wait rather than run. On the terminal:
                Menu → Comm. → Cloud Server — <strong>Enable Domain Name ON</strong>,
                Server Address <code className="font-mono">https://www.capitalbrix.co.in</code>,
                <strong> Enable Proxy Server OFF</strong>. The address needs the{' '}
                <code className="font-mono">https://</code>: without it the terminal
                uses port 80, where it is answered with a redirect it does not follow —
                and fails silently, which is exactly what has been happening.
              </span>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-green-700">
              <Radio size={15} /> The machine is reaching us. Instructions below are
              collected within a few seconds.
            </p>
          )}
        </section>

        {/* ── What you can ask it ──────────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Ask the machine</h2>
          <p className="text-sm text-gray-500 mb-4">
            Each of these is one instruction, collected on the terminal&apos;s next
            check-in. Enrolling a person is not here and cannot be — that needs their
            finger or face at the terminal itself.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {ACTIONS.map(({ kind, Icon, title, blurb, cta, dates, confirm }) => (
              <div key={kind} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-[#10243E] flex items-center gap-2 mb-1">
                  <Icon size={16} className="text-[#9C7C1C]" /> {title}
                </p>
                <p className="text-xs text-gray-500 mb-3">{blurb}</p>

                {dates && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input type="date" value={range.from}
                      onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-[#D4AF37]" />
                    <input type="date" value={range.to}
                      onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-[#D4AF37]" />
                  </div>
                )}

                <button
                  disabled={busy === kind || (dates && (!range.from || !range.to))}
                  onClick={() => {
                    if (confirm && !window.confirm(confirm)) return;
                    queue(kind, dates ? { from: range.from, to: range.to } : {});
                  }}
                  className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-200 text-[#10243E] hover:border-[#D4AF37] disabled:opacity-40">
                  {busy === kind ? 'Queueing…' : cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Who the terminal has seen today ──────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">
            Seen today
            <span className="text-gray-400 font-normal text-sm"> — {inOffice.length}</span>
          </h2>
          {/* The terminal runs Realtime=1, so a punch reaches us in seconds —
              and nothing anywhere showed the one thing that makes that worth
              having. "13 punches today" is a number; these are people.

              IT SAYS "LAST SEEN", NOT "IS IN". A missing exit punch and a
              person still at their desk are identical from the machine's side
              — the same fact that made the evening WhatsApp message stop
              claiming "Still in office (15)". This reports what the machine
              saw and when, and leaves the conclusion to somebody in the room. */}
          <p className="text-sm text-gray-500 mb-4">
            What the machine has recorded today, in the order people arrived. A missing
            exit punch and somebody still at their desk look identical from here, so
            this says when they were last seen rather than who is in.
          </p>

          {inOffice.length === 0 ? (
            <p className="text-sm text-gray-400">Nobody has punched yet today.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {inOffice.map((r) => (
                <li key={r.device_code} className="py-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    #{r.device_code}
                  </span>
                  <span className="text-sm text-[#10243E] flex-1 min-w-0 truncate">{r.who}</span>
                  {/* Somebody the roster does not know is not an alarm — the
                      pantry and the founder's own IDs are deliberately off it.
                      It is worth seeing, not worth shouting about. */}
                  {!r.on_roster && (
                    <span className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      not on the roster
                    </span>
                  )}
                  <span className="text-xs text-gray-500 tabular-nums">
                    in {new Date(r.first_punch).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {r.looks_present ? (
                    <span className="text-xs text-green-700">no exit punch yet</span>
                  ) : (
                    <span className="text-xs text-gray-500 tabular-nums">
                      last seen {new Date(r.last_punch).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {!r.on_roster && !added[r.device_code]?.ok && adding?.code !== r.device_code && (
                    <button
                      type="button"
                      onClick={() => setAdding({ code: r.device_code, name: r.who || '', team: '', named: false })}
                      className="text-xs px-2 py-1 rounded border border-[#10243E] text-[#10243E] hover:bg-[#10243E] hover:text-white"
                    >
                      Add to roster
                    </button>
                  )}

                  {adding?.code === r.device_code && (
                    <div className="basis-full mt-2 p-3 bg-gray-50 rounded-lg flex flex-wrap items-end gap-2">
                      <label className="text-xs text-gray-600 flex-1 min-w-[160px]">
                        Name
                        <input
                          value={adding.name}
                          onChange={(e) => setAdding({ ...adding, name: e.target.value })}
                          className="mt-1 w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-[#10243E]"
                        />
                      </label>
                      <label className="text-xs text-gray-600 min-w-[140px]">
                        Team
                        <select
                          value={adding.team}
                          onChange={(e) => setAdding({ ...adding, team: e.target.value })}
                          className="mt-1 w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-[#10243E] bg-white"
                        >
                          <option value="">No team (main group)</option>
                          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-gray-700 flex items-center gap-1.5 pb-2">
                        <input
                          type="checkbox"
                          checked={!!adding.named}
                          onChange={(e) => setAdding({ ...adding, named: e.target.checked })}
                        />
                        Name them in the WhatsApp messages
                      </label>
                      <button
                        type="button"
                        onClick={addToRoster}
                        disabled={busy === `add-${r.device_code}`}
                        className="text-sm px-3 py-1.5 rounded bg-[#10243E] text-white disabled:opacity-50"
                      >
                        {busy === `add-${r.device_code}` ? 'Adding…' : `Add on #${r.device_code}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdding(null)}
                        className="text-sm px-3 py-1.5 rounded text-gray-500"
                      >
                        Cancel
                      </button>
                      <p className="basis-full text-xs text-gray-500">
                        Their punches on #{r.device_code} — today&apos;s and every earlier one — attach to
                        them straight away. Picking a team decides which group names them; tick the
                        box as well, or no message names them at all.
                      </p>
                    </div>
                  )}

                  {added[r.device_code] && (
                    <p className={`basis-full text-xs mt-1 ${added[r.device_code].ok ? 'text-green-700' : 'text-red-600'}`}>
                      {added[r.device_code].ok || added[r.device_code].error}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Enrolments the terminal still holds for people who are gone ── */}
        {stale.length > 0 && (
          <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-[#10243E] mb-1">
              Still enrolled, long gone
              <span className="text-gray-400 font-normal text-sm"> — {stale.length}</span>
            </h2>
            {/* The comparison nobody had made. We ask "who is missing from the
                machine" constantly; we had never asked "who is still ON it who
                should not be". Their finger still works on the terminal. */}
            <p className="text-sm text-gray-500 mb-1">
              Nobody on the roster holds these codes and nothing has punched on them
              in a long time — but the terminal still has the enrolment, so the
              finger still works.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              <strong>Deleting an enrolment does not delete any attendance.</strong>{' '}
              The punches stay, the monthly register keeps their name, and the person
              can be enrolled again. That is why this is offered and wiping the device
              is not. The founder&apos;s own IDs, pantry staff and anyone marked
              not-tracked are excluded from this list — they are still here.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Quiet for at least</span>
              {[60, 90, 120, 180].map((d) => (
                <button key={d} onClick={() => setQuietDays(d)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    quietDays === d
                      ? 'bg-[#10243E] text-white border-[#10243E]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]'
                  }`}>
                  {d} days
                </button>
              ))}
            </div>

            <ul className="divide-y divide-gray-50">
              {stale.map((r) => (
                <li key={r.device_code} className="py-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    #{r.device_code}
                  </span>
                  <span className="text-sm text-[#10243E] flex-1 min-w-0 truncate">
                    {r.machine_name || <span className="text-gray-400">no name on the machine</span>}
                    {r.previous_holder && (
                      <span className="text-gray-500"> · was {r.previous_holder}</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {r.punches} punches
                    {r.last_punch ? ` · last ${r.last_punch}` : ' · never'}
                  </span>
                  <button
                    onClick={() => {
                      // Confirmed by name, not by code. "#46" is a number
                      // somebody can agree to without reading it.
                      const label = r.machine_name || r.previous_holder || `code ${r.device_code}`;
                      if (!window.confirm(
                        `Remove ${label} (code ${r.device_code}) from the terminal?\n\n`
                        + 'Their attendance history is NOT deleted. They can be enrolled again '
                        + 'with a finger at the machine.',
                      )) return;
                      queue('delete_user', { pin: r.device_code });
                    }}
                    disabled={!!busy}
                    className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">
                    Remove from machine
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Every ID on the machine, and which are free ──────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">
            Every ID on the machine
            <span className="text-gray-400 font-normal text-sm"> — {directory.length}</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Built from the punches themselves, not only from what the terminal has
            uploaded about itself — a code can punch every day and never appear in
            an enrolment upload.
          </p>

          {/* THE QUESTION THIS PAGE COULD NOT ANSWER: which number do I give the
              new joiner. It was a walk to the office and a guess, and a guess is
              how code 11 was nearly handed to a new joiner when it is Sandeep's
              with 983 punches behind it. */}
          <div className="rounded-lg border border-green-200 bg-green-50/60 p-3 mb-4">
            <p className="text-sm font-medium text-green-900">Free to give a new joiner</p>
            <p className="text-[11px] text-green-800/80 mb-2">
              Enrol them on the terminal under one of these, then set the same number
              on the Attendance console&apos;s Employees tab.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {freeCodes.filter((c) => c.kind === 'never-used').map((c) => (
                <span key={c.device_code}
                  className="font-mono text-sm px-2 py-1 rounded bg-white border border-green-300 text-green-900">
                  {c.device_code}
                </span>
              ))}
              {freeCodes.filter((c) => c.kind === 'never-used').length === 0 && (
                <span className="text-xs text-gray-500">
                  No unused number under 200 — every one carries history. Use a
                  released one below and check who held it.
                </span>
              )}
            </div>
            {freeCodes.some((c) => c.kind === 'released') && (
              <>
                {/* Offered SEPARATELY and with the previous holder named. A
                    released number is reusable but carries somebody's history,
                    and the handover date is what keeps the two apart. */}
                <p className="text-[11px] text-green-900 mt-3 mb-1">
                  Released by somebody leaving — reusable, but it carries their history:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {freeCodes.filter((c) => c.kind === 'released').map((c) => (
                    <span key={c.device_code}
                      className="font-mono text-xs px-2 py-1 rounded bg-white border border-amber-300 text-amber-900">
                      {c.device_code}
                      <span className="font-sans text-[10px] text-amber-700"> · was {c.previous_holder}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              ['all', `All ${directory.length}`],
              ['assigned', `On the roster ${directory.filter((d) => d.status === 'assigned').length}`],
              ['unowned', `Nobody ${directory.filter((d) => d.status === 'unowned').length}`],
              ['released', `Released ${directory.filter((d) => d.status === 'released').length}`],
              ['ignored', `Not tracked ${directory.filter((d) => d.status === 'ignored').length}`],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setDirFilter(k)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  dirFilter === k
                    ? 'bg-[#10243E] text-white border-[#10243E]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-2 pr-3 font-medium">ID</th>
                  <th className="py-2 pr-3 font-medium">Whose</th>
                  <th className="py-2 pr-3 font-medium">On the machine</th>
                  <th className="py-2 pr-3 font-medium text-right">Punches</th>
                  <th className="py-2 pr-3 font-medium">Last punch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {directory
                  .filter((d) => dirFilter === 'all' || d.status === dirFilter)
                  .map((d) => (
                    <tr key={d.device_code} className="hover:bg-gray-50/50">
                      <td className="py-2 pr-3 font-mono font-semibold text-[#10243E]">#{d.device_code}</td>
                      <td className="py-2 pr-3">
                        {d.status === 'assigned' && (
                          <span className="text-gray-800">{d.roster_name}</span>
                        )}
                        {d.status === 'released' && (
                          <span className="text-amber-800">
                            Free — was {d.previous_holder}
                            {d.left_on ? `, left ${d.left_on}` : ''}
                          </span>
                        )}
                        {d.status === 'ignored' && (
                          <span className="text-gray-500">{d.note || 'Not tracked'}</span>
                        )}
                        {d.status === 'unowned' && (
                          // The consequence, not the fact. "Unowned" is not a
                          // sentence anybody can act on.
                          <span className="text-red-700">
                            Nobody — their attendance is stored and attached to no one
                          </span>
                        )}
                        {d.status === 'free' && <span className="text-gray-400">Never punched</span>}
                      </td>
                      <td className="py-2 pr-3 text-gray-600">
                        {d.machine_name || <span className="text-gray-300">not in an upload</span>}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-gray-700">{d.punches}</td>
                      <td className="py-2 pr-3 text-gray-500 text-xs">{d.last_seen || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Who the machine says is enrolled ─────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Enrolled on the machine</h2>
          <p className="text-sm text-gray-500 mb-3">
            What the terminal itself reports, beside what the roster says. Where the
            two disagree, this column is the one that decides — the roster only
            records what somebody typed.
          </p>

          {/* HOW OLD THIS IS, said out loud.
              A rename on 23 September worked — the terminal answered Return=0 —
              and this table still showed the old name, because it had been
              filled once, 55 minutes earlier, and nothing had re-read the
              machine since. It read as "the change did not stick". A snapshot
              with no date on it is the bug, not the rename. */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">
              {usersAsOf?.as_of
                ? `As of ${new Date(usersAsOf.as_of).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}`
                : 'The machine has never sent its enrolment list.'}
              {usersAsOf?.as_of && Date.now() - new Date(usersAsOf.as_of).getTime() > 864e5 && (
                <span className="text-amber-700">
                  {' '}— {Math.floor((Date.now() - new Date(usersAsOf.as_of).getTime()) / 864e5)} days old.
                  Anything renamed since will still read as the old name here.
                </span>
              )}
            </span>

            {/* ASKED AND NOT ANSWERED is its own state and must not look like
                "up to date". The daily refresh declines to stack a second
                request, which is right - but a guard that returns quietly is
                the same silent shape as the bug it replaced. */}
            {usersAsOf?.awaiting_since && (
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                Asked {Math.round((Date.now() - new Date(usersAsOf.awaiting_since).getTime()) / 6e4)} min ago,
                no answer yet
              </span>
            )}
            {usersAsOf?.unconfirmed_names > 0 && (
              <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                {usersAsOf.unconfirmed_names} renamed here, awaiting the machine&apos;s own word
              </span>
            )}
            <button onClick={() => queue('query_users')} disabled={busy === 'query_users'}
              className="text-xs px-2.5 py-1 rounded border border-gray-200 text-[#10243E] hover:border-[#D4AF37] disabled:opacity-50">
              {busy === 'query_users' ? 'Asking…' : 'Ask the machine again'}
            </button>
          </div>

          {/* WHERE THE TWO DISAGREE — and one tap to settle it.
              Fifteen of them right now, and three are plain typos on the
              terminal: "Swarn" for Swaran, "Krishn" for Krishan, "Sakashi" for
              Sakshi. Each one is a person reading a register and not finding
              themselves. Renaming was already possible one at a time; what was
              missing is being shown that it needs doing. */}
          {mismatches.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-amber-900">
                  {mismatches.length} name{mismatches.length > 1 ? 's' : ''} on the machine
                  {mismatches.length > 1 ? ' do' : ' does'} not match the roster
                </p>
                <button
                  onClick={async () => {
                    // Queued one per person. The terminal takes one command at
                    // a time, oldest first, so these drain in order and each
                    // failure stays attributable to its own instruction.
                    for (const m of mismatches) {
                      await queue('rename_user', { pin: m.device_code, name: m.roster_name });
                    }
                  }}
                  disabled={!!busy}
                  className="text-xs px-3 py-1.5 rounded bg-[#10243E] text-white hover:bg-[#1a365d] disabled:opacity-50">
                  Make the machine match the roster
                </button>
              </div>
              <ul className="space-y-1">
                {mismatches.map((m) => (
                  <li key={m.device_code} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-amber-900">#{m.device_code}</span>
                    <span className="text-gray-500">{m.machine_name}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-[#10243E] font-medium">{m.roster_name}</span>
                    {/* A name we set from here is a belief until the terminal
                        reports it back. Saying so is the difference between
                        this console and the one that looked like it lied. */}
                    {m.name_source === 'console' && (
                      <span className="text-[10px] uppercase tracking-wide bg-white border border-amber-300 text-amber-800 px-1 py-0.5 rounded">
                        renamed here, not yet confirmed
                      </span>
                    )}
                    <button onClick={() => queue('rename_user', { pin: m.device_code, name: m.roster_name })}
                      disabled={!!busy}
                      className="text-amber-800 underline hover:text-amber-900 disabled:opacity-50">
                      fix
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {users.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nothing yet. Use <strong>Who is enrolled</strong> above; the list
              appears here once the machine answers.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Code</th>
                    <th className="py-2 pr-3 font-medium">On the machine</th>
                    <th className="py-2 pr-3 font-medium">On the roster</th>
                    <th className="py-2 pr-3 font-medium">Punches</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.device_code} className="hover:bg-gray-50/50">
                      <td className="py-2 pr-3 font-mono font-semibold text-[#10243E]">#{u.device_code}</td>
                      <td className="py-2 pr-3">
                        {renaming?.code === u.device_code ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            <input value={renaming.name}
                              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                              className="w-32 px-2 py-1 border border-gray-300 rounded outline-none focus:border-[#D4AF37]" />
                            <button
                              onClick={async () => {
                                await queue('rename_user', { pin: u.device_code, name: renaming.name });
                                setRenaming(null);
                              }}
                              className="text-xs px-2 py-1 rounded bg-[#10243E] text-white">Save</button>
                            <button onClick={() => setRenaming(null)} className="text-gray-400"><X size={14} /></button>
                          </span>
                        ) : (
                          <span className="text-gray-700">{u.machine_name || <span className="text-gray-300">no name</span>}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {u.roster_name ? (
                          <span className={u.roster_active === false ? 'text-gray-400 line-through' : 'text-gray-700'}>
                            {u.roster_name.trim()}
                          </span>
                        ) : u.ignored_note ? (
                          <span className="text-xs text-gray-400">{u.ignored_note}</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            Nobody
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">
                        {u.punches || 0}
                        {u.last_punch && <span className="block text-[11px] text-gray-400">{when(u.last_punch)}</span>}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => setRenaming({ code: u.device_code, name: u.machine_name || '' })}
                          title="Correct the name the machine shows when this person punches"
                          className="text-gray-400 hover:text-[#9C7C1C] p-1"><Pencil size={14} /></button>
                        {/*
                          Deleting an enrolment does not touch cb_device_punches,
                          so the attendance already recorded under this code
                          survives and the person can be enrolled again. That is
                          why removing is offered here and clearing the device is
                          not offered anywhere.
                        */}
                        <button
                          onClick={() => {
                            if (!window.confirm(
                              `Remove code ${u.device_code} from the machine?\n\n`
                              + 'Their recorded attendance is kept — only the enrolment goes, '
                              + 'and they can be enrolled again at the terminal.',
                            )) return;
                            queue('delete_user', { pin: u.device_code });
                          }}
                          title="Remove this enrolment from the machine"
                          className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── What was asked, and what came back ───────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Instructions sent</h2>
          <p className="text-sm text-gray-500 mb-4">
            Every instruction the terminal has ever been given, who asked for it and
            what came back. A command channel without this is a door with no lock.
          </p>

          {commands.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing has been sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {commands.map((c) => (
                <li key={c.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_TONE[c.status] || STATUS_TONE.cancelled}`}>
                      {c.status === 'sent' ? 'with the machine' : c.status}
                    </span>
                    <span className="text-sm text-[#10243E]">
                      {ACTIONS.find((a) => a.kind === c.kind)?.title
                        || (c.kind === 'rename_user' ? 'Rename on the machine'
                          : c.kind === 'delete_user' ? 'Remove an enrolment' : c.kind)}
                    </span>
                    <span className="text-xs text-gray-400">{when(c.created_at)}</span>
                    {c.created_by && <span className="text-xs text-gray-400">· {c.created_by}</span>}
                    {c.status === 'pending' && (
                      <button onClick={() => cancel(c.id)} className="text-xs text-gray-400 hover:text-red-500 underline">
                        cancel
                      </button>
                    )}
                    {c.status === 'done' && <CheckCircle2 size={14} className="text-green-600" />}
                  </div>
                  <p className="font-mono text-[11px] text-gray-400 break-all">{c.cmd}</p>
                  {c.status === 'failed' && (
                    <p className="text-xs text-red-600 mt-1">
                      The machine refused it (code {c.return_code ?? '?'}).
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── The heartbeat itself ─────────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-[#10243E] mb-1">Recent contacts</h2>
          <p className="text-sm text-gray-500 mb-4">
            Raw. Kept for fourteen days — this is a heartbeat, not an archive.
          </p>
          {(data?.log || []).length === 0 ? (
            <p className="text-sm text-gray-400">The machine has not contacted us.</p>
          ) : (
            <ul className="text-xs font-mono space-y-1">
              {data.log.map((l) => (
                <li key={l.id} className="text-gray-500">
                  {when(l.at)} · {l.method} /{l.path}
                  {l.table_name ? ` ${l.table_name}` : ''}
                  {l.rows_in != null ? ` ${l.rows_in} rows` : ''}
                  {l.note ? ` — ${l.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
