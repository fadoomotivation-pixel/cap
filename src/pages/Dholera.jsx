import React from 'react';

export default function Dholera() {
  return (
    <main className="pt-24 bg-brand-gray min-h-screen">
      <div className="bg-brand-blue py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Dholera Smart City</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-lg">
          India's first greenfield smart city and the future of global manufacturing.
        </p>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200 mb-12">
          <h2 className="text-3xl font-heading font-bold text-brand-blue mb-6">Why Invest in Dholera SIR?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-brand-orange mb-3">Tata Semiconductor Fab</h3>
              <p className="text-gray-600 leading-relaxed">
                A massive ₹91,000 crore investment by Tata Electronics to build India's first commercial semiconductor fab, creating thousands of high-paying tech jobs and driving massive housing demand.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-orange mb-3">Dholera International Airport</h3>
              <p className="text-gray-600 leading-relaxed">
                Currently under construction in Navagam. This massive greenfield airport will handle international cargo and passenger transit, easing the load on Ahmedabad airport and boosting Dholera's global connectivity.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-orange mb-3">Ahmedabad-Dholera Expressway</h3>
              <p className="text-gray-600 leading-relaxed">
                A 109km, access-controlled high-speed corridor connecting Dholera directly to Ahmedabad. Travel time will be reduced to just one hour, making Dholera a true satellite smart city.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-orange mb-3">Smart Infrastructure</h3>
              <p className="text-gray-600 leading-relaxed">
                Features underground utilities (ICT, power, gas, water), smart traffic management, zero-discharge waste systems, and large central parks. A true 21st-century master-planned city.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
