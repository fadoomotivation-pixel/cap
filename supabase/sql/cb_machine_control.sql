-- ENROLMENTS THE TERMINAL STILL HOLDS FOR PEOPLE WHO ARE GONE.
--
-- 32 of them on 30 September 2026, the oldest last punched in April. Their
-- finger still works on the machine. Nothing on any screen had ever said so,
-- because the roster and the terminal were only ever compared in ONE
-- direction: we ask "who is missing from the machine" constantly, and had
-- never asked "who is still ON it who should not be".
--
-- Deleting an enrolment is the one destructive command that is safe here, for
-- a precise reason: it does NOT touch cb_device_punches. The attendance
-- already recorded under that code survives, the monthly register keeps their
-- name, and the person can be enrolled again. That is why this is offered and
-- clearing the device is not.
--
-- THE THREE EXCLUSIONS ARE THE WHOLE SAFETY OF IT:
--   1. anybody a current roster member holds - obviously;
--   2. anything in cb_ignored_device_codes - the founder's two IDs, pantry
--      staff, the not-tracked. They are deliberately off the daily report and
--      very much still here; deleting Abhishek-pantry's finger would be the
--      worst outcome this function could produce;
--   3. anything that punched recently. `p_quiet_days` is the judgement, and it
--      is a parameter rather than a constant so the console can be cautious by
--      default and the owner can widen it deliberately.
create or replace function cb_device_stale_enrolments(p_quiet_days integer default 60)
returns table (
  device_code text,
  machine_name text,
  previous_holder text,
  left_on date,
  punches bigint,
  last_punch date,
  quiet_days integer
)
language sql
security definer
set search_path = public
as $$
  select u.device_code,
         u.name,
         btrim(prev.full_name),
         prev.left_on,
         coalesce(s.punches, 0),
         s.last_punch,
         case when s.last_punch is null then null
              else ((now() at time zone 'Asia/Kolkata')::date - s.last_punch) end
  from cb_device_users u
  left join lateral (
    select count(*)::bigint as punches,
           max((p.punch_at at time zone 'Asia/Kolkata')::date) as last_punch
    from cb_device_punches p where p.device_code = u.device_code
  ) s on true
  left join lateral (
    select e.* from cb_employees e
    where e.device_code = u.device_code and e.left_on is not null
    order by e.left_on desc limit 1
  ) prev on true
  where cb_is_admin()
    and not exists (
      select 1 from cb_employees e
      where e.device_code = u.device_code and e.left_on is null and e.is_active
    )
    and not exists (
      select 1 from cb_ignored_device_codes i where i.device_code = u.device_code
    )
    -- greatest(_, 7) so no caller can turn this into "delete everything".
    and coalesce(s.last_punch, date '2000-01-01')
        < (now() at time zone 'Asia/Kolkata')::date - greatest(p_quiet_days, 7)
  order by s.last_punch nulls first;
$$;

grant execute on function cb_device_stale_enrolments(integer) to authenticated;

-- WHO THE TERMINAL HAS SEEN TODAY.
--
-- ADMS runs Realtime=1, so a punch reaches us in seconds - and nothing
-- anywhere showed the one thing that makes that worth having. "13 punches
-- today" is a number; these are people, in the order they arrived.
--
-- IT SAYS "LAST SEEN", NOT "IS IN", and that wording is the honest part. A
-- missing exit punch and a person still at their desk are identical from the
-- machine's side - the same fact that made the evening WhatsApp message stop
-- claiming "Still in office (15)". This reports what the machine saw and when,
-- and leaves the conclusion to a human standing in the room.
create or replace function cb_in_office_now()
returns table (
  device_code text,
  who text,
  first_punch timestamptz,
  last_punch timestamptz,
  taps bigint,
  looks_present boolean,
  on_roster boolean
)
language sql
security definer
set search_path = public
as $$
  with today_p as (
    select p.device_code,
           min(p.punch_at) as first_p,
           max(p.punch_at) as last_p,
           count(*)::bigint as taps
    from cb_device_punches p
    where (p.punch_at at time zone 'Asia/Kolkata')::date
          = (now() at time zone 'Asia/Kolkata')::date
    group by p.device_code
  )
  select t.device_code,
         coalesce(btrim(e.full_name), u.name, 'Code ' || t.device_code),
         t.first_p,
         t.last_p,
         t.taps,
         -- The register's own rule, unchanged: a second tap less than an hour
         -- after the first is the same arrival tapped twice, not a departure.
         -- A different rule here would let this panel and the register
         -- disagree about the same person on the same day.
         (t.last_p < t.first_p + interval '60 minutes'),
         (e.id is not null)
  from today_p t
  -- cb_held_code_on, so a re-issued code shows TODAY's holder rather than the
  -- person who used to have it.
  left join cb_employees e
    on e.device_code = t.device_code
   and cb_held_code_on(e, (now() at time zone 'Asia/Kolkata')::date)
  left join cb_device_users u on u.device_code = t.device_code
  where cb_is_admin()
  order by t.first_p;
$$;

grant execute on function cb_in_office_now() to authenticated;
