import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * "Is the attendance machinery working right now?"
 *
 * WHY THIS EXISTS. Every failure this module has had was invisible from every
 * screen in the office, and each was found by somebody typing SQL after the
 * damage was done:
 *
 *   · five days with no downloads (19–23 Sep) — the scheduled task's exit
 *     code was 0x0 and every automated check was green
 *   · the terminal's clock half an hour slow (23 Sep) — found only by
 *     measuring the gap between a punch's own time and its arrival
 *   · two cron jobs dying in a SQL whitelist (23 Sep) — they failed BEFORE
 *     the HTTP call, so cb_report_log gained no row at all and the WhatsApp
 *     console looked perfectly clean
 *
 * The common shape is not that the checks were wrong. It is that a thing
 * going wrong and a thing being fine produced the same screen. So this panel
 * is written to be QUIET WHEN HEALTHY — one green line, collapsed — and to
 * open itself and name the problem when it is not. A status panel that
 * always shows detail is one people stop reading, which is the failure it is
 * meant to prevent.
 *
 * It reads cb_attendance_health(), a single admin-gated RPC, so this card,
 * the register and anything written later cannot disagree about whether the
 * machine is alive.
 */
export default function AttendanceHealth({ className = '' }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const { data: d, error } = await supabase.rpc('cb_attendance_health');
    if (error) setErr(error.message); else { setErr(''); setData(d); }
    setBusy(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (err) {
    return (
      <div className={`border border-red-200 bg-red-50 text-red-700 rounded-xl p-3 text-sm ${className}`}>
        Health check failed: {err}
      </div>
    );
  }
  if (!data) return null;

  const mins = data.machine?.minutes_ago;
  const drift = data.clock_drift_minutes;
  const unmapped = data.unmapped_codes_today ?? [];
  const noCode = (data.active_without_code ?? []).filter((p) => p.in_report);
  const msgs = data.messages ?? [];
  const failedMsgs = msgs.filter((m) => m.ok === false);
  const ourCron = data.cron_failures_24h?.ours ?? 0;
  const otherCron = data.cron_failures_24h?.other_apps ?? 0;

  // Only what somebody has to DO something about. Each line names the fact
  // and the consequence, because "unmapped code" on its own is not a sentence
  // anybody can act on.
  const problems = [];
  if (mins == null) {
    problems.push(['red', 'The machine has never contacted us.',
      'A command queued for it will never run. Check Menu → Comm. → Cloud Server: address https://www.capitalbrix.co.in, Enable Domain Name ON, Enable Proxy OFF.']);
  } else if (mins > 120) {
    problems.push(['red', `The machine last contacted us ${Math.round(mins / 60)} hours ago.`,
      'Punches are sitting in its memory, and eSSL terminals overwrite the oldest once that fills.']);
  }
  if (data.punches_today === 0) {
    problems.push(['red', 'No punches have arrived today.',
      'If this is a working day the feed is broken, not the office empty — the register would call everybody absent.']);
  }
  // A clock error is a CONSTANT offset; batched delivery from the PC bridge
  // is a varying one, which is why the RPC returns the median rather than
  // the average. Half an hour here is precisely what TimeZone=5.5 did.
  if (drift != null && Math.abs(drift) >= 10) {
    problems.push(['red', `The machine's clock looks ${Math.abs(Math.round(drift))} minutes out.`,
      'Every arrival is being filed at the wrong time. Send a sync_time from /admin/machine, then re-check here.']);
  }
  if (ourCron > 0) {
    problems.push(['red', `${ourCron} scheduled attendance job${ourCron > 1 ? 's' : ''} failed in the last 24 hours.`,
      'A job that fails before its send leaves NO row in the message log — this is the only place it shows.']);
  }
  failedMsgs.forEach((m) => {
    problems.push(['red', `The ${m.kind} message did not go out.`, m.detail || 'No detail recorded.']);
  });
  if (unmapped.length) {
    problems.push(['amber',
      `${unmapped.length} machine code${unmapped.length > 1 ? 's' : ''} punching today belong${unmapped.length > 1 ? '' : 's'} to nobody on the roster (${unmapped.map((u) => `#${u.code}`).join(', ')}).`,
      'Their attendance is being stored and attached to no one. Map the code on the Employees tab.']);
  }
  noCode.forEach((p) => {
    problems.push(['amber', `${p.name.trim()} is in the daily report but not enrolled on the machine.`,
      'They can never produce a punch, so the register will list them Absent every day. Enrol them, or switch "In report" off.']);
  });

  const worst = problems.some((p) => p[0] === 'red') ? 'red' : problems.length ? 'amber' : 'ok';
  const tone = {
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    ok: 'border-green-200 bg-green-50 text-green-800',
  }[worst];

  const summary = worst === 'ok'
    ? `Everything is running — machine seen ${mins} min ago · ${data.punches_today} punches · clock in step · ${msgs.filter((m) => m.ok).length} of 5 messages sent`
    : `${problems.length} thing${problems.length > 1 ? 's' : ''} need${problems.length > 1 ? '' : 's'} attention`;

  // A problem opens the panel by itself. Healthy stays shut.
  const expanded = open || worst !== 'ok';

  return (
    <div className={`border rounded-xl ${tone} ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold"
      >
        {worst === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        <span className="flex-1">{summary}</span>
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); load(); }}
          className="opacity-60 hover:opacity-100"
          title="Re-check"
        >
          <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-black/5 pt-3">
          {problems.map(([lvl, what, why], i) => (
            <div key={i} className="text-sm">
              <p className="font-semibold flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${lvl === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
                {what}
              </p>
              <p className="opacity-75 ml-3.5 mt-0.5">{why}</p>
            </div>
          ))}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <Fact label="Machine last seen" value={mins == null ? 'never' : `${mins} min ago`} />
            <Fact label="Punches today" value={String(data.punches_today ?? 0)} />
            <Fact label="Clock offset" value={drift == null ? '—' : `${drift} min`} />
            <Fact label="Messages sent" value={`${msgs.filter((m) => m.ok).length} of 5`} />
          </div>

          {msgs.length > 0 && (
            <div className="text-xs opacity-75">
              {msgs.map((m) => (
                <span key={m.kind} className="inline-block mr-3">
                  {m.ok ? '✓' : '✗'} {m.kind} {m.sent_at ? format(new Date(m.sent_at), 'HH:mm') : ''}
                </span>
              ))}
            </div>
          )}

          {/* Named, never counted into our own total. The SalesAutoCall app
              runs its own jobs in this database and its failures are real —
              but they are not attendance, and a number that mixes them is one
              nobody can act on. */}
          {otherCron > 0 && (
            <p className="text-xs opacity-60">
              {otherCron} failed scheduled job{otherCron > 1 ? 's' : ''} in the last 24 hours belong to another
              application in this database, not to attendance.
            </p>
          )}

          <p className="text-[11px] opacity-50 flex items-center gap-1">
            <Activity size={11} /> Checked {format(new Date(data.as_of), 'HH:mm')}
          </p>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="bg-white/60 rounded-lg px-3 py-2">
      <p className="opacity-60">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}
