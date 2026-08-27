import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, Phone, CheckCircle, AlertCircle, LogOut, FileText, Upload, Calendar, Building, Briefcase, Camera, X } from 'lucide-react';
import EmployeeKYCForm from '../components/EmployeeKYCForm';

export default function EmployeePortal() {
  const [session, setSession] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false); // NEW STATE

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkIfAdmin(session?.user?.email);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkIfAdmin(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfAdmin = (email) => {
    if (email === 'admin@capitalbrix.co.in' || email === 'ujjwal@capitalbrix.co.in') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setSignupSuccess(true); // SHOW POPUP
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A1F3F] flex items-center justify-center text-white font-outfit">Loading...</div>;
  }

  // --- NOT LOGGED IN ---
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1F3F] via-[#10243E] to-[#1a3a5c] flex items-center justify-center p-4 font-outfit pt-20">
        
        {signupSuccess ? (
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center transform transition-all scale-100 animate-fade-in">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-[#f26522] w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#10243E] mb-3">Check Your Email!</h2>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              We've sent a confirmation link to <br/>
              <strong className="text-[#10243E]">{email}</strong>.<br/><br/>
              Please click the link in your email to verify your account and complete your KYC.
            </p>
            <button 
              onClick={() => { setSignupSuccess(false); setIsLogin(true); setEmail(''); setPassword(''); }} 
              className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Employee Portal</h1>
              <p className="text-white/70 text-sm">Capital Brix Internal System</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" /> <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-sm" placeholder="John Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-sm" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] transition text-sm" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/30 mt-6 active:scale-95"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login Securely' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center text-white/60 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[#f26522] font-semibold hover:text-orange-400 transition ml-1">
                {isLogin ? "Sign up" : "Login instead"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- LOGGED IN: ADMIN VIEW ---
  if (isAdmin) {
    return <AdminDashboard session={session} onLogout={handleLogout} />;
  }

  // --- LOGGED IN: EMPLOYEE VIEW ---
  return <EmployeeDashboard session={session} onLogout={handleLogout} />;
}

// --- SUB-COMPONENTS ---

function EmployeeDashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('kyc');
  const [kycStatus, setKycStatus] = useState('pending'); // pending, completed

  useEffect(() => {
    // Check if KYC is already submitted
    const checkKyc = async () => {
      const { data } = await supabase
        .from('employee_kyc')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (data) setKycStatus('completed');
    };
    checkKyc();
  }, [session]);

  const userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[#F0F5FA] font-outfit pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#10243E]">Welcome, {userName}! 👋</h1>
            <p className="text-gray-500 text-sm">Capital Brix Employee Portal</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition">
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('kyc')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'kyc' ? 'bg-[#10243E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <User size={18} /> My Profile & KYC
            </button>
            <button onClick={() => setActiveTab('features')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'features' ? 'bg-[#10243E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Building size={18} /> Workspace Apps
            </button>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeTab === 'kyc' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                {kycStatus === 'completed' ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#10243E] mb-2">KYC Completed!</h2>
                    <p className="text-gray-500">Your profile is up to date. You will be notified when your account is verified by Admin.</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-[#10243E] mb-6 border-b pb-4">Complete Your Profile (KYC)</h2>
                    <EmployeeKYCForm session={session} onComplete={() => setKycStatus('completed')} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <FeatureCard 
                  icon={<FileText />} title="Lead & Sales Tracker" 
                  desc="Track your daily calls, follow-ups, and conversion targets." 
                />
                <FeatureCard 
                  icon={<Briefcase />} title="Commission Wallet" 
                  desc="Real-time tracking of your earned commissions." 
                />
                <FeatureCard 
                  icon={<Building />} title="Site Visit Manager" 
                  desc="Book and manage client site visits to Dholera." 
                />
                <FeatureCard 
                  icon={<Calendar />} title="Leave & Attendance" 
                  desc="Quick punch-in and leave management." 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
      <div className="absolute top-4 right-4 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
        Coming Soon
      </div>
      <div className="w-12 h-12 bg-[#F0F5FA] text-[#10243E] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-[#10243E] mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}

function AdminDashboard({ session, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase.from('employee_kyc').select('*').order('created_at', { ascending: false });
      if (data) setEmployees(data);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F5FA] font-outfit pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center bg-[#10243E] text-white p-6 rounded-2xl shadow-lg mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Super Admin</span>
            </div>
            <h1 className="text-2xl font-bold">Admin Command Center</h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#10243E]">Employee Directory (KYC Data)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Role & Dept</th>
                  <th className="p-4 font-medium">Join Date</th>
                  <th className="p-4 font-medium">Emergency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading records...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">No employee records found.</td></tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={20} /></div>
                          )}
                          <div>
                            <p className="font-semibold text-[#10243E]">{emp.full_name}</p>
                            <p className="text-xs text-gray-500">DOB: {emp.date_of_birth}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">{emp.phone}</p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-[#f26522]">{emp.role_title || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{emp.department}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{emp.date_of_joining || 'N/A'}</td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">{emp.emergency_contact_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{emp.emergency_contact_phone}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
