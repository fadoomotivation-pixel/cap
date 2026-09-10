import { supabase } from './supabase';
import { friendlyError } from './errors';

/**
 * The row id is minted here rather than read back from the insert.
 *
 * `.insert().select()` needs a SELECT policy, and anon has none on purpose —
 * a public read on this table would hand every registrant's name, phone and
 * email to anyone with the anon key. So the insert asks for nothing back, and
 * we already know the id because we generated it. (This was caught by running
 * the anon insert against the real policies: the INSERT is allowed, the
 * RETURNING is not, so a `.select()` here would have failed every real
 * registration.)
 *
 * crypto.randomUUID is missing on Safari before 15.4, which is exactly the
 * phone this form gets filled on, so there is a getRandomValues fallback.
 */
function newId() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * The only writer for cb_event_registrations.
 *
 * RLS on that table mirrors cb_leads: anon may INSERT, and only admins may
 * SELECT. A public read policy would hand every registrant's name, phone and
 * email to anyone holding the anon key.
 *
 * The confirmation email is sent by the `event-confirmation` Edge Function,
 * which takes ONLY the row id — never an address from the browser — looks the
 * registration up with the service role, and refuses to send twice. So the
 * worst a hostile caller can do with the id is re-trigger a mail to an address
 * that already asked for one.
 *
 * The email is deliberately NOT allowed to fail the registration. If the mail
 * provider is unconfigured or down, the row is already saved and the person is
 * registered; we just tell them the team will confirm by WhatsApp instead. A
 * sign-up that reports failure because an email bounced is a lost lead.
 */
export async function registerForEvent({
  event_slug,
  full_name,
  phone,
  email,
  city,
  guests = 1,
  interest,
  invited_by,
  notes,
  source_path,
}) {
  const name = (full_name || '').trim();
  const mail = (email || '').trim().toLowerCase();
  const digits = (phone || '').replace(/\D/g, '');

  if (name.length < 2) return { error: 'Please enter your full name.' };
  if (digits.length < 10) return { error: 'Please enter a 10-digit mobile number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return { error: 'Please enter a valid email address — the confirmation goes there.' };

  const id = newId();

  const { error } = await supabase
    .from('cb_event_registrations')
    .insert([{
      id,
      event_slug,
      full_name: name,
      phone: phone.trim(),
      email: mail,
      city: (city || '').trim() || null,
      guests: Math.min(10, Math.max(1, Number(guests) || 1)),
      interest: interest || null,
      invited_by: (invited_by || '').trim() || null,
      notes: (notes || '').trim() || null,
      source_path: source_path || (typeof window !== 'undefined' ? window.location.pathname : null),
    }]);

  if (error) {
    // The unique index on (event_slug, lower(email)) is what stops a double-tap
    // from creating two seats — and it is also what someone re-registering
    // hits, so it must read as reassurance, not as an error.
    if (error.code === '23505') {
      return { ok: true, already: true };
    }
    return { error: friendlyError(error) };
  }

  let emailed = false;
  try {
    const { data: fn } = await supabase.functions.invoke('event-confirmation', {
      body: { registration_id: id },
    });
    emailed = !!fn?.sent;
  } catch {
    // Swallowed on purpose — see the note above.
  }

  return { ok: true, id, emailed };
}
