import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../lib/admin';
import AdminNav from '../components/AdminNav';
import { downloadCsv } from '../lib/expenses';
import { CARD_STATUSES, STATUS_META, cardTypeLabel, showsQuantity } from '../lib/cards';
import {
  IdCard, RefreshCw, LogOut, Search, X, ArrowDownToLine, Copy, Printer,
  MessageCircle, Phone, CheckCircle2, Clock3,
} from 'lucide-react';
import { format } from 'date-fns';

const wa = (phone, name, status) =>
  `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello ${name}, this is Capital Brix HR — an update on your card request: ${STATUS_META[status]?.label || status}.`
  )}`;

export default function CardsAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');

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

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const { data, error } = await supabase.from('cb_card_requests').select('*')
      .order('created_at', { ascending: false }).limit(500);
    setBusy(false);
    if (error) setError(error.message); else setRows(data || []);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setOk(m); setTimeout(() => setOk(''), 4000); };

  const setRowStatus = async (row, next) => {
    const { error } = await supabase.from('cb_card_requests')
      .update({ status: next }).eq('id', row.id);
    if (error) return setError(error.message);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
  };

  const saveNote = async (row, note) => {
    if ((row.admin_notes || '') === note) return;
    const { error } = await supabase.from('cb_card_requests')
      .update({ admin_notes: note || null }).eq('id', row.id);
    if (error) return setError(error.message);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, admin_notes: note } : r)));
    flash('Note saved — the employee can see it.');
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status === 'open' && ['delivered', 'rejected'].includes(r.status)) return false;
      if (status !== 'open' && status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return [r.print_name, r.designation, r.employee_email, r.print_phone]
        .filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [rows, status, search]);

  const stats = useMemo(() => ({
    open: rows.filter((r) => !['delivered', 'rejected'].includes(r.status)).length,
    requested: rows.filter((r) => r.status === 'requested').length,
    printing: rows.filter((r) => r.status === 'printing').length,
    // What the printer actually needs to run, so HR can batch one order.
    cards: rows.filter((r) => ['approved', 'printing'].includes(r.status) && showsQuantity(r.card_type))
      .reduce((s, r) => s + Number(r.quantity || 0), 0),
  }), [rows]);

  /** A print-ready sheet for the printer: exactly what goes on each card. */
  const printSpec = () => {
    const batch = rows.filter((r) => ['approved', 'printing'].includes(r.status));
    if (!batch.length) return flash('Nothing approved yet — approve the requests you want printed first.');
    const text = batch.map((r) =>
      `${r.print_name}\n${r.designation}\n${r.print_phone}${r.print_email ? `\n${r.print_email}` : ''}\n` +
      `${cardTypeLabel(r.card_type)}${showsQuantity(r.card_type) ? ` × ${r.quantity}` : ''}` +
      `${r.notes ? `\nNote: ${r.notes}` : ''}`
    ).join('\n\n──────────\n\n');
    navigator.clipboard.writeText(`CAPITAL BRIX — CARD PRINT BATCH\n${format(new Date(), 'd MMM yyyy')}\n\n${text}`);
    flash(`Print spec for ${batch.length} request(s) copied — paste it to the printer.`);
  };

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Card Requests Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); }} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37]" />
            <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#D4AF37]" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d]">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Card Requests</h1>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat accent icon={<Clock3 size={20} />} label="Open requests" value={stats.open} />
          <Stat icon={<IdCard size={20} />} label="Awaiting approval" value={stats.requested} />
          <Stat icon={<Printer size={20} />} label="At the printer" value={stats.printing} />
          <Stat icon={<CheckCircle2 size={20} />} label="Cards in current batch" value={stats.cards} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-[#10243E]">{shown.length} request{shown.length === 1 ? '' : 's'}</h2>
            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#D4AF37]">
                <option value="open">Open (not delivered)</option>
                <option value="all">All</option>
                {CARD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / email"
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#D4AF37] w-48" />
              </div>
              <button onClick={printSpec}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#D4AF37] hover:text-[#9C7C1C]">
                <Copy size={16} /> Print spec
              </button>
              <button onClick={() => downloadCsv([
                ['Raised', 'Employee', 'Card', 'Qty', 'Print name', 'Designation', 'Phone', 'Email', 'Status', 'HR note'],
                ...shown.map((r) => [
                  format(new Date(r.created_at), 'yyyy-MM-dd'), r.employee_email, cardTypeLabel(r.card_type),
                  showsQuantity(r.card_type) ? r.quantity : 1, r.print_name, r.designation,
                  r.print_phone, r.print_email, STATUS_META[r.status]?.label, r.admin_notes,
                ]),
              ], `capital-brix-card-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={!shown.length}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#D4AF37] hover:text-[#9C7C1C] disabled:opacity-50">
                <ArrowDownToLine size={16} /> CSV
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">
              Nothing here. Employees raise requests from the Employee Portal → Workspace.
            </p>
          ) : (
            <div className="space-y-3">
              {shown.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.requested;
                return (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                    <div className="flex flex-wrap gap-4 justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#10243E]">
                          {r.print_name}
                          <span className="font-normal text-gray-400"> · {r.designation}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {cardTypeLabel(r.card_type)}
                          {showsQuantity(r.card_type) ? ` · ${r.quantity} cards` : ''}
                          {' · '}{r.print_phone}
                          {r.print_email ? ` · ${r.print_email}` : ''}
                        </p>
                        {r.notes && <p className="text-sm text-gray-600 mt-2">{r.notes}</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          {r.employee_email} · raised {format(new Date(r.created_at), 'd MMM yyyy')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a href={wa(r.print_phone, r.print_name, r.status)} target="_blank" rel="noreferrer" title="WhatsApp update"
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-green-600 hover:border-green-400"><MessageCircle size={16} /></a>
                        <a href={`tel:${r.print_phone}`} title="Call"
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#D4AF37] hover:text-[#9C7C1C]"><Phone size={16} /></a>
                        <select value={r.status} onChange={(e) => setRowStatus(r, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-2 outline-none ${meta.cls}`}>
                          {CARD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                        </select>
                      </div>
                    </div>

                    <input
                      defaultValue={r.admin_notes || ''}
                      onBlur={(e) => saveNote(r, e.target.value.trim())}
                      placeholder="Note for the employee — they can see this"
                      className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${accent ? 'bg-[#10243E] border-[#10243E] text-white' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-white/10 text-[#D4AF37]' : 'bg-[#FAF6E9] text-[#9C7C1C]'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}
