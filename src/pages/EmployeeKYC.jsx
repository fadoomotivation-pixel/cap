import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, User, Phone, Mail, Calendar, Heart, Shield, CheckCircle, AlertCircle, X, RotateCcw } from 'lucide-react';

const SUPABASE_URL = 'https://rqgkzamuohdvttnkluzn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZ2t6YW11b2hkdnR0bmtsdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTcwNDcsImV4cCI6MjA5NjQ5MzA0N30.d2S9YT7AtTHytz5DN067mqA4CMyxIF2KnL5awwaOoBQ';

const departments = ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Management', 'Telecalling', 'Field Sales', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function EmployeeKYC() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
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
    full_name: '', date_of_birth: '', date_of_joining: '', phone: '',
    email: '', department: '', role_title: '', blood_group: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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
    canvas.width = 800;
    canvas.height = 800;
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
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  // Submit
  const handleSubmit = async () => {
    if (!form.full_name || !form.date_of_birth || !form.phone) {
      setError('Please fill Name, Date of Birth and Phone number.');
      return;
    }
    if (!photoFile) {
      setError('Please capture or upload your photo.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      // 1. Upload photo to Supabase Storage
      const fileName = `${Date.now()}_${form.full_name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/employee-photos/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'image/jpeg',
        },
        body: photoFile,
      });

      if (!uploadRes.ok) throw new Error('Photo upload failed');

      const photo_url = `${SUPABASE_URL}/storage/v1/object/public/employee-photos/${fileName}`;

      // 2. Insert KYC data into Supabase table
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/employee_kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ...form, photo_url }),
      });

      if (!insertRes.ok) throw new Error('Data submission failed');

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1F3F] via-[#10243E] to-[#1a3a5c] flex items-center justify-center p-4 font-outfit">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#10243E] mb-3">Welcome to the Family! 🎉</h2>
          <p className="text-gray-600 mb-2">
            Thank you <strong>{form.full_name}</strong>, your KYC has been submitted successfully.
          </p>
          <p className="text-sm text-gray-400">We'll use your details to celebrate your special days together!</p>
          {photoPreview && (
            <img src={photoPreview} alt="Your photo" className="w-32 h-32 rounded-full object-cover mx-auto mt-6 border-4 border-[#f26522] shadow-lg" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1F3F] via-[#10243E] to-[#1a3a5c] pt-28 pb-16 px-4 font-outfit">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm">
            <Shield size={14} /> Secure & Private
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Employee KYC</h1>
          <p className="text-white/60 text-sm">Capital Brix — Let's celebrate you! 🎂🎊</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-[#f26522] text-white scale-110 shadow-lg shadow-orange-500/30' :
                step > s ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center text-white/50 text-xs mb-6">
          {step === 1 ? 'Personal Details' : step === 2 ? 'Work Details' : 'Your Photo'}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 flex items-center gap-1.5"><User size={14} /> Full Name *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 flex items-center gap-1.5"><Calendar size={14} /> Date of Birth *</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone Number *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email</label>
                <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 flex items-center gap-1.5"><Heart size={14} /> Blood Group</label>
                <select name="blood_group" value={form.blood_group} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition">
                  <option value="" className="bg-[#10243E]">Select</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg} className="bg-[#10243E]">{bg}</option>)}
                </select>
              </div>
              <button onClick={() => { if (!form.full_name || !form.date_of_birth || !form.phone) { setError('Please fill Name, DOB and Phone.'); return; } setError(''); setStep(2); }}
                className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 mt-2">
                Next →
              </button>
            </div>
          )}

          {/* STEP 2: Work Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Date of Joining</label>
                <input type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Department</label>
                <select name="department" value={form.department} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition">
                  <option value="" className="bg-[#10243E]">Select Department</option>
                  {departments.map(d => <option key={d} value={d} className="bg-[#10243E]">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Your Role / Designation</label>
                <input name="role_title" value={form.role_title} onChange={handleChange} placeholder="e.g. Senior Telecaller"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Emergency Contact Name</label>
                <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} placeholder="Parent / Spouse name"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Emergency Contact Phone</label>
                <input name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-[#f26522] transition" />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3.5 rounded-xl hover:bg-white/10 transition">
                  ← Back
                </button>
                <button onClick={() => { setError(''); setStep(3); }}
                  className="flex-1 bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Photo */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Photo Guidelines */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-semibold text-sm mb-2">📸 Photo Guidelines</h3>
                <ul className="text-white/50 text-xs space-y-1">
                  <li>• Face the camera directly with a natural smile</li>
                  <li>• Ensure good lighting (face a window or light source)</li>
                  <li>• Keep a plain / clean background</li>
                  <li>• Shoulders and face clearly visible</li>
                  <li>• No sunglasses or heavy filters</li>
                </ul>
              </div>

              {/* Photo Preview or Camera */}
              {photoPreview ? (
                <div className="relative flex flex-col items-center">
                  <img src={photoPreview} alt="Preview" className="w-48 h-48 rounded-2xl object-cover border-2 border-[#f26522] shadow-lg" />
                  <button onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600">
                    <X size={16} />
                  </button>
                  <p className="text-green-400 text-xs mt-3 flex items-center gap-1"><CheckCircle size={12} /> Photo looks great!</p>
                </div>
              ) : cameraActive ? (
                <div className="relative flex flex-col items-center">
                  <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-[#f26522]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-44 border-2 border-dashed border-white/40 rounded-[50%]" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={flipCamera} className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition">
                      <RotateCcw size={18} />
                    </button>
                    <button onClick={capturePhoto} className="bg-[#f26522] text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/30 flex items-center gap-2">
                      <Camera size={18} /> Capture
                    </button>
                    <button onClick={stopCamera} className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30">
                    <User size={48} strokeWidth={1} />
                    <span className="text-xs mt-2">No photo yet</span>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={startCamera}
                      className="flex-1 bg-[#f26522] hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                      <Camera size={18} /> Take Photo
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2">
                      <Upload size={18} /> Upload
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3 mt-4">
                <button onClick={() => { stopCamera(); setStep(2); }}
                  className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3.5 rounded-xl hover:bg-white/10 transition">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting || !photoFile}
                  className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    submitting || !photoFile ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'
                  }`}>
                  {submitting ? (
                    <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle size={18} /> Submit KYC</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs mt-6">Your data is stored securely and used only for internal HR purposes.</p>
      </div>
    </div>
  );
}
