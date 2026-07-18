import React from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/site';

export default function Hero() {
  return (
    <section
      className="relative w-full min-h-screen pt-[72px] overflow-hidden bg-[#F0F5FA]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600' opacity='0.12'%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%2310243E' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'%3EDholera · Gujarat · India · Smart City%3C/text%3E%3C/svg%3E")`,
      }}
    >
      {/* World Map faint watermark */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 30%',
        }}
      />

      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch min-h-[calc(100vh-72px)] py-16 gap-12">

          {/* ── LEFT COLUMN ── */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            {/* Orange wave logo mark */}
            <div className="mb-6">
              <svg width="60" height="36" viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 60 Q30 0 60 36 Q90 72 120 12" stroke="#f26522" strokeWidth="8" fill="none" strokeLinecap="round"/>
                <path d="M0 72 Q30 12 60 48 Q90 84 120 24" stroke="#f26522" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>

            <p className="text-[#10243E] text-2xl md:text-3xl font-light mb-1 tracking-wide">
              here &amp; everywhere
            </p>
            <p className="text-gray-400 text-2xl md:text-3xl uppercase tracking-widest font-semibold mb-1">
              TRUST OF
            </p>
            <h1 className="text-[#10243E] text-[5rem] md:text-[7rem] lg:text-[8rem] font-black leading-none tracking-tight mb-2">
              +12000
            </h1>
            <h2 className="text-[#10243E] text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide mb-16">
              HAPPY FACES
            </h2>

            {/* ── Circular Stats ── */}
            <div className="flex gap-4 md:gap-6 flex-wrap">
              {[
                { num: '+15', label: 'Countries' },
                { num: '+28', label: 'States/UT' },
                { num: '+550', label: 'Cities' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full bg-white shadow-md"
                  style={{ border: '6px solid #e5e7eb' }}
                >
                  <span className="text-[#f26522] text-2xl md:text-3xl font-black leading-none">{s.num}</span>
                  <span className="text-[#10243E] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1.5 text-center">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 flex gap-4">
              <Link
                to="/projects"
                className="bg-[#f26522] text-white px-8 py-3.5 rounded-sm font-bold hover:bg-[#d65116] transition-colors text-sm tracking-wide uppercase"
              >
                View Projects
              </Link>
              <Link
                to="/contact"
                className="border-2 border-[#10243E] text-[#10243E] px-8 py-3.5 rounded-sm font-bold hover:bg-[#10243E] hover:text-white transition-colors text-sm tracking-wide uppercase"
              >
                Book a Plot
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center items-end text-right">

            <h2 className="text-[#10243E] text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight mb-6">
              A DECADE<br/>
              <span className="text-3xl md:text-4xl font-bold text-[#10243E]/70">OF EXTENSIVE</span><br/>
              DOMAIN<br/>KNOWLEDGE
            </h2>

            <p className="text-gray-500 text-xs md:text-sm tracking-[0.2em] font-semibold mb-8 leading-loose">
              INDIA | USA | UK | UAE | AUSTRALIA | CANADA<br/>
              GERMANY | TANZANIA | SOUTH AFRICA | SAUDI ARABIA
            </p>

            {/* Orange World Map SVG */}
            <div className="w-full max-w-md relative">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png"
                alt="Global presence"
                className="w-full h-auto"
                style={{ filter: 'invert(54%) sepia(71%) saturate(1000%) hue-rotate(350deg) brightness(1.0) contrast(1.2)' }}
              />
              {/* Location pins */}
              {[
                { top: '30%', left: '22%' }, // Europe/UK
                { top: '35%', left: '30%' }, // USA
                { top: '42%', left: '56%' }, // India
                { top: '48%', left: '63%' }, // UAE
                { top: '60%', left: '82%' }, // Australia
                { top: '50%', left: '70%' }, // South Africa (roughly)
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-[#10243E] border-2 border-white shadow"
                  style={{ top: p.top, left: p.left, transform: 'translate(-50%, -50%)' }}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
