-- Naming a machine code that nobody on the roster owns.
--
-- Every code the eSSL terminal reports is stored in cb_device_punches whether
-- or not anybody knows whose it is. The fold resolves a person through
-- cb_employees.device_code, so an unowned code's attendance is recorded and
-- attached to nobody: it can appear on no register, no CSV and no message,
-- and nothing on the console said so. These two functions are the answer —
-- one shows what is punching with no name behind it, the other gives it one.
--
-- Surfaced on /admin/attendance -> Monthly Report -> "Choose names", because
-- that is the screen where "who should be on this report" is the question
-- actually being asked.

-- ── What is punching with nobody behind it ─────────────────────────────
-- `note` and `suggested_name` come from cb_ignored_device_codes, which is
-- where somebody has already written down what a code is believed to be
-- ("Abhishek - pantry staff"). Offering that as a starting point is the
-- difference between a list of bare numbers and a list you can act on.
create or replace function cb_unmapped_device_codes(p_since date default null)
returns table (
  device_code text,
  punches bigint,
  days bigint,
  first_seen date,
  last_seen date,
  note text,
  suggested_name text
)
language sql
security definer
set search_path = public
as $$
  select p.device_code,
         count(*)::bigint,
         count(distinct (p.punch_at at time zone 'Asia/Kolkata')::date)::bigint,
         min((p.punch_at at time zone 'Asia/Kolkata')::date),
         max((p.punch_at at time zone 'Asia/Kolkata')::date),
         i.note,
         -- "Abhishek - pantry staff" -> "Abhishek". The note is a sentence
         -- about the code, not a name, so only the part before the first dash
         -- is offered and HR can type over it. The em-dash is normalised
         -- first: these notes were typed by hand and carry both.
         nullif(btrim(split_part(regexp_replace(coalesce(i.note, ''), '—', '-', 'g'), '-', 1)), '')
  from cb_device_punches p
  left join cb_ignored_device_codes i on i.device_code = p.device_code
  where cb_is_admin()
    and (p_since is null or p.punch_at >= p_since)
    and not exists (
      select 1 from cb_employees e where e.device_code = p.device_code
    )
  group by p.device_code, i.note
  order by count(*) desc;
$$;

grant execute on function cb_unmapped_device_codes(date) to authenticated;

-- ── Give the code a name ───────────────────────────────────────────────
create or replace function cb_adopt_device_code(
  p_code text,
  p_name text,
  p_senior boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  fold jsonb;
begin
  -- SECURITY DEFINER runs as the owner, so the caller must be re-checked here.
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'a name is required';
  end if;

  -- Two people on one code silently merge into one attendance record, and the
  -- only evidence is a history nobody can explain. A partial unique index on
  -- cb_employees.device_code makes this true at the database as well.
  if exists (select 1 from cb_employees e where e.device_code = p_code) then
    raise exception 'code % already belongs to somebody on the roster', p_code;
  end if;

  -- in_daily_report = false is the safety. Adopting a code must never quietly
  -- start naming somebody in a message fifty colleagues read; HR switches that
  -- on separately, from the Employees tab.
  --
  -- cb_employees.email is NOT NULL and is how a login is matched. These people
  -- have no login, so the address is deliberately unusable and obviously not
  -- real to anybody reading it — the same shape the event console uses for a
  -- seat taken by phone.
  insert into cb_employees (full_name, email, is_active, in_daily_report, is_senior)
  values (btrim(p_name),
          'machine-' || p_code || '@capitalbrix.invalid',
          true, false, coalesce(p_senior, false))
  returning id into new_id;

  -- cb_set_device_code validates the code AND re-folds from its first punch.
  -- Without the fold the new name shows a blank month, because the punches are
  -- already stored and merely unattributed — which reads as somebody who never
  -- comes in, the exact opposite of the truth.
  select cb_set_device_code(new_id, p_code) into fold;

  -- It is no longer unknown, so the bridge's "unknown device codes" warning
  -- must stop naming it. A warning that is always there is one nobody reads.
  delete from cb_ignored_device_codes where device_code = p_code;

  return jsonb_build_object('employee_id', new_id, 'code', p_code, 'fold', fold);
end;
$$;

grant execute on function cb_adopt_device_code(text, text, boolean) to authenticated;
