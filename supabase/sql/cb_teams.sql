-- Teams, so a slice of the company can have its own WhatsApp group.
--
-- The founder added a "Backend C.B" group on 29 September 2026 and asked for
-- the backend team's attendance to go there. That is NOT a second copy of the
-- register: a person belongs to ONE group, so the backend names come OUT of
-- the main junior group and go to theirs. Naming two colleagues in a
-- fifty-person group and again in their own would be the scoreboard this
-- module keeps being told not to become.
--
-- Deliberately a TABLE and not a `wa_group_backend` column on cb_hr_settings.
-- The second team costs a row rather than a migration, a deploy and three
-- edits, and HR was always going to ask for a third.
create table if not exists public.cb_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  -- Null until HR picks the group from the list on /admin/whatsapp. A JID is
  -- shown nowhere inside WhatsApp, so it must never be typed by hand - that
  -- is how a wrong id sits in settings unnoticed, and a wrong id does not
  -- fail loudly: Baileys returns a message id for an address nobody holds.
  wa_group_id text,
  sort int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cb_employees
  add column if not exists team_id uuid references public.cb_teams(id) on delete set null;

create index if not exists cb_employees_team_idx on public.cb_employees (team_id);

alter table public.cb_teams enable row level security;

drop policy if exists cb_teams_admin_all on public.cb_teams;
create policy cb_teams_admin_all on public.cb_teams
  for all using (cb_is_admin()) with check (cb_is_admin());

-- Everybody signed in may READ the team list: the roster dropdown needs the
-- names, and a team name is not sensitive. Writes stay admin-only above.
drop policy if exists cb_teams_read on public.cb_teams;
create policy cb_teams_read on public.cb_teams
  for select to authenticated using (true);

insert into public.cb_teams (name, sort)
select 'Backend', 10
where not exists (select 1 from public.cb_teams where name = 'Backend');

-- cb_daily_attendance_report() RETURNS the team rather than applying it -
-- same reasoning as is_senior. The function hands back the fact and the Edge
-- Function decides, so a per-group split needs no second query that could
-- drift out of step with this one. Only an ACTIVE team routes anybody:
-- switching a team off returns its people to the main group rather than
-- stranding their attendance in a group nobody reads any more.
--
--   ... left join public.cb_teams t on t.id = e.team_id and t.is_active
--   select d.*, e.is_senior, t.id, t.name, t.wa_group_id
--
-- cb_new_joiners() carries team_wa_group_id for the same reason: a backend
-- joiner is welcomed by backend, not announced to the whole company.

-- Case-insensitive uniqueness on the name. "Backend" and "backend" both
-- existed for a few hours on 29 September 2026, one carrying the group and one
-- empty — two teams with the same name and different groups is a silent way to
-- send somebody's attendance to the wrong place.
create unique index if not exists cb_teams_name_key_ci on public.cb_teams (lower(name));
