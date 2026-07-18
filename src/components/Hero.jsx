import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] bg-[#f5f5f5] pt-24 overflow-hidden flex items-center">
      {/* Light World Map Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "url('https://mirrikh.com/wp-content/uploads/2023/10/Group-1355.svg')", // placeholder for map pattern
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row justify-between items-center h-full">
          
          {/* Left Side Content */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center pt-12 pb-24">
            <img 
              src="https://mirrikh.com/wp-content/uploads/2023/10/Group-1355.svg" 
              alt="Mirrikh Wave" 
              className="w-16 h-12 object-contain mb-6" 
            />
            
            <h2 className="text-[#10243E] text-4xl md:text-5xl font-light mb-2">
              here & everywhere
            </h2>
            
            <h3 className="text-gray-500 text-3xl md:text-4xl uppercase tracking-wider mb-2 font-medium">
              TRUST OF
            </h3>
            
            <h1 className="text-[#10243E] text-6xl md:text-8xl font-bold leading-none mb-4">
              +12000
            </h1>
            
            <h2 className="text-[#10243E] text-4xl md:text-5xl uppercase font-semibold mb-16 tracking-wide">
              HAPPY FACES
            </h2>

            {/* Circular Stats */}
            <div className="flex gap-4 md:gap-8">
              <div className="flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full border-[8px] border-gray-200 bg-white shadow-sm">
                <span className="text-[#f26522] text-3xl md:text-4xl font-bold">+</span>
                <span className="text-[#f26522] text-4xl md:text-5xl font-bold leading-none">15</span>
                <span className="text-[#10243E] text-xs md:text-sm font-bold uppercase mt-1">Countries</span>
              </div>
              <div className="flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full border-[8px] border-gray-200 bg-white shadow-sm">
                <span className="text-[#f26522] text-3xl md:text-4xl font-bold">+</span>
                <span className="text-[#f26522] text-4xl md:text-5xl font-bold leading-none">28</span>
                <span className="text-[#10243E] text-xs md:text-sm font-bold uppercase mt-1">States/UT</span>
              </div>
              <div className="flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full border-[8px] border-gray-200 bg-white shadow-sm">
                <span className="text-[#f26522] text-3xl md:text-4xl font-bold">+</span>
                <span className="text-[#f26522] text-4xl md:text-5xl font-bold leading-none">550</span>
                <span className="text-[#10243E] text-xs md:text-sm font-bold uppercase mt-1">Cities</span>
              </div>
            </div>
          </div>

          {/* Right Side Map */}
          <div className="w-full lg:w-1/2 flex flex-col items-end pt-12 pb-24">
            <h2 className="text-[#10243E] text-4xl md:text-6xl font-bold text-right leading-tight mb-2 uppercase">
              A DECADE<br/>
              <span className="text-[#10243E] font-medium text-3xl md:text-4xl">OF EXTENSIVE</span><br/>
              DOMAIN KNOWLEDGE
            </h2>
            
            <p className="text-gray-500 text-sm md:text-base text-right tracking-widest font-semibold mt-8 mb-12 max-w-lg leading-relaxed">
              INDIA | USA | UK | UAE | AUSTRALIA | CANADA<br/>
              GERMANY | TANZANIA | SOUTH AFRICA | SAUDI ARABIA
            </p>

            <div className="w-full max-w-xl relative">
              <img 
                src="https://mirrikh.com/wp-content/uploads/2023/10/Group-1355.svg" 
                alt="World Map" 
                className="w-full h-auto opacity-50 sepia hue-rotate-[340deg] saturate-[5] contrast-125"
                onError={(e) => {
                  e.target.style.display = 'none'; // hide if not found, it's just decorative
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
