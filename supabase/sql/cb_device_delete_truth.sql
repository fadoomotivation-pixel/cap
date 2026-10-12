-- A removal from the machine must leave the console's list too.
--
-- 12 October 2026. Ananya removed IDs 5, 25, 33, 69 and 99 from the terminal.
-- Every delete came back Return=0 and the terminal's own full report at 11:33
-- (94 users) no longer listed any of them — the removals worked. But
-- cb_device_users is only ever UPSERTED from a USER report, never pruned, so
-- all five stayed on the console looking enrolled. ID 99 was "removed" five
-- times because the screen kept saying it was still there.
--
-- Same shape as the rename bug in cb_device_name_truth.sql: the machine did
-- the right thing and our copy did not move. Same fix: a trigger on the
-- command the device accepted.

create or replace function cb_device_delete_applied()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'delete_user'
     and new.status = 'done'
     and coalesce(new.return_code, -1) = 0
     and coalesce(new.args ->> 'pin', '') <> ''
  then
    delete from cb_device_users where device_code = new.args ->> 'pin';
  end if;
  return new;
end;
$$;

drop trigger if exists cb_device_delete_applied_t on cb_device_commands;
create trigger cb_device_delete_applied_t
after update of status on cb_device_commands
for each row execute function cb_device_delete_applied();

-- The five already removed: drop them from our copy, but only where the
-- machine accepted a delete AND its latest full report no longer had them.
delete from cb_device_users u
 where exists (select 1 from cb_device_commands c
                where c.kind = 'delete_user' and c.status = 'done'
                  and coalesce(c.return_code, -1) = 0
                  and c.args ->> 'pin' = u.device_code
                  and c.created_at > u.seen_at);
