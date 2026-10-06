import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitLead } from '../lib/leads';
import { site } from '../data/site';
import { track } from '../lib/track';

/**
 * There is no checklist PDF in the repo. This asks for a name and a phone,
 * stores the lead in cb_leads, and points at the verification guide that
 * already lists the checks. It does not pretend a file was emailed.
 */
export default function ChecklistLead({ source = 'checklist' }) {
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [state, setState] = useState({ busy: false, error: '', done: false });
  const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent('Hi Capital Brix, please send the Dholera plot checklist: NA, title, 7/12, layout and sale deed.')}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', done: false });
    const res = await submitLead({
      full_name: form.full_name,
      phone: form.phone,
      message: 'Dholera plot checklist',
      source,
    });
    if (res.error) setState({ busy: false, error: res.error, done: false });
    else setState({ busy: false, error: '', done: true });
  };

  if (state.done) {
    return (
      <div className="rounded-sm border border-[#0A1016]/10 bg-[#0A1016] text-white p-6 sm:p-8">
        <p className="text-xs tracking-[0.16em] uppercase text-[#C9A962] mb-3">Checklist</p>
        <h2 className="text-white text-2xl font-semibold mb-2">We have your number.</h2>
        <p className="text-white/70 text-sm leading-relaxed mb-5">
          A Capital Brix advisor will send the plot checks on WhatsApp. You can also read them now.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={wa} target="_blank" rel="noreferrer" data-cta="checklist-whatsapp" onClick={() => track('cta_click', { cta_id: 'checklist-whatsapp' })}
            className="inline-flex justify-center bg-[#C9A962] text-[#0A1016] px-5 py-3 text-sm font-medium">
            Open WhatsApp
          </a>
          <Link to="/blog/how-to-verify-a-dholera-plot" className="inline-flex justify-center border border-white/20 px-5 py-3 text-sm">
            Read the verification guide
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-black/10 bg-[#f5f5f7] p-6 sm:p-8">
      <p className="text-xs tracking-[0.16em] uppercase text-[#9C7C1C] mb-3">Checklist</p>
      <h2 className="text-2xl font-semibold text-[#10243E] mb-2">Get the Dholera plot checks</h2>
      <p className="text-sm text-[#3a3a3c] leading-relaxed mb-5">
        Name and phone. We reply on WhatsApp with the same checks as the verification guide — NA, title, 7/12, layout and sale deed. There is no file to download.
      </p>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full bg-white border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#10243E]" placeholder="Name" autoComplete="name" />
        </label>
        <label className="block">
          <span className="sr-only">Phone</span>
          <input required type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-white border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#10243E]" placeholder="Phone" autoComplete="tel" />
        </label>
        <button type="submit" disabled={state.busy} data-cta="checklist-submit"
          className="bg-[#0A1016] text-white px-5 py-3 text-sm font-medium disabled:opacity-60">
          {state.busy ? 'Sending…' : 'Send it'}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600 mt-3">{state.error}</p>}
    </div>
  );
}
