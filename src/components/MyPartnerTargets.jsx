import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PARTNER_STATUSES, statusMeta, partnerWhatsApp } from '../lib/partnerTargets';
import { Phone, MessageCircle, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * A telecaller's own channel-partner list.
 *
 * They see ONLY what an admin handed them. That is enforced in Postgres by
 * RLS, not here — a filter in a React component is a suggestion, and the one
 * thing this table must never become is a database of names anybody on the
 * payroll can browse and take with them.
 *
 * Ordered by registration date because the whole premise is freshness: a firm
 * registered this week needs inventory and a developer relationship, and one
 * from three years ago already has both.
 */
export default function MyPartnerTargets() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cb_partner_targets')
      .select('*')
      .order('status', { ascending: true })
      .order('registered_on', { ascending: false, nullsFirst: false })
      .limit(300);
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.firm, r.phone, r.city, r.area]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const todo = rows.filter((r) => r.status === 'new').length;
  const won = rows.filter((r) => r.status === 'onboarded').length;

  const patch = async (row, changes) => {
    setSaving(row.id);
    // Stamping the contact time here rather than making somebody remember to:
    // the only reliable follow-up list is one nobody has to maintain by hand.
    const body = { ...changes };
    if (changes.status && changes.status !== 'new') body.last_contact_at = new Date().toISOString();
    const { error } = await supabase.from('cb_partner_targets').update(body).eq('id', row.id);
    setSaving(null);
    if (!error) setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...body } : r)));
  };

  if (loading) return <p className="text-gray-400 text-sm py-12 text-center">Loading your list…</p>;

  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">Nothing has been handed to you yet.</p>
        <p className="text-gray-400 text-xs mt-1">HR hands out the newest registrations — check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          <strong className="text-[#10243E]">{todo}</strong> still to call
          {won > 0 && <> · <strong className="text-green-700">{won}</strong> onboarded</>}
        </p>
        <button onClick={load} className="text-xs text-gray-400 hover:text-[#f26522] flex items-center gap-1">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your list"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#f26522]" />
      </div>

      <div className="space-y-2">
        {visible.map((t) => {
          const meta = statusMeta(t.status);
          const open = openId === t.id;
          const digits = String(t.phone || '').replace(/\D/g, '');
          const wa = digits.length === 10 ? `91${digits}` : digits;
          return (
            <div key={t.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenId(open ? null : t.id)}
                className="w-full text-left p-3 flex flex-wrap items-start justify-between gap-2 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-[#10243E]">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {[t.firm, t.area, t.city].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {t.registered_on && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Registered {format(parseISO(t.registered_on), 'd MMM yyyy')}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border shrink-0 ${meta.cls}`}>
                  {meta.label}
                </span>
              </button>

              {open && (
                <div className="border-t border-gray-100 p-3 bg-gray-50/60">
                  {t.phone ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <a href={`tel:${t.phone}`}
                        className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-[#10243E] text-white hover:bg-[#1a365d]">
                        <Phone size={15} /> Call {t.phone}
                      </a>
                      <a href={`https://wa.me/${wa}?text=${encodeURIComponent(partnerWhatsApp(t))}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                      No phone number on this record. {t.address || 'Ask HR before spending time on it.'}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mb-1.5">Where has this reached?</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PARTNER_STATUSES.filter((s) => s.key !== 'dnc').map((s) => (
                      <button key={s.key} onClick={() => patch(t, { status: s.key })}
                        disabled={saving === t.id}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border disabled:opacity-50 ${
                          t.status === s.key ? s.cls : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>
                        {t.status === s.key && <CheckCircle2 size={11} className="inline mr-1 -mt-0.5" />}
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* One button, deliberately separate and worded as a promise
                      rather than a status: in India an unwanted commercial call
                      after a refusal is a regulated offence, not bad manners.
                      Once this is set nobody is ever handed this name again. */}
                  <button onClick={() => patch(t, { status: 'dnc', do_not_contact: true })}
                    disabled={saving === t.id}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 mb-3">
                    They asked not to be called again
                  </button>

                  <label className="block">
                    <span className="block text-xs text-gray-500 mb-1">Your note</span>
                    <textarea defaultValue={t.notes || ''} rows={2}
                      onBlur={(e) => { if (e.target.value !== (t.notes || '')) patch(t, { notes: e.target.value }); }}
                      placeholder="What did they say?"
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-[#f26522]" />
                  </label>

                  <label className="block mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Call again on</span>
                    <input type="date" defaultValue={t.next_follow_up || ''}
                      onChange={(e) => patch(t, { next_follow_up: e.target.value || null })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#f26522]" />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
