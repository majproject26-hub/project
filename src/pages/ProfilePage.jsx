import React, { useState, useRef } from 'react';
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
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon,
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
  const [photo, setPhoto] = useState(currentUser?.avatar || '');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Photo file processing
  const handlePhotoSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Unsupported File',
        message: 'Please choose an image file (PNG, JPG, JPEG, or WebP).',
        type: 'error',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        message: 'Photo size should be less than 5 MB.',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        // Optimize down to crisp 400x400 max
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhoto(dataUrl);
        toast({
          title: 'Photo Uploaded',
          message: 'Profile photo updated. Click Save to persist.',
          type: 'success',
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

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
      avatar: photo,
      voiceLanguage: 'en-US',
    });
    toast({
      title: 'Profile Updated',
      message: 'Account details and preferences saved.',
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
            Manage your personal identity, theme appearance, and view saved assets.
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

            {/* Profile Photo Upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(true);
              }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(false);
                if (e.dataTransfer.files?.[0]) {
                  handlePhotoSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 rounded-2xl border transition-all ${
                isDraggingPhoto
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-2 ring-teal-500/20'
                  : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              {/* Photo Preview & Quick-Click Container */}
              <div className="relative group shrink-0 self-start sm:self-center">
                {photo ? (
                  <img
                    src={photo}
                    alt={name || 'Profile'}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-500/30 dark:ring-teal-400/30 shadow-md"
                  />
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 ring-2 ring-slate-300 dark:ring-slate-700 shadow-xs">
                    <User className="w-9 h-9" />
                  </div>
                )}

                {/* Hover overlay with camera icon to trigger file picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                  title="Click to choose a photo"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-[10px] font-medium tracking-tight">Change</span>
                </button>
              </div>

              {/* Upload Controls & Information */}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                    Profile Photo
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload a high-resolution photo from your device. Supported: PNG, JPG, JPEG, WebP (max 5 MB).
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handlePhotoSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    {photo ? 'Change Photo' : 'Upload Photo'}
                  </Button>

                  {photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => {
                        setPhoto('');
                        toast({
                          title: 'Photo Cleared',
                          message: 'Profile photo removed. Click "Save Profile Changes" below to apply.',
                          type: 'info',
                        });
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
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
              title="Theme & Interface Preferences"
              subtitle="Customize your workspace appearance and color palette"
              className="p-0 pb-4 border-none"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                Theme Appearance
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Light Mode Tile */}
                <button
                  type="button"
                  onClick={() => {
                    if (isDark) toggleTheme();
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    !isDark
                      ? 'border-[#4D5A2A] bg-white ring-2 ring-[#4D5A2A]/25 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Light Theme</span>
                      {!isDark && (
                        <span className="w-2 h-2 rounded-full bg-[#4D5A2A]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Warm Ivory & Olive brand theme
                    </p>
                  </div>
                </button>

                {/* Dark Mode Tile */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isDark) toggleTheme();
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isDark
                      ? 'border-[#748447] bg-slate-900 ring-2 ring-[#748447]/30 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme</span>
                      {isDark && (
                        <span className="w-2 h-2 rounded-full bg-[#748447]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Deep Olive & Sage contrast theme
                    </p>
                  </div>
                </button>
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
