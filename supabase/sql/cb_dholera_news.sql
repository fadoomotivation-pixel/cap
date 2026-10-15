-- The daily Dholera update — real news, picked for the sales team, posted at
-- 14:10 IST with a status-sized image anybody can put on their WhatsApp story.
--
-- 15 October 2026, on the founder's ask: "an agent that finds what is really
-- happening in Dholera every day — a big company's investment, a food court, a
-- minister's meeting — and posts it so people can put it on their story."
--
-- The `dholera-news` Edge Function does the work:
--   Google News RSS (English + Hindi + Gujarati, last 72 h)
--   -> hard filter (scams, fraud, crime, deaths, and anything naming a
--      developer, Mirrikh included — see below)
--   -> the project's existing LLM (Groq, as Call Pro AI's functions use) picks
--      ONE story and writes it up from the headlines alone
--   -> every number in the write-up must appear in a source headline, or the
--      write-up is thrown away and the headline itself is used
--   -> cb_dholera_news (one row per IST day)
--   -> WhatsApp text + a link to /story/<date>, where the 1080x1920 image is
--      drawn and shared straight to a status.
--
-- WHY NOTHING NAMING A DEVELOPER, MIRRIKH INCLUDED. On the 15th the feed
-- carried "How Mirrikh Group Is Redefining the Real Estate Investor
-- Experience" next to a Nexa Evergreen investment SCAM involving Dholera
-- plots. The first is the company whose legal notice of 8 September governs
-- every word we publish about them; the second is the single worst thing a
-- sales team could put on its status. Neither is decided by a model's
-- judgement on a given afternoon — both are dropped before it sees them.
--
-- NOTHING IS INVENTED. A day with no fresh, clean story posts nothing and says
-- so in the row. Yesterday's news re-posted as today's is the version of this
-- that costs the team its credibility with a client.

create table if not exists public.cb_dholera_news (
  news_date     date primary key,
  status        text not null default 'draft'
                check (status in ('draft','posted','skipped','failed')),
  headline_hi   text,
  headline_en   text,
  points        jsonb not null default '[]'::jsonb,   -- short Hindi lines
  why_it_matters text,
  source_name   text,
  source_url    text,
  source_title  text,
  published_at  timestamptz,
  also_reported text[],                               -- other outlets, same story
  detail        text,                                 -- why skipped / failed / sent where
  posted_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists cb_dholera_news_url on public.cb_dholera_news (source_url);

alter table public.cb_dholera_news enable row level security;

-- The story page is public — the whole point is that a client can open it.
-- Only what was actually posted is readable without a login; drafts and the
-- reasons a day was skipped are the admin's.
drop policy if exists cb_dholera_news_public on public.cb_dholera_news;
create policy cb_dholera_news_public on public.cb_dholera_news
  for select to anon, authenticated using (status = 'posted');
drop policy if exists cb_dholera_news_admin on public.cb_dholera_news;
create policy cb_dholera_news_admin on public.cb_dholera_news
  for all to authenticated using (cb_is_admin()) with check (cb_is_admin());

-- One row of settings. targets: WhatsApp JIDs to post to; empty means the
-- main group (cb_hr_settings.wa_group_id), so it works before anybody edits it.
create table if not exists public.cb_news_settings (
  id       int primary key default 1 check (id = 1),
  enabled  boolean not null default true,
  targets  text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.cb_news_settings (id) values (1) on conflict do nothing;
alter table public.cb_news_settings enable row level security;
drop policy if exists cb_news_settings_admin on public.cb_news_settings;
create policy cb_news_settings_admin on public.cb_news_settings
  for all to authenticated using (cb_is_admin()) with check (cb_is_admin());

-- The cron entry point, same shape as cb_send_attendance_report: the secret
-- stays in Postgres, the function checks it against CRON_SECRET.
create or replace function public.cb_send_dholera_news()
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare v_secret text; v_id bigint;
begin
  select secret into v_secret from cb_integration_secrets where name = 'report_cron';
  select net.http_post(
    url := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/dholera-news',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) into v_id;
  return v_id;
end;
$$;
revoke all on function public.cb_send_dholera_news() from public, anon, authenticated;

-- 14:10 IST = 08:40 UTC, and again at 14:25 in case the feeds refused the
-- first try. The second run is a no-op once the day is posted ("already sent").
select cron.unschedule(jobid) from cron.job where jobname = 'cb-dholera-news';
select cron.schedule('cb-dholera-news', '40,55 8 * * *', 'select public.cb_send_dholera_news();');

notify pgrst, 'reload schema';
