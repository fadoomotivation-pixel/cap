import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// The Dholera news desk for the sales team.
//
// The founder asked on 15 October 2026 for an agent that finds what is really
// happening in Dholera — a big company's investment, a food court, a
// minister's meeting — so the team can put it on their WhatsApp status. The
// same evening he asked to be the editor: share two or three on a day with two
// or three good stories, skip one he does not like, pick a different one.
//
//   12:30 IST  mode=prepare  read the news, write up to 3 candidates, audit
//                            them, and send the founder ONE private message
//                            listing them with a link to the desk
//   desk       /admin/whatsapp — Share / Skip / edit / Find more
//   14:10 IST  mode=publish  every 'approved' story goes to the group in one
//                            message; if he decided nothing, story no. 1 goes
//   14:25 IST  mode=publish  a retry; a no-op once the day is posted
//
// Sources: Google News RSS (English, Hindi, Gujarati) and Bing News RSS.
// Google answers 503 to Edge Function IPs some of the time — one run saw 16
// headlines and the next, a minute later, none — so neither is relied on alone.
//
// THREE RULES THAT ARE CODE, NOT PROMPT:
// 1. Nothing negative reaches a sales team's status. The feed on day one
//    carried a "Nexa Evergreen investment SCAM" about Dholera plots; it is
//    dropped before the model ever sees it.
// 2. Nothing naming a developer, Mirrikh first. Their legal notice of
//    8 September governs every word we publish about them.
// 3. Nothing invented or overstated. Every number must be in a source
//    headline, Hindi lines must be Hindi, a plan must not be written as done
//    (the model wrote "निवेश किए" for "DHL *to* invest" twice), and no line
//    may promise a return. One corrective retry, then the headline as published.
//
// Called by pg_cron through cb_send_dholera_news(mode) with x-cron-secret, or
// by an admin with their JWT: { mode: prepare|more|publish, dry_run, force }.

const ADMIN_FALLBACK = ["disha@capitalbrix.com"];
const SITE = "https://www.capitalbrix.co.in";
const IST = "Asia/Kolkata";
const WINDOW_H = 72;
const PER_RUN = 3;

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

// ── The feeds ───────────────────────────────────────────────────────────────

const FEEDS = [
  "https://news.google.com/rss/search?q=Dholera+when:3d&hl=en-IN&gl=IN&ceid=IN:en",
  "https://news.google.com/rss/search?q=%E0%A4%A7%E0%A5%8B%E0%A4%B2%E0%A5%87%E0%A4%B0%E0%A4%BE+when:3d&hl=hi&gl=IN&ceid=IN:hi",
  "https://news.google.com/rss/search?q=%E0%AA%A7%E0%AB%8B%E0%AA%B2%E0%AB%87%E0%AA%B0%E0%AA%BE+when:3d&hl=gu&gl=IN&ceid=IN:gu",
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

// Rules 1 and 2, as data. Matched against the title and the outlet.
const BLOCK = new RegExp(
  [
    "scam", "fraud", "ponzi", "cheat", "duped", "swindl", "arrest", "police", "\\bfir\\b", "probe",
    // "court" alone would drop "food court" — exactly the kind of story asked for.
    "raid", "laundering", "assets? attached", "high court", "supreme court", "court case", "petition",
    "dispute", "protest", "death", "dead\\b", "died",
    "kill", "murder", "accident", "suicide", "crash", "rape", "flood", "fire\\b", "shortfall", "default",
    "घोटाल", "धोखा", "ठग", "गिरफ्तार", "हत्या", "मौत", "हादसा", "दुर्घटना", "आत्महत्या", "विरोध", "जांच",
    "કૌભાંડ", "છેતરપિંડી", "ધરપકડ", "મોત", "અકસ્માત", "હત્યા", "આત્મહત્યા", "વિરોધ",
    "mirrikh", "मिर्रिख", "મિરિખ", "mayur", "nexa", "evergreen", "realty", "developers?\\b", "builder",
    "plots? (for|on) sale", "invest(or)? experience",
  ].join("|"),
  "i",
);

// Nothing a salesperson forwards may promise money back.
const PROMISE = /(रिटर्न|मुनाफ|गारंटी|दोगुन|पक्का फायदा|\breturns?\b|profit|guarante|double your|appreciat)/i;

const toAsciiDigits = (s: string) =>
  s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[૦-૯]/g, (d) => String("૦૧૨૩૪૫૬૭૮૯".indexOf(d)));
const numbersIn = (s: string) =>
  new Set((toAsciiDigits(s).replace(/(\d),(?=\d)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []));

// The model likes U+2011 inside Hindi compounds; it renders as a stray dash.
const tidy = (t?: string | null) => (t ? t.replace(/[‐‑]/g, " ").replace(/\s+/g, " ").trim() : null);

// ── The editor ──────────────────────────────────────────────────────────────

type Story = {
  pick: number;
  same_story?: number[];
  category?: string;
  headline_hi?: string;
  headline_en?: string;
  points?: string[];
  why_it_matters?: string;
  sales_angle?: string;
};

const SYSTEM = [
  "You are the news desk for a real-estate sales team that sells land near Dholera Smart City, Gujarat.",
  "From the numbered REAL headlines (all from the last 3 days), choose up to N DIFFERENT events that a",
  "salesperson would most want to share with clients today, best first. Value, in this order: a big",
  "company's investment or plant progress; a government decision, approval, or a minister's/official's visit",
  "or meeting about Dholera; infrastructure (airport, expressway, rail, metro, port, water, power,",
  "semiconductor); jobs; new amenities (hospital, school, food court, hotel). Fewer is fine — never pad.",
  "",
  "Rules — break none of them:",
  "- Use ONLY facts stated in the headlines. Never add a number, name, date, place or claim that is not there.",
  "- Keep the tense. A plan or 'to build' stays a plan ('बनाएगा', 'की योजना'), never written as done.",
  "  Example: 'DHL to build Rs 50 crore hub in Dholera' -> 'DHL धोलेरा में ₹50 करोड़ का हब बनाएगा' (never 'बनाया').",
  "- headline_hi, every line of points, why_it_matters and sales_angle are Hindi (Devanagari). Write धोलेरा.",
  "- Never mention any private real-estate developer, project, broker, plot or price.",
  "- Never promise returns, profit, appreciation, doubling or 'best time to invest' — not even in sales_angle.",
  "- Skip negative news, opinion, stock-market pieces, and anything matching ALREADY USED.",
  "- Several headlines about one event: one story, all of them in same_story.",
  "",
  "sales_angle: one Hindi line (max 110 chars) telling the salesperson how to bring this up with a client —",
  "what question it answers or what doubt it settles (e.g. 'जो क्लाइंट पूछते हैं धोलेरा में असली उद्योग है या नहीं, उन्हें यह दिखाएं').",
  "category: one of investment | government | infrastructure | jobs | amenity | other.",
  "",
  "Return ONLY JSON: {\"stories\": [{\"pick\": <n>, \"same_story\": [<n>...], \"category\": \"...\",",
  "\"headline_hi\": \"<max 70 chars>\", \"headline_en\": \"<max 90 chars>\", \"points\": [\"<2-3 lines, max 60 chars>\"],",
  "\"why_it_matters\": \"<max 80 chars, no promises>\", \"sales_angle\": \"...\"}], \"reason\": \"<if none>\"}",
].join("\n");

async function askModel(items: Item[], used: string[], n: number, feedback: string): Promise<{ stories: Story[]; reason?: string; error?: string }> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return { stories: [], error: "GROQ_API_KEY is not set" };
  const model = Deno.env.get("NEWS_MODEL") ?? Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";
  const user = [
    `N = ${n}`,
    "",
    "HEADLINES:",
    ...items.map((it, i) => `${i}. ${it.title} (${it.source})`),
    "",
    "ALREADY USED (do not repeat these events):",
    ...(used.length ? used.map((t) => `- ${t}`) : ["- none"]),
    ...(feedback ? ["", `YOUR PREVIOUS ANSWER WAS REJECTED: ${feedback}. Fix exactly that and answer again.`] : []),
  ].join("\n");
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: 3500,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
  };
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "medium";
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) return { stories: [], error: `LLM ${r.status}: ${JSON.stringify(j).slice(0, 200)}` };
    const m = (j.choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
    if (!m) return { stories: [], error: "LLM returned no JSON" };
    const parsed = JSON.parse(m[0]);
    return { stories: Array.isArray(parsed.stories) ? parsed.stories : [], reason: parsed.reason };
  } catch (e) {
    return { stories: [], error: `LLM: ${String(e).slice(0, 200)}` };
  }
}

const cluster = (s: Story, items: Item[]) =>
  [s.pick, ...(s.same_story ?? [])]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < items.length)
    .map((i) => items[i]);

/** What is wrong with one write-up, or "" when nothing is. */
function audit(s: Story, items: Item[]): string {
  const cl = cluster(s, items);
  const allowed = new Set<string>();
  cl.forEach((c) => numbersIn(c.title).forEach((n) => allowed.add(n)));
  const written = [s.headline_hi, s.headline_en, ...(s.points ?? []), s.why_it_matters, s.sales_angle].filter(Boolean).join(" ");
  const invented = [...numbersIn(written)].filter((n) => !allowed.has(n));
  if (invented.length) return `it used numbers that are in no headline (${invented.join(", ")})`;
  const planned = cl.every((c) => /\b(to|will|plans?|planned|proposed|set to|likely|soon|by 20\d\d)\b/i.test(c.title));
  const hi = [s.headline_hi, ...(s.points ?? []), s.why_it_matters].filter(Boolean).join(" ");
  if (planned && /(किया|किए|किये|बनाया|लगाया|शुरू हुआ|शुरू हो गया|स्थापित हुआ|खुल गया|चुका|चुकी|चुके)/.test(hi)) {
    return "the headlines describe a PLAN but it was written as already done — use future tense (करेगा / बनाएगा / की योजना)";
  }
  if (PROMISE.test(written)) return "it promises returns or profit, which is not allowed anywhere";
  if (!s.headline_hi || !/[ऀ-ॿ]/.test(s.headline_hi)) return "headline_hi must be Hindi in Devanagari";
  if ((s.points ?? []).some((x) => !/[ऀ-ॿ]/.test(x))) return "every line in points must be Hindi";
  if (s.sales_angle && !/[ऀ-ॿ]/.test(s.sales_angle)) return "sales_angle must be Hindi";
  return "";
}

type Row = {
  id?: string;
  news_date: string;
  rank: number;
  status: string;
  category: string | null;
  headline_hi: string | null;
  headline_en: string | null;
  points: string[];
  why_it_matters: string | null;
  sales_angle: string | null;
  source_name: string | null;
  source_url: string | null;
  source_title: string | null;
  published_at: string | null;
  also_reported: string[] | null;
  detail: string | null;
  decided_by?: string | null;
};

/** Read, filter, ask, audit. Returns rows ready to insert, or why there are none. */
async function gather(
  // deno-lint-ignore no-explicit-any
  admin: any,
  today: string,
  startRank: number,
  excludeTitles: string[],
  excludeUrls: string[],
): Promise<{ rows: Row[]; note: string }> {
  const feeds = await Promise.all(FEEDS.map(fetchFeed));
  const all = feeds.flatMap((f) => f.items);
  const feedNote = feeds.map((f) => `${new URL(f.url).hostname.replace("www.", "")}:${f.status}/${f.items.length}`).join(" ");
  if (!all.length) return { rows: [], note: `news feeds unreachable (${feedNote})` };

  // Stories posted in the last 30 days are not news again.
  const { data: recent } = await admin
    .from("cb_dholera_news")
    .select("source_url, source_title, headline_en")
    .eq("status", "posted")
    .gte("news_date", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const usedUrls = new Set([...(recent ?? []).map((r: Row) => r.source_url), ...excludeUrls].filter(Boolean));
  const used = [...(recent ?? []).map((r: Row) => r.headline_en || r.source_title), ...excludeTitles].filter(Boolean) as string[];

  const since = Date.now() - WINDOW_H * 3600 * 1000;
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
  }).slice(0, 45);
  if (!items.length) return { rows: [], note: `no fresh, clean Dholera news in the last 72 hours (${feedNote})` };

  let res = await askModel(items, used, PER_RUN, "");
  if (res.error) return { rows: [], note: res.error };

  // Distinct events only: a story whose headlines overlap an earlier one is dropped.
  const distinct = (list: Story[]) => {
    const taken = new Set<number>();
    return list.filter((s) => {
      const ids = [s.pick, ...(s.same_story ?? [])].filter((i) => Number.isInteger(i) && i >= 0 && i < items.length);
      if (!ids.length || ids.some((i) => taken.has(i))) return false;
      ids.forEach((i) => taken.add(i));
      return true;
    }).slice(0, PER_RUN);
  };
  let stories = distinct(res.stories);
  if (!stories.length) return { rows: [], note: `nothing worth posting: ${res.reason ?? "the model found no fit"}` };

  // One corrective retry for the batch, naming each problem.
  const problems = stories.map((s) => audit(s, items));
  if (problems.some(Boolean)) {
    const fb = problems.map((p, i) => (p ? `story ${i + 1}: ${p}` : "")).filter(Boolean).join("; ");
    const again = await askModel(items, used, PER_RUN, fb);
    if (!again.error && again.stories.length) {
      res = again;
      stories = distinct(again.stories);
    }
  }

  const rows: Row[] = stories.map((s, i) => {
    const problem = audit(s, items);
    const cl = cluster(s, items);
    const main = items[s.pick];
    const ok = !problem;
    return {
      news_date: today,
      rank: startRank + i,
      status: "candidate",
      category: s.category ?? null,
      headline_hi: ok ? tidy(s.headline_hi) : null,
      headline_en: ok ? (s.headline_en ?? main.title) : main.title,
      points: ok ? (s.points ?? []).map((x) => tidy(x) as string).filter(Boolean).slice(0, 3) : [],
      why_it_matters: ok ? tidy(s.why_it_matters) : null,
      sales_angle: ok ? tidy(s.sales_angle) : null,
      source_name: main.source || null,
      source_url: main.link || null,
      source_title: main.title,
      published_at: new Date(Date.parse(main.published)).toISOString(),
      also_reported: [...new Set(cl.map((c) => c.source).filter(Boolean))],
      detail: ok ? `from ${items.length} headlines (${feedNote})` : `write-up rejected — ${problem}; headline used as published`,
    };
  });
  return { rows, note: `${rows.length} stories from ${items.length} headlines (${feedNote})` };
}

// ── The messages ────────────────────────────────────────────────────────────

function teamMessage(rows: Row[], date: string): string {
  const L: string[] = ["*DHOLERA UPDATE*", fmtDate(date)];
  rows.forEach((n, i) => {
    L.push("");
    const num = rows.length > 1 ? `${i + 1}. ` : "";
    if (n.headline_hi) L.push(`*${num}${n.headline_hi}*`);
    if (n.headline_en) L.push(n.headline_hi ? `_${n.headline_en}_` : `*${num}${n.headline_en}*`);
    (n.points ?? []).forEach((p) => L.push(`• ${p}`));
    if (n.sales_angle) L.push(`👉 ${n.sales_angle}`);
    const also = (n.also_reported ?? []).filter((s) => s && s !== n.source_name).slice(0, 2);
    L.push(`Source: ${n.source_name ?? "news report"}${also.length ? ` (also ${also.join(", ")})` : ""}`);
  });
  L.push("");
  L.push(rows.length > 1 ? "Status lagane ke liye images:" : "Status lagane ke liye image:");
  L.push(`${SITE}/story/${date}`);
  L.push("");
  L.push("— Capital Brix AI");
  return L.join("\n");
}

function founderMessage(rows: Row[], date: string, autoPick: boolean): string {
  const L: string[] = ["*Dholera news desk — today's picks*", fmtDate(date), ""];
  rows.forEach((n, i) => L.push(`${i + 1}. ${n.headline_hi || n.headline_en} (${n.source_name ?? "news"})`));
  L.push("");
  L.push(autoPick
    ? "No. 1 goes to the team at 2:10 PM unless you choose otherwise. Share more, skip, or edit here:"
    : "Nothing goes to the team until you choose. Pick here:");
  L.push(`${SITE}/admin/whatsapp`);
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
    const { dry_run, force } = body as { dry_run?: boolean; force?: boolean };
    const mode = ["prepare", "more", "publish"].includes(body?.mode) ? body.mode : "publish";

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const cronSecret = Deno.env.get("CRON_SECRET");
    const viaCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
    let viaAdmin = false;
    let who = "agent";
    if (!viaCron) {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (jwt) {
        const { data: u } = await admin.auth.getUser(jwt);
        const email = (u?.user?.email ?? "").toLowerCase();
        if (email) {
          const { data, error } = await admin.rpc("cb_is_admin_email", { p_email: email });
          viaAdmin = error ? ADMIN_FALLBACK.includes(email) : !!data;
          who = email;
        }
      }
    }
    if (!viaCron && !viaAdmin) return json({ error: "not authorised" }, 403);

    const today = istToday();
    const { data: settings } = await admin.from("cb_news_settings").select("*").eq("id", 1).maybeSingle();
    if (!viaAdmin && settings && !settings.enabled) {
      return json({ sent: false, reason: "the Dholera update is switched off" });
    }
    const autoPick = settings?.auto_pick ?? true;

    const logRun = (m: string, outcome: string) =>
      admin.from("cb_dholera_news_runs").upsert({ news_date: today, mode: m, ran_at: new Date().toISOString(), outcome })
        .then(() => {}, () => {});

    const todays = async (): Promise<Row[]> => {
      const { data } = await admin.from("cb_dholera_news").select("*").eq("news_date", today).order("rank");
      return (data ?? []) as Row[];
    };

    // ── prepare / more: write candidates ──
    const prepare = async (more: boolean) => {
      const existing = await todays();
      if (existing.length && !more) return { rows: existing, note: "already prepared", fresh: false };
      const start = existing.reduce((m, r) => Math.max(m, r.rank), 0) + 1;
      const { rows, note } = await gather(
        admin, today, start,
        existing.map((r) => r.headline_en || r.source_title || "").filter(Boolean),
        existing.map((r) => r.source_url || "").filter(Boolean),
      );
      if (rows.length) await admin.from("cb_dholera_news").insert(rows);
      await logRun(more ? "more" : "prepare", note);
      return { rows: await todays(), note, fresh: rows.length > 0 };
    };

    if (mode === "prepare" || mode === "more") {
      const { rows, note, fresh } = await prepare(mode === "more");
      // The founder hears once a day, privately, when the desk first fills.
      if (mode === "prepare" && fresh && viaCron && (settings?.notify_founder ?? true)) {
        const { data: hr } = await admin.from("cb_hr_settings").select("founder_whatsapp").limit(1).maybeSingle();
        const founder = (hr?.founder_whatsapp ?? "").replace(/\D/g, "");
        if (founder) await sendWhatsApp(founder, founderMessage(rows.filter((r) => r.status === "candidate"), today, autoPick));
      }
      return json({ ok: true, mode, note, stories: rows });
    }

    // ── publish ──
    let rows = await todays();
    if (!rows.length) rows = (await prepare(false)).rows;
    if (!rows.length) {
      await logRun("publish", "nothing to publish");
      return json({ sent: false, reason: "no stories today" });
    }

    // A send that failed (WhatsApp logged out) is retried by the 14:25 run.
    let toSend = rows.filter((r) => r.status === "approved" || r.status === "failed");
    const posted = rows.filter((r) => r.status === "posted");
    const decided = rows.some((r) => r.decided_by);
    if (!toSend.length && posted.length && !force) {
      return json({ sent: false, reason: "already sent", posted: posted.length });
    }
    // Nobody decided anything: the best story goes, so a busy day still posts.
    // Somebody did decide — even "skip all" — and that decision stands.
    if (!toSend.length && !decided && (autoPick || viaAdmin)) {
      toSend = rows.filter((r) => r.status === "candidate").slice(0, 1);
    }
    if (!toSend.length) {
      await logRun("publish", "nothing approved");
      return json({ sent: false, reason: "nothing was approved for today" });
    }
    toSend.sort((a, b) => a.rank - b.rank);

    const text = teamMessage(toSend, today);
    const configured = ((settings?.targets ?? []) as string[]).map((t) => t.trim()).filter(Boolean);
    let targets = configured;
    if (!targets.length) {
      const { data: hr } = await admin.from("cb_hr_settings").select("wa_group_id").limit(1).maybeSingle();
      targets = hr?.wa_group_id ? [hr.wa_group_id.trim()] : [];
    }
    if (dry_run) return json({ sent: false, dry_run: true, text, targets, story: `${SITE}/story/${today}`, stories: toSend });
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
    }).in("id", toSend.map((r) => r.id));
    await logRun("publish", ok ? `posted ${toSend.length}` : `failed: ${detail}`);

    return json({ sent: ok, targets, detail, posted: toSend.length, story: `${SITE}/story/${today}` });
  } catch (e) {
    return json({ sent: false, reason: String(e).slice(0, 300) }, 500);
  }
});
