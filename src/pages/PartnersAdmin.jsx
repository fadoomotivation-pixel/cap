import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import { ADMIN_EMAILS } from '../lib/admin';
import { friendlyError } from '../lib/errors';
import { PARTNER_STATUSES, statusMeta, rowsFromCsv } from '../lib/partnerTargets';
import {
  Handshake, RefreshCw, LogOut, X, Upload, UserPlus, Search,
  Phone, MessageCircle, Ban, CheckCircle2, AlertTriangle, Star, Eye, Copy, KeyRound,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * Channel-partner recruitment.
 *
 * The premise is "who opened a real-estate business this week", not "every
 * broker in NCR": a newly registered agent needs inventory and a developer
 * relationship, and an established one already has both. So the queue is
 * ordered by registration date and the console says how fresh the list is.
 *
 * Rows come from official registries that publish that date — state RERA
 * agent registries, MCA new incorporations — pasted in as CSV. Deliberately
 * NOT Google Maps: scraping it breaches their terms, and the ban arrives
 * after the work is done rather than before.
 */

const SOURCES = [
  { key: 'rera-up', label: 'UP RERA (Noida, Ghaziabad)' },
  { key: 'rera-hr', label: 'Haryana RERA (Gurugram, Faridabad)' },
  { key: 'rera-dl', label: 'Delhi RERA' },
  { key: 'mca', label: 'MCA new incorporations' },
  { key: 'own', label: 'Our own list' },
];

const fmtDay = (d) => (d ? format(parseISO(d), 'd MMM yyyy') : '—');

export default function PartnersAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState('queue'); // queue | team | import
  const [targets, setTargets] = useState([]);
  const [team, setTeam] = useState([]);
  const [board, setBoard] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const [csv, setCsv] = useState('');
  const [csvSource, setCsvSource] = useState(SOURCES[0].key);
  const [importResult, setImportResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tokenFor, setTokenFor] = useState(null);
  const [assignCount, setAssignCount] = useState(25);

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

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const [{ data: rows }, { data: emps }, { data: b }] = await Promise.all([
      supabase.from('cb_partner_targets').select('*')
        .order('registered_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('cb_employees').select('id, full_name, phone, can_work_partners, capture_token')
        .eq('is_active', true).order('full_name'),
      supabase.rpc('cb_partner_board'),
    ]);
    setTargets(rows || []);
    setTeam(emps || []);
    setBoard(b || []);
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const nameOf = useMemo(() => {
    const m = new Map(team.map((e) => [e.id, e.full_name.trim()]));
    return (id) => (id ? m.get(id) || 'Someone who has left' : null);
  }, [team]);

  const stats = useMemo(() => {
    const week = Date.now() - 7 * 864e5;
    return {
      total: targets.length,
      unassigned: targets.filter((t) => !t.assigned_to && t.status === 'new').length,
      fresh: targets.filter((t) => t.registered_on && Date.parse(t.registered_on) >= week).length,
      onboarded: targets.filter((t) => t.status === 'onboarded').length,
    };
  }, [targets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return targets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (ownerFilter === 'unassigned' && t.assigned_to) return false;
      if (ownerFilter && ownerFilter !== 'unassigned' && t.assigned_to !== ownerFilter) return false;
      if (!q) return true;
      return [t.name, t.firm, t.phone, t.city, t.area, t.rera_no]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [targets, search, statusFilter, ownerFilter]);

  /**
   * Read the paste WITHOUT sending it.
   *
   * A registry export's column names are never quite what you expect, and an
   * import that silently maps "Registered State" onto city is the kind of
   * mistake nobody catches until a telecaller calls somebody in Lucknow.
   * Showing three parsed rows costs one click and answers it.
   */
  const runPreview = () => {
    setImportResult(null);
    const { rows, skipped, headerFound } = rowsFromCsv(csv, csvSource);
    setPreview({ rows: rows.slice(0, 3), total: rows.length, skipped, headerFound });
  };

  /**
   * A capture token for the browser extension. Generating a new one
   * immediately invalidates the old, which is the whole point: a token on a
   * shared desktop is revoked by replacing it, not by asking nicely.
   */
  const issueToken = async (emp) => {
    const token = crypto.randomUUID();
    const { error: e } = await supabase.from('cb_employees')
      .update({ capture_token: token }).eq('id', emp.id);
    if (e) return setError(e.message);
    setTokenFor({ id: emp.id, name: emp.full_name.trim(), token });
  };

  const runImport = async () => {
    setError(''); setImportResult(null); setPreview(null);
    const { rows, skipped, headerFound } = rowsFromCsv(csv, csvSource);
    if (!headerFound) {
      return setImportResult({ error: 'No recognisable column headers. The first line must name the columns — at minimum a name column.' });
    }
    if (!rows.length) {
      return setImportResult({ error: 'No rows with a name in them.' });
    }
    setBusy(true);
    const { data, error: e } = await supabase.rpc('cb_import_partner_targets', { p_rows: rows });
    setBusy(false);
    if (e) return setImportResult({ error: e.message });
    setImportResult({ ...data, skipped });
    setCsv('');
    load();
  };

  const assignTo = async (employeeId) => {
    setError('');
    setBusy(true);
    const { data, error: e } = await supabase.rpc('cb_assign_partner_targets', {
      p_employee: employeeId, p_count: Number(assignCount) || 0, p_city: null,
    });
    setBusy(false);
    if (e) return setError(e.message);
    flash(data > 0
      ? `${data} handed to ${nameOf(employeeId)}. They see them in their portal straight away.`
      : 'Nothing left in the queue to hand out.');
    load();
  };

  const patch = async (row, changes) => {
    const { error: e } = await supabase.from('cb_partner_targets').update(changes).eq('id', row.id);
    if (e) return setError(e.message);
    setTargets((rows) => rows.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
  };

  const toggleWorker = async (emp) => {
    const { error: e } = await supabase.from('cb_employees')
      .update({ can_work_partners: !emp.can_work_partners }).eq('id', emp.id);
    if (e) return setError(e.message);
    load();
  };

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Channel Partners</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error: err } = await supabase.auth.signInWithPassword({ email, password }); if (err) setError(friendlyError(err)); }} className="space-y-4">
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

  const workers = team.filter((e) => e.can_work_partners);

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-6xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Channel Partners</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={busy} className="flex items-center gap-2 text-gray-600 hover:text-[#9C7C1C] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat label="On the list" value={stats.total} />
          <Stat label="Registered this week" value={stats.fresh} accent />
          <Stat label="Waiting to be handed out" value={stats.unassigned} />
          <Stat label="Onboarded" value={stats.onboarded} />
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {[['queue', 'The list'], ['team', 'Who works it'], ['import', 'Import']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                tab === k ? 'border-[#f26522] text-[#f26522]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{label}</button>
          ))}
        </div>

        {/* ── THE LIST ── */}
        {tab === 'queue' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, firm, phone, city, RERA no."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522]" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                <option value="">Any status</option>
                {PARTNER_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                <option value="">Anyone</option>
                <option value="unassigned">Not handed out</option>
                {workers.map((e) => <option key={e.id} value={e.id}>{e.full_name.trim()}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Newest registration first — that is the whole point of the list.
              Showing {visible.length} of {targets.length}.
            </p>

            <div className="divide-y divide-gray-50">
              {visible.map((t) => {
                const meta = statusMeta(t.status);
                return (
                  <div key={t.id} className="py-3 flex flex-wrap gap-3 justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#10243E]">
                        {t.name}
                        {t.do_not_contact && (
                          <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                            Do not call
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[t.firm, t.area, t.city].filter(Boolean).join(' · ') || '—'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Registered {fmtDay(t.registered_on)}
                        {t.rera_no ? ` · ${t.rera_no}` : ''}
                        {t.assigned_to ? ` · with ${nameOf(t.assigned_to)}` : ' · not handed out'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${meta.cls}`}>{meta.label}</span>
                      {t.phone && (
                        <a href={`tel:${t.phone}`} className="text-gray-400 hover:text-[#f26522]" title={t.phone}><Phone size={15} /></a>
                      )}
                      <button onClick={() => patch(t, { do_not_contact: !t.do_not_contact, status: t.do_not_contact ? t.status : 'dnc' })}
                        title="Never hand this person to anybody again"
                        className={`text-xs px-2 py-1 rounded border ${t.do_not_contact ? 'bg-red-50 text-red-700 border-red-200' : 'text-gray-400 border-gray-200 hover:text-red-600'}`}>
                        <Ban size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {visible.length === 0 && (
                <p className="text-sm text-gray-400 py-8 text-center">
                  {targets.length === 0 ? 'Nothing imported yet — start on the Import tab.' : 'Nothing matches those filters.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── WHO WORKS IT ── */}
        {tab === 'team' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-[#10243E] mb-1">Who can work channel partners</h2>
              <p className="text-sm text-gray-500 mb-4">
                Off for everybody by default. Whoever you switch on sees a
                Channel Partners tab in their Employee Portal — and sees
                <strong> only the names you hand them</strong>, never the queue
                and never a colleague&apos;s list.
              </p>
              {/* Shown once, here, and not stored anywhere in the console.
                  A secret that stays on screen is a secret on a shared desk. */}
              {tokenFor && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-900 mb-2">
                    <strong>{tokenFor.name}&apos;s capture token.</strong> Copy it into their
                    browser extension now — it is not shown again, and issuing another
                    one stops this working.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <code className="text-[11px] bg-white border border-amber-200 rounded px-2 py-1 font-mono break-all">
                      {tokenFor.token}
                    </code>
                    <button onClick={() => { navigator.clipboard?.writeText(tokenFor.token); flash('Token copied.'); }}
                      className="text-[11px] px-2 py-1 rounded border border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-1">
                      <Copy size={11} /> Copy
                    </button>
                    <button onClick={() => setTokenFor(null)}
                      className="text-[11px] text-amber-700 hover:underline">Done</button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {team.map((e) => (
                  <div key={e.id} className="py-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-[#10243E]">{e.full_name.trim()}</span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {e.can_work_partners && (
                        <button onClick={() => issueToken(e)}
                          title="A new token for the browser extension. Issuing one stops the old token working immediately."
                          className="text-[11px] px-2.5 py-1 rounded border border-gray-200 text-gray-500 hover:border-[#D4AF37] hover:text-[#9C7C1C] flex items-center gap-1">
                          <KeyRound size={11} /> {e.capture_token ? 'New token' : 'Capture token'}
                        </button>
                      )}
                      <button onClick={() => toggleWorker(e)}
                        className={`text-[11px] px-2.5 py-1 rounded border flex items-center gap-1 ${
                          e.can_work_partners
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-white text-gray-400 border-gray-200 hover:text-green-700'
                        }`}>
                        <Star size={11} /> {e.can_work_partners ? 'Can work partners' : 'Off'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-[#10243E] mb-1">Hand out the newest</h2>
              <p className="text-sm text-gray-500 mb-4">
                Takes the most recently registered names that nobody holds yet.
                Anyone marked <strong>Do not call</strong> is never handed out, to anybody.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                How many each:
                <input type="number" min="1" max="200" value={assignCount}
                  onChange={(e) => setAssignCount(e.target.value)}
                  className="w-20 border border-gray-200 rounded-md px-2 py-1 text-sm outline-none focus:border-[#f26522]" />
                <span className="text-xs text-gray-400">{stats.unassigned} waiting</span>
              </label>

              {workers.length === 0 ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Nobody is switched on yet. Turn somebody on above first.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="p-2 font-medium">Telecaller</th>
                        <th className="p-2 font-medium">Holding</th>
                        <th className="p-2 font-medium">Not called</th>
                        <th className="p-2 font-medium">Interested</th>
                        <th className="p-2 font-medium">Onboarded</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {board.map((b) => (
                        <tr key={b.employee_id}>
                          <td className="p-2 font-medium text-[#10243E]">{b.full_name.trim()}</td>
                          <td className="p-2">{b.assigned}</td>
                          <td className="p-2 text-gray-500">{b.untouched}</td>
                          <td className="p-2 text-amber-700">{b.interested + b.meeting}</td>
                          <td className="p-2 text-green-700 font-semibold">{b.onboarded}</td>
                          <td className="p-2 text-right">
                            <button onClick={() => assignTo(b.employee_id)} disabled={busy || stats.unassigned === 0}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#10243E] text-white hover:bg-[#1a365d] disabled:opacity-40 ml-auto">
                              <UserPlus size={14} /> Hand out {assignCount}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── IMPORT ── */}
        {tab === 'import' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
              <Upload size={18} className="text-[#9C7C1C]" /> Import a registry export
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              Download the agent list from the registry, open it, copy everything
              including the header row, and paste it below.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              <strong>Paste the same file every day if you like.</strong> A row already
              here is updated, not duplicated, and its status, owner and notes are
              never overwritten by an import — that is a week of calling undone.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <select value={csvSource} onChange={(e) => setCsvSource(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10}
              placeholder={'name,firm,phone,city,rera_no,registered_on\nRahul Sharma,Sharma Estates,9810012345,Noida,UPRERAAGT12345,2026-09-18'}
              className="w-full border border-gray-200 rounded-md p-3 text-xs font-mono outline-none focus:border-[#f26522] mb-3" />

            <div className="flex flex-wrap gap-2">
              <button onClick={runPreview} disabled={!csv.trim()}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-md text-sm font-medium hover:border-[#f26522] disabled:opacity-50">
                <Eye size={16} /> Check it first
              </button>
              <button onClick={runImport} disabled={busy || !csv.trim()}
                className="flex items-center gap-2 bg-[#f26522] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                <Upload size={16} /> {busy ? 'Importing…' : 'Import'}
              </button>
            </div>

            {preview && (
              <div className="mt-4 border border-gray-200 rounded-lg p-3 text-xs">
                {!preview.headerFound ? (
                  <p className="text-red-700">
                    No column headers recognised. The first line must name the columns.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      <strong>{preview.total}</strong> rows would be read
                      {preview.skipped > 0 && <>, {preview.skipped} skipped for having no name</>}.
                      Here are the first {preview.rows.length} — check a phone number landed in
                      phone and a date in date before importing.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="text-[11px] w-full">
                        <thead className="text-gray-400">
                          <tr>
                            <th className="text-left p-1">name</th>
                            <th className="text-left p-1">phone</th>
                            <th className="text-left p-1">city</th>
                            <th className="text-left p-1">registered_on</th>
                            <th className="text-left p-1">source_ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((r, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="p-1">{r.name}</td>
                              <td className="p-1">{r.phone || <span className="text-gray-300">—</span>}</td>
                              <td className="p-1">{r.city || <span className="text-gray-300">—</span>}</td>
                              <td className="p-1">{r.registered_on || <span className="text-amber-600">missing</span>}</td>
                              <td className="p-1 text-gray-400">{r.source_ref}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {importResult && (
              <div className={`mt-4 rounded-lg p-3 text-sm border flex gap-2 ${
                importResult.error
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : 'bg-green-50 text-green-800 border-green-100'
              }`}>
                {importResult.error ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                <span>
                  {importResult.error || (
                    <>
                      <strong>{importResult.new} new</strong>, {importResult.updated} already
                      here and refreshed, out of {importResult.received} rows read.
                      {importResult.skipped > 0 && ` ${importResult.skipped} rows had no name and were left out.`}
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-2">
              <p>
                <strong className="text-gray-700">Columns it understands:</strong> name (required),
                firm, phone, email, rera_no, address, area, city, registered_on, source_ref.
                Header names are matched loosely, so most registry exports paste in as they are.
              </p>
              <p>
                <strong className="text-gray-700">registered_on is the one that matters</strong> — it is
                how the list knows who is new. Without it a row still imports, but it sinks to the
                bottom of the queue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`p-4 rounded-xl border shadow-sm ${accent ? 'bg-[#10243E] border-[#10243E]' : 'bg-white border-gray-100'}`}>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-xs ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}
