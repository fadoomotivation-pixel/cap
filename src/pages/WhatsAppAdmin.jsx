import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import { ADMIN_EMAILS } from '../lib/admin';
import AdminNav from '../components/AdminNav';
import { friendlyError } from '../lib/errors';
import {
  MessageCircle, RefreshCw, LogOut, X, QrCode, Send, CheckCircle2,
  AlertTriangle, Power, Info, Eye, Star, Users, Clock,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Where the attendance reports actually leave the building.
 *
 * The WhatsApp session that posts the daily register is shared with Call Pro
 * AI, on a different dashboard, in a different account, described in that
 * product's words. When it logs out, both stop — and there was no screen
 * anywhere that said so in terms of Capital Brix attendance. The first time it
 * happened the evidence was a 503 buried in a Postgres table.
 *
 * So this page answers three questions and nothing else: is the link up, how
 * do I put it back up, and does a message actually arrive. The bearer token
 * stays in the wa-session Edge Function; nothing here ever holds it.
 */

const CHECK_MS = 5000;

/**
 * The five messages, described in the words HR would use.
 *
 * This list is the page's spine: the switches, the previews and the Send-now
 * buttons all read from it, so a message can never appear in one place and be
 * missing from another. Times are the pg_cron schedules translated to IST —
 * they are not editable here on purpose, because a schedule that two people
 * can change from two screens is a schedule nobody can trust.
 */
const MESSAGES = [
  {
    kind: 'morning',
    time: '10:30 AM',
    to: 'group',
    title: 'Who has punched in so far',
    blurb: 'Names only the people who HAVE punched, so anybody missing can spot themselves and go to the machine. Nobody is named as late. Sends nothing if not one person has punched.',
  },
  {
    kind: 'attendance',
    time: '11:30 AM',
    to: 'founder',
    title: 'The full register',
    blurb: 'Arrivals grouped by window, then absent and on leave. The complete picture, with a link to the register.',
  },
  {
    kind: 'absent',
    time: '11:31 AM',
    to: 'group',
    title: 'The absent list',
    blurb: 'Absent and on leave only — no arrival times. Sends nothing when nobody is absent.',
  },
  {
    kind: 'reminder',
    time: '6:45 PM',
    to: 'group',
    title: 'Finish your attendance',
    blurb: 'Who has logged out, who has no check-out yet, and whose attendance is missing — while they are still in the building and can fix it. Sends nothing when the day is already complete.',
  },
  {
    kind: 'checkout',
    time: '7:01 PM',
    to: 'founder',
    title: 'The logout record',
    blurb: 'Who left and when, split by window, plus everyone with no check-out recorded.',
  },
];

/** The worker reports per-state session counts; this is the one that matters. */
const readState = (payload) => {
  const h = payload?.health?.body ?? {};
  const s = payload?.status?.body ?? {};
  if (payload?.health?.status === 0) return { key: 'unreachable', detail: h.error || 'The worker did not answer.' };
  if (s.status) return { key: s.status, detail: s.lastError || s.error || '' };
  const states = h.states || {};
  if (states.connected) return { key: 'connected', detail: '' };
  const first = Object.keys(states)[0];
  return { key: first || 'unknown', detail: h.last_error || '' };
};

const TONE = {
  connected: { cls: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2, label: 'Connected' },
  qr: { cls: 'bg-amber-50 text-amber-800 border-amber-200', Icon: QrCode, label: 'Waiting for a scan' },
  connecting: { cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: RefreshCw, label: 'Connecting' },
  unreachable: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle, label: 'Worker unreachable' },
};
const tone = (key) => TONE[key] || { cls: 'bg-gray-50 text-gray-700 border-gray-200', Icon: AlertTriangle, label: key || 'Unknown' };

export default function WhatsAppAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState(null);
  const [qr, setQr] = useState(null);
  const [polling, setPolling] = useState(false);

  const [settings, setSettings] = useState(null);
  const [groupId, setGroupId] = useState('');
  const [testTo, setTestTo] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [log, setLog] = useState([]);
  const [people, setPeople] = useState([]);
  const [preview, setPreview] = useState(null);   // { kind, text, target, error }
  const [running, setRunning] = useState(null);   // kind currently previewing/sending

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(!!session && ADMIN_EMAILS.includes(session.user.email?.toLowerCase()));
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setIsAdmin(!!s && ADMIN_EMAILS.includes(s.user.email?.toLowerCase()));
    });
    return () => subscription.unsubscribe();
  }, []);

  const flash = (m) => { setOk(m); setTimeout(() => setOk(''), 5000); };

  const invoke = useCallback(async (body) => {
    const { data, error } = await supabase.functions.invoke('wa-session', { body });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    try {
      const data = await invoke({ action: 'status' });
      setLink(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [isAdmin, invoke]);

  const loadSettings = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('cb_hr_settings')
      .select('id, wa_group_id, founder_whatsapp, daily_report_enabled, wa_messages_enabled')
      .limit(1).maybeSingle();
    if (data) {
      setSettings(data);
      setGroupId(data.wa_group_id || '');
      setTestTo((t) => t || data.founder_whatsapp || '');
    }
    const { data: rows } = await supabase
      .from('cb_report_log')
      .select('report_date, kind, target, ok, detail, sent_at')
      .order('sent_at', { ascending: false }).limit(8);
    setLog(rows || []);

    // Who the messages can name belongs on this page too. It is the question
    // that got asked over and over — "is so-and-so senior, is so-and-so in
    // the report" — and answering it meant opening a second console or
    // messaging a developer.
    const { data: emps } = await supabase
      .from('cb_employees')
      .select('id, full_name, device_code, is_active, in_daily_report, is_senior')
      .eq('is_active', true)
      .order('full_name');
    setPeople(emps || []);
  }, [isAdmin]);

  useEffect(() => { refresh(); loadSettings(); }, [refresh, loadSettings]);

  // A QR expires in seconds and the worker mints a fresh one, so the square on
  // screen has to keep up with the phone in your hand rather than be fetched
  // once and go stale while you unlock WhatsApp.
  useEffect(() => {
    if (!polling) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const data = await invoke({ action: 'qr' });
        if (!alive) return;
        const b = data?.body ?? {};
        setQr(b.qr || null);
        if (b.status === 'connected') {
          setPolling(false);
          setQr(null);
          flash('WhatsApp is linked. The attendance report can send again.');
          refresh();
        }
      } catch (e) {
        if (alive) { setError(e.message); setPolling(false); }
      }
    };
    tick();
    const id = setInterval(tick, CHECK_MS);
    return () => { alive = false; clearInterval(id); };
  }, [polling, invoke, refresh]);

  const startPairing = async () => {
    setError('');
    setBusy(true);
    try {
      await invoke({ action: 'reconnect' });
      setPolling(true);
      flash('Asked WhatsApp for a pairing code — the square appears in a few seconds.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // THE ANSWER GOES UNDER THE BUTTON, NOT AT THE TOP OF THE PAGE.
  //
  // This first shipped as a banner above the status card, five screens up from
  // the Send button and gone after five seconds. The first person to use it
  // pressed Send, saw nothing, and reported that nothing had happened — the
  // message had in fact gone. Feedback belongs where the eye already is, and
  // it stays until the next attempt replaces it.
  const sendTest = async () => {
    setError('');
    setTestResult(null);
    if (!testTo.trim()) return setTestResult({ ok: false, text: 'Put a number or a group id in first.' });
    setBusy(true);
    try {
      const data = await invoke({ action: 'test', to: testTo });
      const self = data.target && data.target === String(settings?.founder_whatsapp || '').replace(/\D/g, '');
      setTestResult(data.ok
        ? {
          ok: true,
          text: `Sent to ${data.target}.${data.body?.id ? ` WhatsApp id ${data.body.id}.` : ''}`,
          // Sending to the number that does the sending is a message to
          // yourself, and WhatsApp files those in the "Message yourself" chat
          // rather than the chat list — which reads as nothing happening.
          note: self
            ? 'That is the number that sends, so this went to your own "Message yourself" chat — look there, not in the chat list.'
            : null,
        }
        : { ok: false, text: `The worker refused it — ${JSON.stringify(data.body)}` });
      loadSettings();
    } catch (e) {
      setTestResult({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Run one message against today, either as a preview or for real.
   *
   * dry_run returns the exact text without sending it, which is the single
   * thing that turns this page from "press and hope" into something a founder
   * can use: see what fifty people are about to read, then decide. Both paths
   * go through the same Edge Function the cron calls, so a preview cannot
   * differ from what actually goes out.
   */
  const runMessage = async (kind, { dryRun }) => {
    setError('');
    setPreview(null);
    setRunning(kind);
    try {
      const { data, error } = await supabase.functions.invoke('attendance-whatsapp', {
        body: dryRun ? { kind, dry_run: true } : { kind, force: true },
      });
      if (error) throw new Error(error.message);
      if (dryRun) {
        setPreview(data?.text
          ? { kind, text: data.text, target: data.target }
          : { kind, error: data?.reason || 'Nothing would be sent today.' });
      } else if (data?.sent) {
        flash(`Sent to ${data.target}. Check the chat — a message id is not proof it arrived.`);
      } else {
        setPreview({ kind, error: data?.reason || data?.detail || 'Nothing was sent.' });
      }
      loadSettings();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  const messageOn = (kind) => settings?.wa_messages_enabled?.[kind] !== false;

  const toggleMessage = async (kind) => {
    const next = { ...(settings?.wa_messages_enabled || {}), [kind]: !messageOn(kind) };
    await saveSettings({ wa_messages_enabled: next });
  };

  const patchPerson = async (person, patch) => {
    const { error } = await supabase.from('cb_employees').update(patch).eq('id', person.id);
    if (error) return setError(error.message);
    setPeople((rows) => rows.map((r) => (r.id === person.id ? { ...r, ...patch } : r)));
  };

  const saveSettings = async (patch) => {
    if (!settings) return;
    const { error } = await supabase.from('cb_hr_settings').update(patch).eq('id', settings.id);
    if (error) return setError(error.message);
    setSettings((s) => ({ ...s, ...patch }));
    flash('Saved.');
  };

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">WhatsApp Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(friendlyError(error)); }} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37]" />
            <PasswordInput required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37]" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d]">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const state = readState(link);
  const { cls, Icon, label } = tone(state.key);
  const connected = state.key === 'connected';

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-4xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">WhatsApp Reports</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { refresh(); loadSettings(); }} disabled={busy} className="flex items-center gap-2 text-gray-600 hover:text-[#9C7C1C] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <AdminNav className="mb-6" />

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
        {ok && <div className="bg-green-50 text-green-700 border border-green-100 p-4 rounded-lg mb-4 text-sm">{ok}</div>}

        {/* The sentence HR came here to read. */}
        <div className={`border rounded-xl p-5 mb-6 ${cls}`}>
          <div className="flex items-start gap-3">
            <Icon size={22} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-base">
                {connected
                  ? 'The attendance report can reach WhatsApp.'
                  : 'The attendance report cannot reach WhatsApp right now.'}
              </p>
              <p className="text-sm mt-1 opacity-90">
                Link status: <strong>{label}</strong>
                {state.detail ? ` — ${state.detail}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* This account is shared with another product, and saying so here is
            what stops somebody scanning the wrong phone or assuming a Call Pro
            AI screen has nothing to do with attendance. */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-gray-600">
          <Info size={18} className="shrink-0 mt-0.5 text-[#9C7C1C]" />
          <p>
            This is the same WhatsApp login that Call Pro AI uses. One phone is
            linked, and it sends for both. Scanning here fixes both; losing it
            breaks both. <strong>The number you link must be a member of the
            group</strong> the report posts to — WhatsApp only lets an account
            post to groups it has joined.
          </p>
        </div>

        {/* Scan */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Link a phone</h2>
          <p className="text-sm text-gray-500 mb-4">
            On the phone: WhatsApp → Settings → Linked devices → Link a device.
          </p>

          {qr ? (
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <img src={qr} alt="WhatsApp pairing QR code" className="w-56 h-56 border border-gray-200 rounded-lg bg-white" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-[#10243E] mb-1">Scan this now.</p>
                <p>It refreshes every few seconds on its own. The page notices
                  the moment the phone is linked — you do not have to reload.</p>
                <button onClick={() => { setPolling(false); setQr(null); }} className="mt-3 text-gray-500 hover:text-red-500 underline">Stop</button>
              </div>
            </div>
          ) : (
            <button onClick={startPairing} disabled={busy || connected}
              className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2.5 rounded-md font-medium hover:bg-[#1a365d] disabled:opacity-50">
              <Power size={16} /> {connected ? 'Already linked' : 'Show pairing code'}
            </button>
          )}
          {polling && !qr && <p className="text-sm text-gray-500 mt-3">Waiting for WhatsApp to offer a square…</p>}
        </section>

        {/* ── THE FIVE MESSAGES ─────────────────────────────────────────
            Everything that used to require a message to a developer: what
            goes out, when, to whom, whether it goes at all, what it will say
            today, and sending it now. Each card is one message.            */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
            <Clock size={18} className="text-[#9C7C1C]" /> The five messages
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Preview shows exactly what would go out right now, without sending it.
            Times are fixed — a schedule two people can change from two screens
            is one nobody can trust.
          </p>

          <div className="space-y-3">
            {MESSAGES.map((m) => {
              const on = messageOn(m.kind);
              const isGroup = m.to === 'group';
              return (
                <div key={m.kind}
                  className={`border rounded-lg p-4 ${on ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#10243E]">{m.time}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isGroup
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isGroup ? 'Group' : 'Founder'}
                        </span>
                        {!on && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-gray-200 text-gray-600 border-gray-300">
                            Off
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${on ? 'text-[#10243E]' : 'text-gray-500'}`}>{m.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.blurb}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button onClick={() => runMessage(m.kind, { dryRun: true })}
                        disabled={running === m.kind}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37] disabled:opacity-50">
                        <Eye size={14} /> {running === m.kind ? 'Working…' : 'Preview'}
                      </button>
                      <button onClick={() => runMessage(m.kind, { dryRun: false })}
                        disabled={running === m.kind || !connected}
                        title={connected ? 'Sends it now, for real' : 'WhatsApp is not linked'}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#10243E] text-white hover:bg-[#1a365d] disabled:opacity-40">
                        <Send size={14} /> Send now
                      </button>
                      <button onClick={() => toggleMessage(m.kind)}
                        title={on ? 'Stop sending this one' : 'Start sending this one again'}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${
                          on
                            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
                        }`}>
                        <Power size={14} /> {on ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>

                  {/* The preview lands under the card it belongs to, for the
                      same reason the test result moved under its button. */}
                  {preview?.kind === m.kind && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      {preview.error ? (
                        <p className="text-sm text-gray-600">
                          <strong>Nothing would go out:</strong> {preview.error}
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500 mb-2">
                            Would go to <span className="font-mono">{preview.target}</span> — this is the
                            exact text, not an approximation.
                          </p>
                          <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap font-sans text-gray-800 max-h-80 overflow-auto">
{preview.text}
                          </pre>
                        </>
                      )}
                      <button onClick={() => setPreview(null)} className="text-xs text-gray-400 hover:text-gray-600 mt-2">
                        Close preview
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── WHO THE MESSAGES NAME ──────────────────────────────────────
            The question that kept coming back: who is senior, who is in the
            report at all. It had no control anywhere for months, so every
            answer went through a developer running SQL.                    */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
            <Users size={18} className="text-[#9C7C1C]" /> Who the messages name
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{people.filter((p) => p.in_daily_report).length}</strong> of {people.length} can
            appear. Changes take effect on the very next message.
          </p>
          <ul className="text-xs text-gray-500 mb-4 space-y-0.5">
            <li><strong className="text-green-700">In report</strong> — off, and they are never named, even on days they punch.</li>
            <li><strong className="text-indigo-700">Senior</strong> — never printed under Absent; still listed on days they punch.</li>
          </ul>

          <div className="divide-y divide-gray-50 max-h-[420px] overflow-auto -mx-2 px-2">
            {people.map((p) => (
              <div key={p.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-[#10243E]">{p.full_name.trim()}</p>
                  <p className="text-[10px] text-gray-400">
                    {p.device_code ? `machine #${p.device_code}` : 'Not on the machine — can never punch'}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => patchPerson(p, { in_daily_report: !p.in_daily_report })}
                    className={`text-[11px] px-2 py-1 rounded border ${
                      p.in_daily_report
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    {p.in_daily_report ? 'In report' : 'Not in report'}
                  </button>
                  {p.in_daily_report && (
                    <button onClick={() => patchPerson(p, { is_senior: !p.is_senior })}
                      className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1 ${
                        p.is_senior
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-white text-gray-400 border-gray-200 hover:text-indigo-600'
                      }`}>
                      <Star size={11} /> {p.is_senior ? 'Senior' : 'Junior'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {people.length === 0 && <p className="text-sm text-gray-400 py-4">No active employees.</p>}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Adding someone, removing someone who has left, and mapping a machine code
            all live on the Attendance console&apos;s Employees tab.
          </p>
        </section>

        {/* Where it posts */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          {/*
            No schedule list here any more: the panel above owns it. Two
            places describing one schedule is how the page ended up claiming
            "12:10 arrivals, 19:01 logouts" months after the server stopped
            running that.
          */}
          <h2 className="font-semibold text-[#10243E] mb-4">Where the group messages post</h2>

          <label className="block text-sm font-medium text-gray-700 mb-1">Group id</label>
          <div className="flex flex-wrap gap-2 mb-1">
            <input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="120363XXXXXXXXXXXX@g.us"
              className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37] font-mono text-sm" />
            <button onClick={() => saveSettings({ wa_group_id: groupId.trim() || null })}
              className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37]">Save</button>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            The three group messages post here. Leave it empty and they go to the
            founder&apos;s number
            instead{settings?.founder_whatsapp ? ` (${settings.founder_whatsapp})` : ''} — a
            summary that reaches one person beats one that reaches nobody.
            Who is named in them is set per person on the Attendance console&apos;s
            Employees tab.
          </p>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!settings?.daily_report_enabled}
              onChange={(e) => saveSettings({ daily_report_enabled: e.target.checked })} />
            Send the daily messages automatically (the master switch — off stops all five)
          </label>
        </section>

        {/* Prove it */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-1">Send a test</h2>
          <p className="text-sm text-gray-500 mb-4">
            Try your own number first. Nothing here touches the daily schedule.
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="9876543210 or 1203…@g.us"
              className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37]" />
            <button onClick={sendTest} disabled={busy}
              className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2.5 rounded-md font-medium hover:bg-[#1a365d] disabled:opacity-50">
              <Send size={16} /> {busy ? 'Sending…' : 'Send'}
            </button>
          </div>

          {testResult && (
            <div className={`mt-4 rounded-lg border p-3 text-sm ${
              testResult.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="font-medium">{testResult.ok ? '✅ ' : '❌ '}{testResult.text}</p>
              {testResult.note && <p className="mt-1 opacity-90">{testResult.note}</p>}
            </div>
          )}
        </section>

        {/* Every scheduled send, successful or not — the table that held the
            only evidence last time this broke.

            It is titled "daily report" rather than "sends" because a test from
            the box above does NOT appear here, and within minutes of shipping
            that cost somebody a wrong conclusion: they pressed Send, looked
            down, saw yesterday's red line still sitting at the top and read it
            as the test failing. */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
            <MessageCircle size={18} /> Daily report history
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            The five scheduled messages only. A test from the box above shows
            its result under the Send button, not here.
          </p>
          {log.length === 0 && <p className="text-sm text-gray-500">No report sent yet.</p>}
          <div className="space-y-2">
            {log.map((r, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {r.ok ? 'sent' : 'failed'}
                </span>
                <span className="text-gray-700">{r.report_date}</span>
                <span className="text-gray-400">{r.kind}</span>
                <span className="text-gray-400 font-mono text-xs">{r.target}</span>
                <span className="text-gray-400 text-xs">{r.sent_at ? format(new Date(r.sent_at), 'd MMM HH:mm') : ''}</span>
                {r.detail && <span className="w-full text-xs text-red-500 break-words">{r.detail}</span>}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
