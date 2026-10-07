-- A NEW ENROLMENT SHOWS ITS NAME WITHIN A MINUTE, NOT TOMORROW MORNING.
--
-- On 7 October 2026 three people were enrolled at the terminal with their
-- names typed in (codes 103, 105, 106). They punched at 12:37-12:40 and the
-- console showed "Code 103" and "Nobody - their attendance is stored and
-- attached to no one" for all three.
--
-- The machine had told us something changed: it sent OPERLOG uploads at
-- 12:40-12:47, exactly while they were being enrolled. But those uploads
-- carried no USER lines (this firmware reports an enrolment as an operation,
-- not as the user record), so essl-adms logged "accepted, not attendance" and
-- the only thing that ever re-reads the names was the 09:30 daily refresh.
-- Every name typed at the keypad after 09:30 was invisible until the next day.
--
-- So two signals now ask the terminal for its user list, each the moment it
-- happens:
--   1. an OPERLOG with no USER lines - something was changed on the terminal;
--   2. a punch from a code we have no name for - somebody new is standing at it.
--
-- One guard, shared: never a second request while one is outstanding, and not
-- more than one every five minutes. A query_users upload is a full user list,
-- and an enrolment session produces a burst of OPERLOGs - eight in seven
-- minutes on the day this was written. Without the cooldown each one would
-- queue its own.
--
-- Done in Postgres, not in essl-adms, for the reason cb_device_name_truth.sql
-- gives: those deploys are assembled by hand and have drifted from the repo.

create or replace function cb_request_device_users_refresh()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from cb_device_commands
    where kind = 'query_users'
      and (status in ('pending', 'sent') or created_at > now() - interval '5 minutes')
  ) then
    return false;
  end if;
  insert into cb_device_commands (kind, cmd, args, status)
  values ('query_users', 'DATA QUERY USERINFO', '{}'::jsonb, 'pending');
  return true;
end;
$$;

revoke all on function cb_request_device_users_refresh() from public, anon, authenticated;

-- 1. The terminal reported a change that was not a user record.
create or replace function cb_operlog_triggers_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.table_name = 'OPERLOG' and coalesce(new.rows_in, 0) = 0 then
    perform cb_request_device_users_refresh();
  end if;
  return new;
exception when others then
  -- A refresh is a nicety; the log row is the heartbeat. Never lose one to
  -- the other.
  return new;
end;
$$;

drop trigger if exists cb_operlog_triggers_refresh_t on cb_adms_log;
create trigger cb_operlog_triggers_refresh_t
after insert on cb_adms_log
for each row execute function cb_operlog_triggers_refresh();

-- 2. A punch from a code the terminal has never named to us. Statement-level,
-- because the PC bridge re-sends a 36-hour window in one insert and a row
-- trigger would test the same handful of codes hundreds of times.
create or replace function cb_unknown_code_triggers_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from new_punches n
    where not exists (select 1 from cb_device_users u where u.device_code = n.device_code)
      and n.punch_at > now() - interval '1 day'
  ) then
    perform cb_request_device_users_refresh();
  end if;
  return null;
exception when others then
  -- This runs inside the punch insert. A failure here must never cost a
  -- punch: essl-adms would answer 500 and the terminal would retry forever.
  return null;
end;
$$;

drop trigger if exists cb_unknown_code_triggers_refresh_t on cb_device_punches;
create trigger cb_unknown_code_triggers_refresh_t
after insert on cb_device_punches
referencing new table as new_punches
for each statement execute function cb_unknown_code_triggers_refresh();
