# Edge Functions

These are deployed to the Supabase project `SalesAutoCall`
(ref `rqgkzamuohdvttnkluzn`). They are kept here so the source is version
controlled — the Supabase dashboard is not a source of truth, and the
`create-employee-login` function has already drifted from anything reviewable
because it only ever existed there.

## event-confirmation

Sends the confirmation email for a row in `cb_event_registrations`.

- `verify_jwt` is **off** — registrants are members of the public with no
  account. The function does its own checks instead: it takes a row id, never
  an email address, so it cannot be pointed at an arbitrary recipient, and it
  refuses to send twice for the same row.
- `resend: true` bypasses that once-only rule and therefore **requires an
  admin JWT**. The `/admin/events` console sends one automatically.
- Requires the Supabase secrets `RESEND_API_KEY` and (optionally)
  `EVENT_FROM_EMAIL`. Without the key it returns `{ sent: false }` rather than
  an error: the registration is already saved by that point, and a missing mail
  provider must never look to the visitor like a failed sign-up.

Deploy: `supabase functions deploy event-confirmation --no-verify-jwt`
