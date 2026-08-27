import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Clock, User, Mail, Phone, AlertCircle, CalendarX } from 'lucide-react';

const fmtTime = (t) => t ? t.slice(0, 5) : '';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export default function BookInterview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: linkData } = await supabase.from('interview_links').select('*').eq('token', token).eq('is_active', true).maybeSingle();
    setLink(linkData);
    if (linkData) {
      const { data: slotData } = await supabase.from('interview_slots').select('*').eq('status', 'open').order('slot_date').order('start_time');
      setSlots(slotData || []);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const groupedByDate = slots.reduce((acc, s) => {
    (acc[s.slot_date] = acc[s.slot_date] || []).push(s);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) { setError('Please select a time slot.'); return; }
    setSubmitting(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('book_interview_slot', {
        p_slot_id: selectedSlot,
        p_link_token: token,
        p_name: name,
        p_email: email,
        p_phone: phone,
      });
      if (rpcError) throw rpcError;
      if (!data?.success) {
        setError(data?.error || 'This slot was just taken. Please pick another.');
        load();
        return;
      }
      navigate(`/book/confirm/${data.booking_id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-outfit">Loading...</div>;

  if (!link) {
    return (
      <div className="min-h-screen bg-[#F0F5FA] flex flex-col items-center justify-center font-outfit p-4 text-center pt-24">
        <CalendarX size={56} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-[#10243E] mb-2">Link Invalid or Expired</h1>
        <p className="text-gray-500">This booking link is no longer active. Please request a new one from HR.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F5FA] font-outfit pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#10243E]">Schedule Your Interview</h1>
          <p className="text-gray-500 mt-2">Capital Brix · Pick a convenient time slot below</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-[#10243E] mb-4 flex items-center gap-2"><Clock size={18} className="text-[#f26522]" /> Available Slots</h2>
          {Object.keys(groupedByDate).length === 0 ? (
            <p className="text-gray-400 text-sm">No open slots right now. Please check back later.</p>
          ) : (
            Object.entries(groupedByDate).map(([date, daySlots]) => (
              <div key={date} className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">{fmtDate(date)}</p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSelectedSlot(s.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        selectedSlot === s.id ? 'bg-[#f26522] border-[#f26522] text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-[#f26522]'
                      }`}>
                      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {Object.keys(groupedByDate).length > 0 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-[#10243E] mb-2">Your Details</h2>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm" placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm" placeholder="+91 98765 43210" />
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting}
              className="w-full bg-[#10243E] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50">
              {submitting ? 'Confirming...' : 'Confirm Interview Slot'}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}
