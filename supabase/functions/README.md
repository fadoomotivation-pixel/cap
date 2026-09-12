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

### Sending the mail

Set two secrets and the function sends. Supabase dashboard →
**Project Settings → Edge Functions → Secrets** (this is *not* the same page as
Authentication → SMTP Settings, which only governs Supabase's own auth emails
and has no effect here).

| Secret | Value |
|---|---|
| `SMTP_USER` | the mailbox to send from |
| `SMTP_PASSWORD` | an **app password** for that mailbox — never the login password |

`SMTP_HOST` is derived from the domain of `SMTP_USER`, so there is nothing else
to set for either mailbox below. `SMTP_PORT` defaults to `465` (implicit TLS).

#### Gmail

Works with any personal `@gmail.com` account, which is the fastest way to get
confirmations going. Gmail needs 2-Step Verification switched on before it will
issue an app password.

1. Google Account → **Security** → turn on **2-Step Verification** if it is off.
2. Go to <https://myaccount.google.com/apppasswords>, name it `capitalbrix`,
   and copy the 16-character password it shows — it is shown once. Paste it
   without the spaces.
3. Set `SMTP_USER` to the Gmail address and `SMTP_PASSWORD` to that password.

Two things to know about Gmail specifically:

- **The From line will be the Gmail address.** Google rewrites it to the
  authenticated account unless the address is a verified alias on it, so
  `EVENT_FROM_EMAIL` is deliberately ignored when sending through Gmail rather
  than printing a From line the provider is going to overwrite.
- **Roughly 500 messages a day.** Ample for a seminar; if a mailing ever needs
  more than that, move to Zoho or Resend rather than splitting it.

#### Zoho — the company address

Capital Brix owns `hr@capitalbrix.co.in`, so the confirmation goes out from the
real company address with no domain to verify.

1. Zoho Accounts → **Security** → **App Passwords** → *Generate New Password*
2. Name it `capitalbrix-site` and copy the password — it is shown once.
3. Set `SMTP_PASSWORD`. `SMTP_USER` already defaults to `hr@capitalbrix.co.in`.

`smtp.zoho.in` is derived from the address; set `SMTP_HOST` to `smtp.zoho.com`
only if the mailbox is on the `.com` region.

**Resend** is the alternative: set `RESEND_API_KEY` instead and leave
`SMTP_PASSWORD` unset. SMTP wins if both are set.

`EVENT_FROM_EMAIL` overrides the visible From line for Zoho and Resend. It is
ignored for Gmail, for the reason above.

With neither configured the function returns `{ sent: false }` rather than an
error: the registration is already saved by that point, and a missing mail
provider must never look to the visitor like a failed sign-up.

Deploy: `supabase functions deploy event-confirmation --no-verify-jwt`
