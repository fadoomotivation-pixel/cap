export const CARD_TYPES = [
  { value: 'visiting', label: 'Visiting cards' },
  { value: 'id',       label: 'ID card' },
  // "Both" told HR nothing on its own — it reads as a quantity, not a
  // description of what to hand the printer. Spell out the two items.
  { value: 'both',     label: 'ID card + visiting cards' },
];

// The order is the workflow. Admins move a request forward through it; an
// employee only ever watches.
export const CARD_STATUSES = ['requested', 'approved', 'printing', 'ready', 'delivered', 'rejected'];

export const STATUS_META = {
  requested: { label: 'Requested', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved:  { label: 'Approved',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  printing:  { label: 'At printer', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  ready:     { label: 'Ready to collect', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  delivered: { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected:  { label: 'Rejected',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export const cardTypeLabel = (v) => CARD_TYPES.find((c) => c.value === v)?.label || v;

/** Visiting cards are ordered in quantity; an ID card is one per person. */
export const showsQuantity = (cardType) => cardType === 'visiting' || cardType === 'both';

/** Visiting cards are ordered in boxes, so these are the amounts HR actually
 *  places orders for. A free number field produced a request for 101 cards. */
export const QUANTITY_PRESETS = [100, 200, 500, 1000];

/**
 * Requests that repeat one already open.
 *
 * The portal let an employee press Send twice — two identical rows landed two
 * seconds apart — and the console showed them as two separate jobs, which is
 * two cards printed and paid for. Returns the ids of the later copies, so the
 * first one stays the live request and the duplicates are flagged rather than
 * hidden: only HR can say whether a genuine second card is wanted.
 */
export function duplicateIds(rows) {
  const seen = new Map();
  const dupes = new Set();
  // Oldest first, so the original is the one that keeps its clean row.
  [...rows]
    .filter((r) => !['delivered', 'rejected'].includes(r.status))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach((r) => {
      const key = [r.user_id, r.card_type, r.print_name, r.designation, r.print_phone, r.print_email, r.quantity]
        .map((v) => String(v ?? '').trim().toLowerCase()).join('|');
      if (seen.has(key)) dupes.add(r.id);
      else seen.set(key, r.id);
    });
  return dupes;
}
