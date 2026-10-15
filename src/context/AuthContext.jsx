import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('lakehouse_companies');
    return saved ? JSON.parse(saved) : {};
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('lakehouse_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('lakehouse_token');
    const saved = localStorage.getItem('lakehouse_current_user');
    if (token && saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(true);
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

  // On mount: verify JWT token with backend /api/auth/me
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      const token = localStorage.getItem('lakehouse_token');
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const res = await api.getMe();
        if (!isMounted) return;
        if (res && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('lakehouse_current_user', JSON.stringify(res.user));
          if (res.company) {
            setCompanies((prev) => ({
              ...prev,
              [res.company.id]: res.company,
            }));
          }
        } else {
          api.setToken(null);
          localStorage.removeItem('lakehouse_current_user');
          setCurrentUser(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Session verification failed, logging out:', err.message);
        api.setToken(null);
        localStorage.removeItem('lakehouse_current_user');
        setCurrentUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync public companies registry from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchCompanies() {
      try {
        const res = await api.getCompanies();
        if (isMounted && res?.companies) {
          setCompanies((prev) => ({ ...prev, ...res.companies }));
        }
      } catch (err) {
        console.warn('Companies registry initial sync fallback:', err.message);
      }
    }
    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch users when authenticated admin is active
  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      try {
        const res = await api.getUsers();
        if (isMounted && res?.users) {
          setUsers(res.users);
        }
      } catch (err) {
        console.warn('Users registry initial sync fallback:', err.message);
      }
    }
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Current company derived from active user or fallback
  const currentCompany = currentUser ? companies[currentUser.companyId] : null;

  const login = async (companyId, email, password) => {
    try {
      const res = await api.login(companyId, email, password);
      if (res && res.user && res.token) {
        api.setToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('lakehouse_current_user', JSON.stringify(res.user));
        if (res.company) {
          setCompanies((prev) => ({
            ...prev,
            [res.company.id]: res.company,
          }));
        }
        setSessionExpired(false);
        return { success: true, user: res.user, company: res.company, token: res.token };
      }
      return { success: false, error: 'Invalid response from authentication server.' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed. Please verify your credentials.' };
    }
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('lakehouse_token');
    localStorage.removeItem('lakehouse_current_user');
    setCurrentUser(null);
    setSessionExpired(false);
  };

  const register = async ({ companyId, name, email, password, requestedRole }) => {
    try {
      const res = await api.register({ companyId, name, email, password, requestedRole });
      if (res && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Registration failed.' };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to submit registration request.' };
    }
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
      if (res && res.company && res.user && res.token) {
        api.setToken(res.token);
        setCompanies((prev) => ({
          ...prev,
          [formattedId]: res.company,
        }));
        setUsers((prev) => [res.user, ...prev]);
        setCurrentUser(res.user);
        localStorage.setItem('lakehouse_current_user', JSON.stringify(res.user));
        setSessionExpired(false);
        return { success: true, company: res.company, user: res.user, token: res.token };
      }
      return { success: false, error: 'Company creation failed.' };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to register company workspace.' };
    }
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

  const resetPasswordByEmail = async (companyId, email, newPassword, otp = null) => {
    const formattedId = (companyId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      const res = await api.resetPassword(formattedId, cleanEmail, newPassword, otp);
      if (res && res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.email.toLowerCase() === cleanEmail ? { ...u, password: newPassword } : u))
        );
        return { success: true, message: res.message };
      }
      return { success: false, error: 'Failed to reset password.' };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        companies,
        users,
        authLoading,
        login,
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
