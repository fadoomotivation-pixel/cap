import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Compass, ExternalLink, Sparkles, Navigation, X } from 'lucide-react';

export const TOUR_SCENES = [
  {
    id: 'panorama_66792EE5_490F_6DB5_41B5_542B437E5E0B',
    name: 'ABCD Building',
    shortName: 'ABCD HQ',
    tag: 'Admin & Business Hub',
    desc: 'The central administration and operations headquarters of Dholera Smart City.'
  },
  {
    id: 'panorama_6497D62A_4703_5CBF_4192_60FB7FAC97D7',
    name: 'Ahmedabad-Dholera Expressway',
    shortName: 'Expressway',
    tag: '109 km High-Speed Link',
    desc: 'Access-controlled 4-lane expressway connecting Ahmedabad to Dholera SIR.'
  },
  {
    id: 'panorama_96C356DC_A60F_F576_41E2_B371928016EC',
    name: 'Dholera International Airport',
    shortName: 'Airport Site',
    tag: 'Cargo & Passenger Aviation',
    desc: 'Greenfield international airport under development to serve the SIR region.'
  },
  {
    id: 'panorama_B5D98E95_8EAE_E364_41C3_C7FCAFAA9B79',
    name: 'Tata Semiconductor Fab Site',
    shortName: 'Tata Fab',
    tag: '₹91,000 Cr Semiconductor',
    desc: 'India’s first commercial semiconductor manufacturing facility site.'
  },
  {
    id: 'panorama_761EDBAA_565E_2F7F_4191_A0EF537FC1D3',
    name: 'Canal Front',
    shortName: 'Canal Front',
    tag: 'Activation Waterfront',
    desc: 'Scenic recreational waterfront and water management network in the activation zone.'
  },
  {
    id: 'panorama_647BF17E_471D_5497_41C3_03347A78EA51',
    name: 'City Operations Centre (CIOC)',
    shortName: 'CIOC Centre',
    tag: 'Command & Control',
    desc: 'The nerve centre managing smart utility grids, security, and traffic systems.'
  }
];

export default function VirtualTourViewer({
  mode = 'embedded',
  initialSceneId = TOUR_SCENES[0].id,
  showAttribution = true,
  className = ''
}) {
  const [activeSceneId, setActiveSceneId] = useState(initialSceneId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef(null);

  const activeScene = TOUR_SCENES.find((s) => s.id === activeSceneId) || TOUR_SCENES[0];

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const switchScene = (sceneId) => {
    setActiveSceneId(sceneId);
    if (iframeRef.current) {
      const baseSrc = '/dholera-tour/index.htm';
      iframeRef.current.src = `${baseSrc}#media-name=${sceneId}`;
    }
  };

  const tourUrl = `/dholera-tour/index.htm#media-name=${activeSceneId}`;

  return (
    <>
      {/* Main Tour Card / Viewer Shell */}
      <div
        className={`relative group rounded-2xl overflow-hidden border border-gray-200 bg-[#0A1016] shadow-xl transition-all duration-300 ${className}`}
      >
        {/* Aspect Container */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[1/1] xl:aspect-[5/4] overflow-hidden bg-[#0A1016]">
          {/* Live WebGL Tour iframe */}
          <iframe
            ref={iframeRef}
            src={tourUrl}
            title="Dholera SIR 360 Virtual Tour"
            className="w-full h-full border-0 absolute inset-0 z-0 select-none"
            allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
            loading="lazy"
            onLoad={() => setIsIframeLoaded(true)}
          />

          {/* Loading indicator until iframe boots */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0A1016] text-white">
              <Compass className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
              <p className="text-xs uppercase tracking-widest text-gray-400">Loading 360° Ground Reality...</p>
            </div>
          )}

          {/* Mobile Touch Protection Overlay */}
          {!isInteracting && (
            <div
              onClick={() => setIsInteracting(true)}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] cursor-pointer sm:hidden transition-opacity"
            >
              <div className="bg-[#10243E]/95 border border-[#D4AF37]/50 text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                <span>Tap to Explore in 360°</span>
              </div>
              <p className="text-[11px] text-gray-300 mt-2 font-light">Swipe & pan activation landmarks</p>
            </div>
          )}

          {/* Top Floating Badges Bar */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 bg-[#0A1016]/85 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-full text-[11px] font-medium shadow-lg pointer-events-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[#D4AF37] font-semibold tracking-wider uppercase text-[10px]">Official 360° Tour</span>
              <span className="hidden sm:inline text-gray-400">|</span>
              <span className="hidden sm:inline text-gray-200 truncate max-w-[130px] lg:max-w-[180px]">{activeScene.name}</span>
            </div>

            {/* Expand Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(true)}
              title="Open Fullscreen Experience"
              className="inline-flex items-center gap-1.5 bg-[#0A1016]/85 hover:bg-[#10243E] backdrop-blur-md border border-white/15 hover:border-[#D4AF37]/50 text-white px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shadow-lg pointer-events-auto cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>

          {/* Bottom Floating Scene Navigation Pills */}
          <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar p-1.5 rounded-xl bg-[#0A1016]/85 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] px-2 whitespace-nowrap flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Scenes:
              </span>
              {TOUR_SCENES.map((scene) => {
                const isActive = scene.id === activeSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => switchScene(scene.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0A1016] font-semibold shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{scene.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Footer: Metadata & Interaction Hint */}
        {showAttribution && (
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>
                <strong className="text-gray-900 font-medium">{activeScene.name}:</strong> {activeScene.desc}
              </span>
            </div>
            <a
              href="/dholera-tour/index.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#10243E] hover:text-[#D4AF37] font-semibold whitespace-nowrap transition-colors"
            >
              <span>New Window</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Fullscreen Immersive Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0A1016] border-b border-white/10 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h3 className="text-white text-sm sm:text-base font-medium flex items-center gap-2">
                    <span>{activeScene.name}</span>
                    <span className="hidden md:inline text-xs font-normal text-gray-400">({activeScene.tag})</span>
                  </h3>
                  <p className="text-[11px] text-[#D4AF37] tracking-wider uppercase">Dholera SIR 360° Ground Reality Tour</p>
                </div>
              </div>

              {/* Scene Switcher for Fullscreen Desktop */}
              <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                {TOUR_SCENES.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => switchScene(scene.id)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#0A1016] font-semibold'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {scene.shortName}
                    </button>
                  );
                })}
              </div>

              {/* Actions: New Tab & Close */}
              <div className="flex items-center gap-2">
                <a
                  href={`/dholera-tour/index.htm#media-name=${activeSceneId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  <span>Open in Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close Fullscreen (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tour Viewport */}
            <div className="relative flex-1 w-full h-full bg-[#0A1016] overflow-hidden">
              <iframe
                src={`/dholera-tour/index.htm#media-name=${activeSceneId}`}
                title="Dholera SIR Fullscreen Virtual Tour"
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
              />
            </div>

            {/* Mobile Scene Selector Bottom Bar in Fullscreen */}
            <div className="lg:hidden px-3 py-2 bg-[#0A1016] border-t border-white/10 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {TOUR_SCENES.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => switchScene(scene.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#0A1016] font-semibold'
                          : 'text-gray-300 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {scene.shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
