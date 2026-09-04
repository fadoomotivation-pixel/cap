// ─────────────────────────────────────────────────────────────
// Build-time prerendering for the public routes.
//
// This is a client-rendered SPA: without this step every public URL served a
// near-empty <div id="root">, and any crawler that does not execute JS — which
// is most of them, including the social scrapers — saw nothing at all. Google
// does render JS, but rendering is queued and best-effort, so shipping real
// HTML is strictly better for a site that needs to rank.
//
// Routes come from public/sitemap.xml deliberately: one source of truth means
// the set we prerender can never drift from the set we ask Google to index.
//
// Private routes (/admin/*, /employee-kyc, /book/*) are NOT prerendered. They
// are noindex, they need a live session to show anything, and a static shell
// of them on disk would be pointless at best.
// ─────────────────────────────────────────────────────────────
import { build } from 'vite';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDist = path.join(root, '.ssr-build');

const routesFromSitemap = async () => {
  const xml = await readFile(path.join(root, 'public', 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map((u) => new URL(u).pathname.replace(/\/$/, '') || '/');
  return [...new Set(paths)].filter((p) => !/^\/(admin|book|employee-kyc)/.test(p));
};

/** Where the static file for a route lives. "/" -> index.html, "/blog/x" ->
 *  blog/x/index.html, which is what Vercel's static handler resolves. */
const outFile = (route) =>
  route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');

const run = async () => {
  const routes = await routesFromSitemap();
  console.log(`prerender: ${routes.length} public routes from sitemap.xml`);

  if (!existsSync(path.join(dist, 'index.html'))) {
    throw new Error('dist/index.html not found — run `vite build` before prerendering.');
  }
  const template = await readFile(path.join(dist, 'index.html'), 'utf8');

  await build({
    root,
    logLevel: 'warn',
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: '.ssr-build',
      emptyOutDir: true,
      copyPublicDir: false,
      rollupOptions: { output: { entryFileNames: 'entry-server.js' } },
    },
  });

  const { render } = await import(pathToFileURL(path.join(ssrDist, 'entry-server.js')).href);

  // React 19's renderToString hoists <title>, <meta> and <link> to the FRONT of
  // the returned string rather than into a <head>. Left inside #root they cause
  // a hydration mismatch on every page, because on the client React hoists the
  // same elements into <head>. So peel them off here and put them where they
  // belong — which is also what a crawler needs.
  const HOISTED = /^\s*(?:<title>[\s\S]*?<\/title>|<meta\b[^>]*?\/?>|<link\b[^>]*?\/?>)/;
  const splitHead = (markup) => {
    let head = '';
    let rest = markup;
    for (;;) {
      const m = rest.match(HOISTED);
      if (!m) break;
      head += m[0].trim();
      rest = rest.slice(m[0].length);
    }
    return { head, body: rest };
  };

  // Anything that is not a prerendered route — private pages, and any URL that
  // does not exist — falls back to this shell. It must NOT be the prerendered
  // homepage, or /admin/* would try to hydrate against homepage markup.
  await writeFile(path.join(dist, 'app.html'), template, 'utf8');

  let failed = 0;
  for (const route of routes) {
    try {
      const { html: markup } = render(route);
      const { head, body: html } = splitHead(markup);

      // The template's own tags describe the homepage; this route's real ones
      // replace them. They are deliberately NOT marked data-static-seo — React
      // adopts these during hydration and then manages them, so removing them
      // would strip the page's canonical the moment the app mounts.
      const page = template
        .replace(/\s*<(?:meta|link)[^>]*\bdata-static-seo\b[^>]*>/g, '')
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace('</head>', `${head}\n  </head>`)
        .replace('<div id="root">', '<div id="root" data-prerendered="true">')
        // The shell's noscript block is homepage copy; the prerendered markup
        // now carries this page's real content, so it is redundant. The
        // noscript <style> in <head> is untouched — it un-hides the
        // scroll-reveal sections for anyone browsing without JS.
        .replace(/<noscript data-shell-noscript>[\s\S]*?<\/noscript>/, '')
        .replace(/(<div id="root"[^>]*>)/, `$1${html}`);

      const file = outFile(route);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, page, 'utf8');
      console.log(`  ✓ ${route}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${route} — ${err.message}`);
    }
  }

  await rm(ssrDist, { recursive: true, force: true });

  if (failed) {
    // Fail the build rather than deploy pages that silently lost their content.
    throw new Error(`prerender: ${failed} route(s) failed`);
  }
  console.log(`prerender: ${routes.length} routes written`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
