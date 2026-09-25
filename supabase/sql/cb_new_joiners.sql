-- Welcome Aboard: who has started and never been welcomed.
--
-- The founder asked on 24 September 2026 for the group to say something when
-- somebody joins. The rule for "new" lives HERE and not in the Edge Function,
-- so the 13:05 cron, a manual send from /admin/whatsapp and anything written
-- later all agree on who counts.
--
-- WHY "has at least one attendance row" IS PART OF IT: somebody added to the
-- roster who has not turned up yet is EXPECTED, not new. Welcoming them would
-- announce a colleague who is not in the building, to fifty people who would
-- then look for them.
--
-- ONCE, EVER, is cb_employees.welcomed_at. The caller stamps it only AFTER
-- the send succeeded: a failed send must not cost somebody their welcome, and
-- a retry must not send it twice.
--
-- service_role only, like cb_daily_attendance_report(). cb_is_admin() reads
-- the JWT email and the service role has none.

alter table public.cb_employees
  add column if not exists welcomed_at timestamptz;

comment on column public.cb_employees.welcomed_at is
  'When the Welcome Aboard message naming this person went out. NULL means never welcomed; set only after a successful send.';

create or replace function public.cb_new_joiners()
returns table (
  id uuid,
  full_name text,
  role_title text,
  department text,
  first_day date
)
language sql
security definer
set search_path to 'public'
as $$
  select e.id,
         e.full_name,
         e.role_title,
         e.department,
         (select min(a.work_date) from public.cb_attendance a
           where a.employee_id = e.id) as first_day
    from public.cb_employees e
   where e.is_active
     and e.welcomed_at is null
     -- Seniors are left to the founder to welcome himself. Same reasoning as
     -- every other group message: their movements are not the group's news.
     and not coalesce(e.is_senior, false)
     -- Somebody kept out of the daily report is kept out of this too.
     and coalesce(e.in_daily_report, true)
     and exists (select 1 from public.cb_attendance a where a.employee_id = e.id)
   order by 5, 2;
$$;

revoke all on function public.cb_new_joiners() from public, anon, authenticated;
grant execute on function public.cb_new_joiners() to service_role;

-- The 13:05 IST firing (07:35 UTC). Five minutes after the 13:00 register
-- update, so a joiner's first-day punch is already folded in.
--
--   select cron.schedule('cb-welcome-whatsapp', '35 7 * * *',
--     $job$ select cb_send_attendance_report('welcome'); $job$);
