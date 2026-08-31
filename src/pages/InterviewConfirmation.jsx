import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { CheckCircle, Calendar, Clock, MapPin, Navigation, User } from 'lucide-react';

export default function InterviewConfirmation() {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  // Office Address constant
  const officeAddress = "A-118, 6th Floor, The Diamond, Sector 136, Noida, Uttar Pradesh 201304";
  const mapQuery = encodeURIComponent("Capital Brix, The Diamond, Sector 136, Noida");

  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error } = await supabase.rpc('get_booking_confirmation', { p_booking_id: bookingId });

      if (error || !data || data.length === 0) {
        setError('Booking not found.');
      } else {
        const row = data[0];
        setBooking({
          candidate_name: row.candidate_name,
          candidate_email: row.candidate_email,
          candidate_phone: row.candidate_phone,
          interview_slots: { slot_date: row.slot_date, start_time: row.start_time, end_time: row.end_time },
        });
      }
      setLoading(false);
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center text-gray-500 font-outfit">Loading confirmation...</div>;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-32 flex justify-center text-red-500 font-outfit">
        {error}
      </div>
    );
  }

  const slot = booking.interview_slots;

  return (
    <div className="min-h-screen bg-[#F0F5FA] pt-24 pb-20 font-outfit">
      <div className="max-w-3xl mx-auto px-4">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          
          {/* Top Banner */}
          <div className="bg-green-500 text-white p-8 text-center">
            <CheckCircle size={64} className="mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-black mb-2 text-white">Booking Confirmed!</h1>
            <p className="text-green-50 text-lg opacity-90">
              Hi {booking.candidate_name.split(' ')[0]}, your interview is scheduled.
            </p>
          </div>

          <div className="p-8 md:p-10">
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#f26522]">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-semibold text-[#10243E] text-lg">
                    {format(new Date(slot.slot_date), 'EEEE, MMMM do, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#f26522]">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="font-semibold text-[#10243E] text-lg">
                    {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#f26522]">
                  <MapPin size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-[#10243E] text-lg mb-2">
                    Capital Brix Headquarters
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {officeAddress}
                  </p>
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-[#10243E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a365d] transition-colors"
                  >
                    <Navigation size={16} /> Get Directions
                  </a>
                </div>
              </div>

            </div>

            {/* Map Embed */}
            <div className="w-full h-64 md:h-80 bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-gray-200">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${mapQuery}&t=m&z=15&output=embed&iwloc=near`}
              ></iframe>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <p className="text-gray-500 mb-4">A confirmation email has been sent to <span className="font-medium text-[#10243E]">{booking.candidate_email}</span>.</p>
              <p className="text-sm text-gray-400">If you need to reschedule, please contact HR.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
