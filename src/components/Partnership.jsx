import React from 'react';
import { partnership } from '../data/site';
import { ShieldCheck, Award, Building2, Handshake, MapPin, Cpu, Route, Landmark } from 'lucide-react';

const ICONS = {
  Award, Building2, FileCheck: ShieldCheck, Handshake, Landmark, Cpu, Route
};

export default function Partnership() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#101010] mb-6">
            Benefits of growing together.
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {partnership.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {partnership.points.map((pt, i) => {
            const IconComponent = ICONS[pt.icon] || Handshake;
            return (
              <div
                key={i}
                className="bg-[#f9fafb] p-8 rounded-sm hover:shadow-lg transition-shadow border border-gray-100 group"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#f37435] mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <IconComponent size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#101010] mb-4">{pt.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {pt.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
