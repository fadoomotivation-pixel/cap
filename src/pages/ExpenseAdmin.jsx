import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import { friendlyError } from '../lib/errors';
import { resolveAdmin } from '../lib/admin';
import {
  PAYMENT_MODES, SETTLE_MODES, inr, inrExact, fmtDate, backdatedDays,
  buildExpenseWhatsAppSummary, whatsappLink, downloadCsv,
} from '../lib/expenses';
import {
  Wallet, Banknote, Receipt, PiggyBank, Calculator, Plus, Trash2, Search,
  LogOut, RefreshCw, Send, Copy, X, Calendar, BarChart3, Settings, ClipboardList,
  Repeat, AlertTriangle, CheckCircle, Clock, Users, FileText, ArrowDownToLine,
  Milk, ShoppingCart, Coffee, Droplets, Sparkles, Printer, Package, Car, Wrench,
  Zap, Wifi, HeartHandshake,
  Inbox, Pencil, History, Undo2, EyeOff, Eye,
} from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';

const ICONS = {
  Milk, ShoppingCart, Coffee, Droplets, Sparkles, Printer, Package, Car, Wrench,
  Zap, Wifi, HeartHandshake, Users, Wallet,
};
const CatIcon = ({ name, ...p }) => {
  const Ico = ICONS[name] || Wallet;
  return <Ico {...p} />;
};

const MODE_CLS = {
  cash:   'bg-green-50 text-green-700 border-green-200',
  upi:    'bg-blue-50 text-blue-700 border-blue-200',
  card:   'bg-purple-50 text-purple-700 border-purple-200',
  bank:   'bg-slate-50 text-slate-700 border-slate-200',
  credit: 'bg-amber-50 text-amber-800 border-amber-200',
};
const modeLabel = (v) => PAYMENT_MODES.find((m) => m.value === v)?.label || v;

const today = () => format(new Date(), 'yyyy-MM-dd');
const emptyEntry = () => ({
  spend_date: today(), category_id: '', amount: '', payment_mode: 'cash',
  vendor: '', description: '',
});

export default function ExpenseAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState('daily'); // daily | ledger | monthly | setup | history

  const [position, setPosition] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dueList, setDueList] = useState([]);
  const [dayRows, setDayRows] = useState([]);
  const [date, setDate] = useState(today());

  const [ledger, setLedger] = useState([]);
  const [filters, setFilters] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: today(), category_id: '', payment_mode: '', unpaidOnly: false, search: '',
  });

  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthRows, setMonthRows] = useState([]);
  const [prevMonthRows, setPrevMonthRows] = useState([]);

  const [topups, setTopups] = useState([]);
  const [counts, setCounts] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [settings, setSettings] = useState(null);

  const [entry, setEntry] = useState(emptyEntry());
  const [billFile, setBillFile] = useState(null);
  const [settling, setSettling] = useState(null); // the row being marked paid
  const [editing, setEditing] = useState(null);   // the expense being edited
  const [audit, setAudit] = useState(null);
  const [auditErr, setAuditErr] = useState('');

  // ── auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      resolveAdmin(session, setIsAdmin);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      resolveAdmin(s, setIsAdmin);
    });
    return () => subscription.unsubscribe();
  }, []);

  const flash = (m) => { setOk(m); setTimeout(() => setOk(''), 4000); };
  const fail = (e) => setError(typeof e === 'string' ? e : e?.message || 'Something went wrong.');

  // ── loading ─────────────────────────────────────────────────────────
  const SELECT = '*, category:cb_expense_categories(name, icon)';

  const loadCore = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const [pos, cats, due, day, hr] = await Promise.all([
      supabase.rpc('cb_cash_position'),
      supabase.from('cb_expense_categories').select('*').order('sort_order').order('name'),
      supabase.rpc('cb_recurring_due', { p_date: date }),
      supabase.from('cb_expenses').select(SELECT).eq('spend_date', date).order('created_at', { ascending: false }),
      supabase.from('cb_hr_settings').select('founder_whatsapp').eq('id', 1).maybeSingle(),
    ]);
    if (pos.error) fail(pos.error);
    setPosition(pos.data || null);
    setCategories(cats.data || []);
    setDueList(due.data || []);
    setDayRows(day.data || []);
    setSettings(hr.data || null);
    setBusy(false);
  }, [isAdmin, date]);

  useEffect(() => { loadCore(); }, [loadCore]);

  const loadLedger = useCallback(async () => {
    if (!isAdmin) return;
    let q = supabase.from('cb_expenses').select(SELECT)
      .gte('spend_date', filters.from).lte('spend_date', filters.to)
      .order('spend_date', { ascending: false }).order('created_at', { ascending: false });
    if (filters.category_id) q = q.eq('category_id', filters.category_id);
    if (filters.payment_mode) q = q.eq('payment_mode', filters.payment_mode);
    if (filters.unpaidOnly) q = q.eq('payment_mode', 'credit').eq('is_settled', false);
    const { data, error } = await q;
    if (error) fail(error); else setLedger(data || []);
  }, [isAdmin, filters]);

  useEffect(() => { if (tab === 'ledger') loadLedger(); }, [tab, loadLedger]);

  useEffect(() => {
    if (!isAdmin || tab !== 'monthly') return;
    supabase.rpc('cb_expense_month', { p_month: `${month}-01` })
      .then(({ data, error }) => (error ? fail(error) : setMonthRows(data || [])));
    // Last month beside this one: "₹4,200 on milk" means nothing alone; "up
    // ₹1,100 on last month" is a question somebody can answer.
    const prev = format(new Date(parseISO(`${month}-01`).getFullYear(), parseISO(`${month}-01`).getMonth() - 1, 1), 'yyyy-MM-dd');
    supabase.rpc('cb_expense_month', { p_month: prev })
      .then(({ data }) => setPrevMonthRows(data || []));
  }, [isAdmin, tab, month]);

  const loadAudit = useCallback(async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase.from('cb_expense_audit')
      .select('*').in('table_name', ['cb_expenses', 'cb_expense_topups', 'cb_cash_counts'])
      .order('at', { ascending: false }).limit(200);
    if (error) { setAuditErr('The change history switches on once the petty-cash SQL (cb_expense_audit.sql) has been run.'); setAudit([]); return; }
    setAuditErr(''); setAudit(data || []);
  }, [isAdmin]);
  useEffect(() => { if (tab === 'history') loadAudit(); }, [tab, loadAudit]);

  const loadSetup = useCallback(async () => {
    if (!isAdmin) return;
    const [t, c, r] = await Promise.all([
      supabase.from('cb_expense_topups').select('*').order('topup_date', { ascending: false }).limit(50),
      supabase.from('cb_cash_counts').select('*').order('count_date', { ascending: false }).limit(20),
      supabase.from('cb_expense_recurring').select('*, category:cb_expense_categories(name, icon)').order('label'),
    ]);
    setTopups(t.data || []); setCounts(c.data || []); setRecurring(r.data || []);
  }, [isAdmin]);

  useEffect(() => { if (tab === 'setup') loadSetup(); }, [tab, loadSetup]);

  // ── bills ───────────────────────────────────────────────────────────
  const uploadBill = async (file) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${format(new Date(), 'yyyy/MM')}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('expense-bills')
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    return path;
  };

  // The bucket is private, so a bill is opened through a short-lived signed
  // URL rather than a public link that could be forwarded.
  const openBill = async (path) => {
    const { data, error } = await supabase.storage.from('expense-bills').createSignedUrl(path, 120);
    if (error) return fail(error);
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  // ── writes ──────────────────────────────────────────────────────────
  const addExpense = async (e, preset) => {
    e?.preventDefault?.();
    setError('');
    const src = preset || entry;
    if (!src.category_id) return fail('Pick a category.');
    if (!(Number(src.amount) > 0)) return fail('Enter an amount greater than zero.');

    setBusy(true);
    try {
      let bill_url = null;
      if (!preset && billFile) bill_url = await uploadBill(billFile);
      const { error } = await supabase.from('cb_expenses').insert([{
        spend_date: src.spend_date || date,
        category_id: src.category_id,
        amount: Number(src.amount),
        payment_mode: src.payment_mode,
        vendor: src.vendor || null,
        description: src.description || null,
        recurring_id: src.recurring_id || null,
        bill_url,
        created_by: session.user.id,
        created_by_email: session.user.email,
      }]);
      if (error) throw error;
      setEntry({ ...emptyEntry(), spend_date: src.spend_date || date });
      setBillFile(null);
      flash(`${inr(src.amount)} recorded.`);
      await loadCore();
      if (tab === 'ledger') loadLedger();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  // Deleting no longer removes the bill photo: every delete is recorded in
  // cb_expense_audit and can be restored, and a restored entry must come back
  // with its bill.
  const deleteExpense = async (row) => {
    if (!window.confirm(
      `Delete this ${inr(row.amount)} entry (${row.vendor || row.category?.name || 'expense'}, ${fmtDate(row.spend_date)})?\n\nThe cash balance goes back up by this amount. If the money was actually spent, use Edit instead.\n\nThe delete is recorded under "Changes & deleted" and can be undone there.`
    )) return;
    setBusy(true);
    const { error } = await supabase.from('cb_expenses').delete().eq('id', row.id);
    setBusy(false);
    if (error) return fail(error);
    flash('Entry deleted. Undo it from "Changes & deleted" if that was a mistake.');
    loadCore(); if (tab === 'ledger') loadLedger();
  };

  const saveEdit = async (row, patch, newBill) => {
    setBusy(true);
    try {
      const p = { ...patch, amount: Number(patch.amount) };
      if (!(p.amount > 0)) throw new Error('Enter an amount greater than zero.');
      if (newBill) p.bill_url = await uploadBill(newBill);
      // Changing away from credit makes it an ordinary paid spend.
      if (p.payment_mode !== 'credit') { p.is_settled = false; p.settled_on = null; p.settled_mode = null; }
      const { error } = await supabase.from('cb_expenses').update(p).eq('id', row.id);
      if (error) throw error;
      setEditing(null);
      flash('Entry updated. The old version is kept under "Changes & deleted".');
      loadCore(); if (tab === 'ledger') loadLedger();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const deleteTopup = async (t) => {
    if (!window.confirm(`Delete the ${inr(t.amount)} float from ${fmtDate(t.topup_date)}?\n\nCash in hand drops by this amount if it was cash. Recorded under "Changes & deleted".`)) return;
    const { error } = await supabase.from('cb_expense_topups').delete().eq('id', t.id);
    if (error) return fail(error);
    flash('Float entry deleted.'); loadCore(); loadSetup();
  };

  const editTopup = async (t) => {
    const v = window.prompt(`Correct the amount for the float on ${fmtDate(t.topup_date)}:`, String(Number(t.amount)));
    if (v === null) return;
    const amount = Number(v);
    if (!(amount > 0)) return fail('Enter an amount greater than zero.');
    const { error } = await supabase.from('cb_expense_topups').update({ amount }).eq('id', t.id);
    if (error) return fail(error);
    flash('Float corrected.'); loadCore(); loadSetup();
  };

  const deleteCount = async (c) => {
    if (!window.confirm(`Delete the cash count of ${inr(c.counted_amount)} on ${fmtDate(c.count_date)}?`)) return;
    const { error } = await supabase.from('cb_cash_counts').delete().eq('id', c.id);
    if (error) return fail(error);
    flash('Cash count deleted.'); loadCore(); loadSetup();
  };

  const renameCategory = async (cat) => {
    const name = window.prompt('Rename category:', cat.name);
    if (!name || !name.trim() || name.trim() === cat.name) return;
    const { error } = await supabase.from('cb_expense_categories').update({ name: name.trim() }).eq('id', cat.id);
    if (error) return fail(error);
    setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, name: name.trim() } : c)));
  };

  // Hidden, never deleted: past spends point at it, and a category that
  // vanished would leave old entries reading "—".
  const toggleCategory = async (cat) => {
    const { error } = await supabase.from('cb_expense_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (error) return fail(error);
    setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, is_active: !cat.is_active } : c)));
  };

  const editRecurringAmount = async (r) => {
    const v = window.prompt(`Usual amount for "${r.label}":`, String(Number(r.default_amount)));
    if (v === null) return;
    const amount = Number(v);
    if (!(amount > 0)) return fail('Enter an amount greater than zero.');
    const { error } = await supabase.from('cb_expense_recurring').update({ default_amount: amount }).eq('id', r.id);
    if (error) return fail(error);
    flash('Usual amount updated.'); loadCore(); loadSetup();
  };

  const restore = async (a) => {
    const { error } = await supabase.rpc('cb_expense_restore', { p_audit_id: a.id });
    if (error) return fail(error);
    flash('Entry restored.'); loadAudit(); loadCore();
  };

  const settleDue = async (row, mode) => {
    setBusy(true);
    const { error } = await supabase.from('cb_expenses')
      .update({ is_settled: true, settled_on: today(), settled_mode: mode })
      .eq('id', row.id);
    setBusy(false); setSettling(null);
    if (error) return fail(error);
    flash(`${row.vendor || 'Vendor'} marked paid — ${inr(row.amount)}.`);
    loadCore(); if (tab === 'ledger') loadLedger();
  };

  const addTopup = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    setBusy(true);
    const { error } = await supabase.from('cb_expense_topups').insert([{
      topup_date: f.get('topup_date'),
      amount: Number(f.get('amount')),
      source: f.get('source'),
      given_by: f.get('given_by') || null,
      note: f.get('note') || null,
      created_by: session.user.id,
      created_by_email: session.user.email,
    }]);
    setBusy(false);
    if (error) return fail(error);
    e.target.reset();
    flash('Float recorded.');
    loadCore(); loadSetup();
  };

  const addCount = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    setBusy(true);
    const { error } = await supabase.from('cb_cash_counts').insert([{
      count_date: f.get('count_date'),
      counted_amount: Number(f.get('counted_amount')),
      expected_amount: Number(position?.cash_in_hand || 0),
      note: f.get('note') || null,
      created_by: session.user.id,
      created_by_email: session.user.email,
    }]);
    setBusy(false);
    if (error) return fail(error);
    e.target.reset();
    flash('Cash count saved.');
    loadCore(); loadSetup();
  };

  const saveBudget = async (cat, value) => {
    const budget = value === '' ? null : Number(value);
    const { error } = await supabase.from('cb_expense_categories')
      .update({ monthly_budget: budget }).eq('id', cat.id);
    if (error) return fail(error);
    setCategories((cs) => cs.map((c) => (c.id === cat.id ? { ...c, monthly_budget: budget } : c)));
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from('cb_expense_categories').insert([{
      name: f.get('name'),
      monthly_budget: f.get('monthly_budget') ? Number(f.get('monthly_budget')) : null,
    }]);
    if (error) return fail(error);
    e.target.reset(); flash('Category added.'); loadCore();
  };

  const addRecurring = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from('cb_expense_recurring').insert([{
      label: f.get('label'),
      category_id: f.get('category_id'),
      default_amount: Number(f.get('default_amount')),
      vendor: f.get('vendor') || null,
      frequency: f.get('frequency'),
      payment_mode: f.get('payment_mode'),
      skip_weekends: f.get('skip_weekends') === 'on',
    }]);
    if (error) return fail(error);
    e.target.reset(); flash('Recurring item added.'); loadCore(); loadSetup();
  };

  const toggleRecurring = async (r) => {
    const { error } = await supabase.from('cb_expense_recurring')
      .update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) return fail(error);
    loadCore(); loadSetup();
  };

  const deleteRecurring = async (r) => {
    if (!window.confirm(`Remove "${r.label}" from recurring items?\n\nEntries already logged from it are kept.`)) return;
    const { error } = await supabase.from('cb_expense_recurring').delete().eq('id', r.id);
    if (error) return fail(error);
    flash('Recurring item removed.'); loadCore(); loadSetup();
  };

  // ── derived ─────────────────────────────────────────────────────────
  const dayTotal = useMemo(
    () => dayRows.reduce((s, r) => s + Number(r.amount), 0), [dayRows]
  );
  const pending = useMemo(() => dueList.filter((d) => !d.already_logged), [dueList]);

  const filteredLedger = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return ledger;
    return ledger.filter((r) =>
      [r.vendor, r.description, r.category?.name].filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [ledger, filters.search]);

  const ledgerTotal = useMemo(
    () => filteredLedger.reduce((s, r) => s + Number(r.amount), 0), [filteredLedger]
  );

  const monthSpent = useMemo(
    () => monthRows.reduce((s, r) => s + Number(r.spent), 0), [monthRows]
  );

  const summaryText = useMemo(() => buildExpenseWhatsAppSummary({
    position,
    categories: monthRows.length ? monthRows : [],
    monthLabel: format(parseISO(`${month}-01`), 'MMMM yyyy'),
    todayTotal: month === format(new Date(), 'yyyy-MM') ? dayTotal : 0,
    asOn: format(new Date(), 'd MMM'),
  }), [position, monthRows, month, dayTotal]);

  const variance = position
    ? Number(position.last_count_variance ?? 0) : 0;

  // ── gate ────────────────────────────────────────────────────────────
  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Petty Cash Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised for HR access.</div>}
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(friendlyError(error)); }} className="space-y-4">
            <input type="email" required placeholder="HR Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <PasswordInput required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d]">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]';

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Petty Cash</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadCore} disabled={busy} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
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

        {/* Cash position — the number HR is answerable for */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat accent icon={<Wallet size={20} />} label="Cash in hand" value={inr(position?.cash_in_hand)} />
          <Stat icon={<PiggyBank size={20} />} label="Float received" value={inr(position?.topups_cash)} />
          <Stat icon={<Banknote size={20} />} label="Cash spent" value={inr(position?.spent_cash)} />
          <Stat icon={<Receipt size={20} />} label={`Unpaid dues${position?.unsettled_dues_count ? ` (${position.unsettled_dues_count})` : ''}`}
            value={inr(position?.unsettled_dues)} warn={Number(position?.unsettled_dues) > 0} />
        </div>

        {position?.last_count_date && variance !== 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-900">
              Last cash count on {fmtDate(position.last_count_date)} was{' '}
              <strong>{variance > 0 ? `${inr(variance)} more` : `${inr(Math.abs(variance))} short`}</strong> than the register expected.
              Find the missing entry, or record a correcting one — don&apos;t let it roll forward.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {[['daily', 'Daily Entry', Calendar], ['ledger', 'Ledger', ClipboardList], ['monthly', 'Monthly Report', BarChart3], ['setup', 'Cash & Setup', Settings], ['history', 'Changes & deleted', History]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                tab === key ? 'border-[#f26522] text-[#f26522]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* ══ DAILY ══ */}
        {tab === 'daily' && (
          <div className="space-y-6">

            {/* Recurring items still to be entered */}
            {pending.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-[#10243E] flex items-center gap-2 mb-1">
                  <Repeat size={18} className="text-[#f26522]" /> Not entered yet for {fmtDate(date)}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  One tap logs it at the usual amount. Tap it once — an item already entered disappears from here.
                </p>
                <div className="flex flex-wrap gap-2">
                  {pending.map((d) => (
                    <button key={d.id} disabled={busy}
                      onClick={() => addExpense(null, {
                        spend_date: date, category_id: d.category_id, amount: d.default_amount,
                        payment_mode: d.payment_mode, vendor: d.vendor, description: d.label,
                        recurring_id: d.id,
                      })}
                      className="flex items-center gap-2 border border-gray-200 hover:border-[#f26522] hover:bg-orange-50 rounded-lg px-3 py-2 text-sm transition disabled:opacity-50">
                      <Plus size={14} className="text-[#f26522]" />
                      <span className="text-[#10243E] font-medium">{d.label}</span>
                      <span className="text-gray-500">{inr(d.default_amount)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick add */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-[#10243E] mb-4">Add an expense</h2>
              <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label>
                  <span className="block text-xs text-gray-500 mb-1">Date</span>
                  <input type="date" max={today()} value={entry.spend_date}
                    onChange={(e) => setEntry({ ...entry, spend_date: e.target.value })} className={inputCls} />
                </label>
                <label>
                  <span className="block text-xs text-gray-500 mb-1">Category *</span>
                  <select required value={entry.category_id}
                    onChange={(e) => setEntry({ ...entry, category_id: e.target.value })} className={inputCls}>
                    <option value="">Select…</option>
                    {categories.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="block text-xs text-gray-500 mb-1">Amount (₹) *</span>
                  <input type="number" min="1" step="1" required inputMode="numeric" value={entry.amount}
                    onChange={(e) => setEntry({ ...entry, amount: e.target.value })} className={inputCls} placeholder="60" />
                </label>
                <label>
                  <span className="block text-xs text-gray-500 mb-1">Paid by</span>
                  <select value={entry.payment_mode}
                    onChange={(e) => setEntry({ ...entry, payment_mode: e.target.value })} className={inputCls}>
                    {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="block text-xs text-gray-500 mb-1">Vendor / shop</span>
                  <input value={entry.vendor} onChange={(e) => setEntry({ ...entry, vendor: e.target.value })}
                    className={inputCls} placeholder="Amul dairy" />
                </label>
                <label>
                  <span className="block text-xs text-gray-500 mb-1">What was it for</span>
                  <input value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })}
                    className={inputCls} placeholder="2 litre milk" />
                </label>
                <label className="sm:col-span-2">
                  <span className="block text-xs text-gray-500 mb-1">Bill photo (optional)</span>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*,application/pdf" capture="environment"
                      onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                      className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-orange-50 file:text-[#f26522] file:text-sm file:font-medium" />
                    {billFile && <button type="button" onClick={() => setBillFile(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>}
                  </div>
                </label>
                <div className="flex items-end">
                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center gap-2 bg-[#f26522] text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-orange-600 disabled:opacity-50">
                    {busy ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Add expense
                  </button>
                </div>
              </form>
              {entry.payment_mode === 'credit' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                  On credit means the money has not left the office yet — it will show under unpaid dues,
                  and cash in hand only drops when you mark it paid.
                </p>
              )}
            </div>

            {/* Entries for the day */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#10243E]">
                  {date === today() ? "Today's entries" : `Entries — ${fmtDate(date)}`}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Total <strong className="text-[#10243E]">{inr(dayTotal)}</strong></span>
                  <input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' w-auto'} />
                </div>
              </div>
              <EntryTable rows={dayRows} onEdit={setEditing} onDelete={deleteExpense} onBill={openBill} onSettle={setSettling} />
            </div>
          </div>
        )}

        {/* ══ LEDGER ══ */}
        {tab === 'ledger' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-[#10243E]">
                Ledger <span className="text-sm font-normal text-gray-500">— {filteredLedger.length} entries, {inr(ledgerTotal)}</span>
              </h2>
              <button onClick={() => downloadCsv([
                ['Date', 'Category', 'Amount', 'Paid by', 'Vendor', 'Description', 'Status', 'Settled on', 'Entered by', 'Entered at'],
                ...filteredLedger.map((r) => [
                  r.spend_date, r.category?.name, Number(r.amount).toFixed(2), modeLabel(r.payment_mode),
                  r.vendor, r.description,
                  r.payment_mode === 'credit' ? (r.is_settled ? 'Paid' : 'UNPAID') : 'Paid',
                  r.settled_on || '', r.created_by_email || '',
                  r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd HH:mm') : '',
                ]),
              ], `capital-brix-expenses-${filters.from}-to-${filters.to}.csv`)}
                disabled={!filteredLedger.length}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50">
                <ArrowDownToLine size={16} /> CSV
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
              <label><span className="block text-xs text-gray-500 mb-1">From</span>
                <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className={inputCls} /></label>
              <label><span className="block text-xs text-gray-500 mb-1">To</span>
                <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className={inputCls} /></label>
              <label><span className="block text-xs text-gray-500 mb-1">Category</span>
                <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className={inputCls}>
                  <option value="">All</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
              <label><span className="block text-xs text-gray-500 mb-1">Paid by</span>
                <select value={filters.payment_mode} onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value, unpaidOnly: false })} className={inputCls}>
                  <option value="">All</option>
                  {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select></label>
              <label className="lg:col-span-1"><span className="block text-xs text-gray-500 mb-1">Search</span>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Vendor / note" className={inputCls + ' pl-8'} />
                </div></label>
              <label className="flex items-end pb-2">
                <span className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={filters.unpaidOnly}
                    onChange={(e) => setFilters({ ...filters, unpaidOnly: e.target.checked, payment_mode: '' })}
                    className="w-4 h-4 accent-[#f26522]" />
                  Unpaid dues only
                </span>
              </label>
            </div>

            <EntryTable rows={filteredLedger} showDate onEdit={setEditing} onDelete={deleteExpense} onBill={openBill} onSettle={setSettling} />
          </div>
        )}

        {/* ══ MONTHLY ══ */}
        {tab === 'monthly' && (
          <div className="space-y-6">
            <div className="bg-[#10243E] text-white rounded-xl p-6">
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Send size={18} className="text-[#f26522]" /> Money Report to Founder
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    Cash position, where it went, and anything over budget — already written out.
                    {!settings?.founder_whatsapp && ' Add the founder\'s number in Attendance → Settings to skip picking a contact.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(summaryText); flash('Summary copied.'); }}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm">
                    <Copy size={16} /> Copy
                  </button>
                  <a href={whatsappLink(settings?.founder_whatsapp, summaryText)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-semibold">
                    <Send size={16} /> Send on WhatsApp
                  </a>
                </div>
              </div>
              <pre className="mt-4 bg-black/20 rounded-lg p-4 text-xs text-white/80 whitespace-pre-wrap max-h-64 overflow-y-auto font-sans">{summaryText}</pre>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-[#10243E]">
                  Spend by category <span className="text-sm font-normal text-gray-500">— {inr(monthSpent)}</span>
                </h2>
                <div className="flex gap-2">
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls + ' w-auto'} />
                  <button onClick={() => downloadCsv([
                    ['Category', 'Spent', 'Budget', 'Remaining', 'Entries'],
                    ...monthRows.map((r) => [
                      r.category_name, Number(r.spent).toFixed(2),
                      r.monthly_budget ?? '', r.monthly_budget ? (Number(r.monthly_budget) - Number(r.spent)).toFixed(2) : '',
                      r.txn_count,
                    ]),
                    ['TOTAL', monthSpent.toFixed(2), '', '', ''],
                  ], `capital-brix-expenses-${month}.csv`)}
                    disabled={!monthRows.length}
                    className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50">
                    <ArrowDownToLine size={16} /> CSV
                  </button>
                </div>
              </div>

              {monthRows.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">Nothing spent in this month yet.</p>}

              <div className="space-y-4">
                {monthRows.map((r) => {
                  const spent = Number(r.spent);
                  const budget = r.monthly_budget ? Number(r.monthly_budget) : null;
                  const pct = budget ? Math.min(100, (spent / budget) * 100) : null;
                  const over = budget && spent > budget;
                  const prevRow = prevMonthRows.find((p) => p.category_id === r.category_id);
                  const delta = prevRow ? spent - Number(prevRow.spent) : null;
                  return (
                    <div key={r.category_id}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="flex items-center gap-2 text-sm text-[#10243E] font-medium">
                          <CatIcon name={r.icon} size={16} className="text-[#f26522]" />
                          {r.category_name}
                          <span className="text-gray-400 font-normal">({r.txn_count})</span>
                        </span>
                        <span className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-[#10243E]'}`}>
                          {inr(spent)}{budget ? <span className="text-gray-400 font-normal"> / {inr(budget)}</span> : null}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-[#f26522]'}`}
                          style={{ width: `${budget ? pct : Math.min(100, monthSpent ? (spent / monthSpent) * 100 : 0)}%` }} />
                      </div>
                      {over && (
                        <p className="text-xs text-red-600 mt-1">
                          Over budget by {inr(spent - budget)}.
                        </p>
                      )}
                      {delta !== null && Math.abs(delta) >= 1 && Number(prevRow.spent) > 0 && (
                        <p className={`text-xs mt-1 ${delta > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                          {delta > 0 ? '▲' : '▼'} {inr(Math.abs(delta))} {delta > 0 ? 'more' : 'less'} than last month ({inr(prevRow.spent)})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab === 'history' && (
          <AuditView rows={audit} err={auditErr} categories={categories} onRestore={restore} onReload={loadAudit} />
        )}

        {/* ══ SETUP ══ */}
        {tab === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Float */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1">
                <PiggyBank size={18} className="text-[#f26522]" /> Cash given to HR
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Record it here every time the office hands over cash. Cash in hand is float minus spends,
                so a missing entry here makes every later balance wrong.
              </p>
              <form onSubmit={addTopup} className="grid grid-cols-2 gap-3 mb-5">
                <label><span className="block text-xs text-gray-500 mb-1">Date</span>
                  <input name="topup_date" type="date" required defaultValue={today()} max={today()} className={inputCls} /></label>
                <label><span className="block text-xs text-gray-500 mb-1">Amount (₹)</span>
                  <input name="amount" type="number" min="1" step="1" required inputMode="numeric" className={inputCls} placeholder="10000" /></label>
                <label><span className="block text-xs text-gray-500 mb-1">Received as</span>
                  <select name="source" className={inputCls}>
                    <option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option>
                  </select></label>
                <label><span className="block text-xs text-gray-500 mb-1">Given by</span>
                  <input name="given_by" className={inputCls} placeholder="Name" /></label>
                <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Note</span>
                  <input name="note" className={inputCls} placeholder="Monthly float" /></label>
                <button type="submit" disabled={busy}
                  className="col-span-2 flex items-center justify-center gap-2 bg-[#10243E] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-[#1a365d] disabled:opacity-50">
                  <Plus size={16} /> Record float
                </button>
              </form>
              <ul className="space-y-2 max-h-56 overflow-y-auto text-sm">
                {topups.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3 border-b border-gray-50 pb-2">
                    <span className="text-gray-600">{fmtDate(t.topup_date)} · {t.source}{t.given_by ? ` · ${t.given_by}` : ''}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <strong className="text-[#10243E]">{inr(t.amount)}</strong>
                      <button onClick={() => editTopup(t)} title="Correct amount" className="text-gray-400 hover:text-[#f26522]"><Pencil size={14} /></button>
                      <button onClick={() => deleteTopup(t)} title="Delete" className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </span>
                  </li>
                ))}
                {!topups.length && <li className="text-gray-400 text-center py-4">No float recorded yet.</li>}
              </ul>
            </div>

            {/* Cash count */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1">
                <Calculator size={18} className="text-[#f26522]" /> Count the cash
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Count the notes physically and enter the figure. The register says there should be{' '}
                <strong className="text-[#10243E]">{inr(position?.cash_in_hand)}</strong> — any gap is caught the same day
                instead of at month end.
              </p>
              <form onSubmit={addCount} className="grid grid-cols-2 gap-3 mb-5">
                <label><span className="block text-xs text-gray-500 mb-1">Date</span>
                  <input name="count_date" type="date" required defaultValue={today()} max={today()} className={inputCls} /></label>
                <label><span className="block text-xs text-gray-500 mb-1">Counted (₹)</span>
                  <input name="counted_amount" type="number" min="0" step="1" required inputMode="numeric" className={inputCls} /></label>
                <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Note</span>
                  <input name="note" className={inputCls} placeholder="Optional" /></label>
                <button type="submit" disabled={busy}
                  className="col-span-2 flex items-center justify-center gap-2 bg-[#10243E] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-[#1a365d] disabled:opacity-50">
                  <CheckCircle size={16} /> Save count
                </button>
              </form>
              <ul className="space-y-2 max-h-56 overflow-y-auto text-sm">
                {counts.map((c) => {
                  const v = Number(c.variance);
                  return (
                    <li key={c.id} className="flex justify-between gap-3 border-b border-gray-50 pb-2">
                      <span className="text-gray-600">{fmtDate(c.count_date)} · counted {inr(c.counted_amount)}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <strong className={v === 0 ? 'text-green-600' : 'text-red-600'}>
                          {v === 0 ? 'Tallied' : v > 0 ? `+${inr(v)}` : `−${inr(Math.abs(v))}`}
                        </strong>
                        <button onClick={() => deleteCount(c)} title="Delete" className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </span>
                    </li>
                  );
                })}
                {!counts.length && <li className="text-gray-400 text-center py-4">Never counted.</li>}
              </ul>
            </div>

            {/* Recurring */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1">
                <Repeat size={18} className="text-[#f26522]" /> Recurring items
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Things bought on a rhythm — milk every day, water cans weekly, internet monthly.
                These show up on the Daily Entry tab as one-tap buttons until they are logged.
              </p>
              <form onSubmit={addRecurring} className="grid grid-cols-2 gap-3 mb-5">
                <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Label</span>
                  <input name="label" required className={inputCls} placeholder="Daily milk — 2 litre" /></label>
                <label><span className="block text-xs text-gray-500 mb-1">Category</span>
                  <select name="category_id" required className={inputCls}>
                    {categories.filter((c) => c.is_active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></label>
                <label><span className="block text-xs text-gray-500 mb-1">Usual amount (₹)</span>
                  <input name="default_amount" type="number" min="1" step="1" required inputMode="numeric" className={inputCls} placeholder="60" /></label>
                <label><span className="block text-xs text-gray-500 mb-1">Frequency</span>
                  <select name="frequency" className={inputCls}>
                    <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  </select></label>
                <label><span className="block text-xs text-gray-500 mb-1">Paid by</span>
                  <select name="payment_mode" className={inputCls}>
                    {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select></label>
                <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Vendor</span>
                  <input name="vendor" className={inputCls} placeholder="Amul dairy" /></label>
                <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
                  <input name="skip_weekends" type="checkbox" className="w-4 h-4 accent-[#f26522]" /> Skip Saturdays and Sundays
                </label>
                <button type="submit"
                  className="col-span-2 flex items-center justify-center gap-2 bg-[#10243E] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-[#1a365d]">
                  <Plus size={16} /> Add recurring item
                </button>
              </form>
              <ul className="space-y-2 text-sm">
                {recurring.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2">
                    <span className={r.is_active ? 'text-[#10243E]' : 'text-gray-400 line-through'}>
                      {r.label} · {inr(r.default_amount)} · {r.frequency}
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <button onClick={() => editRecurringAmount(r)} title="Change usual amount" className="text-gray-400 hover:text-[#f26522]"><Pencil size={14} /></button>
                      <button onClick={() => toggleRecurring(r)} className="text-xs text-gray-500 hover:text-[#f26522]">
                        {r.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={() => deleteRecurring(r)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </span>
                  </li>
                ))}
                {!recurring.length && <li className="text-gray-400 text-center py-4">No recurring items yet.</li>}
              </ul>
            </div>

            {/* Categories & budgets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#10243E] flex items-center gap-2 mb-1">
                <BarChart3 size={18} className="text-[#f26522]" /> Categories &amp; monthly budgets
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                A budget is optional. Where you set one, the monthly report turns red the moment it is crossed.
              </p>
              <form onSubmit={addCategory} className="flex gap-2 mb-5">
                <input name="name" required placeholder="New category" className={inputCls} />
                <input name="monthly_budget" type="number" min="0" step="1" placeholder="Budget ₹" className={inputCls + ' w-32'} />
                <button type="submit" className="bg-[#10243E] text-white px-4 rounded-md text-sm font-semibold hover:bg-[#1a365d] shrink-0">
                  <Plus size={16} />
                </button>
              </form>
              <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <span className={`flex items-center gap-2 ${c.is_active ? 'text-[#10243E]' : 'text-gray-400 line-through'}`}>
                      <CatIcon name={c.icon} size={15} className="text-gray-400" /> {c.name}
                      <button onClick={() => renameCategory(c)} title="Rename" className="text-gray-300 hover:text-[#f26522]"><Pencil size={13} /></button>
                      <button onClick={() => toggleCategory(c)} title={c.is_active ? 'Hide from the entry form' : 'Show again'} className="text-gray-300 hover:text-[#f26522]">
                        {c.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </span>
                    <input type="number" min="0" step="1" placeholder="No budget"
                      defaultValue={c.monthly_budget ?? ''}
                      onBlur={(e) => saveBudget(c, e.target.value)}
                      className="w-28 border border-gray-200 rounded-md px-2 py-1 text-sm text-right outline-none focus:border-[#f26522]" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditExpense row={editing} categories={categories} busy={busy}
          onCancel={() => setEditing(null)} onSave={saveEdit} />
      )}

      {/* Settle a credit due */}
      {settling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSettling(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#10243E] mb-1">Mark as paid</h3>
            <p className="text-sm text-gray-500 mb-4">
              {settling.vendor || settling.category?.name} — <strong className="text-[#10243E]">{inrExact(settling.amount)}</strong>,
              taken on credit on {fmtDate(settling.spend_date)}. How was it paid?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SETTLE_MODES.map((m) => (
                <button key={m.value} disabled={busy} onClick={() => settleDue(settling, m.value)}
                  className="border border-gray-200 rounded-md px-3 py-2.5 text-sm hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50">
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Paying in cash reduces cash in hand today; the other modes do not.
            </p>
            <button onClick={() => setSettling(null)} className="w-full text-gray-500 text-sm mt-3 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryTable({ rows, showDate, onEdit, onDelete, onBill, onSettle }) {
  if (!rows.length) return <p className="text-gray-400 text-sm py-8 text-center">Nothing recorded here yet.</p>;
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
            {showDate && <th className="py-2 pr-3">Date</th>}
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Details</th>
            <th className="py-2 pr-3">Paid by</th>
            <th className="py-2 pr-3 text-right">Amount</th>
            <th className="py-2 pl-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const late = backdatedDays(r);
            const unpaid = r.payment_mode === 'credit' && !r.is_settled;
            return (
              <tr key={r.id} className="border-b border-gray-50 last:border-0">
                {showDate && <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{fmtDate(r.spend_date)}</td>}
                <td className="py-3 pr-3">
                  <span className="flex items-center gap-2 text-[#10243E]">
                    <CatIcon name={r.category?.icon} size={15} className="text-[#f26522] shrink-0" />
                    {r.category?.name || '—'}
                  </span>
                </td>
                <td className="py-3 pr-3 text-gray-600">
                  {r.vendor && <span className="text-[#10243E]">{r.vendor}</span>}
                  {r.vendor && r.description ? ' · ' : ''}
                  {r.description}
                  {!r.vendor && !r.description && '—'}
                  {late >= 2 && (
                    <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                      entered {late}d later
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  <span className={`inline-block text-xs border rounded px-2 py-0.5 whitespace-nowrap ${MODE_CLS[r.payment_mode]}`}>
                    {unpaid ? 'Unpaid' : modeLabel(r.payment_mode)}
                  </span>
                </td>
                <td className="py-3 pr-3 text-right font-semibold text-[#10243E] whitespace-nowrap">{inr(r.amount)}</td>
                <td className="py-3 pl-3">
                  <div className="flex items-center gap-3 justify-end">
                    {unpaid && (
                      <button onClick={() => onSettle(r)} className="text-xs font-medium text-green-700 hover:underline whitespace-nowrap">
                        Mark paid
                      </button>
                    )}
                    {r.bill_url && (
                      <button onClick={() => onBill(r.bill_url)} title="View bill" className="text-gray-400 hover:text-[#f26522]">
                        <FileText size={15} />
                      </button>
                    )}
                    <button onClick={() => onEdit(r)} title="Edit" className="text-gray-400 hover:text-[#f26522]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(r)} title="Delete" className="text-gray-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ icon, label, value, accent, warn }) {
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${accent ? 'bg-[#10243E] border-[#10243E] text-white' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
        accent ? 'bg-white/10 text-[#f26522]' : warn ? 'bg-amber-50 text-amber-600' : 'bg-orange-50 text-[#f26522]'
      }`}>{icon}</div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : warn ? 'text-amber-700' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

/** Correct an entry in place. The previous version is kept by the audit trigger. */
function EditExpense({ row, categories, busy, onCancel, onSave }) {
  const [f, setF] = useState({
    spend_date: row.spend_date, category_id: row.category_id, amount: String(Number(row.amount)),
    payment_mode: row.payment_mode, vendor: row.vendor || '', description: row.description || '',
  });
  const [bill, setBill] = useState(null);
  const cls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#10243E] mb-4">Edit entry</h3>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="block text-xs text-gray-500 mb-1">Date</span>
            <input type="date" max={today()} value={f.spend_date} onChange={(e) => setF({ ...f, spend_date: e.target.value })} className={cls} /></label>
          <label><span className="block text-xs text-gray-500 mb-1">Amount (₹)</span>
            <input type="number" min="1" step="1" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={cls} /></label>
          <label><span className="block text-xs text-gray-500 mb-1">Category</span>
            <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} className={cls}>
              {categories.filter((c) => c.is_active || c.id === row.category_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label><span className="block text-xs text-gray-500 mb-1">Paid by</span>
            <select value={f.payment_mode} onChange={(e) => setF({ ...f, payment_mode: e.target.value })} className={cls}>
              {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></label>
          <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">Vendor / shop</span>
            <input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className={cls} /></label>
          <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">What was it for</span>
            <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={cls} /></label>
          <label className="col-span-2"><span className="block text-xs text-gray-500 mb-1">{row.bill_url ? 'Replace bill photo (optional)' : 'Add bill photo (optional)'}</span>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setBill(e.target.files?.[0] || null)} className="text-sm text-gray-600" /></label>
        </div>
        <p className="text-xs text-gray-400 mt-3">The previous version is kept under “Changes &amp; deleted”.</p>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 border border-gray-200 rounded-md py-2.5 text-sm text-gray-600">Cancel</button>
          <button disabled={busy}
            onClick={() => onSave(row, {
              spend_date: f.spend_date, category_id: f.category_id, amount: f.amount, payment_mode: f.payment_mode,
              vendor: f.vendor.trim() || null, description: f.description.trim() || null,
            }, bill)}
            className="flex-1 bg-[#f26522] text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-50">Save changes</button>
        </div>
      </div>
    </div>
  );
}

const AUDIT_TABLE = { cb_expenses: 'Expense', cb_expense_topups: 'Float', cb_cash_counts: 'Cash count' };
const AUDIT_FIELDS = {
  spend_date: 'date', topup_date: 'date', count_date: 'date', amount: 'amount', counted_amount: 'counted',
  category_id: 'category', payment_mode: 'paid by', vendor: 'vendor', description: 'description',
  is_settled: 'paid', settled_mode: 'paid via', source: 'received as', given_by: 'given by', note: 'note', bill_url: 'bill',
};

/**
 * Every edit and delete in petty cash, newest first. Read-only: only the
 * database trigger writes here, so nobody can tidy the trail. A deleted entry
 * has Restore.
 */
function AuditView({ rows, err, categories, onRestore, onReload }) {
  const catName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const show = (k, v) => {
    if (v === null || v === undefined || v === '') return '—';
    if (k === 'category_id') return catName(v);
    if (k === 'amount' || k === 'counted_amount') return inr(v);
    if (k === 'payment_mode' || k === 'settled_mode') return modeLabel(v);
    if (k === 'bill_url') return 'photo';
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    return String(v);
  };
  const summary = (r) => {
    const o = r.old_row || {};
    const amt = o.amount ?? o.counted_amount;
    const date = o.spend_date || o.topup_date || o.count_date;
    return [amt !== undefined ? inr(amt) : null, o.category_id ? catName(o.category_id) : null, o.vendor || o.given_by || o.description || o.note, date ? fmtDate(date) : null]
      .filter(Boolean).join(' · ');
  };
  const changes = (r) => Object.keys(AUDIT_FIELDS)
    .filter((k) => r.new_row && JSON.stringify(r.old_row?.[k] ?? null) !== JSON.stringify(r.new_row?.[k] ?? null))
    .map((k) => `${AUDIT_FIELDS[k]}: ${show(k, r.old_row?.[k])} → ${show(k, r.new_row?.[k])}`);

  const deletedTotal = (rows || [])
    .filter((r) => r.action === 'delete' && !r.restored_at && r.table_name === 'cb_expenses')
    .reduce((s, r) => s + Number(r.old_row?.amount || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2"><History size={20} className="text-[#f26522]" /> Changes &amp; deleted</h2>
          <p className="text-xs text-gray-500 mt-1">
            Every correction and every delete, with who did it and when. Nothing here can be edited — a deleted entry can be put back with <strong>Restore</strong>.
          </p>
        </div>
        <button onClick={onReload} className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-md text-sm text-gray-600"><RefreshCw size={14} /> Refresh</button>
      </div>
      {err && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">{err}</p>}
      {deletedTotal > 0 && (
        <p className="text-sm text-[#10243E] bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
          Spends deleted in this list: <strong>{inr(deletedTotal)}</strong>.
        </p>
      )}
      {rows === null ? <p className="text-gray-400 text-sm">Loading…</p> : rows.length === 0 && !err ? (
        <p className="text-gray-400 text-sm py-8 text-center">Nothing has been edited or deleted yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-start gap-3">
              <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border shrink-0 ${r.action === 'delete'
                ? (r.restored_at ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-red-50 text-red-700 border-red-200')
                : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {r.action === 'delete' ? (r.restored_at ? 'Restored' : 'Deleted') : 'Edited'}
              </span>
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm text-[#10243E]"><span className="text-gray-500">{AUDIT_TABLE[r.table_name] || r.table_name}:</span> {summary(r)}</p>
                {r.action === 'update' && <p className="text-xs text-gray-600 mt-0.5">{changes(r).join(' · ') || 'no visible change'}</p>}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {format(new Date(r.at), 'd MMM yyyy, HH:mm')} · {r.by_email || 'unknown'}
                  {r.restored_at && ` · restored ${format(new Date(r.restored_at), 'd MMM, HH:mm')} by ${r.restored_by || 'unknown'}`}
                </p>
              </div>
              {r.action === 'delete' && !r.restored_at && (
                <button onClick={() => onRestore(r)} className="text-xs px-2.5 py-1.5 rounded border border-[#10243E] text-[#10243E] flex items-center gap-1 shrink-0">
                  <Undo2 size={13} /> Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
