import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Copy, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Seo from '../components/Seo';

/**
 * The daily Dholera update as a WhatsApp-status image.
 *
 * The `dholera-news` agent posts the day's story to the team at 14:10 with a
 * link here. This page draws it as a 1080×1920 image — the exact shape of a
 * status — and hands it to the phone's share sheet, which on Android offers
 * WhatsApp → My status directly. One tap from the group message to a story.
 *
 * Each salesperson can put their own name and number on the footer, kept in
 * this browser only. A status is seen by that person's own contacts; the
 * number on it should be the one those contacts will actually call.
 *
 * Drawn on a canvas with system fonts, like the event pass: no external font
 * or image to stall on a weak connection, and the same picture on every phone.
 * Devanagari renders from the phone's own Hindi font.
 */

const W = 1080;
const H = 1920;
const GOLD = '#D4AF37';
const INK = '#0A1016';
const FONT = '"Noto Sans Devanagari", "Nirmala UI", Mangal, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
const COMPANY_PHONE = '+91 70489 17300';
const KEY = 'cb-story-signature';

function wrap(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
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

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    .format(new Date(`${d}T12:00:00+05:30`));

function drawStory(canvas, news, sig) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  const PAD = 84;
  const inner = W - PAD * 2;

  // Ground, a gold bloom at the top, a faint grid — the site's own palette.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1822');
  bg.addColorStop(1, INK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 1000);
  glow.addColorStop(0, 'rgba(212,175,55,0.24)');
  glow.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 1000);
  ctx.strokeStyle = 'rgba(212,175,55,0.07)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 760); ctx.stroke(); }
  for (let y = 0; y <= 760; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  let y = 190;
  ctx.textBaseline = 'alphabetic';

  // Kicker
  ctx.fillStyle = GOLD;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText('DHOLERA UPDATE', PAD, y);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 36px ${FONT}`;
  const date = fmtDate(news.news_date);
  ctx.fillText(date, W - PAD - ctx.measureText(date).width, y);
  y += 36;
  ctx.fillStyle = GOLD;
  ctx.fillRect(PAD, y, 140, 6);
  y += 110;

  // Headline — shrinks until it fits in five lines.
  const main = news.headline_hi || news.headline_en || '';
  let size = 88;
  let lines;
  do {
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrap(ctx, main, inner);
    if (lines.length <= 5) break;
    size -= 6;
  } while (size > 56);
  ctx.fillStyle = '#ffffff';
  for (const l of lines) { ctx.fillText(l, PAD, y); y += size * 1.28; }

  if (news.headline_hi && news.headline_en) {
    y += 6;
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `italic 500 38px ${FONT}`;
    for (const l of wrap(ctx, news.headline_en, inner).slice(0, 3)) { ctx.fillText(l, PAD, y); y += 50; }
  }

  // Points
  // Up to four points, from the full article. The font steps down until they
  // fit above the footer — a status image that overflows its own footer is
  // the one thing worse than a shorter one.
  const points = (Array.isArray(news.points) ? news.points : []).slice(0, 4);
  if (points.length) {
    y += 50;
    const room = H - 300 - 260 - y - (news.why_it_matters ? 200 : 0);
    let ps = 46;
    const height = (sz) => {
      ctx.font = `600 ${sz}px ${FONT}`;
      return points.reduce((h, p) => h + wrap(ctx, p, inner - 56).length * sz * 1.35 + 18, 0);
    };
    while (ps > 32 && height(ps) > room) ps -= 2;
    ctx.font = `600 ${ps}px ${FONT}`;
    for (const p of points) {
      const pl = wrap(ctx, p, inner - 56);
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(PAD + 14, y - ps * 0.33, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2f2f2';
      for (const l of pl) { ctx.fillText(l, PAD + 56, y); y += ps * 1.35; }
      y += 18;
    }
  }

  // Why it matters
  if (news.why_it_matters) {
    y += 30;
    ctx.font = `600 42px ${FONT}`;
    const wl = wrap(ctx, news.why_it_matters, inner - 60);
    const boxH = wl.length * 58 + 56;
    ctx.fillStyle = 'rgba(212,175,55,0.12)';
    ctx.fillRect(PAD, y - 50, inner, boxH);
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, y - 50, 10, boxH);
    ctx.fillStyle = '#fff6d6';
    for (const l of wl) { ctx.fillText(l, PAD + 40, y + 6); y += 58; }
    y += 56;
  }

  // Source — always printed: this is somebody else's reporting.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `500 30px ${FONT}`;
  const src = `Source: ${news.source_name || 'news report'}${news.published_at ? ` · ${fmtDate(news.published_at.slice(0, 10))}` : ''}`;
  for (const l of wrap(ctx, src, inner)) { ctx.fillText(l, PAD, Math.min(y + 30, H - 360)); y += 40; }

  // Footer
  const FY = H - 300;
  ctx.fillStyle = 'rgba(212,175,55,0.95)';
  ctx.fillRect(0, FY, W, 300);
  ctx.fillStyle = INK;
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText('CAPITAL BRIX LLP', PAD, FY + 86);
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText('Plots near Dholera Smart City', PAD, FY + 140);
  const who = sig?.name?.trim();
  const phone = sig?.phone?.trim() || COMPANY_PHONE;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(who ? `${who} · ${phone}` : `Call / WhatsApp ${phone}`, PAD, FY + 214);
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText('www.capitalbrix.co.in', PAD, FY + 262);
}

export default function DholeraStory() {
  const { date } = useParams();
  const canvasRef = useRef(null);
  // A day can carry two or three stories since the founder became the editor;
  // each gets its own image, picked with the chips above the canvas.
  const [list, setList] = useState([]);
  const [idx, setIdx] = useState(0);
  const news = list[idx] || null;
  const [state, setState] = useState('loading'); // loading | ready | missing
  const [sig, setSig] = useState({ name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) setSig({ name: saved.name || '', phone: saved.phone || '' });
    } catch { /* private window */ }
  }, []);

  useEffect(() => {
    (async () => {
      let day = date;
      if (!day) {
        const { data } = await supabase.from('cb_dholera_news').select('news_date')
          .eq('status', 'posted').order('news_date', { ascending: false }).limit(1).maybeSingle();
        day = data?.news_date;
      }
      if (!day) { setState('missing'); return; }
      // Anonymous visitors only ever receive posted rows (RLS). An admin also
      // sees the day's candidates, which is how the desk previews an image
      // before it is shared — badged on screen so it is never mistaken.
      const { data } = await supabase.from('cb_dholera_news').select('*')
        .eq('news_date', day).neq('status', 'skipped').order('rank');
      const rows = (data || []).filter((r) => r.headline_en);
      rows.sort((a, b) => (a.status === 'posted' ? 0 : 1) - (b.status === 'posted' ? 0 : 1) || a.rank - b.rank);
      const want = Number(new URLSearchParams(window.location.search).get('s'));
      const at = rows.findIndex((r) => r.rank === want);
      setList(rows);
      setIdx(at >= 0 ? at : 0);
      setState(rows.length ? 'ready' : 'missing');
    })();
  }, [date]);

  useEffect(() => {
    if (news && canvasRef.current) drawStory(canvasRef.current, news, sig);
  }, [news, sig]);

  const saveSig = (next) => {
    setSig(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const caption = news
    ? [news.headline_hi || news.headline_en, ...(news.points || []).map((p) => `• ${p}`),
       `Source: ${news.source_name || 'news report'}`,
       sig.name ? `— ${sig.name}${sig.phone ? `, ${sig.phone}` : ''}` : `— Capital Brix LLP, ${COMPANY_PHONE}`]
      .filter(Boolean).join('\n')
    : '';

  const blob = useCallback(
    () => new Promise((res) => canvasRef.current.toBlob((b) => res(b), 'image/png')),
    [],
  );
  const fileName = news ? `dholera-update-${news.news_date}-${news.rank}.png` : 'dholera-update.png';

  const download = async () => {
    const b = await blob();
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setDone('Saved — open WhatsApp → Status → pick this image.');
  };

  const share = async () => {
    setBusy(true); setDone('');
    try {
      const b = await blob();
      const file = new File([b], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        setDone('Shared.');
      } else {
        await download();
      }
    } catch (e) {
      if (e?.name !== 'AbortError') await download();
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(caption); setDone('Text copied.'); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#0A1016] pt-[100px] pb-16 px-4">
      <Seo title="Dholera Update | Capital Brix" noIndex />
      <div className="max-w-md mx-auto">
        <p className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-2">Today's Dholera update</p>
        <h1 className="text-white text-2xl font-bold mb-4">Put it on your status</h1>

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-white/70"><Loader2 className="animate-spin" size={18} /> Loading…</div>
        )}
        {state === 'missing' && (
          <div className="text-white/80 bg-white/5 border border-white/10 rounded-xl p-4">
            No update for this date yet. <Link to="/story" className="text-[#D4AF37] underline">See the latest one</Link>.
          </div>
        )}

        {state === 'ready' && (
          <>
            {list.length > 1 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {list.map((r, i) => (
                  <button key={r.id} onClick={() => setIdx(i)}
                    className={`shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full border ${
                      i === idx ? 'bg-[#D4AF37] text-[#0A1016] border-[#D4AF37]' : 'text-white/80 border-white/20'
                    }`}>
                    Story {i + 1}
                  </button>
                ))}
              </div>
            )}
            {news.status !== 'posted' && (
              <p className="text-amber-300 text-xs mb-2">Preview — not shared with the team yet.</p>
            )}
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl shadow-2xl border border-white/10"
              style={{ aspectRatio: '9 / 16' }}
            />

            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                onClick={share}
                disabled={busy}
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-xl py-3.5 text-base disabled:opacity-60"
              >
                {busy ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />} Share to WhatsApp status
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={download} className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold rounded-xl py-3">
                  <Download size={16} /> Download
                </button>
                <button onClick={copy} className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold rounded-xl py-3">
                  <Copy size={16} /> Copy text
                </button>
              </div>
              {done && <p className="flex items-center gap-1.5 text-green-400 text-sm mt-1"><Check size={14} /> {done}</p>}
            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-1">Your name on the image</p>
              <p className="text-white/60 text-xs mb-3">
                Optional. Your contacts see your status, so put the number they should call. Saved on this phone only.
              </p>
              <input
                value={sig.name}
                onChange={(e) => saveSig({ ...sig, name: e.target.value.slice(0, 28) })}
                placeholder="Your name"
                className="w-full mb-2 rounded-lg bg-white/10 text-white placeholder-white/40 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <input
                value={sig.phone}
                onChange={(e) => saveSig({ ...sig, phone: e.target.value.replace(/[^\d+ ]/g, '').slice(0, 16) })}
                placeholder={`Your number (default ${COMPANY_PHONE})`}
                inputMode="tel"
                className="w-full rounded-lg bg-white/10 text-white placeholder-white/40 px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {news.source_url && (
              <p className="text-white/50 text-xs mt-4">
                Source: <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="underline">{news.source_name || 'read the report'}</a>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
