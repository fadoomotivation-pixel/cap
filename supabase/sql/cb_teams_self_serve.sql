-- Teams, self-serve — and a team group that may name its seniors.
--
-- Teams already existed (see cb_teams.sql). What did not exist was any way to
-- create or change one without a developer, which is the whole reason "send
-- the backend team's attendance to this group" was a request rather than a
-- setting. And a subtler gap: EVERY group message is juniors only
-- (`juniors()` in attendance-whatsapp, on the founder's instruction of
-- 23 September, because a senior's arrival time in a fifty-person group is a
-- name taking up space in a list the team scans for its own). Put a director
-- on a team and their attendance would simply never have been sent, with
-- nothing on any screen saying so.

alter table cb_teams add column if not exists include_seniors boolean not null default false;

comment on column cb_teams.include_seniors is
  'Whether this team''s message names its seniors and directors too. The main group deliberately does not. A small team group is a different room. Off by default, so no existing team changes behaviour.';

-- ── The whole setting is enforced HERE, in one expression ──────────────
-- `is_senior` as this function returns it means "keep this person out of the
-- group lists", NOT "this person is senior". The roster's own column is
-- untouched and is what every console reads; this function has exactly one
-- consumer, the attendance-whatsapp Edge Function.
--
-- Every group message filters on it through `juniors()`, so flattening the
-- flag once here serves a team that has asked to name its seniors without any
-- message builder having to check a second column — and a builder written
-- next year cannot forget a filter it never sees. It also means no Edge
-- Function deploy: the behaviour is entirely in SQL.
--
-- The founder's 11:30 register does not filter on it at all (it is the whole
-- company), so flattening cannot change what he receives.
drop function if exists cb_daily_attendance_report(date);

create function cb_daily_attendance_report(
  p_date date default (now() at time zone 'Asia/Kolkata')::date
)
returns table (
  employee_id uuid, full_name text, department text, employee_code text,
  phone text, work_mode text, hr_status text,
  check_in_at timestamptz, check_out_at timestamptz, hours numeric,
  is_late boolean, late_minutes integer,
  check_in_lat double precision, check_in_lng double precision,
  distance_from_office double precision, outside_geofence boolean,
  selfie_url text, note text, is_senior boolean,
  team_id uuid, team_name text, team_wa_group_id text,
  team_include_seniors boolean
)
language sql
security definer
set search_path = public
as $$
  select d.*,
         (e.is_senior and not coalesce(t.include_seniors, false)),
         t.id, t.name, t.wa_group_id, coalesce(t.include_seniors, false)
  from public.cb_daily_attendance(p_date) d
  join public.cb_employees e on e.id = d.employee_id
  -- Only an ACTIVE team routes anybody, and include_seniors only means
  -- anything on a team with a group of its own: somebody falling back to the
  -- main group is in the fifty-person room, where the junior-only rule holds.
  left join public.cb_teams t
    on t.id = e.team_id and t.is_active
   and coalesce(btrim(t.wa_group_id), '') <> ''
  where e.in_daily_report
    and (not e.is_senior
         or d.check_in_at is not null
         or d.hr_status is not null
         or coalesce(t.include_seniors, false));
$$;

-- cb_daily_attendance() is gated on cb_is_admin(), which reads the JWT email;
-- the service role has none. This is the copy the cron can read, and only it.
revoke all on function cb_daily_attendance_report(date) from public;
grant execute on function cb_daily_attendance_report(date) to service_role;

-- ── Create and edit a team from the console ────────────────────────────
-- Never a direct table write from the browser: the rules that matter live
-- here. The case-insensitive unique name (cb_teams_name_key_ci) is one of
-- them — "Backend" and "backend" both existed for a few hours on 29
-- September, one with the group and one without, which is a silent way to
-- send somebody's attendance to the wrong place.
create or replace function cb_upsert_team(
  p_id uuid default null,
  p_name text default null,
  p_wa_group_id text default null,
  p_is_active boolean default true,
  p_include_seniors boolean default false
)
returns cb_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  row cb_teams;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  if p_id is null and coalesce(btrim(p_name), '') = '' then
    raise exception 'a team needs a name';
  end if;

  if p_id is null then
    insert into cb_teams (name, wa_group_id, is_active, include_seniors)
    values (btrim(p_name), nullif(btrim(coalesce(p_wa_group_id, '')), ''),
            coalesce(p_is_active, true), coalesce(p_include_seniors, false))
    returning * into row;
  else
    update cb_teams t set
      name = coalesce(nullif(btrim(coalesce(p_name, '')), ''), t.name),
      -- null means "leave it alone"; '' means "clear it". The two are
      -- distinguished deliberately, so one toggle can be saved without the
      -- call having to restate the group — and clearing the group returns
      -- these people to the main group rather than sending nowhere.
      wa_group_id = case when p_wa_group_id is null then t.wa_group_id
                         else nullif(btrim(p_wa_group_id), '') end,
      is_active = coalesce(p_is_active, t.is_active),
      include_seniors = coalesce(p_include_seniors, t.include_seniors)
    where t.id = p_id
    returning * into row;

    if row is null then
      raise exception 'no such team';
    end if;
  end if;

  return row;
end;
$$;

grant execute on function cb_upsert_team(uuid, text, text, boolean, boolean) to authenticated;

-- ── Will this team's message actually go out? ──────────────────────────
-- The question a select on cb_teams cannot answer, and the one that matters.
-- THREE things have to be true, and each has been the missing one: the team
-- is active, it has a group, and somebody on it would be named. The Backend
-- group was created, picked and wired on 29 September and would still have
-- sent nothing, because its only member was switched out of the daily report.
create or replace function cb_team_board()
returns table (
  id uuid, name text, wa_group_id text, is_active boolean,
  include_seniors boolean, sort integer,
  members bigint, in_report bigint, seniors bigint, will_send boolean
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.name, t.wa_group_id, t.is_active, t.include_seniors, t.sort,
         count(e.id) filter (where e.is_active),
         count(e.id) filter (where e.is_active and e.in_daily_report),
         count(e.id) filter (where e.is_active and e.is_senior),
         t.is_active
           and coalesce(btrim(t.wa_group_id), '') <> ''
           and count(e.id) filter (
                 where e.is_active and e.in_daily_report
                   and (not e.is_senior or t.include_seniors)
               ) > 0
  from cb_teams t
  left join cb_employees e on e.team_id = t.id
  where cb_is_admin()
  -- INACTIVE TEAMS ARE RETURNED TOO. The console's old query filtered them
  -- out, which meant switching a team off made it vanish from the one page
  -- that could switch it back on.
  group by t.id, t.name, t.wa_group_id, t.is_active, t.include_seniors, t.sort
  order by t.sort nulls last, t.name;
$$;

grant execute on function cb_team_board() to authenticated;
