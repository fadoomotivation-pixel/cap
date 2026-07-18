import React from 'react';
import Partnership from '../components/Partnership';

export default function About() {
  return (
    <main className="pt-24 bg-brand-gray min-h-screen">
      <div className="bg-brand-blue py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">About Mirrikh Infratech</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg">
          The driving force behind Dholera Smart City's most premium real estate developments.
        </p>
      </div>
      
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-3xl font-heading font-bold text-brand-blue mb-6">Our Legacy in Dholera</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Mirrikh Infratech Pvt. Ltd. was founded with a singular vision: to pioneer world-class real estate developments in India's first greenfield smart city. We don't just sell land; we build communities equipped with modern infrastructure, lush green spaces, and future-ready amenities.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            As the most trusted developer in the Dholera Special Investment Region (SIR), our track record speaks for itself. Since 2012, we have successfully delivered over 8 premium residential and commercial projects, bringing unmatched ROI and peace of mind to our investors.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-gray-100 pt-8 mt-8">
            <div>
              <div className="text-3xl font-bold text-brand-orange mb-2">12+</div>
              <div className="text-sm font-semibold text-gray-500 uppercase">Years Exp.</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange mb-2">8+</div>
              <div className="text-sm font-semibold text-gray-500 uppercase">Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange mb-2">100%</div>
              <div className="text-sm font-semibold text-gray-500 uppercase">Title Clear</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange mb-2">24/7</div>
              <div className="text-sm font-semibold text-gray-500 uppercase">Support</div>
            </div>
          </div>
        </div>
      </div>

      <Partnership />
    </main>
  );
}
