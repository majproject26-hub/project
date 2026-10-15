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
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export function LoginPage() {
  const { login, resetPasswordByEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multi-Step Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: identify, 2: verify OTP, 3: set password, 4: complete
  const [forgotCompanyId, setForgotCompanyId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailSent, setEmailSent] = useState(null);
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
    setEmailSent(null);
    setOtpInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
    setForgotSuccess('');
    setResendTimer(0);
    setIsForgotModalOpen(true);
  };

  const handleRequestOtp = async (e) => {
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

    setForgotLoading(true);
    try {
      const res = await api.requestOtp(formattedId, cleanEmail);
      setForgotLoading(false);
      setOtpInput('');
      setResendTimer(60);
      setEmailSent(res.email_sent);
      setForgotStep(2);
      toast({
        title: 'Verification Code Dispatched',
        message: res.message || `A 6-digit OTP code has been sent to ${forgotEmail}.`,
        type: 'info',
      });
    } catch (err) {
      setForgotLoading(false);
      setForgotError(err.message || `No registered account found matching '${forgotEmail}' in organization '${formattedId}'.`);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');

    const inputClean = otpInput.trim();
    if (!inputClean || inputClean.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }

    const formattedId = forgotCompanyId.trim().toUpperCase();
    const cleanEmail = forgotEmail.trim().toLowerCase();

    setForgotLoading(true);
    try {
      const res = await api.verifyOtp(formattedId, cleanEmail, inputClean);
      setForgotLoading(false);
      toast({
        title: 'Identity Verified',
        message: res.message || 'OTP validated successfully! Please set your new password.',
        type: 'success',
      });
      setForgotStep(3);
    } catch (err) {
      setForgotLoading(false);
      setForgotError(err.message || 'Incorrect verification code. Please check the code or request a new one.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotError('');
    const formattedId = forgotCompanyId.trim().toUpperCase();
    const cleanEmail = forgotEmail.trim().toLowerCase();

    try {
      const res = await api.requestOtp(formattedId, cleanEmail);
      setResendTimer(60);
      setEmailSent(res.email_sent);
      toast({
        title: 'New Code Sent',
        message: res.message || `A fresh 6-digit OTP has been sent to ${forgotEmail}.`,
        type: 'info',
      });
    } catch (err) {
      setForgotError(err.message || 'Failed to resend OTP.');
    }
  };

  const handleSetNewPassword = async (e) => {
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
    try {
      const res = await resetPasswordByEmail(forgotCompanyId, forgotEmail, newPassword, otpInput.trim());
      setForgotLoading(false);
      if (res && res.success) {
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
        setForgotError(res?.error || 'Failed to update password.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotError(err.message || 'Failed to update password.');
    }
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
            {/* Real Security Email Dispatch Notice */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-400" />
                  <span>Security Code Dispatched</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {forgotEmail}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                A 6-digit one-time password has been sent to your email address. Please check your inbox and spam folder.
              </p>
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
