import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Put every new page at the top.
 *
 * React Router does not touch the scroll position on navigation — it swaps the
 * component and leaves the window exactly where it was. On a multi-page site
 * that reads as a bug, and it was one: scrolled two-thirds down `/events` and
 * tapping an event landed the visitor a quarter of the way into the sign-up
 * page; going Home from anywhere deep landed them somewhere around the virtual
 * tour, with no idea they were looking at the middle of the homepage.
 *
 * Only `ProjectDetail` had noticed, and it had fixed it locally for itself —
 * which is why the same bug survived on every other route.
 *
 * Three cases, deliberately handled differently:
 *
 *   #hash  — an in-page or shared link. Scroll to that element. Checked first,
 *            because React Router calls the initial page load POP and the rule
 *            below would otherwise swallow it.
 *   POP    — a back/forward button. The browser has already restored the
 *            position the visitor left, and yanking them to the top would
 *            throw away the one thing they expected. Left alone.
 *   else   — PUSH or REPLACE: top, instantly. `behavior: 'smooth'` here would
 *            animate a scroll on a page the visitor has not seen yet.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // A hash is an explicit instruction and outranks everything else. It is
    // checked BEFORE the POP guard on purpose: React Router reports the very
    // first page load as POP, so a shared /events/…#register link would
    // otherwise be skipped here and land at the top of the page.
    if (hash) {
      const id = hash.slice(1);
      const go = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView();
        return !!el;
      };
      // The target can be a frame late on a route that has just mounted, so
      // there is one retry after paint rather than a silent miss.
      if (!go()) {
        const raf = requestAnimationFrame(go);
        return () => cancelAnimationFrame(raf);
      }
      return undefined;
    }

    // Back/forward: the browser has already put the visitor where they left,
    // and yanking them to the top would throw away the one thing they expected.
    if (navigationType === 'POP') return undefined;

    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash, navigationType]);

  return null;
}
