-- CLOSE THE ANONYMOUS READ ON THE ATTENDANCE REGISTER — 9 October 2026.
--
-- cb_daily_attendance() and cb_monthly_attendance() are SECURITY DEFINER and
-- guarded with
--
--     if (auth.jwt() ->> 'email') not in ('admin@…', …) then raise …
--
-- For a caller with no login the email is NULL, and `NULL not in (…)` is
-- NULL, not true — so the IF never fires. Both functions were executable by
-- `anon`, the key that ships inside the public website's JavaScript. Anybody
-- holding it could read any day's register: every employee's name, phone,
-- arrival and departure, GPS position and selfie link.
--
-- reschedule_interview_booking() carried the identical guard and is a WRITE:
-- anybody with the public key could move any candidate's interview to another
-- slot (or free the one they had). Same fix, admin only — nothing automated
-- calls it.
--
-- Found while adding the weekly off, not reported by anybody, and no evidence
-- here that it was ever used. Fixed regardless: it is the whole roster's
-- movements and every candidate's booking, and the fix is one line each.
--
-- THE LESSON: never write an admin check as `x not in (...)`. Use
-- cb_is_admin(), which cannot be NULL. A search for the old shape
-- (prosrc ~* '->>\s*''email''\)\s*not\s+in') found exactly these three.
--
-- The new guard is cb_is_admin(), which coalesces the missing email to '' and
-- so answers false rather than NULL — plus an explicit allowance for the
-- service role, because cb_daily_attendance_report() (the WhatsApp cron path,
-- service role, no email) calls cb_daily_attendance() and used to pass only
-- BECAUSE of this bug. That dependency is now stated rather than accidental.
--
-- The rewrite edits the guard in the live definition rather than restating
-- the whole function, so it cannot drift the body; it refuses to run if the
-- guard it expects is not there.

do $$
declare
  fn   text;
  def  text;
  new_def text;
  guard text;
begin
  foreach fn in array array['cb_daily_attendance', 'cb_monthly_attendance', 'reschedule_interview_booking'] loop
    guard := case when fn = 'reschedule_interview_booking'
                  then 'if not cb_is_admin() then'
                  else 'if not (cb_is_admin() or coalesce(auth.jwt() ->> ''role'', '''') = ''service_role'') then'
             end;
    select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = fn;

    if def is null then
      raise exception '% does not exist', fn;
    end if;

    new_def := regexp_replace(
      def,
      'if\s+\(auth\.jwt\(\)\s*->>\s*''email''\)\s+not\s+in\s*\([^)]*\)\s*then',
      guard
    );

    if new_def = def then
      -- Already fixed (re-run), or the body changed shape: say which.
      if position('cb_is_admin()' in def) > 0 then
        raise notice '% already uses cb_is_admin()', fn;
      else
        raise exception '% does not carry the expected guard; not touching it', fn;
      end if;
    else
      execute new_def;
    end if;
  end loop;
end;
$$;

revoke all on function cb_daily_attendance(date)   from public, anon;
revoke all on function cb_monthly_attendance(date) from public, anon;
grant execute on function cb_daily_attendance(date)   to authenticated, service_role;
grant execute on function cb_monthly_attendance(date) to authenticated, service_role;
revoke all on function reschedule_interview_booking(uuid, uuid) from public, anon;
grant execute on function reschedule_interview_booking(uuid, uuid) to authenticated;

-- cb_daily_attendance_report() has no guard of its own and is documented as
-- "service role alone" — but it was executable by anon and authenticated. The
-- guard above already blocks it (it calls cb_daily_attendance underneath);
-- this makes the documented state the real one.
revoke all on function cb_daily_attendance_report(date) from public, anon, authenticated;
grant execute on function cb_daily_attendance_report(date) to service_role;
