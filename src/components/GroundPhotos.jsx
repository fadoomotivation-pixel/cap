import React from 'react';
import { groundPhotos } from '../data/site';

/**
 * Real photographs from Dholera — frames from site footage, not renders and
 * not stock. Used where a buyer's question is "is any of this actually built?".
 * Illustrative artwork never goes in here.
 */
export default function GroundPhotos({ heading = 'Dholera, on the ground', lede, dark = false, className = '' }) {
  return (
    <section className={`${dark ? 'bg-[#0A1016] text-white' : 'bg-white'} ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        {heading && (
          <h2 className={`font-heading text-2xl lg:text-3xl mb-2 ${dark ? 'text-white' : 'text-[#10243E]'}`}>{heading}</h2>
        )}
        {lede && <p className={`text-sm mb-8 max-w-2xl ${dark ? 'text-white/60' : 'text-gray-500'}`}>{lede}</p>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {groundPhotos.map((ph) => (
            <figure key={ph.src} className="min-w-0">
              <img
                src={ph.src}
                alt={ph.alt}
                width={ph.w}
                height={ph.h}
                loading="lazy"
                decoding="async"
                className="w-full aspect-[4/5] object-cover rounded-sm bg-gray-100"
              />
              <figcaption className={`mt-2 text-xs leading-snug ${dark ? 'text-white/55' : 'text-gray-500'}`}>
                {ph.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className={`mt-4 text-[11px] ${dark ? 'text-white/40' : 'text-gray-400'}`}>
          Frames from on-site video footage in Dholera.
        </p>
      </div>
    </section>
  );
}
