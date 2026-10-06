import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { whatsappHref, setWhatsappPhone } from '../lib/prose';
import './dholeraTimeline.css';

const CARDS = [
  {
    id: 'timeline-2007',
    year: '2006',
    label: '2006–07',
    datetime: '2007-08',
    title: 'The idea',
    body: 'India and Japan agree on an industrial corridor. The Union Cabinet approves DMIC in principle.',
    source: { href: 'https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=67931', label: 'PIB' },
  },
  {
    id: 'timeline-2008',
    year: '2008',
    label: '2008',
    datetime: '2008-01-07',
    title: 'The builder',
    body: 'DMICDC — now NICDC — is incorporated. Dholera is chosen as a node.',
    source: { href: 'https://nicdc.in/about/corporate-profile', label: 'NICDC' },
  },
  {
    id: 'timeline-2009',
    year: '2009',
    label: '2009',
    datetime: '2009-05',
    title: 'The law',
    body: 'Gujarat’s SIR Act takes effect. Nine hundred twenty square kilometres are notified as Dholera SIR.',
    stat: { value: '920', note: 'sq km' },
    source: { href: 'https://dholera.gujarat.gov.in/faqs', label: 'DICDL' },
  },
  {
    id: 'timeline-2012',
    year: '2012',
    label: '2010–12',
    datetime: '2012-09-15',
    title: 'The plan',
    body: 'DSIRDA is formed. The Development Plan and Town Planning Schemes 1–6 are drafted.',
    source: { href: 'https://dholera.gujarat.gov.in/', label: 'DSIRDA' },
  },
  {
    id: 'timeline-2015',
    year: '2015',
    label: '2015',
    datetime: '2015-05-29',
    title: 'The money',
    body: 'The Cabinet Committee on Economic Affairs funds trunk infrastructure for the activation area.',
    stat: { value: '₹2,784.83 Cr', note: 'activation area' },
    source: { href: 'https://pib.gov.in/newsite/PrintRelease.aspx?relid=122141', label: 'PIB' },
  },
  {
    id: 'timeline-2016',
    year: '2016',
    label: '2016',
    datetime: '2016-01-28',
    title: 'The company',
    body: 'DICDL is incorporated — fifty-one percent Gujarat, forty-nine percent Centre.',
    source: { href: 'https://dholera.gujarat.gov.in/about_us', label: 'DICDL' },
  },
  {
    id: 'timeline-2022',
    year: '2022',
    label: '2022',
    datetime: '2022-06-14',
    title: 'Power & plane',
    body: 'Three hundred megawatts of solar go live. Airport Phase 1 is approved at ₹1,305 Cr.',
    source: { href: 'https://www.tatapower.com/news-and-media/media-releases/tata-power-renewables-commissions-300-mw-solar-plant-in-dholera-gujarat-with-indias-largest-single-axis-solar-tracker-system', label: 'Tata Power' },
  },
  {
    id: 'timeline-2024',
    year: '2024',
    label: '2024',
    datetime: '2024-02-29',
    title: 'The chip',
    body: 'Cabinet approves the Tata–PSMC fab. Foundation stone follows two weeks later.',
    hero: true,
    stat: { value: '₹91,000 Cr', note: 'fab investment', hero: true },
    source: { href: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2010132', label: 'PIB' },
  },
  {
    id: 'timeline-2026-road',
    year: '2026',
    label: '2026',
    datetime: '2026-03-31',
    title: 'Global & road',
    body: 'India–UAE letter of intent for Dholera. The Ahmedabad–Dholera Expressway opens — eighty-three kilometres, about forty-five minutes.',
    hero: true,
    stat: { value: '~45 min', note: 'Ahmedabad to Dholera', hero: true },
    source: { href: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2233516', label: 'PIB' },
    visit: true,
  },
  {
    id: 'timeline-2026-rail',
    year: '2026',
    label: '2026',
    datetime: '2026-06',
    title: 'Rail & SEZ',
    body: 'Fab SEZ notified. Semi-high-speed rail approved at ₹20,667 Cr. First calibration aircraft lands at Dholera.',
    source: { href: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2260624', label: 'PIB' },
  },
  {
    id: 'timeline-2026-dfc',
    year: '2026',
    label: '2026',
    datetime: '2026-09-08',
    title: 'Corridor complete',
    body: 'Gujarat’s Data Centre Policy names Dholera a priority hub. The Western Dedicated Freight Corridor is fully completed.',
    source: { href: 'https://www.jica.go.jp/english/overseas/india/information/press/2026/1585189_70871.html', label: 'JICA' },
  },
];

export const timelineItemList = (origin) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Dholera verified milestones 2006–2026',
  itemListElement: CARDS.map((card, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `${card.label} · ${card.title}`,
    url: `${origin}/dholera#${card.id}`,
  })),
});

function track(id) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'cta_click', { cta_id: id });
  }
}

/**
 * Mobile story-scroll of 11 verified milestones, 2006–2026, plus a soft close.
 * The list is real HTML so a crawler sees every card. Motion only toggles classes.
 */
export default function DholeraTimeline() {
  const rootRef = useRef(null);
  setWhatsappPhone(site.phone);
  const visit = '/contact';
  const whatsapp = whatsappHref('Hi Capital Brix, I just read the Dholera timeline. Please send the current plot list.');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const scroller = root.querySelector('.tl__scroller');
    const stops = [...root.querySelectorAll('.tl__card, .tl__cta')];
    const cards = stops.filter((s) => s.classList.contains('tl__card'));
    const yearEl = root.querySelector('[data-tl-year]');
    const indexEl = root.querySelector('[data-tl-index]');
    const progressEl = root.querySelector('[data-tl-progress]');
    if (!scroller || !stops.length) return undefined;

    const reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const reduced = () => !!reduceMQ.matches;
    root.classList.add('tl--js');

    let activeIdx = -1;
    let interacted = false;
    let engaged = false;
    let lastHaptic = 0;
    let yearTimer = 0;
    let yearToken = 0;

    const pad = (n) => (n < 10 ? '0' : '') + n;
    const markEngaged = () => {
      if (engaged) return;
      engaged = true;
      root.classList.add('tl--engaged');
    };
    const setYear = (y) => {
      if (!yearEl) return;
      y = String(y);
      if (yearEl.textContent === y && !yearTimer) return;
      window.clearTimeout(yearTimer);
      yearTimer = 0;
      const token = ++yearToken;
      if (reduced()) {
        yearEl.style.opacity = '';
        yearEl.textContent = y;
        return;
      }
      yearEl.style.opacity = '0.28';
      yearTimer = window.setTimeout(() => {
        if (token !== yearToken) return;
        yearEl.textContent = y;
        yearEl.style.opacity = '';
        yearTimer = 0;
      }, 180);
    };
    const setProgress = (i) => {
      if (!progressEl) return;
      const n = Math.max(stops.length - 1, 1);
      const pct = i <= 0 ? 0 : (i >= n ? 100 : Math.round((i / n) * 1000) / 10);
      progressEl.style.width = `${pct}%`;
    };
    const setIndex = (i) => {
      if (!indexEl) return;
      const cardIdx = cards.indexOf(stops[i]);
      indexEl.textContent = pad(cardIdx >= 0 ? cardIdx + 1 : cards.length);
    };
    const haptic = () => {
      if (reduced() || !interacted || !navigator.vibrate) return;
      const now = Date.now();
      if (now - lastHaptic < 320) return;
      lastHaptic = now;
      try { navigator.vibrate(6); } catch { /* unsupported */ }
    };
    const activate = (i, fromUser) => {
      if (i < 0 || i >= stops.length || i === activeIdx) return;
      const prev = activeIdx;
      activeIdx = i;
      if (i > 0) markEngaged();
      stops.forEach((stop, j) => {
        stop.classList.toggle('is-active', j === i);
        stop.classList.toggle('is-passed', j < i);
        if (j === i) stop.setAttribute('aria-current', 'step');
        else stop.removeAttribute('aria-current');
      });
      const stop = stops[i];
      setYear(stop.getAttribute('data-year') || '2026');
      setIndex(i);
      setProgress(i);
      if (fromUser && prev >= 0) haptic();
    };
    const io = new IntersectionObserver((entries) => {
      let best = null;
      let bestRatio = 0;
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio;
          best = e.target;
        }
      });
      if (!best) return;
      const idx = stops.indexOf(best);
      if (idx >= 0) activate(idx, true);
    }, { root: scroller, threshold: [0.4, 0.5, 0.6, 0.72] });
    stops.forEach((s) => io.observe(s));

    const goTo = (i, instant) => {
      const next = Math.max(0, Math.min(stops.length - 1, i));
      const el = stops[next];
      if (!el) return;
      if (instant || reduced()) scroller.scrollTop = el.offsetTop;
      else scroller.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
      activate(next, true);
    };
    const onKey = (e) => {
      let next = -1;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) next = activeIdx + 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) next = activeIdx - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = stops.length - 1;
      else return;
      e.preventDefault();
      goTo(next);
    };
    let wheelLock = false;
    let wheelIdle = 0;
    const onWheel = (e) => {
      if (reduced()) return;
      const atStart = scroller.scrollTop <= 2 && e.deltaY < 0;
      const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      if (wheelLock || Math.abs(e.deltaY) < 10) return;
      wheelLock = true;
      goTo(activeIdx + (e.deltaY > 0 ? 1 : -1));
      window.clearTimeout(wheelIdle);
      wheelIdle = window.setTimeout(() => { wheelLock = false; }, 780);
    };
    const markInteract = () => { interacted = true; };
    scroller.addEventListener('keydown', onKey);
    scroller.addEventListener('wheel', onWheel, { passive: false });
    ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => {
      root.addEventListener(ev, markInteract, { passive: true, once: true });
    });
    activate(0, false);
    const onReduce = () => {
      const i = activeIdx;
      activeIdx = -1;
      activate(i, false);
    };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce);

    return () => {
      io.disconnect();
      window.clearTimeout(yearTimer);
      window.clearTimeout(wheelIdle);
      scroller.removeEventListener('keydown', onKey);
      scroller.removeEventListener('wheel', onWheel);
      if (reduceMQ.removeEventListener) reduceMQ.removeEventListener('change', onReduce);
    };
  }, []);

  return (
    <section id="timeline" ref={rootRef} className="tl my-10" aria-label="Dholera timeline, 2006 to 2026">
      <div className="tl__chrome" aria-hidden="true">
        <div className="tl__progress"><i data-tl-progress /></div>
        <div className="tl__year" data-tl-year>2006</div>
        <div className="tl__index"><span data-tl-index>01</span><span className="tl__index-sep">/</span><span>11</span></div>
      </div>
      <a className="tl__skip" href="#after-timeline">Skip timeline</a>
      <div className="tl__scroller" tabIndex={0} aria-label="Scroll through Dholera milestones">
        <ol className="tl__track">
          {CARDS.map((card) => (
            <li key={card.id} className={`tl__card${card.hero ? ' tl__card--hero' : ''}`} id={card.id} data-year={card.year} data-label={card.label} data-status="done">
              <article className="tl__panel">
                <time className="tl__time" dateTime={card.datetime}>{card.label}</time>
                <h3 className="tl__title">{card.title}</h3>
                <p className="tl__body">{card.body}</p>
                {card.stat && (
                  <div className={`tl__stat${card.stat.hero ? ' tl__stat--hero' : ''}`} aria-hidden="true">
                    <b>{card.stat.value}</b>
                    <span>{card.stat.note}</span>
                  </div>
                )}
                <footer className="tl__foot">
                  <span className="tl__status">Complete</span>
                  <a className="tl__src" href={card.source.href} rel="noopener noreferrer" target="_blank">{card.source.label}</a>
                </footer>
                {card.visit && (
                  <Link className="tl__inline-cta" to={visit} data-cta="timeline-expressway-visit" onClick={() => track('timeline-expressway-visit')}>
                    Book a site visit
                  </Link>
                )}
              </article>
            </li>
          ))}
          <li className="tl__cta" id="timeline-cta" data-year="2026" data-label="Today" aria-label="Continue with Capital Brix">
            <article className="tl__panel tl__panel--cta">
              <p className="tl__cta-kicker">Today</p>
              <h3 className="tl__title">This is where we are.</h3>
              <p className="tl__body">Expressway. SEZ. Aircraft. Freight corridor. Ready when you are.</p>
              <div className="tl__cta-actions">
                <a className="tl__btn tl__btn--primary" href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta="timeline-end-whatsapp" onClick={() => track('timeline-end-whatsapp')}>WhatsApp</a>
                <Link className="tl__btn tl__btn--ghost" to={visit} data-cta="timeline-end-visit" onClick={() => track('timeline-end-visit')}>Site visit</Link>
              </div>
              <a className="tl__cta-more" href="#land-plots" data-cta="timeline-end-learn" onClick={() => track('timeline-end-learn')}>Learn more</a>
              <p className="tl__disclaimer">Cited from official sources. Not investment advice.</p>
            </article>
          </li>
        </ol>
      </div>
      <div id="after-timeline" />
    </section>
  );
}
