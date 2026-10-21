import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  MessageSquareCode,
  Terminal,
  LayoutGrid,
  Users,
  ScrollText,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Building2,
  Lock,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { QuerixLogo } from '../components/common/QuerixLogo';

export function AppLayout() {
  const {
    currentUser,
    currentCompany,
    logout,
    sessionExpired,
    setSessionExpired,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const role = currentUser ? currentUser.role : 'STAFF';

  // Navigation Items by Role
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'Datasets', path: '/datasets', icon: Database, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'Upload Dataset', path: '/upload', icon: UploadCloud, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'Ask Your Data', path: '/ask', icon: MessageSquareCode, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'Predictive AI', path: '/predict', icon: TrendingUp, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'Explainable AI (XAI)', path: '/xai', icon: Sparkles, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'SQL Editor', path: '/sql', icon: Terminal, roles: ['ADMIN', 'HR', 'STAFF'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Audit Log', path: '/audit', icon: ScrollText, roles: ['ADMIN'] },
    { name: 'Company Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];


  const permittedNav = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <QuerixLogo size="md" showText={true} showTagline={true} tagline="Unified Multi-Tenant Analytics" />
          </NavLink>
        </div>

        {/* Center: Always visible Company Badge & User Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Company ID Badge */}
          <div
            title={`Tenant Organization: ${currentCompany?.name}`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px] sm:text-xs">
              {currentUser?.companyId || 'ACME-001'}
            </span>
            <span className="hidden md:inline text-slate-400 text-[10px]">
              • {currentCompany?.name?.split(' ')[0]}
            </span>
          </div>

          {/* User Role Badge */}
          <Badge variant={role} size="md" dot>
            {role}
          </Badge>
        </div>

        {/* Right Action Icons: Theme, Notifications, User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Notifications Menu */}
            {notifDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotifDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-2 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-sky-600 hover:text-sky-500 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.targetLink) {
                              navigate(n.targetLink);
                              setNotifDropdownOpen(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-3 ${
                            n.unread ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-sky-500 opacity-80" />
                          <div className="flex-1 space-y-0.5">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 block pt-0.5">{n.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-2 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Org Code:</span>
                      <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{currentUser?.companyId}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <NavLink
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile & Account</span>
                    </NavLink>

                    <NavLink
                      to="/help"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>Help Center & FAQ</span>
                    </NavLink>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Body: Collapsible Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm transition-all duration-300 select-none ${
            sidebarCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Navigation Links */}
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {permittedNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#4D5A2A] to-[#748447] text-[#F7F4E8] shadow-md shadow-[#4D5A2A]/25 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-[#DCE4C2]/30 dark:hover:bg-[#2D3323]/80 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Collapse Toggle */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '▶' : '◀ Collapse'}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <QuerixLogo size="sm" showText={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1 flex-1 overflow-y-auto">
                {permittedNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-colors ${
                          isActive
                            ? 'bg-[#4D5A2A] text-[#F7F4E8] font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-[#DCE4C2]/30 dark:hover:bg-[#2D3323]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="danger" size="sm" className="w-full" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Session Expired Modal */}
      <Modal
        isOpen={sessionExpired}
        onClose={() => {}}
        title="Session Security Alert"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            Session Timed Out
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your authenticated session has expired to preserve multi-tenant lakehouse data privacy. Please sign in again.
          </p>
          <div className="pt-2">
            <Button
              className="w-full"
              size="sm"
              onClick={() => {
                setSessionExpired(false);
                navigate('/login');
              }}
            >
              Sign In Again
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
