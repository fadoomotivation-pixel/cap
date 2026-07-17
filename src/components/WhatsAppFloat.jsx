import React from 'react';
import { MessageCircle } from 'lucide-react';
import { site } from '../data/site';

export default function WhatsAppFloat() {
  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noreferrer"
      className="wa-float"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} />
      <span className="wa-float__pulse" aria-hidden="true" />
    </a>
  );
}
