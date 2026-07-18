import React from 'react';
import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white pt-16 pb-8 border-t-[8px] border-brand-orange">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div>
            <Link to="/" className="inline-block mb-6">
              <img src="/logo.png" alt="Capital Brix" className="h-16 bg-white p-2 rounded" onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23f26522' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 22h20'/%3E%3Cpath d='M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18'/%3E%3Cpath d='M10 12h4'/%3E%3C/svg%3E";
              }} />
            </Link>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Capital Brix is the Exclusive Channel Partner of Mirrikh Infratech Pvt. Ltd., bringing you the most premium investment opportunities in Dholera Smart City.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons removed */}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-heading font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-white/80">
              <li><Link to="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-brand-orange transition-colors">About Mirrikh Infratech</Link></li>
              <li><Link to="/projects" className="hover:text-brand-orange transition-colors">Our Projects</Link></li>
              <li><Link to="/dholera" className="hover:text-brand-orange transition-colors">Dholera Smart City</Link></li>
              <li><Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-heading font-bold mb-6">Our Projects</h4>
            <ul className="space-y-3 text-white/80">
              <li><Link to="/projects/mayur-greenz-ii" className="hover:text-brand-orange transition-colors">Mayur Greenz II</Link></li>
              <li><Link to="/projects/mayur-evana" className="hover:text-brand-orange transition-colors">Mayur Evana</Link></li>
              <li><Link to="/projects/mayur-enclave-5" className="hover:text-brand-orange transition-colors">Mayur Enclave 5</Link></li>
              <li><Link to="/projects/mayur-signature" className="hover:text-brand-orange transition-colors">Mayur Signature</Link></li>
              <li><Link to="/projects" className="hover:text-brand-orange transition-colors text-brand-orange">View All Projects →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-heading font-bold mb-6">Contact Info</h4>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <MapPin className="text-brand-orange flex-shrink-0 mt-1" size={20} />
                <span>{site.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-brand-orange flex-shrink-0" size={20} />
                <a href={`tel:${site.phone}`} className="hover:text-brand-orange transition-colors">+91 70489 17300</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-brand-orange flex-shrink-0" size={20} />
                <a href="mailto:info@mirrikh.com" className="hover:text-brand-orange transition-colors">info@mirrikh.com</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} Capital Brix. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
