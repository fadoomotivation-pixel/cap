import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PasswordInput from '../components/PasswordInput';
import AdminNav from '../components/AdminNav';
import { friendlyError } from '../lib/errors';
import { ADMIN_EMAILS } from '../lib/admin';
import { downloadCsv } from '../lib/expenses';
import { events as EVENT_DETAILS } from '../data/eventDetails';
import {
  CalendarDays, Phone, Mail, MessageCircle, RefreshCw, LogOut, Search,
  Users, ArrowDownToLine, X, UserCheck, MapPin, Send, MailWarning, Tag, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Event registrations console.
 *
 * Reads cb_event_registrations, which only admins may SELECT — the anon key
 * can insert a registration and nothing else, so this page is the only place
 * the list exists.
 *
 * `guests` is the number of seats, not the number of rows: the headline count
 * that matters to whoever books the hall is total seats, so both are shown and
 * never conflated.
 */
// The site-wide code every visitor arrives with. A row carrying only this is
// an ordinary registration; a row carrying anything else came through a poster,
// a handout or a forward, and that is the one worth flagging. Badging every row
// PRIORITY would be badging none.
const DEFAULT_CODE = 'CAPITALBRIX';

const STATUSES = ['registered', 'confirmed', 'attended', 'no-show', 'cancelled'];
const STATUS_CLS = {
  registered: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:  'bg-amber-50 text-amber-800 border-amber-200',
  attended:   'bg-green-50 text-green-700 border-green-200',
  'no-show':  'bg-gray-100 text-gray-500 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
};

/**
 * The confirmation WhatsApp.
 *
 * Email is the nicer channel and it is still wired up, but it needs a secret
 * set in Supabase and until that happens nothing goes out at all. WhatsApp
 * needs nothing, is what this audience actually reads, and HR is holding the
 * phone anyway — so it is the one that must always work.
 */
const confirmationText = (r, ev) =>
  `Hello ${r.full_name}, this is Capital Brix.\n\n` +
  `Your seat is confirmed for *${ev?.title || 'our seminar'}*.\n\n` +
  (ev ? `📅 ${ev.dateLabel}${ev.time ? `, ${ev.time}` : ''}\n` : '') +
  (ev ? `📍 ${ev.venueFull || ev.venue}\n` : '') +
  (ev?.mapsUrl ? `🗺️ ${ev.mapsUrl}\n` : '') +
  (ev?.delegateFee ? `\nThe ₹${ev.delegateFee.toLocaleString('en-IN')} delegate fee is waived on your online registration — nothing to pay on the day.\n` : '') +
  `\nPlease carry a photo ID. Reply here if anything changes.\n\n— Capital Brix LLP`;

const waLink = (r, ev) =>
  `https://wa.me/${String(r.phone).replace(/\D/g, '')}?text=${encodeURIComponent(confirmationText(r, ev))}`;

export default function EventsAdmin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [rows, setRows] = useState([]);
  const [eventSlug, setEventSlug] = useState('all');
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

  // The true number of rows in the table, asked for separately.
  //
  // Every figure on this page is computed from `shown`, which is the loaded
  // rows after the event filter, the status filter and the search box. That is
  // right for the list and wrong for "how many people are coming" — a filter
  // left on, or a page cap reached, and the headline quietly under-reports the
  // hall. So the total comes from a count on the server and is displayed even
  // when it disagrees with what is on screen, because a disagreement is
  // exactly the thing worth seeing.
  const [totalInDb, setTotalInDb] = useState(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const [{ data, error }, { count }] = await Promise.all([
      supabase.from('cb_event_registrations').select('*')
        .order('created_at', { ascending: false }).limit(2000),
      supabase.from('cb_event_registrations').select('id', { count: 'exact', head: true }),
    ]);
    setBusy(false);
    setTotalInDb(typeof count === 'number' ? count : null);
    if (error) setError(friendlyError(error)); else setRows(data || []);
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Anything the registration insert could not save lands in cb_leads tagged
  // 'event-registration-failed'. It has to be visible HERE, on the page whose
  // job is "who is coming" — a rescued registration filed in a different
  // console is a registration nobody looks at.
  const [rescued, setRescued] = useState([]);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('cb_leads')
      .select('id, full_name, phone, email, message, created_at')
      .eq('source', 'event-registration-failed')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRescued(data || []));
  }, [isAdmin]);

  // Is a mail provider actually configured? Without asking, the only way to
  // find out is to register someone and notice they never got an email — which
  // is how you discover a missing secret a week after the invitations went out.
  const [mail, setMail] = useState(undefined);
  useEffect(() => {
    if (!isAdmin) return;
    supabase.functions
      .invoke('event-confirmation', { body: { probe: true } })
      .then(({ data }) => setMail(data ?? null))
      .catch(() => setMail(null));
  }, [isAdmin]);

  // HR taps WhatsApp, the message opens prefilled, and the row moves to
  // 'confirmed' — so "who still needs telling" is answerable from the list
  // instead of from memory.
  const confirmViaWhatsApp = (row) => {
    window.open(waLink(row, EVENT_DETAILS[row.event_slug]), '_blank', 'noopener');
    if (row.status === 'registered') setRowStatus(row, 'confirmed');
  };

  const setRowStatus = async (row, next) => {
    const { error } = await supabase.from('cb_event_registrations')
      .update({ status: next }).eq('id', row.id);
    if (error) return setError(friendlyError(error));
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
  };

  // Re-send (or send for the first time) the confirmation. The function takes
  // only the row id and looks the address up itself, so HR can never send this
  // mail to an address that is not on the registration.
  const resend = async (row) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('event-confirmation', {
      body: { registration_id: row.id, resend: true },
    });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    if (!data?.sent) {
      return setError(data?.reason || 'The mail provider is not configured — set RESEND_API_KEY in Supabase.');
    }
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, confirmation_sent_at: new Date().toISOString() } : r)));
  };

  const slugs = useMemo(
    () => [...new Set([...Object.keys(EVENT_DETAILS), ...rows.map((r) => r.event_slug)])],
    [rows]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (eventSlug !== 'all' && r.event_slug !== eventSlug) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return [r.full_name, r.phone, r.email, r.city, r.invited_by, r.invite_code, r.notes]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, eventSlug, status, search]);

  // Who is actually filling the hall. This is the reason the field exists —
  // a list of names with no count next to them tells nobody anything.
  const byInviter = useMemo(() => {
    const m = new Map();
    shown.forEach((r) => {
      const k = (r.invited_by || '').trim();
      if (!k) return;
      const prev = m.get(k.toLowerCase()) || { label: k, people: 0, seats: 0 };
      prev.people += 1;
      prev.seats += r.guests || 1;
      m.set(k.toLowerCase(), prev);
    });
    return [...m.values()].sort((a, b) => b.seats - a.seats).slice(0, 10);
  }, [shown]);

  // Which code is actually working. Same shape as the inviter rollup: seats,
  // not rows, because a code that brought one booking of four moved four chairs.
  const byCode = useMemo(() => {
    const m = new Map();
    shown.forEach((r) => {
      const k = (r.invite_code || '').trim();
      if (!k || k === DEFAULT_CODE) return;
      const prev = m.get(k) || { label: k, seats: 0 };
      prev.seats += r.guests || 1;
      m.set(k, prev);
    });
    return [...m.values()].sort((a, b) => b.seats - a.seats);
  }, [shown]);

  const stats = useMemo(() => ({
    people: shown.length,
    seats: shown.reduce((n, r) => n + (r.guests || 1), 0),
    confirmed: shown.filter((r) => r.status === 'confirmed' || r.status === 'attended').length,
    attended: shown.filter((r) => r.status === 'attended').length,
  }), [shown]);

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading…</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">Event Registrations</h2>
          {session && !isAdmin && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">This account is not authorised.</div>}
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={async (e) => {
            e.preventDefault(); setError('');
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(friendlyError(error));
          }} className="space-y-4">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <PasswordInput required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" />
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d]">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const activeEvent = eventSlug !== 'all' ? EVENT_DETAILS[eventSlug] : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-capital-brix.png" alt="Capital Brix" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#10243E]">Event Registrations</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} disabled={busy} className="flex items-center gap-2 text-gray-600 hover:text-[#f26522] bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 disabled:opacity-50">
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100"><LogOut size={18} /> Logout</button>
          </div>
        </div>

        <AdminNav className="mb-6" />

        {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-lg mb-4 text-sm flex justify-between gap-3">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}

        {rescued.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 mb-6">
            <h2 className="font-bold flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-red-600" />
              {rescued.length} registration{rescued.length === 1 ? '' : 's'} could not be saved — confirm {rescued.length === 1 ? 'this one' : 'these'} by hand
            </h2>
            <p className="text-xs text-red-800/80 mb-3">
              The sign-up failed for these people but their details were caught. They are not in the
              count below and nobody has told them anything.
            </p>
            <div className="space-y-2">
              {rescued.map((l) => (
                <div key={l.id} className="bg-white border border-red-200 rounded-lg px-3 py-2 flex flex-wrap gap-2 justify-between items-center">
                  <span className="text-sm text-[#10243E]">
                    <strong>{l.full_name}</strong> · {l.phone}{l.email ? ` · ${l.email}` : ''}
                    <span className="block text-[11px] text-gray-500">
                      {format(new Date(l.created_at), 'd MMM, hh:mm a')}
                    </span>
                  </span>
                  <a href={`https://wa.me/${String(l.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {mail && mail.provider === null && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6 flex gap-3">
            <MailWarning size={20} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="text-sm leading-relaxed">
              <strong>Confirmation emails are not going out.</strong> Registrations are being
              saved normally, but no mail provider is configured, so nobody is receiving a
              confirmation — the page tells them your team will confirm on WhatsApp instead.
              <br />
              <strong>Use the WhatsApp button on each row instead</strong> — it opens a ready-made
              confirmation with the date, venue and map, and marks the person confirmed. Nothing to
              configure.
              <br /><br />
              To switch email on: Zoho Accounts → Security → App Passwords, then add{' '}
              <code className="bg-amber-100 px-1 rounded">SMTP_PASSWORD</code> and{' '}
              <code className="bg-amber-100 px-1 rounded">SMTP_USER</code> = hr@capitalbrix.co.in under{' '}
              <strong>Project Settings → Edge Functions → Secrets</strong>. That is a different screen
              from Authentication → SMTP Settings, which only sends login emails and will not help here.
            </div>
          </div>
        )}

        {mail && mail.provider && (
          <p className="text-xs text-gray-500 mb-6 flex items-center gap-2">
            <Send size={13} className="text-green-600" />
            Confirmation emails are on, sending from <strong className="text-[#10243E]">{mail.from}</strong>
            {mail.host ? ` via ${mail.host}` : ''}.
          </p>
        )}

        {activeEvent && (
          <div className="bg-[#10243E] text-white rounded-xl p-5 mb-6">
            <h2 className="font-bold text-lg text-white">{activeEvent.title}</h2>
            <p className="text-white/70 text-sm flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {activeEvent.dateLabel}{activeEvent.time ? `, ${activeEvent.time}` : ''}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {activeEvent.venue}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat accent icon={<Users size={20} />}
            label={totalInDb !== null && totalInDb !== stats.people ? `Total registrations (${stats.people} shown)` : 'Total registrations'}
            value={totalInDb ?? stats.people} />
          <Stat icon={<UserCheck size={20} />} label="Matching the filters" value={stats.people} />
          <Stat icon={<MessageCircle size={20} />} label="Confirmed" value={stats.confirmed} />
          <Stat icon={<CalendarDays size={20} />} label="Attended" value={stats.attended} />
        </div>

        {byInviter.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-[#10243E] flex items-center gap-2 mb-1">
              <UserCheck size={17} className="text-[#f26522]" /> Who is filling the hall
            </h2>
            <p className="text-xs text-gray-500 mb-4">Seats brought in by each name people typed on the form.</p>
            {byCode.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-100">
                {byCode.map((c) => (
                  <span key={c.label} className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-emerald-900">
                    <Tag size={11} className="inline mb-0.5 mr-1" />
                    <span className="font-mono font-semibold">{c.label}</span>
                    <strong className="ml-1.5">{c.seats}</strong>
                    <span className="text-emerald-700/70"> seat{c.seats === 1 ? '' : 's'}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {byInviter.map((b) => (
                <span key={b.label} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                  {b.label} <strong className="text-[#10243E] ml-1">{b.seats}</strong>
                  <span className="text-gray-400"> seat{b.seats === 1 ? '' : 's'}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-[#10243E]">
              {shown.length} registration{shown.length === 1 ? '' : 's'}
              {totalInDb !== null && totalInDb > shown.length && (
                <button
                  onClick={() => { setEventSlug('all'); setStatus('all'); setSearch(''); }}
                  className="ml-2 align-middle text-xs font-medium text-[#9C7C1C] underline underline-offset-2 hover:text-[#10243E]"
                >
                  {totalInDb - shown.length} hidden by a filter — show all
                </button>
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              <select value={eventSlug} onChange={(e) => setEventSlug(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                <option value="all">All events</option>
                {slugs.map((s) => <option key={s} value={s}>{EVENT_DETAILS[s]?.title || s}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f26522]">
                <option value="all">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / phone / invited by"
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#f26522] w-52" />
              </div>
              <button onClick={() => downloadCsv([
                ['Registered', 'Event', 'Name', 'Phone', 'Email', 'City', 'Seats', 'Interest', 'Invited by', 'Invite code', 'Notes', 'Status', 'Confirmation sent'],
                ...shown.map((r) => [
                  format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'), r.event_slug, r.full_name, r.phone,
                  r.email, r.city, r.guests, r.interest, r.invited_by, r.invite_code, r.notes, r.status,
                  r.confirmation_sent_at ? format(new Date(r.confirmation_sent_at), 'yyyy-MM-dd HH:mm') : '',
                ]),
              ], `event-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                disabled={!shown.length}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-md text-sm text-gray-600 hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50">
                <ArrowDownToLine size={16} /> CSV
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">
              Nothing here yet. Registrations appear the moment someone signs up on the event page.
            </p>
          ) : (
            <div className="space-y-3">
              {shown.map((r) => {
                const ev = EVENT_DETAILS[r.event_slug];
                return (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                    <div className="flex flex-wrap gap-3 justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#10243E]">
                          {r.full_name}
                          {r.guests > 1 && <span className="ml-2 text-xs font-medium bg-[#D4AF37]/15 text-[#9C7C1C] px-2 py-0.5 rounded">{r.guests} seats</span>}
                          {/* The sign-up told this person we would hold them a
                              priority seat. That promise is only real if it
                              reaches whoever lays out the hall — so it is a
                              badge, not a column buried in the CSV. */}
                          {r.invite_code && r.invite_code !== DEFAULT_CODE && (
                            <span className="ml-2 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <Tag size={11} /> PRIORITY · {r.invite_code}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{r.phone} · {r.email}{r.city ? ` · ${r.city}` : ''}</p>
                        {r.interest && <p className="text-sm text-gray-600 mt-1">Looking at: {r.interest.replace('-', ' ')}</p>}
                        {r.invited_by && (
                          <p className="text-sm text-gray-600 mt-1">
                            Invited by <strong className="text-[#10243E]">{r.invited_by}</strong>
                          </p>
                        )}
                        {r.notes && <p className="text-sm text-gray-600 mt-1">{r.notes}</p>}
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(r.created_at), 'd MMM yyyy, hh:mm a')}
                          {ev ? ` · ${ev.title}` : ` · ${r.event_slug}`}
                          {r.confirmation_sent_at ? ' · confirmation emailed' : ' · not emailed yet'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button onClick={() => confirmViaWhatsApp(r)}
                          title="Send the confirmation on WhatsApp and mark this seat confirmed"
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-green-300 bg-green-50 text-green-700 text-xs font-semibold hover:border-green-500">
                          <MessageCircle size={15} /> Confirm
                        </button>
                        <a href={`tel:${r.phone}`} title="Call"
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f26522] hover:text-[#f26522]"><Phone size={16} /></a>
                        <a href={`mailto:${r.email}`} title="Email"
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f26522] hover:text-[#f26522]"><Mail size={16} /></a>
                        <button onClick={() => resend(r)} disabled={busy}
                          title={r.confirmation_sent_at ? 'Send the confirmation email again' : 'Send the confirmation email'}
                          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f26522] hover:text-[#f26522] disabled:opacity-50"><Send size={16} /></button>
                        <select value={r.status} onChange={(e) => setRowStatus(r, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-2 outline-none ${STATUS_CLS[r.status]}`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-white/10 text-[#f26522]' : 'bg-orange-50 text-[#f26522]'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#10243E]'}`}>{value}</p>
      <p className={`text-sm ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}
