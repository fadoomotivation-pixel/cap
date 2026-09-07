import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link2, UserPlus, X, AlertCircle } from 'lucide-react';

/**
 * A KYC record whose submitting login matches nobody on the roster.
 *
 * There are only two truthful ways out of that state and HR is the one who
 * knows which applies: either this is someone already on the roster who filled
 * the form from a different address, or they were never added at all. Guessing
 * between them means asserting an identity on an ID document, so the panel
 * asks rather than resolving it automatically.
 *
 * Linking writes employee_kyc.employee_id. It deliberately does NOT touch
 * cb_employees.user_id — that column is the work login attendance punches
 * resolve through, and repointing it at a personal account would break punch-in.
 */
export default function OrphanKycResolver({ kyc, roster, onDone, onCancel }) {
  const [mode, setMode] = useState('link');
  const [employeeId, setEmployeeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // The email on a new roster row is the work login: attendance resolves a
  // punch by matching it, and HR creates the account against it. So it is
  // prefilled from KYC but stays editable — for the people who submitted from
  // a personal address, the prefilled value is the wrong one to keep.
  const [form, setForm] = useState({
    full_name: (kyc.full_name || '').trim(),
    email: (kyc.email || '').trim(),
    phone: (kyc.phone || '').trim(),
    role_title: kyc.role_title || '',
    department: kyc.department || '',
    date_of_joining: kyc.date_of_joining || '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const linkExisting = async () => {
    if (!employeeId) return;
    setBusy(true); setError('');
    const { error: err } = await supabase
      .from('employee_kyc').update({ employee_id: employeeId }).eq('id', kyc.id);
    setBusy(false);
    if (err) return setError(err.message);
    onDone();
  };

  const createAndLink = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      return setError('Name and work email are both required.');
    }
    setBusy(true); setError('');

    const { data: emp, error: insErr } = await supabase
      .from('cb_employees')
      .insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role_title: form.role_title.trim() || null,
        department: form.department.trim() || null,
        date_of_joining: form.date_of_joining || null,
      })
      .select('id').single();

    if (insErr) { setBusy(false); return setError(insErr.message); }

    // If the link fails the roster row still stands, so say which half landed
    // rather than reporting a clean failure HR would retry and duplicate.
    const { error: linkErr } = await supabase
      .from('employee_kyc').update({ employee_id: emp.id }).eq('id', kyc.id);
    setBusy(false);
    if (linkErr) {
      return setError(`Added to the roster, but linking the KYC failed: ${linkErr.message}`);
    }
    onDone();
  };

  const btn = 'px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50';
  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40';

  return (
    <div className="mt-4 bg-white border border-amber-300 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-[#10243E]">{kyc.full_name}</p>
          <p className="text-xs text-gray-500">Submitted from {kyc.email || 'no email on record'}</p>
        </div>
        <button onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('link'); setError(''); }}
          className={`${btn} flex items-center gap-1.5 ${mode === 'link' ? 'bg-[#10243E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Link2 size={15} /> Link to someone on the roster
        </button>
        <button
          onClick={() => { setMode('create'); setError(''); }}
          className={`${btn} flex items-center gap-1.5 ${mode === 'create' ? 'bg-[#10243E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <UserPlus size={15} /> Add them to the roster
        </button>
      </div>

      {mode === 'link' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Pick the person this KYC belongs to. Their login and attendance are unaffected —
            this only attaches the documents to their record.
          </p>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={field}>
            <option value="">Select an employee…</option>
            {roster.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} · {e.email}</option>
            ))}
          </select>
          <button onClick={linkExisting} disabled={busy || !employeeId} className={`${btn} bg-[#D4AF37] text-[#0A1016] hover:bg-[#c9a431]`}>
            {busy ? 'Linking…' : 'Link this KYC'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
              <input value={form.full_name} onChange={set('full_name')} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Work email</label>
              <input value={form.email} onChange={set('email')} className={field} />
              <p className="text-[11px] text-amber-700 mt-1">
                This becomes their login and is how attendance finds them — use the
                @capitalbrix.com address, not a personal one.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={set('phone')} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <input value={form.role_title} onChange={set('role_title')} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input value={form.department} onChange={set('department')} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of joining</label>
              <input type="date" value={form.date_of_joining} onChange={set('date_of_joining')} className={field} />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            This adds them to the roster and attaches the KYC. It does not create their
            login — do that in <strong>Attendance → Employees</strong>, which also fills in
            their punch-in access.
          </p>
          <button onClick={createAndLink} disabled={busy} className={`${btn} bg-[#D4AF37] text-[#0A1016] hover:bg-[#c9a431]`}>
            {busy ? 'Saving…' : 'Add to roster & link KYC'}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 flex items-start gap-1.5">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
