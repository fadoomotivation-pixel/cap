-- The pg_cron entry point for every scheduled WhatsApp message.
--
-- Applied to the live database on 23 September 2026. Kept here because the
-- bug below was invisible from the repo: this function holds a copy of the
-- kind list and nothing in the codebase showed that it existed.
--
-- WHAT WENT WRONG: the schedule was rewritten to four messages, `late` and
-- `evening` were added to the Edge Function's KINDS and to pg_cron, and not
-- to the whitelist here. Both jobs fired, raised `unknown report kind:
-- evening`, and stopped BEFORE the HTTP call — so cb_report_log gained no
-- row, the console showed nothing wrong, and the 13:00 late list and the
-- 19:02 logout record were never sent on the first evening they were due.
-- The only evidence was cron.job_run_details.
--
-- ADD A NEW KIND IN THREE PLACES OR IT DOES NOT SEND:
--   1. the whitelist below
--   2. KINDS in supabase/functions/attendance-whatsapp/index.ts
--   3. MESSAGES in src/pages/WhatsAppAdmin.jsx
create or replace function public.cb_send_attendance_report(p_kind text default 'attendance')
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_secret text;
  v_id     bigint;
begin
  -- The guard stays despite having caused the above, because the alternative
  -- is worse: the Edge Function falls back to 'attendance' for a kind it does
  -- not recognise, so a typo in a cron job would quietly publish the register
  -- at 19:02 instead of failing. A loud failure beats the wrong message to
  -- fifty people.
  --
  --   morning     10:30  group            juniors punched in so far
  --   attendance  11:30  group + founder  the register
  --   late        13:00  group            juniors who arrived after 11:30
  --   evening     19:02  group            logged out, no check-out, no punch
  --
  -- present / absent / reminder / checkout are unscheduled but stay callable
  -- by hand from /admin/whatsapp.
  if p_kind not in (
    'morning', 'attendance', 'late', 'evening',
    'present', 'absent', 'reminder', 'checkout'
  ) then
    raise exception 'unknown report kind: %', p_kind;
  end if;

  select secret into v_secret
    from public.cb_integration_secrets where name = 'report_cron';

  select net.http_post(
    url     := 'https://rqgkzamuohdvttnkluzn.supabase.co/functions/v1/attendance-whatsapp',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      -- In a header, not the body: the body of a request ends up in logs far
      -- more often than its headers do.
      'x-cron-secret', v_secret
    ),
    body    := jsonb_build_object('kind', p_kind)
  ) into v_id;

  return v_id;
end;
$function$;
