import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('lakehouse_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('lakehouse_notifs', JSON.stringify(notifications));
  }, [notifications]);

  // Filter for current company
  const companyNotifications = notifications.filter(n => n.companyId === companyId);
  const unreadCount = companyNotifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => (n.companyId === companyId ? { ...n, unread: false } : n))
    );
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = ({ title, message, type = 'info', targetLink = '/dashboard' }) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      companyId,
      title,
      message,
      time: 'Just now',
      unread: true,
      type,
      targetLink
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: companyNotifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        removeNotification,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
