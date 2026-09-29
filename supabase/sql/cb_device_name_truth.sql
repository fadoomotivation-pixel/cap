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

-- ── THE ROSTER AND THE TERMINAL NOW TALK BOTH WAYS ─────────────────────
--
-- Until now it was one direction and a manual one: somebody had to NOTICE a
-- name was wrong, open /admin/machine and rename it. Nobody notices, which is
-- how fifteen names drifted apart.
--
--   roster name changes  --> DATA UPDATE USERINFO  --> terminal
--   terminal replies 0   --> our copy moves, marked 'console'
--                        --> one query_users queued
--   terminal reports     --> our copy becomes 'machine' = confirmed
--
-- The loop closes on its own, and every step is recorded in
-- cb_device_commands, so a rename that quietly did nothing is visible rather
-- than assumed to have worked.
create or replace function cb_employee_name_to_device()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(btrim(coalesce(new.full_name, '')), '');
  v_machine text;
  v_pending bigint;
begin
  -- Only somebody who CURRENTLY holds a code. A leaver's code may already
  -- belong to the next person, and renaming it would put the wrong name on
  -- their enrolment.
  if new.device_code is null or v_name is null
     or new.left_on is not null or not new.is_active then
    return new;
  end if;

  select u.name into v_machine from cb_device_users u
   where u.device_code = new.device_code;
  if lower(btrim(coalesce(v_machine, ''))) = lower(v_name) then
    return new;
  end if;

  -- ONE INSTRUCTION PER PERSON, AND THE LAST EDIT WINS.
  --
  -- Two quick corrections to a spelling must not queue two renames - the
  -- second would be reported as a failure of the first. But SKIPPING the
  -- second is worse: the machine would end up with the EARLIER name, which is
  -- the opposite of what was just typed. So a rename still waiting to go out
  -- is rewritten in place. Only while it is `pending`: once it is `sent` the
  -- terminal already has it, and editing the row would misreport what was
  -- actually asked for.
  select id into v_pending from cb_device_commands
   where kind = 'rename_user' and status = 'pending'
     and args ->> 'pin' = new.device_code
   order by created_at desc limit 1;

  if v_pending is not null then
    update cb_device_commands
       set cmd = format('DATA UPDATE USERINFO PIN=%s%sName=%s', new.device_code, chr(9), v_name),
           args = jsonb_build_object('pin', new.device_code, 'name', v_name),
           created_at = now()
     where id = v_pending;
    return new;
  end if;

  if exists (
    select 1 from cb_device_commands
     where kind = 'rename_user' and status = 'sent'
       and args ->> 'pin' = new.device_code
       and args ->> 'name' = v_name
  ) then
    return new;
  end if;

  -- Built here, exactly as cb_queue_device_command builds it. The whitelist
  -- principle holds: no layer accepts a command string, and this trigger can
  -- express nothing but a rename.
  insert into cb_device_commands (kind, cmd, args, created_by)
  values (
    'rename_user',
    format('DATA UPDATE USERINFO PIN=%s%sName=%s', new.device_code, chr(9), v_name),
    jsonb_build_object('pin', new.device_code, 'name', v_name),
    coalesce(auth.jwt() ->> 'email', 'roster sync')
  );

  return new;
end;
$$;

drop trigger if exists cb_employee_name_to_device_t on cb_employees;
create trigger cb_employee_name_to_device_t
after insert or update of full_name, device_code, is_active, left_on on cb_employees
for each row execute function cb_employee_name_to_device();

-- ── THE SNAPSHOT MUST NEVER GO STALE AGAIN ─────────────────────────────
--
-- cb_device_users was read from the terminal exactly ONCE, on 23 September,
-- and nothing re-read it for a week. That single fact is the whole of the
-- "the rename went back to the old name" report. A refresh nobody has to
-- remember is the only fix that holds.
--
-- pg_cron: cb-device-users-refresh, '0 4 * * *' = 09:30 IST.
create or replace function cb_refresh_device_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Never stack. If yesterday's question is still unanswered the terminal is
  -- not talking to us, and a queue of identical requests hides that rather
  -- than fixing it. cb_device_users_as_of() surfaces the unanswered one, so
  -- this guard is not itself silent.
  if exists (
    select 1 from cb_device_commands
    where kind = 'query_users' and status in ('pending', 'sent')
  ) then
    return;
  end if;

  insert into cb_device_commands (kind, cmd, args, status, created_by)
  values ('query_users', 'DATA QUERY USERINFO', '{}'::jsonb, 'pending', 'daily refresh');
end;
$$;

-- How old our copy is, AND whether the question we asked is still unanswered.
drop function if exists cb_device_users_as_of();

create function cb_device_users_as_of()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'as_of', (select max(seen_at) from cb_device_users),
    'rows', (select count(*) from cb_device_users),
    'awaiting_since', (
      select min(created_at) from cb_device_commands
      where kind = 'query_users' and status in ('pending', 'sent')
    ),
    -- Renames we have sent that the terminal has not reported back. Beliefs,
    -- not facts, and the page says so.
    'unconfirmed_names', (
      select count(*) from cb_device_users where name_source = 'console'
    )
  )
  where cb_is_admin();
$$;

grant execute on function cb_device_users_as_of() to authenticated;
