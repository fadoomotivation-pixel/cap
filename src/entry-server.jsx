import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { AppContent } from './App';
import './index.css';

/**
 * Build-time render of one public route. Used only by scripts/prerender.mjs —
 * there is no server at runtime; the output is written as static HTML that
 * Vercel serves and the client then hydrates.
 */
export function render(url) {
  const helmetContext = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppContent />
      </StaticRouter>
    </HelmetProvider>
  );
  return { html, helmet: helmetContext.helmet };
}
