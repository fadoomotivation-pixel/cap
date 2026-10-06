/**
 * Lead and CTA events. Fires only if a tag is already on the page.
 * There is no GA4 or Meta pixel id in this repo — do not add one here.
 * Once an id is installed, these calls start recording without a code change.
 */
export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  const payload = { ...params };
  try {
    if (typeof window.gtag === 'function') window.gtag('event', event, payload);
  } catch { /* tag blocked */ }
  try {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', event, payload);
  } catch { /* tag blocked */ }
}
