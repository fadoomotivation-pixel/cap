import { Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { site } from '../data/site';
import { track } from '../lib/track';

const PRIVATE = /^\/(admin|employee-kyc|book)(\/|$)/;

export default function StickyCta() {
  const { pathname } = useLocation();
  if (PRIVATE.test(pathname)) return null;

  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

  return (
    <nav
      data-print-hide
      aria-label="Call, WhatsApp or book a visit"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 bg-[#0A1016] text-white border-t border-white/10"
    >
      <a
        href={`tel:+${site.phone}`}
        data-cta="bar-call"
        onClick={() => track('cta_click', { cta_id: 'bar-call' })}
        className="flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium"
      >
        <Phone size={14} /> Call
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        data-cta="bar-whatsapp"
        onClick={() => track('cta_click', { cta_id: 'bar-whatsapp' })}
        className="flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium text-[#C9A962]"
      >
        <MessageCircle size={14} /> WhatsApp
      </a>
      <Link
        to="/contact"
        data-cta="bar-visit"
        onClick={() => track('cta_click', { cta_id: 'bar-visit' })}
        className="flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium"
      >
        <MapPin size={14} /> Visit
      </Link>
    </nav>
  );
}
