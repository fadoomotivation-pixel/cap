import React from 'react';
import Hero from '../components/Hero';
import Projects from '../components/Projects';
import Partnership from '../components/Partnership';
import ContactForm from '../components/ContactForm';

// Stats strip section
function StatsStrip() {
  const stats = [
    { val: '12+', label: 'Years in Dholera' },
    { val: '25+', label: 'Projects Delivered' },
    { val: '12,000+', label: 'Happy Investors' },
    { val: '920 km²', label: 'Smart City Area' },
  ];
  return (
    <div className="bg-[#10243E] py-10">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map(s => (
          <div key={s.label}>
            <div className="text-4xl md:text-5xl font-black text-[#f26522] mb-1">{s.val}</div>
            <div className="text-white/70 text-sm font-semibold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <Hero />
      <StatsStrip />
      <Projects />
      <Partnership />
      <ContactForm />
    </main>
  );
}
