import React, { useRef, useState, useEffect } from 'react';
import { Download, CalendarPlus, Loader2 } from 'lucide-react';

/**
 * The registrant's pass, as a real image they can save and show at the door.
 *
 * Drawn on a canvas rather than screenshotted from the DOM, for three reasons:
 * html2canvas is 200KB for one screen; a DOM screenshot inherits the page's
 * responsive layout, so the saved file looks different on every phone; and a
 * canvas gives a fixed 1080×1350 that is the right shape to send on WhatsApp.
 *
 * Everything is drawn with primitives and system-stack text — no external font
 * or image is loaded, so the download cannot fail or stall on a bad connection
 * at the moment the person most wants it.
 */

const W = 1080;
const H = 1350;
const GOLD = '#D4AF37';
const INK = '#0A1016';

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

/** Wrap text to a pixel width, returning the lines. Canvas has no wrapping. */
function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawPass(canvas, { ev, name, seats, ref }) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  // Ground + a soft gold bloom, the same two colours as the page.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
  glow.addColorStop(0, 'rgba(212,175,55,0.22)');
  glow.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 900);

  // Grid, masked to the top third so it reads as texture, not graph paper.
  ctx.strokeStyle = 'rgba(212,175,55,0.10)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 620); ctx.stroke();
  }
  for (let y = 0; y <= 620; y += 90) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const PAD = 84;
  let y = 150;

  // Eyebrow
  ctx.fillStyle = GOLD;
  ctx.font = `bold 26px ${SANS}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('FREE INVESTOR SEMINAR', PAD, y);
  ctx.letterSpacing = '0px';

  // Title
  y += 40;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 78px ${SANS}`;
  for (const line of wrap(ctx, ev.title, W - PAD * 2)) {
    y += 88;
    ctx.fillText(line, PAD, y);
  }

  // Hosts
  y += 62;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = `36px ${SANS}`;
  ctx.fillText(ev.hosts.join('  ·  '), PAD, y);

  // Divider
  y += 56;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();

  // ── The three facts someone needs at the door ──────────────────────────
  const row = (label, value, extra) => {
    y += 74;
    ctx.fillStyle = GOLD;
    ctx.font = `bold 24px ${SANS}`;
    ctx.letterSpacing = '4px';
    ctx.fillText(label.toUpperCase(), PAD, y);
    ctx.letterSpacing = '0px';
    y += 46;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 42px ${SANS}`;
    const lines = wrap(ctx, value, W - PAD * 2);
    ctx.fillText(lines[0], PAD, y);
    for (const l of lines.slice(1)) { y += 50; ctx.fillText(l, PAD, y); }
    if (extra) {
      y += 44;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `32px ${SANS}`;
      for (const l of wrap(ctx, extra, W - PAD * 2)) { ctx.fillText(l, PAD, y); y += 40; }
      y -= 40;
    }
  };

  row('Admits', `${name}${seats > 1 ? `  +${seats - 1}` : ''}`, seats > 1 ? `${seats} seats reserved` : '1 seat reserved');
  row('When', ev.dateLabel, ev.time || 'Timing confirmed on WhatsApp');
  row('Where', ev.venue, ev.venueFull);

  // ── Footer band ────────────────────────────────────────────────────────
  const bandY = H - 200;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, bandY, W, 200);

  ctx.fillStyle = GOLD;
  ctx.font = `bold 24px ${SANS}`;
  ctx.letterSpacing = '4px';
  ctx.fillText('CAPITAL BRIX LLP', PAD, bandY + 62);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `28px ${SANS}`;
  ctx.fillText('Please carry a photo ID · Entry free', PAD, bandY + 110);
  ctx.fillText('WhatsApp +91 70489 17300', PAD, bandY + 152);

  // Reference, right-aligned. Short enough to read out on a phone call.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `26px ${SANS}`;
  ctx.fillText(`REF ${ref}`, W - PAD, bandY + 152);
  ctx.textAlign = 'left';
}

/** Start and end of the seminar as UTC stamps, which is what both Google
 *  Calendar's URL and an .ics file want. 10:30–14:00 IST on the event date. */
function stamps(ev) {
  const at = (h, m) => new Date(`${ev.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`)
    .toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return { start: at(10, 30), end: at(14, 0) };
}

/** Google Calendar, which is what almost everyone here actually uses.
 *
 *  A downloaded .ics on Android is a file in Downloads that most people never
 *  open; this opens Google Calendar with the event already filled in and one
 *  Save button. The .ics stays as the second option for Apple and Outlook. */
function googleCalendarUrl(ev) {
  const { start, end } = stamps(ev);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
    location: ev.venueFull,
    details: `${ev.tagline}. Hosted by ${ev.hosts.join(' and ')}. Please carry a photo ID. Questions: https://wa.me/917048917300`,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** An .ics for Apple Calendar and Outlook. Built by hand — a library for
 *  six lines of text is not worth the bytes. */
function icsFile(ev) {
  // 10:30–14:00 IST on the event date, written as UTC.
  const day = ev.date.replace(/-/g, '');
  const { start, end } = stamps(ev);
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Capital Brix//Event//EN',
    'BEGIN:VEVENT',
    `UID:${ev.slug}-${day}@capitalbrix.co.in`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(ev.venueFull)}`,
    `DESCRIPTION:${esc(`${ev.tagline}. Hosted by ${ev.hosts.join(' and ')}. Please carry a photo ID.`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick, not immediately — Safari reads the blob
  // asynchronously and a same-tick revoke gives it an empty file.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function EventPass({ ev, name, seats = 1, id }) {
  const canvasRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');

  // Reference the person can read out on the phone. The row id is a UUID,
  // which nobody can dictate; its last six characters are plenty for HR to
  // find one registration among a few hundred.
  const ref = (id || '').replace(/-/g, '').slice(-6).toUpperCase() || '——————';

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawPass(c, { ev, name, seats, ref });
    try { setPreview(c.toDataURL('image/png')); } catch { /* tainted canvas cannot happen here */ }
  }, [ev, name, seats, ref]);

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    const filename = `capital-brix-pass-${(name || 'guest').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    if (c.toBlob) {
      c.toBlob((blob) => { if (blob) save(blob, filename); setBusy(false); }, 'image/png');
    } else {
      // Older Safari has no toBlob.
      const data = c.toDataURL('image/png').split(',')[1];
      const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
      save(new Blob([bytes], { type: 'image/png' }), filename);
      setBusy(false);
    }
  };

  const addToCalendar = () =>
    save(new Blob([icsFile(ev)], { type: 'text/calendar;charset=utf-8' }), `${ev.slug}.ics`);

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      {preview && (
        <img
          src={preview}
          alt={`Entry pass for ${name} — ${ev.title}, ${ev.dateLabel}`}
          className="w-full rounded-lg border border-gray-200 mb-4"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={download} disabled={busy}
          className="inline-flex items-center gap-2 text-sm font-semibold bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-5 py-2.5 rounded-sm transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Save pass
        </button>
        <a
          href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold border border-gray-200 px-5 py-2.5 rounded-sm text-[#10243E] hover:border-[#D4AF37] transition-colors"
        >
          <CalendarPlus size={15} /> Google Calendar
        </a>
      </div>
      <button
        onClick={addToCalendar}
        className="mt-2 text-[11px] text-gray-400 hover:text-[#9C7C1C] underline underline-offset-2"
      >
        Apple Calendar / Outlook (.ics)
      </button>
    </div>
  );
}
