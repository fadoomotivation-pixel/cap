/**
 * Channel-partner recruitment: the shared vocabulary.
 *
 * The pipeline, the CSV shape and the status labels live here rather than in
 * the console and the portal separately, because those two screens describe
 * the same rows to two different people and drifting apart is how a
 * telecaller and an admin end up meaning different things by "interested".
 */

export const PARTNER_STATUSES = [
  { key: 'new',            label: 'Not called yet', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  { key: 'contacted',      label: 'Contacted',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'interested',     label: 'Interested',     cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'meeting',        label: 'Meeting set',    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'onboarded',      label: 'Onboarded',      cls: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'not-interested', label: 'Not interested', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  { key: 'dnc',            label: 'Do not call',    cls: 'bg-red-50 text-red-700 border-red-200' },
];

export const statusMeta = (key) =>
  PARTNER_STATUSES.find((s) => s.key === key) || PARTNER_STATUSES[0];

/** The columns an import understands. `source_ref` is what makes a re-import
 *  update instead of duplicate, so it is required rather than convenient. */
export const IMPORT_COLUMNS = [
  'source_ref', 'name', 'firm', 'phone', 'email',
  'rera_no', 'address', 'area', 'city', 'registered_on',
];

/**
 * A CSV parser that handles the one thing a naive split cannot: a comma
 * inside a quoted address. Registry exports are full of them, and a row that
 * silently shifts one column to the left puts a pin code in the phone field.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else { quoted = false; }
      } else { cell += c; }
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = []; cell = '';
      continue;
    }
    cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

/**
 * CSV text -> rows ready for cb_import_partner_targets.
 *
 * Header names are matched loosely (case, spaces and underscores ignored) so
 * a registry export can be pasted as-is. Anything without a name is dropped
 * and counted rather than silently skipped: an import that says "480 rows"
 * when the file had 500 is how bad data hides.
 */
export function rowsFromCsv(text, source) {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], skipped: 0, headerFound: false };

  const norm = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '');
  const header = table[0].map(norm);

  const ALIASES = {
    source_ref: ['sourceref', 'ref', 'regno', 'registrationno', 'registrationnumber', 'id', 'cin', 'llpin'],
    name: ['name', 'agentname', 'applicantname', 'promotername', 'companyname', 'fullname'],
    firm: ['firm', 'firmname', 'organisation', 'organization', 'tradename', 'businessname'],
    phone: ['phone', 'mobile', 'contact', 'contactno', 'mobileno', 'phoneno'],
    email: ['email', 'emailid', 'mail'],
    rera_no: ['rerano', 'reraregistrationno', 'registrationno', 'regno'],
    address: ['address', 'officeaddress', 'registeredaddress'],
    area: ['area', 'locality', 'sector'],
    city: ['city', 'district', 'town'],
    registered_on: ['registeredon', 'registrationdate', 'dateofregistration', 'dateofincorporation', 'validfrom', 'date'],
  };

  const index = {};
  for (const col of IMPORT_COLUMNS) {
    const i = header.findIndex((h) => h === norm(col) || (ALIASES[col] || []).includes(h));
    if (i >= 0) index[col] = i;
  }

  const rows = [];
  let skipped = 0;
  for (let r = 1; r < table.length; r += 1) {
    const line = table[r];
    const get = (col) => (index[col] === undefined ? '' : String(line[index[col]] ?? '').trim());
    const name = get('name');
    if (!name) { skipped += 1; continue; }

    // Without a source_ref nothing can be de-duplicated on a re-import, so
    // one is derived from what the row does have. Stable input, stable key.
    const ref = get('source_ref')
      || get('rera_no')
      || `${name}|${get('phone')}`.toLowerCase();

    const out = { source, source_ref: ref, name };
    for (const col of IMPORT_COLUMNS) {
      if (col === 'source_ref' || col === 'name') continue;
      const v = get(col);
      if (v) out[col] = v;
    }
    // A date the database cannot read is worse than no date: it would fail
    // the whole batch for one bad cell.
    if (out.registered_on && Number.isNaN(Date.parse(out.registered_on))) delete out.registered_on;
    rows.push(out);
  }

  return { rows, skipped, headerFound: Object.keys(index).length > 0 };
}

/** What a telecaller sends first. Short, names who we are, asks one question. */
export const partnerWhatsApp = (t) =>
  `Hello ${String(t.name || '').trim()}, this is Capital Brix LLP — we market ` +
  `NA-approved, title-clear plots in Dholera SIR, developed by Mirrikh Infratech ` +
  `Pvt. Ltd. and marketed by us as an authorised sales channel partner.\n\n` +
  `We are adding channel partners in Delhi NCR. Would you be open to a short ` +
  `call about the inventory and the partner terms?`;
