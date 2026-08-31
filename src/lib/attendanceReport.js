import { format, parseISO } from 'date-fns';

const fmtTime = (ts) => (ts ? format(new Date(ts), 'hh:mm a') : '—');

/**
 * Build the daily WhatsApp summary the founder actually reads on a phone.
 * Kept plain-text and short: headline numbers first, then only the rows that
 * need a decision (absent, late, site visits) — not a dump of everyone.
 */
export function buildDailyWhatsAppSummary(rows, dateStr) {
  const date = format(parseISO(dateStr), 'EEE, d MMM yyyy');

  const present = rows.filter((r) => r.check_in_at);
  const onLeave = rows.filter((r) => !r.check_in_at && r.hr_status);
  const absent = rows.filter((r) => !r.check_in_at && !r.hr_status);
  const late = present.filter((r) => r.is_late);
  const siteVisits = present.filter((r) => r.work_mode === 'site-visit');
  const wfh = present.filter((r) => r.work_mode === 'wfh');
  const flagged = present.filter((r) => r.outside_geofence);
  const stillIn = present.filter((r) => !r.check_out_at);

  const L = [];
  L.push(`*CAPITAL BRIX — Attendance*`);
  L.push(`${date}`);
  L.push('');
  L.push(`👥 Strength: ${rows.length}`);
  L.push(`✅ Present: ${present.length}   ❌ Absent: ${absent.length}`);
  if (onLeave.length) L.push(`🌴 On leave: ${onLeave.length}`);
  L.push(`⏰ Late: ${late.length}   🚗 Site visits: ${siteVisits.length}${wfh.length ? `   🏠 WFH: ${wfh.length}` : ''}`);

  if (absent.length) {
    L.push('');
    L.push(`*Absent (${absent.length})*`);
    absent.forEach((r) => L.push(`• ${r.full_name}${r.department ? ` (${r.department})` : ''}`));
  }

  if (late.length) {
    L.push('');
    L.push(`*Late (${late.length})*`);
    late.forEach((r) => L.push(`• ${r.full_name} — ${fmtTime(r.check_in_at)}${r.late_minutes ? ` (+${r.late_minutes}m)` : ''}`));
  }

  if (siteVisits.length) {
    L.push('');
    L.push(`*Site visits (${siteVisits.length})*`);
    siteVisits.forEach((r) => L.push(`• ${r.full_name} — ${fmtTime(r.check_in_at)}${r.note ? ` · ${r.note}` : ''}`));
  }

  if (onLeave.length) {
    L.push('');
    L.push(`*On leave*`);
    onLeave.forEach((r) => L.push(`• ${r.full_name} — ${r.hr_status}`));
  }

  if (flagged.length) {
    L.push('');
    L.push(`*⚠️ Office punch outside geofence*`);
    flagged.forEach((r) => L.push(`• ${r.full_name} — ${Math.round(r.distance_from_office)}m away`));
  }

  if (stillIn.length) {
    L.push('');
    L.push(`_${stillIn.length} still checked in at time of sending._`);
  }

  L.push('');
  L.push('— Sent from Capital Brix HR');
  return L.join('\n');
}

/** wa.me link. Number may be blank — WhatsApp then asks who to send it to. */
export function whatsappLink(number, text) {
  const digits = (number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildNudgeMessage(employeeName) {
  return `Hi ${employeeName?.split(' ')[0] || ''}, gentle reminder — please mark your attendance on the Capital Brix Employee Portal for today. Thanks!`;
}
