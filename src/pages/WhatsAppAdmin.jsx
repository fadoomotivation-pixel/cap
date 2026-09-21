import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import { ADMIN_EMAILS } from '../lib/admin';
import AdminNav from '../components/AdminNav';
import { friendlyError } from '../lib/errors';
import {
  MessageCircle, RefreshCw, LogOut, X, QrCode, Send, CheckCircle2,
  AlertTriangle, Power, Info,
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
  const [log, setLog] = useState([]);

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
      .select('id, wa_group_id, founder_whatsapp, daily_report_enabled')
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

  const sendTest = async () => {
    setError('');
    if (!testTo.trim()) return setError('Put a number or a group id in first.');
    setBusy(true);
    try {
      const data = await invoke({ action: 'test', to: testTo });
      if (data.ok) flash(`Sent to ${data.target}. Check that chat.`);
      else setError(`The worker refused it — ${JSON.stringify(data.body)}`);
      loadSettings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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

        {/* Where it posts */}
        <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-[#10243E] mb-4">Where the report goes</h2>

          <label className="block text-sm font-medium text-gray-700 mb-1">Group id</label>
          <div className="flex flex-wrap gap-2 mb-1">
            <input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="120363XXXXXXXXXXXX@g.us"
              className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37] font-mono text-sm" />
            <button onClick={() => saveSettings({ wa_group_id: groupId.trim() || null })}
              className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37]">Save</button>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Leave it empty and the report goes to the founder&apos;s number
            instead{settings?.founder_whatsapp ? ` (${settings.founder_whatsapp})` : ''} — a
            summary that reaches one person beats one that reaches nobody.
          </p>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!settings?.daily_report_enabled}
              onChange={(e) => saveSettings({ daily_report_enabled: e.target.checked })} />
            Send the daily reports automatically (12:10 arrivals, 19:01 logouts)
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
              <Send size={16} /> Send
            </button>
          </div>
        </section>

        {/* Every send, successful or not — the table that held the only
            evidence last time this broke. */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="font-semibold text-[#10243E] mb-4 flex items-center gap-2">
            <MessageCircle size={18} /> Recent sends
          </h2>
          {log.length === 0 && <p className="text-sm text-gray-500">Nothing sent yet.</p>}
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
