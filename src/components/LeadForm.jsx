import React, { useState } from 'react';
import { CheckCircle, Send, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { submitLead } from '../lib/leads';
import { site } from '../data/site';

const wa = `https://wa.me/${site.phone}?text=${encodeURIComponent(site.whatsappMessage)}`;

/**
 * The conversion block that ends every content page. Three fields only —
 * every extra field costs leads — plus WhatsApp and call, which work even
 * when someone will not fill a form at all.
 */
export default function LeadForm({ source = 'website', headline, sub, dark = false }) {
  const [form, setForm] = useState({ full_name: '', phone: '', message: '' });
  const [state, setState] = useState({ busy: false, error: '', done: false });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', done: false });
    const res = await submitLead({ ...form, source });
    if (res.error) setState({ busy: false, error: res.error, done: false });
    else setState({ busy: false, error: '', done: true });
  };

  const label = dark ? 'text-white/60' : 'text-gray-500';
  const input = dark
    ? 'w-full bg-white/10 border border-white/20 rounded-md px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]'
    : 'w-full bg-white border border-gray-200 rounded-md px-4 py-3 text-[#10243E] outline-none focus:border-[#D4AF37]';

  if (state.done) {
    return (
      <div className={`rounded-2xl p-8 text-center ${dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
        <h3 className={`text-2xl font-heading mb-2 ${dark ? 'text-white' : 'text-[#10243E]'}`}>Got it — thank you.</h3>
        <p className={`text-sm mb-6 ${dark ? 'text-white/70' : 'text-gray-500'}`}>
          A Capital Brix advisor will call you on the number you gave. If you would rather not wait,
          message us on WhatsApp and we will reply straight away.
        </p>
        <a href={wa} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-sm font-semibold">
          <MessageCircle size={18} /> Open WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 sm:p-8 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
      <h3 className={`text-2xl font-heading mb-2 ${dark ? 'text-white' : 'text-[#10243E]'}`}>
        {headline || 'Talk to someone who knows the paperwork'}
      </h3>
      <p className={`text-sm mb-6 ${dark ? 'text-white/70' : 'text-gray-500'}`}>
        {sub || 'Tell us what you are looking for and we will send you the approvals, the plot layout and the all-in cost — before you commit to anything.'}
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className={`block text-xs mb-1 ${label}`}>Your name</span>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={input} placeholder="Name" autoComplete="name" />
        </label>
        <label className="block">
          <span className={`block text-xs mb-1 ${label}`}>Phone / WhatsApp</span>
          <input required type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={input} placeholder="+91" autoComplete="tel" />
        </label>
        <label className="block">
          <span className={`block text-xs mb-1 ${label}`}>What are you looking for? (optional)</span>
          <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={input} placeholder="Residential plot, ~150 sq yd" />
        </label>

        {state.error && <p className="text-sm text-red-500">{state.error}</p>}

        <button type="submit" disabled={state.busy}
          className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0A1016] px-6 py-3.5 rounded-sm font-semibold transition-colors disabled:opacity-60">
          <Send size={17} /> {state.busy ? 'Sending…' : 'Request a callback'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        <a href={wa} target="_blank" rel="noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-sm font-medium border transition-colors ${
            dark ? 'border-white/20 text-white hover:border-white/50' : 'border-gray-200 text-[#10243E] hover:border-[#D4AF37]'
          }`}>
          <MessageCircle size={16} className="text-green-600" /> WhatsApp
        </a>
        <a href={`tel:+${site.phone}`}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-sm font-medium border transition-colors ${
            dark ? 'border-white/20 text-white hover:border-white/50' : 'border-gray-200 text-[#10243E] hover:border-[#D4AF37]'
          }`}>
          <Phone size={16} /> {site.phoneDisplay}
        </a>
      </div>

      <p className={`flex items-start gap-2 text-xs mt-4 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#D4AF37]" />
        NA-approved, title-clear plots · registered sale deed in your name · direct developer pricing.
        We do not share your number with anyone.
      </p>
    </div>
  );
}
