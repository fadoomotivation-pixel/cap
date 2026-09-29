-- EVERY ID THE MACHINE HAS EVER SEEN, and which numbers are safe to hand out.
--
-- /admin/machine could only show what an OPERLOG upload had told us
-- (cb_device_users), so a code that punches every day but was never in an
-- upload appeared nowhere. On this terminal that is not a corner case: 53
-- codes carry 9,994 punches with nobody on the roster behind them.
--
-- And the question "which ID do I give the new joiner" had no screen at all.
-- It was a walk to the office and a guess, and a guess is how code 11 was
-- nearly handed to a new joiner when it is Sandeep's, with 983 punches behind
-- it. Two people on one code merge into one attendance record and the only
-- evidence is a history nobody can explain.
--
-- THE UNION IS THE POINT: punches, what the machine says about itself, and
-- what the roster says. Any one alone is a partial picture, and the gaps
-- between them are exactly the mistakes worth seeing.
create or replace function cb_device_code_directory()
returns table (
  device_code text,
  code_num int,
  status text,
  roster_name text,
  machine_name text,
  previous_holder text,
  left_on date,
  note text,
  punches bigint,
  first_seen date,
  last_seen date
)
language sql
security definer
set search_path = public
as $$
  with codes as (
    select p.device_code from cb_device_punches p
    union select u.device_code from cb_device_users u
    union select e.device_code from cb_employees e where e.device_code is not null
  ),
  stats as (
    select p.device_code,
           count(*)::bigint as punches,
           min((p.punch_at at time zone 'Asia/Kolkata')::date) as first_seen,
           max((p.punch_at at time zone 'Asia/Kolkata')::date) as last_seen
    from cb_device_punches p group by p.device_code
  )
  select c.device_code,
         -- Sorted as a NUMBER, not as text: otherwise 100 sits between 10 and
         -- 11, and the list is unreadable for exactly the person scanning it
         -- for the next free ID.
         nullif(regexp_replace(c.device_code, '\D', '', 'g'), '')::int,
         case
           when cur.id is not null then 'assigned'
           -- Released by somebody leaving: reusable, but it carries their
           -- history, so cb_set_device_code stamps a handover date.
           when prev.id is not null then 'released'
           when ign.device_code is not null then 'ignored'
           when s.punches is not null then 'unowned'
           else 'free'
         end,
         btrim(cur.full_name),
         u.name,
         btrim(prev.full_name),
         prev.left_on,
         ign.note,
         coalesce(s.punches, 0),
         s.first_seen,
         s.last_seen
  from codes c
  left join stats s on s.device_code = c.device_code
  left join cb_device_users u on u.device_code = c.device_code
  left join cb_ignored_device_codes ign on ign.device_code = c.device_code
  left join lateral (
    select e.* from cb_employees e
    where e.device_code = c.device_code and e.left_on is null limit 1
  ) cur on true
  left join lateral (
    select e.* from cb_employees e
    where e.device_code = c.device_code and e.left_on is not null
    order by e.left_on desc limit 1
  ) prev on true
  where cb_is_admin()
  order by 2 nulls last, 1;
$$;

grant execute on function cb_device_code_directory() to authenticated;

-- Which numbers can actually be given out, and how safe each one is.
--
-- "Never used" is the only fully safe answer: a number with no punch history
-- cannot mix two people's attendance whatever anybody does next. A released
-- number is offered too, SEPARATELY and with the previous holder named,
-- because this office does re-use them and pretending otherwise only moves
-- the decision back to a guess.
drop function if exists cb_free_device_codes(integer);

create function cb_free_device_codes(p_limit integer default 10)
returns table (device_code text, kind text, previous_holder text, last_seen date)
language sql
security definer
set search_path = public
as $$
  (
    select g::text, 'never-used'::text, null::text, null::date
    from generate_series(1, 200) g
    where cb_is_admin()
      and g::text not in (select e.device_code from cb_employees e where e.device_code is not null)
      and g::text not in (select p.device_code from cb_device_punches p)
      and g::text not in (select i.device_code from cb_ignored_device_codes i)
    order by g
    limit greatest(p_limit, 1)
  )
  union all
  (
    select e.device_code, 'released'::text, btrim(e.full_name),
           (select max((p.punch_at at time zone 'Asia/Kolkata')::date)
              from cb_device_punches p where p.device_code = e.device_code)
    from cb_employees e
    where cb_is_admin()
      and e.device_code is not null
      and e.left_on is not null
      and not exists (
        select 1 from cb_employees c
        where c.device_code = e.device_code and c.left_on is null
      )
    order by e.left_on desc
  );
$$;

grant execute on function cb_free_device_codes(integer) to authenticated;
