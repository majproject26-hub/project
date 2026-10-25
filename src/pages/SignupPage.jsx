import React, { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database,
  Building2,
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { QuerixLogo } from '../components/common/QuerixLogo';

export function SignupPage({ defaultMode = 'company' }) {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || defaultMode;

  const [mode, setMode] = useState(initialMode); // 'company' | 'user'
  const { registerCompany, register, companies } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mode 1: Register New Company State
  const [companyName, setCompanyName] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [industry, setIndustry] = useState('Enterprise Software & SaaS');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // Mode 2: Join Existing Company State
  const [joinCompanyId, setJoinCompanyId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [confirmUserPassword, setConfirmUserPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState('STAFF');
  const [submittedUserRequest, setSubmittedUserRequest] = useState(false);

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const companyIdRegex = /^[A-Z0-9]{3,8}-[0-9]{3,4}$/;

  const handleCompanyNameChange = (val) => {
    setCompanyName(val);
    if (!newCompanyId || newCompanyId === generateSlug(companyName)) {
      setNewCompanyId(generateSlug(val));
    }
  };

  const generateSlug = (name) => {
    if (!name) return '';
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = clean.slice(0, 4).padEnd(4, 'X');
    return `${prefix}-001`;
  };

  // Handle Register New Company Submit
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formattedId = newCompanyId.trim().toUpperCase();

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    if (!formattedId) {
      setError('Please provide a unique Company Tenant ID.');
      return;
    }

    if (!companyIdRegex.test(formattedId)) {
      setError('Company ID must match format [CODE]-[NUM] (e.g., APEX-001, ACME-001).');
      return;
    }

    if (!adminName.trim()) {
      setError('Administrator full name is required.');
      return;
    }

    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (adminPassword !== confirmAdminPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const result = await registerCompany({
        companyName,
        companyId: formattedId,
        industry,
        adminName,
        adminEmail,
        adminPassword,
      });

      setLoading(false);

      if (result.success) {
        toast({
          title: 'Organization Workspace Provisioned',
          message: `Welcome to ${result.company.name}! You are now signed in as Administrator.`,
          type: 'success',
        });
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to register company workspace.');
    }
  };

  // Handle Join Existing Company Submit
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formattedId = joinCompanyId.trim().toUpperCase();

    if (!formattedId) {
      setError('Please specify the Company ID you wish to join.');
      return;
    }

    if (!userName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }

    if (userPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (userPassword !== confirmUserPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        companyId: formattedId,
        name: userName,
        email: userEmail,
        password: userPassword,
        requestedRole,
      });

      setLoading(false);

      if (result.success) {
        setSubmittedUserRequest(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to submit registration request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#748447]/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#4D5A2A]/15 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center space-y-2">
        <NavLink to="/" className="inline-flex items-center justify-center mb-2 group">
          <QuerixLogo size="lg" showText={true} showTagline={true} variant="dark" />
        </NavLink>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Sign Up for QUERIX</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Create a new company workspace or request access to join an existing organization.
        </p>

        {/* Unified Mode Toggle Tabs */}
        <div className="pt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('company');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
              mode === 'company'
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Register New Company</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('user');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
              mode === 'user'
                ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Join Existing Company</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-950/85 border border-slate-800 py-7 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-start gap-3 text-xs text-rose-200 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: REGISTER NEW COMPANY */}
          {mode === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-5">
              <div className="space-y-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Organization & Tenant Details
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="e.g. Apex Global Technologies"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company Tenant ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCompanyId}
                      onChange={(e) => setNewCompanyId(e.target.value.toUpperCase())}
                      placeholder="e.g. APEX-001"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-teal-300 uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Format: CODE-NUM</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Industry Sector
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Enterprise Software & SaaS">Enterprise Software & SaaS</option>
                      <option value="Aerospace & Defense">Aerospace & Defense</option>
                      <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                      <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                      <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin credentials */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Administrator Account (ADMIN)
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Administrator Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Corporate Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="alex@apex.io"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="At least 6 chars"
                        className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="md" icon={ArrowRight} iconPosition="right">
                Register Company & Open Dashboard
              </Button>
            </form>
          )}

          {/* TAB 2: JOIN EXISTING COMPANY */}
          {mode === 'user' && (
            <div>
              {submittedUserRequest ? (
                <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Registration Request Sent!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Your request to join <span className="text-white font-semibold">{joinCompanyId}</span> has been submitted to your company's lakehouse administrators for review.
                    </p>
                  </div>
                  <NavLink to="/login">
                    <Button variant="outline" size="sm" className="mt-2">
                      Return to Sign In
                    </Button>
                  </NavLink>
                </div>
              ) : (
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company ID to Join <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={joinCompanyId}
                        onChange={(e) => setJoinCompanyId(e.target.value.toUpperCase())}
                        placeholder="e.g. ACME-001 or NOVA-002"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-teal-300 uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Robert Taylor"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Corporate Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="robert.taylor@acme.io"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Confirm Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmUserPassword}
                          onChange={(e) => setConfirmUserPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Requested Role
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="STAFF">STAFF (Read-only queries, speech input)</option>
                      <option value="HR">HR (Upload datasets, SQL, analytics)</option>
                    </select>
                  </div>

                  <Button type="submit" loading={loading} className="w-full mt-2" size="md">
                    Submit Access Request
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Footer Link */}
          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <NavLink to="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
              Sign In
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
