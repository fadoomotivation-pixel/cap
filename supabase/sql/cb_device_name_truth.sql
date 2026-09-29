-- THE RENAME WORKED AND THE SCREEN SAID IT DID NOT.
--
-- On 23 September 2026 a rename went out — DATA UPDATE USERINFO PIN=95
-- Name='Shubham kad' — and the terminal answered Return=0. The console still
-- showed the old name, so it read as "the change did not stick".
--
-- It had stuck. `cb_device_users` was filled exactly once, at 08:35 that
-- morning, from the single query_users that has ever run; the rename was sent
-- at 09:30. Every row still carried that one seen_at. The page was showing a
-- snapshot from BEFORE the change and presenting it as today's truth — the
-- same shape as every other failure in this module: a thing that worked and a
-- thing that broke produced identical screens.
--
-- Two different fixes:
--   1. our own copy must move when we successfully rename, so the screen stops
--      contradicting an instruction the device accepted;
--   2. the page must say HOW OLD the snapshot is, because Return=0 means the
--      terminal accepted the command, not that anybody has seen the result.

alter table cb_device_users add column if not exists name_source text not null default 'machine';

comment on column cb_device_users.name_source is
  '''machine'' = the terminal told us, in an OPERLOG/query_users upload. ''console'' = we renamed it here and the device returned 0, but it has not re-reported since. The difference is the whole reason a rename looked like it failed.';

-- Done in a TRIGGER rather than in the essl-adms Edge Function on purpose:
-- those deploys are assembled by hand and have drifted from the repo twice.
-- Behaviour that lives in Postgres cannot be lost to a deploy.
create or replace function cb_device_rename_applied()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only a rename the device actually accepted. Return=0 is "command taken",
  -- which is the strongest thing this protocol offers.
  if new.kind = 'rename_user'
     and new.status = 'done'
     and coalesce(new.return_code, -1) = 0
     and coalesce(new.args ->> 'pin', '') <> ''
  then
    insert into cb_device_users (device_code, name, seen_at, name_source)
    values (new.args ->> 'pin', new.args ->> 'name', now(), 'console')
    on conflict (device_code) do update
      set name = excluded.name,
          seen_at = excluded.seen_at,
          name_source = 'console';

    -- Ask the machine to say it back. Our copy is a BELIEF until the terminal
    -- reports the name itself; this is what turns it into a fact, and it is
    -- also how a rename the device silently ignored would be caught. Guarded
    -- so a batch of fifteen renames queues one confirmation, not fifteen.
    if not exists (
      select 1 from cb_device_commands
      where kind = 'query_users' and status in ('pending', 'sent')
    ) then
      insert into cb_device_commands (kind, cmd, args, status)
      values ('query_users', 'DATA QUERY USERINFO', '{}'::jsonb, 'pending');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cb_device_rename_applied_t on cb_device_commands;
create trigger cb_device_rename_applied_t
after update of status on cb_device_commands
for each row execute function cb_device_rename_applied();

-- WHERE THE MACHINE AND THE ROSTER DISAGREE ABOUT A NAME.
--
-- Fifteen right now, and three are plain typos on the terminal — "Swarn" for
-- Swaran, "Krishn" for Krishan, "Sakashi" for Sakshi. Each one is a person
-- reading a register and not finding themselves. Renaming was already possible
-- one at a time; what was missing was being SHOWN that it needs doing.
create or replace function cb_device_name_mismatches()
returns table (
  device_code text,
  roster_name text,
  machine_name text,
  name_source text,
  seen_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select e.device_code, btrim(e.full_name), u.name, u.name_source, u.seen_at
  from cb_employees e
  join cb_device_users u on u.device_code = e.device_code
  where cb_is_admin()
    and e.left_on is null
    and e.is_active
    and lower(btrim(e.full_name)) is distinct from lower(btrim(coalesce(u.name, '')))
  order by nullif(regexp_replace(e.device_code, '\D', '', 'g'), '')::int;
$$;

grant execute on function cb_device_name_mismatches() to authenticated;

-- How old is what we are showing? A snapshot with no date on it is the bug.
create or replace function cb_device_users_as_of()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select max(seen_at) from cb_device_users where cb_is_admin();
$$;

grant execute on function cb_device_users_as_of() to authenticated;
