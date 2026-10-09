-- THE CONTROL ROOM — /admin/control
--
-- The founder asked on 9 October 2026 for one screen that runs the machine
-- and the messages without a developer: whose name to change, which group
-- each person's attendance goes to, and WHEN each message is sent.
--
-- Two of those already had controls, spread over three consoles. The third,
-- the time, had none: it lived only in pg_cron, on purpose, because "a
-- schedule two screens can change is one nobody can trust". That reasoning
-- still holds, so the time is now editable in exactly ONE place — this file's
-- cb_set_message_time(), called only by the control room — and the page reads
-- the live cron row rather than keeping a copy that could disagree with it.
--
-- WHY EACH TIME HAS LIMITS, AND THE LIMITS ARE NOT A STYLE CHOICE.
-- The messages carry times in their own words. The register says it "closed
-- at 11:30" and prints a "11:00 – 11:30" window; the evening message splits
-- departures at 18:00 and 19:00. Sent outside those, a message describes time
-- that has not happened yet — the exact bug the 18:45 departure windows were
-- removed for. So each kind has a window it can move in, and the order of the
-- day is enforced: 10:30 provisional, then the register, then who came after.
-- The page prints each rule in words beside the box, so a refusal is never a
-- surprise.

-- ── Which cron job sends which message, and how far each may move ─────────
create or replace function cb_message_schedule_rules()
returns table (kind text, jobname text, label text, min_ist int, max_ist int, rule text)
language sql
immutable
set search_path = public
as $$
  values
    ('morning',    'cb-morning-checkin-whatsapp',   'Morning check-in list',     9*60,      11*60+25,
     'Between 09:00 and 11:25, and before the register. It tells people the register closes at 11:30.'),
    ('attendance', 'cb-daily-attendance-whatsapp',  'The register (11:30 close)', 11*60+31, 12*60+30,
     'Between 11:31 and 12:30. It announces the register closed at 11:30, so it cannot go out before then; anyone arriving after 11:30 still appears under "After 11:30".'),
    ('late',       'cb-late-arrivals-whatsapp',     'Register update (who came after)', 12*60, 17*60,
     'Between 12:00 and 17:00, and at least 15 minutes after the register. It lists who arrived after the register went out.'),
    ('welcome',    'cb-welcome-whatsapp',           'Welcome a new colleague',  10*60,      18*60,
     'Between 10:00 and 18:00.'),
    ('evening',    'cb-evening-whatsapp',           'Evening — who left when',  19*60,      22*60,
     'Between 19:00 and 22:00. It sorts departures into "18:00 – 19:00" and "19:00 onwards", which only make sense once 19:00 has passed.'),
    ('users',      'cb-device-users-refresh',       'Read names from the machine', 6*60,    23*60,
     'Any time between 06:00 and 23:00. New enrolments are also picked up on their own within minutes.')
$$;

-- "m h * * *" in UTC  →  minutes past midnight IST. Only the fixed daily shape
-- this module uses; anything else returns null and the page says so rather
-- than guessing.
create or replace function cb_cron_to_ist_minutes(p_schedule text)
returns int
language plpgsql
immutable
as $$
declare
  m text[] := regexp_match(btrim(p_schedule), '^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$');
begin
  if m is null then return null; end if;
  return ((m[2]::int * 60 + m[1]::int) + 330) % 1440;
end;
$$;

-- ── Read: every message, its live time, and its switch ────────────────────
create or replace function cb_message_schedule()
returns table (
  kind text, label text, jobname text, ist_minutes int, cron_schedule text,
  job_active boolean, message_on boolean, min_ist int, max_ist int, rule text
)
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  v_enabled jsonb;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;
  select coalesce(wa_messages_enabled, '{}'::jsonb) into v_enabled from cb_hr_settings limit 1;

  return query
  select r.kind, r.label, r.jobname,
         cb_cron_to_ist_minutes(j.schedule), j.schedule::text, coalesce(j.active, false),
         -- A missing key means ON, exactly as attendance-whatsapp reads it.
         coalesce((v_enabled ->> r.kind)::boolean, true),
         r.min_ist, r.max_ist, r.rule
  from cb_message_schedule_rules() r
  left join cron.job j on j.jobname = r.jobname
  order by cb_cron_to_ist_minutes(j.schedule) nulls last;
end;
$$;

grant execute on function cb_message_schedule() to authenticated;

-- ── Write: move one message to a new time ────────────────────────────────
create or replace function cb_set_message_time(p_kind text, p_hhmm text)
returns jsonb
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  r        record;
  v_parts  text[];
  v_ist    int;
  v_utc    int;
  v_jobid  bigint;
  v_sched  text;
  v_other  int;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  select * into r from cb_message_schedule_rules() x where x.kind = p_kind;
  if not found then
    raise exception 'unknown message: %', p_kind;
  end if;

  v_parts := regexp_match(btrim(coalesce(p_hhmm, '')), '^(\d{1,2}):(\d{2})$');
  if v_parts is null or v_parts[1]::int > 23 or v_parts[2]::int > 59 then
    raise exception 'give the time as HH:MM, for example 11:36';
  end if;
  v_ist := v_parts[1]::int * 60 + v_parts[2]::int;

  if v_ist < r.min_ist or v_ist > r.max_ist then
    raise exception '%', r.rule;
  end if;

  -- The order of the day. Each message reads as a step after the one before.
  if p_kind = 'morning' then
    select cb_cron_to_ist_minutes(schedule) into v_other from cron.job where jobname = 'cb-daily-attendance-whatsapp';
    if v_other is not null and v_ist >= v_other then
      raise exception 'The morning list must go out before the register (now at %).', lpad((v_other/60)::text, 2, '0') || ':' || lpad((v_other%60)::text, 2, '0');
    end if;
  elsif p_kind = 'attendance' then
    select cb_cron_to_ist_minutes(schedule) into v_other from cron.job where jobname = 'cb-morning-checkin-whatsapp';
    if v_other is not null and v_ist <= v_other then
      raise exception 'The register must go out after the morning list (now at %).', lpad((v_other/60)::text, 2, '0') || ':' || lpad((v_other%60)::text, 2, '0');
    end if;
    select cb_cron_to_ist_minutes(schedule) into v_other from cron.job where jobname = 'cb-late-arrivals-whatsapp';
    if v_other is not null and v_ist > v_other - 15 then
      raise exception 'The register must go out at least 15 minutes before the register update (now at %). Move that one first.', lpad((v_other/60)::text, 2, '0') || ':' || lpad((v_other%60)::text, 2, '0');
    end if;
  elsif p_kind = 'late' then
    select cb_cron_to_ist_minutes(schedule) into v_other from cron.job where jobname = 'cb-daily-attendance-whatsapp';
    if v_other is not null and v_ist < v_other + 15 then
      raise exception 'The register update must go out at least 15 minutes after the register (now at %).', lpad((v_other/60)::text, 2, '0') || ':' || lpad((v_other%60)::text, 2, '0');
    end if;
  end if;

  select jobid into v_jobid from cron.job where jobname = r.jobname;
  if v_jobid is null then
    raise exception 'the scheduled job % does not exist', r.jobname;
  end if;

  v_utc   := (v_ist - 330 + 1440) % 1440;
  v_sched := format('%s %s * * *', v_utc % 60, v_utc / 60);
  perform cron.alter_job(job_id := v_jobid, schedule := v_sched);

  return jsonb_build_object('kind', p_kind, 'ist', p_hhmm, 'cron', v_sched);
end;
$$;

grant execute on function cb_set_message_time(text, text) to authenticated;

-- ── Office closed: no messages that day ──────────────────────────────────
-- A holiday used to cost the group a "the machine sent nothing today"
-- warning — true, and useless — and a register calling everybody Absent if
-- one person tapped in. A paused date stops every scheduled message for that
-- IST day. It is a list of dates, never a switch, because a switch somebody
-- turns off for Diwali is a switch that is still off a week later.
create table if not exists cb_message_pauses (
  pause_date date primary key,
  reason     text,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);

alter table cb_message_pauses enable row level security;

drop policy if exists cb_message_pauses_admin on cb_message_pauses;
create policy cb_message_pauses_admin on cb_message_pauses
  for all to authenticated
  using (cb_is_admin()) with check (cb_is_admin());

-- The cron entry point learns about it. Done here, not in attendance-whatsapp:
-- that function is deployed by hand and has drifted from the repo before, and
-- a manual "Send now" from /admin/whatsapp deliberately does not pass through
-- this function, so a paused day can still be overridden by a person.
create or replace function cb_send_attendance_report(p_kind text default 'attendance')
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_id     bigint;
begin
  if p_kind not in (
    'morning', 'attendance', 'late', 'evening', 'welcome',
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
$$;
