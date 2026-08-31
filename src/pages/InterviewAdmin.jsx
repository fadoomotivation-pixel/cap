import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar, Clock, Link as LinkIcon, Trash2, Users, Copy, CheckCircle, LogOut, X,
  Search, Download, CalendarDays, CalendarCheck, DoorOpen, Ban, MessageCircle, RefreshCw,
} from 'lucide-react';
import { format, addMinutes, parse, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';
import { ADMIN_EMAILS } from '../lib/admin';

const DURATIONS = [15, 20, 30, 45, 60];
const hhmm = (t) => (t ? t.substring(0, 5) : '');
const slotStart = (slot) => new Date(`${slot.slot_date}T${slot.start_time}`);

function dayLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export default function InterviewAdmin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Data
  const [slots, setSlots] = useState([]);
  const [links, setLinks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Slot generator
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(15);
  const [skipLunch, setSkipLunch] = useState(true);
  const [lunchStart, setLunchStart] = useState('13:00');
  const [lunchEnd, setLunchEnd] = useState('14:00');

  // Link generator
  const [linkType, setLinkType] = useState('generic');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('');

  const [copiedLink, setCopiedLink] = useState(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkIfAdmin(session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkIfAdmin(session.user.email);
      else { setIsAdmin(false); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfAdmin = (email) => {
    if (ADMIN_EMAILS.includes(email?.toLowerCase())) {
      setIsAdmin(true);
      fetchData();
    } else {
      setIsAdmin(false);
      setError('You do not have HR Admin access.');
      supabase.auth.signOut();
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setRefreshing(true);
    const [{ data: slotsData }, { data: linksData }, { data: bookingsData }] = await Promise.all([
      supabase.from('interview_slots').select('*').order('slot_date').order('start_time'),
      supabase.from('interview_links').select('*').order('created_at', { ascending: false }),
      supabase.from('interview_bookings').select('*, interview_slots(*)').order('booked_at', { ascending: false }),
    ]);
    if (slotsData) setSlots(slotsData);
    if (linksData) setLinks(linksData);
    if (bookingsData) setBookings(bookingsData);
    setRefreshing(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  // ── Slot generation ────────────────────────────────────────────────
  const generateSlots = async () => {
    setBusy(true);
    setError('');
    try {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      if (!isBefore(start, end)) throw new Error('End time must be after start time.');

      const lStart = skipLunch ? parse(lunchStart, 'HH:mm', new Date()) : null;
      const lEnd = skipLunch ? parse(lunchEnd, 'HH:mm', new Date()) : null;

      // Times already on this date — never create duplicates/overlaps.
      const taken = new Set(
        slots.filter((s) => s.slot_date === selectedDate).map((s) => hhmm(s.start_time))
      );

      const newSlots = [];
      let current = start;
      while (isBefore(current, end)) {
        const next = addMinutes(current, duration);
        if (isBefore(end, next)) break; // don't spill past the end time
        const startStr = format(current, 'HH:mm');
        const inLunch = skipLunch && !isBefore(current, lStart) && isBefore(current, lEnd);
        if (!inLunch && !taken.has(startStr)) {
          newSlots.push({
            slot_date: selectedDate,
            start_time: format(current, 'HH:mm:ss'),
            end_time: format(next, 'HH:mm:ss'),
            status: 'open',
          });
        }
        current = next;
      }

      if (newSlots.length === 0) throw new Error('No new slots to create — those times already exist.');

      const { error } = await supabase.from('interview_slots').insert(newSlots);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const deleteSlot = async (id) => {
    await supabase.from('interview_slots').delete().eq('id', id).eq('status', 'open');
    fetchData();
  };

  const clearDay = async (date) => {
    if (!window.confirm(`Remove all open (unbooked) slots on ${date}? Booked slots stay untouched.`)) return;
    await supabase.from('interview_slots').delete().eq('slot_date', date).eq('status', 'open');
    fetchData();
  };

  // ── Links ──────────────────────────────────────────────────────────
  const generateLink = async () => {
    setBusy(true);
    setError('');
    try {
      const row = { type: linkType, label: linkLabel || null };
      if (linkExpiry) row.expires_at = new Date(`${linkExpiry}T23:59:59`).toISOString();
      const { error } = await supabase.from('interview_links').insert([row]);
      if (error) throw error;
      setLinkLabel('');
      setLinkExpiry('');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const deactivateLink = async (token) => {
    await supabase.from('interview_links').update({ is_active: false }).eq('token', token);
    fetchData();
  };

  const linkUrl = (token) => `${window.location.origin}/book/${token}`;

  const copyToClipboard = (token) => {
    navigator.clipboard.writeText(linkUrl(token));
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const whatsappShare = (token) => {
    const msg = `Hi! Please pick a convenient slot for your interview with Capital Brix: ${linkUrl(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isLinkUsable = (l) =>
    l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date());

  // ── Bookings ───────────────────────────────────────────────────────
  const cancelBooking = async (id, slotId) => {
    if (!window.confirm('Cancel booking and reopen slot?')) return;
    await supabase.from('interview_bookings').delete().eq('id', id);
    await supabase.from('interview_slots').update({ status: 'open' }).eq('id', slotId);
    fetchData();
  };

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [b.candidate_name, b.candidate_email, b.candidate_phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [bookings, bookingSearch]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Date', 'Start', 'End', 'Booked At'];
    const rows = filteredBookings.map((b) => [
      b.candidate_name,
      b.candidate_email,
      b.candidate_phone,
      b.interview_slots?.slot_date ?? '',
      hhmm(b.interview_slots?.start_time),
      hhmm(b.interview_slots?.end_time),
      b.booked_at ? format(new Date(b.booked_at), 'yyyy-MM-dd HH:mm') : '',
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `capitalbrix-interviews-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived data ───────────────────────────────────────────────────
  const now = new Date();

  const stats = useMemo(() => {
    const upcomingOpen = slots.filter((s) => s.status === 'open' && slotStart(s) > now).length;
    const booked = slots.filter((s) => s.status === 'booked').length;
    const todays = bookings.filter((b) => b.interview_slots && isToday(parseISO(b.interview_slots.slot_date))).length;
    return { upcomingOpen, booked, todays, activeLinks: links.filter(isLinkUsable).length };
  }, [slots, bookings, links]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upcoming open slots grouped by date (past slots are noise for HR)
  const slotsByDate = useMemo(() => {
    const groups = {};
    slots
      .filter((s) => s.status === 'open' && slotStart(s) > now)
      .forEach((s) => {
        (groups[s.slot_date] = groups[s.slot_date] || []).push(s);
      });
    return groups;
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingBookings = useMemo(
    () => bookings.filter((b) => b.interview_slots && slotStart(b.interview_slots) > now),
    [bookings] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading...</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">HR Scheduler Login</h2>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HR Email</label>
              <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d] transition-colors">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#10243E]">Interview Scheduler</h1>
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-6 text-sm">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<DoorOpen size={20} />} label="Open Slots" value={stats.upcomingOpen} hint="upcoming" />
          <StatCard icon={<CalendarCheck size={20} />} label="Booked" value={stats.booked} hint="all time" accent />
          <StatCard icon={<CalendarDays size={20} />} label="Interviews Today" value={stats.todays} hint="scheduled" />
          <StatCard icon={<LinkIcon size={20} />} label="Active Links" value={stats.activeLinks} hint="shareable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: generators */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#f26522]" /> Generate Slots</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input type="date" value={selectedDate} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Start</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">End</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Slot length</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d} type="button" onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                          duration === d ? 'bg-[#10243E] text-white border-[#10243E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#f26522]'
                        }`}>
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={skipLunch} onChange={(e) => setSkipLunch(e.target.checked)} className="accent-[#f26522]" />
                    Skip lunch break
                  </label>
                  {skipLunch && (
                    <div className="flex gap-3 mt-3">
                      <input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                      <input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                    </div>
                  )}
                </div>
                <button onClick={generateSlots} disabled={busy} className="w-full bg-[#10243E] text-white py-2.5 rounded-md hover:bg-[#1a365d] transition disabled:opacity-50">
                  Generate Slots
                </button>
                <p className="text-xs text-gray-400">Existing times on this date are skipped, so it&apos;s safe to run twice.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon size={20} className="text-[#f26522]" /> Generate Link</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Link Type</label>
                  <select value={linkType} onChange={(e) => setLinkType(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]">
                    <option value="generic">Generic (many candidates)</option>
                    <option value="single-use">Single-use (one booking only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label / Title</label>
                  <input type="text" placeholder="e.g. Frontend Dev Walk-in" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Expires on <span className="text-gray-400">(optional)</span></label>
                  <input type="date" value={linkExpiry} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setLinkExpiry(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                </div>
                <button onClick={generateLink} disabled={busy} className="w-full bg-[#f26522] text-white py-2.5 rounded-md hover:bg-[#e0561b] transition disabled:opacity-50">
                  Create Link
                </button>
              </div>
            </div>
          </div>

          {/* Right: dashboard */}
          <div className="lg:col-span-2 space-y-6">

            {/* Upcoming interviews */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E] flex items-center gap-2">
                <CalendarCheck size={20} className="text-[#f26522]" /> Upcoming Interviews
                <span className="text-sm font-normal text-gray-400">({upcomingBookings.length})</span>
              </h2>
              {upcomingBookings.length === 0 ? (
                <p className="text-gray-400 py-4 text-sm">No upcoming interviews scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex flex-wrap justify-between items-center gap-2 p-3 rounded-lg bg-orange-50/60 border border-orange-100">
                      <div>
                        <p className="font-semibold text-[#10243E]">{b.candidate_name}</p>
                        <p className="text-xs text-gray-500">{b.candidate_email} • {b.candidate_phone}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#f26522]">
                        {dayLabel(b.interview_slots.slot_date)} · {hhmm(b.interview_slots.start_time)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E]">Shareable Links</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-3 text-sm font-medium text-gray-500">Label</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Type</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Status</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {links.map((link) => {
                      const usable = isLinkUsable(link);
                      const expired = link.is_active && link.expires_at && new Date(link.expires_at) <= new Date();
                      return (
                        <tr key={link.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-medium text-gray-800">
                            {link.label || 'Unnamed Link'}
                            {link.expires_at && (
                              <span className="block text-xs text-gray-400">expires {format(new Date(link.expires_at), 'MMM d, yyyy')}</span>
                            )}
                          </td>
                          <td className="p-3 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{link.type}</span></td>
                          <td className="p-3 text-sm">
                            {usable ? (
                              <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                            ) : expired ? (
                              <span className="text-amber-600 font-medium flex items-center gap-1"><Ban size={14} /> Expired</span>
                            ) : (
                              <span className="text-red-500 font-medium">Inactive</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {usable && (
                                <>
                                  <button onClick={() => copyToClipboard(link.token)} className="text-[#10243E] hover:text-[#f26522] transition-colors" title="Copy link">
                                    {copiedLink === link.token ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                                  </button>
                                  <button onClick={() => whatsappShare(link.token)} className="text-green-600 hover:text-green-700 transition-colors" title="Share on WhatsApp">
                                    <MessageCircle size={18} />
                                  </button>
                                  <button onClick={() => deactivateLink(link.token)} className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors">Deactivate</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {links.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">No links generated yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#10243E]">All Bookings <span className="text-sm font-normal text-gray-400">({filteredBookings.length})</span></h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} placeholder="Search name, email, phone"
                      className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-56" />
                  </div>
                  <button onClick={exportCsv} disabled={filteredBookings.length === 0}
                    className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d] transition disabled:opacity-40">
                    <Download size={16} /> CSV
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col md:flex-row justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 bg-gray-50/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-[#10243E] flex items-center gap-2"><Users size={16} className="text-[#f26522]" /> {booking.candidate_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{booking.candidate_email} • {booking.candidate_phone}</p>
                      {booking.interview_slots && (
                        <p className="text-sm font-medium text-[#f26522] mt-2 flex items-center gap-1">
                          <Clock size={14} /> {format(parseISO(booking.interview_slots.slot_date), 'MMM dd, yyyy')} | {hhmm(booking.interview_slots.start_time)} - {hhmm(booking.interview_slots.end_time)}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 md:mt-0 flex items-start justify-end">
                      <button onClick={() => cancelBooking(booking.id, booking.slot_id)} className="text-red-400 text-sm hover:text-red-600 hover:underline flex items-center gap-1 transition-colors">
                        <Trash2 size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <p className="text-center text-gray-400 py-6">
                    {bookingSearch ? 'No bookings match that search.' : 'No interviews booked yet.'}
                  </p>
                )}
              </div>
            </div>

            {/* Open slots by day */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E]">Manage Open Slots</h2>
              {Object.keys(slotsByDate).length === 0 ? (
                <p className="text-gray-400 py-4 text-center">No upcoming open slots.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slotsByDate).map(([date, daySlots]) => (
                    <div key={date}>
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="font-semibold text-[#10243E]">
                          {dayLabel(date)} <span className="text-sm font-normal text-gray-400">· {daySlots.length} open</span>
                        </h3>
                        <button onClick={() => clearDay(date)} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear day</button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {daySlots.map((slot) => (
                          <div key={slot.id} className="group relative border border-gray-200 rounded-md py-2 text-center text-sm hover:border-[#f26522] bg-white transition-colors shadow-sm">
                            <span className="font-medium text-gray-700">{hhmm(slot.start_time)}</span>
                            <button onClick={() => deleteSlot(slot.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600" title="Remove slot">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint, accent }) {
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${accent ? 'bg-[#10243E] border-[#10243E] text-white' : 'bg-white border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-white/10 text-[#f26522]' : 'bg-orange-50 text-[#f26522]'}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${accent ? 'text-white/40' : 'text-gray-400'}`}>{hint}</p>
    </div>
  );
}
