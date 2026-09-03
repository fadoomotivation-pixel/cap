import { supabase } from './supabase';

/**
 * Every website enquiry goes through here. Until this existed the contact
 * form called preventDefault() and dropped the lead on the floor, so traffic
 * was worth nothing — fixing that is half of "get organic leads".
 *
 * `source` / `source_path` are stored so we can tell which blog post actually
 * earns enquiries and write more of that one.
 */
export async function submitLead({ full_name, phone, email, message, source = 'website', source_path }) {
  const name = (full_name || '').trim();
  const digits = (phone || '').replace(/\D/g, '');

  if (name.length < 2) return { error: 'Please enter your name.' };
  if (digits.length < 10) return { error: 'Please enter a valid phone number.' };

  const { error } = await supabase.from('cb_leads').insert([{
    full_name: name,
    phone: phone.trim(),
    email: (email || '').trim() || null,
    message: (message || '').trim() || null,
    source,
    source_path: source_path || (typeof window !== 'undefined' ? window.location.pathname : null),
  }]);

  if (error) return { error: 'Could not send that just now. Please WhatsApp or call us instead.' };
  return { ok: true };
}
