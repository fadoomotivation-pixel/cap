import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Everything about an employee's LOGIN, done server-side because it needs the
// service-role key, which must never reach the browser.
//
// This function ran in production for weeks (v4) without being in the repo.
// It is committed now — the exact shape CLAUDE.md warns about, where the
// deployed half of a feature survives and the repo half does not.
//
// Actions (body.action):
//   (none) / "create"  create the login, or reset its password if it exists
//   "set_email"        change the login's email and the roster's together
//   "disable"          stop the login working (somebody who has left)
//   "enable"           undo that
//
// Who may call it is decided by the DATABASE (cb_admins via
// cb_is_admin_email), not by a list in this file — that list is how a departed
// HR's access would have survived every other fix.

// Used only if the database cannot be asked (cb_admins not created yet).
const FALLBACK_ADMINS = [
  "admin@capitalbrix.co.in",
  "ujjwal@capitalbrix.co.in",
  "disha@capitalbrix.com",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Always answer 200 with {success:false, error}. supabase-js swallows the body
// of a non-2xx response and surfaces only "non-2xx status code", which tells
// HR nothing about what actually went wrong.
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

// Readable temp password: no ambiguous characters, easy to dictate on a call.
function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `CB${pick(chars, 4)}${pick(digits, 3)}`;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      return json({ success: false, error: "Server is missing Supabase credentials." });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Who is calling? An Edge Function has no stored session, so getUser()
    //    must be given the token.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ success: false, error: "Missing sign-in token. Please log in again." });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const callerEmail = userData?.user?.email?.toLowerCase();
    if (userErr || !callerEmail) {
      return json({ success: false, error: `Could not verify who is signed in${userErr ? `: ${userErr.message}` : ""}. Please log out and back in.` });
    }

    const { data: isAdmin, error: adminErr } = await admin.rpc("cb_is_admin_email", { p_email: callerEmail });
    const allowed = adminErr ? FALLBACK_ADMINS.includes(callerEmail) : !!isAdmin;
    if (!allowed) return json({ success: false, error: `${callerEmail} is not an HR admin account.` });

    // 2. Input
    let body: {
      action?: string; employee_id?: string; email?: string;
      full_name?: string; password?: string;
    };
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid request body." });
    }
    const action = body.action ?? "create";

    // The roster row, when one is named — the source of truth for which login
    // belongs to whom.
    let emp: { id: string; email: string | null; user_id: string | null } | null = null;
    if (body.employee_id) {
      const { data } = await admin.from("cb_employees")
        .select("id, email, user_id").eq("id", body.employee_id).maybeSingle();
      emp = data ?? null;
      if (!emp) return json({ success: false, error: "No such employee." });
    }

    // Find the auth user for that row: linked id first, else by email.
    async function findUser(email?: string | null) {
      if (emp?.user_id) {
        const { data } = await admin.auth.admin.getUserById(emp.user_id);
        if (data?.user) return data.user;
      }
      const target = (email ?? emp?.email ?? "").toLowerCase();
      if (!target) return null;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      return list?.users?.find((u) => u.email?.toLowerCase() === target) ?? null;
    }

    // ── Disable / enable ───────────────────────────────────────────────────
    if (action === "disable" || action === "enable") {
      const user = await findUser();
      if (!user) return json({ success: false, error: "This person has no login to change." });
      if (user.email?.toLowerCase() === callerEmail) {
        return json({ success: false, error: "You cannot disable your own login." });
      }
      // ~100 years. Supabase has no "disabled" flag; a ban is the switch, and
      // it keeps the account so it can be switched back on.
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        ban_duration: action === "disable" ? "876000h" : "none",
      });
      if (error) return json({ success: false, error: error.message });
      return json({ success: true, action, email: user.email });
    }

    // ── Change email ───────────────────────────────────────────────────────
    if (action === "set_email") {
      const next = body.email?.trim().toLowerCase();
      if (!next || !EMAIL_RE.test(next)) return json({ success: false, error: "That is not an email address." });
      if (!emp) return json({ success: false, error: "employee_id is required." });

      const user = await findUser();
      if (user && user.email?.toLowerCase() === callerEmail) {
        return json({ success: false, error: "Change your own email from your account, not from the roster." });
      }
      if (user) {
        const { error } = await admin.auth.admin.updateUserById(user.id, { email: next, email_confirm: true });
        if (error) return json({ success: false, error: error.message });
      }
      const { error: rosterErr } = await admin.from("cb_employees").update({ email: next }).eq("id", emp.id);
      if (rosterErr) return json({ success: false, error: `Login changed, roster not: ${rosterErr.message}` });
      return json({ success: true, action, email: next, had_login: !!user });
    }

    // ── Create, or reset the password ──────────────────────────────────────
    const email = (body.email ?? emp?.email ?? "").trim().toLowerCase();
    if (!email) return json({ success: false, error: "Email is required." });
    if (email.endsWith(".invalid")) {
      return json({ success: false, error: "That is a placeholder address. Set the person's real email first." });
    }

    // The lock-out guard, narrowed to what it was protecting against: resetting
    // YOUR OWN password from the roster logs you out of the console you are
    // using. Resetting another admin's login (Disha's, after she left) is
    // legitimate and used to be impossible.
    if (email === callerEmail) {
      return json({ success: false, error: "That is your own login — change your password from your account, not from the roster." });
    }

    const password = body.password?.trim() || tempPassword();
    if (password.length < 6) {
      return json({ success: false, error: "Password must be at least 6 characters." });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name ?? "" },
    });

    let userId = created?.user?.id;
    let existed = false;

    if (createErr) {
      const alreadyExists = /already|registered|exists/i.test(createErr.message);
      if (!alreadyExists) return json({ success: false, error: createErr.message });
      existed = true;
      const match = await findUser(email);
      if (!match) return json({ success: false, error: `${email} already exists but could not be found to reset.` });
      userId = match.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updErr) return json({ success: false, error: updErr.message });
    }

    // Link the auth user back to the roster row.
    if (emp && userId) {
      const { error: linkErr } = await admin.from("cb_employees").update({ user_id: userId }).eq("id", emp.id);
      if (linkErr) {
        return json({ success: false, error: `Login created, but linking it to the employee failed: ${linkErr.message}` });
      }
    }

    return json({ success: true, existed, email, password, user_id: userId });
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
