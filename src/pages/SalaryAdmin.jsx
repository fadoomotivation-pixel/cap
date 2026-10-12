import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import { friendlyError } from '../lib/errors';
import { resolveAdmin } from '../lib/admin';
import { inr, fmtDate, downloadCsv, whatsappLink } from '../lib/expenses';
import {
  IndianRupee, HandCoins, History, Users, LogOut, RefreshCw, Plus, Trash2, Pencil,
  CheckCircle, ArrowDownToLine, Send, Undo2, X, AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * Salary and advances — /admin/salary.
 *
 * Built 12 October 2026 on the founder's ask: a salary console, and above all
 * a record of every advance he hands somebody, with the date. An advance
 * remembered by one person is the argument on salary day; one written down
 * with a date, an amount and who gave it is not.
 *
 * Everything on the payroll tab comes from cb_payroll_month(), so the screen,
 * the CSV and the WhatsApp summary cannot disagree. Absent days come from the
 * attendance register and are offered as a SUGGESTED deduction — never applied
 * on their own, because a day the machine missed is not a day somebody
 * skipped. Every edit and delete is kept in cb_expense_audit and can be undone.
 */

const today = () => format(new Date(), 'yyyy-MM-dd');
const thisMonth = () => format(new Date(), 'yyyy-MM');
const MODES = [['cash', 'Cash'], ['upi', 'UPI'], ['bank', 'Bank transfer']];
const SALARY_TABLES = ['cb_salary_rates', 'cb_salary_advances', 'cb_salary_payments'];
const TABLE_LABEL = { cb_salary_rates: 'Salary', cb_salary_advances: 'Advance', cb_salary_payments: 'Payment' };
const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

export default function SalaryAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState('payroll');
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState(null);
  const [setupMissing, setSetupMissing] = useState(false);
  const [people, setPeople] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [rates, setRates] = useState([]);
  const [audit, setAudit] = useState(null);
  const [founderWa, setFounderWa] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); resolveAdmin(session, setIsAdmin); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); resolveAdmin(s, setIsAdmin); });
    return () => subscription.unsubscribe();
  }, []);

  const flash = (m) => { setOk(m); setTimeout(() => setOk(''), 4000); };
  const fail = (e) => setError(typeof e === 'string' ? e : friendlyError(e));

  const loadPayroll = useCallback(async () => {
    if (!isAdmin) return;
    const { data, error: err } = await supabase.rpc('cb_payroll_month', { p_month: `${month}-01` });
    if (err) {
      if (/cb_payroll_month|does not exist|schema cache/i.test(err.message || '')) { setSetupMissing(true); setRows([]); return; }
      fail(err); setRows([]); return;
    }
    setSetupMissing(false); setRows(data || []);
  }, [isAdmin, month]);

  const loadRest = useCallback(async () => {
    if (!isAdmin) return;
    const [p, a, r, hr] = await Promise.all([
      supabase.from('cb_employees').select('id, full_name, device_code, left_on, is_active').order('full_name'),
      supabase.from('cb_salary_advances').select('*').order('given_on', { ascending: false }).limit(500),
      supabase.from('cb_salary_rates').select('*').order('effective_from', { ascending: false }),
      supabase.from('cb_hr_settings').select('founder_whatsapp').eq('id', 1).maybeSingle(),
    ]);
    setPeople(p.data || []);
    setAdvances(a.data || []);
    setRates(r.data || []);
    setFounderWa(hr.data?.founder_whatsapp || null);
  }, [isAdmin]);

  const loadAudit = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from('cb_expense_audit').select('*')
      .in('table_name', SALARY_TABLES).order('at', { ascending: false }).limit(200);
    setAudit(data || []);
  }, [isAdmin]);

  useEffect(() => { loadPayroll(); }, [loadPayroll]);
  useEffect(() => { loadRest(); }, [loadRest]);
  useEffect(() => { if (tab === 'history') loadAudit(); }, [tab, loadAudit]);

  const reloadAll = () => { loadPayroll(); loadRest(); if (tab === 'history') loadAudit(); };
  const nameOf = useCallback((id) => (people.find((p) => p.id === id)?.full_name || '—').trim(), [people]);
  const current = useMemo(() => people.filter((p) => !p.left_on && p.is_active !== false), [people]);

  const totals = useMemo(() => {
    const r = rows || [];
    return {
      payroll: r.reduce((s, x) => s + num(x.paid_id ? x.paid_net : x.suggested_net), 0),
      paid: r.filter((x) => x.paid_id).reduce((s, x) => s + num(x.paid_net), 0),
      pendingCount: r.filter((x) => !x.paid_id && num(x.monthly_salary) > 0).length,
      noSalary: r.filter((x) => !num(x.monthly_salary)).length,
      advOut: r.reduce((s, x) => s + Math.max(num(x.advance_balance), 0), 0),
    };
  }, [rows]);

  const summary = useMemo(() => {
    const label = format(parseISO(`${month}-01`), 'MMMM yyyy');
    const r = rows || [];
    const lines = [`*Salary — ${label}*`, '',
      `Total payable ${inr(totals.payroll)} · Paid ${inr(totals.paid)}`,
      `Still to pay: ${totals.pendingCount} people`,
      `Advances outstanding: ${inr(totals.advOut)}`];
    const adv = r.filter((x) => num(x.advances_this_month) > 0);
    if (adv.length) {
      lines.push('', '*Advances given this month*');
      adv.forEach((x) => lines.push(`• ${x.full_name}: ${inr(x.advances_this_month)}`));
    }
    if (totals.noSalary) lines.push('', `${totals.noSalary} people have no salary set yet.`);
    lines.push('', '— Capital Brix AI HR');
    return lines.join('\n');
  }, [rows, month, totals]);

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Salary Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not an admin.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error: err } = await supabase.auth.signInWithPassword({ email, password }); if (err) setError(friendlyError(err)); }} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
            <PasswordInput required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const run = async (fn, msg) => {
    setBusy(true); setError('');
    try { const r = await fn(); if (msg && r !== false) flash(msg); reloadAll(); } catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit cb-print-plain">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Salary &amp; Advances</h1>
            <p className="text-gray-500 text-sm">{session.user.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reloadAll} disabled={busy} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><RefreshCw size={16} /> Refresh</button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><LogOut size={16} /> Logout</button>
          </div>
        </div>

        <AdminNav className="mb-6" />

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
        {ok && <div className="bg-green-50 text-green-700 border border-green-100 p-4 rounded-lg mb-4 text-sm">{ok}</div>}

        {setupMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900 flex gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            The salary tables are not set up yet. Run <code>supabase/sql/cb_salary.sql</code> in Supabase (project SalesAutoCall) once, then refresh.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat label={`Payable — ${format(parseISO(`${month}-01`), 'MMM yyyy')}`} value={inr(totals.payroll)} accent />
          <Stat label="Paid so far" value={inr(totals.paid)} />
          <Stat label="Still to pay" value={`${totals.pendingCount} people`} warn={totals.pendingCount > 0} />
          <Stat label="Advances outstanding" value={inr(totals.advOut)} warn={totals.advOut > 0} />
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto" data-print-hide>
          {[['payroll', 'Monthly payroll', IndianRupee], ['advances', 'Advances', HandCoins], ['rates', 'Salary per person', Users], ['history', 'Changes & deleted', History]].map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === k ? 'border-[#f26522] text-[#f26522]' : 'border-transparent text-gray-500'}`}>
              <I size={16} /> {l}
            </button>
          ))}
        </div>

        {tab === 'payroll' && (
          <Payroll rows={rows} month={month} setMonth={setMonth} busy={busy} run={run}
            summary={summary} founderWa={founderWa} onCopy={() => { navigator.clipboard?.writeText(summary); flash('Summary copied.'); }} />
        )}
        {tab === 'advances' && (
          <Advances advances={advances} current={current} nameOf={nameOf} busy={busy} run={run} rows={rows} />
        )}
        {tab === 'rates' && (
          <Rates rates={rates} current={current} nameOf={nameOf} busy={busy} run={run} />
        )}
        {tab === 'history' && (
          <AuditList rows={audit} nameOf={nameOf} run={run} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn }) {
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${accent ? 'bg-[#10243E] border-[#10243E] text-white' : 'bg-white border-gray-100'}`}>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : warn ? 'text-amber-700' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

const field = 'border border-gray-200 rounded-md px-2 py-1.5 text-sm text-[#10243E]';

/* ── Monthly payroll ─────────────────────────────────────────────── */

function PayRow({ r, month, busy, run }) {
  const paid = !!r.paid_id;
  const [ded, setDed] = useState(String(num(paid ? r.paid_deduction : r.suggested_deduction)));
  const [bonus, setBonus] = useState(String(num(paid ? r.paid_bonus : 0)));
  const [rec, setRec] = useState(String(num(paid ? r.paid_recovered : r.suggested_recovery)));
  const [on, setOn] = useState(r.paid_on || today());
  const [mode, setMode] = useState(r.paid_mode || 'bank');
  const [note, setNote] = useState(r.paid_note || '');
  const [edit, setEdit] = useState(!paid);

  const gross = num(r.monthly_salary);
  const net = Math.max(gross - num(ded) + num(bonus) - num(rec), 0);
  const balanceBefore = num(r.advance_balance) + (paid ? num(r.paid_recovered) : 0);

  const save = () => run(async () => {
    if (num(rec) > balanceBefore + 0.01) throw new Error(`Advance recovery cannot be more than the ${inr(balanceBefore)} still outstanding.`);
    const row = {
      employee_id: r.employee_id, month: `${month}-01`, gross, deduction: num(ded), bonus: num(bonus),
      advance_recovered: num(rec), net_paid: net, paid_on: on, mode, note: note.trim() || null,
    };
    const { error } = await supabase.from('cb_salary_payments').upsert(row, { onConflict: 'employee_id,month' });
    if (error) throw error;
    setEdit(false);
  }, `${r.full_name}: ${inr(net)} recorded as paid.`);

  const undo = () => run(async () => {
    if (!window.confirm(`Undo the salary payment for ${r.full_name}? It is kept under "Changes & deleted" and can be restored.`)) return false;
    const { error } = await supabase.from('cb_salary_payments').delete().eq('id', r.paid_id);
    if (error) throw error;
  }, 'Payment undone.');

  return (
    <tr className="border-b border-gray-50 align-top">
      <td className="py-3 pr-3">
        <p className="font-medium text-[#10243E]">{r.full_name}</p>
        <p className="text-xs text-gray-500">
          {r.device_code ? `ID ${r.device_code}` : 'no machine ID'}{r.team_name ? ` · ${r.team_name}` : ''}{r.left_on ? ` · left ${fmtDate(r.left_on)}` : ''}
        </p>
      </td>
      <td className="py-3 pr-3 whitespace-nowrap">{gross ? inr(gross) : <span className="text-amber-700 text-xs">No salary set</span>}</td>
      <td className="py-3 pr-3 text-xs text-gray-600 whitespace-nowrap">
        {r.present_days} present<br />
        <span className={r.absent_days ? 'text-red-700' : ''}>{r.absent_days} absent</span>
        {r.leave_days ? <><br />{r.leave_days} leave</> : null}
      </td>
      <td className="py-3 pr-3 text-xs whitespace-nowrap">
        {num(r.advance_balance) > 0 || num(r.advances_this_month) > 0 || paid && num(r.paid_recovered) > 0 ? (
          <>
            <span className="text-[#10243E]">Owes {inr(balanceBefore)}</span>
            {num(r.advances_this_month) > 0 && <><br /><span className="text-amber-700">+{inr(r.advances_this_month)} this month</span></>}
          </>
        ) : <span className="text-gray-400">—</span>}
      </td>
      <td className="py-3 pr-3">
        {edit && gross > 0 ? (
          <div className="grid grid-cols-2 gap-1.5 min-w-[260px]">
            <label className="text-[11px] text-gray-500">Deduction<input value={ded} onChange={(e) => setDed(e.target.value)} inputMode="numeric" className={`${field} w-full`} /></label>
            <label className="text-[11px] text-gray-500">Bonus / extra<input value={bonus} onChange={(e) => setBonus(e.target.value)} inputMode="numeric" className={`${field} w-full`} /></label>
            <label className="text-[11px] text-gray-500">Advance recovered<input value={rec} onChange={(e) => setRec(e.target.value)} inputMode="numeric" className={`${field} w-full`} /></label>
            <label className="text-[11px] text-gray-500">Paid on<input type="date" value={on} onChange={(e) => setOn(e.target.value)} className={`${field} w-full`} /></label>
            <label className="text-[11px] text-gray-500">Paid by
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={`${field} w-full`}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            <label className="text-[11px] text-gray-500">Note<input value={note} onChange={(e) => setNote(e.target.value)} className={`${field} w-full`} /></label>
            {num(r.suggested_deduction) > 0 && !paid && (
              <p className="col-span-2 text-[11px] text-gray-500">Suggested deduction is {r.absent_days} absent day{r.absent_days === 1 ? '' : 's'} × salary ÷ {r.days_in_month}. Change it if a day was really worked.</p>
            )}
          </div>
        ) : paid ? (
          <p className="text-xs text-gray-600">
            −{inr(r.paid_deduction)} deduction{num(r.paid_bonus) ? ` · +${inr(r.paid_bonus)} bonus` : ''}{num(r.paid_recovered) ? ` · −${inr(r.paid_recovered)} advance` : ''}
            <br />Paid {fmtDate(r.paid_on)}{r.paid_mode ? ` · ${MODES.find(([v]) => v === r.paid_mode)?.[1]}` : ''}{r.paid_note ? ` · ${r.paid_note}` : ''}
          </p>
        ) : <span className="text-xs text-gray-400">Set a salary first</span>}
      </td>
      <td className="py-3 pr-3 text-right font-semibold text-[#10243E] whitespace-nowrap">{inr(paid && !edit ? r.paid_net : net)}</td>
      <td className="py-3 pl-3 text-right whitespace-nowrap">
        {edit && gross > 0 && (
          <div className="flex flex-col gap-1.5 items-end">
            <button onClick={save} disabled={busy} className="text-xs px-2.5 py-1.5 rounded bg-green-600 text-white flex items-center gap-1 disabled:opacity-50"><CheckCircle size={13} /> {paid ? 'Save' : 'Mark paid'}</button>
            {paid && <button onClick={() => setEdit(false)} className="text-xs text-gray-500">Cancel</button>}
          </div>
        )}
        {paid && !edit && (
          <div className="flex flex-col gap-1.5 items-end">
            <span className="text-[11px] uppercase tracking-wide bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">Paid</span>
            <button onClick={() => setEdit(true)} className="text-xs text-gray-500 flex items-center gap-1"><Pencil size={12} /> Edit</button>
            <button onClick={undo} className="text-xs text-red-600 flex items-center gap-1"><Undo2 size={12} /> Undo</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function Payroll({ rows, month, setMonth, busy, run, summary, founderWa, onCopy }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#10243E]">Monthly payroll</h2>
            <p className="text-xs text-gray-500 mt-0.5">Salary, attendance, advance to recover, and what to pay. Change any figure before marking paid.</p>
          </div>
          <div className="flex gap-2" data-print-hide>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={field} />
            <button onClick={() => downloadCsv([
              ['Name', 'Machine ID', 'Salary', 'Present', 'Absent', 'Leave', 'Deduction', 'Bonus', 'Advance recovered', 'Net', 'Paid on', 'Mode', 'Advance still owed'],
              ...(rows || []).map((r) => [r.full_name, r.device_code || '', num(r.monthly_salary), r.present_days, r.absent_days, r.leave_days,
                num(r.paid_id ? r.paid_deduction : r.suggested_deduction), num(r.paid_bonus), num(r.paid_id ? r.paid_recovered : r.suggested_recovery),
                num(r.paid_id ? r.paid_net : r.suggested_net), r.paid_on || 'NOT PAID', r.paid_mode || '', num(r.advance_balance)]),
            ], `capital-brix-salary-${month}.csv`)} disabled={!rows?.length}
              className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-md text-sm text-gray-600 disabled:opacity-50"><ArrowDownToLine size={15} /> CSV</button>
            <button onClick={() => window.print()} className="border border-gray-200 px-3 py-1.5 rounded-md text-sm text-gray-600">Print</button>
          </div>
        </div>
        {rows === null ? <p className="text-gray-400 text-sm">Loading…</p> : rows.length === 0 ? <p className="text-gray-400 text-sm py-6 text-center">Nobody to pay this month.</p> : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3">Person</th><th className="py-2 pr-3">Salary</th><th className="py-2 pr-3">Attendance</th>
                  <th className="py-2 pr-3">Advance</th><th className="py-2 pr-3">Adjustments</th><th className="py-2 pr-3 text-right">Net pay</th><th className="py-2 pl-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => <PayRow key={`${r.employee_id}-${r.paid_id || 'new'}-${month}`} r={r} month={month} busy={busy} run={run} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#10243E] text-white rounded-xl p-6" data-print-hide>
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Send size={18} className="text-[#f26522]" /> Salary summary to the founder</h2>
          <div className="flex gap-2">
            <button onClick={onCopy} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm">Copy</button>
            <a href={whatsappLink(founderWa, summary)} target="_blank" rel="noreferrer" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-semibold">Send on WhatsApp</a>
          </div>
        </div>
        <pre className="mt-4 bg-black/20 rounded-lg p-4 text-xs text-white/80 whitespace-pre-wrap font-sans">{summary}</pre>
      </div>
    </div>
  );
}

/* ── Advances ────────────────────────────────────────────────────── */

function Advances({ advances, current, nameOf, busy, run, rows }) {
  const blank = { employee_id: '', given_on: today(), amount: '', mode: 'cash', given_by: 'Founder', recover_per_month: '', note: '' };
  const [f, setF] = useState(blank);
  const [who, setWho] = useState('');

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      if (!f.employee_id) throw new Error('Pick the person.');
      if (!(num(f.amount) > 0)) throw new Error('Enter the amount.');
      const { error } = await supabase.from('cb_salary_advances').insert([{
        employee_id: f.employee_id, given_on: f.given_on, amount: num(f.amount), mode: f.mode,
        given_by: f.given_by.trim() || 'Founder',
        recover_per_month: f.recover_per_month ? num(f.recover_per_month) : null, note: f.note.trim() || null,
      }]);
      if (error) throw error;
      setF({ ...blank, given_on: f.given_on });
    }, `Advance of ${inr(f.amount)} to ${nameOf(f.employee_id)} recorded.`);
  };

  const remove = (a) => run(async () => {
    if (!window.confirm(`Delete the ${inr(a.amount)} advance to ${nameOf(a.employee_id)} on ${fmtDate(a.given_on)}? It can be restored from "Changes & deleted".`)) return false;
    const { error } = await supabase.from('cb_salary_advances').delete().eq('id', a.id);
    if (error) throw error;
  }, 'Advance deleted.');

  const editAmount = (a) => run(async () => {
    const v = window.prompt(`Correct the amount of the advance to ${nameOf(a.employee_id)} on ${fmtDate(a.given_on)}:`, String(num(a.amount)));
    if (v === null) return false;
    if (!(num(v) > 0)) throw new Error('Enter an amount greater than zero.');
    const { error } = await supabase.from('cb_salary_advances').update({ amount: num(v) }).eq('id', a.id);
    if (error) throw error;
  }, 'Advance corrected.');

  const shown = who ? advances.filter((a) => a.employee_id === who) : advances;
  const owing = (rows || []).filter((r) => num(r.advance_balance) > 0).sort((a, b) => num(b.advance_balance) - num(a.advance_balance));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1"><HandCoins size={18} className="text-[#f26522]" /> Record an advance</h2>
        <p className="text-xs text-gray-500 mb-4">Every time money is given before salary day. It is recovered from salary — all at once, or a fixed amount each month.</p>
        <form onSubmit={add} className="space-y-3">
          <select value={f.employee_id} onChange={(e) => setF({ ...f, employee_id: e.target.value })} className={`${field} w-full`}>
            <option value="">Who received it…</option>
            {current.map((p) => <option key={p.id} value={p.id}>{p.full_name.trim()}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">Date<input type="date" max={today()} value={f.given_on} onChange={(e) => setF({ ...f, given_on: e.target.value })} className={`${field} w-full`} /></label>
            <label className="text-xs text-gray-500">Amount (₹)<input inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={`${field} w-full`} /></label>
            <label className="text-xs text-gray-500">Given as
              <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })} className={`${field} w-full`}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            <label className="text-xs text-gray-500">Given by<input value={f.given_by} onChange={(e) => setF({ ...f, given_by: e.target.value })} className={`${field} w-full`} /></label>
          </div>
          <label className="text-xs text-gray-500 block">Recover per month (₹, blank = all from next salary)
            <input inputMode="numeric" value={f.recover_per_month} onChange={(e) => setF({ ...f, recover_per_month: e.target.value })} className={`${field} w-full`} />
          </label>
          <label className="text-xs text-gray-500 block">Reason / note<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={`${field} w-full`} placeholder="Medical, rent…" /></label>
          <button type="submit" disabled={busy} className="w-full bg-[#10243E] text-white py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Plus size={16} /> Record advance</button>
        </form>

        {owing.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Still owed</p>
            <ul className="space-y-1.5 text-sm">
              {owing.map((r) => (
                <li key={r.employee_id} className="flex justify-between"><span>{r.full_name}</span><strong className="text-amber-700">{inr(r.advance_balance)}</strong></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#10243E]">Every advance</h2>
          <select value={who} onChange={(e) => setWho(e.target.value)} className={field}>
            <option value="">Everyone</option>
            {current.map((p) => <option key={p.id} value={p.id}>{p.full_name.trim()}</option>)}
          </select>
        </div>
        {shown.length === 0 ? <p className="text-gray-400 text-sm py-6 text-center">No advances recorded.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Person</th><th className="py-2 pr-3">Details</th><th className="py-2 pr-3 text-right">Amount</th><th />
              </tr></thead>
              <tbody>
                {shown.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{fmtDate(a.given_on)}</td>
                    <td className="py-2.5 pr-3">{nameOf(a.employee_id)}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-600">
                      By {a.given_by} · {MODES.find(([v]) => v === a.mode)?.[1]}
                      {a.recover_per_month ? ` · recover ${inr(a.recover_per_month)}/month` : ''}{a.note ? ` · ${a.note}` : ''}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{inr(a.amount)}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => editAmount(a)} title="Correct amount" className="text-gray-400 hover:text-[#f26522] mr-2"><Pencil size={14} /></button>
                      <button onClick={() => remove(a)} title="Delete" className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Salary per person ───────────────────────────────────────────── */

function Rates({ rates, current, nameOf, busy, run }) {
  const [draft, setDraft] = useState({});
  const latest = useMemo(() => {
    const m = {};
    rates.forEach((r) => { if (!m[r.employee_id]) m[r.employee_id] = r; }); // sorted newest first
    return m;
  }, [rates]);

  const save = (p) => run(async () => {
    const d = draft[p.id] || {};
    if (!(num(d.amount) > 0)) throw new Error('Enter the monthly salary.');
    const { error } = await supabase.from('cb_salary_rates').upsert([{
      employee_id: p.id, monthly_amount: num(d.amount), effective_from: d.from || `${thisMonth()}-01`, note: d.note || null,
    }], { onConflict: 'employee_id,effective_from' });
    if (error) throw error;
    setDraft((x) => ({ ...x, [p.id]: {} }));
  }, `Salary saved for ${p.full_name.trim()}.`);

  const remove = (r) => run(async () => {
    if (!window.confirm(`Delete the ${inr(r.monthly_amount)} salary from ${fmtDate(r.effective_from)} for ${nameOf(r.employee_id)}?`)) return false;
    const { error } = await supabase.from('cb_salary_rates').delete().eq('id', r.id);
    if (error) throw error;
  }, 'Salary entry deleted.');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-[#10243E] mb-1">Salary per person</h2>
      <p className="text-xs text-gray-500 mb-4">
        A raise is a new salary from a date — the old one stays, so an earlier month is always paid at the rate that applied then.
      </p>
      <div className="divide-y divide-gray-100">
        {current.map((p) => {
          const cur = latest[p.id];
          const hist = rates.filter((r) => r.employee_id === p.id);
          const d = draft[p.id] || {};
          return (
            <div key={p.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-[#10243E]">{p.full_name.trim()}</p>
                <p className="text-xs text-gray-500">
                  {cur ? `${inr(cur.monthly_amount)} / month from ${fmtDate(cur.effective_from)}` : <span className="text-amber-700">No salary set</span>}
                  {hist.length > 1 && ` · earlier: ${hist.slice(1).map((h) => `${inr(h.monthly_amount)} from ${fmtDate(h.effective_from)}`).join(', ')}`}
                </p>
              </div>
              <input placeholder={cur ? 'New salary ₹' : 'Salary ₹'} inputMode="numeric" value={d.amount || ''}
                onChange={(e) => setDraft((x) => ({ ...x, [p.id]: { ...d, amount: e.target.value } }))} className={`${field} w-28`} />
              <label className="text-[11px] text-gray-500 flex items-center gap-1">from
                <input type="date" value={d.from || `${thisMonth()}-01`} onChange={(e) => setDraft((x) => ({ ...x, [p.id]: { ...d, from: e.target.value } }))} className={field} />
              </label>
              <button onClick={() => save(p)} disabled={busy || !d.amount} className="text-xs px-3 py-1.5 rounded bg-[#10243E] text-white disabled:opacity-30">Save</button>
              {cur && <button onClick={() => remove(cur)} title="Delete the latest salary entry" className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── History ─────────────────────────────────────────────────────── */

function AuditList({ rows, nameOf, run }) {
  const restore = (a) => run(async () => {
    const { error } = await supabase.rpc('cb_expense_restore', { p_audit_id: a.id });
    if (error) throw error;
  }, 'Restored.');
  const sum = (o) => {
    if (!o) return '';
    const amt = o.amount ?? o.monthly_amount ?? o.net_paid;
    const date = o.given_on || o.effective_from || o.month;
    return [nameOf(o.employee_id), amt !== undefined ? inr(amt) : null, date ? fmtDate(date) : null].filter(Boolean).join(' · ');
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1"><History size={18} className="text-[#f26522]" /> Changes &amp; deleted</h2>
      <p className="text-xs text-gray-500 mb-4">Every corrected or deleted salary, advance and payment, with who did it. Nothing here can be edited.</p>
      {rows === null ? <p className="text-gray-400 text-sm">Loading…</p> : rows.length === 0 ? <p className="text-gray-400 text-sm py-6 text-center">No changes yet.</p> : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-start gap-3">
              <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border ${r.action === 'delete' ? (r.restored_at ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-red-50 text-red-700 border-red-200') : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {r.action === 'delete' ? (r.restored_at ? 'Restored' : 'Deleted') : 'Edited'}
              </span>
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm text-[#10243E]"><span className="text-gray-500">{TABLE_LABEL[r.table_name]}:</span> {sum(r.old_row)}{r.action === 'update' && r.new_row ? ` → ${sum(r.new_row)}` : ''}</p>
                <p className="text-[11px] text-gray-400">{format(new Date(r.at), 'd MMM yyyy, HH:mm')} · {r.by_email || 'unknown'}</p>
              </div>
              {r.action === 'delete' && !r.restored_at && (
                <button onClick={() => restore(r)} className="text-xs px-2.5 py-1.5 rounded border border-[#10243E] text-[#10243E] flex items-center gap-1"><Undo2 size={13} /> Restore</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
