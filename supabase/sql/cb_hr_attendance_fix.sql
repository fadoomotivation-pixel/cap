-- HR corrects attendance by hand, from the Command Center.
--
-- 12 October 2026. The founder asked for HR to be able to fix anything
-- manually — a wrong arrival, a missed exit punch, a day that should read
-- leave. HR could already set hr_status from the Attendance console; they
-- could not touch a time at all.
--
-- The trap a naive edit falls into: cb_fold_punches_into_attendance runs every
-- ten minutes and takes least(check_in) / greatest(check_out) against the
-- machine. So an HR correction to a LATER arrival (somebody tapped in, went
-- home, came back) is silently put back to the machine's earlier time within
-- ten minutes, and the console shows a fix that did not hold. So a row HR has
-- edited carries hr_edited_at, and the fold leaves its times alone.
--
-- "Undo my correction" clears the flag and re-folds that one day, so the
-- machine's times return. Every correction records who made it and when.

alter table cb_attendance add column if not exists hr_edited_at timestamptz;
alter table cb_attendance add column if not exists hr_edited_by text;

create or replace function public.cb_fold_punches_into_attendance(
  p_from date default ((now() at time zone 'Asia/Kolkata'))::date,
  p_to   date default ((now() at time zone 'Asia/Kolkata'))::date)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_rows int := 0;
begin
  update public.cb_device_punches p
     set employee_id = e.id
    from public.cb_employees e
   where p.employee_id is null
     and e.device_code = p.device_code
     and public.cb_held_code_on(e, (p.punch_at at time zone 'Asia/Kolkata')::date)
     and (p.punch_at at time zone 'Asia/Kolkata')::date between p_from and p_to;

  with day_punches as (
    select
      e.id as employee_id,
      (p.punch_at at time zone 'Asia/Kolkata')::date as work_date,
      min(p.punch_at) as first_punch,
      max(p.punch_at) as last_punch
    from public.cb_device_punches p
    -- Joined on the code, not on p.employee_id. A roster change must be able
    -- to fix history; reading the stored id means it never can.
    --
    -- WHO HELD THE CODE THAT DAY, not who holds it now: that is the whole of
    -- the leaver rule and the re-issue rule, in one predicate.
    join public.cb_employees e
      on e.device_code = p.device_code
     and public.cb_held_code_on(e, (p.punch_at at time zone 'Asia/Kolkata')::date)
    where (p.punch_at at time zone 'Asia/Kolkata')::date between p_from and p_to
    group by 1, 2
  ),
  folded as (
    insert into public.cb_attendance (employee_id, work_date, work_mode, check_in_at, check_out_at)
    select
      d.employee_id,
      d.work_date,
      'office',
      d.first_punch,
      -- A second punch less than an hour after the first is the same arrival
      -- tapped twice, not a departure.
      case when d.last_punch >= d.first_punch + interval '60 minutes'
           then d.last_punch end
    from day_punches d
    on conflict (employee_id, work_date) do update
      set
        -- least()/greatest() so the machine never contradicts a punch the
        -- employee made in the portal. But a day HR corrected by hand is
        -- HR's: the machine must not quietly put the old time back.
        check_in_at  = case when public.cb_attendance.hr_edited_at is not null
                            then public.cb_attendance.check_in_at
                            else least(public.cb_attendance.check_in_at, excluded.check_in_at) end,
        check_out_at = case when public.cb_attendance.hr_edited_at is not null
                            then public.cb_attendance.check_out_at
                            else greatest(public.cb_attendance.check_out_at, excluded.check_out_at) end,
        work_mode = coalesce(public.cb_attendance.work_mode, excluded.work_mode)
    returning 1
  )
  select count(*) into v_rows from folded;

  return v_rows;
end;
$function$;

-- One person's days, with what the MACHINE saw beside what the register says.
-- Showing the raw punches is the point: "the machine says 10:02 and 10:03, the
-- register says 10:02" is how HR knows whether a correction is needed at all.
create or replace function public.cb_person_attendance(p_employee uuid, p_from date, p_to date)
returns table (work_date date, check_in text, check_out text, hr_status text, hr_note text,
               work_mode text, punches text, hr_edited_at timestamptz, hr_edited_by text)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  return query
  with days as (
    select d::date as day from generate_series(p_from, least(p_to, p_from + 62), interval '1 day') d
  ),
  emp as (select * from cb_employees where id = p_employee)
  select
    days.day,
    to_char(a.check_in_at  at time zone 'Asia/Kolkata', 'HH24:MI'),
    to_char(a.check_out_at at time zone 'Asia/Kolkata', 'HH24:MI'),
    a.hr_status, a.hr_note, a.work_mode,
    (select string_agg(to_char(p.punch_at at time zone 'Asia/Kolkata', 'HH24:MI'), ', ' order by p.punch_at)
       from cb_device_punches p, emp
      where p.device_code = emp.device_code
        and public.cb_held_code_on(emp, days.day)
        and (p.punch_at at time zone 'Asia/Kolkata')::date = days.day),
    a.hr_edited_at, a.hr_edited_by
  from days
  left join cb_attendance a on a.employee_id = p_employee and a.work_date = days.day
  order by days.day desc;
end;
$$;
grant execute on function public.cb_person_attendance(uuid, date, date) to authenticated;

-- Set a day by hand. Times are IST wall clock 'HH:MM'; blank means none.
-- p_reset = true throws the correction away and lets the machine decide again.
create or replace function public.cb_hr_fix_attendance(
  p_employee uuid, p_date date,
  p_in text default null, p_out text default null,
  p_hr_status text default null, p_note text default null,
  p_reset boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_in  timestamptz;
  v_out timestamptz;
  v_st  text := nullif(btrim(coalesce(p_hr_status, '')), '');
  v_who text := auth.jwt() ->> 'email';
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  if not exists (select 1 from cb_employees where id = p_employee) then
    raise exception 'no such employee';
  end if;
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'that date is in the future';
  end if;

  if p_reset then
    -- Back to what the machine says. Times are cleared and re-folded; a status
    -- HR set is kept, because undoing a time correction is not undoing a leave.
    update cb_attendance
       set check_in_at = null, check_out_at = null, hr_edited_at = null, hr_edited_by = null
     where employee_id = p_employee and work_date = p_date;
    perform cb_fold_punches_into_attendance(p_date, p_date);
    return jsonb_build_object('ok', true, 'reset', true);
  end if;

  if nullif(btrim(coalesce(p_in, '')), '') is not null then
    v_in := (p_date + btrim(p_in)::time) at time zone 'Asia/Kolkata';
  end if;
  if nullif(btrim(coalesce(p_out, '')), '') is not null then
    v_out := (p_date + btrim(p_out)::time) at time zone 'Asia/Kolkata';
  end if;
  if v_in is not null and v_out is not null and v_out <= v_in then
    raise exception 'the out time must be after the in time';
  end if;
  if v_out is not null and v_in is null then
    raise exception 'an out time needs an in time';
  end if;

  insert into cb_attendance (employee_id, work_date, work_mode, check_in_at, check_out_at,
                             hr_status, hr_note, hr_edited_at, hr_edited_by)
  values (p_employee, p_date, 'office', v_in, v_out, v_st,
          nullif(btrim(coalesce(p_note, '')), ''), now(), v_who)
  on conflict (employee_id, work_date) do update
     set check_in_at  = excluded.check_in_at,
         check_out_at = excluded.check_out_at,
         hr_status    = excluded.hr_status,
         hr_note      = excluded.hr_note,
         hr_edited_at = now(),
         hr_edited_by = v_who;

  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.cb_hr_fix_attendance(uuid, date, text, text, text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
