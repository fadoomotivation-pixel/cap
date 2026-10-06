import { Link } from 'react-router-dom';

/** Quiet page opening used on the marketing routes. Black, one headline, no texture. */
export default function PageIntro({ eyebrow, title, lede, crumbs }) {
  return (
    <header className="bg-[#0A1016] text-white pt-28 pb-14 lg:pt-36 lg:pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="text-xs text-white/50 mb-6 flex flex-wrap gap-x-2">
            {crumbs.map((c, i) => (
              <span key={c.label} className="inline-flex gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.to ? (
                  <Link to={c.to} className="hover:text-white">{c.label}</Link>
                ) : (
                  <span className="text-white/80">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-[#C9A962] text-xs font-medium tracking-[0.18em] uppercase mb-4">{eyebrow}</p>
        )}
        <h1 className="text-white font-heading font-semibold text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.12] tracking-tight mb-4">
          {title}
        </h1>
        {lede && <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl">{lede}</p>}
      </div>
    </header>
  );
}
