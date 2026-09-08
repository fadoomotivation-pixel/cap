import React from 'react';
import Projects from '../components/Projects';
import Seo from '../components/Seo';
import { pageSeo } from '../lib/seo';

export default function ProjectsPage() {
  return (
    <main className="pt-[72px] bg-[#F0F5FA] min-h-screen">
    <Seo {...pageSeo.projects} />
      {/* Page Banner */}
      <div className="bg-[#10243E] py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')",
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}/>
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          {/* "Our Projects" under a "Mirrikh Infratech" eyebrow read as though
              Capital Brix developed them. We are the sales channel partner, not
              the developer, and the heading now says whose projects these are. */}
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.25em] text-sm mb-3">Developed by Mirrikh Infratech Pvt. Ltd.</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">Mirrikh Infratech Projects in Dholera</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            NA-approved, title-clear residential and industrial projects in Dholera Smart City,
            developed by Mirrikh Infratech Pvt. Ltd. and marketed by Capital Brix LLP as an
            authorised sales channel partner.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-white/50 text-sm">
            <a href="/" className="hover:text-[#9C7C1C]">Home</a>
            <span>/</span>
            <span className="text-[#9C7C1C]">Projects</span>
          </div>
        </div>
      </div>
      <Projects />
    </main>
  );
}
