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

-- SOMEBODY WHO HAS LEFT STAYS IN THE MONTHS THEY WORKED. `is_active` alone
-- erased a resignation from last month's register too, and a muster roll that
-- loses a name the day the person resigns is not a record anybody can file,
-- sign, or settle a dispute with. Days after `left_on` read 'off', exactly as
-- days before they joined do - not an absence, because they were not expected.
--
-- THIS FILE HAD DRIFTED from the deployed function and was missing the quorum
-- rule and `low_turnout` entirely, so applying it would have silently deleted
-- both. It was rebuilt from `pg_get_functiondef` on 30 September 2026. Read the
-- live definition before editing this again.


create or replace function public.cb_monthly_matrix(p_month text)
returns table (
  employee_id uuid, full_name text, department text, team_name text,
  is_senior boolean, in_daily_report boolean, work_date date, state text,
  check_in_at timestamptz, check_out_at timestamptz,
  late_minutes integer, hours numeric, low_turnout boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
           e.left_on as lefton, t.name as tname
    from cb_employees e
    left join cb_teams t on t.id = e.team_id
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
$function$;

revoke all on function public.cb_monthly_matrix(text) from public, anon;
grant execute on function public.cb_monthly_matrix(text) to authenticated;
