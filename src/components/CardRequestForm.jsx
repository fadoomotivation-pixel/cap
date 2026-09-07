import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CARD_TYPES, STATUS_META, cardTypeLabel, showsQuantity, QUANTITY_PRESETS } from '../lib/cards';
import { IdCard, Send, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Employee side of card requests. Raising one used to be a WhatsApp message to
 * HR, so nothing was tracked: no one could say what was pending, what had been
 * approved, or how many cards had actually been ordered.
 *
 * The printed fields are asked for explicitly rather than pulled from the
 * roster. A card is printed once and a misprint costs real money, so the
 * employee should confirm exactly what goes on it.
 */
export default function CardRequestForm({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    card_type: 'visiting',
    print_name: session.user.user_metadata?.full_name || '',
    designation: '',
    print_phone: '',
    print_email: session.user.email || '',
    quantity: 100,
    notes: '',
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('cb_card_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) setError(error.message);
    else setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Prefill name, phone and designation from the HR roster where we have it,
  // but leave every field editable — the roster is not always current.
  useEffect(() => {
    supabase.from('cb_employees')
      .select('full_name, phone, role_title')
      .ilike('email', session.user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          print_name: f.print_name || data.full_name || '',
          print_phone: f.print_phone || data.phone || '',
          designation: f.designation || data.role_title || '',
        }));
      });
  }, [session.user.email]);

  // Disabling the button during the request was not enough: two identical rows
  // landed two seconds apart, because nothing stopped a second send once the
  // first had finished and the form still held the same values. HR then had two
  // jobs for one card. The check is here rather than a database constraint
  // because a second card is sometimes legitimate — a lost ID, a reprint — so
  // the employee is asked, not blocked.
  const alreadyOpen = rows.some((r) =>
    !['delivered', 'rejected'].includes(r.status) &&
    r.card_type === form.card_type &&
    (r.print_name || '').trim().toLowerCase() === form.print_name.trim().toLowerCase() &&
    (r.designation || '').trim().toLowerCase() === form.designation.trim().toLowerCase() &&
    (r.print_phone || '').trim() === form.print_phone.trim()
  );

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (alreadyOpen && !window.confirm(
      'You already have an open request for exactly this card. Send another one anyway?'
    )) return;
    setBusy(true); setError('');
    const { error } = await supabase.from('cb_card_requests').insert([{
      user_id: session.user.id,
      employee_email: session.user.email,
      card_type: form.card_type,
      print_name: form.print_name.trim(),
      designation: form.designation.trim(),
      print_phone: form.print_phone.trim(),
      print_email: form.print_email.trim() || null,
      quantity: showsQuantity(form.card_type) ? Number(form.quantity) : 1,
      notes: form.notes.trim() || null,
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setForm({ ...form, notes: '' });
    load();
    setTimeout(() => setDone(false), 5000);
  };

  const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[#10243E] flex items-center gap-2 mb-1">
          <IdCard size={20} className="text-[#D4AF37]" /> Request a card
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Check every field carefully — this is exactly what gets printed, and a reprint costs money.
        </p>

        {done && (
          <p className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">
            <CheckCircle size={17} /> Request sent. HR will move it along and you can track it below.
          </p>
        )}
        {error && (
          <p className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
            <AlertTriangle size={17} className="shrink-0 mt-0.5" /> {error}
          </p>
        )}

        {alreadyOpen && !done && (
          <p className="flex items-start gap-2 text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm mb-4">
            <AlertTriangle size={17} className="shrink-0 mt-0.5" />
            You already have an open request for this exact card — check "Your requests" below
            before sending another.
          </p>
        )}

        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2">
            <span className={label}>What do you need?</span>
            <div className="flex flex-wrap gap-2">
              {CARD_TYPES.map((c) => (
                <button
                  key={c.value} type="button"
                  onClick={() => setForm({ ...form, card_type: c.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    form.card_type === c.value
                      ? 'bg-[#10243E] text-white border-[#10243E]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </label>

          <label>
            <span className={label}>Name as printed *</span>
            <input required value={form.print_name}
              onChange={(e) => setForm({ ...form, print_name: e.target.value })}
              className={input} placeholder="Full name" />
          </label>
          <label>
            <span className={label}>Designation as printed *</span>
            <input required value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className={input} placeholder="Sales Executive" />
          </label>
          <label>
            <span className={label}>Phone on the card *</span>
            <input required type="tel" inputMode="tel" value={form.print_phone}
              onChange={(e) => setForm({ ...form, print_phone: e.target.value })}
              className={input} placeholder="+91" />
          </label>
          <label>
            <span className={label}>Email on the card</span>
            <input type="email" value={form.print_email}
              onChange={(e) => setForm({ ...form, print_email: e.target.value })}
              className={input} />
          </label>

          {/* This was a number input with min=1 and step=50, so the browser's
              own steppers walked 1, 51, 101, 151 — one request came in for 101
              cards. Visiting cards are ordered in boxes anyway, so the amounts
              HR actually orders are the only choices. */}
          {showsQuantity(form.card_type) && (
            <label>
              <span className={label}>How many visiting cards</span>
              <div className="flex flex-wrap gap-2">
                {QUANTITY_PRESETS.map((q) => (
                  <button
                    key={q} type="button"
                    onClick={() => setForm({ ...form, quantity: q })}
                    aria-pressed={Number(form.quantity) === q}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      Number(form.quantity) === q
                        ? 'bg-[#10243E] text-white border-[#10243E]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </label>
          )}

          <label className={showsQuantity(form.card_type) ? '' : 'sm:col-span-2'}>
            <span className={label}>Anything else HR should know</span>
            <input value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={input} placeholder="Optional" />
          </label>

          <div className="sm:col-span-2">
            <button type="submit" disabled={busy}
              className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3 rounded-lg text-sm font-semibold transition disabled:opacity-60 w-full sm:w-auto">
              {busy ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-[#10243E] mb-4">Your requests</h3>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const meta = STATUS_META[r.status] || STATUS_META.requested;
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 border border-gray-100 rounded-xl p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#10243E]">
                      {cardTypeLabel(r.card_type)}
                      {showsQuantity(r.card_type) ? ` · ${r.quantity} visiting cards` : ''}
                    </p>
                    <p className="text-sm text-gray-500">{r.print_name} — {r.designation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.print_phone}{r.print_email ? ` · ${r.print_email}` : ''}
                    </p>
                    {r.admin_notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <span className="text-gray-400">HR:</span> {r.admin_notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Raised {format(new Date(r.created_at), 'd MMM yyyy')}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium border rounded-lg px-2.5 py-1 ${meta.cls}`}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
