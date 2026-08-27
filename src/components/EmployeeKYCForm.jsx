import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Upload, User, Phone, Mail, Calendar, Heart, CheckCircle, AlertCircle, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const slideVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="max-w-xl mx-auto overflow-hidden">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div 
              animate={{ scale: step === s ? 1.1 : 1 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step === s ? 'bg-[#f26522] text-white shadow-lg shadow-orange-500/30' :
              step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s ? '✓' : s}
            </motion.div>
            {s < 3 && <div className={`w-12 h-0.5 transition-colors ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>
      
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Date of Birth *</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Phone Number *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Blood Group</label>
              <select name="blood_group" value={form.blood_group} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base">
                <option value="">Select</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select></div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (!form.full_name || !form.date_of_birth || !form.phone) { setError('Fill required fields'); return; } setError(''); setStep(2); }} className="w-full bg-[#10243E] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition shadow-lg mt-4 text-lg">Next →</motion.button>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Date of Joining</label>
              <input type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Your Role / Designation</label>
              <input name="role_title" value={form.role_title} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Emergency Contact Name</label>
              <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div><label className="text-gray-700 text-sm font-medium mb-1.5 block">Emergency Contact Phone</label>
              <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-base" /></div>
            <div className="flex gap-3 mt-4 pt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-200 transition text-lg">← Back</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setError(''); setStep(3); }} className="flex-1 bg-[#10243E] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg">Next →</motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 text-center">
            
            <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100">
              <p className="text-[#10243E] font-medium text-sm">
                📸 <span className="font-bold text-[#f26522]">Upload your best professional picture!</span><br/>
                This photo will be used for your ID card, birthday wishes, and celebrating your achievements.
              </p>
            </div>

            {photoPreview ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative inline-block mx-auto">
                <img src={photoPreview} alt="Preview" className="w-56 h-56 rounded-3xl object-cover border-4 border-[#f26522] shadow-2xl" />
                <button onClick={removePhoto} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg"><X size={18} /></button>
              </motion.div>
            ) : cameraActive ? (
              <div className="relative inline-block mx-auto">
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-4 border-[#f26522] shadow-2xl mx-auto relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-40 h-48 sm:w-48 sm:h-56 border-2 border-dashed border-white/50 rounded-[50%]" /></div>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <button onClick={flipCamera} className="bg-gray-100 text-gray-700 p-4 rounded-full shadow-md"><RotateCcw size={20} /></button>
                  <button onClick={capturePhoto} className="bg-[#f26522] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-500/40 text-lg flex items-center"><Camera size={20} className="mr-2" /> Capture</button>
                  <button onClick={stopCamera} className="bg-gray-100 text-gray-700 p-4 rounded-full shadow-md"><X size={20} /></button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-56 h-56 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <User size={56} strokeWidth={1} /><span className="text-sm mt-3 font-medium">No photo selected</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={startCamera} className="flex-1 bg-[#10243E] text-white font-semibold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg text-lg"><Camera size={20} /> Open Camera</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white text-gray-700 font-semibold py-4 rounded-xl border-2 border-gray-200 flex justify-center items-center gap-2 shadow-sm text-lg"><Upload size={20} /> Upload Photo</motion.button>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { stopCamera(); setStep(2); }} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-200 transition text-lg">← Back</motion.button>
              <motion.button 
                whileTap={{ scale: 0.97 }} 
                onClick={handleSubmit} 
                disabled={submitting || !photoFile} 
                className={`flex-[2] font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg ${submitting || !photoFile ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#f26522] hover:bg-orange-600 text-white shadow-orange-500/30'}`}
              >
                {submitting ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : 'Submit Profile'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
