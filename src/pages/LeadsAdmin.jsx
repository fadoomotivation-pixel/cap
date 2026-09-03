import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../lib/admin';
import { downloadCsv } from '../lib/expenses';
import {
  Inbox, Phone, Mail, MessageCircle, RefreshCw, LogOut, Search, Users, Clock,
  Wallet, ArrowDownToLine, X, TrendingUp, Link2,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['new', 'contacted', 'site-visit', 'converted', 'lost'];
const STATUS_CLS = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-800 border-amber-200',
  'site-visit': 'bg-purple-50 text-purple-700 border-purple-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-500 border-gray-200',
};

const wa = (phone, name) =>
  `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello ${name}, this is Capital Brix — thank you for your enquiry about Dholera. When would be a good time to talk?`
  )}`;

export default function LeadsAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('all');
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
    const { data, error } = await supabase.from('cb_leads').select('*')
      .order('created_at', { ascending: false }).limit(500);
    setBusy(false);
    if (error) setError(error.message); else setLeads(data || []);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const setLeadStatus = async (lead, next) => {
    const { error } = await supabase.from('cb_leads').update({ status: next }).eq('id', lead.id);
    if (error) return setError(error.message);
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (!q) return true;
      return [l.full_name, l.phone, l.email, l.message, l.source_path]
        .filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [leads, status, search]);

  const stats = useMemo(() => ({
    total: leads.length,
    New: leads.filter((l) => l.status === 'new').length,
    week: leads.filter((l) => Date.now() - new Date(l.created_at) < 7 * 864e5).length,
    converted: leads.filter((l) => l.status === 'converted').length,
  }), [leads]);

  // Which page actually earns enquiries — the only honest way to decide what
  // to write more of.
  const bySource = useMemo(() => {
    const m = new Map();
    leads.forEach((l) => {
      const k = l.source_path || l.source || 'unknown';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Leads Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); }} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d]">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Website Leads</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/attendance" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><Users size={16} /> Attendance</a>
            <a href="/admin/expenses" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><Wallet size={16} /> Petty Cash</a>
            <a href="/admin/interviews" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><Clock size={16} /> Interviews</a>
            <button onClick={load} disabled={busy} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><LogOut size={18} /> Logout</button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat accent icon={<Inbox size={20} />} label="Unactioned" value={stats.New} />
          <Stat icon={<TrendingUp size={20} />} label="Last 7 days" value={stats.week} />
          <Stat icon={<Users size={20} />} label="All leads" value={stats.total} />
          <Stat icon={<MessageCircle size={20} />} label="Converted" value={stats.converted} />
        </div>

        {bySource.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-[#10243E] flex items-center gap-2 mb-1"><Link2 size={17} className="text-[#f26522]" /> Which page brings the leads</h2>
            <p className="text-xs text-gray-500 mb-4">Write more of whatever is at the top of this list.</p>
            <div className="flex flex-wrap gap-2">
              {bySource.map(([path, n]) => (
                <span key={path} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                  {path} <strong className="text-[#10243E] ml-1">{n}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-[#10243E]">{shown.length} leads</h2>
            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                <option value="all">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / phone / page"
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-52" />
              </div>
              <button onClick={() => downloadCsv([
                ['Received', 'Name', 'Phone', 'Email', 'Message', 'Source', 'Page', 'Status'],
                ...shown.map((l) => [
                  format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'), l.full_name, l.phone, l.email,
                  l.message, l.source, l.source_path, l.status,
                ]),
              ], `capital-brix-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={!shown.length}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50">
                <ArrowDownToLine size={16} /> CSV
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">
              No leads yet. They will appear here the moment someone submits the form on the site.
            </p>
          ) : (
            <div className="space-y-3">
              {shown.map((l) => (
                <div key={l.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                  <div className="flex flex-wrap gap-3 justify-between items-start">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#10243E]">{l.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {l.phone}{l.email ? ` · ${l.email}` : ''}
                      </p>
                      {l.message && <p className="text-sm text-gray-600 mt-2">{l.message}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(l.created_at), 'd MMM yyyy, hh:mm a')}
                        {l.source_path ? ` · from ${l.source_path}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a href={wa(l.phone, l.full_name)} target="_blank" rel="noreferrer" title="WhatsApp"
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-green-600 hover:border-green-400"><MessageCircle size={16} /></a>
                      <a href={`tel:${l.phone}`} title="Call"
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f26522] hover:text-[#f26522]"><Phone size={16} /></a>
                      {l.email && (
                        <a href={`mailto:${l.email}`} title="Email"
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f26522] hover:text-[#f26522]"><Mail size={16} /></a>
                      )}
                      <select value={l.status} onChange={(e) => setLeadStatus(l, e.target.value)}
                        className={`text-xs border rounded-lg px-2 py-2 outline-none ${STATUS_CLS[l.status]}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-white/10 text-[#f26522]' : 'bg-orange-50 text-[#f26522]'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}
