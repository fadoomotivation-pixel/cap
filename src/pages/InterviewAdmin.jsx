import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Link as LinkIcon, Trash2, Users, AlertCircle, Copy, CheckCircle, LogOut, X } from 'lucide-react';
import { format, addMinutes, parse, isBefore } from 'date-fns';
import { ADMIN_EMAILS } from '../lib/admin';

export default function InterviewAdmin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Data states
  const [slots, setSlots] = useState([]);
  const [links, setLinks] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Generator states
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [linkType, setLinkType] = useState('generic');
  const [linkLabel, setLinkLabel] = useState('');

  const [copiedLink, setCopiedLink] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkIfAdmin(session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkIfAdmin(session.user.email);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfAdmin = (email) => {
    if (ADMIN_EMAILS.includes(email?.toLowerCase())) {
      setIsAdmin(true);
      fetchData();
    } else {
      setIsAdmin(false);
      setError('You do not have HR Admin access.');
      supabase.auth.signOut();
    }
    setLoading(false);
  };

  const fetchData = async () => {
    // Fetch Slots
    const { data: slotsData } = await supabase
      .from('interview_slots')
      .select('*')
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    // Fetch Links
    const { data: linksData } = await supabase
      .from('interview_links')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch Bookings
    const { data: bookingsData } = await supabase
      .from('interview_bookings')
      .select('*, interview_slots(*)')
      .order('booked_at', { ascending: false });

    if (slotsData) setSlots(slotsData);
    if (linksData) setLinks(linksData);
    if (bookingsData) setBookings(bookingsData);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const generateSlots = async () => {
    setLoading(true);
    try {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      
      const newSlots = [];
      let current = start;
      
      while (isBefore(current, end)) {
        const next = addMinutes(current, 15);
        newSlots.push({
          slot_date: selectedDate,
          start_time: format(current, 'HH:mm:ss'),
          end_time: format(next, 'HH:mm:ss'),
          status: 'open'
        });
        current = next;
      }

      if (newSlots.length > 0) {
        const { error } = await supabase.from('interview_slots').insert(newSlots);
        if (error) throw error;
        alert(`Successfully created ${newSlots.length} slots for ${selectedDate}`);
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const generateLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_links')
        .insert([{ type: linkType, label: linkLabel }])
        .select()
        .single();
      
      if (error) throw error;
      fetchData();
      setLinkLabel('');
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const deleteSlot = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    await supabase.from('interview_slots').delete().eq('id', id);
    fetchData();
  };

  const cancelBooking = async (id, slotId) => {
    if (!window.confirm('Cancel booking and reopen slot?')) return;
    
    // Delete booking
    await supabase.from('interview_bookings').delete().eq('id', id);
    // Reopen slot
    await supabase.from('interview_slots').update({ status: 'open' }).eq('id', slotId);
    
    fetchData();
  };

  const deactivateLink = async (token) => {
    await supabase.from('interview_links').update({ is_active: false }).eq('token', token);
    fetchData();
  };

  const copyToClipboard = (token) => {
    const url = `${window.location.origin}/book/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) return <div className="pt-[100px] text-center min-h-screen">Loading...</div>;

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6 text-[#10243E]">HR Scheduler Login</h2>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HR Email</label>
              <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-[#f26522]" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-[#10243E] text-white py-2.5 rounded-md font-medium hover:bg-[#1a365d] transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 font-outfit">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#10243E]">Interview Scheduler</h1>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Generators */}
          <div className="space-y-6">
            {/* Generate Slots */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-[#f26522]" /> Generate Slots</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                  </div>
                </div>
                <button onClick={generateSlots} disabled={loading} className="w-full bg-[#10243E] text-white py-2 rounded-md hover:bg-[#1a365d] transition">
                  Auto-Generate 15min Slots
                </button>
              </div>
            </div>

            {/* Generate Links */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon size={20} className="text-[#f26522]" /> Generate Link</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Link Type</label>
                  <select value={linkType} onChange={e => setLinkType(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]">
                    <option value="generic">Generic (Multiple Uses)</option>
                    <option value="single-use">Single-use (One Interview)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label / Title</label>
                  <input type="text" placeholder="e.g. Frontend Dev Walk-in" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="w-full border rounded-md px-3 py-2 outline-none focus:border-[#f26522]" />
                </div>
                <button onClick={generateLink} disabled={loading} className="w-full bg-[#f26522] text-white py-2 rounded-md hover:bg-[#e0561b] transition">
                  Create Link
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Links */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E]">Shareable Links</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-3 text-sm font-medium text-gray-500">Label</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Type</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Status</th>
                      <th className="p-3 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {links.map(link => (
                      <tr key={link.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-800">{link.label || 'Unnamed Link'}</td>
                        <td className="p-3 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{link.type}</span></td>
                        <td className="p-3 text-sm">
                          {link.is_active ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14}/> Active</span> : <span className="text-red-500 font-medium">Inactive</span>}
                        </td>
                        <td className="p-3 flex items-center gap-3">
                          {link.is_active && (
                            <button onClick={() => copyToClipboard(link.token)} className="text-[#10243E] hover:text-[#f26522] transition-colors" title="Copy Link">
                              {copiedLink === link.token ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                          )}
                          {link.is_active && (
                            <button onClick={() => deactivateLink(link.token)} className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors">Deactivate</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {links.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">No links generated yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E]">Recent Bookings</h2>
              <div className="space-y-3">
                {bookings.map(booking => (
                  <div key={booking.id} className="flex flex-col md:flex-row justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 bg-gray-50/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-[#10243E] flex items-center gap-2"><Users size={16} className="text-[#f26522]"/> {booking.candidate_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{booking.candidate_email} • {booking.candidate_phone}</p>
                      <p className="text-sm font-medium text-[#f26522] mt-2 flex items-center gap-1">
                        <Clock size={14}/> {format(new Date(booking.interview_slots?.slot_date), 'MMM dd, yyyy')} | {booking.interview_slots?.start_time.substring(0,5)} - {booking.interview_slots?.end_time.substring(0,5)}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-start justify-end">
                      <button onClick={() => cancelBooking(booking.id, booking.slot_id)} className="text-red-400 text-sm hover:text-red-600 hover:underline flex items-center gap-1 transition-colors">
                        <Trash2 size={16} /> Cancel Booking
                      </button>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && <p className="text-center text-gray-400 py-6">No interviews booked yet.</p>}
              </div>
            </div>

            {/* Manage Slots */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-[#10243E]">Manage Open Slots</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slots.filter(s => s.status === 'open').map(slot => (
                  <div key={slot.id} className="group relative border border-gray-200 rounded-md p-3 text-center text-sm hover:border-[#f26522] bg-white transition-colors cursor-default shadow-sm">
                    <div className="font-semibold text-gray-800">{format(new Date(slot.slot_date), 'MMM dd')}</div>
                    <div className="text-gray-500 mt-1 font-medium">{slot.start_time.substring(0,5)}</div>
                    <button onClick={() => deleteSlot(slot.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {slots.filter(s => s.status === 'open').length === 0 && <p className="text-gray-400 col-span-full py-4 text-center">No open slots available.</p>}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
