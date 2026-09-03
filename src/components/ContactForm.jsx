import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { submitLead } from '../lib/leads';
import { site } from '../data/site';

export default function ContactForm() {
  // This form used to call preventDefault() and nothing else, so every
  // enquiry typed into the site was silently discarded. It now writes to
  // cb_leads, which is admin-only to read.
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', message: '' });
  const [state, setState] = useState({ busy: false, error: '', done: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', done: false });
    const res = await submitLead({
      full_name: `${form.first} ${form.last}`.trim(),
      phone: form.phone,
      email: form.email,
      message: form.message,
      source: 'contact-page',
    });
    if (res.error) setState({ busy: false, error: res.error, done: false });
    else { setState({ busy: false, error: '', done: true }); }
  };

  return (
    <section className="py-20 bg-gray-50" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading text-[#1A1A1A] mb-4">
            Connect With Capital Brix
          </h2>
          <div className="w-16 h-1 bg-[#f37435] mx-auto"></div>
          <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
            Ready to invest in India's first greenfield smart city? Our experts are here to help you secure the best plots in Dholera SIR.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 bg-white rounded-sm overflow-hidden shadow-sm border border-gray-100">
          {/* Contact Info Sidebar */}
          <div className="w-full lg:w-2/5 bg-[#101010] text-white p-10 md:p-14">
            <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
            <p className="text-gray-400 mb-12 text-sm leading-relaxed">
              Fill up the form and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Phone className="text-[#f37435] mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Phone</h4>
                  <p className="text-gray-400">{site.phoneDisplay}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-[#f37435] mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Email</h4>
                  <p className="text-gray-400">{site.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="text-[#f37435] mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Address</h4>
                  <p className="text-gray-400 leading-relaxed text-sm">{site.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="w-full lg:w-3/5 p-10 md:p-14">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input type="text" placeholder="John" required={true} value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} className="w-full px-0 py-2 border-b-2 border-gray-200 focus:outline-none focus:border-[#f37435] transition-colors bg-transparent" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input type="text" placeholder="Doe" required={false} value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} className="w-full px-0 py-2 border-b-2 border-gray-200 focus:outline-none focus:border-[#f37435] transition-colors bg-transparent" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input type="email" placeholder="john@example.com" required={false} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-0 py-2 border-b-2 border-gray-200 focus:outline-none focus:border-[#f37435] transition-colors bg-transparent" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <input type="tel" placeholder="+91 00000 00000" required={true} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-0 py-2 border-b-2 border-gray-200 focus:outline-none focus:border-[#f37435] transition-colors bg-transparent" />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Message</label>
                <textarea rows="4" placeholder="Write your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-0 py-2 border-b-2 border-gray-200 focus:outline-none focus:border-[#f37435] transition-colors bg-transparent resize-none"></textarea>
              </div>

              <div className="md:col-span-2 mt-4">
                {state.done ? (
                  <p className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm">
                    <CheckCircle size={18} /> Thank you — we have your enquiry and will call you shortly.
                  </p>
                ) : (
                  <>
                    {state.error && <p className="text-sm text-red-500 mb-3">{state.error}</p>}
                    <button type="submit" disabled={state.busy}
                      className="bg-[#f37435] text-white px-10 py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-[#101010] transition-colors w-full md:w-auto disabled:opacity-60">
                      {state.busy ? 'Sending…' : 'Send Message'}
                    </button>
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
