import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Mic,
  Sun,
  Moon,
  Sparkles,
  Save,
  Check,
  Building2,
  Database,
  FileSpreadsheet,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Tabs } from '../components/common/Tabs';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export function ProfilePage() {
  const { currentUser, currentCompany, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { datasets, savedQueries } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [voiceLang, setVoiceLang] = useState(currentUser?.voiceLanguage || 'en-US');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const myDatasets = datasets.filter(
    (d) => d.uploaderName?.toLowerCase() === currentUser?.name?.toLowerCase()
  );

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      title,
      avatar,
      voiceLanguage: voiceLang,
    });
    toast({
      title: 'Profile Updated',
      message: 'Account details and voice preferences saved.',
      type: 'success',
    });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: 'Validation Error',
        message: 'New password must have at least 6 characters.',
        type: 'error',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        message: 'New passwords do not match.',
        type: 'error',
      });
      return;
    }
    updateProfile({ password: newPassword });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({
      title: 'Password Changed',
      message: 'Your account password has been updated successfully.',
      type: 'success',
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Preferences' },
    { id: 'security', label: 'Security & Password' },
    { id: 'queries', label: 'My Saved Queries', badge: savedQueries.length },
    { id: 'uploads', label: 'My Datasets', badge: myDatasets.length },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profile & Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your personal identity, voice recognition language, and view saved assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentUser?.role || 'STAFF'} size="md">
            {currentUser?.role}
          </Badge>
          <Badge variant="teal" size="md">
            {currentCompany?.id}
          </Badge>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: PROFILE & PREFERENCES */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="p-6 space-y-5">
            <CardHeader
              title="Personal Information"
              subtitle="Your display details visible to colleagues inside your organization"
              className="p-0 pb-4 border-none"
            />

            {/* Avatar Preview & URL */}
            <div className="flex items-center gap-4">
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sky-500/20"
              />
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title / Department
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <CardHeader
              title="Interface & Voice Input Preferences"
              subtitle="Customize theme appearance and speech recognition engine parameters"
              className="p-0 pb-4 border-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voice Language Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-sky-500" />
                  <span>Speech-to-Text Language</span>
                </label>
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="fr-FR">French (Français)</option>
                  <option value="de-DE">German (Deutsch)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="ja-JP">Japanese (日本語)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by Web Speech API in the Ask Your Data interface.
                </p>
              </div>

              {/* Theme Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Theme Appearance
                </label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="capitalize">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  {isDark ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instant real-time palette toggle.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" icon={Save}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <Card className="p-6 space-y-4 max-w-md">
            <CardHeader
              title="Change Account Password"
              subtitle="Ensure your new password contains at least 6 characters"
              className="p-0 pb-4 border-none"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Update Password
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 3: MY SAVED QUERIES */}
      {activeTab === 'queries' && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <CardHeader
            title="My Saved Queries"
            subtitle="Custom analytical inquiries and natural language prompts"
          />
          {savedQueries.length > 0 ? (
            savedQueries.map((sq) => (
              <div key={sq.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {sq.question}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-lg">
                    {sq.sql}
                  </p>
                  <span className="text-[10px] text-slate-400">{sq.datasetName} • {sq.date}</span>
                </div>
                <Badge variant="primary" size="xs">
                  {sq.chartType || 'SQL'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No saved queries yet.
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: MY UPLOADS */}
      {activeTab === 'uploads' && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <CardHeader
            title="Datasets Ingested by You"
            subtitle="Parquet tables uploaded under your user identity"
          />
          {myDatasets.length > 0 ? (
            myDatasets.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                      {d.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {d.rowCount.toLocaleString()} rows • {d.size} • {d.uploadDate}
                    </span>
                  </div>
                </div>
                <Badge variant="teal" size="xs">
                  {d.format}
                </Badge>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              You haven't uploaded any datasets yet.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
