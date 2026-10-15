import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Database,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Shield,
  User,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export function LoginPage() {
  const { login, quickLogin, users, resetPasswordByEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [companyId, setCompanyId] = useState('ACME-001');
  const [email, setEmail] = useState('sarah.admin@acme.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multi-Step Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: identify, 2: verify OTP, 3: set password, 4: complete
  const [forgotCompanyId, setForgotCompanyId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOpenForgotModal = () => {
    setForgotCompanyId(companyId);
    setForgotEmail(email);
    setForgotStep(1);
    setOtpCode('');
    setOtpInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
    setForgotSuccess('');
    setResendTimer(0);
    setIsForgotModalOpen(true);
  };

  const handleRequestOtp = (e) => {
    e.preventDefault();
    setForgotError('');

    const formattedId = forgotCompanyId.trim().toUpperCase();
    const cleanEmail = forgotEmail.trim().toLowerCase();

    if (!formattedId) {
      setForgotError('Please enter your Company Tenant ID.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('Please enter a valid registered corporate email address.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.companyId === formattedId && u.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      setForgotError(`No registered account found matching '${forgotEmail}' in organization '${formattedId}'.`);
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(code);
      setOtpInput('');
      setResendTimer(60);
      setForgotStep(2);
      setForgotLoading(false);
      toast({
        title: 'Verification Code Dispatched',
        message: `A 6-digit OTP code has been sent to ${forgotEmail}.`,
        type: 'info',
      });
    }, 350);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setForgotError('');

    const inputClean = otpInput.trim();
    if (!inputClean || inputClean.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      if (inputClean === otpCode) {
        toast({
          title: 'Identity Verified',
          message: 'OTP validated successfully! Please set your new password.',
          type: 'success',
        });
        setForgotStep(3);
      } else {
        setForgotError('Incorrect verification code. Please check the code or request a new one.');
      }
    }, 300);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setForgotError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setResendTimer(60);
    toast({
      title: 'New Code Sent',
      message: `A fresh 6-digit OTP has been sent to ${forgotEmail}.`,
      type: 'info',
    });
  };

  const handleSetNewPassword = (e) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please verify.');
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      const res = resetPasswordByEmail(forgotCompanyId, forgotEmail, newPassword);
      setForgotLoading(false);
      if (res.success) {
        setForgotSuccess(res.message);
        setCompanyId(forgotCompanyId.trim().toUpperCase());
        setEmail(forgotEmail.trim());
        setPassword(newPassword);
        setError(null);
        setForgotStep(4);
        toast({
          title: 'Password Updated',
          message: 'Your password was successfully reset. You can now sign in.',
          type: 'success',
        });
      } else {
        setForgotError(res.error);
      }
    }, 350);
  };

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(companyId.trim().toUpperCase(), email.trim(), password);
      setLoading(false);
      if (res && res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res || { success: false, error: 'Login failed' });
      }
    } catch (err) {
      setLoading(false);
      setError({ success: false, error: err.message || 'Login failed' });
    }
  };

  const fillCredentials = (comp, mail, pass = 'password123') => {
    setCompanyId(comp);
    setEmail(mail);
    setPassword(pass);
    setError(null);
  };

  const handleQuickSignIn = async (userId) => {
    const res = await quickLogin(userId);
    if (res && res.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#748447]/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <NavLink to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4D5A2A] via-[#748447] to-[#DCE4C2] flex items-center justify-center text-[#F7F4E8] shadow-lg shadow-[#4D5A2A]/25">
            <Database className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Lakehouse Cloud</span>
        </NavLink>
        <h2 className="text-2xl font-bold text-white">Sign In to Your Workspace</h2>
        <p className="text-xs text-slate-400">
          Enter your Company ID and credentials to access your tenant lakehouse.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 space-y-6">
        {/* Form Card */}
        <div className="bg-slate-950/85 border border-slate-800 py-7 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl">
          {error && (
            <div className={`p-4 rounded-2xl border mb-5 flex items-start gap-3 text-xs leading-relaxed ${
              error.status === 'PENDING'
                ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                : error.status === 'REJECTED'
                ? 'bg-rose-950/80 border-rose-800 text-rose-200'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="block font-semibold mb-0.5">
                  {error.status === 'PENDING' ? 'Account Pending Approval' : error.status === 'REJECTED' ? 'Access Request Denied' : 'Authentication Failed'}
                </strong>
                <span>{error.error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Company ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company ID
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
                  placeholder="e.g. ACME-001 or NOVA-002"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.io"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-medium hover:underline transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Default demo: <code className="text-slate-400">password123</code></span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="md">
                Sign In to Lakehouse
              </Button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <p>
              Don't have an account or need a new organization?{' '}
              <NavLink to="/signup" className="text-teal-400 hover:text-teal-300 font-semibold">
                Sign Up
              </NavLink>
            </p>
          </div>
        </div>

        {/* 1-Click Demo Accounts Quick-Fill Box */}
        <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1-Click Demo Logins (ACME-001 & NOVA-002)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Instant Role Switch</span>
          </div>

          {/* ACME-001 Quick-Fill Buttons */}
          <div>
            <div className="text-[11px] font-mono text-teal-400 font-semibold mb-2 flex items-center gap-1.5">
              <span>ACME-001</span>
              <span className="text-slate-500">• Acme Technologies Inc.</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  fillCredentials('ACME-001', 'sarah.admin@acme.io');
                  handleQuickSignIn('u-acme-1');
                }}
                className="p-2.5 rounded-xl border border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="ADMIN" size="xs">ADMIN</Badge>
                  <ArrowRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">Sarah Jenkins</p>
                <p className="text-[10px] text-slate-400 truncate">VP Lakehouse Arch</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  fillCredentials('ACME-001', 'david.hr@acme.io');
                  handleQuickSignIn('u-acme-2');
                }}
                className="p-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="HR" size="xs">HR</Badge>
                  <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">David Chen</p>
                <p className="text-[10px] text-slate-400 truncate">HR Operations Lead</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  fillCredentials('ACME-001', 'maya.staff@acme.io');
                  handleQuickSignIn('u-acme-3');
                }}
                className="p-2.5 rounded-xl border border-sky-900/60 bg-sky-950/30 hover:bg-sky-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="STAFF" size="xs">STAFF</Badge>
                  <ArrowRight className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">Maya Patel</p>
                <p className="text-[10px] text-slate-400 truncate">Revenue Analyst</p>
              </button>
            </div>
          </div>

          {/* NOVA-002 Quick-Fill Buttons */}
          <div>
            <div className="text-[11px] font-mono text-teal-400 font-semibold mb-2 flex items-center gap-1.5">
              <span>NOVA-002</span>
              <span className="text-slate-500">• Nova Dynamics Global</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  fillCredentials('NOVA-002', 'alex.admin@nova.space');
                  handleQuickSignIn('u-nova-1');
                }}
                className="p-2.5 rounded-xl border border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="ADMIN" size="xs">ADMIN</Badge>
                  <ArrowRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">Dr. Alex Vance</p>
                <p className="text-[10px] text-slate-400 truncate">Chief Architect</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  fillCredentials('NOVA-002', 'elena.hr@nova.space');
                  handleQuickSignIn('u-nova-2');
                }}
                className="p-2.5 rounded-xl border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="HR" size="xs">HR</Badge>
                  <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">Elena Rostova</p>
                <p className="text-[10px] text-slate-400 truncate">Talent Director</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  fillCredentials('NOVA-002', 'liam.staff@nova.space');
                  handleQuickSignIn('u-nova-3');
                }}
                className="p-2.5 rounded-xl border border-sky-900/60 bg-sky-950/30 hover:bg-sky-900/50 text-left transition-all group"
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant="STAFF" size="xs">STAFF</Badge>
                  <ArrowRight className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs font-medium text-white truncate">Liam O'Connor</p>
                <p className="text-[10px] text-slate-400 truncate">Telemetry Eng</p>
              </button>
            </div>
          </div>

          {/* Test Error States Simulation buttons */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Test Account Error States:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  fillCredentials('ACME-001', 'robert.taylor@acme.io');
                  const res = login('ACME-001', 'robert.taylor@acme.io', 'password123');
                  setError(res);
                }}
                className="px-2 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900/80 transition-colors"
              >
                Test Pending Status
              </button>
              <button
                type="button"
                onClick={() => {
                  fillCredentials('ACME-001', 'kevin.rejected@external.com');
                  const res = login('ACME-001', 'kevin.rejected@external.com', 'password123');
                  setError(res);
                }}
                className="px-2 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900/80 transition-colors"
              >
                Test Rejected Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Multi-Step Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title={
          forgotStep === 1
            ? 'Account Verification'
            : forgotStep === 2
            ? 'Enter Security OTP'
            : forgotStep === 3
            ? 'Set New Password'
            : 'Password Reset Complete'
        }
        subtitle={
          forgotStep === 1
            ? 'Enter your Company ID and email address to receive a one-time verification code.'
            : forgotStep === 2
            ? `Enter the 6-digit code sent to ${forgotEmail} to verify your identity.`
            : forgotStep === 3
            ? 'Establish a new secure password for your organization lakehouse account.'
            : 'Your credentials have been updated and are ready for sign in.'
        }
        maxWidth="max-w-md"
      >
        {forgotError && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 flex items-start gap-2.5 text-xs text-rose-200 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{forgotError}</span>
          </div>
        )}

        {/* STEP 1: Identify Account & Request OTP */}
        {forgotStep === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Tenant ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={forgotCompanyId}
                  onChange={(e) => setForgotCompanyId(e.target.value.toUpperCase())}
                  placeholder="e.g. ACME-001 or NOVA-002"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Registered Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. sarah.admin@acme.io"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
              <span className="block font-medium text-slate-300 mb-0.5">Quick Demo Accounts:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotCompanyId('ACME-001');
                    setForgotEmail('sarah.admin@acme.io');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:bg-slate-700 text-[10px] font-mono"
                >
                  ACME-001 (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotCompanyId('ACME-001');
                    setForgotEmail('david.hr@acme.io');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:bg-slate-700 text-[10px] font-mono"
                >
                  ACME-001 (HR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotCompanyId('ACME-001');
                    setForgotEmail('alex.staff@acme.io');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:bg-slate-700 text-[10px] font-mono"
                >
                  ACME-001 (Staff)
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 border-slate-700 text-slate-300 hover:bg-slate-800"
                size="md"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={forgotLoading}
                className="w-1/2"
                size="md"
              >
                Send OTP Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {forgotStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Demo Simulation Alert with OTP code */}
            <div className="p-3.5 rounded-xl bg-sky-950/70 border border-sky-800/80 text-xs text-sky-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>OTP Sent to {forgotEmail}</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-900 border border-sky-700 text-sky-300">
                  Demo Simulation
                </span>
              </div>
              <p className="text-[11px] text-sky-300/80">
                For quick testing without email delay, your 6-digit verification code is:
              </p>
              <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-lg border border-sky-900/60 font-mono">
                <span className="text-base font-bold tracking-widest text-teal-300">{otpCode}</span>
                <button
                  type="button"
                  onClick={() => setOtpInput(otpCode)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
                >
                  Auto-fill code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter 6-Digit OTP Code <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono tracking-[0.35em] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotStep(1);
                  setForgotError('');
                }}
                className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0}
                className={`inline-flex items-center gap-1 font-medium ${
                  resendTimer > 0
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-teal-400 hover:text-teal-300 hover:underline'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'text-teal-400'}`} />
                <span>{resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}</span>
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 border-slate-700 text-slate-300 hover:bg-slate-800"
                size="md"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={forgotLoading}
                className="w-1/2"
                size="md"
                disabled={otpInput.length !== 6}
              >
                Verify & Next Step
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password Session */}
        {forgotStep === 3 && (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-800/80 text-xs text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Identity verified for <strong>{forgotEmail}</strong>. Create your new password below.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span>Demo default: <strong className="text-slate-300 font-mono">password123</strong></span>
              <button
                type="button"
                onClick={() => {
                  setNewPassword('password123');
                  setConfirmNewPassword('password123');
                }}
                className="text-teal-400 hover:text-teal-300 font-semibold underline ml-2"
              >
                Use default
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 border-slate-700 text-slate-300 hover:bg-slate-800"
                size="md"
                onClick={() => setForgotStep(2)}
              >
                Back to OTP
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={forgotLoading}
                className="w-1/2"
                size="md"
              >
                Set New Password
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Completed Confirmation */}
        {forgotStep === 4 && (
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-white">Password Reset Successful!</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your password has been securely updated for <span className="text-slate-200 font-medium">{forgotEmail}</span>.
              </p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
              New Password: <span className="text-teal-300 font-bold">{newPassword}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              The sign-in form is ready with your updated credentials.
            </p>
            <Button
              variant="primary"
              className="w-full"
              size="md"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Proceed to Sign In
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
