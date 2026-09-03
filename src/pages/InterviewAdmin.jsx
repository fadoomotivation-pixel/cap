import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar, Clock, Link as LinkIcon, Trash2, Users, Copy, CheckCircle, LogOut, X,
  Search, Download, CalendarDays, CalendarCheck, DoorOpen, Ban, MessageCircle, RefreshCw,
  Phone, Mail, Printer, CalendarClock, StickyNote, UserCheck, UserX, ThumbsUp, ThumbsDown, Zap, Wallet,
  Inbox,
} from 'lucide-react';
import { format, addMinutes, addDays, parse, isBefore, isToday, isTomorrow, parseISO, isAfter } from 'date-fns';
import { ADMIN_EMAILS } from '../lib/admin';

const DURATIONS = [15, 20, 30, 45, 60];

// Interview outcomes HR tracks after the fact.
const OUTCOMES = [
  { value: 'scheduled', label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CalendarClock },
  { value: 'attended', label: 'Attended', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: UserCheck },
  { value: 'no-show', label: 'No-show', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: UserX },
  { value: 'selected', label: 'Selected', cls: 'bg-green-100 text-green-800 border-green-300', Icon: ThumbsUp },
  { value: 'rejected', label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', Icon: ThumbsDown },
  { value: 'on-hold', label: 'On Hold', cls: 'bg-gray-100 text-gray-600 border-gray-300', Icon: StickyNote },
];
const outcomeMeta = (v) => OUTCOMES.find((o) => o.value === v) || OUTCOMES[0];

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

  const [slots, setSlots] = useState([]);
  const [links, setLinks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [autoCreated, setAutoCreated] = useState(0);
  const [showManual, setShowManual] = useState(false);

  // Slot generator
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [untilDate, setUntilDate] = useState('');
  const [skipWeekends, setSkipWeekends] = useState(true);
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
  const [bookingTab, setBookingTab] = useState('upcoming'); // upcoming | today | past | all
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  // Per-booking UI state
  const [notesDraft, setNotesDraft] = useState({});
  const [openNotes, setOpenNotes] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);

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
    // Autopilot: top up the rolling window of open slots before loading, so HR
    // never has to remember to create them. No-ops when autopilot is off.
    const { data: topUp } = await supabase.rpc('cb_ensure_interview_slots');
    if (topUp?.created) setAutoCreated(topUp.created);

    const [{ data: slotsData }, { data: linksData }, { data: bookingsData }, { data: settingsRow }] = await Promise.all([
      supabase.from('interview_slots').select('*').order('slot_date').order('start_time'),
      supabase.from('interview_links').select('*').order('created_at', { ascending: false }),
      supabase.from('interview_bookings').select('*, interview_slots(*)').order('booked_at', { ascending: false }),
      supabase.from('cb_scheduler_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (slotsData) setSlots(slotsData);
    if (linksData) setLinks(linksData);
    if (bookingsData) setBookings(bookingsData);
    if (settingsRow) setSettings(settingsRow);
    setRefreshing(false);
  };

  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await supabase.from('cb_scheduler_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', 1);
    fetchData();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  // ── Slots ──────────────────────────────────────────────────────────
  const generateSlots = async () => {
    setBusy(true);
    setError('');
    try {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      if (!isBefore(start, end)) throw new Error('End time must be after start time.');

      const lStart = skipLunch ? parse(lunchStart, 'HH:mm', new Date()) : null;
      const lEnd = skipLunch ? parse(lunchEnd, 'HH:mm', new Date()) : null;

      // Build the list of dates: single day, or a range when "until" is set.
      const dates = [];
      let cursor = parseISO(selectedDate);
      const last = untilDate ? parseISO(untilDate) : cursor;
      if (isBefore(last, cursor)) throw new Error('"Until" date must be after the start date.');
      while (!isAfter(cursor, last)) {
        const dow = cursor.getDay();
        if (!(skipWeekends && (dow === 0 || dow === 6))) dates.push(format(cursor, 'yyyy-MM-dd'));
        cursor = addDays(cursor, 1);
      }
      if (dates.length === 0) throw new Error('That range has no working days selected.');

      const newSlots = [];
      for (const date of dates) {
        const taken = new Set(slots.filter((s) => s.slot_date === date).map((s) => hhmm(s.start_time)));
        let current = start;
        while (isBefore(current, end)) {
          const next = addMinutes(current, duration);
          if (isBefore(end, next)) break;
          const startStr = format(current, 'HH:mm');
          const inLunch = skipLunch && !isBefore(current, lStart) && isBefore(current, lEnd);
          if (!inLunch && !taken.has(startStr)) {
            newSlots.push({
              slot_date: date,
              start_time: format(current, 'HH:mm:ss'),
              end_time: format(next, 'HH:mm:ss'),
              status: 'open',
            });
          }
          current = next;
        }
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

  const isLinkUsable = (l) => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date());

  // ── Bookings ───────────────────────────────────────────────────────
  const setOutcome = async (bookingId, status) => {
    await supabase.from('interview_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  };

  const saveNotes = async (bookingId) => {
    const notes = notesDraft[bookingId] ?? '';
    await supabase.from('interview_bookings').update({ notes, updated_at: new Date().toISOString() }).eq('id', bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, notes } : b)));
    setOpenNotes(null);
  };

  const reschedule = async (bookingId, newSlotId) => {
    setBusy(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('reschedule_interview_booking', {
      p_booking_id: bookingId,
      p_new_slot_id: newSlotId,
    });
    if (rpcError) setError(rpcError.message);
    else if (!data?.success) setError(data?.error || 'Could not reschedule.');
    else setReschedulingId(null);
    await fetchData();
    setBusy(false);
  };

  const cancelBooking = async (id, slotId) => {
    if (!window.confirm('Cancel booking and reopen slot?')) return;
    await supabase.from('interview_bookings').delete().eq('id', id);
    await supabase.from('interview_slots').update({ status: 'open' }).eq('id', slotId);
    fetchData();
  };

  const now = new Date();

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      const s = b.interview_slots;
      if (bookingTab === 'upcoming' && !(s && slotStart(s) > now)) return false;
      if (bookingTab === 'today' && !(s && isToday(parseISO(s.slot_date)))) return false;
      if (bookingTab === 'past' && !(s && slotStart(s) <= now)) return false;
      if (outcomeFilter !== 'all' && (b.status || 'scheduled') !== outcomeFilter) return false;
      if (!q) return true;
      return [b.candidate_name, b.candidate_email, b.candidate_phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [bookings, bookingSearch, bookingTab, outcomeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Date', 'Start', 'End', 'Outcome', 'Notes', 'Booked At'];
    const rows = filteredBookings.map((b) => [
      b.candidate_name, b.candidate_email, b.candidate_phone,
      b.interview_slots?.slot_date ?? '',
      hhmm(b.interview_slots?.start_time), hhmm(b.interview_slots?.end_time),
      b.status || 'scheduled', b.notes || '',
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

  // ── Derived ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const upcomingOpen = slots.filter((s) => s.status === 'open' && slotStart(s) > now).length;
    const todays = bookings.filter((b) => b.interview_slots && isToday(parseISO(b.interview_slots.slot_date))).length;
    const done = bookings.filter((b) => ['attended', 'no-show', 'selected', 'rejected'].includes(b.status));
    const noShows = bookings.filter((b) => b.status === 'no-show').length;
    return {
      upcomingOpen,
      todays,
      selected: bookings.filter((b) => b.status === 'selected').length,
      activeLinks: links.filter(isLinkUsable).length,
      noShowRate: done.length ? Math.round((noShows / done.length) * 100) : null,
    };
  }, [slots, bookings, links]); // eslint-disable-line react-hooks/exhaustive-deps

  const slotsByDate = useMemo(() => {
    const groups = {};
    slots.filter((s) => s.status === 'open' && slotStart(s) > now)
      .forEach((s) => { (groups[s.slot_date] = groups[s.slot_date] || []).push(s); });
    return groups;
  }, [slots]); // eslint-disable-line react-hooks/exhaustive-deps

  const openFutureSlots = useMemo(
    () => slots.filter((s) => s.status === 'open' && slotStart(s) > now),
    [slots] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const todaysBookings = useMemo(
    () => bookings
      .filter((b) => b.interview_slots && isToday(parseISO(b.interview_slots.slot_date)))
      .sort((a, b) => a.interview_slots.start_time.localeCompare(b.interview_slots.start_time)),
    [bookings]
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
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit print:pt-0 print:bg-white">
      <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } }`}</style>
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-8 no-print">
          <div className="flex items-center gap-3">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-12 h-12 rounded-xl object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-[#10243E]">Interview Scheduler</h1>
              <p className="text-gray-500 text-sm">{session.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/admin/leads" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
              <Inbox size={16} /> Leads
            </a>
            <a href="/admin/attendance" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors">
              <Users size={16} /> Attendance
            </a>
            <a href="/admin/expenses" className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors">
              <Wallet size={16} /> Petty Cash
            </a>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors" title="Print today's interview sheet">
              <Printer size={16} /> Day Sheet
            </button>
            <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-6 text-sm no-print">{error}</div>}

        {/* Printable day sheet for the interview panel */}
        <div className="hidden print-only mb-8">
          <h2 className="text-2xl font-bold mb-1">Interview Day Sheet — {format(new Date(), 'EEEE, MMMM d, yyyy')}</h2>
          <p className="text-sm text-gray-500 mb-4">Capital Brix · {todaysBookings.length} interview(s)</p>
          <table className="w-full text-left text-sm border-collapse">
            <thead><tr className="border-b-2 border-gray-300">
              <th className="py-2">Time</th><th>Candidate</th><th>Contact</th><th>Outcome</th><th>Notes</th>
            </tr></thead>
            <tbody>
              {todaysBookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-200">
                  <td className="py-2 font-medium">{hhmm(b.interview_slots.start_time)}</td>
                  <td>{b.candidate_name}</td>
                  <td>{b.candidate_phone}<br />{b.candidate_email}</td>
                  <td>____________</td>
                  <td>____________________</td>
                </tr>
              ))}
              {todaysBookings.length === 0 && <tr><td colSpan="5" className="py-4 text-gray-400">No interviews scheduled today.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 no-print">
          <StatCard icon={<DoorOpen size={20} />} label="Open Slots" value={stats.upcomingOpen} hint="upcoming" />
          <StatCard icon={<CalendarDays size={20} />} label="Today" value={stats.todays} hint="interviews" accent />
          <StatCard icon={<ThumbsUp size={20} />} label="Selected" value={stats.selected} hint="all time" />
          <StatCard icon={<UserX size={20} />} label="No-show Rate" value={stats.noShowRate === null ? '—' : `${stats.noShowRate}%`} hint="of completed" />
          <StatCard icon={<LinkIcon size={20} />} label="Active Links" value={stats.activeLinks} hint="shareable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">

          {/* Left: generators */}
          <div className="space-y-6">
            {/* Autopilot — slots keep themselves topped up so HR does nothing */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Zap size={20} className="text-[#f26522]" /> Slot Autopilot</h2>
                <button type="button" onClick={() => saveSettings({ auto_generate: !settings?.auto_generate })}
                  className={`relative w-12 h-6 rounded-full transition shrink-0 ${settings?.auto_generate ? 'bg-[#f26522]' : 'bg-gray-300'}`}
                  title={settings?.auto_generate ? 'Autopilot on' : 'Autopilot off'}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings?.auto_generate ? 'left-6.5 translate-x-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {settings?.auto_generate ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Slots are created automatically for the next{' '}
                    <strong className="text-[#10243E]">{settings.days_ahead} days</strong> — nothing to do by hand.
                    {autoCreated > 0 && <span className="text-[#f26522]"> Just added {autoCreated}.</span>}
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <label className="flex-1">
                        <span className="block text-xs text-gray-500 mb-1">Day starts</span>
                        <input type="time" value={settings.start_time?.slice(0, 5) || '10:00'}
                          onChange={(e) => saveSettings({ start_time: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                      </label>
                      <label className="flex-1">
                        <span className="block text-xs text-gray-500 mb-1">Day ends</span>
                        <input type="time" value={settings.end_time?.slice(0, 5) || '18:00'}
                          onChange={(e) => saveSettings({ end_time: e.target.value })}
                          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <label className="flex-1">
                        <span className="block text-xs text-gray-500 mb-1">Slot length</span>
                        <select value={settings.slot_minutes} onChange={(e) => saveSettings({ slot_minutes: Number(e.target.value) })}
                          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                          {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                        </select>
                      </label>
                      <label className="flex-1">
                        <span className="block text-xs text-gray-500 mb-1">Days ahead</span>
                        <select value={settings.days_ahead} onChange={(e) => saveSettings({ days_ahead: Number(e.target.value) })}
                          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                          {[7, 14, 21, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={settings.skip_weekends} onChange={(e) => saveSettings({ skip_weekends: e.target.checked })} className="accent-[#f26522]" />
                      Skip weekends
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={settings.skip_lunch} onChange={(e) => saveSettings({ skip_lunch: e.target.checked })} className="accent-[#f26522]" />
                      Skip lunch ({settings.lunch_start?.slice(0, 5)}–{settings.lunch_end?.slice(0, 5)})
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Autopilot is off — you&apos;ll need to create slots manually below.
                </p>
              )}

              <button type="button" onClick={() => setShowManual(!showManual)}
                className="text-xs text-gray-400 hover:text-[#f26522] mt-4 underline">
                {showManual ? 'Hide' : 'Show'} manual slot creation
              </button>
            </div>

            <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${showManual ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#f26522]" /> Manual Slots</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">From date</label>
                    <input type="date" value={selectedDate} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Until <span className="text-gray-400">(optional)</span></label>
                    <input type="date" value={untilDate} min={selectedDate} onChange={(e) => setUntilDate(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                </div>
                {untilDate && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={skipWeekends} onChange={(e) => setSkipWeekends(e.target.checked)} className="accent-[#f26522]" />
                    Skip weekends
                  </label>
                )}
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
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${duration === d ? 'bg-[#10243E] text-white border-[#10243E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#f26522]'}`}>
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
                <p className="text-xs text-gray-400">Existing times are skipped, so running this twice is safe.</p>
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
                  <label className="block text-sm text-gray-600 mb-1">Label / Role</label>
                  <input type="text" placeholder="e.g. Telecaller — Noida" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
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

            {/* Today's schedule at a glance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><CalendarCheck size={20} className="text-[#f26522]" /> Today&apos;s Line-up</h2>
              {todaysBookings.length === 0 ? (
                <p className="text-gray-400 text-sm">Nothing scheduled today.</p>
              ) : (
                <ol className="space-y-2">
                  {todaysBookings.map((b) => {
                    const meta = outcomeMeta(b.status);
                    return (
                      <li key={b.id} className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-[#10243E] w-12 shrink-0">{hhmm(b.interview_slots.start_time)}</span>
                        <span className="flex-1 truncate text-gray-700">{b.candidate_name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2 space-y-6">

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
                            {link.expires_at && <span className="block text-xs text-gray-400">expires {format(new Date(link.expires_at), 'MMM d, yyyy')}</span>}
                          </td>
                          <td className="p-3 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{link.type}</span></td>
                          <td className="p-3 text-sm">
                            {usable ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                              : expired ? <span className="text-amber-600 font-medium flex items-center gap-1"><Ban size={14} /> Expired</span>
                              : <span className="text-red-500 font-medium">Inactive</span>}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {usable && (
                                <>
                                  <button onClick={() => copyToClipboard(link.token)} className="text-[#10243E] hover:text-[#f26522]" title="Copy link">
                                    {copiedLink === link.token ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                                  </button>
                                  <button onClick={() => whatsappShare(link.token)} className="text-green-600 hover:text-green-700" title="Share on WhatsApp"><MessageCircle size={18} /></button>
                                  <button onClick={() => deactivateLink(link.token)} className="text-red-400 hover:text-red-600 text-sm font-medium">Deactivate</button>
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

            {/* Candidates */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#10243E]">Candidates <span className="text-sm font-normal text-gray-400">({filteredBookings.length})</span></h2>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} placeholder="Search name, email, phone"
                      className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-52" />
                  </div>
                  <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                    <option value="all">All outcomes</option>
                    {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button onClick={exportCsv} disabled={filteredBookings.length === 0}
                    className="flex items-center gap-2 bg-[#10243E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1a365d] transition disabled:opacity-40">
                    <Download size={16} /> CSV
                  </button>
                </div>
              </div>

              <div className="flex gap-1 mb-4 border-b border-gray-100">
                {[['upcoming', 'Upcoming'], ['today', 'Today'], ['past', 'Past'], ['all', 'All']].map(([key, label]) => (
                  <button key={key} onClick={() => setBookingTab(key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                      bookingTab === key ? 'border-[#f26522] text-[#f26522]' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredBookings.map((booking) => {
                  const meta = outcomeMeta(booking.status);
                  const slot = booking.interview_slots;
                  return (
                    <div key={booking.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 hover:border-gray-200 transition-colors">
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-[#10243E] flex items-center gap-2"><Users size={16} className="text-[#f26522]" /> {booking.candidate_name}</h3>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <a href={`tel:${booking.candidate_phone}`} className="text-gray-600 hover:text-[#f26522] flex items-center gap-1"><Phone size={13} /> {booking.candidate_phone}</a>
                            <a href={`mailto:${booking.candidate_email}`} className="text-gray-600 hover:text-[#f26522] flex items-center gap-1"><Mail size={13} /> {booking.candidate_email}</a>
                            <a href={`https://wa.me/${(booking.candidate_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 flex items-center gap-1"><MessageCircle size={13} /> WhatsApp</a>
                          </div>
                          {slot && (
                            <p className="text-sm font-medium text-[#f26522] mt-2 flex items-center gap-1">
                              <Clock size={14} /> {format(parseISO(slot.slot_date), 'MMM dd, yyyy')} | {hhmm(slot.start_time)} - {hhmm(slot.end_time)}
                            </p>
                          )}
                          {booking.notes && openNotes !== booking.id && (
                            <p className="text-sm text-gray-500 mt-2 bg-white border border-gray-100 rounded p-2 whitespace-pre-wrap">{booking.notes}</p>
                          )}
                        </div>

                        <div className="flex md:flex-col gap-2 md:items-end shrink-0">
                          <select value={booking.status || 'scheduled'} onChange={(e) => setOutcome(booking.id, e.target.value)}
                            className="border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-[#f26522] bg-white">
                            {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <div className="flex gap-3 text-sm">
                            <button onClick={() => { setOpenNotes(openNotes === booking.id ? null : booking.id); setNotesDraft((d) => ({ ...d, [booking.id]: booking.notes || '' })); }}
                              className="text-gray-500 hover:text-[#10243E] flex items-center gap-1"><StickyNote size={14} /> Notes</button>
                            <button onClick={() => setReschedulingId(reschedulingId === booking.id ? null : booking.id)}
                              className="text-gray-500 hover:text-[#10243E] flex items-center gap-1"><CalendarClock size={14} /> Move</button>
                            <button onClick={() => cancelBooking(booking.id, booking.slot_id)}
                              className="text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={14} /> Cancel</button>
                          </div>
                        </div>
                      </div>

                      {openNotes === booking.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <textarea rows="3" value={notesDraft[booking.id] ?? ''} onChange={(e) => setNotesDraft((d) => ({ ...d, [booking.id]: e.target.value }))}
                            placeholder="Interview notes — experience, expected CTC, availability, verdict…"
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]" />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => saveNotes(booking.id)} className="bg-[#10243E] text-white px-4 py-1.5 rounded-md text-sm hover:bg-[#1a365d]">Save</button>
                            <button onClick={() => setOpenNotes(null)} className="text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700">Cancel</button>
                          </div>
                        </div>
                      )}

                      {reschedulingId === booking.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600 mb-2">Move to an open slot:</p>
                          {openFutureSlots.length === 0 ? (
                            <p className="text-sm text-gray-400">No open slots available — generate some first.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                              {openFutureSlots.map((s) => (
                                <button key={s.id} onClick={() => reschedule(booking.id, s.id)} disabled={busy}
                                  className="px-3 py-1.5 rounded-md text-sm border border-gray-200 bg-white hover:border-[#f26522] hover:text-[#f26522] transition disabled:opacity-50">
                                  {dayLabel(s.slot_date)} · {hhmm(s.start_time)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredBookings.length === 0 && (
                  <p className="text-center text-gray-400 py-6">
                    {bookingSearch || outcomeFilter !== 'all' ? 'No candidates match these filters.' : 'No interviews booked yet.'}
                  </p>
                )}
              </div>
            </div>

            {/* Open slots */}
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
