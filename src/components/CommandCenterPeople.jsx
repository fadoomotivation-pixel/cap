import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';
import {
  ShieldCheck, KeyRound, Copy, MessageCircle, Ban, CheckCircle2, UserMinus,
  UserPlus, Camera, Save, X, AlertTriangle,
} from 'lucide-react';

/**
 * Everything the Command Center can do to a PERSON and to their LOGIN.
 *
 * Built 10 October 2026, when the founder asked for one place to change a
 * password, a photo, a name (the machine follows), a phone number or an
 * email — and to hand the new HR, Ananya, the console because Disha had left.
 *
 * Two things here exist because of what that request uncovered:
 *
 *  1. ADMINS ARE DATA. The admin list was written into fourteen places, so a
 *     departure was a developer job and the one copy nobody changed would
 *     have kept the leaver's access. It is now the cb_admins table, managed
 *     from the panel below.
 *
 *  2. A LEAVER IS ONE ACTION, NOT FOUR. Somebody leaving used to mean: mark
 *     them left on the roster, and separately (if anybody remembered) stop
 *     their login, take away admin, free their machine code. "Has left" does
 *     all of it, in that order, and reports each step.
 *
 * Passwords are generated server-side by create-employee-login and shown
 * ONCE, on this screen, to the admin who asked. They are never stored and
 * never put in a URL.
 */

const LOGIN_URL = 'https://www.capitalbrix.co.in/employee-kyc';

const ago = (ts) => {
  if (!ts) return null;
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

async function account(body) {
  const { data, error } = await supabase.functions.invoke('create-employee-login', { body });
  if (error) return { success: false, error: friendlyError(error) };
  return data || { success: false, error: 'No answer from the server.' };
}

/** A password shown once, with the two ways it actually gets handed over. */
function Credentials({ creds, phone, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Capital Brix login\n${LOGIN_URL}\nEmail: ${creds.email}\nPassword: ${creds.password}\n\nPlease change it after you sign in.`;
  const digits = String(phone || '').replace(/\D/g, '');
  const wa = digits ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}?text=${encodeURIComponent(`${text}\n\n— Capital Brix HR`)}` : null;
  return (
    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-green-900">{creds.existed ? 'Password reset' : 'Login created'}</p>
          <p className="text-green-900 mt-1">Email: <span className="font-mono">{creds.email}</span></p>
          <p className="text-green-900">Password: <span className="font-mono font-bold tracking-wide">{creds.password}</span></p>
          <p className="text-xs text-green-800/80 mt-1">Shown once. It is not stored anywhere — hand it over now.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-green-800/70 hover:text-green-900"><X size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs px-2.5 py-1.5 rounded border border-green-300 bg-white flex items-center gap-1">
          <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
        </button>
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer"
            className="text-xs px-2.5 py-1.5 rounded bg-[#25D366] text-white flex items-center gap-1">
            <MessageCircle size={13} /> Send on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/** Login state as one short badge, for the directory row. */
export function LoginBadge({ login }) {
  if (!login) return null;
  if (!login.user_id) return <span className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">No login</span>;
  if (login.disabled) return <span className="text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded">Login disabled</span>;
  return (
    <span className="text-[10px] uppercase tracking-wide bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
      {login.last_sign_in_at ? `Last login ${ago(login.last_sign_in_at)}` : 'Never logged in'}
      {login.is_admin && <span className="ml-1 text-[#9C7C1C]">· Admin</span>}
    </span>
  );
}

/** Logins per employee id, from cb_employee_logins(). Empty until the SQL is applied. */
export function useEmployeeLogins() {
  const [logins, setLogins] = useState({});
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('cb_employee_logins');
    if (error) return;
    setLogins(Object.fromEntries((data || []).map((l) => [l.employee_id, l])));
  }, []);
  useEffect(() => { load(); }, [load]);
  return [logins, load];
}

/**
 * The per-person panel: name, phone, email, photo, login, admin, leaving.
 */
export function ManagePerson({ emp, login, session, onChanged, onClose }) {
  const [name, setName] = useState(emp.full_name || '');
  const [phone, setPhone] = useState(emp.phone || '');
  const [email, setEmail] = useState(emp.email || '');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [creds, setCreds] = useState(null);

  const me = session?.user?.email?.toLowerCase();
  const isMe = (login?.login_email || emp.email || '').toLowerCase() === me;
  const placeholder = /\.invalid$/i.test(emp.email || '');

  const say = (text, ok = true) => setMsg({ text, ok });

  const run = async (key, fn) => {
    setBusy(key); setMsg(null);
    try { await fn(); } catch (e) { say(friendlyError(e), false); }
    setBusy('');
  };

  const saveBasics = () => run('basics', async () => {
    const patch = {};
    if (name.trim() && name.trim() !== emp.full_name) patch.full_name = name.trim();
    if (phone.trim() !== (emp.phone || '')) patch.phone = phone.trim() || null;
    if (!Object.keys(patch).length) return say('Nothing changed.');
    const { error } = await supabase.from('cb_employees').update(patch).eq('id', emp.id);
    if (error) throw error;
    say(patch.full_name && emp.device_code
      ? 'Saved. The machine is renamed automatically — it shows on the terminal within a minute.'
      : 'Saved.');
    onChanged();
  });

  const saveEmail = () => run('email', async () => {
    const next = email.trim().toLowerCase();
    if (!next || next === (emp.email || '').toLowerCase()) return say('Nothing changed.');
    const r = await account({ action: 'set_email', employee_id: emp.id, email: next });
    if (!r.success) return say(r.error, false);
    say(r.had_login ? 'Email changed — they now sign in with the new address.' : 'Email saved. They have no login yet.');
    onChanged();
  });

  const uploadPhoto = (file) => run('photo', async () => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return say('That photo is over 5 MB. Please use a smaller one.', false);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `hr/${emp.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('employee-photos')
      .upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (upErr) throw upErr;
    const url = supabase.storage.from('employee-photos').getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from('cb_employees').update({ photo_url: url }).eq('id', emp.id);
    if (error) throw error;
    say('Photo updated.');
    onChanged();
  });

  const loginAction = () => run('login', async () => {
    const r = await account({ employee_id: emp.id, email: emp.email, full_name: emp.full_name });
    if (!r.success) return say(r.error, false);
    setCreds(r);
    onChanged();
  });

  const toggleDisabled = () => run('disable', async () => {
    const action = login?.disabled ? 'enable' : 'disable';
    if (action === 'disable' && !window.confirm(`Stop ${emp.full_name.trim()}'s login from working? You can switch it back on.`)) return;
    const r = await account({ action, employee_id: emp.id });
    if (!r.success) return say(r.error, false);
    say(action === 'disable' ? 'Login disabled — they can no longer sign in.' : 'Login switched back on.');
    onChanged();
  });

  const toggleAdmin = () => run('admin', async () => {
    const addr = (login?.login_email || emp.email || '').toLowerCase();
    if (login?.is_admin) {
      if (!window.confirm(`Remove admin access from ${addr}?`)) return;
      const { error } = await supabase.rpc('cb_admin_remove', { p_email: addr });
      if (error) throw error;
      say('Admin access removed.');
    } else {
      if (!window.confirm(`Give ${emp.full_name.trim()} (${addr}) full admin access — every console, every employee's data?`)) return;
      const { error } = await supabase.rpc('cb_admin_add', { p_email: addr, p_note: emp.full_name.trim() });
      if (error) throw error;
      say('Admin access given. They see the consoles the next time they sign in.');
    }
    onChanged();
  });

  /**
   * Has left — the whole offboarding in one go, each step reported. The date
   * is asked, never assumed: people are usually marked left days after.
   */
  const offboard = () => run('left', async () => {
    const day = window.prompt(
      `Last working day for ${emp.full_name.trim()} (YYYY-MM-DD)?\n\nThis will:\n• keep their past attendance\n• free their machine code\n• stop their login\n• remove admin access if they have it`,
      todayIst(),
    );
    if (!day) return;
    const steps = [];
    const { error: leftErr } = await supabase.rpc('cb_mark_employee_left', { p_employee: emp.id, p_left_on: day });
    steps.push(leftErr ? `Marking left failed: ${friendlyError(leftErr)}` : `Marked as left on ${day}.`);
    if (login?.user_id && !login.disabled) {
      const r = await account({ action: 'disable', employee_id: emp.id });
      steps.push(r.success ? 'Login stopped.' : `Login not stopped: ${r.error}`);
    }
    if (login?.is_admin) {
      const { error } = await supabase.rpc('cb_admin_remove', { p_email: (login.login_email || emp.email).toLowerCase() });
      steps.push(error ? `Admin not removed: ${friendlyError(error)}` : 'Admin access removed.');
    }
    say(steps.join(' '), !leftErr);
    onChanged();
  });

  const field = 'border border-gray-200 rounded px-2 py-1.5 text-sm text-[#10243E] w-full';

  return (
    <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-[#10243E]">Manage {emp.full_name}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X size={18} /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Basics */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-600">Name
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${field}`} />
          </label>
          {emp.device_code && (
            <p className="text-[11px] text-gray-500">Machine #{emp.device_code} — a new name is sent to the terminal automatically.</p>
          )}
          <label className="block text-xs text-gray-600">Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={`mt-1 ${field}`} />
          </label>
          <button onClick={saveBasics} disabled={busy === 'basics'}
            className="text-sm px-3 py-1.5 rounded bg-[#10243E] text-white flex items-center gap-1.5 disabled:opacity-50">
            <Save size={14} /> Save name & phone
          </button>
        </div>

        {/* Email + photo */}
        <div className="space-y-2">
          <label className="block text-xs text-gray-600">Email (also their login)
            <div className="flex gap-1.5 mt-1">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={field} />
              <button onClick={saveEmail} disabled={busy === 'email' || isMe}
                className="text-xs px-2.5 rounded bg-[#10243E] text-white disabled:opacity-40 shrink-0">Save</button>
            </div>
          </label>
          {placeholder && (
            <p className="text-[11px] text-amber-700 flex items-start gap-1">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              This is a placeholder address from the machine. Put their real email here before giving them a login.
            </p>
          )}
          <label className="text-xs text-gray-600 flex items-center gap-2 cursor-pointer">
            <span className="px-3 py-1.5 rounded border border-gray-300 bg-white flex items-center gap-1.5 text-sm text-[#10243E]">
              <Camera size={14} /> {busy === 'photo' ? 'Uploading…' : 'Change photo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* Login & access */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Login & access</p>
        <p className="text-sm text-gray-700 mb-2">
          {!login ? 'Login status loads once the admin SQL is applied.'
            : !login.user_id ? 'No login yet.'
              : login.disabled ? `Login disabled (${login.login_email}).`
                : `Signs in as ${login.login_email} · ${login.last_sign_in_at ? `last login ${ago(login.last_sign_in_at)}` : 'has never logged in'}${login.is_admin ? ' · admin' : ''}.`}
        </p>
        {isMe ? (
          <p className="text-xs text-gray-500">This is your own account. Change your own password from your account, not from here — that is how an admin locks themselves out.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={loginAction} disabled={busy === 'login' || placeholder}
              title={placeholder ? 'Set a real email first' : ''}
              className="text-sm px-3 py-1.5 rounded border border-[#10243E] text-[#10243E] hover:bg-[#10243E] hover:text-white flex items-center gap-1.5 disabled:opacity-40">
              <KeyRound size={14} /> {login?.user_id ? 'Reset password' : 'Create login'}
            </button>
            {login?.user_id && (
              <button onClick={toggleDisabled} disabled={busy === 'disable'}
                className="text-sm px-3 py-1.5 rounded border border-gray-300 flex items-center gap-1.5 disabled:opacity-50">
                {login.disabled ? <><CheckCircle2 size={14} /> Switch login back on</> : <><Ban size={14} /> Disable login</>}
              </button>
            )}
            {login && (
              <button onClick={toggleAdmin} disabled={busy === 'admin' || placeholder}
                className="text-sm px-3 py-1.5 rounded border border-[#EADFBF] bg-[#FAF6E9] text-[#7a5f12] flex items-center gap-1.5 disabled:opacity-40">
                <ShieldCheck size={14} /> {login.is_admin ? 'Remove admin' : 'Make admin'}
              </button>
            )}
            {!emp.left_on && (
              <button onClick={offboard} disabled={busy === 'left'}
                className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50">
                <UserMinus size={14} /> Has left the company
              </button>
            )}
          </div>
        )}
        {creds && <Credentials creds={creds} phone={emp.phone} onClose={() => setCreds(null)} />}
      </div>

      {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}

/**
 * Who can open the consoles. The list that used to live in the code.
 *
 * It says, per admin, whether there is a login behind the name at all — on
 * 10 October two of the three listed admins had none, and the whole company's
 * admin access ran through the login of somebody who had left.
 */
export function AdminAccessPanel({ session }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState('');
  const [msg, setMsg] = useState(null);
  const [creds, setCreds] = useState(null);
  const me = session?.user?.email?.toLowerCase();

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('cb_admin_list');
    if (error) { setErr('Admin list unavailable until the admin SQL is applied.'); setRows([]); return; }
    setErr(''); setRows(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setMsg(null);
    const { error } = await supabase.rpc('cb_admin_add', { p_email: adding.trim() });
    if (error) return setMsg({ ok: false, text: friendlyError(error) });
    setMsg({ ok: true, text: `${adding.trim()} is now an admin. If they have no login yet, create one below.` });
    setAdding(''); load();
  };

  const remove = async (email) => {
    if (!window.confirm(`Remove admin access from ${email}? They keep their login but lose every console.`)) return;
    setMsg(null);
    const { error } = await supabase.rpc('cb_admin_remove', { p_email: email });
    if (error) return setMsg({ ok: false, text: friendlyError(error) });
    setMsg({ ok: true, text: `${email} is no longer an admin.` }); load();
  };

  const createLogin = async (email) => {
    setMsg(null);
    const r = await account({ email });
    if (!r.success) return setMsg({ ok: false, text: r.error });
    setCreds(r); load();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-lg font-bold text-[#10243E] flex items-center gap-2"><ShieldCheck size={20} className="text-[#9C7C1C]" /> Admin access</h2>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Who can open the consoles and see every employee&apos;s data. When somebody leaves, take them off here.
      </p>
      {err && <p className="text-sm text-amber-700 mb-3">{err}</p>}
      {rows && rows.length > 0 && (
        <div className="divide-y divide-gray-100 mb-4">
          {rows.map((a) => (
            <div key={a.email} className="py-2.5 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-[#10243E]">{a.email}{a.email === me && <span className="text-xs text-gray-400"> (you)</span>}</p>
                <p className="text-xs text-gray-500">
                  {a.employee_name ? `${a.employee_name} · ` : ''}
                  {!a.has_login ? <span className="text-amber-700">no login — this admin cannot sign in</span>
                    : a.disabled ? <span className="text-red-600">login disabled</span>
                      : a.last_sign_in_at ? `last login ${ago(a.last_sign_in_at)}` : 'never logged in'}
                </p>
              </div>
              {!a.has_login && (
                <button onClick={() => createLogin(a.email)}
                  className="text-xs px-2.5 py-1.5 rounded border border-[#10243E] text-[#10243E] flex items-center gap-1"><KeyRound size={13} /> Create login</button>
              )}
              {a.email !== me && (
                <button onClick={() => remove(a.email)}
                  className="text-xs px-2.5 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50">Remove</button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="email@capitalbrix.com" type="email"
          className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-[220px]" />
        <button onClick={add} disabled={!adding.trim()}
          className="text-sm px-3 py-1.5 rounded bg-[#10243E] text-white flex items-center gap-1.5 disabled:opacity-40"><UserPlus size={14} /> Add admin</button>
      </div>
      {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
      {creds && <Credentials creds={creds} onClose={() => setCreds(null)} />}
    </div>
  );
}
