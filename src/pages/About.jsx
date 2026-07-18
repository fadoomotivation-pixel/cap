import React from 'react';

const team = [
  {
    name: 'Rajeel Kumar Jangir',
    role: 'Founder & CMD',
    bio: 'Founded as Shreeji Developers in 2010, rebranded to Mirrikh Infratech in 2017. Featured in Forbes India (March 2025). Pioneer in Dholera Smart City real estate since 2012.',
    img: 'https://mirrikh.com/wp-content/uploads/2023/10/rajeel-jangir.jpg',
  },
];

const timeline = [
  { year: '2010', event: 'Founded as Shreeji Developers by Rajeel Kumar Jangir in Surat, Gujarat.' },
  { year: '2016', event: 'First project Mayur Park Villa launched at Kamatalav village, Dholera.' },
  { year: '2017', event: 'Rebranded as Mirrikh Infratech Pvt. Ltd. with expanded vision for Dholera.' },
  { year: '2020', event: '10+ projects delivered; expanding into industrial and commercial segments.' },
  { year: '2024', event: 'Featured in Forbes India. ISO-certified. 20,000+ sq. yd. plots delivered.' },
  { year: '2025', event: 'Launching Mayur NOVA — newest flagship residential project in Dholera SIR.' },
];

export default function About() {
  return (
    <main className="pt-[72px] bg-[#F0F5FA] min-h-screen">
      {/* Banner */}
      <div className="bg-[#10243E] py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')",
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}/>
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3">Mirrikh Infratech Pvt. Ltd.</p>
          <h1 className="text-5xl md:text-6xl font-black mb-4">Who We Are</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            The most trusted developer in Dholera Smart City since 2012 — building communities for India's future.
          </p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3">Our Story</p>
            <h2 className="text-4xl font-black text-[#10243E] mb-6">Building Trust Since 2010</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Mirrikh Infratech Pvt. Ltd. was founded with a singular vision: to create world-class real estate communities in Dholera — India's first and largest greenfield smart city. What started as Shreeji Developers in 2010 has grown into a vertically integrated real estate company delivering residential, commercial, and industrial projects.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              We don't just sell land — we build communities equipped with modern infrastructure, lush green spaces, gated security, and future-ready amenities. Every project is NA, NOC, title clear, and plan-passed — complete transparency guaranteed.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '25+', label: 'Projects Launched' },
                { val: '12+', label: 'Years Experience' },
                { val: '100%', label: 'Legal Titles' },
                { val: 'Forbes', label: 'Media Feature (2025)' },
              ].map(s => (
                <div key={s.label} className="bg-white p-5 rounded-sm border border-gray-100 shadow-sm text-center">
                  <div className="text-3xl font-black text-[#f26522] mb-1">{s.val}</div>
                  <div className="text-xs font-bold text-[#10243E] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#10243E] rounded-sm p-10 text-white">
            <h3 className="text-2xl font-bold text-[#f26522] mb-4">Our Vision</h3>
            <p className="text-white/80 leading-relaxed mb-8 italic text-lg">
              "To be a preferred real estate partner, setting new industry standards through innovation, sustainability, and exceeding client expectations."
            </p>
            <h3 className="text-2xl font-bold text-[#f26522] mb-4">Our Mission</h3>
            <p className="text-white/80 leading-relaxed italic text-lg">
              "To create value for clients by delivering high-quality, sustainable, and affordable real estate solutions in Dholera Smart City, leveraging expertise, resources, and modern technology."
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3 text-center">Our Journey</p>
          <h2 className="text-4xl font-black text-[#10243E] mb-12 text-center">Company Timeline</h2>
          <div className="relative border-l-4 border-[#f26522] ml-4 md:ml-24 pl-8 space-y-10">
            {timeline.map((t) => (
              <div key={t.year} className="relative">
                <div className="absolute -left-12 top-1 w-8 h-8 rounded-full bg-[#f26522] text-white flex items-center justify-center font-black text-xs">
                  {t.year.slice(2)}
                </div>
                <p className="text-[#f26522] font-black text-lg mb-1">{t.year}</p>
                <p className="text-gray-600 leading-relaxed">{t.event}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3 text-center">Leadership</p>
          <h2 className="text-4xl font-black text-[#10243E] mb-12 text-center">The Team Behind Mirrikh</h2>
          <div className="flex justify-center">
            {team.map(m => (
              <div key={m.name} className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 max-w-sm text-center">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-5 border-4 border-[#f26522]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=10243E&color=fff&size=120`;
                  }}
                />
                <h3 className="text-xl font-black text-[#10243E] mb-1">{m.name}</h3>
                <p className="text-[#f26522] font-bold text-sm uppercase tracking-wide mb-4">{m.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
