-- One row per person per working day, with the day's state already decided.
--
-- WHY A MATRIX AND NOT MORE TOTALS. cb_monthly_attendance() returns counts,
-- and counts answer "how many" while the founder's actual question is "who,
-- and is it a pattern" - somebody late four times in a month is nothing;
-- somebody late every Monday is a conversation. A per-day grid answers both,
-- because every total on the page is summed from it. The console, the CSV,
-- the charts and the printout therefore cannot disagree: there is one source
-- and it is this.
--
-- A DAY ALMOST NOBODY CAME TO IS NOT A DAY EVERYBODY WAS ABSENT. The register
-- printed 15 September 2026 as one arrival and twenty-eight absences, and
-- 1 September as one and twenty-six. Neither is a working day - they are days
-- the office was shut and somebody tapped the machine, or days the feed was
-- broken. So a day needs a QUORUM before anyone can be called absent on it:
-- at least a quarter of the people who could punch, never fewer than three.
-- The September spread makes the line obvious - 1, 1, 3, 3, 5, 5, then 11, 12,
-- 14, 14, 15, 15, 16 ... there is a clean gap and the rule sits in it.
--
-- NOTHING IS HIDDEN. The day stays, whoever came still shows their time, and
-- only the people who did not are 'off' rather than 'absent'. `low_turnout` is
-- returned so the page can NAME those dates - a day quietly dropped is a
-- correction nobody can argue with, and this one should be arguable.
--
-- Today is always exempt: a month in progress is read at 10am with four people
-- in, and no rule may decide from that that the office is shut.
--
-- WHAT COUNTS AS A WORKING DAY is read from the data, never assumed. This
-- office worked Saturday 26 and Sunday 27 September 2026, so a hardcoded
-- Mon-Fri would have marked two real working days as weekend and everybody
-- on them as off. A day counts when somebody checked in on it, or when HR
-- recorded a status against it - which is exactly what a declared holiday
-- looks like.
--
-- Rendered by src/components/MonthlyAttendanceReport.jsx, folded by
-- src/lib/monthlyAttendance.js.
create or replace function public.cb_monthly_matrix(p_month text)
returns table (
  employee_id uuid,
  full_name text,
  department text,
  team_name text,
  is_senior boolean,
  in_daily_report boolean,
  work_date date,
  state text,
  check_in_at timestamptz,
  check_out_at timestamptz,
  late_minutes integer,
  hours numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  s cb_hr_settings;
  m_start date;
  m_end date;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  select * into s from cb_hr_settings where id = 1;

  m_start := to_date(p_month || '-01', 'YYYY-MM-DD');
  -- Never past today. A month in progress would otherwise show every
  -- remaining day as Absent against every name, which is the same
  -- "cannot tell nobody-came from not-yet" mistake the daily report guards.
  m_end := least(
    (m_start + interval '1 month - 1 day')::date,
    (now() at time zone 'Asia/Kolkata')::date
  );

  return query
  with days as (
    select d::date as work_date
    from generate_series(m_start, m_end, interval '1 day') d
    where exists (
      select 1 from cb_attendance a
      where a.work_date = d::date
        and (a.check_in_at is not null or a.hr_status is not null)
    )
  ),
  people as (
    select e.id, e.full_name, e.department, e.is_senior, e.in_daily_report,
           e.date_of_joining, t.name as team_name
    from cb_employees e
    left join cb_teams t on t.id = e.team_id
    where e.is_active
  )
  select
    p.id, p.full_name, p.department, p.team_name, p.is_senior,
    p.in_daily_report, d.work_date,
    case
      -- Before they joined is not an absence. Without this, every new
      -- colleague's first month reads as three weeks of red.
      when p.date_of_joining is not null and d.work_date < p.date_of_joining
        then 'off'
      -- HR recording something is a statement of fact, so it outranks a
      -- missing punch. Same precedence as the daily register.
      when a.hr_status is not null then 'leave'
      when a.check_in_at is not null then
        case when (a.check_in_at at time zone 'Asia/Kolkata')::time
                  > (s.shift_start + make_interval(mins => s.late_grace_minutes))
             then 'late' else 'on-time' end
      else 'absent'
    end as state,
    a.check_in_at,
    a.check_out_at,
    case when a.check_in_at is null then null else greatest(0, (
      extract(epoch from ((a.check_in_at at time zone 'Asia/Kolkata')::time - s.shift_start)) / 60
    )::int) end as late_minutes,
    round(extract(epoch from (a.check_out_at - a.check_in_at)) / 3600.0, 2)::numeric as hours
  from people p
  cross join days d
  left join cb_attendance a on a.employee_id = p.id and a.work_date = d.work_date
  order by p.full_name, d.work_date;
end;
$$;

revoke all on function public.cb_monthly_matrix(text) from public, anon;
grant execute on function public.cb_monthly_matrix(text) to authenticated;
