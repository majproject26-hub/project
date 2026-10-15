import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS, INITIAL_COMPANIES } from '../data/mockData';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('lakehouse_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('lakehouse_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('lakehouse_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_USERS[0];
      }
    }
    // Default logged in user is Acme Admin (Sarah Jenkins)
    return INITIAL_USERS[0];
  });

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    localStorage.setItem('lakehouse_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('lakehouse_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('lakehouse_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('lakehouse_current_user');
    }
  }, [currentUser]);

  // Initial sync with backend auth registry
  useEffect(() => {
    let isMounted = true;
    async function syncAuthRegistry() {
      try {
        const [compRes, userRes] = await Promise.allSettled([
          api.getCompanies(),
          api.getUsers(),
        ]);
        if (!isMounted) return;
        if (compRes.status === 'fulfilled' && compRes.value?.companies) {
          setCompanies((prev) => ({ ...prev, ...compRes.value.companies }));
        }
        if (userRes.status === 'fulfilled' && userRes.value?.users) {
          setUsers((prev) => {
            const apiUsers = userRes.value.users;
            const existingIds = new Set(apiUsers.map((u) => u.id));
            const remaining = prev.filter((u) => !existingIds.has(u.id));
            return [...apiUsers, ...remaining];
          });
        }
      } catch (err) {
        console.warn('Auth registry initial sync fallback:', err);
      }
    }
    syncAuthRegistry();
    return () => {
      isMounted = false;
    };
  }, []);

  // Current company derived from active user or fallback
  const currentCompany = currentUser ? companies[currentUser.companyId] : null;

  const login = async (companyId, email, password) => {
    try {
      const res = await api.login(companyId, email, password);
      if (res && res.user) {
        setCurrentUser(res.user);
        setSessionExpired(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      if (
        err.message &&
        (err.message.includes('password') ||
          err.message.includes('pending') ||
          err.message.includes('rejected') ||
          err.message.includes('deactivated') ||
          err.message.includes('Company ID') ||
          err.message.includes('account'))
      ) {
        return { success: false, error: err.message };
      }
    }

    // Local / Offline fallback
    const comp = companies[companyId];
    if (!comp) {
      return { success: false, error: `Invalid Company ID '${companyId}'. Please verify your organization code.` };
    }

    const user = users.find(
      (u) => u.companyId === companyId && u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return { success: false, error: 'No account found matching this Company ID and Email address.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please verify your credentials and try again.' };
    }

    if (user.status === 'PENDING') {
      return {
        success: false,
        error:
          'Your registration is currently pending review by your company lakehouse administrator. You will receive an alert once approved.',
        status: 'PENDING',
      };
    }

    if (user.status === 'REJECTED') {
      return {
        success: false,
        error: `Your access request was rejected: "${user.rejectionReason || 'Non-compliance with company lakehouse policy'}". Contact your administrator.`,
        status: 'REJECTED',
      };
    }

    if (user.status === 'DEACTIVATED') {
      return {
        success: false,
        error: 'This account has been deactivated by the company administrator. Please contact IT Security to reinstate access.',
        status: 'DEACTIVATED',
      };
    }

    setCurrentUser(user);
    setSessionExpired(false);
    return { success: true, user };
  };

  const quickLogin = async (userId) => {
    try {
      const res = await api.quickLogin(userId);
      if (res && res.user) {
        setCurrentUser(res.user);
        setSessionExpired(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      // fallback
    }

    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setSessionExpired(false);
      return { success: true, user };
    }
    return { success: false, error: 'Demo user not found' };
  };

  const logout = () => {
    api.setToken(null);
    setCurrentUser(null);
  };

  const register = async ({ companyId, name, email, password, requestedRole }) => {
    try {
      const res = await api.register({ companyId, name, email, password, requestedRole });
      if (res && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        return { success: true, user: res.user };
      }
    } catch (err) {
      if (err.message && (err.message.includes('already registered') || err.message.includes('does not exist'))) {
        return { success: false, error: err.message };
      }
    }

    // Validate company ID fallback
    const comp = companies[companyId];
    if (!comp) {
      return { success: false, error: `Company ID '${companyId}' does not exist in the lakehouse registry.` };
    }

    // Check duplicate email
    const existing = users.find(
      (u) => u.companyId === companyId && u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'An account with this email address is already registered in this company.' };
    }

    const newUser = {
      id: `u-${Date.now()}`,
      companyId,
      name,
      email,
      password,
      role: requestedRole || 'STAFF',
      title: requestedRole === 'HR' ? 'People Analytics Specialist' : 'Data Specialist',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: 'PENDING',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'Pending Review',
      voiceLanguage: 'en-US',
    };

    setUsers((prev) => [newUser, ...prev]);
    return { success: true, user: newUser };
  };

  const registerCompany = async ({
    companyName,
    companyId,
    industry,
    tagline,
    adminName,
    adminEmail,
    adminPassword,
    storageTier = 'Enterprise Lakehouse (50 TB)',
  }) => {
    const formattedId = companyId.trim().toUpperCase();

    try {
      const res = await api.registerCompany({
        companyName,
        companyId: formattedId,
        industry,
        tagline,
        adminName,
        adminEmail,
        adminPassword,
        storageTier,
      });
      if (res && res.company && res.user) {
        setCompanies((prev) => ({
          ...prev,
          [formattedId]: res.company,
        }));
        setUsers((prev) => [res.user, ...prev]);
        setCurrentUser(res.user);
        setSessionExpired(false);
        return { success: true, company: res.company, user: res.user };
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        return { success: false, error: err.message };
      }
    }

    // Check if companyId already exists fallback
    if (companies[formattedId]) {
      return {
        success: false,
        error: `Company ID '${formattedId}' already exists. Please choose a unique organization ID (e.g. ${formattedId}-001).`,
      };
    }

    const newCompany = {
      id: formattedId,
      name: companyName.trim(),
      tagline: tagline || `${industry || 'Enterprise'} Cloud Lakehouse`,
      industry: industry || 'Technology & Cloud SaaS',
      timezone: 'America/New_York (EST)',
      logo: '🏢',
      createdDate: new Date().toISOString().split('T')[0],
      storageTier,
      defaultAccess: 'Public to Company',
      allowedRegistrationRoles: ['HR', 'STAFF'],
      dataRetentionDays: 365,
      autoArchiveParquet: true,
    };

    const adminUser = {
      id: `u-${Date.now()}`,
      companyId: formattedId,
      name: adminName.trim(),
      email: adminEmail.trim(),
      password: adminPassword,
      role: 'ADMIN',
      title: 'Company Administrator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      voiceLanguage: 'en-US',
    };

    setCompanies((prev) => ({
      ...prev,
      [formattedId]: newCompany,
    }));

    setUsers((prev) => [adminUser, ...prev]);

    // Automatically log in the new company administrator
    setCurrentUser(adminUser);
    setSessionExpired(false);

    return {
      success: true,
      company: newCompany,
      user: adminUser,
    };
  };

  const approveUser = (userId) => {
    api.approveUser(userId).catch((err) => console.warn('API approveUser:', err));
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'ACTIVE', lastActive: 'Recently approved' } : u))
    );
  };

  const bulkApproveUsers = (userIds) => {
    api.bulkApproveUsers(userIds).catch((err) => console.warn('API bulkApproveUsers:', err));
    setUsers((prev) =>
      prev.map((u) => (userIds.includes(u.id) ? { ...u, status: 'ACTIVE', lastActive: 'Recently approved' } : u))
    );
  };

  const rejectUser = (userId, reason) => {
    api.rejectUser(userId, reason).catch((err) => console.warn('API rejectUser:', err));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'REJECTED', rejectionReason: reason || 'Access denied by administrator.' }
          : u
      )
    );
  };

  const changeUserRole = (userId, newRole) => {
    api.changeUserRole(userId, newRole).catch((err) => console.warn('API changeUserRole:', err));
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  const toggleUserStatus = (userId) => {
    api.toggleUserStatus(userId).catch((err) => console.warn('API toggleUserStatus:', err));
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const resetUserPassword = (userId, newPassword) => {
    api.resetUserPassword(userId, newPassword).catch((err) => console.warn('API resetUserPassword:', err));
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
  };

  const resetPasswordByEmail = async (companyId, email, newPassword) => {
    const formattedId = (companyId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      const res = await api.resetPassword(formattedId, cleanEmail, newPassword);
      if (res && res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.email.toLowerCase() === cleanEmail ? { ...u, password: newPassword } : u))
        );
        return { success: true, message: res.message };
      }
    } catch (err) {
      if (err.message && (err.message.includes('No registered account') || err.message.includes('not exist'))) {
        return { success: false, error: err.message };
      }
    }

    const comp = companies[formattedId];
    if (!comp) {
      return { success: false, error: `Company ID '${formattedId}' does not exist in the lakehouse registry.` };
    }

    const user = users.find(
      (u) => u.companyId === formattedId && u.email.toLowerCase() === cleanEmail
    );

    if (!user) {
      return { success: false, error: `No registered account found with email '${email}' in organization '${formattedId}'.` };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u))
    );

    return {
      success: true,
      message: `Password for ${user.name} (${user.email}) has been successfully updated.`,
      user,
    };
  };

  const updateProfile = (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    api.updateProfile(updates).catch((err) => console.warn('API updateProfile:', err));
  };

  const updateCompanySettings = (updates) => {
    if (!currentUser) return;
    setCompanies((prev) => ({
      ...prev,
      [currentUser.companyId]: {
        ...prev[currentUser.companyId],
        ...updates,
      },
    }));
    api.updateCompanySettings(updates).catch((err) => console.warn('API updateCompanySettings:', err));
  };

  const triggerSessionTimeout = () => {
    setSessionExpired(true);
  };

  const resetToDemoDefaults = () => {
    localStorage.removeItem('lakehouse_companies');
    localStorage.removeItem('lakehouse_users');
    localStorage.removeItem('lakehouse_datasets');
    localStorage.removeItem('lakehouse_charts');
    localStorage.removeItem('lakehouse_dashboards');
    localStorage.removeItem('lakehouse_audits');
    localStorage.removeItem('lakehouse_notifs');
    setCompanies(INITIAL_COMPANIES);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        companies,
        users,
        login,
        quickLogin,
        logout,
        register,
        registerCompany,
        approveUser,
        bulkApproveUsers,
        rejectUser,
        changeUserRole,
        toggleUserStatus,
        resetUserPassword,
        resetPasswordByEmail,
        updateProfile,
        updateCompanySettings,
        sessionExpired,
        setSessionExpired,
        triggerSessionTimeout,
        resetToDemoDefaults,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
