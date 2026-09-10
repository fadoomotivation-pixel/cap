import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays, MapPin, Ticket, ArrowRight, Check,
  MessageCircle, Loader2, Sparkles, ChevronDown, Navigation, Tag, Plus,
} from 'lucide-react';
import Seo from '../components/Seo';
import { getEvent } from '../data/eventDetails';
import { registerForEvent } from '../lib/eventRegistration';
import { absoluteUrl } from '../lib/seo';
import { site } from '../data/site';
import EventPass from '../components/EventPass';

const INTERESTS = [
  { value: 'residential',    label: 'Residential plot' },
  { value: 'commercial',     label: 'Commercial plot' },
  { value: 'industrial',     label: 'Industrial plot' },
  { value: 'just-exploring', label: 'Just exploring' },
];

/** Days / hours / minutes / seconds left, recomputed every second. Rendered only after
 *  mount — a countdown baked into prerendered HTML would ship a stale number
 *  and mismatch on hydration. */
function useCountdown(dateIso) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    if (!now) return null;
    const ms = new Date(`${dateIso}T09:00:00+05:30`).getTime() - now;
    if (ms <= 0) return null;
    return {
      days: Math.floor(ms / 864e5),
      hours: Math.floor((ms % 864e5) / 36e5),
      mins: Math.floor((ms % 36e5) / 6e4),
      secs: Math.floor((ms % 6e4) / 1000),
    };
  }, [now, dateIso]);
}

export default function EventRegistration() {
  const { slug } = useParams();
  const ev = getEvent(slug);
  const reduce = useReducedMotion();
  const formRef = useRef(null);
  const left = useCountdown(ev?.date || '2099-01-01');

  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', city: '', guests: 1, interest: '', invited_by: '', invite_code: '', notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  if (!ev) {
    return (
      <div className="min-h-screen pt-32 pb-24 text-center px-6">
        <Seo title="Event not found | Capital Brix" noIndex />
        <h1 className="font-heading text-3xl text-[#10243E] mb-3">That event has finished</h1>
        <p className="text-gray-500 mb-6">Have a look at what else is coming up.</p>
        <Link to="/events" className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0A1016] px-6 py-3 rounded-sm font-semibold">
          All events <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [showMore, setShowMore] = useState(false);

  // The honest version of a coupon.
  //
  // Entry is free, so there is no discount to give and no saving to advertise —
  // that is exactly what got the invented ₹2,500 "delegate fee" removed. But a
  // code can still do two real things, and both are things HR can act on:
  // it flags the seat as priority in /admin/events so someone actually holds
  // one, and it records which handout, poster or WhatsApp forward brought the
  // person in. Nothing here promises money off.
  const PRIORITY_CODES = ['CAPITALBRIX', 'DHOLERA2026'];
  const codeEntered = form.invite_code.trim().toUpperCase();
  const codeValid = PRIORITY_CODES.includes(codeEntered);
  const setCode = (e) =>
    setForm((f) => ({ ...f, invite_code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24) }));

  // Ten digits, and a pasted country code handled properly rather than cut off.
  //
  // "+91 98765 43210" is twelve digits. Keeping the first ten gives 9198765432
  // — a plausible-looking number that is not theirs, saved with no warning and
  // impossible to dial. So an over-long value has a leading 91 or 0 stripped
  // first, falling back to a plain trim when stripping does not leave ten
  // digits, which is the typed-an-11th-character case.
  const setPhone = (e) => {
    let d = e.target.value.replace(/\D/g, '');
    if (d.length > 10) {
      const stripped = d.replace(/^(?:91|0+)/, '');
      d = stripped.length >= 10 ? stripped : d;
    }
    setForm((f) => ({ ...f, phone: d.slice(0, 10) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const res = await registerForEvent({ ...form, event_slug: ev.slug });
    setBusy(false);
    if (res.error) return setError(res.error);
    setDone(res);
    window.scrollTo({ top: formRef.current?.offsetTop - 80 || 0, behavior: 'smooth' });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.tagline,
    startDate: ev.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.venue,
      address: { '@type': 'PostalAddress', streetAddress: ev.venueFull, addressCountry: 'IN' },
    },
    organizer: ev.hosts.map((h) => ({ '@type': 'Organization', name: h })),
    ...(ev.speakers?.length
      ? { performer: ev.speakers.map((sp) => ({ '@type': 'Person', name: sp.name, jobTitle: sp.role })) }
      : {}),
    offers: {
      '@type': 'Offer',
      price: '0', priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/events/${ev.slug}`),
    },
    url: absoluteUrl(`/events/${ev.slug}`),
  };

  return (
    <div className="font-outfit bg-white">
      <Seo
        title={`${ev.title} | Free Seminar, 13 Sept 2026, Greater Noida`}
        description={`${ev.tagline}. ${ev.dateLabel} at ${ev.venue}, Greater Noida. Hosted by Mirrikh Group and Capital Brix LLP. Free entry, limited seats — register online.`}
        path={`/events/${ev.slug}`}
        jsonLd={jsonLd}
      />

      {/* ── Hero ───────────────────────────────────────────────────────────
          A pass at making this weightless — no boxes, huge type — was tried and
          rejected: it read as a poster, not as an event you can sign up to. The
          boxed facts bar and the ticking countdown are doing real work here, so
          they stay. Only the spacing and the type scale were touched. */}
      <header className="relative overflow-hidden bg-[#0A1016] text-white pt-24 pb-12 sm:pt-28 sm:pb-16 text-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,175,55,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.45) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%)',
          }}
        />
        <div
          aria-hidden
          className={`absolute -top-36 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full blur-[100px] ${reduce ? '' : 'animate-pulse'}`}
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 65%)' }}
        />

        <div className="relative max-w-4xl mx-auto px-5">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/35 rounded-full px-3 py-1 mb-4">
              <Sparkles size={12} /> Free investor seminar
            </div>

            <h1
              className="font-heading text-white text-[2rem] sm:text-[2.75rem] lg:text-5xl leading-[1.1] mb-3"
              style={{ textWrap: 'balance', letterSpacing: '-0.02em' }}
            >
              {ev.title}
            </h1>

            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-5" style={{ textWrap: 'balance' }}>
              {ev.tagline}
            </p>

            {/* Compact Key facts bar */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-white/90 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 mb-5 border border-white/10">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-[#D4AF37]" /> {ev.dateLabel} ({ev.time || '10:30 AM'})
              </span>
              <span className="hidden sm:inline text-white/30">·</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#D4AF37]" /> {ev.venue}, Greater Noida
              </span>
              <span className="hidden sm:inline text-white/30">·</span>
              <span className="flex items-center gap-1.5">
                <Ticket size={13} className="text-[#D4AF37]" /> Free VIP Entry ({ev.seats})
              </span>
            </div>

            {/* Countdown timer with seconds */}
            {left && (
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-white/80 mb-3">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Starts in:
                </span>
                <div className="inline-flex items-center gap-1 bg-white/[0.08] border border-white/15 backdrop-blur-md rounded-lg p-1">
                  {[
                    [left.days, 'Days'],
                    [left.hours, 'Hrs'],
                    [left.mins, 'Min'],
                    [left.secs, 'Sec'],
                  ].map(([n, l], idx) => (
                    <React.Fragment key={l}>
                      {idx > 0 && <span className="text-[#D4AF37]/60 font-mono font-bold text-xs select-none">:</span>}
                      <div className="flex flex-col items-center bg-[#0A1016]/95 border border-white/10 rounded px-1.5 py-0.5 min-w-[40px] sm:min-w-[44px]">
                        <span className="font-heading text-base sm:text-lg text-white font-bold tabular-nums leading-none">
                          {String(n).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] font-medium text-white/60 tracking-wider uppercase">{l}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-white/45">
              Hosted jointly by {ev.hosts.join(' & ')} · Capital Brix is an authorised sales channel partner for Mirrikh Infratech
            </p>
          </motion.div>
        </div>
      </header>

      {/* ── The Sign-up Form (Directly below hero, compact 1-screen fit) ──── */}
      <section id="register" ref={formRef} className="relative z-10 -mt-6 sm:-mt-8 max-w-2xl mx-auto px-4">
        <div className="rounded-xl border border-gray-200 shadow-[0_15px_45px_-20px_rgba(16,36,62,0.35)] overflow-hidden bg-white">
          {/* Header. The gold coupon chip is Antigravity's and it works — a
              code that is already applied reads as a small win before anyone
              has typed anything. What is NOT here is the "(Was ₹2,500)" it used
              to carry: no delegate fee was ever charged, so that saving was
              measured against a number that never existed, which is a
              misleading price claim. The chip keeps the coupon language and
              drops the invented price. */}
          <div className="bg-[#10243E] text-white px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-white text-xl sm:text-2xl leading-tight">
                {done ? 'You’re on the list' : 'Reserve your seat'}
              </h2>
              <p className="text-white/60 text-xs mt-0.5">
                {done
                  ? 'Save your pass below — show it at the door.'
                  : 'Takes ~30 seconds · No payment at any point'}
              </p>
            </div>
            {!done && (
              <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] px-2.5 py-1 rounded text-xs font-semibold">
                <Sparkles size={12} /> VIP Pass · Free entry
              </div>
            )}
          </div>

          {done ? (
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                <Check size={22} />
              </div>
              <p className="text-[#10243E] font-semibold text-base mb-1.5">
                {done.already
                  ? 'You had already registered with that email — your seat is held.'
                  : `Seat${form.guests > 1 ? 's' : ''} held for ${form.full_name.trim()}.`}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                {done.emailed
                  ? `A confirmation is on its way to ${form.email.trim()}. `
                  : 'Our team will confirm your seat on WhatsApp. '}
                {ev.dateLabel}{ev.time ? `, ${ev.time}` : ''} — {ev.venue}.
              </p>
              {/* The pass, as an image they can save and show at the door.
                  Otherwise the thing people actually do is screenshot this
                  panel, which comes out cropped and half-scrolled. */}
              <EventPass ev={ev} name={form.full_name} seats={Number(form.guests) || 1} id={done.id} />

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <a href={ev.mapsUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-gray-200 px-4 py-2 rounded-sm text-[#10243E] hover:border-[#D4AF37]">
                  <MapPin size={14} /> Directions
                </a>
                <a
                  href={`https://wa.me/${site.phone}?text=${encodeURIComponent(`Hi Capital Brix, I have registered for "${ev.title}" on ${ev.dateLabel}.`)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-gray-200 px-4 py-2 rounded-sm text-[#10243E] hover:border-[#D4AF37]">
                  <MessageCircle size={14} /> WhatsApp us
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="p-4 sm:p-5 space-y-3">
              {error && (
                <p role="alert" className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-md p-2.5">{error}</p>
              )}

              {/* One screen, in order of what we actually need.
                  Three required fields, a seat count and a code — everything
                  else is behind a disclosure, because a city and a plot-type
                  preference are not worth a taller form than the phone screen
                  they are being filled in on. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Full name" required>
                  <input required value={form.full_name} onChange={set('full_name')} autoComplete="name"
                    placeholder="Your name" className={INPUT} />
                </Field>

                <Field label="Mobile number" required>
                  <input required type="tel" inputMode="numeric" value={form.phone} onChange={setPhone}
                    autoComplete="tel" placeholder="10-digit mobile" className={INPUT} />
                </Field>
              </div>

              <Field label="Email" required hint="Your pass and confirmation go here">
                <input required type="email" value={form.email} onChange={set('email')}
                  autoComplete="email" placeholder="you@example.com" className={INPUT} />
              </Field>

              <div className="grid grid-cols-[auto_1fr] gap-2.5 items-end">
                <Field label="Seats">
                  <select value={form.guests} onChange={set('guests')} className={`${INPUT} w-auto pr-8`}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>

                <Field label="Invite code" hint={codeValid ? undefined : 'Optional'}>
                  <input value={form.invite_code} onChange={setCode}
                    placeholder="e.g. DHOLERA2026"
                    className={`${INPUT} font-mono tracking-wider ${codeValid ? 'border-emerald-400 bg-emerald-50/50' : ''}`} />
                </Field>
              </div>

              {/* Antigravity's coupon card, kept. The layout is theirs — entry
                  on the left, an applied-coupon chip on the right — and it does
                  read well. Two things are different: the struck-through
                  ₹2,500 is gone, because no fee was ever charged and a saving
                  against a price we never asked for is a misleading price
                  claim; and the chip now promises a held seat rather than
                  "100% OFF", which is a discount off nothing.

                  /admin/events flags the row PRIORITY so the promise is one HR
                  can actually keep. */}
              <div className="rounded-md border border-emerald-200/80 bg-[#F7FBF9] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    Entry{Number(form.guests) > 1 ? ` (${form.guests} seats)` : ''}:
                  </span>
                  <span className="text-base font-extrabold text-[#10243E] font-heading">Free</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    NO CHARGE
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                  <Tag size={12} className="text-emerald-600 shrink-0" />
                  <span>
                    Coupon{' '}
                    <strong className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">
                      {codeValid ? codeEntered : 'CAPITALBRIX'}
                    </strong>{' '}
                    applied
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                    {codeValid ? 'PRIORITY SEAT' : 'FREE ENTRY'}
                  </span>
                </div>
              </div>

              {/* Optional details, out of the way until asked for. */}
              {!showMore ? (
                <button type="button" onClick={() => setShowMore(true)}
                  className="text-xs font-medium text-[#9C7C1C] hover:text-[#10243E] inline-flex items-center gap-1.5">
                  <Plus size={13} /> Add city, referrer and what you&rsquo;re looking at
                </button>
              ) : (
                <div className="space-y-2.5 pt-1 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5">
                    <Field label="City">
                      <input value={form.city} onChange={set('city')} autoComplete="address-level2"
                        placeholder="e.g. Noida / Delhi" className={INPUT} />
                    </Field>

                    {/* Free text, not a dropdown of staff names — a dropdown
                        silently drops the customer who referred a friend, which
                        is the answer worth having. */}
                    <Field label="Who invited you?">
                      <input value={form.invited_by} onChange={set('invited_by')}
                        placeholder="e.g. Ujjwal, or a friend's name" className={INPUT} />
                    </Field>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      What are you looking at?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {INTERESTS.map((o) => {
                        const on = form.interest === o.value;
                        return (
                          <button
                            key={o.value} type="button"
                            onClick={() => setForm((f) => ({ ...f, interest: on ? '' : o.value }))}
                            aria-pressed={on}
                            className={`text-xs py-1.5 px-2 rounded border text-center transition font-medium truncate ${
                              on
                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#10243E] font-semibold'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 6: Submit Button with Shake */}
              <motion.button
                type="submit" disabled={busy}
                initial={{ x: 0 }}
                whileInView={reduce ? {} : {
                  x: [0, -6, 6, -5, 5, -3, 3, -1, 1, 0],
                  transition: {
                    duration: 0.7,
                    delay: 0.3,
                    ease: 'easeInOut',
                  }
                }}
                viewport={{ once: true, amount: 0.7 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] font-bold py-3 rounded-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-60 text-sm"
              >
                {busy ? <><Loader2 size={16} className="animate-spin" /> Holding your seat…</>
                      : <>Reserve my seat <ArrowRight size={16} /></>}
              </motion.button>

              <p className="text-[10px] text-gray-400 text-center leading-tight">
                {/* "sponsored by Capital Brix & Mirrikh Infratech" said who is
                    bearing the cost of the event — a statement about Mirrikh's
                    commercial arrangements, made on their behalf, which is the
                    first of the two rules in CLAUDE.md. What we can say is that
                    the seat is free and nothing is being sold. */}
                Entry is free and there is no obligation to buy anything on the day.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Agenda & Details (Follows the form) ───────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-20 space-y-16">
        <section>
          <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">What we will cover</p>
          <h2 className="font-heading text-3xl sm:text-4xl text-[#10243E] leading-tight mb-8" style={{ textWrap: 'balance' }}>
            Two hours that change how you look at land
          </h2>

          <ol className="space-y-6">
            {ev.agenda.map((a, i) => (
              <motion.li
                key={a.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                className="flex gap-4"
              >
                <span className="shrink-0 w-9 h-9 rounded-full bg-[#10243E] text-[#D4AF37] font-heading text-sm flex items-center justify-center">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-heading text-xl text-[#10243E] leading-snug mb-1">{a.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{a.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* Speakers */}
          {ev.speakers?.length > 0 && (
            <div className="mt-14">
              <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">On the platform</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ev.speakers.map((sp) => (
                  <div key={sp.name} className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <span
                      aria-hidden
                      className="shrink-0 w-12 h-12 rounded-full bg-[#10243E] text-[#D4AF37] font-heading text-base flex items-center justify-center"
                    >
                      {sp.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-lg text-[#10243E] leading-tight">{sp.name}</p>
                      <p className="text-sm text-gray-500 leading-snug">{sp.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue / Getting there */}
          <div className="mt-14 border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="font-heading text-lg text-[#10243E] mb-1 flex items-center gap-2">
              <Navigation size={17} className="text-[#9C7C1C]" /> Getting there
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{ev.venueFull}</p>
            <a
              href={ev.mapsUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#10243E] border-b border-[#D4AF37] pb-0.5 hover:text-[#9C7C1C]"
            >
              Open in Google Maps <ArrowRight size={14} />
            </a>
          </div>

          {/* FAQs */}
          <div className="mt-14">
            <h2 className="font-heading text-2xl text-[#10243E] mb-5">Before you ask</h2>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {ev.faqs.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-[#10243E]">
                    {f.q}
                    <ChevronDown size={17} className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-gray-600 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Bottom Back-to-Form CTA */}
          <div className="mt-14 text-center pt-8 border-t border-gray-200">
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: formRef.current?.offsetTop - 80 || 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] font-bold px-7 py-3.5 rounded-sm transition-colors shadow-md text-sm"
            >
              Reserve your free seat <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

const INPUT =
  'w-full px-3 py-2 border border-gray-200 rounded-md text-[#10243E] text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition bg-white';

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}{required && <span className="text-[#9C7C1C]"> *</span>}
        </span>
        {hint && <span className="text-[10px] text-gray-400 font-normal">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
