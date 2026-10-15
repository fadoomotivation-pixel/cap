import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// The daily Dholera update for the sales team — 14:10 IST, every day.
//
// The founder asked on 15 October 2026 for an agent that finds what is really
// happening in Dholera each day — a big company's investment, a food court, a
// minister's meeting — and posts it so the team can put it on their WhatsApp
// story. A salesperson whose status says "DHL is building a semiconductor
// logistics hub in Dholera" has a reason to be messaged back that a plot
// brochure never gives them.
//
//   Google News RSS, last 72 h, English + Hindi + Gujarati
//   -> hard filter: crime, fraud, deaths, and anything naming a developer
//   -> the project's LLM (Groq, as Call Pro AI's functions already use) picks
//      ONE story and writes it up from the headlines alone
//   -> every number it writes must appear in a source headline, or its text is
//      discarded and the real headline is used instead
//   -> cb_dholera_news, one row per IST day
//   -> WhatsApp: the story, its source, and a link to /story/<date>, where a
//      1080x1920 image is drawn for the status
//
// THREE RULES THAT ARE NOT LEFT TO THE MODEL:
//
// 1. Nothing negative reaches a sales team's status. On the 15th the feed
//    carried a "Nexa Evergreen investment SCAM" about Dholera plots. A model
//    would very probably skip it; "very probably" is not good enough for the
//    one story that would do real damage, so it never sees it.
// 2. Nothing naming a developer. Mirrikh's legal notice of 8 September governs
//    every word published about them, and an advertorial about any developer is
//    not news. Dropped before the model sees it.
// 3. Nothing invented. Facts come from headlines only, numbers are checked
//    against those headlines, and a day with no fresh clean story posts
//    nothing — yesterday's news re-posted as today's is how the team loses
//    credibility with a client.
//
// Called by pg_cron through cb_send_dholera_news() (x-cron-secret), or by an
// admin from /admin/whatsapp with their JWT: { dry_run, regenerate, force }.

const ADMIN_FALLBACK = ["disha@capitalbrix.com"];
const SITE = "https://www.capitalbrix.co.in";
const IST = "Asia/Kolkata";
const WINDOW_H = 72;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const istToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${d}T12:00:00+05:30`));

// ── The feed ────────────────────────────────────────────────────────────────

const FEEDS = [
  "https://news.google.com/rss/search?q=Dholera+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=%E0%A4%A7%E0%A5%8B%E0%A4%B2%E0%A5%87%E0%A4%B0%E0%A4%BE+when:3d&hl=hi&gl=IN&ceid=IN:hi",
  "https://news.google.com/rss/search?q=%E0%AA%A7%E0%AB%8B%E0%AA%B2%E0%AB%87%E0%AA%B0%E0%AA%BE+when:3d&hl=gu&gl=IN&ceid=IN:gu",
  // A second publisher's index, because Google refuses the odd request from
  // Edge Function IPs: on the first day one dry run saw 16 headlines and the
  // next, a minute later, saw none. One source is one bad afternoon away
  // from a day with no post.
  "https://www.bing.com/news/search?q=Dholera&format=rss&setlang=en-IN",
  "https://www.bing.com/news/search?q=%E0%A4%A7%E0%A5%8B%E0%A4%B2%E0%A5%87%E0%A4%B0%E0%A4%BE&format=rss&setlang=hi",
];

type Item = { title: string; source: string; link: string; published: string };
type FeedResult = { url: string; status: number; items: Item[] };

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseRss(xml: string): Item[] {
  const out: Item[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const get = (tag: string) => decode(it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ?? "");
    // Google: <source>Outlet</source>. Bing: <News:Source>Outlet</News:Source>.
    const source = get("source") || get("news:source");
    let title = get("title");
    // Google appends " - Source" to every title.
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    const published = get("pubDate");
    if (title) out.push({ title, source, link: get("link"), published });
  }
  return out;
}

/** Three tries with a short back-off; the status is kept so a failure says which. */
async function fetchFeed(url: string): Promise<FeedResult> {
  let status = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
          "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        },
      });
      status = r.status;
      if (r.ok) {
        const items = parseRss(await r.text());
        if (items.length) return { url, status, items };
      }
    } catch {
      status = -1;
    }
    await sleep(1200 * (attempt + 1));
  }
  return { url, status, items: [] };
}

// Rule 1 and rule 2, as data. Matched against the title and the outlet.
const BLOCK = new RegExp(
  [
    // negative news, in English, Hindi and Gujarati
    "scam", "fraud", "ponzi", "cheat", "duped", "swindl", "arrest", "police", "\\bfir\\b", "probe",
    // "court" alone would drop "food court", which is exactly the kind of
    // story the founder asked for — so only the legal kinds.
    "raid", "laundering", "assets? attached", "high court", "supreme court", "court case", "petition",
    "dispute", "protest", "death", "dead\\b", "died",
    "kill", "murder", "accident", "suicide", "crash", "rape", "flood", "fire\\b", "shortfall", "default",
    "घोटाल", "धोखा", "ठग", "गिरफ्तार", "हत्या", "मौत", "हादसा", "दुर्घटना", "आत्महत्या", "विरोध", "जांच",
    "કૌભાંડ", "છેતરપિંડી", "ધરપકડ", "મોત", "અકસ્માત", "હત્યા", "આત્મહત્યા", "વિરોધ",
    // any developer, Mirrikh first — see rule 2
    "mirrikh", "मिर्रिख", "મિરિખ", "mayur", "nexa", "evergreen", "realty", "developers?\\b", "builder",
    "plots? (for|on) sale", "invest(or)? experience",
  ].join("|"),
  "i",
);

const toAsciiDigits = (s: string) =>
  s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[૦-૯]/g, (d) => String("૦૧૨૩૪૫૬૭૮૯".indexOf(d)));
const numbersIn = (s: string) =>
  new Set((toAsciiDigits(s).replace(/(\d),(?=\d)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []));

// ── The pick ────────────────────────────────────────────────────────────────

type Pick = {
  pick: number;
  same_story?: number[];
  headline_hi?: string;
  headline_en?: string;
  points?: string[];
  why_it_matters?: string;
  reason?: string;
};

async function choose(
  items: Item[],
  alreadyPosted: string[],
  feedback = "",
): Promise<{ pick: Pick | null; error?: string }> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return { pick: null, error: "GROQ_API_KEY is not set" };
  const model = Deno.env.get("NEWS_MODEL") ?? Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";

  const sys = [
    "You are the news desk for a real-estate sales team that sells land near Dholera Smart City, Gujarat.",
    "From the numbered REAL headlines below (all from the last 3 days), pick the ONE story a salesperson",
    "would most want to put on their WhatsApp status for clients today. Prefer, in this order: a big",
    "company's investment or plant/factory progress; a government decision, approval, or a minister's or",
    "official's visit/meeting about Dholera; infrastructure (airport, expressway, rail, metro, port, water,",
    "power, semiconductor); jobs; new amenities (hospital, school, food court, hotel).",
    "",
    "Rules — break none of them:",
    "- Use ONLY facts stated in the headlines. Never add a number, name, date, place or claim that is not there.",
    "- Keep the tense of the headline. A plan, proposal or 'to build' stays a plan ('बनाएगा', 'की योजना');",
    "  never write it as already done. Overstating a fact to a client is worse than understating it.",
    "  Example: 'DHL to build Rs 50 crore hub in Dholera' -> 'DHL धोलेरा में ₹50 करोड़ का हब बनाएगा' (never 'बनाया' or 'निवेश किया').",
    "- headline_hi, every line of points and why_it_matters must be in Hindi (Devanagari). Write धोलेरा, not Dholera.",
    "- Never mention any private real-estate developer, project, broker, plot or price.",
    "- Never promise returns, profit, appreciation or 'best time to invest'.",
    "- Skip negative news, opinion, stock-market pieces, and anything matching ALREADY POSTED.",
    "- Several headlines about the same event: list them all in same_story.",
    "- If nothing qualifies, return {\"pick\": -1, \"reason\": \"...\"}.",
    "",
    "Return ONLY JSON:",
    '{"pick": <n>, "same_story": [<n>...], "headline_hi": "<Hindi, Devanagari, max 70 chars>",',
    '"headline_en": "<English, max 90 chars>", "points": ["<2-3 short Hindi lines, max 60 chars each, facts from the headlines only>"],',
    '"why_it_matters": "<one Hindi line, max 80 chars: what this means for Dholera\'s development, no promises>"}',
  ].join("\n");

  const user = [
    "HEADLINES:",
    ...items.map((it, i) => `${i}. ${it.title} (${it.source})`),
    "",
    "ALREADY POSTED (do not repeat these stories):",
    ...(alreadyPosted.length ? alreadyPosted.map((t) => `- ${t}`) : ["- none"]),
    ...(feedback ? ["", `YOUR PREVIOUS ANSWER WAS REJECTED: ${feedback}. Fix exactly that and answer again.`] : []),
  ].join("\n");

  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: 1800,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
  };
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "medium";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) return { pick: null, error: `LLM ${r.status}: ${JSON.stringify(j).slice(0, 200)}` };
    const txt: string = j.choices?.[0]?.message?.content ?? "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { pick: null, error: "LLM returned no JSON" };
    return { pick: JSON.parse(m[0]) as Pick };
  } catch (e) {
    return { pick: null, error: `LLM: ${String(e).slice(0, 200)}` };
  }
}

// ── The message ─────────────────────────────────────────────────────────────

type NewsRow = {
  news_date: string;
  status: string;
  headline_hi: string | null;
  headline_en: string | null;
  points: string[];
  why_it_matters: string | null;
  source_name: string | null;
  source_url: string | null;
  source_title: string | null;
  published_at: string | null;
  also_reported: string[] | null;
  detail?: string | null;
};

function buildMessage(n: NewsRow): string {
  const L: string[] = [];
  L.push("*DHOLERA UPDATE*");
  L.push(fmtDate(n.news_date));
  L.push("");
  if (n.headline_hi) L.push(`*${n.headline_hi}*`);
  if (n.headline_en) L.push(n.headline_hi ? `_${n.headline_en}_` : `*${n.headline_en}*`);
  if (n.points?.length) {
    L.push("");
    n.points.forEach((p) => L.push(`• ${p}`));
  }
  if (n.why_it_matters) {
    L.push("");
    L.push(n.why_it_matters);
  }
  L.push("");
  const also = (n.also_reported ?? []).filter((s) => s && s !== n.source_name).slice(0, 3);
  L.push(`Source: ${n.source_name ?? "news report"}${also.length ? ` (also ${also.join(", ")})` : ""}`);
  L.push("");
  L.push("Status lagane ke liye image:");
  L.push(`${SITE}/story/${n.news_date}`);
  L.push("");
  L.push("— Capital Brix AI");
  return L.join("\n");
}

async function sendWhatsApp(to: string, text: string) {
  const url = Deno.env.get("WA_WEBHOOK_URL");
  if (!url) return { to, ok: false, detail: "WA_WEBHOOK_URL is not set" };
  const template = Deno.env.get("WA_PAYLOAD_TEMPLATE");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = Deno.env.get("WA_WEBHOOK_TOKEN");
  if (token) {
    const name = Deno.env.get("WA_AUTH_HEADER") ?? "Authorization";
    headers[name] = name.toLowerCase() === "authorization" ? `Bearer ${token}` : token;
  }
  const payload = template
    ? template.replaceAll("{{to}}", JSON.stringify(to).slice(1, -1)).replaceAll("{{text}}", JSON.stringify(text).slice(1, -1))
    : JSON.stringify({ to, text });
  try {
    const res = await fetch(url, { method: "POST", headers, body: payload });
    const body = (await res.text()).slice(0, 200);
    return { to, ok: res.ok, detail: res.ok ? "ok" : `HTTP ${res.status}: ${body}` };
  } catch (e) {
    return { to, ok: false, detail: String(e).slice(0, 200) };
  }
}

// ── The handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const { dry_run, regenerate, force } = body as { dry_run?: boolean; regenerate?: boolean; force?: boolean };

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const cronSecret = Deno.env.get("CRON_SECRET");
    const viaCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
    let viaAdmin = false;
    if (!viaCron) {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (jwt) {
        const { data: u } = await admin.auth.getUser(jwt);
        const email = (u?.user?.email ?? "").toLowerCase();
        if (email) {
          const { data, error } = await admin.rpc("cb_is_admin_email", { p_email: email });
          viaAdmin = error ? ADMIN_FALLBACK.includes(email) : !!data;
        }
      }
    }
    if (!viaCron && !viaAdmin) return json({ error: "not authorised" }, 403);

    const today = istToday();
    const { data: settings } = await admin.from("cb_news_settings").select("enabled, targets").eq("id", 1).maybeSingle();
    if (!viaAdmin && settings && !settings.enabled) {
      return json({ sent: false, reason: "the Dholera update is switched off" });
    }

    const { data: existing } = await admin.from("cb_dholera_news").select("*").eq("news_date", today).maybeSingle();
    if (existing?.status === "posted" && !force && !dry_run) {
      return json({ sent: false, reason: "already sent", posted_at: existing.posted_at });
    }

    // A draft from a Preview is what gets sent — what the founder looked at is
    // what the team receives, unless he asked for a fresh pick.
    let row: NewsRow | null =
      existing && ["draft", "posted", "failed"].includes(existing.status) && existing.headline_en && !regenerate
        ? (existing as NewsRow)
        : null;

    if (!row) {
      const feeds = await Promise.all(FEEDS.map(fetchFeed));
      const all = feeds.flatMap((f) => f.items);
      const feedNote = feeds.map((f) => `${new URL(f.url).hostname.replace("www.", "")}:${f.status}/${f.items.length}`).join(" ");
      const since = Date.now() - WINDOW_H * 3600 * 1000;

      const { data: recent } = await admin
        .from("cb_dholera_news")
        .select("news_date, source_url, source_title, headline_en")
        .eq("status", "posted")
        .gte("news_date", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))
        .neq("news_date", today);
      const usedUrls = new Set((recent ?? []).map((r) => r.source_url).filter(Boolean));
      const alreadyPosted = (recent ?? []).map((r) => r.headline_en || r.source_title).filter(Boolean) as string[];

      const seen = new Set<string>();
      const items = all.filter((it) => {
        const t = Date.parse(it.published);
        if (!Number.isFinite(t) || t < since) return false;
        if (BLOCK.test(it.title) || BLOCK.test(it.source)) return false;
        if (usedUrls.has(it.link)) return false;
        const k = it.title.toLowerCase().replace(/\W+/g, " ").trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 40);

      const skip = async (detail: string) => {
        await admin.from("cb_dholera_news").upsert({
          news_date: today, status: "skipped", detail, updated_at: new Date().toISOString(),
          headline_hi: null, headline_en: null, points: [], why_it_matters: null,
          source_name: null, source_url: null, source_title: null, published_at: null, also_reported: null,
        });
        return json({ sent: false, reason: detail, candidates: items.length, feeds: feedNote });
      };

      // Unreachable is not the same as quiet. Say which, so a retry at 14:25
      // is understood and a genuinely quiet day is not mistaken for an outage.
      if (!all.length) return await skip(`news feeds unreachable (${feedNote})`);
      if (!items.length) return await skip("no fresh, clean Dholera news in the last 72 hours");

      // The model ignores instructions often enough that its answer is CHECKED,
      // not trusted: once with a correction, then the headline as published.
      // The tidy() pass is because it likes U+2011 (non-breaking hyphen) inside
      // Hindi compounds, which renders as a stray dash on most phones.
      const tidy = (t?: string | null) => (t ? t.replace(/[\u2010\u2011]/g, " ").replace(/\s+/g, " ").trim() : null);
      const audit = (p: Pick) => {
        const cl = [p.pick, ...(p.same_story ?? [])]
          .filter((i) => Number.isInteger(i) && i >= 0 && i < items.length)
          .map((i) => items[i]);
        // Rule 3: every number written must be in a headline about this story.
        const allowed = new Set<string>();
        cl.forEach((c) => numbersIn(c.title).forEach((n) => allowed.add(n)));
        const written = [p.headline_hi, p.headline_en, ...(p.points ?? []), p.why_it_matters].filter(Boolean).join(" ");
        const invented = [...numbersIn(written)].filter((n) => !allowed.has(n));
        if (invented.length) return { cluster: cl, problem: `it used numbers that are in no headline (${invented.join(", ")})` };
        // A plan written as if it had happened is an overstatement to a client.
        const planned = cl.every((c) => /\b(to|will|plans?|planned|proposed|set to|likely|soon|by 20\d\d)\b/i.test(c.title));
        const hiText = [p.headline_hi, ...(p.points ?? []), p.why_it_matters].filter(Boolean).join(" ");
        if (planned && /(किया|किए|किये|बनाया|लगाया|शुरू हुआ|शुरू हो गया|स्थापित हुआ|खुल गया|चुका|चुकी|चुके)/.test(hiText)) {
          return { cluster: cl, problem: "the headlines describe a PLAN, but you wrote it in the past tense as if done — use future tense (करेगा / बनाएगा / की योजना)" };
        }
        if (!p.headline_hi || !/[\u0900-\u097F]/.test(p.headline_hi)) return { cluster: cl, problem: "headline_hi must be Hindi in Devanagari" };
        const englishPoints = (p.points ?? []).filter((x) => !/[\u0900-\u097F]/.test(x));
        if (englishPoints.length) return { cluster: cl, problem: "every line in points must be Hindi in Devanagari" };
        return { cluster: cl, problem: "" };
      };

      let pick: Pick | null = null;
      let check = { cluster: [] as Item[], problem: "" };
      let feedback = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await choose(items, alreadyPosted, feedback);
        if (!res.pick) return await skip(res.error ?? "no pick");
        if (res.pick.pick < 0 || res.pick.pick >= items.length) {
          return await skip(`nothing worth posting: ${res.pick.reason ?? ""}`);
        }
        pick = res.pick;
        check = audit(pick);
        if (!check.problem) break;
        feedback = check.problem;
      }
      if (!pick) return await skip("no pick");
      const trusted = !check.problem;
      const cluster = check.cluster;
      const main = items[pick.pick];

      row = {
        news_date: today,
        status: "draft",
        headline_hi: trusted ? tidy(pick.headline_hi) : null,
        headline_en: trusted ? (pick.headline_en ?? main.title) : main.title,
        // Hindi lines only — an English bullet on a Hindi card reads as unfinished.
        points: trusted ? (pick.points ?? []).map((x) => tidy(x) as string).filter(Boolean).slice(0, 3) : [],
        why_it_matters: trusted ? tidy(pick.why_it_matters) : null,
        source_name: main.source || null,
        source_url: main.link || null,
        source_title: main.title,
        published_at: new Date(Date.parse(main.published)).toISOString(),
        also_reported: [...new Set(cluster.map((c) => c.source).filter(Boolean))],
        detail: trusted
          ? `picked from ${items.length} headlines${feedback ? " (corrected once)" : ""} (${feedNote})`
          : `write-up rejected twice — ${check.problem}; used the headline as published (${feedNote})`,
      };
      await admin.from("cb_dholera_news").upsert({ ...row, updated_at: new Date().toISOString() });
    }

    const text = buildMessage(row);
    const configured = ((settings?.targets ?? []) as string[]).map((t) => t.trim()).filter(Boolean);
    let targets = configured;
    if (!targets.length) {
      const { data: hr } = await admin.from("cb_hr_settings").select("wa_group_id").limit(1).maybeSingle();
      targets = hr?.wa_group_id ? [hr.wa_group_id.trim()] : [];
    }

    if (dry_run) {
      return json({ sent: false, dry_run: true, text, targets, story: `${SITE}/story/${today}`, row });
    }
    if (!targets.length) return json({ sent: false, reason: "no WhatsApp group configured", text });

    const results = [];
    for (const to of targets) results.push(await sendWhatsApp(to, text));
    const ok = results.every((r) => r.ok);
    const detail = results.map((r) => `${r.to}: ${r.detail}`).join(" | ").slice(0, 400);
    await admin.from("cb_dholera_news").update({
      status: ok ? "posted" : "failed",
      posted_at: ok ? new Date().toISOString() : null,
      detail,
      updated_at: new Date().toISOString(),
    }).eq("news_date", today);

    return json({ sent: ok, targets, detail, story: `${SITE}/story/${today}` });
  } catch (e) {
    return json({ sent: false, reason: String(e).slice(0, 300) }, 500);
  }
});
