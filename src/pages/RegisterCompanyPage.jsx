import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  HardDrive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function RegisterCompanyPage() {
  const { registerCompany } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [industry, setIndustry] = useState('Enterprise Software & SaaS');
  const [storageTier, setStorageTier] = useState('Enterprise Lakehouse (50 TB)');

  // Initial Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate suggested Company ID when typing Company Name
  const handleCompanyNameChange = (val) => {
    setCompanyName(val);
    if (!companyId || companyId === generateSlug(companyName)) {
      setCompanyId(generateSlug(val));
    }
  };

  const generateSlug = (name) => {
    if (!name) return '';
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = clean.slice(0, 4).padEnd(4, 'X');
    return `${prefix}-001`;
  };

  const companyIdRegex = /^[A-Z0-9]{3,8}-[0-9]{3,4}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formattedCompanyId = companyId.trim().toUpperCase();

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    if (!formattedCompanyId) {
      setError('Please provide a unique Company ID (e.g. APEX-001).');
      return;
    }

    if (!companyIdRegex.test(formattedCompanyId)) {
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

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const result = await registerCompany({
        companyName,
        companyId: formattedCompanyId,
        industry,
        adminName,
        adminEmail,
        adminPassword,
        storageTier,
      });

      setLoading(false);

      if (result && result.success) {
        toast({
          title: 'Company Tenant Provisioned',
          message: `Welcome to ${result.company.name}! Your lakehouse environment is now online.`,
          type: 'success',
        });
        navigate('/dashboard', { replace: true });
      } else {
        setError(result?.error || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#748447]/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#4D5A2A]/15 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center space-y-2">
        <NavLink to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4D5A2A] via-[#748447] to-[#DCE4C2] flex items-center justify-center text-[#F7F4E8] shadow-lg shadow-[#4D5A2A]/25">
            <Database className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Lakehouse Cloud</span>
        </NavLink>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Register New Company Tenant</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Provision an isolated lakehouse workspace with dedicated storage and multi-role RBAC governance.
        </p>

        {/* Switch Mode Pill Tabs */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 text-white shadow-sm flex items-center gap-1.5 border border-sky-500">
            <Building2 className="w-3.5 h-3.5" />
            <span>Register Company (New Tenant)</span>
          </span>
          <NavLink
            to="/register"
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Join Existing Company</span>
          </NavLink>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-950/85 border border-slate-800 py-7 px-6 sm:px-10 shadow-2xl rounded-3xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-start gap-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Company Information */}
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
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Storage Partition Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setStorageTier('Enterprise Lakehouse (50 TB)')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      storageTier.includes('50 TB')
                        ? 'border-teal-500 bg-teal-950/30 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Enterprise (50 TB)</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${storageTier.includes('50 TB') ? 'text-teal-400' : 'opacity-0'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automated Snappy Parquet</p>
                  </div>

                  <div
                    onClick={() => setStorageTier('Hyperscale Lakehouse (100 TB)')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      storageTier.includes('100 TB')
                        ? 'border-teal-500 bg-teal-950/30 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Hyperscale (100 TB)</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${storageTier.includes('100 TB') ? 'text-teal-400' : 'opacity-0'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">High-Frequency Telemetry</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Administrator Credentials */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Initial Organization Administrator (ADMIN)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
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
                  Work Email <span className="text-rose-400">*</span>
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-900/60 text-xs text-teal-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Zero Cross-Tenant Leakage Guaranteed</span>
              </div>
              <p className="text-[11px] text-teal-400/80 leading-relaxed">
                Your company will have 100% cryptographic isolation, dedicated parquet catalog partitions, user approval pipeline, and immutable audit logs.
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="md" icon={ArrowRight} iconPosition="right">
              Register Company & Provision Workspace
            </Button>
          </form>

          {/* Footer links */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              Already have an account?{' '}
              <NavLink to="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
                Sign In
              </NavLink>
            </div>
            <div>
              Joining an existing team?{' '}
              <NavLink to="/register" className="text-teal-400 hover:text-teal-300 font-semibold">
                Join Tenant
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
