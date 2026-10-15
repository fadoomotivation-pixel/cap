-- The Dholera news desk: the agent proposes, the founder decides.
--
-- 15 October 2026, the evening after the daily update shipped. The founder
-- asked to see the day's good stories himself — share two or three when there
-- are two or three, skip one he does not like, or choose a different one.
-- One automatic pick a day answered "what is the news"; the question a sales
-- head actually asks is "which of today's news helps us sell", and that is a
-- judgement worth one minute of his time.
--
-- So the table holds CANDIDATES, several per day, and a status per story:
--
--   12:30 IST  prepare  the agent writes up to three stories, each audited
--                       (numbers from headlines, Hindi, a plan never written
--                       as done), ranks them, and sends the founder ONE
--                       private WhatsApp listing them with a link to the desk
--   any time   desk     /admin/whatsapp: Share / Skip / edit the Hindi
--                       headline / "Find more"
--   14:10 IST  publish  every story marked 'approved' goes out, in rank order,
--                       in ONE message to the group, with one link to all of
--                       today's status images
--
-- If he has not touched the desk by 14:10, story no. 1 goes (auto_pick), so
-- the feature keeps working on a day he is busy. If he has decided anything
-- — even "skip all" — his decision stands and nothing is auto-picked: a
-- skipped story going out anyway would make the Skip button a lie.
--
-- Every story also carries a sales_angle: one line telling the salesperson how
-- to use it in a conversation with a client. It goes in the group message (the
-- team's), never on the status image (the client's), and like everything else
-- it may not promise a return.

drop table if exists public.cb_dholera_news cascade;

create table public.cb_dholera_news (
  id             uuid primary key default gen_random_uuid(),
  news_date      date not null,
  rank           int  not null default 1,
  status         text not null default 'candidate'
                 check (status in ('candidate','approved','skipped','posted','failed')),
  category       text,
  headline_hi    text,
  headline_en    text,
  points         jsonb not null default '[]'::jsonb,
  why_it_matters text,
  sales_angle    text,
  source_name    text,
  source_url     text,
  source_title   text,
  published_at   timestamptz,
  also_reported  text[],
  detail         text,
  decided_by     text,          -- who approved / skipped / edited it, null = the agent
  decided_at     timestamptz,
  posted_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (news_date, rank)
);
create index cb_dholera_news_url on public.cb_dholera_news (source_url);

alter table public.cb_dholera_news enable row level security;
-- Public: only what went out. The status page is shared with clients.
create policy cb_dholera_news_public on public.cb_dholera_news
  for select to anon, authenticated using (status = 'posted');
create policy cb_dholera_news_admin on public.cb_dholera_news
  for all to authenticated using (cb_is_admin()) with check (cb_is_admin());

-- What happened on a day the desk had nothing to offer (feeds down, a quiet
-- news day). One row per day, so "nothing today" is a recorded fact, not an
-- empty list that looks the same as "not run yet".
create table if not exists public.cb_dholera_news_runs (
  news_date  date not null,
  mode       text not null,
  ran_at     timestamptz not null default now(),
  outcome    text,
  primary key (news_date, mode)
);
alter table public.cb_dholera_news_runs enable row level security;
drop policy if exists cb_dholera_news_runs_admin on public.cb_dholera_news_runs;
create policy cb_dholera_news_runs_admin on public.cb_dholera_news_runs
  for select to authenticated using (cb_is_admin());

alter table public.cb_news_settings add column if not exists auto_pick boolean not null default true;
alter table public.cb_news_settings add column if not exists notify_founder boolean not null default true;

-- The cron entry point now takes a mode.
drop function if exists public.cb_send_dholera_news();
create or replace function public.cb_send_dholera_news(p_mode text default 'publish')
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare v_secret text; v_id bigint;
begin
  if p_mode not in ('prepare','publish') then raise exception 'unknown mode %', p_mode; end if;
  select secret into v_secret from cb_integration_secrets where name = 'report_cron';
  select net.http_post(
    url := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/dholera-news',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 150000
  ) into v_id;
  return v_id;
end;
$$;
revoke all on function public.cb_send_dholera_news(text) from public, anon, authenticated;

-- 12:30 IST prepare (07:00 UTC), 14:10 and 14:25 IST publish (08:40, 08:55 UTC).
select cron.unschedule(jobid) from cron.job where jobname in ('cb-dholera-news', 'cb-dholera-news-prepare');
select cron.schedule('cb-dholera-news-prepare', '0 7 * * *', $c$select public.cb_send_dholera_news('prepare');$c$);
select cron.schedule('cb-dholera-news', '40,55 8 * * *', $c$select public.cb_send_dholera_news('publish');$c$);

notify pgrst, 'reload schema';
