import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays, MapPin, Ticket, Users, ArrowRight, Check, Phone,
  MessageCircle, Loader2, Sparkles, ChevronDown, Navigation, Tag,
} from 'lucide-react';
import Seo from '../components/Seo';
import { getEvent } from '../data/eventDetails';
import { registerForEvent } from '../lib/eventRegistration';
import { absoluteUrl } from '../lib/seo';
import { site } from '../data/site';

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
    full_name: '', phone: '', email: '', city: '', guests: 1, interest: '', invited_by: '', notes: '',
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
          Dark, one message, and the register button never more than a thumb
          away. The animated field is CSS-only so it costs nothing on a phone
          and disappears entirely under prefers-reduced-motion. */}
      <header className="relative overflow-hidden bg-[#0A1016] text-white pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%)',
          }}
        />
        <div
          aria-hidden
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-[120px] ${reduce ? '' : 'animate-pulse'}`}
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 65%)' }}
        />

        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] border border-[#D4AF37]/35 rounded-full px-3.5 py-1.5 mb-6">
              <Sparkles size={13} /> Free investor seminar
            </p>

            <h1
              className="font-heading text-white text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl mb-5"
              style={{ textWrap: 'balance' }}
            >
              {ev.title}
            </h1>

            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-8" style={{ textWrap: 'balance' }}>
              {ev.tagline}
            </p>

            {/* Facts, not adjectives. Someone deciding whether to give up a
                Saturday needs when, where and what it costs — in that order. */}
            <dl className="grid sm:grid-cols-3 gap-px bg-white/10 rounded-lg overflow-hidden mb-8 max-w-3xl">
              <Fact Icon={CalendarDays} label="When" value={ev.dateLabel} sub={ev.time || 'Timing confirmed on WhatsApp'} />
              <Fact Icon={MapPin} label="Where" value={ev.venue} sub="Greater Noida" />
              <Fact Icon={Ticket} label="Entry" value="Free" sub={ev.seats} />
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#register"
                className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1016] px-7 py-3.5 rounded-sm font-bold transition-colors"
              >
                Reserve my seat <ArrowRight size={17} />
              </a>
              <a
                href={`tel:+${site.phone}`}
                className="inline-flex items-center gap-2 border border-white/25 hover:border-[#D4AF37] px-6 py-3.5 rounded-sm font-semibold text-sm transition-colors"
              >
                <Phone size={16} /> Call the team
              </a>
            </div>

            {left && (
              <div className="mt-10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Closing soon · Seminar starts in:
                </p>
                <div className="inline-flex items-center gap-1.5 sm:gap-2.5 bg-white/[0.08] border border-white/15 backdrop-blur-md rounded-lg p-2 sm:p-2.5">
                  {[
                    [left.days, 'Days'],
                    [left.hours, 'Hours'],
                    [left.mins, 'Mins'],
                    [left.secs, 'Secs'],
                  ].map(([n, l], idx) => (
                    <React.Fragment key={l}>
                      {idx > 0 && (
                        <span className="text-[#D4AF37]/60 font-mono font-bold text-lg sm:text-xl -mt-3.5 select-none">:</span>
                      )}
                      <div className="flex flex-col items-center bg-[#0A1016]/95 border border-white/10 rounded-md px-2.5 sm:px-3 py-1.5 min-w-[50px] sm:min-w-[58px]">
                        <span className="font-heading text-xl sm:text-2xl lg:text-3xl text-white font-bold tabular-nums leading-tight">
                          {String(n).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-medium text-white/60 tracking-wider mt-0.5 uppercase">
                          {l}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hosts. Named as two separate companies co-hosting — never as one
            organisation, and never with Capital Brix described as anything
            other than an authorised sales channel partner. */}
        <div className="relative max-w-5xl mx-auto px-6 mt-12 pt-8 border-t border-white/10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">Hosted by</p>
          <p className="font-heading text-xl sm:text-2xl text-white/90">
            {ev.hosts.join('  ·  ')}
          </p>
          <p className="text-xs text-white/45 mt-2 max-w-xl">
            Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd.
          </p>
        </div>
      </header>

      {/* ── Agenda + form ─────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1fr_minmax(360px,420px)] gap-12 lg:gap-16 items-start">

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

          {/* Who is on the platform that day. Each person is titled exactly as
              src/data/eventDetails.js has them — read the note there before
              editing either name or role. */}
          {ev.speakers?.length > 0 && (
            <div className="mt-12">
              <p className="text-[#9C7C1C] font-semibold tracking-[0.2em] uppercase text-xs mb-3">On the platform</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ev.speakers.map((sp) => (
                  <div key={sp.name} className="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
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

          <div className="mt-12 border border-gray-200 rounded-lg p-6 bg-gray-50">
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

          <div className="mt-12">
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
        </section>

        {/* ── The sign-up ────────────────────────────────────────────────
            Sticky on desktop so the form is on screen wherever the reader
            has got to; static on a phone, where sticky would eat the view. */}
        <section id="register" ref={formRef} className="lg:sticky lg:top-24 scroll-mt-24">
          <div className="rounded-xl border border-gray-200 shadow-[0_20px_60px_-30px_rgba(16,36,62,0.5)] overflow-hidden bg-white">
            <div className="bg-[#10243E] text-white px-6 py-5">
              <h2 className="font-heading text-white text-2xl leading-tight">
                {done ? 'You’re on the list' : 'Reserve your seat'}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                {done ? 'Keep this page — the details are below.' : 'VIP Pass · ₹0 (Standard ₹2,500 waived) · 30 seconds'}
              </p>
            </div>

            {done ? (
              <div className="p-6">
                <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <Check size={26} />
                </div>
                <p className="text-[#10243E] font-semibold mb-2">
                  {done.already
                    ? 'You had already registered with that email — your seat is held.'
                    : `Seat${form.guests > 1 ? 's' : ''} held for ${form.full_name.trim()}.`}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  {done.emailed
                    ? `A confirmation is on its way to ${form.email.trim()}. `
                    : 'Our team will confirm your seat on WhatsApp. '}
                  {ev.dateLabel}{ev.time ? `, ${ev.time}` : ''} — {ev.venue}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={ev.mapsUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold bg-[#D4AF37] text-[#0A1016] px-5 py-2.5 rounded-sm">
                    <MapPin size={15} /> Directions
                  </a>
                  <a
                    href={`https://wa.me/${site.phone}?text=${encodeURIComponent(`Hi Capital Brix, I have registered for "${ev.title}" on ${ev.dateLabel}.`)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold border border-gray-200 px-5 py-2.5 rounded-sm text-[#10243E] hover:border-[#D4AF37]">
                    <MessageCircle size={15} /> WhatsApp us
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="p-6 space-y-4">
                {error && (
                  <p role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-md p-3">{error}</p>
                )}

                <Field label="Full name" required>
                  <input required value={form.full_name} onChange={set('full_name')} autoComplete="name"
                    placeholder="Your name" className={INPUT} />
                </Field>

                <Field label="Mobile number" required>
                  <input required type="tel" inputMode="numeric" value={form.phone} onChange={set('phone')}
                    autoComplete="tel" placeholder="10-digit mobile" className={INPUT} />
                </Field>

                <Field label="Email" required hint="Your confirmation goes here">
                  <input required type="email" value={form.email} onChange={set('email')}
                    autoComplete="email" placeholder="you@example.com" className={INPUT} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input value={form.city} onChange={set('city')} autoComplete="address-level2"
                      placeholder="Noida" className={INPUT} />
                  </Field>
                  <Field label="Seats">
                    <select value={form.guests} onChange={set('guests')} className={INPUT}>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="What are you looking at?">
                  <div className="grid grid-cols-2 gap-2">
                    {INTERESTS.map((o) => {
                      const on = form.interest === o.value;
                      return (
                        <button
                          key={o.value} type="button"
                          onClick={() => setForm((f) => ({ ...f, interest: on ? '' : o.value }))}
                          aria-pressed={on}
                          className={`text-sm rounded-md border px-3 py-2.5 text-left transition ${
                            on
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#10243E] font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Free text, not a dropdown of staff names. The seminar is
                    filled by the team AND by word of mouth, and a dropdown
                    would silently drop the customer who referred a friend —
                    which is exactly the answer worth having. */}
                <Field label="Who invited you?" hint="Name of the person who told you about this event">
                  <input value={form.invited_by} onChange={set('invited_by')}
                    placeholder="e.g. Ujjwal, or a friend's name" className={INPUT} />
                </Field>

                {/* Auto-applied coupon & pricing breakdown */}
                <div className="rounded-lg border border-amber-200/80 bg-gradient-to-br from-[#FFFDF7] to-[#F7FBF9] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Ticket size={15} className="text-[#9C7C1C]" />
                      <span className="text-xs font-semibold text-[#10243E]">
                        Delegate Fee {Number(form.guests) > 1 ? `(${form.guests} seats)` : ''}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm line-through text-gray-400 font-semibold decoration-red-500/80">
                        ₹{(2500 * (Number(form.guests) || 1)).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xl font-extrabold text-[#10243E] font-heading">
                        ₹0
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200/80 rounded-md px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <Tag size={13} className="text-emerald-600 shrink-0" />
                      <span>Coupon <strong className="font-mono font-bold tracking-wide text-emerald-900 bg-emerald-100/80 px-1 py-0.5 rounded">CAPITALBRIX</strong> applied</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">100% OFF</span>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-tight flex items-center gap-1">
                    <Check size={12} className="text-emerald-600 shrink-0" />
                    <span>Complimentary VIP pass sponsored by Capital Brix & Mirrikh Infratech.</span>
                  </p>
                </div>

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
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] font-bold py-3.5 rounded-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {busy ? <><Loader2 size={17} className="animate-spin" /> Holding your seat…</>
                        : <>Reserve my seat <ArrowRight size={17} /></>}
                </motion.button>

                <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-1.5">
                  <Users size={13} className="shrink-0 mt-0.5" />
                  We use your details only to confirm this seminar and to reach you about Dholera. No charge, no obligation to buy.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const INPUT =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-md text-[#10243E] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition';

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}{required && <span className="text-[#9C7C1C]"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function Fact({ Icon, label, value, sub }) {
  return (
    <div className="bg-[#0A1016] px-5 py-4">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
        <Icon size={12} /> {label}
      </p>
      <p className="font-heading text-lg leading-snug text-white">{value}</p>
      <p className="text-xs text-white/50 mt-0.5">{sub}</p>
    </div>
  );
}
