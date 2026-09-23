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
  }, [isAdmin]);

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
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 py-8">
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
              { label: 'Contacts, 24h', value: data?.contacts_24h ?? 0 },
              { label: 'Punches today', value: data?.punches_today ?? 0 },
              { label: 'Newest punch', value: when(data?.last_punch) },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">{s.label}</p>
                <p className="font-semibold text-[#10243E]">{s.value}</p>
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

        {/* ── Who the machine says is enrolled ─────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Enrolled on the machine</h2>
          <p className="text-sm text-gray-500 mb-4">
            What the terminal itself reports, beside what the roster says. Where the
            two disagree, this column is the one that decides — the roster only
            records what somebody typed.
          </p>

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
