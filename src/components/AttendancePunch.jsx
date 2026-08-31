import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import {
  MapPin, Camera, LogIn, LogOut, CheckCircle, AlertCircle, Building2, Navigation, Home, X, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

const WORK_MODES = [
  { value: 'office', label: 'Office', Icon: Building2, hint: 'Working from the Noida office' },
  { value: 'site-visit', label: 'Site Visit', Icon: Navigation, hint: 'On a client or Dholera site visit' },
  { value: 'wfh', label: 'Work From Home', Icon: Home, hint: 'Working remotely today' },
];

const fmtTime = (ts) => (ts ? format(new Date(ts), 'hh:mm a') : '—');

export default function AttendancePunch({ session }) {
  const [employee, setEmployee] = useState(null);
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [workMode, setWorkMode] = useState('office');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: emp } = await supabase.rpc('cb_my_employee');
    const record = Array.isArray(emp) ? emp[0] : emp;
    setEmployee(record || null);

    if (record?.id) {
      const { data: rows } = await supabase
        .from('cb_attendance')
        .select('*')
        .eq('employee_id', record.id)
        .order('work_date', { ascending: false })
        .limit(30);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setToday((rows || []).find((r) => r.work_date === todayStr) || null);
      setHistory(rows || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Location is captured at the moment of punching — this is what makes a
  // site-visit punch verifiable rather than self-reported.
  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const c = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoords(c);
          resolve(c);
        },
        () => { setLocating(false); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  const handleSelfie = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Selfie must be under 5MB'); return; }
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSelfiePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadSelfie = async () => {
    if (!selfieFile) return null;
    const ext = (selfieFile.name?.split('.').pop() || 'jpg').toLowerCase();
    const path = `attendance/${session.user.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('employee-photos')
      .upload(path, selfieFile, { contentType: selfieFile.type || 'image/jpeg' });
    if (upErr) throw upErr;
    return supabase.storage.from('employee-photos').getPublicUrl(path).data.publicUrl;
  };

  const punchIn = async () => {
    setBusy(true); setError(''); setOk('');
    try {
      const loc = await getLocation();
      // Site visits are the whole point of location tracking — don't let one
      // through without it.
      if (workMode === 'site-visit' && !loc) {
        throw new Error('Location is required for a site visit punch. Please allow location access and try again.');
      }
      const selfie_url = await uploadSelfie();

      const { data, error: rpcErr } = await supabase.rpc('cb_punch_in', {
        p_work_mode: workMode,
        p_lat: loc?.lat ?? null,
        p_lng: loc?.lng ?? null,
        p_accuracy: loc?.accuracy ?? null,
        p_selfie_url: selfie_url,
        p_note: note || null,
      });
      if (rpcErr) throw rpcErr;
      if (!data?.success) throw new Error(data?.error || 'Could not punch in.');

      setOk('Punched in. Have a good day!');
      setSelfieFile(null); setSelfiePreview(null); setNote('');
      await load();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const punchOut = async () => {
    setBusy(true); setError(''); setOk('');
    try {
      const loc = await getLocation();
      const { data, error: rpcErr } = await supabase.rpc('cb_punch_out', {
        p_lat: loc?.lat ?? null,
        p_lng: loc?.lng ?? null,
        p_note: note || null,
      });
      if (rpcErr) throw rpcErr;
      if (!data?.success) throw new Error(data?.error || 'Could not punch out.');
      setOk('Punched out. See you tomorrow!');
      setNote('');
      await load();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (loading) return <p className="text-gray-400 py-8 text-center">Loading attendance…</p>;

  if (!employee) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#10243E] mb-2">Not on the roster yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Attendance opens once HR adds you to the employee roster with this email
          ({session.user.email}). Please ask HR to add you.
        </p>
      </div>
    );
  }

  const punchedIn = !!today?.check_in_at;
  const punchedOut = !!today?.check_out_at;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {ok && (
        <div className="bg-green-50 text-green-700 border border-green-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" /> {ok}
        </div>
      )}

      {/* Today's status */}
      <div className="bg-[#10243E] text-white rounded-2xl p-6">
        <p className="text-white/60 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h3 className="text-2xl font-bold mt-1">Hi {employee.full_name.split(' ')[0]} 👋</h3>
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-wider">Punch In</p>
            <p className="text-xl font-bold mt-1">{fmtTime(today?.check_in_at)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-wider">Punch Out</p>
            <p className="text-xl font-bold mt-1">{fmtTime(today?.check_out_at)}</p>
          </div>
        </div>
        {punchedIn && (
          <p className="text-white/50 text-xs mt-3 capitalize">
            Mode: {today.work_mode.replace('-', ' ')}
            {today.check_in_lat ? ' · location captured' : ''}
            {today.selfie_url ? ' · selfie attached' : ''}
          </p>
        )}
      </div>

      {!punchedIn && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h4 className="font-bold text-[#10243E] mb-4">Where are you working today?</h4>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {WORK_MODES.map(({ value, label, Icon, hint }) => (
              <button key={value} type="button" onClick={() => setWorkMode(value)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  workMode === value ? 'border-[#f26522] bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                }`}>
                <Icon size={20} className={workMode === value ? 'text-[#f26522]' : 'text-gray-400'} />
                <p className="font-semibold text-[#10243E] mt-2 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
              </button>
            ))}
          </div>

          {workMode === 'site-visit' && (
            <p className="text-xs text-[#f26522] bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-4">
              Location is required for site visits so HR can verify the visit.
            </p>
          )}

          {/* Optional selfie */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Selfie <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {selfiePreview ? (
              <div className="relative inline-block">
                <img src={selfiePreview} alt="Selfie preview" className="w-24 h-24 rounded-xl object-cover border-2 border-[#f26522]" />
                <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#f26522] transition text-sm text-gray-600">
                <Camera size={18} /> Take / upload selfie
                <input type="file" accept="image/*" capture="user" onChange={handleSelfie} className="hidden" />
              </label>
            )}
          </div>

          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional) — e.g. client name for the site visit"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-[#f26522]" />

          <motion.button whileTap={{ scale: 0.98 }} onClick={punchIn} disabled={busy}
            className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {locating ? 'Getting location…' : busy ? 'Punching in…' : 'Punch In'}
          </motion.button>
        </div>
      )}

      {punchedIn && !punchedOut && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="End-of-day note (optional)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-[#f26522]" />
          <motion.button whileTap={{ scale: 0.98 }} onClick={punchOut} disabled={busy}
            className="w-full bg-[#10243E] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            {locating ? 'Getting location…' : busy ? 'Punching out…' : 'Punch Out'}
          </motion.button>
        </div>
      )}

      {punchedOut && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-2" size={32} />
          <p className="font-semibold text-[#10243E]">Day complete</p>
          <p className="text-sm text-gray-500 mt-1">{fmtTime(today.check_in_at)} → {fmtTime(today.check_out_at)}</p>
        </div>
      )}

      {/* History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h4 className="font-bold text-[#10243E] mb-4">Last 30 days</h4>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No attendance recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="flex flex-wrap justify-between items-center gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="font-medium text-[#10243E]">{format(new Date(r.work_date), 'EEE, MMM d')}</span>
                <span className="text-gray-500 capitalize">{r.work_mode.replace('-', ' ')}</span>
                <span className="text-gray-600">{fmtTime(r.check_in_at)} → {fmtTime(r.check_out_at)}</span>
                {r.check_in_lat && (
                  <a href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`} target="_blank" rel="noreferrer"
                    className="text-[#f26522] hover:underline flex items-center gap-1 text-xs">
                    <MapPin size={12} /> Map
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
