/**
 * "Load failed" is what Safari calls a fetch that never completed — a dropped
 * signal, a lift, a tunnel. It was shown to employees verbatim, so a network
 * blip read as the portal being broken and they stopped rather than retrying.
 *
 * Only network faults are rewritten. A real message from Supabase ("Invalid
 * login credentials") is the useful thing and is left alone.
 */
// Deliberately narrow. A bare /timeout/ would also match Postgres's
// "canceling statement due to statement timeout", which is the server working
// and answering — relabelling that as a dropped connection would send someone
// to check their wifi over a slow query, and withRetry would re-run it.
const NETWORK = /load failed|failed to fetch|networkerror|network request failed|network connection was lost|err_internet_disconnected|err_network|connection (?:closed|reset|refused)/i;

export const isNetworkError = (err) =>
  NETWORK.test(err?.message || String(err || '')) || err?.name === 'AbortError';

export function friendlyError(err) {
  if (isNetworkError(err)) {
    return 'Could not reach the server — your connection dropped. Check your internet and try again; nothing was lost.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

/**
 * One automatic retry for network faults only. A weak signal usually recovers
 * within a second, and asking someone to refill a four-step form because of it
 * is the wrong trade. Anything the server actually rejected is thrown straight
 * through — retrying a bad password or a failed constraint just repeats it.
 */
export async function withRetry(fn, { attempts = 2, delayMs = 1200 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isNetworkError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}
