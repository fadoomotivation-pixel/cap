import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// The Capital Brix side of the WhatsApp link.
//
// The attendance reports are posted by a Baileys worker that also runs Call Pro
// AI's WhatsApp. That worker lives on someone else's dashboard, speaks its own
// vocabulary ("the rep needs to scan the QR again") and is protected by a
// bearer token. None of that belongs in a browser, and none of it tells HR
// whether *Capital Brix attendance* is working.
//
// So this proxies the four things the console needs, holds the token here, and
// answers in terms of this system:
//
//   status     is the WhatsApp link up, and which number is it
//   qr         the pairing square, when the worker is offering one
//   reconnect  ask the worker to start a session so a QR appears
//   test       send one message to a number or a group, and say what came back
//
// Admin JWT only. There is no cron path and there must not be one: everything
// here either reveals the state of a WhatsApp account or sends a message.
//
// Secrets: WA_WEBHOOK_URL (the worker's /send URL), WA_WEBHOOK_TOKEN,
// optionally WA_BASE_URL to override the derived base.

const ADMIN_EMAILS = [
  "admin@capitalbrix.co.in",
  "ujjwal@capitalbrix.co.in",
  "disha@capitalbrix.com",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * The worker's base URL.
 *
 * WA_WEBHOOK_URL is already configured and points at `/send`, so the base is
 * that with the last segment removed rather than a second secret to keep in
 * step. WA_BASE_URL overrides it if the worker ever moves the send route
 * somewhere that does not sit directly under the root.
 */
function baseUrl(): string | null {
  const explicit = Deno.env.get("WA_BASE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  const send = Deno.env.get("WA_WEBHOOK_URL");
  if (!send) return null;
  return send.replace(/\/+$/, "").replace(/\/send$/i, "");
}

/**
 * A number WhatsApp will recognise.
 *
 * Baileys builds `<digits>@s.whatsapp.net` out of whatever it is handed and
 * returns a message id either way, so a number without its country code is
 * accepted, acknowledged, and delivered to nobody. That is far worse than a
 * refusal: the page went green, the id was printed, and the message did not
 * exist. India is the only country this office dials, so a bare ten digits
 * gets +91 and anything already carrying a code is left alone.
 */
function waNumber(raw: string): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

const authHeaders = () => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = Deno.env.get("WA_WEBHOOK_TOKEN");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
};

/**
 * One call to the worker, with the failure surfaced rather than thrown.
 *
 * A worker that is down, a DNS failure and a 503 from a logged-out session all
 * have to reach the console as something it can render, because "nothing
 * happened" is exactly the state this page exists to end.
 */
async function call(path: string, init?: RequestInit) {
  const base = baseUrl();
  if (!base) {
    return { ok: false, status: 0, body: { error: "WA_WEBHOOK_URL is not set" } };
  }
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: { error: String(e).slice(0, 300) } };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const jwt = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!jwt) return json({ error: "not authorised" }, 403);
    const { data: u } = await admin.auth.getUser(jwt);
    const email = u?.user?.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return json({ error: "not authorised" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { action, to, text } = body as {
      action?: string;
      to?: string;
      text?: string;
    };

    if (action === "reconnect") {
      const r = await call("/reconnect", { method: "POST" });
      return json({ ok: r.ok, status: r.status, body: r.body });
    }

    if (action === "qr") {
      const r = await call("/qr");
      return json({ ok: r.ok, status: r.status, body: r.body });
    }

    if (action === "test") {
      const target = String(to ?? "").trim();
      if (!target) return json({ error: "a number or group id is required" }, 400);
      // A group JID is passed through whole; a phone number is normalised, so
      // "+91 70489 17300", "07048917300" and "7048917300" all reach the same
      // person.
      const cleaned = target.endsWith("@g.us") ? target : waNumber(target);
      const r = await call("/send", {
        method: "POST",
        body: JSON.stringify({
          to: cleaned,
          text: text ||
            "Capital Brix attendance — test message. If you are reading this, the daily register can reach this chat.",
        }),
      });
      return json({ ok: r.ok, status: r.status, target: cleaned, body: r.body });
    }

    // Default: status. /health needs no bearer and counts sessions by state,
    // which is the one view that distinguishes "the worker is down" from "the
    // worker is up and logged out" — the two things that look identical from
    // here.
    const [health, status] = await Promise.all([call("/health"), call("/status")]);
    return json({
      configured: !!baseUrl(),
      base: baseUrl(),
      health: { ok: health.ok, status: health.status, body: health.body },
      status: { ok: status.ok, status: status.status, body: status.body },
    });
  } catch (e) {
    return json({ error: String(e).slice(0, 300) }, 500);
  }
});
