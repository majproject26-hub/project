import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Database, Building2, User, Mail, Lock, Shield, CheckCircle2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export function RegisterPage() {
  const { register, companies } = useAuth();
  const navigate = useNavigate();

  const [companyId, setCompanyId] = useState('ACME-001');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState('STAFF');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedUser, setSubmittedUser] = useState(null);

  // Validate company ID format (e.g. ACME-001, NOVA-002)
  const companyIdRegex = /^[A-Z0-9]{3,8}-[0-9]{3,4}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyId.trim()) {
      setError('Please provide a Company ID.');
      return;
    }

    if (!companyIdRegex.test(companyId.toUpperCase())) {
      setError('Company ID must match format [ORG]-[NUM] (e.g., ACME-001 or NOVA-002).');
      return;
    }

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    const result = await register({
      companyId: companyId.toUpperCase(),
      name,
      email,
      password,
      requestedRole,
    });

    if (result && result.success) {
      setSubmittedUser(result.user);
      setSubmitted(true);
    } else {
      setError(result?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#748447]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <NavLink to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4D5A2A] via-[#748447] to-[#DCE4C2] flex items-center justify-center text-[#F7F4E8] shadow-lg shadow-[#4D5A2A]/25">
            <Database className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Lakehouse Cloud</span>
        </NavLink>
        <h2 className="text-2xl font-bold text-white">Join Your Organization Lakehouse</h2>
        <p className="text-xs text-slate-400">
          Request user credentials for your company's data workspace.
        </p>

        {/* Switch Mode Pill Tabs */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <NavLink
            to="/register-company"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Register New Company</span>
          </NavLink>
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 text-white shadow-sm flex items-center gap-1.5 border border-sky-500">
            <User className="w-3.5 h-3.5" />
            <span>Join Existing Company</span>
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950/80 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl">
          {submitted ? (
            /* Confirmation Screen */
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase font-bold text-teal-400 tracking-wider">
                  Registration Received
                </span>
                <h3 className="text-xl font-bold text-white">Awaiting Admin Approval</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Your request to join <span className="text-white font-semibold">{companyId}</span> as <span className="text-teal-300 font-semibold">{requestedRole}</span> has been routed to your company's lakehouse administrators.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-medium text-white">{submittedUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-300">{submittedUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Tenant:</span>
                  <span className="font-mono text-teal-400 font-bold">{companyId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-amber-400 font-semibold">Pending Admin Review</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Tip: If you log in with an Admin demo account, you will see this pending user in the User Management tab ready for approval!
              </p>

              <div className="pt-2">
                <Button
                  className="w-full"
                  size="md"
                  onClick={() => navigate('/login')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Company ID */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
                    placeholder="e.g. ACME-001 or NOVA-002"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex gap-2 mt-1.5 text-[10px] text-slate-400">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setCompanyId('ACME-001')}
                    className="text-sky-400 hover:underline"
                  >
                    ACME-001
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setCompanyId('NOVA-002')}
                    className="text-sky-400 hover:underline"
                  >
                    NOVA-002
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Corporate Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.smith@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Requested Role */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Requested Role <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestedRole('STAFF')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      requestedRole === 'STAFF'
                        ? 'border-sky-500 bg-sky-950/60 text-white shadow-xs'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">STAFF</div>
                    <div className="text-[10px] text-slate-400">Read-only datasets & ask questions</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestedRole('HR')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      requestedRole === 'HR'
                        ? 'border-emerald-500 bg-emerald-950/60 text-white shadow-xs'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">HR</div>
                    <div className="text-[10px] text-slate-400">Upload & manage workforce data</div>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" size="md">
                  Submit Registration
                </Button>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-center text-xs text-slate-400">
                <p>
                  Need to provision a new company?{' '}
                  <NavLink to="/register-company" className="text-teal-400 hover:text-teal-300 font-semibold">
                    Register Company Tenant
                  </NavLink>
                </p>
                <p>
                  Already registered?{' '}
                  <NavLink to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                    Sign in here
                  </NavLink>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
