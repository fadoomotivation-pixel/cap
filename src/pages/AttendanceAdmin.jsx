import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAILS } from '../lib/admin';
import {
  Users, UserPlus, MapPin, Camera, Download, Search, LogOut, RefreshCw, CheckCircle,
  Clock, Building2, Navigation, Home, UserX, Power, Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const MODE_META = {
  office: { label: 'Office', Icon: Building2, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'site-visit': { label: 'Site Visit', Icon: Navigation, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  wfh: { label: 'WFH', Icon: Home, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};
const fmtTime = (ts) => (ts ? format(new Date(ts), 'hh:mm a') : '—');

const hoursWorked = (row) => {
  if (!row.check_in_at || !row.check_out_at) return null;
  const h = (new Date(row.check_out_at) - new Date(row.check_in_at)) / 36e5;
  return h.toFixed(1);
};

export default function AttendanceAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', department: '', role_title: '', employee_code: '', date_of_joining: '' });

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
    const [{ data: emps }, { data: att }] = await Promise.all([
      supabase.from('cb_employees').select('*').order('full_name'),
      supabase.from('cb_attendance').select('*, cb_employees(full_name, department, employee_code)').eq('work_date', date),
    ]);
    setEmployees(emps || []);
    setRows(att || []);
    setRefreshing(false);
  }, [isAdmin, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, created_by: session.user.id };
    if (!payload.date_of_joining) delete payload.date_of_joining;
    const { error } = await supabase.from('cb_employees').insert([payload]);
    if (error) { setError(error.message); return; }
    setForm({ full_name: '', email: '', phone: '', department: '', role_title: '', employee_code: '', date_of_joining: '' });
    setShowAdd(false);
    fetchData();
  };

  const toggleActive = async (emp) => {
    await supabase.from('cb_employees').update({ is_active: !emp.is_active }).eq('id', emp.id);
    fetchData();
  };

  // Roster joined with the day's attendance so absentees are visible too —
  // an attendance screen that only lists people who showed up hides the
  // thing HR actually needs to see.
  const dayView = useMemo(() => {
    const byEmp = Object.fromEntries(rows.map((r) => [r.employee_id, r]));
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => e.is_active)
      .filter((e) => !q || [e.full_name, e.email, e.department, e.employee_code].filter(Boolean).some((v) => v.toLowerCase().includes(q)))
      .map((e) => ({ employee: e, record: byEmp[e.id] || null }));
  }, [employees, rows, search]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.is_active).length;
    const present = rows.filter((r) => r.check_in_at).length;
    const siteVisits = rows.filter((r) => r.work_mode === 'site-visit').length;
    return { active, present, absent: Math.max(active - present, 0), siteVisits };
  }, [employees, rows]);

  const exportCsv = () => {
    const header = ['Employee', 'Code', 'Department', 'Date', 'Mode', 'Punch In', 'Punch Out', 'Hours', 'Location', 'Note'];
    const body = dayView.map(({ employee: e, record: r }) => [
      e.full_name, e.employee_code || '', e.department || '', date,
      r?.work_mode || 'absent', fmtTime(r?.check_in_at), fmtTime(r?.check_out_at),
      r ? hoursWorked(r) || '' : '',
      r?.check_in_lat ? `${r.check_in_lat},${r.check_in_lng}` : '',
      r?.note || '',
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...body].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `capitalbrix-attendance-${date}.csv`;
    a.click();
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

        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-12 h-12 rounded-xl object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-[#10243E]">Attendance</h1>
              <p className="text-gray-500 text-sm">{session.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
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

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-6 text-sm">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={<Users size={20} />} label="Active Employees" value={stats.active} />
          <Stat icon={<CheckCircle size={20} />} label="Present" value={stats.present} accent />
          <Stat icon={<UserX size={20} />} label="Absent" value={stats.absent} />
          <Stat icon={<Navigation size={20} />} label="On Site Visit" value={stats.siteVisits} />
        </div>

        {/* Day attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2">
              <Calendar size={20} className="text-[#f26522]" /> Daily Register
            </h2>
            <div className="flex flex-wrap gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee"
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-48" />
              </div>
              <button onClick={exportCsv} disabled={dayView.length === 0}
                className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d] disabled:opacity-40">
                <Download size={16} /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Employee</th>
                  <th className="p-3 font-medium">Mode</th>
                  <th className="p-3 font-medium">In / Out</th>
                  <th className="p-3 font-medium">Hours</th>
                  <th className="p-3 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dayView.map(({ employee: e, record: r }) => {
                  const meta = r ? MODE_META[r.work_mode] : null;
                  return (
                    <tr key={e.id} className={`hover:bg-gray-50/50 ${!r ? 'opacity-60' : ''}`}>
                      <td className="p-3">
                        <p className="font-semibold text-[#10243E]">{e.full_name}</p>
                        <p className="text-xs text-gray-500">{[e.employee_code, e.department].filter(Boolean).join(' · ') || e.email}</p>
                      </td>
                      <td className="p-3">
                        {meta ? (
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${meta.cls}`}>{meta.label}</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border bg-red-50 text-red-600 border-red-200">Absent</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-700">
                        {r ? <>{fmtTime(r.check_in_at)} <span className="text-gray-300">→</span> {fmtTime(r.check_out_at)}</> : '—'}
                      </td>
                      <td className="p-3 text-gray-700">{r ? hoursWorked(r) ?? <span className="text-amber-600">active</span> : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {r?.check_in_lat && (
                            <a href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`} target="_blank" rel="noreferrer"
                              className="text-[#f26522] hover:underline flex items-center gap-1 text-xs" title={`Accuracy ~${Math.round(r.check_in_accuracy || 0)}m`}>
                              <MapPin size={13} /> Location
                            </a>
                          )}
                          {r?.selfie_url && (
                            <a href={r.selfie_url} target="_blank" rel="noreferrer" title="Selfie">
                              <img src={r.selfie_url} alt="Selfie" className="w-8 h-8 rounded object-cover border border-gray-200" />
                            </a>
                          )}
                          {r?.note && <span className="text-xs text-gray-500 truncate max-w-[180px]" title={r.note}>{r.note}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {dayView.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">
                    No active employees yet — add your team below.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roster */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-[#10243E] flex items-center gap-2">
              <Users size={20} className="text-[#f26522]" /> Employee Roster
              <span className="text-sm font-normal text-gray-400">({employees.length})</span>
            </h2>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-[#f26522] text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600">
              <UserPlus size={16} /> Add Employee
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addEmployee} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <input required placeholder="Full name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input required type="email" placeholder="Email * (their login email)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input placeholder="Role / designation" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input placeholder="Employee code" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <button type="submit" className="bg-[#10243E] text-white px-5 py-2 rounded-md text-sm hover:bg-[#1a365d]">Save Employee</button>
                <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
              </div>
              <p className="text-xs text-gray-500 sm:col-span-2 lg:col-span-3">
                The email must match the one they sign in with on the Employee Portal — that&apos;s how punches are linked to them.
              </p>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Contact</th>
                  <th className="p-3 font-medium">Role</th>
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
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${e.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {e.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(e)} className="text-gray-400 hover:text-[#f26522] flex items-center gap-1 text-xs" title={e.is_active ? 'Deactivate' : 'Reactivate'}>
                        <Power size={14} /> {e.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No employees added yet.</td></tr>}
              </tbody>
            </table>
          </div>
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
