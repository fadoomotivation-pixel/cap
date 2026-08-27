import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Mail, Phone, ChevronRight } from 'lucide-react';

export default function InterviewBooking() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [slots, setSlots] = useState([]);
  
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinkAndSlots();
  }, [token]);

  const fetchLinkAndSlots = async () => {
    setLoading(true);
    // 1. Fetch link
    const { data: link, error: linkErr } = await supabase
      .from('interview_links')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (linkErr || !link) {
      setError('This booking link is invalid, expired, or has already been used.');
      setLoading(false);
      return;
    }
    
    setLinkData(link);

    // 2. Fetch open slots
    const { data: slotsData } = await supabase
      .from('interview_slots')
      .select('*')
      .eq('status', 'open')
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    setSlots(slotsData || []);
    setLoading(false);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!selectedSlot) {
      setError('Please select a time slot first.');
      setSubmitting(false);
      return;
    }

    try {
      // Call our atomic RPC function
      const { data, error: rpcError } = await supabase.rpc('book_interview_slot', {
        p_slot_id: selectedSlot.id,
        p_link_token: token,
        p_name: formData.name,
        p_email: formData.email,
        p_phone: formData.phone
      });

      if (rpcError) throw rpcError;

      if (data && data.success) {
        navigate(`/book/confirm/${data.booking_id}`);
      } else {
        throw new Error(data?.error || 'Failed to book slot.');
      }
    } catch (err) {
      setError(err.message || 'That slot was just taken. Please pick another one.');
      // Refresh slots
      fetchLinkAndSlots();
      setSelectedSlot(null);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center text-gray-500 font-outfit">Loading calendar...</div>;
  }

  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 px-4 font-outfit flex justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#10243E] mb-2">Link Expired</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F0F5FA] pt-24 pb-20 font-outfit">
      <div className="max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-10">
          <p className="text-[#f26522] font-bold uppercase tracking-widest text-sm mb-2">Capital Brix</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#10243E]">Schedule Your Interview</h1>
          {linkData.label && <p className="text-gray-600 mt-2">{linkData.label}</p>}
        </div>

        {error && selectedSlot && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left: Slot Selection */}
          <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-[#10243E] mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#f26522]" /> Select a Time
            </h2>

            {Object.keys(groupedSlots).length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">
                No available slots currently. Please check back later.
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(groupedSlots).map(dateStr => (
                  <div key={dateStr} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-[#10243E] mb-3 border-b pb-2">
                      {format(new Date(dateStr), 'EEEE, MMMM do')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {groupedSlots[dateStr].map(slot => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-[#f26522] text-white shadow-md scale-[1.02]' 
                                : 'bg-gray-50 text-gray-700 hover:bg-[#10243E] hover:text-white border border-gray-100'
                            }`}
                          >
                            {slot.start_time.substring(0,5)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Candidate Details */}
          <div className="w-full md:w-1/2 p-6 md:p-8 bg-white">
            <h2 className="text-xl font-bold text-[#10243E] mb-6 flex items-center gap-2">
              <User size={20} className="text-[#f26522]" /> Your Details
            </h2>

            {selectedSlot ? (
              <div className="bg-[#10243E]/5 p-4 rounded-lg mb-6 border border-[#10243E]/10 flex items-start gap-3">
                <Clock className="text-[#f26522] shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Selected Time</p>
                  <p className="font-semibold text-[#10243E]">
                    {format(new Date(selectedSlot.slot_date), 'EEEE, MMM do, yyyy')}
                  </p>
                  <p className="text-[#f26522] font-medium">
                    {selectedSlot.start_time.substring(0,5)} - {selectedSlot.end_time.substring(0,5)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center text-gray-400 border border-gray-100 border-dashed">
                Please select a time slot on the left
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition-all bg-gray-50 focus:bg-white" 
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition-all bg-gray-50 focus:bg-white" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="tel" 
                    required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition-all bg-gray-50 focus:bg-white" 
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting || !selectedSlot}
                className="w-full mt-6 bg-[#10243E] text-white py-3.5 rounded-lg font-semibold hover:bg-[#1a365d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
              >
                {submitting ? 'Confirming...' : 'Confirm Interview'}
                {!submitting && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
