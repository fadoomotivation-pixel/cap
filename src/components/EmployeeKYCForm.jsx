import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Upload, User, Phone, Mail, Calendar, Heart, CheckCircle, AlertCircle, X, RotateCcw } from 'lucide-react';

const departments = ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Management', 'Telecalling', 'Field Sales', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function EmployeeKYCForm({ session, onComplete }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    full_name: session?.user?.user_metadata?.full_name || '',
    date_of_birth: '', date_of_joining: '', phone: '',
    email: session?.user?.email || '', 
    department: '', role_title: '', blood_group: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera permission or upload a photo instead.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 800, 800);
    canvas.toBlob((blob) => {
      setPhotoFile(blob);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.92));
      stopCamera();
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 300);
    }
  }, [cameraActive, stopCamera, startCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => { setPhotoPreview(null); setPhotoFile(null); };

  // Submit
  const handleSubmit = async () => {
    if (!form.full_name || !form.date_of_birth || !form.phone) {
      setError('Please fill Name, Date of Birth and Phone number.'); return;
    }
    if (!photoFile) { setError('Please capture or upload your photo.'); return; }
    
    setSubmitting(true); setError('');

    try {
      const fileName = `${session.user.id}_${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(fileName, photoFile, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(fileName);

      const photo_url = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from('employee_kyc')
        .insert([{ ...form, photo_url, user_id: session.user.id }]);

      if (insertError) throw insertError;

      onComplete();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? 'bg-[#f26522] text-white scale-110 shadow-lg shadow-orange-500/30' :
              step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s ? '✓' : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Full Name *</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Date of Birth *</label>
            <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Phone Number *</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Blood Group</label>
            <select name="blood_group" value={form.blood_group} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]">
              <option value="">Select</option>
              {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select></div>
          <button onClick={() => { if (!form.full_name || !form.date_of_birth || !form.phone) { setError('Fill required fields'); return; } setError(''); setStep(2); }} className="w-full bg-[#10243E] hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition">Next →</button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Date of Joining</label>
            <input type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Department</label>
            <select name="department" value={form.department} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Your Role / Designation</label>
            <input name="role_title" value={form.role_title} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Emergency Contact Name</label>
            <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Emergency Contact Phone</label>
            <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522]" /></div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition">← Back</button>
            <button onClick={() => { setError(''); setStep(3); }} className="flex-1 bg-[#10243E] hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition">Next →</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-5 text-center">
          {photoPreview ? (
            <div className="relative inline-block mx-auto">
              <img src={photoPreview} alt="Preview" className="w-48 h-48 rounded-2xl object-cover border-4 border-[#f26522] shadow-lg" />
              <button onClick={removePhoto} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X size={16} /></button>
            </div>
          ) : cameraActive ? (
            <div className="relative inline-block mx-auto">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-[#f26522] mx-auto relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-36 h-44 border-2 border-dashed border-white/50 rounded-[50%]" /></div>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={flipCamera} className="bg-gray-100 text-gray-700 p-3 rounded-full shadow"><RotateCcw size={18} /></button>
                <button onClick={capturePhoto} className="bg-[#f26522] text-white px-8 py-3 rounded-full font-bold shadow-lg"><Camera size={18} className="inline mr-2" /> Capture</button>
                <button onClick={stopCamera} className="bg-gray-100 text-gray-700 p-3 rounded-full shadow"><X size={18} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <User size={48} strokeWidth={1} /><span className="text-xs mt-2">No photo</span>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={startCamera} className="flex-1 bg-[#10243E] text-white font-semibold py-3 rounded-xl flex justify-center items-center gap-2"><Camera size={18} /> Camera</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 flex justify-center items-center gap-2"><Upload size={18} /> Upload</button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => { stopCamera(); setStep(2); }} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-200 transition">← Back</button>
            <button onClick={handleSubmit} disabled={submitting || !photoFile} className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${submitting || !photoFile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#f26522] hover:bg-orange-600 text-white'}`}>
              {submitting ? 'Submitting...' : 'Submit Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
