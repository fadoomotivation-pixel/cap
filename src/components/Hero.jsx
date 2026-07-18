import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center pt-24 bg-brand-gray overflow-hidden">
      {/* Background Image Setup (Mimicking Mirrikh Slider) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-brand-blue/70"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10 flex flex-col items-start justify-center h-full">
        
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 md:p-12 rounded-lg max-w-3xl">
          <div className="inline-block bg-brand-orange text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
            Invest in Dholera SIR
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-white leading-tight mb-6">
            Building the Future <br/>
            of <span className="text-brand-orange">Smart Living</span>
          </h1>
          
          <p className="text-lg text-white/90 mb-8 max-w-2xl leading-relaxed">
            Mirrikh Infratech Pvt. Ltd. presents NA, NOC, Title Clear and Plan Passed plots in India's first greenfield smart city. Direct developer pricing through Capital Brix.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/projects" className="btn-orange">
              Explore Projects <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-blue bg-white text-brand-blue hover:bg-gray-100">
              Download Brochure
            </Link>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="absolute bottom-0 left-0 w-full bg-brand-blue/90 backdrop-blur border-t border-white/10 py-6 hidden md:block">
          <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3"><CheckCircle2 className="text-brand-orange" /> <span>8+ Delivered Projects</span></div>
            <div className="flex items-center gap-3"><CheckCircle2 className="text-brand-orange" /> <span>NA & NOC Approved</span></div>
            <div className="flex items-center gap-3"><CheckCircle2 className="text-brand-orange" /> <span>Title Clear Plots</span></div>
            <div className="flex items-center gap-3"><CheckCircle2 className="text-brand-orange" /> <span>Direct Developer Pricing</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
