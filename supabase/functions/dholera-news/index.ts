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
//    headline or the article, a plan must not be written as done (the model
//    once wrote "invested" for "DHL *to* invest", twice), and no line may
//    promise a return. One corrective retry, then the headline as published.
//
// LANGUAGE: professional English, in a national daily's news-desk register.
// The first version wrote Hindi; on 16 October the founder reported clients
// did not take to it. The checks enforce the register: no Indic script, no
// exclamation marks or emoji. headline_hi is left null on every new story.
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

// What a written brief may never contain, whatever the article says.
const WRITTEN_BLOCK = /mirrikh|\bmayur\b|\bnexa\b|evergreen|realty|\bdevelopers?\b|\bbuilders?\b|\bscam|fraud|ponzi/i;

// Nothing a salesperson forwards may promise money back.
const PROMISE = /(रिटर्न|मुनाफ|गारंटी|दोगुन|पक्का फायदा|\breturns?\b|profit|guarante|double your|appreciat)/i;

const toAsciiDigits = (s: string) =>
  s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[૦-૯]/g, (d) => String("૦૧૨૩૪૫૬૭૮૯".indexOf(d)));
const numbersIn = (s: string) =>
  new Set((toAsciiDigits(s).replace(/(\d),(?=\d)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []));

// The model writes U+2010/2011 hyphens, which some phones render oddly. In
// English they are real hyphens ("10-12 January", "Rs 50-crore"), so they
// become a plain "-"; turning them into spaces (as the Hindi version did)
// printed "10 12 January" on 22 October.
const tidy = (t?: string | null) => (t ? t.replace(/[‐‑]/g, "-").replace(/\s+/g, " ").trim() : null);

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
  "- Keep the tense. A plan or 'to build' stays a plan ('will build', 'plans to'), never written as done.",
  "  Example: 'DHL to build Rs 50 crore hub in Dholera' -> 'DHL to set up Rs 50-crore hub in Dholera' (never 'has built').",
  "- Write in English, in the register of a Times of India news desk: crisp, factual, third person, no hype,",
  "  no exclamation marks, no emoji. Headlines in headline style ('Metro line to link Ahmedabad with Dholera airport').",
  "  Amounts as 'Rs 50 crore'. No Hindi or Gujarati script anywhere.",
  "- Never mention any private real-estate developer, project, broker, plot or price.",
  "- Never promise returns, profit, appreciation, doubling or 'best time to invest' — not even in sales_angle.",
  "- Skip negative news, opinion, stock-market pieces, and anything matching ALREADY USED.",
  "- Several headlines about one event: one story, all of them in same_story.",
  "",
  "sales_angle: one English line (max 110 chars) telling the salesperson how to bring this up with a client —",
  "what question it answers or what doubt it settles (e.g. 'For clients who ask whether real industry is coming to Dholera').",
  "category: one of investment | government | infrastructure | jobs | amenity | other.",
  "",
  "Return ONLY JSON: {\"stories\": [{\"pick\": <n>, \"same_story\": [<n>...], \"category\": \"...\",",
  "\"headline_en\": \"<max 95 chars>\", \"points\": [\"<2-3 lines, max 90 chars>\"],",
  "\"why_it_matters\": \"<max 80 chars, no promises>\", \"sales_angle\": \"...\"}], \"reason\": \"<if none>\"}",
].join("\n");

// ── The writer (Groq), with a fallback chain ──────────────────────────────
//
// On 22 October the desk showed "LLM 429 … tokens per day (TPD): Limit
// 200000, Used 199804" and nothing reached the team at 14:10: the one model
// had used its daily allowance, and the 12:30 and 14:10 runs both died on it.
// Groq meters each model separately, so a 429 (or a model that has been
// retired, 404) moves on to the next one instead of ending the day. Reasoning
// is "low" — the audit does the checking, and it costs a fraction of the
// tokens. NEWS_MODELS (comma-separated) overrides the chain.
const DEFAULT_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
];
const MODELS = (Deno.env.get("NEWS_MODELS") ?? Deno.env.get("NEWS_MODEL") ?? "")
  .split(",").map((m) => m.trim()).filter(Boolean);
// Models that answered 429/404 during this request are not asked again.
let spent = new Set<string>();

type Msg = { role: "system" | "user"; content: string };

async function writer(messages: Msg[], maxTokens: number): Promise<{ content?: string; model?: string; error?: string }> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return { error: "GROQ_API_KEY is not set" };
  const chain = MODELS.length ? MODELS : DEFAULT_MODELS;
  const tried: string[] = [];
  for (const model of chain) {
    if (spent.has(model)) continue;
    const body: Record<string, unknown> = {
      model, temperature: 0.2, max_tokens: maxTokens,
      response_format: { type: "json_object" }, messages,
    };
    if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "low";
    if (model.startsWith("qwen/")) body.reasoning_format = "hidden";
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        if (r.status === 429 || r.status === 404) spent.add(model);
        tried.push(`${model.split("/").pop()} ${r.status}`);
        continue;
      }
      const j = await r.json();
      return { content: j.choices?.[0]?.message?.content ?? "", model };
    } catch (e) {
      tried.push(`${model.split("/").pop()} ${String(e).slice(0, 40)}`);
    }
  }
  return { error: `every writer model is out of quota or unavailable (${tried.join(", ") || "all spent"})` };
}

const jsonIn = (content?: string) => {
  const m = (content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
};

async function askModel(items: Item[], used: string[], n: number, feedback: string): Promise<{ stories: Story[]; reason?: string; error?: string }> {
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
  const out = await writer([{ role: "system", content: SYSTEM }, { role: "user", content: user }], 3000);
  if (out.error) return { stories: [], error: out.error };
  const parsed = jsonIn(out.content);
  if (!parsed) return { stories: [], error: `the writer (${out.model}) returned no JSON` };
  return { stories: Array.isArray(parsed.stories) ? parsed.stories : [], reason: parsed.reason };
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
  const body = [s.headline_en, ...(s.points ?? []), s.why_it_matters].filter(Boolean).join(" ");
  if (planned && DONE.test(body)) {
    return "the headlines describe a PLAN but it was written as already done — use 'will', 'to', 'plans to'";
  }
  return styleProblem(s, written);
}

// The founder, 16 October 2026: clients did not take to the Hindi write-ups.
// Everything is professional English now, in a national daily's news-desk
// register. These checks hold the style the prompt asks for.
const INDIC = /[ऀ-૿]/;
const DONE = /\b(has|have|had)( been)? (built|invested|set up|completed|started|opened|launched|commissioned|begun)\b|\b(was|were) (built|completed|inaugurated|commissioned|opened|launched)\b/i;

function styleProblem(s: Story, written: string): string {
  if (PROMISE.test(written)) return "it promises returns or profit, which is not allowed anywhere";
  if (!s.headline_en) return "headline_en is missing";
  if (INDIC.test(written)) return "everything must be in English — no Hindi or Gujarati script";
  if (/[!\u{1F300}-\u{1FAFF}☀-➿]/u.test(written)) return "no exclamation marks or emoji — this is a news desk";
  if (!(s.points ?? []).length) return "points are missing";
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
      headline_hi: null,
      headline_en: ok ? (tidy(s.headline_en) ?? main.title) : main.title,
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
  // Read every picked story in full, one at a time: in parallel they hit the
  // writer's rate limit (16 October). A story whose article cannot be read
  // gets an English brief from its headline and says why.
  for (const r of rows) {
    const { patch, note } = await fullStory(r);
    if (patch) Object.assign(r, patch);
    r.detail = `${note} · ${r.detail ?? ""}`;
  }
  return { rows, note: `${rows.length} stories from ${items.length} headlines (${feedNote})` };
}

// ── The full story ──────────────────────────────────────────────────────────
//
// A headline is half the news. On 16 October the desk offered "Ahmedabad
// Metro to run to Dholera Airport, know when work will start" — and the card
// could not say when, because the agent had only ever read the headline. A
// salesperson forwarding "work will start soon" has nothing to answer the
// client's next question with. So every picked story is now opened, the
// article itself is read, and the write-up is redone from it: what, where,
// how much, when, who, and where things stand.
//
// The same rules hold, against the ARTICLE now rather than the headline:
// every number written must appear in the article text; English; no
// developer; no promise of returns. If the article cannot be reached, a short
// English brief is written from the headlines and the card says so — half a
// story honestly labelled beats a full one invented.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const unescapeJs = (s: string) =>
  s.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\\\\//g, "/");

// Why the last lookup failed, in words the desk can show. "Could not find
// the article" on its own named no cause, and on 22 October that cost an
// evening of guessing which of three steps had stopped working.
let lookupWhy = "";

/** Google News and Bing both link through themselves; find the publisher's own URL. */
async function realUrl(link: string): Promise<string | null> {
  lookupWhy = "";
  try {
    const u = new URL(link);
    if (u.hostname.endsWith("bing.com")) return u.searchParams.get("url");
    if (!u.hostname.endsWith("news.google.com")) return link;
    // Google: the article page carries a signature and timestamp, and one
    // batchexecute call trades them for the real address.
    const id = u.pathname.split("/").pop();
    // The page answers 503 to Edge IPs in bursts (22 October): three tries,
    // alternating between the two addresses Google serves it on.
    let html = "";
    for (let attempt = 0; attempt < 3 && !html; attempt++) {
      const at = attempt % 2 ? `https://news.google.com/articles/${id}?hl=en-IN&gl=IN&ceid=IN:en` : `https://news.google.com/rss/articles/${id}`;
      const page = await fetch(at, { headers: { "User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9" } });
      if (page.ok) html = await page.text();
      else { lookupWhy = `google page ${page.status}`; await sleep(1500 * (attempt + 1)); }
    }
    if (!html) return null;
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    if (!sg || !ts) { lookupWhy = "google page had no signature"; return null; }
    const inner = JSON.stringify([
      "garturlreq",
      [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
      id, Number(ts), sg,
    ]);
    const req = JSON.stringify([[["Fbv4je", inner, null, "generic"]]]);
    // Google refuses this call from Edge IPs some of the time; one more try.
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": UA },
        body: "f.req=" + encodeURIComponent(req),
      });
      if (r.ok) {
        const out = await r.text();
        const m = out.match(/garturlres\\",\\"(.*?)\\"/);
        if (m) return unescapeJs(m[1]);
        lookupWhy = `google lookup answered without an address (${out.slice(0, 60).replace(/\s+/g, " ")})`;
      } else {
        lookupWhy = `google lookup ${r.status}`;
      }
      await sleep(1500);
    }
    return null;
  } catch (e) {
    lookupWhy = `lookup error ${String(e).slice(0, 60)}`;
    return null;
  }
}

// The second road to the article. On 22 October Google's lookup failed for
// both stories of the day and the desk could only offer headlines. The same
// story is almost always on Bing News too, whose RSS carries the publisher's
// address in plain sight — so search it for the headline and accept a result
// only when most of its words match.
const words = (t: string) => new Set(t.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2));

async function findByTitle(title: string): Promise<string | null> {
  const want = words(title);
  if (want.size < 3) return null;
  for (const q of [`"${title}"`, title]) {
    try {
      const r = await fetch(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`, {
        headers: { "User-Agent": UA, "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
      });
      if (!r.ok) continue;
      for (const it of parseRss(await r.text())) {
        const got = words(it.title);
        const shared = [...want].filter((w) => got.has(w)).length;
        if (shared / want.size < 0.6) continue;
        const url = (() => { try { return new URL(it.link).searchParams.get("url"); } catch { return null; } })();
        if (url) return url;
      }
    } catch { /* try the next query */ }
  }
  return null;
}

const stripTags = (h: string) =>
  decode(h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();

/** The article's own words: JSON-LD articleBody first, else its paragraphs. */
async function articleText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow" });
    if (!r.ok) return "";
    const html = (await r.text()).slice(0, 1_500_000);
    let body = "";
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const walk = (o: unknown): void => {
          if (!o || typeof o !== "object") return;
          if (Array.isArray(o)) return o.forEach(walk);
          const rec = o as Record<string, unknown>;
          if (typeof rec.articleBody === "string" && rec.articleBody.length > body.length) body = rec.articleBody;
          Object.values(rec).forEach(walk);
        };
        walk(JSON.parse(m[1].trim()));
      } catch { /* malformed JSON-LD is common */ }
    }
    if (body.length < 300) {
      const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((m) => stripTags(m[1]))
        .filter((t) => t.length > 40 && !/cookie|subscribe|newsletter|copyright|all rights reserved/i.test(t));
      const joined = paras.join("\n");
      if (joined.length > body.length) body = joined;
    }
    if (body.length < 200) {
      const og = html.match(/<meta[^>]+(?:property|name)="(?:og:description|description)"[^>]+content="([^"]+)"/i)?.[1];
      if (og && og.length > body.length) body = decode(og);
    }
    return stripTags(body).slice(0, 5000);
  } catch {
    return "";
  }
}

const FULL_SYSTEM = [
  "You are a senior reporter on the news desk of a leading Indian English daily (the register of The Times",
  "of India), writing a short brief for a real-estate sales team that sells land near Dholera Smart City,",
  "Gujarat. The salesperson forwards it to clients, so it must read like a newspaper, not a sales pitch.",
  "You get ONE news article (it may be in English, Hindi or Gujarati). Give the full picture so the",
  "salesperson can answer a client's follow-up questions: what is happening, exactly where, how much money,",
  "how long/big, by when (dates, phases, deadlines), who is doing it, and what stage it is at now.",
  "",
  "Rules — break none of them:",
  "- Use ONLY facts stated in the ARTICLE. Never add a number, name, date or claim that is not in it.",
  "  If the article does not say something (for example when work starts), do not guess — leave it out.",
  "- Keep the tense the article uses: a plan stays a plan ('will', 'is to', 'plans to'), done stays done.",
  "- English only — no Hindi or Gujarati script. Crisp, factual, third person. No hype, no adjectives",
  "  like 'massive' or 'game-changer', no exclamation marks, no emoji. Amounts as 'Rs 50 crore'.",
  "- headline_en in newspaper headline style: present tense for news, 'to' for plans",
  "  (e.g. 'Ahmedabad Metro Phase 3 to reach Dholera airport; Centre's nod awaited').",
  "- Never mention any private real-estate developer, project, broker, plot or price.",
  "- Never promise returns, profit, appreciation or doubling — not even in sales_angle.",
  "",
  "points: 4-5 full sentences, max 140 chars each, each carrying a concrete fact (number, place, date,",
  "agency) where the article has one. The first answers the headline's own question if the article does.",
  "why_it_matters: one sentence (max 120 chars), factual, no promises.",
  "sales_angle: one line (max 110 chars) for the salesperson only, on when to bring this up with a client.",
  "",
  "Return ONLY JSON: {\"headline_en\": \"<max 100 chars>\", \"points\": [\"...\"],",
  "\"why_it_matters\": \"...\", \"sales_angle\": \"...\",",
  "\"category\": \"investment|government|infrastructure|jobs|amenity|other\", \"usable\": true}",
  "If the text is not a real article about this story (paywall, error page, unrelated), return {\"usable\": false}.",
].join("\n");

// When the article cannot be read, the brief is written from the headlines
// alone — still English, still audited, just shorter.
const HEADLINE_ONLY = "NOTE: you only have the HEADLINE(S), not the article. Write 1-2 points, and only what they state. Never split one fact into several near-identical lines. Set usable to true.";

type Full = Story & { usable?: boolean; llmError?: string };

async function askFull(title: string, text: string, feedback: string, headlineOnly = false): Promise<Full | null> {
  const out = await writer([
    // With headlines only there is no page to judge, so the "not a real
    // article" escape is taken away; otherwise the model uses it and writes nothing.
    { role: "system", content: headlineOnly ? FULL_SYSTEM.replace(/\nIf the text is not a real article[^\n]*/, "") : FULL_SYSTEM },
    { role: "user", content: [`HEADLINE: ${title}`, "", headlineOnly ? "HEADLINES:" : "ARTICLE:", text,
      ...(headlineOnly ? ["", HEADLINE_ONLY] : []),
      ...(feedback ? ["", `YOUR PREVIOUS ANSWER WAS REJECTED: ${feedback}. Fix exactly that.`] : [])].join("\n") },
  ], 2500);
  // Out of quota must not read as "the article was unusable".
  if (out.error) return { llmError: out.error } as Full;
  return jsonIn(out.content) as Full | null;
}

/** The same checks as the headline audit, against the article's own text. */
function auditFull(f: Full, sourceText: string, titles: string[]): string {
  const allowed = numbersIn(sourceText + " " + titles.join(" "));
  const written = [f.headline_en, ...(f.points ?? []), f.why_it_matters, f.sales_angle].filter(Boolean).join(" ");
  const invented = [...numbersIn(written)].filter((n) => !allowed.has(n));
  if (invented.length) return `it used numbers that are not in the article (${invented.join(", ")})`;
  // The negative-news filter already ran on the headline. A full article may
  // legitimately say "accident" (an NHAI road-safety story did), so the
  // written brief is checked only for developers and the words a sales team
  // must never forward.
  const blocked = written.match(WRITTEN_BLOCK)?.[0];
  if (blocked) return `it uses the word "${blocked}", which is not allowed`;
  return styleProblem(f, written);
}

/** Write, audit, retry once. Returns the brief or why it was rejected. */
async function writeBrief(title: string, text: string, titles: string[], headlineOnly: boolean): Promise<{ f: Full | null; problem: string }> {
  // "usable" judges an article page; with only headlines there is no page to judge.
  let f = await askFull(title, text, "", headlineOnly);
  if (f?.llmError) return { f: null, problem: f.llmError };
  if (!f || (f.usable === false && !headlineOnly)) return { f: null, problem: "the page was not a usable article" };
  let problem = auditFull(f, text, titles);
  if (problem) {
    const again = await askFull(title, text, problem, headlineOnly);
    if (again && !again.llmError && (again.usable !== false || headlineOnly)) {
      f = again;
      problem = auditFull(f, text, titles);
    }
  }
  return { f: problem ? null : f, problem };
}

/**
 * Read the article behind one story and rewrite it from the full text.
 * If the article cannot be read, write the English brief from the headlines
 * and say so in the note (the desk labels it "Headline only").
 */
async function fullStory(row: Row): Promise<{ patch: Partial<Row> | null; note: string }> {
  const titles = [row.source_title ?? "", row.headline_en ?? ""].filter(Boolean);
  const title = row.source_title ?? row.headline_en ?? "";
  let url = row.source_url ? await realUrl(row.source_url) : null;
  if (!url && row.source_title) url = await findByTitle(row.source_title);
  const text = url ? await articleText(url) : "";
  let reason = !row.source_url && !url ? "no link to read"
    : !url ? `could not find the article behind the news link${lookupWhy ? ` (${lookupWhy}; not on Bing News either)` : ""}`
    : text.length < 250 ? "the article could not be read (paywall or blocked)" : "";

  let f: Full | null = null;
  if (!reason) {
    const out = await writeBrief(title, text, titles, false);
    f = out.f;
    if (!f) reason = out.problem === "the page was not a usable article" ? out.problem : `full write-up rejected — ${out.problem}`;
  }
  const full = !!f;
  if (!f) {
    const out = await writeBrief(title, titles.join("\n"), titles, true);
    f = out.f;
    if (!f) return { patch: url ? { source_url: url } : null, note: `${reason}; English write-up rejected — ${out.problem}` };
  }
  return {
    patch: {
      ...(url ? { source_url: url } : {}),
      headline_hi: null,
      headline_en: tidy(f.headline_en) ?? row.headline_en,
      points: (f.points ?? []).map((x) => tidy(x) as string).filter(Boolean).slice(0, 5),
      why_it_matters: tidy(f.why_it_matters),
      sales_angle: tidy(f.sales_angle) ?? row.sales_angle,
      category: f.category ?? row.category,
    },
    note: full ? `full story from the article (${text.length} chars)` : reason,
  };
}

// ── The messages ────────────────────────────────────────────────────────────

// The founder, 22 October: "advance version" of what goes to WhatsApp. The
// first version was one block a salesperson had to read, then retype for a
// client. Now it is two kinds of message:
//
//   1. The TEAM BRIEF — every story with its category, the facts, why it
//      matters, and the 👉 line on how to use it with a client. Internal.
//   2. One CLIENT CARD per story, sent right after — the same facts, why it
//      matters and the source, signed by Capital Brix and nothing internal in
//      it, so a salesperson long-presses and forwards it as it stands.
//
// The sales line never appears on a card: a client reading "mention this when
// clients ask…" is reading our playbook.

const longDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${d}T12:00:00+05:30`));

/** The publisher's own address, if we have one — never a Google/Bing redirect. */
const publicLink = (u: string | null) => {
  if (!u) return null;
  try {
    const h = new URL(u).hostname;
    return /(^|\.)(google|bing)\.com$/.test(h) ? null : u;
  } catch { return null; }
};

function teamMessage(rows: Row[], date: string): string {
  const L: string[] = ["*DHOLERA DAILY BRIEF*", `_${longDate(date)} · ${rows.length} ${rows.length > 1 ? "stories" : "story"}_`];
  rows.forEach((n, i) => {
    L.push("");
    L.push(`*${i + 1} · ${(n.category ?? "update").toUpperCase()}*`);
    L.push(`*${n.headline_hi || n.headline_en}*`);
    (n.points ?? []).forEach((p) => L.push(`• ${p}`));
    if (n.why_it_matters) L.push(`_Why it matters:_ ${n.why_it_matters}`);
    if (n.sales_angle) L.push(`👉 *With clients:* ${n.sales_angle}`);
    const also = (n.also_reported ?? []).filter((s) => s && s !== n.source_name).slice(0, 2);
    L.push(`Source: ${n.source_name ?? "news report"}${also.length ? ` (also ${also.join(", ")})` : ""}`);
  });
  L.push("");
  L.push(`📲 *Status image${rows.length > 1 ? "s" : ""}:* ${SITE}/story/${date}`);
  L.push(`⤵ The client-ready version of ${rows.length > 1 ? "each story follows" : "this story follows"} — long-press and forward it as it is.`);
  L.push("");
  L.push("— Capital Brix AI");
  return L.join("\n");
}

function clientCard(n: Row, date: string): string {
  const L: string[] = [`*${n.headline_hi || n.headline_en}*`, `_Dholera update · ${fmtDate(date)}_`, ""];
  (n.points ?? []).forEach((p) => L.push(`• ${p}`));
  if (n.why_it_matters) { L.push(""); L.push(`*Why it matters:* ${n.why_it_matters}`); }
  L.push("");
  L.push(`Source: ${n.source_name ?? "news report"}`);
  const link = publicLink(n.source_url);
  if (link) L.push(link);
  L.push("");
  L.push("_Shared by Capital Brix LLP_");
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
    spent = new Set<string>();
    const body = await req.json().catch(() => ({}));
    const { dry_run, force } = body as { dry_run?: boolean; force?: boolean };
    const mode = ["prepare", "more", "publish", "enrich"].includes(body?.mode) ? body.mode : "publish";

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

    // ── enrich: read the article behind one story (id) or every unposted one today ──
    if (mode === "enrich") {
      let q = admin.from("cb_dholera_news").select("*");
      q = body?.id ? q.eq("id", body.id) : q.eq("news_date", today).neq("status", "posted").neq("status", "skipped");
      const { data: targets } = await q;
      // One at a time, for the same rate-limit reason as gather().
      const results = [];
      for (const r of (targets ?? []) as Row[]) {
        const { patch, note } = await fullStory(r);
        await admin.from("cb_dholera_news").update({
          ...(patch ?? {}),
          detail: `${note} · ${(r.detail ?? "").split(" · ").slice(-1)[0]}`,
          updated_at: new Date().toISOString(),
        }).eq("id", r.id);
        results.push({ rank: r.rank, note, full: /^full story/.test(note) });
      }
      return json({ ok: true, mode, results, stories: await todays() });
    }

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

    const messages = [teamMessage(toSend, today), ...toSend.map((r) => clientCard(r, today))];
    const text = messages.join("\n\n─────── next message ───────\n\n");
    const configured = ((settings?.targets ?? []) as string[]).map((t) => t.trim()).filter(Boolean);
    let targets = configured;
    if (!targets.length) {
      const { data: hr } = await admin.from("cb_hr_settings").select("wa_group_id").limit(1).maybeSingle();
      targets = hr?.wa_group_id ? [hr.wa_group_id.trim()] : [];
    }
    if (dry_run) return json({ sent: false, dry_run: true, text, targets, story: `${SITE}/story/${today}`, stories: toSend });
    if (!targets.length) return json({ sent: false, reason: "no WhatsApp group configured", text });

    // The brief first, then the cards in order. A card is not sent to a group
    // whose brief failed — a forwardable card with no brief above it is noise.
    // Only the briefs decide "posted": a story marked failed is re-sent at
    // 14:25, and re-sending a brief that already arrived because one card
    // did not would put the whole thing in the group twice.
    const results = [];
    const briefs = [];
    for (const to of targets) {
      const brief = await sendWhatsApp(to, messages[0]);
      results.push(brief);
      briefs.push(brief);
      if (!brief.ok) continue;
      for (const card of messages.slice(1)) results.push(await sendWhatsApp(to, card));
    }
    const ok = briefs.every((r) => r.ok);
    const detail = targets.map((t) => {
      const mine = results.filter((r) => r.to === t);
      const bad = mine.find((r) => !r.ok);
      return `${t}: ${bad ? bad.detail : `ok (${mine.length} messages)`}`;
    }).join(" | ").slice(0, 400);
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
