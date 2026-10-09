-- WHO IS AN ADMIN IS DATA — 10 October 2026.
--
-- "Disha has left; Ananya is the new HR." That sentence was a developer job,
-- because the admin list was written out in FOURTEEN places: src/lib/admin.js,
-- cb_is_admin(), eight RLS policies (employee_kyc, interview_slots/links/
-- bookings, cb_employees, cb_attendance, cb_hr_settings, cb_scheduler_settings)
-- and four Edge Functions. The one place nobody remembered would have kept a
-- departed employee's access to every salary-adjacent record in the company.
--
-- Now there is one table, cb_admins, and everything asks cb_is_admin():
--   * every policy below,
--   * every SECURITY DEFINER RPC that already called it,
--   * the Edge Functions, through cb_is_admin_email() with the service role,
--   * the website, through rpc('cb_is_admin').
--
-- FOUND WHILE DOING IT, AND THE REASON THE COMMAND CENTER SHOWS LOGINS: of the
-- three listed admins, only disha@capitalbrix.com had ever been an account.
-- admin@ and ujjwal@ were names on a list with no login behind them, so the
-- whole company's admin access ran through the login of somebody who has left.
-- Removing her before somebody else has a working admin login would lock
-- everybody out — which is why cb_admin_remove refuses to remove the last
-- admin who can actually sign in, and refuses to remove yourself.

create table if not exists cb_admins (
  email      text primary key check (email = lower(btrim(email)) and email like '%_@_%._%'),
  note       text,
  added_by   text default (auth.jwt() ->> 'email'),
  added_at   timestamptz not null default now()
);

alter table cb_admins enable row level security;

-- Read by admins (the Command Center lists them). Writes only through the
-- functions below, which carry the lock-out guards a table write cannot.
drop policy if exists cb_admins_read on cb_admins;
create policy cb_admins_read on cb_admins for select to authenticated using (cb_is_admin());

insert into cb_admins (email, note) values
  ('admin@capitalbrix.co.in',  'seeded from the old hardcoded list'),
  ('ujjwal@capitalbrix.co.in', 'seeded from the old hardcoded list'),
  ('disha@capitalbrix.com',    'seeded from the old hardcoded list')
on conflict do nothing;

-- ── The one check ─────────────────────────────────────────────────────────
-- coalesce, so a caller with no login answers FALSE and never NULL — the
-- `email not in (…)` shape answered NULL and let the public key through.
create or replace function cb_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from cb_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- For the Edge Functions, which verify the caller's token themselves and then
-- ask with the service role.
create or replace function cb_is_admin_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from cb_admins where email = lower(btrim(coalesce(p_email, ''))));
$$;
revoke all on function cb_is_admin_email(text) from public, anon, authenticated;
grant execute on function cb_is_admin_email(text) to service_role;

-- ── The eight policies, now one rule ─────────────────────────────────────
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('employee_kyc',          'Allow admins to view all KYC',    'select'),
      ('interview_slots',       'Admin full access slots',         'all'),
      ('interview_links',       'Admin full access links',         'all'),
      ('interview_bookings',    'Admin full access bookings',      'all'),
      ('cb_employees',          'Admins manage cb_employees',      'all'),
      ('cb_attendance',         'Admins manage cb_attendance',     'all'),
      ('cb_hr_settings',        'Admins write hr settings',        'all'),
      ('cb_scheduler_settings', 'Admins write scheduler settings', 'all')
    ) as t(tbl, pol, cmd)
  loop
    execute format('drop policy if exists %I on public.%I', r.pol, r.tbl);
    if r.cmd = 'select' then
      execute format('create policy %I on public.%I for select to authenticated using (cb_is_admin())', r.pol, r.tbl);
    else
      execute format('create policy %I on public.%I for all to authenticated using (cb_is_admin()) with check (cb_is_admin())', r.pol, r.tbl);
    end if;
  end loop;
end;
$$;

-- ── Managing admins from the Command Center ──────────────────────────────
create or replace function cb_admin_list()
returns table (email text, note text, added_by text, added_at timestamptz,
               has_login boolean, last_sign_in_at timestamptz, disabled boolean,
               employee_name text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  return query
  select a.email, a.note, a.added_by, a.added_at,
         u.id is not null,
         u.last_sign_in_at,
         coalesce(u.banned_until > now(), false),
         (select btrim(e.full_name) from cb_employees e where lower(e.email) = a.email limit 1)
  from cb_admins a
  left join auth.users u on lower(u.email) = a.email
  order by a.added_at;
end;
$$;
grant execute on function cb_admin_list() to authenticated;

create or replace function cb_admin_add(p_email text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v text := lower(btrim(coalesce(p_email, '')));
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  if v !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'that is not an email address'; end if;
  if v like '%.invalid' then
    raise exception 'that is a placeholder address — set the person''s real email first, then make them an admin';
  end if;
  insert into cb_admins (email, note) values (v, nullif(btrim(p_note), ''))
  on conflict (email) do update set note = coalesce(excluded.note, cb_admins.note);
end;
$$;
grant execute on function cb_admin_add(text, text) to authenticated;

create or replace function cb_admin_remove(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v  text := lower(btrim(coalesce(p_email, '')));
  me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  if v = me then
    raise exception 'you cannot remove your own admin access — ask another admin';
  end if;
  -- Never leave the company with no admin who can actually sign in. This is
  -- the exact position on 10 October: only one listed admin had a login.
  if not exists (
    select 1 from cb_admins a join auth.users u on lower(u.email) = a.email
    where a.email <> v and coalesce(u.banned_until, now() - interval '1 second') <= now()
  ) then
    raise exception 'that would leave no admin who can sign in — give somebody else a working admin login first';
  end if;
  delete from cb_admins where email = v;
end;
$$;
grant execute on function cb_admin_remove(text) to authenticated;

-- ── Login status for the directory ───────────────────────────────────────
-- "Has this person ever logged in" was invisible, so a login created and never
-- handed over looked exactly like one in daily use.
create or replace function cb_employee_logins()
returns table (employee_id uuid, user_id uuid, login_email text,
               last_sign_in_at timestamptz, disabled boolean, is_admin boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not cb_is_admin() then raise exception 'not authorised'; end if;
  return query
  select e.id, u.id, u.email::text, u.last_sign_in_at,
         coalesce(u.banned_until > now(), false),
         exists (select 1 from cb_admins a where a.email = lower(coalesce(u.email, e.email)))
  from cb_employees e
  left join auth.users u on u.id = e.user_id
     or (e.user_id is null and lower(u.email) = lower(e.email));
end;
$$;
grant execute on function cb_employee_logins() to authenticated;

-- ── A photo HR can set, for people with no KYC ───────────────────────────
-- The directory's photo came only from employee_kyc, so 19 people with KYC
-- pending had no photo slot at all. An HR-set photo wins over the KYC one.
alter table cb_employees add column if not exists photo_url text;

notify pgrst, 'reload schema';
