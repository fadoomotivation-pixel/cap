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
/**
 * Last resort when the registration insert fails for a reason we did not
 * anticipate. cb_leads accepts anon inserts and HR already watches it, so the
 * person surfaces at /admin/leads instead of disappearing. Deliberately
 * swallows its own errors: this is already the failure path, and throwing here
 * would replace a recoverable problem with a blank screen.
 */
async function rescueToLeads({ name, phone, mail, city, invited_by, event_slug, reason }) {
  try {
    await supabase.from('cb_leads').insert([{
      full_name: name,
      phone,
      email: mail,
      message:
        `EVENT REGISTRATION FAILED — please confirm this seat by hand.\n` +
        `Event: ${event_slug}\n` +
        `City: ${city || '—'}\n` +
        `Invited by: ${invited_by || '—'}\n` +
        `Reason: ${String(reason).slice(0, 200)}`,
      source: 'event-registration-failed',
      source_path: typeof window !== 'undefined' ? window.location.pathname : null,
    }]);
  } catch { /* nothing further we can do from here */ }
}

export async function registerForEvent({
  event_slug,
  full_name,
  phone,
  email,
  city,
  guests = 1,
  interest,
  invited_by,
  invite_code,
  notes,
  source_path,
}) {
  const name = (full_name || '').trim();
  const mail = (email || '').trim().toLowerCase();
  const digits = (phone || '').replace(/\D/g, '');

  if (name.length < 2) return { error: 'Please enter your full name.' };
  if (digits.length < 10) return { error: 'Please enter a 10-digit mobile number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return { error: 'Please enter a valid email address — the confirmation goes there.' };
  // Required, not optional. Every seat should be attributable to whoever brought
  // that person. The rule is here as well as on the form so it survives a
  // submit that skipped the markup — there is no NOT NULL on the column,
  // because rows registered before this rule existed would fail it.
  if ((invited_by || '').trim().length < 2) return { error: 'Please tell us who invited you.' };

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
      // Uppercased so 'capitalbrix' and 'CAPITALBRIX' count as one code in
      // the console. The column check rejects anything else.
      invite_code: (invite_code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || null,
      notes: (notes || '').trim() || null,
      source_path: source_path || (typeof window !== 'undefined' ? window.location.pathname : null),
    }]);

  if (error) {
    // There is no "already registered" success any more.
    //
    // This branch used to read 23505 as "you are already on the list" and show
    // a SUCCESS screen with a downloadable pass. The pass it drew had a blank
    // REF, because the reference is the last six characters of the row id and
    // this path never had a row. Sonia Gulati walked away on 11 Sep 2026 at
    // 12:30 UTC holding exactly that pass for a seat that was never created —
    // the edge log shows her POST returning 409 and nothing else.
    //
    // The unique index that caused it is gone (this table refuses nobody), so
    // a 23505 here could now only be a primary-key collision on a UUID we
    // minted ourselves. Either way it is an anomaly, not a confirmation, and
    // it takes the same path as any other failure: the person is written to
    // cb_leads and told the truth.

    // No failure may vaporise the person.
    //
    // Whatever the cause — a check constraint, a dropped connection, a policy
    // change — somebody is standing there having typed their details, and the
    // one unacceptable outcome is that nobody ever hears about them. So the
    // attempt is written to cb_leads, which anon may insert into and which HR
    // already works at /admin/leads, and the visitor is told plainly that the
    // team will confirm by hand rather than being shown a false success.
    await rescueToLeads({ name, phone, mail, city, invited_by, event_slug, reason: error.message });
    return {
      error: 'We could not complete your registration just now, but we have your details and the team will confirm your seat on WhatsApp.',
      rescued: true,
    };
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
