import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { isAdminEmail } from '../../lib/admin';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2, Link as LinkIcon, Copy, Check, Users, Lock, Mail } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
const fmtTime = (t) => t ? t.slice(0, 5) : '';

export default function InterviewAdmin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError(error.message);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-outfit">Loading...</div>;

  if (!session || !isAdminEmail(session.user.email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1F3F] via-[#10243E] to-[#1a3a5c] flex items-center justify-center p-4 font-outfit pt-20">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 w-full max-w-sm shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">HR Admin Login</h1>
          <p className="text-white/60 text-sm mb-6">Interview Scheduler</p>
          {session && !isAdminEmail(session.user.email) && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
              This account is not authorized for HR admin access.
            </p>
          )}
          {loginError && <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#f26522] text-sm" placeholder="HR Email" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#f26522] text-sm" placeholder="Password" />
            </div>
            <button type="submit" className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminPanel session={session} />;
}

function AdminPanel({ session }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slots, setSlots] = useState([]);
  const [links, setLinks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchSlots = useCallback(async () => {
    const { data } = await supabase.from('interview_slots').select('*').eq('slot_date', date).order('start_time');
    setSlots(data || []);
  }, [date]);

  const fetchLinks = useCallback(async () => {
    const { data } = await supabase.from('interview_links').select('*').order('created_at', { ascending: false });
    setLinks(data || []);
  }, []);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('interview_bookings')
      .select('*, interview_slots(slot_date, start_time, end_time)')
      .order('booked_at', { ascending: false });
    setBookings(data || []);
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);
  useEffect(() => { fetchLinks(); fetchBookings(); }, [fetchLinks, fetchBookings]);

  const generateSlots = async () => {
    setError(''); setBusy(true);
    try {
      const startM = toMinutes(startTime), endM = toMinutes(endTime);
      if (endM <= startM) { setError('End time must be after start time.'); return; }
      const rows = [];
      for (let m = startM; m + 15 <= endM; m += 15) {
        rows.push({ slot_date: date, start_time: fromMinutes(m), end_time: fromMinutes(m + 15), created_by: session.user.id });
      }
      const { error: insertError } = await supabase.from('interview_slots').insert(rows);
      if (insertError) throw insertError;
      fetchSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteSlot = async (id) => {
    await supabase.from('interview_slots').delete().eq('id', id).eq('status', 'open');
    fetchSlots();
  };

  const createLink = async (type) => {
    const label = type === 'single-use' ? prompt('Label for this link (e.g. candidate name):') || '' : 'General Booking Link';
    const { error: insertError } = await supabase.from('interview_links').insert([{ type, label, created_by: session.user.id }]);
    if (insertError) { setError(insertError.message); return; }
    fetchLinks();
  };

  const copyLink = (link) => {
    const url = `${window.location.origin}/book/${link.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] font-outfit pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="flex justify-between items-center bg-[#10243E] text-white p-6 rounded-2xl shadow-lg">
          <div>
            <span className="bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">HR Admin</span>
            <h1 className="text-2xl font-bold mt-1">Interview Scheduler</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition text-sm">Logout</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl">{error}</div>}

        {/* Generate Slots */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#10243E] mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#f26522]" /> Open Interview Slots</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={generateSlots} disabled={busy} className="bg-[#10243E] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm disabled:opacity-50">
              Generate 15-min Slots
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {slots.length === 0 ? (
              <p className="text-gray-400 text-sm">No slots for this date yet.</p>
            ) : slots.map((s) => (
              <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                s.status === 'booked' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <Clock size={14} /> {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                {s.status === 'booked' ? (
                  <span className="text-[10px] font-bold uppercase">Booked</span>
                ) : (
                  <button onClick={() => deleteSlot(s.id)} title="Remove slot" className="text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shareable Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#10243E] mb-4 flex items-center gap-2"><LinkIcon size={20} className="text-[#f26522]" /> Shareable Booking Links</h2>
          <div className="flex gap-3 mb-4">
            <button onClick={() => createLink('generic')} className="bg-[#f26522] hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">+ Generic Link</button>
            <button onClick={() => createLink('single-use')} className="bg-white border-2 border-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">+ Single-Use Link</button>
          </div>
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-gray-400 text-sm">No links generated yet.</p>
            ) : links.map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm">
                <div>
                  <span className={`font-semibold ${l.is_active ? 'text-[#10243E]' : 'text-gray-400 line-through'}`}>{l.label || l.type}</span>
                  <span className="ml-2 text-xs text-gray-400 uppercase">{l.type}</span>
                  {!l.is_active && <span className="ml-2 text-xs text-red-400">used/inactive</span>}
                </div>
                <button onClick={() => copyLink(l)} className="flex items-center gap-1 text-[#f26522] font-semibold text-xs hover:text-orange-600">
                  {copiedId === l.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#10243E] mb-4 flex items-center gap-2"><Users size={20} className="text-[#f26522]" /> Confirmed Bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-gray-400 text-sm">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4 font-medium">Candidate</th>
                    <th className="py-2 pr-4 font-medium">Contact</th>
                    <th className="py-2 pr-4 font-medium">Slot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 pr-4 font-semibold text-[#10243E]">{b.candidate_name}</td>
                      <td className="py-3 pr-4 text-gray-600">{b.candidate_email}<br /><span className="text-xs text-gray-400">{b.candidate_phone}</span></td>
                      <td className="py-3 pr-4 text-gray-600">
                        {b.interview_slots ? `${b.interview_slots.slot_date} · ${fmtTime(b.interview_slots.start_time)}–${fmtTime(b.interview_slots.end_time)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
