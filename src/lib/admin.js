import { supabase } from './supabase';

/**
 * Who is an admin is DATA now — the `cb_admins` table, read by `cb_is_admin()`
 * — not a list in the code. Until 10 October 2026 it was this array, copied
 * into eight RLS policies, `cb_is_admin()` and four Edge Functions: fourteen
 * places, so "Disha has left, Ananya is the new HR" was a developer job, and
 * the one place nobody remembered to change would have kept a departed
 * employee's access. It is now a button in the Command Center.
 *
 * BOOTSTRAP_ADMINS is only a first guess so the page does not flash the
 * sign-in form for a second while the real answer loads. It never grants
 * anything: every table, RPC and Edge Function asks the database, and the
 * page corrects itself the moment the database answers.
 */
export const BOOTSTRAP_ADMINS = ['admin@capitalbrix.co.in', 'ujjwal@capitalbrix.co.in', 'disha@capitalbrix.com'];

/** @deprecated Kept only for the first-paint guess. Ask `resolveAdmin`. */
export const ADMIN_EMAILS = BOOTSTRAP_ADMINS;

const CACHE_KEY = 'cbIsAdmin';

function cached(email) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v.email === email ? v.admin : null;
  } catch { return null; }
}

function remember(email, admin) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ email, admin })); } catch { /* private window */ }
}

/** Ask the database whether this session is an admin. Resolves to a boolean. */
export async function checkAdmin(session) {
  const email = session?.user?.email?.toLowerCase();
  if (!email) return false;
  const { data, error } = await supabase.rpc('cb_is_admin');
  if (error) return BOOTSTRAP_ADMINS.includes(email); // database unreachable: best guess
  remember(email, !!data);
  return !!data;
}

/**
 * Set a page's isAdmin state: an immediate guess (last answer this tab saw,
 * else the bootstrap list), then the database's real answer.
 */
export function resolveAdmin(session, setIsAdmin) {
  const email = session?.user?.email?.toLowerCase();
  if (!email) { setIsAdmin(false); return; }
  const guess = cached(email);
  setIsAdmin(guess ?? BOOTSTRAP_ADMINS.includes(email));
  checkAdmin(session).then(setIsAdmin);
}

/** @deprecated Synchronous guess only — use checkAdmin / resolveAdmin. */
export const isAdminEmail = (email) => BOOTSTRAP_ADMINS.includes((email || '').toLowerCase());
