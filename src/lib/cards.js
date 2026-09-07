export const CARD_TYPES = [
  { value: 'visiting', label: 'Visiting card' },
  { value: 'id',       label: 'ID card' },
  { value: 'both',     label: 'Both' },
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
