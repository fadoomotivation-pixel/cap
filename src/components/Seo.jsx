import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from '../lib/seo';

/**
 * Per-route SEO tags. Pass either a `preset` key from pageSeo or explicit
 * title/description/path. Set `noIndex` on private pages (portal, admin,
 * booking links) so they never show up in search results.
 */
export default function Seo({ title, description, path = '/', image, noIndex = false, jsonLd, children }) {
  const canonical = absoluteUrl(path);
  const ogImage = image || DEFAULT_OG_IMAGE;

  // index.html carries a set of fallback SEO tags for crawlers that never run
  // JS. On React 19, react-helmet-async renders its tags and lets React hoist
  // them into <head> — it does not remove those fallbacks. Left alone, every
  // route ends up with two descriptions and two canonicals, and the canonical
  // a crawler reads first is the homepage one, which tells Google not to rank
  // this page at all. So the moment the app takes over, drop the fallbacks.
  useEffect(() => {
    document.head.querySelectorAll('[data-static-seo]').forEach((el) => el.remove());
  }, []);

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      {children}
    </Helmet>
  );
}
