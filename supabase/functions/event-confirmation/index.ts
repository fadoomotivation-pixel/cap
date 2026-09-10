import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// ─────────────────────────────────────────────────────────────
// Sends the confirmation email for an event registration and stamps
// confirmation_sent_at on the row.
//
// verify_jwt is off because registrants are members of the public with no
// account. That makes this a public endpoint, so it does its own checks: it
// will only ever act on a row that already exists in cb_event_registrations,
// and it takes an id rather than an address — so it cannot be used to send
// mail to an arbitrary recipient. It also refuses to send twice for the same
// row.
//
// `resend: true` overrides that once-only rule, so it is the one thing here a
// stranger must not be able to do — otherwise anyone holding a row id could
// mail the same person repeatedly. It therefore requires a caller JWT whose
// email is on ADMIN_EMAILS, which is what the /admin/events console sends.
// Keep this list in step with src/lib/admin.js and the SQL policies.
//
// ── How the mail actually goes out ───────────────────────────────────────────
// Two providers, tried in this order:
//
//   1. SMTP, when SMTP_PASSWORD is set. This is the Zoho path: Capital Brix
//      already owns hr@capitalbrix.co.in, so the confirmation goes out from the
//      real company address with no third-party signup and no domain to verify.
//      Zoho does NOT accept the account login password over SMTP — it needs an
//      app-specific password generated under Zoho Accounts › Security.
//      Defaults are Zoho India (smtp.zoho.in:465, implicit TLS).
//   2. Resend, when RESEND_API_KEY is set instead.
//
// If neither is configured it returns { sent: false } rather than failing. The
// registration is already saved by then; a missing mail provider must never
// look to the visitor like a failed sign-up.
// ─────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
  "admin@capitalbrix.co.in",
  "ujjwal@capitalbrix.co.in",
  "disha@capitalbrix.com",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Event facts live here as well as in src/data/eventDetails.js. An email is
// sent once and cannot be corrected afterwards, so the copy that goes out is
// pinned in the function rather than taken from whatever the caller passes.
const EVENTS: Record<string, {
  title: string; dateLabel: string; time: string; venueLines: string[]; subject: string;
}> = {
  "dholera-wealth-2026": {
    title: "How to Create Wealth in Dholera",
    dateLabel: "Sunday, 13 September 2026",
    time: "10:30 AM \u2013 2:00 PM",
    venueLines: [
      "The Gaurs Sarovar Premiere",
      "Club GH-01, E Block, Gaur City 1, Sector 4",
      "Noida Extension, Greater Noida, Uttar Pradesh 201309",
    ],
    subject: "You're registered — How to Create Wealth in Dholera, 13 Sept",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { registration_id, resend, probe } = await req.json();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isCallerAdmin = async () => {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!jwt) return false;
      const { data: u } = await admin.auth.getUser(jwt);
      return !!u?.user?.email && ADMIN_EMAILS.includes(u.user.email.toLowerCase());
    };

    // `probe` answers one question for the admin console: is a mail provider
    // configured at all? Without it the only way to find out is to register
    // someone and see whether they got an email, which is a terrible way to
    // discover that a secret was never set. Admin-only, because which provider
    // an installation uses is not the public's business.
    if (probe) {
      if (!await isCallerAdmin()) return json({ error: "not authorised" }, 403);
      const provider = Deno.env.get("SMTP_PASSWORD")
        ? "smtp"
        : Deno.env.get("RESEND_API_KEY") ? "resend" : null;
      return json({
        provider,
        from: Deno.env.get("EVENT_FROM_EMAIL") ??
          (provider === "smtp" ? Deno.env.get("SMTP_USER") ?? "hr@capitalbrix.co.in" : null),
        host: provider === "smtp" ? Deno.env.get("SMTP_HOST") ?? "smtp.zoho.in" : null,
      });
    }

    if (!registration_id || typeof registration_id !== "string") {
      return json({ error: "registration_id required" }, 400);
    }

    // Only an admin may force a repeat send.
    let isAdmin = false;
    if (resend) {
      isAdmin = await isCallerAdmin();
      if (!isAdmin) return json({ sent: false, reason: "not authorised to resend" }, 403);
    }

    const { data: reg, error } = await admin
      .from("cb_event_registrations")
      .select("id, full_name, email, guests, event_slug, confirmation_sent_at")
      .eq("id", registration_id)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!reg) return json({ error: "not found" }, 404);
    if (reg.confirmation_sent_at && !isAdmin) return json({ sent: false, reason: "already sent" });

    const ev = EVENTS[reg.event_slug] ?? EVENTS["dholera-wealth-2026"];

    const smtpPass = Deno.env.get("SMTP_PASSWORD");
    const smtpUser = Deno.env.get("SMTP_USER") ?? "hr@capitalbrix.co.in";
    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EVENT_FROM_EMAIL") ??
      (smtpPass ? `Capital Brix <${smtpUser}>` : "Capital Brix <onboarding@resend.dev>");

    if (!smtpPass && !key) {
      // Registration stands; only the email is missing.
      return json({ sent: false, reason: "No mail provider configured — set SMTP_PASSWORD (Zoho) or RESEND_API_KEY" });
    }

    const name = esc(reg.full_name);
    const seats = reg.guests > 1 ? `${reg.guests} seats are` : "Your seat is";

    const html = `<!doctype html><html><body style="margin:0;background:#F0F5FA;font-family:Inter,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px">
   <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:10px;overflow:hidden">
     <tr><td style="background:#0A1016;padding:26px 28px">
       <p style="margin:0;color:#D4AF37;font-size:11px;letter-spacing:.18em;text-transform:uppercase">Free investor seminar</p>
       <h1 style="margin:8px 0 0;color:#fff;font-size:23px;line-height:1.25">You're registered.</h1>
     </td></tr>
     <tr><td style="padding:26px 28px;color:#334155;font-size:15px;line-height:1.65">
       <p style="margin:0 0 14px">Hello ${name},</p>
       <p style="margin:0 0 18px">${seats} confirmed for <strong style="color:#10243E">${esc(ev.title)}</strong>, hosted by Mirrikh Group and Capital Brix.</p>
       <table role="presentation" width="100%" style="border:1px solid #E6EAF0;border-radius:8px;padding:16px 18px;margin:0 0 18px">
         <tr><td style="font-size:14px;line-height:1.7">
           <strong style="color:#10243E">${esc(ev.dateLabel)}</strong><br/>
           <strong style="color:#10243E">${esc(ev.time)}</strong><br/>
           ${ev.venueLines.map(esc).join("<br/>")}
         </td></tr>
       </table>
       <p style="margin:0 0 18px">Please carry a photo ID. Entry is free, and there is no obligation to buy anything on the day.</p>
       <p style="margin:0 0 6px">Questions, or need to change your booking?</p>
       <p style="margin:0 0 22px"><a href="https://wa.me/917048917300" style="color:#9C7C1C">WhatsApp +91 70489 17300</a></p>
       <p style="margin:0;color:#64748B;font-size:13px">See you there,<br/>Capital Brix LLP</p>
     </td></tr>
     <tr><td style="padding:16px 28px;background:#F8FAFC;color:#94A3B8;font-size:11px;line-height:1.6">
       Capital Brix LLP is an authorised sales channel partner for Mirrikh Infratech Pvt. Ltd.
       A-118, 6th Floor, The Diamond, Sector 136, Noida 201304.
     </td></tr>
    </table>
   </td></tr>
  </table></body></html>`;

    if (smtpPass) {
      const client = new SMTPClient({
        connection: {
          hostname: Deno.env.get("SMTP_HOST") ?? "smtp.zoho.in",
          port: Number(Deno.env.get("SMTP_PORT") ?? 465),
          tls: true,
          auth: { username: smtpUser, password: smtpPass },
        },
      });
      try {
        // "auto" makes denomailer derive a plain-text alternative from the HTML,
        // so the message is multipart and does not look like a bare HTML blob
        // to spam filters.
        await client.send({ from, to: reg.email, subject: ev.subject, html, content: "auto" });
      } catch (e) {
        // Deliberately not a 500: the caller's registration succeeded.
        return json({ sent: false, reason: `smtp: ${String(e).slice(0, 200)}` });
      } finally {
        // Zoho drops the connection itself if we do not; closing failures are
        // not the caller's problem once the message is accepted.
        try { await client.close(); } catch { /* ignore */ }
      }
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [reg.email], subject: ev.subject, html }),
      });

      if (!res.ok) {
        const detail = await res.text();
        // Deliberately not a 500: the caller's registration succeeded.
        return json({ sent: false, reason: `provider ${res.status}`, detail: detail.slice(0, 300) });
      }
    }

    await admin
      .from("cb_event_registrations")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", reg.id);

    return json({ sent: true });
  } catch (e) {
    return json({ sent: false, reason: String(e).slice(0, 200) });
  }
});
