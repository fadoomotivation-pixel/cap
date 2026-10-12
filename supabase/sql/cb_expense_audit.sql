-- Petty cash: HR may edit and delete anything, and nothing is ever lost.
--
-- 12 October 2026. The founder asked for HR to be able to delete entries.
-- They already could, for spends — and the row was simply gone: no record of
-- what it was, who removed it, or when. In a cash register that is the one
-- thing that cannot be allowed, because "the entry was deleted" and "the
-- money went missing" then look identical.
--
-- So every UPDATE and DELETE on the three money tables writes the old row
-- here, with who did it. HR gets full freedom to correct; the founder gets a
-- "Changes & deleted" list that cannot be edited from the browser; and a
-- deleted row can be put back with one click.
--
-- The bill photo is no longer removed from storage on delete (see
-- ExpenseAdmin.jsx), so a restored entry comes back with its bill.

create table if not exists cb_expense_audit (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  by_email    text default (auth.jwt() ->> 'email'),
  table_name  text not null,
  action      text not null check (action in ('update', 'delete')),
  row_id      uuid not null,
  old_row     jsonb not null,
  new_row     jsonb,
  restored_at timestamptz,
  restored_by text
);
create index if not exists cb_expense_audit_at on cb_expense_audit (at desc);

alter table cb_expense_audit enable row level security;
drop policy if exists cb_expense_audit_read on cb_expense_audit;
-- Read-only for admins. There is deliberately no insert/update/delete policy:
-- only the trigger writes here, so nobody can tidy the trail from the browser.
create policy cb_expense_audit_read on cb_expense_audit for select to authenticated using (cb_is_admin());

create or replace function cb_expense_audit_t()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into cb_expense_audit (table_name, action, row_id, old_row)
    values (tg_table_name, 'delete', old.id, to_jsonb(old));
    return old;
  end if;
  -- An update that changes nothing but the timestamp is not worth a line.
  if (to_jsonb(old) - 'updated_at') is distinct from (to_jsonb(new) - 'updated_at') then
    insert into cb_expense_audit (table_name, action, row_id, old_row, new_row)
    values (tg_table_name, 'update', old.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

drop trigger if exists cb_expenses_audit on cb_expenses;
create trigger cb_expenses_audit after update or delete on cb_expenses
  for each row execute function cb_expense_audit_t();
drop trigger if exists cb_expense_topups_audit on cb_expense_topups;
create trigger cb_expense_topups_audit after update or delete on cb_expense_topups
  for each row execute function cb_expense_audit_t();
drop trigger if exists cb_cash_counts_audit on cb_cash_counts;
create trigger cb_cash_counts_audit after update or delete on cb_cash_counts
  for each row execute function cb_expense_audit_t();

-- Put a deleted row back exactly as it was (same id, same entered-by).
-- Generated columns (cb_cash_counts.variance) are left for Postgres to compute.
create or replace function cb_expense_restore(p_audit_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a    cb_expense_audit%rowtype;
  cols text;
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  select * into a from cb_expense_audit where id = p_audit_id for update;
  if not found then raise exception 'no such change'; end if;
  if a.action <> 'delete' then raise exception 'only a deleted entry can be restored'; end if;
  if a.restored_at is not null then raise exception 'already restored'; end if;
  if a.table_name not in ('cb_expenses', 'cb_expense_topups', 'cb_cash_counts') then
    raise exception 'unknown table';
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = a.table_name and is_generated = 'NEVER';

  execute format('insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1)',
                 a.table_name, cols, cols, a.table_name)
    using a.old_row;

  update cb_expense_audit set restored_at = now(), restored_by = auth.jwt() ->> 'email'
   where id = p_audit_id;
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function cb_expense_restore(bigint) to authenticated;

notify pgrst, 'reload schema';
