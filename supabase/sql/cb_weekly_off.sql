-- THE WEEKLY OFF — Tuesday, for juniors. 9 October 2026.
--
-- "Tuesday ka off hota h junior ka" — the founder. The data agrees without
-- being asked: over the eight Tuesdays before this, an average of 3.5 juniors
-- and 0 seniors punched in, against ~20 juniors on every other weekday. Yet
-- the register had no idea, so every Tuesday it published twenty colleagues
-- as Absent on their own day off, and the monthly report counted each one.
--
-- cb_employees.weekly_off is per person (ISO weekday, 1 = Monday … 7 =
-- Sunday), not one company setting, because "juniors off Tuesday" is a rule
-- about most people, not all: seniors keep none, and the Control Room can give
-- anybody a different day. New rows default to Tuesday — almost everybody
-- added is a junior — and seniors are set to none once, below.
--
-- WHAT IT CHANGES, AND ONLY ON A DAY THE PERSON DID NOT PUNCH. Somebody who
-- comes in on their day off appears exactly as on any other day; somebody HR
-- marked (leave, on-duty…) keeps HR's status. Only the "Absent" case moves:
--
--   cb_daily_attendance()         returns weekly_off = true for that row, so
--                                 the console shows "Weekly off", not Absent;
--   cb_daily_attendance_report()  drops the row, so no WhatsApp message names
--                                 them at all — not under Absent, not under
--                                 On leave;
--   cb_monthly_matrix()           reads the day as 'off', like a day before
--                                 somebody joined: not an absence, and out of
--                                 the attendance denominator.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cb_employees' and column_name = 'weekly_off'
  ) then
    alter table cb_employees
      add column weekly_off smallint[] not null default '{2}';
    -- Once, on the first run only: a re-run must never undo a day set by hand.
    update cb_employees set weekly_off = '{}' where is_senior;
  end if;
end;
$$;

comment on column cb_employees.weekly_off is
  'ISO weekdays this person is not expected in (1 = Mon … 7 = Sun). On those days, with no punch and no hr_status, they are "Weekly off", never Absent.';

-- ── The daily register ───────────────────────────────────────────────────
-- Output columns change (weekly_off is added), so both functions are dropped
-- and recreated — the report first, because it reads the register's columns.
drop function if exists cb_daily_attendance_report(date);
drop function if exists cb_daily_attendance(date);

create function cb_daily_attendance(p_date date default current_date)
returns table (
  employee_id uuid, full_name text, department text, employee_code text, phone text,
  work_mode text, hr_status text, check_in_at timestamptz, check_out_at timestamptz,
  hours numeric, is_late boolean, late_minutes integer,
  check_in_lat double precision, check_in_lng double precision,
  distance_from_office double precision, outside_geofence boolean,
  selfie_url text, note text, weekly_off boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare s cb_hr_settings;
begin
  -- cb_is_admin(), never `email not in (…)`: that form is NULL for a caller
  -- with no login and let the public key read this whole register. The
  -- service role is allowed explicitly for the WhatsApp cron.
  if not (cb_is_admin() or coalesce(auth.jwt() ->> 'role', '') = 'service_role') then
    raise exception 'Not authorised';
  end if;

  select * into s from cb_hr_settings where id = 1;

  return query
  select
    e.id,
    e.full_name,
    e.department,
    e.employee_code,
    e.phone,
    a.work_mode,
    a.hr_status,
    a.check_in_at,
    a.check_out_at,
    round(extract(epoch from (a.check_out_at - a.check_in_at)) / 3600.0, 2)::numeric as hours,
    (a.check_in_at is not null
      and (a.check_in_at at time zone 'Asia/Kolkata')::time
          > (s.shift_start + make_interval(mins => s.late_grace_minutes))) as is_late,
    case when a.check_in_at is null then null else greatest(0, (
      extract(epoch from ((a.check_in_at at time zone 'Asia/Kolkata')::time - s.shift_start)) / 60
    )::int) end as late_minutes,
    a.check_in_lat,
    a.check_in_lng,
    case when a.check_in_lat is not null and s.office_lat is not null
      then round(cb_distance_meters(a.check_in_lat, a.check_in_lng, s.office_lat, s.office_lng)::numeric, 0)::double precision
    end as distance_from_office,
    case when a.work_mode = 'office' and a.check_in_lat is not null and s.office_lat is not null
      then cb_distance_meters(a.check_in_lat, a.check_in_lng, s.office_lat, s.office_lng) > s.geofence_meters
      else false end as outside_geofence,
    a.selfie_url,
    a.note,
    -- Only the would-be-Absent case. A punch or an HR status always wins.
    (a.check_in_at is null and a.hr_status is null
      and extract(isodow from p_date)::smallint = any(e.weekly_off)) as weekly_off
  from cb_employees e
  left join cb_attendance a on a.employee_id = e.id and a.work_date = p_date
  where e.is_active
  order by e.full_name;
end;
$$;

revoke all on function cb_daily_attendance(date) from public, anon;
grant execute on function cb_daily_attendance(date) to authenticated, service_role;

-- ── The WhatsApp report's rows ───────────────────────────────────────────
-- Identical to the previous definition except for weekly_off in the column
-- list and the one filter at the bottom.
create function cb_daily_attendance_report(
  p_date date default ((now() at time zone 'Asia/Kolkata'))::date
)
returns table (
  employee_id uuid, full_name text, department text, employee_code text, phone text,
  work_mode text, hr_status text, check_in_at timestamptz, check_out_at timestamptz,
  hours numeric, is_late boolean, late_minutes integer,
  check_in_lat double precision, check_in_lng double precision,
  distance_from_office double precision, outside_geofence boolean,
  selfie_url text, note text, weekly_off boolean,
  is_senior boolean, team_id uuid, team_name text, team_wa_group_id text,
  team_include_seniors boolean
)
language sql
security definer
set search_path = public
as $$
  select d.*,
         -- is_senior HERE MEANS "keep this person out of the group lists",
         -- not "this person is senior". See cb_teams_self_serve.sql.
         (e.is_senior and not coalesce(t.include_seniors, false)),
         t.id, t.name, t.wa_group_id, coalesce(t.include_seniors, false)
  from public.cb_daily_attendance(p_date) d
  join public.cb_employees e on e.id = d.employee_id
  left join public.cb_teams t
    on t.id = e.team_id and t.is_active
   and coalesce(btrim(t.wa_group_id), '') <> ''
  where e.in_daily_report
    and (not e.is_senior
         or d.check_in_at is not null
         or d.hr_status is not null
         or coalesce(t.include_seniors, false))
    -- Somebody on their weekly off who did not come in is not news to anybody
    -- — not Absent, and not "On leave" either. They are simply not named.
    and not d.weekly_off;
$$;

revoke all on function cb_daily_attendance_report(date) from public, anon, authenticated;
grant execute on function cb_daily_attendance_report(date) to service_role;

-- ── The monthly report ───────────────────────────────────────────────────
-- Identical to the previous definition except for `woff` in `people` and the
-- one rule placed after the punch and HR cases: somebody who came in on their
-- day off still shows the time they came, and only the would-be-Absent day
-- turns 'off'.
create or replace function cb_monthly_matrix(p_month text)
returns table (
  employee_id uuid, full_name text, department text, team_name text,
  is_senior boolean, in_daily_report boolean, work_date date, state text,
  check_in_at timestamptz, check_out_at timestamptz, late_minutes integer,
  hours numeric, low_turnout boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s cb_hr_settings;
  m_start date;
  m_end date;
  today_ist date := (now() at time zone 'Asia/Kolkata')::date;
  quorum int;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  select * into s from cb_hr_settings where id = 1;

  m_start := to_date(p_month || '-01', 'YYYY-MM-DD');
  m_end := least((m_start + interval '1 month - 1 day')::date, today_ist);

  -- Every column here is table-qualified: the OUT parameters of this function
  -- share names with cb_employees columns, and an unqualified reference binds
  -- to the parameter rather than the table.
  select greatest(3, ceil(count(*) * 0.25)::int) into quorum
  from cb_employees e0 where e0.is_active and e0.in_daily_report;

  return query
  with days as (
    select d::date as wd
    from generate_series(m_start, m_end, interval '1 day') d
    where exists (
      select 1 from cb_attendance a0
      where a0.work_date = d::date
        and (a0.check_in_at is not null or a0.hr_status is not null)
    )
  ),
  flagged as (
    select days.wd,
           ((select count(*) from cb_attendance a1
               join cb_employees e2 on e2.id = a1.employee_id
              where a1.work_date = days.wd and a1.check_in_at is not null
                and e2.is_active and e2.in_daily_report) < quorum
            and days.wd <> today_ist) as lowt
    from days
  ),
  people as (
    select e.id, e.full_name as fname, e.department as dept, e.is_senior as senior,
           e.in_daily_report as inrep, e.date_of_joining as doj,
           e.left_on as lefton, t.name as tname, e.weekly_off as woff
    from cb_employees e
    left join cb_teams t on t.id = e.team_id
    -- SOMEBODY WHO HAS LEFT STAYS IN THE MONTHS THEY WORKED.
    where e.is_active or e.left_on is not null
  )
  select
    p.id, p.fname, p.dept, p.tname, p.senior, p.inrep, f.wd,
    case
      when p.doj is not null and f.wd < p.doj then 'off'
      when p.lefton is not null and f.wd > p.lefton then 'off'
      when a.hr_status is not null then 'leave'
      when a.check_in_at is not null then
        case when (a.check_in_at at time zone 'Asia/Kolkata')::time
                  > (s.shift_start + make_interval(mins => s.late_grace_minutes))
             then 'late' else 'on-time' end
      -- Their weekly off: not an absence, and out of the denominator.
      when extract(isodow from f.wd)::smallint = any(p.woff) then 'off'
      when f.lowt then 'off'
      else 'absent'
    end as st,
    a.check_in_at, a.check_out_at,
    case when a.check_in_at is null then null else greatest(0, (
      extract(epoch from ((a.check_in_at at time zone 'Asia/Kolkata')::time - s.shift_start)) / 60
    )::int) end,
    round(extract(epoch from (a.check_out_at - a.check_in_at)) / 3600.0, 2)::numeric,
    f.lowt
  from people p
  cross join flagged f
  left join cb_attendance a on a.employee_id = p.id and a.work_date = f.wd
  order by p.fname, f.wd;
end;
$$;
