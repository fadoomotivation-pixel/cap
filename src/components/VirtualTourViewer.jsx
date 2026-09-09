import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Compass, X, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Controls for the Dholera SIR 360° tour.
//
// The tour is a 3DVista build served from our own origin, which is the one
// thing that makes this possible: same-origin means we can reach
// iframe.contentWindow and drive the tour directly instead of guessing at it
// from outside.
//
// Two mechanisms, chosen for different reasons:
//
//   Scene switching calls tour.setMediaByName(label). The previous version set
//   iframe.src on every click, which reloads a 3.8 MB player and every tile
//   from scratch — the button appeared to do nothing for several seconds, then
//   flashed the whole tour. This swaps the panorama in place.
//
//   Zoom dispatches a wheel event at the centre of the tour's canvas rather
//   than calling a zoom method. The player's own zoomIn/zoomOut live on an
//   internal class that is not reachable from window.tour, and pinning our
//   buttons to an undocumented internal is how they break on their next
//   build. Wheel is the input the viewer already handles.
//
// Every call is wrapped: if the tour has not booted, or a future build renames
// something, the control is a no-op rather than a thrown error in a visitor's
// console.
// ─────────────────────────────────────────────────────────────

export const TOUR_SCENES = [
  { id: "panorama_66792EE5_490F_6DB5_41B5_542B437E5E0B", name: "ABCD Building", short: "ABCD HQ", desc: "The administrative hub, and home to the city command centre." },
  { id: "panorama_647BF17E_471D_5497_41C3_03347A78EA51", name: "City Integrated Operations Centre (CIOC)", short: "CIOC", desc: "The control room for traffic, utilities and surveillance across the city." },
  { id: "panorama_6497D62A_4703_5CBF_4192_60FB7FAC97D7", name: "Dholera Expressway 1", short: "Expressway", desc: "The access-controlled corridor that brings Ahmedabad to about 45 minutes." },
  { id: "panorama_96C356DC_A60F_F576_41E2_B371928016EC", name: "Dholera International Airport", short: "Airport", desc: "The greenfield international airport under construction at Navagam." },
  { id: "panorama_B5D98E95_8EAE_E364_41C3_C7FCAFAA9B79", name: "Tata Semiconductor Fab Site", short: "Tata Fab", desc: "Where India\u2019s first commercial semiconductor plant is being built." },
  { id: "panorama_646348B5_4707_7595_41C3_BF73A6679A18", name: "Water Treatment Plant (WTP)", short: "Water Plant", desc: "50 MLD, scalable to 150 MLD, feeding the piped network." },
  { id: "panorama_1044E72E_5ED6_2777_41D6_AA19D9F8E9A0", name: "Common Effluent Treatment Plant (CETP)", short: "Effluent Plant", desc: "20 MLD of shared industrial effluent treatment, scalable to 60." },
  { id: "panorama_B07F5167_9C96_1456_4175_3173FCB83843", name: "Sewage Treatment Plant (STP)", short: "Sewage Plant", desc: "10 MLD, with recycled water provisioned back for domestic use." },
  { id: "panorama_646A5EA3_4707_ADAD_41B3_25C72B211CB9", name: "Torrent Power Substation \u2013 220/400kv", short: "Power", desc: "The gas-insulated substation carrying the region\u2019s supply." },
  { id: "panorama_6472B257_4703_F495_41BD_7224AFD7F5F1", name: "ReNew Power", short: "Solar", desc: "Renewable generation inside the region." },
  { id: "panorama_761EDBAA_565E_2F7F_4191_A0EF537FC1D3", name: "Canal Front", short: "Canal Front", desc: "6.5 km of stormwater canal doubling as public realm." },
  { id: "panorama_6468E81A_470C_B49F_41CE_BE452A7D558E", name: "Road Junction (H1)", short: "Road Grid", desc: "The 18 m to 70 m road grid, with utilities in the corridor beneath." },
  { id: "panorama_9C686EB2_A609_1532_41E0_851995CA3A18", name: "School, Hospital & Fire Station", short: "Social", desc: "The social infrastructure a family actually moves for." },
  { id: "panorama_9B4BE8A6_A639_1DD2_41DF_31487CC201D3", name: "Residential & Commercial Complex", short: "Residential", desc: "Built residential and commercial development inside the Activation Area." },
  { id: "panorama_946B2B22_A6FB_FCD2_41E0_BCE1056694E1", name: "Guest House & Hotel", short: "Hotel", desc: "Hospitality for the workforce and visiting business." },
  { id: "panorama_9BE4D05D_A61B_2D76_41DB_1D2F6C660977", name: "Tent City", short: "Tent City", desc: "Visitor accommodation at the SIR." },
  { id: "panorama_C2C30D7D_BEC1_4723_41B5_B918EFDAD103", name: "Dholera SIR", short: "Overview", desc: "A wide look across the region." },
];

const TOUR_SRC = '/dholera-tour/index.htm';

export default function VirtualTourViewer({ className = '' }) {
  const [sceneId, setSceneId] = useState(TOUR_SCENES[0].id);
  const [ready, setReady] = useState(false);
  const [full, setFull] = useState(false);
  const [touching, setTouching] = useState(false);
  const shell = useRef(null);
  const frame = useRef(null);
  const chips = useRef(null);

  const scene = TOUR_SCENES.find((s) => s.id === sceneId) || TOUR_SCENES[0];

  /** The tour object inside the iframe, or null if it has not booted. */
  const tour = () => {
    try { return frame.current?.contentWindow?.tour || null; } catch { return null; }
  };

  const goToScene = useCallback((s) => {
    setSceneId(s.id);
    // Choosing a landmark is engagement — the "tap to explore" veil has done
    // its job and should not still be sitting over the panorama afterwards.
    setTouching(true);
    const t = tour();
    try {
      if (t?.setMediaByName) { t.setMediaByName(s.name); return; }
    } catch { /* fall through to the reload below */ }
    // Only if the in-place swap is unavailable: a reload with the deep link.
    if (frame.current) frame.current.src = `${TOUR_SRC}#media-name=${s.id}`;
  }, []);

  /** Wheel at the centre of the tour canvas — the input the viewer handles. */
  const zoom = useCallback((direction) => {
    setTouching(true);
    try {
      const win = frame.current?.contentWindow;
      const doc = win?.document;
      const target = doc?.querySelector('canvas') || doc?.getElementById('viewer') || doc?.body;
      if (!target || !win) return;
      const r = target.getBoundingClientRect();
      target.dispatchEvent(new win.WheelEvent('wheel', {
        deltaY: direction === 'in' ? -240 : 240,
        clientX: r.width / 2,
        clientY: r.height / 2,
        bubbles: true, cancelable: true,
      }));
    } catch { /* tour not ready — the button simply does nothing */ }
  }, []);

  const resetView = useCallback(() => goToScene(scene), [goToScene, scene]);

  // Keep the active chip in view — on a phone the row is scrolled, and an
  // active pill off-screen is the same as no feedback at all.
  useEffect(() => {
    const el = chips.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [sceneId]);

  // Real fullscreen where the browser allows it, so mobile chrome gets out of
  // the way; the fixed overlay is the fallback and also what Escape closes.
  const openFull = useCallback(async () => {
    setFull(true);
    try { await shell.current?.requestFullscreen?.({ navigationUI: 'hide' }); } catch { /* overlay alone */ }
  }, []);
  const closeFull = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ }
    setFull(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && full) closeFull(); };
    const onFsChange = () => { if (!document.fullscreenElement && full) setFull(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [full, closeFull]);

  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [full]);

  const ctrlBtn =
    'w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-[#0A1016]/85 ' +
    'backdrop-blur-md border border-white/15 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] ' +
    'active:scale-95 transition-all shadow-lg';

  // One stage, mounted once. Fullscreen only changes this element's classes —
  // moving it into a portal or a second branch would unmount the iframe and
  // reload the entire 3.8 MB tour every time the button is pressed, which is
  // the exact fault this component was rewritten to remove.
  //
  // Classes rather than the Fullscreen API alone because iOS Safari refuses
  // requestFullscreen on anything that is not a <video>; the API is still
  // attempted, so desktop browsers hide their chrome too.
  const Stage = (
    <div
      ref={shell}
      className={
        full
          ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#0A1016]'
          : 'relative w-full bg-[#0A1016] aspect-[4/3] sm:aspect-[16/10]'
      }
    >
      <iframe
        ref={frame}
        src={TOUR_SRC}
        title="Dholera SIR official 360° virtual tour"
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
        allowFullScreen
        loading="lazy"
        onLoad={() => setReady(true)}
      />

      {!ready && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A1016] text-white">
          <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin mb-3" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Loading the 360° tour</p>
        </div>
      )}

      {/* A phone scrolls the page when a finger lands on the panorama, so the
          tour steals the gesture and the page feels stuck. The pane stays
          inert until it is deliberately tapped. */}
      {ready && !touching && !full && (
        <button
          onClick={() => setTouching(true)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] sm:hidden"
        >
          <span className="bg-[#10243E]/95 border border-[#D4AF37]/50 text-white px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xl">
            <Compass className="w-4 h-4 text-[#D4AF37]" /> Tap to explore in 360°
          </span>
        </button>
      )}

      {/* ── Title ─────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-40 pointer-events-none">
        <div className="inline-flex items-center gap-2 bg-[#0A1016]/85 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-full text-[11px] shadow-lg max-w-[70vw]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[#D4AF37] font-semibold tracking-wider uppercase text-[10px] shrink-0">Official 360°</span>
          <span className="text-gray-200 truncate">{scene.name}</span>
        </div>
      </div>

      {/* ── Zoom / reset / fullscreen ─────────────────────── */}
      <div className="absolute top-3 right-3 z-40 flex flex-col gap-2">
        <button onClick={() => zoom('in')} className={ctrlBtn} aria-label="Zoom in" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => zoom('out')} className={ctrlBtn} aria-label="Zoom out" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={resetView} className={ctrlBtn} aria-label="Reset view" title="Reset view">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={full ? closeFull : openFull}
          className={ctrlBtn}
          aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
          title={full ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        >
          {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Landmarks ─────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-[#0A1016] via-[#0A1016]/85 to-transparent pt-8 pb-3 px-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#D4AF37] font-bold mb-2 px-0.5">
          {TOUR_SCENES.length} landmarks — tap to jump
        </p>
        <div ref={chips} className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {TOUR_SCENES.map((s) => (
            <button
              key={s.id}
              data-active={s.id === sceneId}
              onClick={() => goToScene(s)}
              className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-all shrink-0 ${
                s.id === sceneId
                  ? 'bg-[#D4AF37] text-[#0A1016] font-semibold shadow-md'
                  : 'text-gray-200 bg-white/10 hover:bg-white/20 active:scale-95'
              }`}
            >
              {s.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-[#0A1016] ${className}`}>
        {Stage}
        <div className="px-4 py-3 bg-white border-t border-gray-100 text-xs">
          <p className="text-gray-600">
            <strong className="text-[#10243E] font-semibold">{scene.name}:</strong> {scene.desc}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Official Dholera SIR virtual tour · Government of Gujarat / DICDL
          </p>
        </div>
      </div>

      {/* A close control that is reachable when the stage is filling the screen.
          The stage itself is not re-rendered here — only this button is. */}
      {full && (
        <button
          onClick={closeFull}
          aria-label="Close fullscreen"
          className="fixed top-3 left-3 z-[10000] w-11 h-11 flex items-center justify-center rounded-lg bg-[#0A1016]/85 backdrop-blur-md border border-white/15 text-white hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
