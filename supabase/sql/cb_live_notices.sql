-- LIVE register updates — arrivals after the register, logouts after the
-- evening record, announced within five minutes in each person's own group.
--
-- 12 October 2026. The founder asked for this the evening Jyoti wrote in the
-- group "Still I'm in office. Exit showing 06.23?" — her punches that day were
-- 13:17, 18:19 (a tap on the way out for a few minutes) and 20:03 when she
-- really left. The 19:02 message could only see 18:19, called it her exit,
-- and nothing ever corrected it in the group. The register had the right
-- answer by 20:05; the group never heard it.
--
-- The cron runs every five minutes; attendance-whatsapp kind 'live' sends at
-- most one message per group per run, and only for people not yet announced.
-- cb_live_notices is that memory — one row per person per day per kind — and
-- the 13:00 Register Update skips anybody already in it, so nobody is named
-- twice for the same thing. The message has its own on/off switch on
-- /admin/whatsapp like every other.

create table if not exists cb_live_notices (
  employee_id uuid not null references cb_employees(id) on delete cascade,
  work_date   date not null,
  kind        text not null check (kind in ('arrival', 'logout')),
  sent_at     timestamptz not null default now(),
  primary key (employee_id, work_date, kind)
);
alter table cb_live_notices enable row level security;
drop policy if exists cb_live_notices_read on cb_live_notices;
create policy cb_live_notices_read on cb_live_notices for select to authenticated using (cb_is_admin());

-- The whitelist in the cron entry point — one of the THREE places a new kind
-- must be added (see CLAUDE.md), or the job dies here before any HTTP call.
create or replace function public.cb_send_attendance_report(p_kind text default 'attendance')
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_secret text;
  v_id     bigint;
begin
  if p_kind not in (
    'morning', 'attendance', 'late', 'evening', 'welcome', 'live',
    'present', 'absent', 'reminder', 'checkout'
  ) then
    raise exception 'unknown report kind: %', p_kind;
  end if;

  if exists (
    select 1 from cb_message_pauses
    where pause_date = (now() at time zone 'Asia/Kolkata')::date
  ) then
    return null;
  end if;

  select secret into v_secret
    from public.cb_integration_secrets where name = 'report_cron';

  select net.http_post(
    url     := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', v_secret
    ),
    body    := jsonb_build_object('kind', p_kind)
  ) into v_id;

  return v_id;
end;
$function$;

-- Every five minutes, 11:30–22:55 IST (06:00–17:25 UTC). The function itself
-- does nothing until the register / evening record has actually gone out.
select cron.unschedule('cb-live-whatsapp') where exists (select 1 from cron.job where jobname = 'cb-live-whatsapp');
select cron.schedule('cb-live-whatsapp', '*/5 6-17 * * *', $$select cb_send_attendance_report('live');$$);
