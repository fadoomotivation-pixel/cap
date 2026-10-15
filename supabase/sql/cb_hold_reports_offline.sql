-- Hold a register while the machine is offline, and send it the moment the
-- machine is back with its stored punches.
--
-- 15 October 2026. The office internet went down at 10:36 and came back at
-- 14:12. The terminal kept recording punches in its own memory the whole
-- time, but none of them could reach us, so the 11:36 register went out on a
-- snapshot frozen at 10:36 — and named everybody who arrived after that as
-- Absent, to the whole company, while they were sitting in the office. At
-- 14:12 the terminal reconnected and uploaded 366 punches in one minute. The
-- data was never lost; the message simply did not wait for it.
--
-- The zero-punch guard did not catch it, because this was not a zero-punch
-- day: forty-odd people had punched before 10:36. "Some punches" and "all
-- the punches" read the same from the register. Only the machine's own
-- heartbeat can tell them apart.
--
-- So:
--   1. essl-adms stamps cb_adms_state.last_seen_at on every contact (the
--      terminal polls every 10 s). A gap of more than 3 minutes is an outage;
--      the contact that ends it stamps online_since and offline_from.
--   2. cb_machine_status() says whether the machine is READY: talking to us
--      now, and continuously for 3 minutes — long enough for the backlog it
--      stored while offline to have been uploaded (today's 366 took under a
--      minute).
--   3. cb_send_attendance_report() — the cron entry point — HOLDS a register
--      kind (morning, attendance, late, evening) when the machine is not
--      ready, records it in cb_held_reports, and tells the founder privately
--      that it is being held and why. Nobody in a group is told anything
--      false in the meantime.
--   4. cb_release_held_reports(), every 2 minutes, sends held messages once
--      the machine is ready — oldest first, one per run, so the register is
--      out before the 13:00 update reads its sent_at. Each carries a line
--      saying it is late and why.
--
-- Fails OPEN: a machine with no heartbeat recorded at all (the column is new,
-- or the deploy that writes it was lost) never holds anything. Holding every
-- message forever because a column is empty would be a worse bug than the one
-- this fixes. A held message from an earlier day is never sent: yesterday's
-- register delivered today is noise.

alter table public.cb_adms_state add column if not exists last_seen_at timestamptz;
alter table public.cb_adms_state add column if not exists online_since timestamptz;
alter table public.cb_adms_state add column if not exists offline_from timestamptz;

-- Called by essl-adms on every request from an allowed serial. Throttled to
-- one write per 20 s, so a poll every 10 s costs a write every other poll.
create or replace function public.cb_adms_heartbeat(p_sn text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into cb_adms_state (sn, last_seen_at, online_since)
  values (p_sn, now(), now())
  on conflict (sn) do update set
    offline_from = case when cb_adms_state.last_seen_at < now() - interval '3 minutes'
                        then cb_adms_state.last_seen_at else cb_adms_state.offline_from end,
    online_since = case when cb_adms_state.last_seen_at is null
                          or cb_adms_state.last_seen_at < now() - interval '3 minutes'
                        then now() else cb_adms_state.online_since end,
    last_seen_at = now()
  where cb_adms_state.last_seen_at is null
     or cb_adms_state.last_seen_at < now() - interval '20 seconds';
$$;
revoke all on function public.cb_adms_heartbeat(text) from public, anon, authenticated;
grant execute on function public.cb_adms_heartbeat(text) to service_role;

create or replace function public.cb_machine_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.last_seen_at is null then
      jsonb_build_object('known', false, 'online', null, 'ready', true)
    else jsonb_build_object(
      'known', true,
      'online', s.last_seen_at > now() - interval '3 minutes',
      'ready', s.last_seen_at > now() - interval '3 minutes'
               and s.online_since <= now() - interval '3 minutes',
      'last_seen_at', s.last_seen_at,
      'online_since', s.online_since,
      'offline_from', s.offline_from)
  end
  from (select null::int as one) x
  left join lateral (
    select * from cb_adms_state order by last_seen_at desc nulls last limit 1
  ) s on true;
$$;
grant execute on function public.cb_machine_status() to authenticated, service_role;

create table if not exists public.cb_held_reports (
  report_date   date not null,
  kind          text not null,
  held_at       timestamptz not null default now(),
  offline_since timestamptz,
  released_at   timestamptz,
  outcome       text,
  primary key (report_date, kind)
);
alter table public.cb_held_reports enable row level security;
drop policy if exists cb_held_reports_admin_read on public.cb_held_reports;
create policy cb_held_reports_admin_read on public.cb_held_reports
  for select to authenticated using (cb_is_admin());

-- The cron entry point. Same whitelist and pause rule as before; the hold is
-- the only addition.
create or replace function public.cb_send_attendance_report(p_kind text default 'attendance')
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_secret text;
  v_id     bigint;
  v_today  date := (now() at time zone 'Asia/Kolkata')::date;
  v_m      jsonb;
  v_new    boolean;
begin
  if p_kind not in ('morning','attendance','late','evening','welcome','live','present','absent','reminder','checkout') then
    raise exception 'unknown report kind: %', p_kind;
  end if;
  if exists (select 1 from cb_message_pauses where pause_date = v_today) then
    return null;
  end if;
  select secret into v_secret from public.cb_integration_secrets where name = 'report_cron';

  -- The hold. Only the register kinds: welcome is not a register, and live
  -- finds nothing to say while the machine is silent anyway.
  if p_kind in ('morning','attendance','late','evening')
     and not exists (select 1 from cb_report_log
                      where report_date = v_today and kind = p_kind and ok) then
    v_m := cb_machine_status();
    if not coalesce((v_m->>'ready')::boolean, true) then
      insert into cb_held_reports (report_date, kind, offline_since)
      values (v_today, p_kind,
              case when (v_m->>'online')::boolean
                   then (v_m->>'offline_from')::timestamptz
                   else (v_m->>'last_seen_at')::timestamptz end)
      on conflict do nothing
      returning true into v_new;

      -- Tell the founder once per outage, not once per held message.
      if coalesce(v_new, false) and not exists (
        select 1 from cb_held_reports
         where report_date = v_today and released_at is null and kind <> p_kind) then
        perform net.http_post(
          url := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp',
          headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
          body := jsonb_build_object('kind', p_kind, 'notice', 'held', 'machine', v_m));
      end if;
      return null;
    end if;
  end if;

  select net.http_post(
    url := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := jsonb_build_object('kind', p_kind)
  ) into v_id;
  return v_id;
end;
$function$;

-- Every 2 minutes: once the machine is ready, send what was held — one per
-- run, in the day's order, so each message reads the one before it.
create or replace function public.cb_release_held_reports()
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_today  date := (now() at time zone 'Asia/Kolkata')::date;
  v_m      jsonb := cb_machine_status();
  v_secret text;
  h        cb_held_reports%rowtype;
begin
  if not coalesce((v_m->>'ready')::boolean, true) then return 'machine not ready'; end if;

  -- Anything from an earlier day is closed, never sent.
  update cb_held_reports set released_at = now(), outcome = 'expired — the day was over'
   where released_at is null and report_date < v_today;

  loop
    select * into h from cb_held_reports
     where report_date = v_today and released_at is null
     order by array_position(array['morning','attendance','late','evening'], kind)
     limit 1
     for update skip locked;
    if not found then return 'nothing held'; end if;

    -- Already went out some other way (HR pressed Send now).
    if exists (select 1 from cb_report_log where report_date = v_today and kind = h.kind and ok) then
      update cb_held_reports set released_at = now(), outcome = 'already sent by hand'
       where report_date = h.report_date and kind = h.kind;
      continue;
    end if;

    -- The 10:30 list asks people to go and punch before the register closes.
    -- Once the register's own time has come, it asks for something that can
    -- no longer happen, and the register says everything it would have.
    if h.kind = 'morning' and (now() at time zone 'Asia/Kolkata')::time >= time '11:25' then
      update cb_held_reports set released_at = now(), outcome = 'skipped — the register carries it'
       where report_date = h.report_date and kind = h.kind;
      continue;
    end if;

    select secret into v_secret from cb_integration_secrets where name = 'report_cron';
    perform net.http_post(
      url := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp',
      headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
      body := jsonb_build_object('kind', h.kind, 'delayed', jsonb_build_object(
        'offline_since', coalesce(to_jsonb(h.offline_since) #>> '{}', v_m->>'offline_from'),
        'back_at', v_m->>'online_since')));
    update cb_held_reports set released_at = now(), outcome = 'sent late'
     where report_date = h.report_date and kind = h.kind;
    return 'released ' || h.kind;
  end loop;
end;
$$;
revoke all on function public.cb_release_held_reports() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'cb-release-held-reports';
select cron.schedule('cb-release-held-reports', '*/2 * * * *', 'select public.cb_release_held_reports();');

-- The evening record moves to 20:02 IST (14:32 UTC), on the founder's
-- instruction of 15 October 2026.
select cron.alter_job(jobid, schedule := '32 14 * * *')
  from cron.job where jobname = 'cb-evening-whatsapp';

notify pgrst, 'reload schema';
