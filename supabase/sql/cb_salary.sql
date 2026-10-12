-- Salary and advances — the money the company owes each person, and what
-- it has already handed over early.
--
-- 12 October 2026. The founder asked for a salary console, and specifically
-- for a record of every advance he gives somebody, with the date. An advance
-- given in cash and remembered by one person is exactly the kind of number
-- that turns into an argument on salary day — "I already took ₹5,000 in
-- August" against "no you did not" — with nothing to settle it.
--
-- Three tables, all admin-only:
--   cb_salary_rates     monthly salary per person, with the date it starts
--                       (a raise is a new row, never an edit — so last
--                       month's pay can always be recomputed at last month's
--                       rate)
--   cb_salary_advances  money given before salary day: who, when, how much,
--                       who gave it, and how much to recover each month
--   cb_salary_payments  what was actually paid for a month, including how
--                       much of the advance was recovered from it
--
-- Every edit and delete on all three goes through the same audit trigger as
-- petty cash (cb_expense_audit), so a changed amount is never silent and a
-- deleted advance can be restored.
--
-- Attendance feeds in through cb_monthly_matrix: absent days are shown as a
-- SUGGESTED deduction, never applied by themselves — the person paying
-- decides, because a day the machine missed is not a day somebody skipped.

create table if not exists cb_salary_rates (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references cb_employees(id) on delete cascade,
  monthly_amount numeric(12,2) not null check (monthly_amount >= 0),
  effective_from date not null,
  note           text,
  created_by     text default (auth.jwt() ->> 'email'),
  created_at     timestamptz not null default now(),
  unique (employee_id, effective_from)
);

create table if not exists cb_salary_advances (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references cb_employees(id) on delete cascade,
  given_on          date not null,
  amount            numeric(12,2) not null check (amount > 0),
  mode              text not null default 'cash' check (mode in ('cash','upi','bank')),
  given_by          text not null default 'Founder',
  recover_per_month numeric(12,2) check (recover_per_month is null or recover_per_month > 0),
  note              text,
  created_by        text default (auth.jwt() ->> 'email'),
  created_at        timestamptz not null default now()
);
create index if not exists cb_salary_advances_emp on cb_salary_advances (employee_id, given_on);

create table if not exists cb_salary_payments (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references cb_employees(id) on delete cascade,
  month             date not null check (month = date_trunc('month', month)::date),
  gross             numeric(12,2) not null default 0,
  deduction         numeric(12,2) not null default 0,
  bonus             numeric(12,2) not null default 0,
  advance_recovered numeric(12,2) not null default 0 check (advance_recovered >= 0),
  net_paid          numeric(12,2) not null default 0,
  paid_on           date,
  mode              text check (mode is null or mode in ('cash','upi','bank')),
  note              text,
  created_by        text default (auth.jwt() ->> 'email'),
  created_at        timestamptz not null default now(),
  unique (employee_id, month)
);

alter table cb_salary_rates    enable row level security;
alter table cb_salary_advances enable row level security;
alter table cb_salary_payments enable row level security;

drop policy if exists cb_salary_rates_admin on cb_salary_rates;
create policy cb_salary_rates_admin on cb_salary_rates for all to authenticated using (cb_is_admin()) with check (cb_is_admin());
drop policy if exists cb_salary_advances_admin on cb_salary_advances;
create policy cb_salary_advances_admin on cb_salary_advances for all to authenticated using (cb_is_admin()) with check (cb_is_admin());
drop policy if exists cb_salary_payments_admin on cb_salary_payments;
create policy cb_salary_payments_admin on cb_salary_payments for all to authenticated using (cb_is_admin()) with check (cb_is_admin());

drop trigger if exists cb_salary_rates_audit on cb_salary_rates;
create trigger cb_salary_rates_audit after update or delete on cb_salary_rates for each row execute function cb_expense_audit_t();
drop trigger if exists cb_salary_advances_audit on cb_salary_advances;
create trigger cb_salary_advances_audit after update or delete on cb_salary_advances for each row execute function cb_expense_audit_t();
drop trigger if exists cb_salary_payments_audit on cb_salary_payments;
create trigger cb_salary_payments_audit after update or delete on cb_salary_payments for each row execute function cb_expense_audit_t();

-- Restore now covers the salary tables too.
create or replace function cb_expense_restore(p_audit_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a cb_expense_audit%rowtype; cols text;
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  select * into a from cb_expense_audit where id = p_audit_id for update;
  if not found then raise exception 'no such change'; end if;
  if a.action <> 'delete' then raise exception 'only a deleted entry can be restored'; end if;
  if a.restored_at is not null then raise exception 'already restored'; end if;
  if a.table_name not in ('cb_expenses','cb_expense_topups','cb_cash_counts',
                          'cb_salary_rates','cb_salary_advances','cb_salary_payments') then
    raise exception 'unknown table';
  end if;
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = a.table_name and is_generated = 'NEVER';
  execute format('insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1)', a.table_name, cols, cols, a.table_name) using a.old_row;
  update cb_expense_audit set restored_at = now(), restored_by = auth.jwt() ->> 'email' where id = p_audit_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- One row per person for a month: rate, attendance, advances outstanding,
-- a suggestion, and what was actually paid. Everything the payroll screen,
-- its CSV and its WhatsApp summary show comes from here.
create or replace function cb_payroll_month(p_month date)
returns table (
  employee_id uuid, full_name text, device_code text, team_name text, left_on date,
  monthly_salary numeric, days_in_month int,
  present_days int, absent_days int, leave_days int,
  advance_given_total numeric, advance_recovered_total numeric, advance_balance numeric,
  advances_this_month numeric,
  suggested_deduction numeric, suggested_recovery numeric, suggested_net numeric,
  paid_id uuid, paid_gross numeric, paid_deduction numeric, paid_bonus numeric,
  paid_recovered numeric, paid_net numeric, paid_on date, paid_mode text, paid_note text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from date := date_trunc('month', p_month)::date;
  v_to   date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  v_days int  := extract(day from (date_trunc('month', p_month) + interval '1 month - 1 day'))::int;
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;

  return query
  with m as (
    select x.employee_id,
           count(*) filter (where x.state in ('on-time','late'))::int as present,
           count(*) filter (where x.state = 'absent')::int as absent,
           count(*) filter (where x.state in ('leave','half-day'))::int as lv
      from cb_monthly_matrix(to_char(v_from, 'YYYY-MM')) x
     group by x.employee_id
  ),
  people as (
    select e.* from cb_employees e
     where (e.left_on is null and coalesce(e.is_active, true))
        or (e.left_on is not null and e.left_on >= v_from)
        or exists (select 1 from cb_salary_payments p where p.employee_id = e.id and p.month = v_from)
        or exists (select 1 from cb_salary_advances a where a.employee_id = e.id
                     and a.given_on <= v_to)
  ),
  base as (
    select p.id as eid, btrim(p.full_name) as fname, p.device_code as dcode, t.name as tname, p.left_on as lon,
      (select r.monthly_amount from cb_salary_rates r
        where r.employee_id = p.id and r.effective_from <= v_to
        order by r.effective_from desc limit 1) as rate,
      coalesce(m.present, 0) as present, coalesce(m.absent, 0) as absent, coalesce(m.lv, 0) as lv,
      (select coalesce(sum(a.amount), 0) from cb_salary_advances a
        where a.employee_id = p.id and a.given_on <= v_to) as adv_given,
      (select coalesce(sum(a.amount), 0) from cb_salary_advances a
        where a.employee_id = p.id and a.given_on between v_from and v_to) as adv_month,
      -- recovered BEFORE this month, so this month's suggestion is not
      -- shrunk by its own payment once that has been saved
      (select coalesce(sum(s2.advance_recovered), 0) from cb_salary_payments s2
        where s2.employee_id = p.id and s2.month < v_from) as rec_before,
      (select coalesce(max(a.recover_per_month), 0) from cb_salary_advances a
        where a.employee_id = p.id and a.given_on <= v_to) as per_month,
      s.id as pid, s.gross as pgross, s.deduction as pded, s.bonus as pbonus,
      s.advance_recovered as prec, s.net_paid as pnet, s.paid_on as pon, s.mode as pmode, s.note as pnote
    from people p
    left join cb_teams t on t.id = p.team_id
    left join m on m.employee_id = p.id
    left join cb_salary_payments s on s.employee_id = p.id and s.month = v_from
  ),
  calc as (
    select b.*,
      round(coalesce(b.rate, 0) / v_days * b.absent, 0) as sug_ded,
      least(greatest(b.adv_given - b.rec_before, 0),
            case when b.per_month > 0 then b.per_month
                 else greatest(b.adv_given - b.rec_before, 0) end) as sug_rec
    from base b
  )
  select c.eid, c.fname, c.dcode, c.tname, c.lon,
         c.rate, v_days, c.present, c.absent, c.lv,
         c.adv_given,
         c.rec_before + coalesce(c.prec, 0),
         c.adv_given - c.rec_before - coalesce(c.prec, 0),
         c.adv_month,
         c.sug_ded, c.sug_rec,
         greatest(coalesce(c.rate, 0) - c.sug_ded - c.sug_rec, 0),
         c.pid, c.pgross, c.pded, c.pbonus, c.prec, c.pnet, c.pon, c.pmode, c.pnote
    from calc c
   order by c.fname;
end;
$$;
grant execute on function cb_payroll_month(date) to authenticated;

notify pgrst, 'reload schema';
