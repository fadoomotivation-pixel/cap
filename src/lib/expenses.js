import { format, parseISO } from 'date-fns';

export const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash' },
  { value: 'upi',    label: 'UPI' },
  { value: 'card',   label: 'Card' },
  { value: 'bank',   label: 'Bank transfer' },
  { value: 'credit', label: 'On credit (pay later)' },
];

export const SETTLE_MODES = PAYMENT_MODES.filter((m) => m.value !== 'credit');

/** Indian grouping, no decimals — petty cash is never counted in paise. */
export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const inrExact = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d) => (d ? format(parseISO(String(d).slice(0, 10)), 'd MMM yyyy') : '—');

/**
 * An entry typed in days after it was spent is not wrong, but it is worth
 * seeing — that gap is where a forgotten bill or a reconstructed number hides.
 */
export const backdatedDays = (row) => {
  if (!row?.spend_date || !row?.created_at) return 0;
  const spent = new Date(`${String(row.spend_date).slice(0, 10)}T00:00:00`);
  const typed = new Date(row.created_at);
  return Math.max(0, Math.round((typed - spent) / 86400000));
};

/**
 * The founder's monthly money summary. Same shape as the attendance report:
 * headline numbers first, then only the lines that need a decision — an
 * over-budget category, an unpaid vendor, a cash count that did not match.
 */
export function buildExpenseWhatsAppSummary({ position, categories, monthLabel, todayTotal, asOn }) {
  const spentMonth = categories.reduce((s, c) => s + Number(c.spent || 0), 0);
  const over = categories.filter(
    (c) => c.monthly_budget && Number(c.spent) > Number(c.monthly_budget)
  );

  const L = [];
  L.push('*CAPITAL BRIX — Petty Cash*');
  L.push(`${monthLabel}${asOn ? ` (as on ${asOn})` : ''}`);
  L.push('');
  L.push(`💰 Cash in hand: ${inr(position?.cash_in_hand)}`);
  L.push(`📤 Spent this month: ${inr(spentMonth)}`);
  if (todayTotal > 0) L.push(`📅 Spent today: ${inr(todayTotal)}`);
  if (Number(position?.unsettled_dues) > 0) {
    L.push(`🧾 Unpaid vendor dues: ${inr(position.unsettled_dues)} (${position.unsettled_dues_count})`);
  }

  const top = categories.filter((c) => Number(c.spent) > 0).slice(0, 6);
  if (top.length) {
    L.push('');
    L.push('*Where it went*');
    top.forEach((c) => L.push(`• ${c.category_name} — ${inr(c.spent)} (${c.txn_count})`));
  }

  if (over.length) {
    L.push('');
    L.push('*⚠️ Over budget*');
    over.forEach((c) =>
      L.push(
        `• ${c.category_name} — ${inr(c.spent)} of ${inr(c.monthly_budget)} (+${inr(
          Number(c.spent) - Number(c.monthly_budget)
        )})`
      )
    );
  }

  if (position?.last_count_date) {
    const v = Number(position.last_count_variance || 0);
    L.push('');
    L.push(
      `🧮 Last cash count: ${fmtDate(position.last_count_date)} — ${
        v === 0 ? 'tallied' : v > 0 ? `${inr(v)} extra` : `${inr(Math.abs(v))} short`
      }`
    );
  } else {
    L.push('');
    L.push('🧮 Cash has not been physically counted yet.');
  }

  return L.join('\n');
}

export const whatsappLink = (number, text) => {
  const clean = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

export const downloadCsv = (rows, filename) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
