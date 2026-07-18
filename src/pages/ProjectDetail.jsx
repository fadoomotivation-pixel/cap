import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Users, LayoutDashboard, Leaf } from 'lucide-react';
import { projects } from '../data/site';

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  // Google Maps embed URL
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14742.647576572237!2d71.9686971!3d22.516858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959b8c2d8c36ba5%3A0x6e288e7a6ed7f766!2sDholera%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";

  return (
    <main className="pt-[84px] bg-[#f5f5f5] min-h-screen">
      
      {/* Split Banner Section */}
      <div className="flex flex-col xl:flex-row w-full bg-[#f2f4f6]">
        
        {/* Left Side: Content & Images */}
        <div className="w-full xl:w-2/3 bg-white relative overflow-hidden flex flex-col justify-between py-12 px-8 lg:px-16 lg:py-20 min-h-[600px]">
          
          <div className="relative z-10 w-full max-w-xl">
            <h1 className="text-6xl md:text-8xl font-bold text-[#10243E] tracking-tight mb-2 flex items-center">
              {project.name.split(' ')[0]} 
              {project.name.split(' ')[1] && (
                <span className="ml-4">{project.name.split(' ')[1]}</span>
              )}
            </h1>
            <div className="w-48 h-1 bg-gradient-to-r from-[#10243E] to-transparent rounded-full mb-4"></div>
            <p className="text-gray-500 font-semibold tracking-[0.2em] text-sm md:text-base uppercase mb-16">
              A {project.type} Project
            </p>

            <h2 className="text-4xl md:text-6xl font-bold text-[#10243E] mb-16">
              Rise. <span className="text-[#f26522]">Live.</span> Belong.
            </h2>

            {/* Feature Icons */}
            <div className="flex flex-col md:flex-row gap-8 text-[#10243E]">
              <div className="flex items-start gap-4 max-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#10243E] flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <LayoutDashboard size={20} />
                </div>
                <p className="text-xs font-bold leading-tight uppercase">NA, NOC,<br/>TITLE CLEAR &<br/>UNIT PLAN PASS</p>
              </div>
              <div className="flex items-start gap-4 max-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#10243E] flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Users size={20} />
                </div>
                <p className="text-xs font-bold leading-tight uppercase">PERFECT FOR<br/>FAMILIES,<br/>BUILT FOR LIFE</p>
              </div>
              <div className="flex items-start gap-4 max-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#10243E] flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Leaf size={20} />
                </div>
                <p className="text-xs font-bold leading-tight uppercase">THOUGHTFULLY<br/>PLANNED.<br/>FUTURE READY.</p>
              </div>
            </div>
          </div>

          {/* Right side graphic (Family placeholder) */}
          <div className="absolute right-0 bottom-0 w-2/3 h-full max-h-[800px] pointer-events-none hidden md:block">
             <div className="absolute inset-0 bg-[#f26522] rounded-tl-[100%] rounded-bl-[20%] right-[-20%] bottom-[-10%] z-0 shadow-xl"></div>
             {/* Using a placeholder SVG or gradient for the family since we don't have the exact image */}
             <div className="absolute inset-4 z-10 bg-white/20 backdrop-blur-sm rounded-tl-[100%] rounded-bl-[20%] border-l-8 border-white"></div>
          </div>

        </div>

        {/* Right Side: Maps */}
        <div className="w-full xl:w-1/3 flex flex-col h-[600px] xl:h-auto border-l-[12px] border-white">
          <div className="h-1/2 bg-[#10243E] p-8 flex items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-widest opacity-90 uppercase">
              {project.name.split(' ')[project.name.split(' ').length - 1]}
            </h1>
          </div>
          <div className="h-1/2 relative bg-gray-200">
            <iframe 
              src={mapUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Google Maps Location"
            ></iframe>
          </div>
        </div>

      </div>
      
      {/* WhatsApp Floating Button specific to details */}
      <a 
        href="https://wa.me/917048917300"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>
    </main>
  );
}
