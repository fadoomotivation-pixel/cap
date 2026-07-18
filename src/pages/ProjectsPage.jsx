import React from 'react';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <main className="pt-[72px] bg-[#F0F5FA] min-h-screen">
      {/* Page Banner */}
      <div className="bg-[#10243E] py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png')",
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}/>
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <p className="text-[#f26522] font-bold uppercase tracking-[0.25em] text-sm mb-3">Mirrikh Infratech</p>
          <h1 className="text-5xl md:text-6xl font-black mb-4">Our Projects</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Explore our complete portfolio of NA-approved, title-clear residential and industrial projects in Dholera Smart City.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-white/50 text-sm">
            <a href="/" className="hover:text-[#f26522]">Home</a>
            <span>/</span>
            <span className="text-[#f26522]">Our Projects</span>
          </div>
        </div>
      </div>
      <Projects />
    </main>
  );
}
