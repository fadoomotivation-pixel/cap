-- Is the attendance machinery actually working right now?
--
-- Every failure this module has had was INVISIBLE from every screen in the
-- office, and each one was found by somebody typing SQL after the damage:
--
--   * five days with no downloads (19-23 Sep) - the scheduled task's exit
--     code was 0x0 and every automated check was green
--   * the terminal's clock half an hour slow for a day (23 Sep) - found only
--     by measuring the gap between a punch's own time and its arrival
--   * two cron jobs dying in a SQL whitelist (23 Sep) - they failed BEFORE
--     the HTTP call, so cb_report_log gained no row and the WhatsApp console
--     looked perfectly clean
--
-- One query, one card, all of it. The point is not that any single number
-- here is clever; it is that "is anything wrong?" stops being a question
-- only a developer can answer. Rendered by src/components/AttendanceHealth.jsx
-- on /admin/attendance and /admin/whatsapp.
create or replace function public.cb_attendance_health()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'cron'
as $$
declare
  d date := (now() at time zone 'Asia/Kolkata')::date;
  day_start timestamptz := (d::text || ' 00:00:00+05:30')::timestamptz;
  out jsonb;
begin
  if not cb_is_admin() then
    raise exception 'not authorised';
  end if;

  select jsonb_build_object(
    'as_of', now(),
    'date', d,

    -- The terminal's heartbeat. With the office PC out of the loop there is
    -- no other screen that shows whether the machine is talking to anybody.
    'machine', (
      select jsonb_build_object(
        'last_seen_at', max(at),
        'minutes_ago', case when max(at) is null then null
                       else round(extract(epoch from (now() - max(at))) / 60) end)
      from cb_adms_log
    ),

    'punches_today', (
      select count(*) from cb_device_punches where punch_at >= day_start
    ),
    'last_punch_at', (
      select max(punch_at) from cb_device_punches where punch_at >= day_start
    ),

    -- CLOCK DRIFT, the measurement that named the timezone bug in one line.
    -- ADMS is Realtime=1, so a punch reaches us a second or two after it
    -- happens. A median gap of half an hour means the terminal's clock is
    -- half an hour out - which is exactly what "TimeZone=5.5" did on 23
    -- September, silently, to every arrival for a day.
    --
    -- The MEDIAN and not the average, because the PC bridge re-sends a
    -- 36-hour window in batches and a batched punch can legitimately arrive
    -- long after its own timestamp. A batch skews an average; it cannot move
    -- the middle of a normal day's punches.
    'clock_drift_minutes', (
      select round(percentile_cont(0.5) within group (
               order by extract(epoch from (created_at - punch_at)) / 60
             )::numeric, 1)
      from cb_device_punches where punch_at >= day_start
    ),

    -- Today's five messages: what actually went out, from the log the
    -- function itself writes.
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind', kind, 'ok', ok, 'sent_at', sent_at, 'detail', detail)
               order by sent_at)
      from cb_report_log where report_date = d
    ), '[]'::jsonb),

    -- A MESSAGE THAT NEVER LEFT LEAVES NO ROW ABOVE. When a scheduled job
    -- fails before its HTTP call - a bad kind, a renamed function - there is
    -- nothing in cb_report_log at all, and "no row" reads exactly like "not
    -- due yet". cron.job_run_details is the only place it shows.
    --
    -- Split ours from everything else on purpose. The SalesAutoCall app runs
    -- its own jobs in this database; its failures are real but they are not
    -- attendance, and a count that mixes them is one nobody can act on.
    'cron_failures_24h', (
      select jsonb_build_object(
        'ours', coalesce(sum(case when j.jobname like 'cb-%' then 1 else 0 end), 0),
        'other_apps', coalesce(sum(case when j.jobname like 'cb-%' then 0 else 1 end), 0),
        'jobs', coalesce(jsonb_agg(distinct jsonb_build_object(
                  'job', j.jobname, 'ours', j.jobname like 'cb-%')), '[]'::jsonb))
      from cron.job_run_details r join cron.job j on j.jobid = r.jobid
      where r.start_time > now() - interval '24 hours' and r.status <> 'succeeded'
    ),

    -- Somebody punching under a code the roster does not know. Their
    -- attendance is stored and attached to nobody, which is invisible until
    -- somebody asks why a person is absent every day.
    'unmapped_codes_today', coalesce((
      select jsonb_agg(jsonb_build_object('code', device_code, 'punches', n)
                       order by n desc)
      from (
        select p.device_code, count(*) as n
        from cb_device_punches p
        where p.punch_at >= day_start
          and not exists (select 1 from cb_employees e
                           where e.device_code = p.device_code)
          and not exists (select 1 from cb_ignored_device_codes i
                           where i.device_code = p.device_code)
        group by 1
      ) t
    ), '[]'::jsonb),

    -- The mirror image: on the roster, never enrolled on the machine. They
    -- can never produce a punch, so the register can only ever call them
    -- Absent.
    'active_without_code', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', id, 'name', full_name, 'in_report', coalesce(in_daily_report, true))
               order by full_name)
      from cb_employees
      where is_active and coalesce(device_code, '') = ''
    ), '[]'::jsonb)
  ) into out;

  return out;
end;
$$;

revoke all on function public.cb_attendance_health() from public, anon;
grant execute on function public.cb_attendance_health() to authenticated;
