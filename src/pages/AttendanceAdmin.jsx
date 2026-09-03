import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../lib/admin';
import { buildDailyWhatsAppSummary, whatsappLink, buildNudgeMessage } from '../lib/attendanceReport';
import {
  Users, UserPlus, MapPin, Download, Search, LogOut, RefreshCw, CheckCircle, Clock,
  Building2, Navigation, Home, UserX, Power, Calendar, Send, KeyRound, Settings, AlertTriangle,
  Copy, BarChart3, Bell, Crosshair, X, Wallet,
  Inbox,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const MODE_META = {
  office: { label: 'Office', Icon: Building2, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'site-visit': { label: 'Site Visit', Icon: Navigation, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  wfh: { label: 'WFH', Icon: Home, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};
const HR_STATUSES = ['leave', 'holiday', 'half-day', 'wfh-approved', 'on-duty'];
const fmtTime = (ts) => (ts ? format(new Date(ts), 'hh:mm a') : '—');

export default function AttendanceAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [tab, setTab] = useState('today'); // today | roster | monthly | settings
  const [employees, setEmployees] = useState([]);
  const [day, setDay] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [settings, setSettings] = useState(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', department: '', role_title: '', employee_code: '', date_of_joining: '' });
  const [credential, setCredential] = useState(null); // {email, password, existed}
  const [creatingFor, setCreatingFor] = useState(null);

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

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    const [{ data: emps }, { data: dayRows }, { data: settingsRow }] = await Promise.all([
      supabase.from('cb_employees').select('*').order('full_name'),
      supabase.rpc('cb_daily_attendance', { p_date: date }),
      supabase.from('cb_hr_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setEmployees(emps || []);
    setDay(dayRows || []);
    if (settingsRow) setSettings(settingsRow);
    setRefreshing(false);
  }, [isAdmin, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!isAdmin || tab !== 'monthly') return;
    supabase.rpc('cb_monthly_attendance', { p_month: `${month}-01` })
      .then(({ data }) => setMonthly(data || []));
  }, [isAdmin, tab, month]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const flash = (msg) => { setOk(msg); setTimeout(() => setOk(''), 4000); };

  // ── Roster ─────────────────────────────────────────────────────────
  // One action: add the person AND give them a login. A roster row on its own
  // can't punch, so splitting these into two steps only creates a way to forget
  // the second one.
  const addEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingFor('new');
    const payload = { ...form, created_by: session.user.id };
    if (!payload.date_of_joining) delete payload.date_of_joining;
    const { data, error } = await supabase.from('cb_employees').insert([payload]).select().single();
    setCreatingFor(null);
    if (error) { setError(error.message); return; }
    setForm({ full_name: '', email: '', phone: '', department: '', role_title: '', employee_code: '', date_of_joining: '' });
    setShowAdd(false);
    setShowMore(false);
    await fetchData();
    createLogin(data);
  };

  // Resetting an existing login replaces a password the person is already using,
  // so make that an explicit choice rather than a same-looking button.
  const confirmCreateLogin = (emp) => {
    if (emp.user_id && !window.confirm(
      `${emp.full_name} already has a login. Reset their password to a new one?\n\nTheir current password will stop working immediately.`
    )) return;
    createLogin(emp);
  };

  const createLogin = async (emp) => {
    setCreatingFor(emp.id);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('create-employee-login', {
        body: { employee_id: emp.id, email: emp.email, full_name: emp.full_name },
      });
      // The function answers 200 with {success:false, error} on failure, but if
      // it ever fails at the platform level, dig the real message out instead of
      // showing "non-2xx status code".
      if (error) {
        let detail = error.message;
        try {
          const body = await error.context?.json?.();
          if (body?.error) detail = body.error;
        } catch { /* keep the original message */ }
        throw new Error(detail);
      }
      if (!data?.success) throw new Error(data?.error || 'Could not create the login.');
      setCredential({ ...data, name: emp.full_name, phone: emp.phone });
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
    setCreatingFor(null);
  };

  const toggleActive = async (emp) => {
    await supabase.from('cb_employees').update({ is_active: !emp.is_active }).eq('id', emp.id);
    fetchData();
  };

  // ── Attendance actions ─────────────────────────────────────────────
  const markStatus = async (employeeId, status) => {
    // Update in place when the employee already has a row for the day —
    // upserting would overwrite the work_mode they actually punched with.
    const { data: existing } = await supabase
      .from('cb_attendance')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('work_date', date)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from('cb_attendance').update({ hr_status: status || null }).eq('id', existing.id)
      : await supabase.from('cb_attendance').insert([{ employee_id: employeeId, work_date: date, hr_status: status || null }]);

    if (error) setError(error.message);
    fetchData();
  };

  const saveSettings = async (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    const { error } = await supabase.from('cb_hr_settings')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) setError(error.message);
    else flash('Settings saved.');
    fetchData();
  };

  const useCurrentLocationAsOffice = () => {
    if (!navigator.geolocation) { setError('Geolocation not available in this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => saveSettings({ office_lat: pos.coords.latitude, office_lng: pos.coords.longitude }),
      () => setError('Could not get your location. Allow location access and try again.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Derived ────────────────────────────────────────────────────────
  const filteredDay = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return day;
    return day.filter((r) => [r.full_name, r.department, r.employee_code].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
  }, [day, search]);

  const stats = useMemo(() => {
    const present = day.filter((r) => r.check_in_at);
    return {
      strength: day.length,
      present: present.length,
      absent: day.filter((r) => !r.check_in_at && !r.hr_status).length,
      late: present.filter((r) => r.is_late).length,
      siteVisits: present.filter((r) => r.work_mode === 'site-visit').length,
      flagged: present.filter((r) => r.outside_geofence).length,
    };
  }, [day]);

  const notPunched = useMemo(() => day.filter((r) => !r.check_in_at && !r.hr_status), [day]);

  const summaryText = useMemo(() => buildDailyWhatsAppSummary(day, date), [day, date]);

  const exportCsv = () => {
    const header = ['Employee', 'Code', 'Department', 'Date', 'Mode', 'HR Status', 'In', 'Out', 'Hours', 'Late', 'Late Min', 'Distance (m)', 'Outside Geofence', 'Location', 'Note'];
    const body = filteredDay.map((r) => [
      r.full_name, r.employee_code || '', r.department || '', date,
      r.check_in_at ? r.work_mode : (r.hr_status || 'absent'), r.hr_status || '',
      fmtTime(r.check_in_at), fmtTime(r.check_out_at), r.hours ?? '',
      r.is_late ? 'Yes' : '', r.late_minutes ?? '',
      r.distance_from_office ?? '', r.outside_geofence ? 'Yes' : '',
      r.check_in_lat ? `${r.check_in_lat},${r.check_in_lng}` : '', r.note || '',
    ]);
    downloadCsv([header, ...body], `capitalbrix-attendance-${date}.csv`);
  };

  const exportMonthlyCsv = () => {
    const header = ['Employee', 'Code', 'Department', 'Present Days', 'Leave Days', 'Site Visits', 'WFH', 'Late Days', 'Total Hours', 'Avg Hours'];
    const body = monthly.map((r) => [
      r.full_name, r.employee_code || '', r.department || '',
      r.present_days, r.leave_days, r.site_visits, r.wfh_days, r.late_days, r.total_hours, r.avg_hours,
    ]);
    downloadCsv([header, ...body], `capitalbrix-attendance-${month}.csv`);
  };

  const downloadCsv = (rows, filename) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">HR Attendance Login</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised for HR access.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="HR Email" value={email} onChange={(e) => setEmail(e.target.value)}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">HR Console</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/leads" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <Inbox size={16} /> Leads
            </a>
            <a href="/admin/expenses" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <Wallet size={16} /> Petty Cash
            </a>
            <a href="/admin/interviews" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <Clock size={16} /> Interviews
            </a>
            <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
        {ok && <div className="bg-green-50 text-green-700 border border-green-100 p-4 rounded-lg mb-4 text-sm">{ok}</div>}

        {/* Credentials handover modal */}
        {credential && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCredential(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="text-[#f26522]" size={22} />
                <h3 className="text-xl font-bold text-[#10243E]">{credential.existed ? 'Password reset' : 'Login created'}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Share these with {credential.name}. This password is shown once — copy it now.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm mb-4">
                <p><span className="text-gray-500">Portal:</span> <strong>{window.location.origin}/employee-kyc</strong></p>
                <p><span className="text-gray-500">Email:</span> <strong>{credential.email}</strong></p>
                <p><span className="text-gray-500">Password:</span> <strong className="text-[#f26522] tracking-wider">{credential.password}</strong></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { navigator.clipboard.writeText(`Portal: ${window.location.origin}/employee-kyc\nEmail: ${credential.email}\nPassword: ${credential.password}`); flash('Credentials copied.'); }}
                  className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d]">
                  <Copy size={16} /> Copy
                </button>
                <a href={whatsappLink(credential.phone, `Welcome to Capital Brix, ${credential.name}!\n\nYour employee portal login:\nURL: ${window.location.origin}/employee-kyc\nEmail: ${credential.email}\nPassword: ${credential.password}\n\nPlease log in and mark your attendance daily. Change your password after first login.`)}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                  <Send size={16} /> Send on WhatsApp
                </a>
                <button onClick={() => setCredential(null)} className="text-gray-500 px-4 py-2 text-sm">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {[['today', 'Daily Register', Calendar], ['roster', 'Employees', Users], ['monthly', 'Monthly Report', BarChart3], ['settings', 'Settings', Settings]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                tab === key ? 'border-[#f26522] text-[#f26522]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* ── DAILY ── */}
        {tab === 'today' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Stat icon={<Users size={20} />} label="Strength" value={stats.strength} />
              <Stat icon={<CheckCircle size={20} />} label="Present" value={stats.present} accent />
              <Stat icon={<UserX size={20} />} label="Absent" value={stats.absent} />
              <Stat icon={<Clock size={20} />} label="Late" value={stats.late} />
              <Stat icon={<Navigation size={20} />} label="Site Visits" value={stats.siteVisits} />
            </div>

            {/* Founder daily report */}
            <div className="bg-[#10243E] text-white rounded-xl p-6 mb-6">
              <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Send size={18} className="text-[#f26522]" /> Daily Report to Founder</h2>
                  <p className="text-white/60 text-sm mt-1">
                    One tap — opens WhatsApp with the day&apos;s summary already written.
                    {!settings?.founder_whatsapp && ' Add the founder\'s number in Settings to skip picking a contact.'}
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
              <pre className="mt-4 bg-black/20 rounded-lg p-4 text-xs text-white/80 whitespace-pre-wrap max-h-52 overflow-y-auto font-sans">{summaryText}</pre>
            </div>

            {/* Nudge list */}
            {notPunched.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <Bell size={18} /> Not punched yet ({notPunched.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {notPunched.map((r) => (
                    <a key={r.employee_id} href={whatsappLink(r.phone, buildNudgeMessage(r.full_name))} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm hover:border-amber-400 transition">
                      <span className="text-[#10243E] font-medium">{r.full_name}</span>
                      <Send size={13} className="text-green-600" />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-3">Tap a name to send them a reminder on WhatsApp.</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-[#10243E]">Daily Register</h2>
                <div className="flex flex-wrap gap-2">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee"
                      className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-44" />
                  </div>
                  <button onClick={exportCsv} disabled={filteredDay.length === 0}
                    className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d] disabled:opacity-40">
                    <Download size={16} /> CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <tr>
                      <th className="p-3 font-medium">Employee</th>
                      <th className="p-3 font-medium">Mode</th>
                      <th className="p-3 font-medium">In / Out</th>
                      <th className="p-3 font-medium">Hrs</th>
                      <th className="p-3 font-medium">Proof</th>
                      <th className="p-3 font-medium">HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDay.map((r) => {
                      const meta = r.check_in_at ? MODE_META[r.work_mode] : null;
                      return (
                        <tr key={r.employee_id} className={`hover:bg-gray-50/50 ${!r.check_in_at ? 'opacity-70' : ''}`}>
                          <td className="p-3">
                            <p className="font-semibold text-[#10243E]">{r.full_name}</p>
                            <p className="text-xs text-gray-500">{[r.employee_code, r.department].filter(Boolean).join(' · ')}</p>
                          </td>
                          <td className="p-3">
                            {meta ? (
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${meta.cls}`}>{meta.label}</span>
                            ) : r.hr_status ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border bg-gray-100 text-gray-600 border-gray-200">{r.hr_status}</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border bg-red-50 text-red-600 border-red-200">Absent</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-700">
                            {r.check_in_at ? (
                              <>
                                <span className={r.is_late ? 'text-amber-600 font-semibold' : ''}>{fmtTime(r.check_in_at)}</span>
                                <span className="text-gray-300"> → </span>{fmtTime(r.check_out_at)}
                                {r.is_late && <span className="block text-[10px] text-amber-600 font-bold">LATE +{r.late_minutes}m</span>}
                              </>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-gray-700">{r.hours ?? (r.check_in_at ? <span className="text-amber-600">in</span> : '—')}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {r.check_in_lat && (
                                <a href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`} target="_blank" rel="noreferrer"
                                  className="text-[#f26522] hover:underline flex items-center gap-1 text-xs">
                                  <MapPin size={13} /> {r.distance_from_office != null ? `${Math.round(r.distance_from_office)}m` : 'Map'}
                                </a>
                              )}
                              {r.outside_geofence && (
                                <span className="text-red-500 flex items-center gap-1 text-[10px] font-bold" title="Office punch made outside the geofence">
                                  <AlertTriangle size={12} /> OUT
                                </span>
                              )}
                              {r.selfie_url && (
                                <a href={r.selfie_url} target="_blank" rel="noreferrer">
                                  <img src={r.selfie_url} alt="Selfie" className="w-7 h-7 rounded object-cover border border-gray-200" />
                                </a>
                              )}
                              {r.note && <span className="text-xs text-gray-500 truncate max-w-[130px]" title={r.note}>{r.note}</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <select value={r.hr_status || ''} onChange={(e) => markStatus(r.employee_id, e.target.value)}
                              className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-[#f26522] bg-white">
                              <option value="">—</option>
                              {HR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDay.length === 0 && (
                      <tr><td colSpan="6" className="p-8 text-center text-gray-400">No active employees — add your team in the Employees tab.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── ROSTER ── */}
        {tab === 'roster' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2">
                <Users size={20} className="text-[#f26522]" /> Employees
                <span className="text-sm font-normal text-gray-400">({employees.length})</span>
              </h2>
              <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-[#f26522] text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600">
                <UserPlus size={16} /> Add Employee
              </button>
            </div>

            {showAdd && (
              <form onSubmit={addEmployee} className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-4">
                  Three things and they&apos;re ready to punch — we create their login automatically.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label>
                    <span className="block text-xs font-medium text-gray-600 mb-1">Name</span>
                    <input required placeholder="Ankit Jha" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  </label>
                  <label>
                    <span className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-gray-400">(their login)</span></span>
                    <input required type="email" placeholder="ankit@capitalbrix.co.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  </label>
                  <label>
                    <span className="block text-xs font-medium text-gray-600 mb-1">WhatsApp <span className="text-gray-400">(to send the login)</span></span>
                    <input placeholder="9199XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  </label>
                </div>

                <button type="button" onClick={() => setShowMore(!showMore)} className="text-xs text-gray-400 hover:text-[#f26522] underline mt-3">
                  {showMore ? 'Hide' : 'Add'} department, role, code, joining date
                </button>

                {showMore && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                    <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                    <input placeholder="Role / designation" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                    <input placeholder="Employee code" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                    <input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  </div>
                )}

                <div className="flex gap-2 mt-5">
                  <button type="submit" disabled={creatingFor === 'new'}
                    className="bg-[#f26522] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                    {creatingFor === 'new' ? 'Adding…' : 'Add & Create Login'}
                  </button>
                  <button type="button" onClick={() => { setShowAdd(false); setShowMore(false); }} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Login</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-semibold text-[#10243E]">{e.full_name}</p>
                        {e.employee_code && <p className="text-xs text-gray-400">{e.employee_code}</p>}
                      </td>
                      <td className="p-3 text-gray-600">{e.email}<br /><span className="text-xs text-gray-400">{e.phone}</span></td>
                      <td className="p-3 text-gray-600">{e.role_title || '—'}<br /><span className="text-xs text-gray-400">{e.department}</span></td>
                      <td className="p-3">
                        {e.user_id ? (
                          <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle size={13} /> Active</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not created</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${e.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {e.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {ADMIN_EMAILS.includes(e.email?.toLowerCase()) ? (
                            // Never offer to reset an HR account from the roster —
                            // one misclick locks HR out of this console.
                            <span className="text-xs text-gray-400 flex items-center gap-1" title="HR admin account — manage its password in Supabase">
                              <KeyRound size={14} /> HR account
                            </span>
                          ) : (
                            <button onClick={() => confirmCreateLogin(e)} disabled={creatingFor === e.id}
                              className="text-[#f26522] hover:text-orange-600 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                              title={e.user_id ? 'Reset their password' : 'Create a login so they can punch attendance'}>
                              <KeyRound size={14} /> {creatingFor === e.id ? 'Working…' : e.user_id ? 'Reset password' : 'Create login'}
                            </button>
                          )}
                          <button onClick={() => toggleActive(e)} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs">
                            <Power size={14} /> {e.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No employees added yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MONTHLY ── */}
        {tab === 'monthly' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2">
                <BarChart3 size={20} className="text-[#f26522]" /> Monthly Report
              </h2>
              <div className="flex gap-2">
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                <button onClick={exportMonthlyCsv} disabled={monthly.length === 0}
                  className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d] disabled:opacity-40">
                  <Download size={16} /> CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="p-3 font-medium">Employee</th>
                    <th className="p-3 font-medium">Present</th>
                    <th className="p-3 font-medium">Leave</th>
                    <th className="p-3 font-medium">Site</th>
                    <th className="p-3 font-medium">WFH</th>
                    <th className="p-3 font-medium">Late</th>
                    <th className="p-3 font-medium">Total Hrs</th>
                    <th className="p-3 font-medium">Avg Hrs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthly.map((r) => (
                    <tr key={r.employee_id} className="hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-semibold text-[#10243E]">{r.full_name}</p>
                        <p className="text-xs text-gray-400">{r.department}</p>
                      </td>
                      <td className="p-3 font-semibold text-green-700">{r.present_days}</td>
                      <td className="p-3 text-gray-600">{r.leave_days}</td>
                      <td className="p-3 text-gray-600">{r.site_visits}</td>
                      <td className="p-3 text-gray-600">{r.wfh_days}</td>
                      <td className={`p-3 font-medium ${r.late_days > 3 ? 'text-red-600' : 'text-gray-600'}`}>{r.late_days}</td>
                      <td className="p-3 text-gray-600">{r.total_hours}</td>
                      <td className="p-3 text-gray-600">{r.avg_hours}</td>
                    </tr>
                  ))}
                  {monthly.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-400">No data for this month.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && settings && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2 mb-6">
              <Settings size={20} className="text-[#f26522]" /> HR Policy
            </h2>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <label>
                  <span className="block text-sm text-gray-600 mb-1">Shift starts</span>
                  <input type="time" value={settings.shift_start?.slice(0, 5) || '10:00'}
                    onChange={(e) => saveSettings({ shift_start: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                </label>
                <label>
                  <span className="block text-sm text-gray-600 mb-1">Shift ends</span>
                  <input type="time" value={settings.shift_end?.slice(0, 5) || '19:00'}
                    onChange={(e) => saveSettings({ shift_end: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                </label>
                <label>
                  <span className="block text-sm text-gray-600 mb-1">Late grace (min)</span>
                  <input type="number" min="0" value={settings.late_grace_minutes}
                    onChange={(e) => saveSettings({ late_grace_minutes: Number(e.target.value) })}
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                </label>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-semibold text-[#10243E] mb-1">Office geofence</p>
                <p className="text-xs text-gray-500 mb-3">
                  Office punches made further than this from the office get flagged, so &quot;I&apos;m at the office&quot; is verifiable.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <label>
                    <span className="block text-xs text-gray-500 mb-1">Latitude</span>
                    <input value={settings.office_lat ?? ''} onChange={(e) => saveSettings({ office_lat: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" placeholder="28.50" />
                  </label>
                  <label>
                    <span className="block text-xs text-gray-500 mb-1">Longitude</span>
                    <input value={settings.office_lng ?? ''} onChange={(e) => saveSettings({ office_lng: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" placeholder="77.39" />
                  </label>
                  <label>
                    <span className="block text-xs text-gray-500 mb-1">Radius (metres)</span>
                    <input type="number" min="50" value={settings.geofence_meters}
                      onChange={(e) => saveSettings({ geofence_meters: Number(e.target.value) })}
                      className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                  </label>
                </div>
                <button onClick={useCurrentLocationAsOffice}
                  className="mt-3 flex items-center gap-2 text-sm text-[#f26522] hover:text-orange-600 font-medium">
                  <Crosshair size={16} /> Use my current location as the office
                </button>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block">
                  <span className="block text-sm text-gray-600 mb-1">Founder&apos;s WhatsApp number</span>
                  <input value={settings.founder_whatsapp ?? ''} onChange={(e) => setSettings({ ...settings, founder_whatsapp: e.target.value })}
                    onBlur={(e) => saveSettings({ founder_whatsapp: e.target.value || null })}
                    placeholder="917048917300 (country code, no +)"
                    className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  The daily report button opens WhatsApp straight to this number.
                </p>
              </div>
            </div>
          </div>
        )}

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
