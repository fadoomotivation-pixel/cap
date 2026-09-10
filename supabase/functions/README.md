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
### Sending the mail — Zoho, the easy way

Capital Brix already owns `hr@capitalbrix.co.in` on Zoho, so use it: the
confirmation goes out from the real company address, there is no third-party
signup, and there is no domain to verify.

Zoho will **not** accept the account login password over SMTP. Generate an
app-specific password first:

1. Zoho Accounts → **Security** → **App Passwords** → *Generate New Password*
2. Name it something like `capitalbrix-site`, and copy the password it shows —
   it is shown once.

Then set two Supabase secrets (Project Settings → Edge Functions → Secrets):

| Secret | Value |
|---|---|
| `SMTP_PASSWORD` | the app-specific password from step 2 |
| `SMTP_USER` | `hr@capitalbrix.co.in` (this is also the default) |

`SMTP_HOST` and `SMTP_PORT` default to `smtp.zoho.in` and `465`. Set them only
if the mailbox is on `.com` rather than `.in` (`smtp.zoho.com`).

**Resend** is the alternative: set `RESEND_API_KEY` instead and leave
`SMTP_PASSWORD` unset. SMTP wins if both are set.

`EVENT_FROM_EMAIL` overrides the visible From line for either provider.

With neither configured the function returns `{ sent: false }` rather than an
error: the registration is already saved by that point, and a missing mail
provider must never look to the visitor like a failed sign-up.

Deploy: `supabase functions deploy event-confirmation --no-verify-jwt`
