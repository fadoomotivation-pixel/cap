import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { site } from '../../data/site';
import { CheckCircle, MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';

const fmtTime = (t) => t ? t.slice(0, 5) : '';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error: rpcError } = await supabase.rpc('get_booking_confirmation', { p_booking_id: bookingId });
      if (rpcError || !data || data.length === 0) {
        setError('Booking not found.');
      } else {
        setBooking(data[0]);
      }
      setLoading(false);
    };
    load();
  }, [bookingId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-outfit">Loading...</div>;

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F0F5FA] flex flex-col items-center justify-center font-outfit p-4 text-center pt-24">
        <AlertCircle size={56} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-[#10243E] mb-2">Booking Not Found</h1>
        <p className="text-gray-500">Please check the link or contact HR.</p>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(site.address);

  return (
    <div className="min-h-screen bg-[#F0F5FA] font-outfit pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-[#10243E] mb-2">Interview Confirmed!</h1>
          <p className="text-gray-500 mb-6">See you soon, {booking.candidate_name.split(' ')[0]}.</p>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6 text-left">
            <p className="flex items-center gap-2 text-[#10243E] font-semibold"><Clock size={18} className="text-[#f26522]" /> {fmtDate(booking.slot_date)}</p>
            <p className="text-gray-600 ml-6 mt-1">{fmtTime(booking.start_time)} – {fmtTime(booking.end_time)}</p>
          </div>

          <div className="text-left mb-4">
            <p className="flex items-center gap-2 text-[#10243E] font-semibold mb-2"><MapPin size={18} className="text-[#f26522]" /> Office Location</p>
            <p className="text-gray-600 text-sm ml-6 mb-3">{site.address}</p>
            <div className="rounded-xl overflow-hidden border border-gray-200 ml-6">
              <iframe
                title="Office Location"
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              />
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#10243E] hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg mt-2"
          >
            <Navigation size={18} /> Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
