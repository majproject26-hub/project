import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 3500 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    success: 'bg-[#DCE4C2]/40 dark:bg-[#2D3323] border-[#4D5A2A]/40 text-[#25291D] dark:text-[#F7F4E8]',
    error: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
    warning: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    info: 'bg-[#DCE4C2]/50 dark:bg-[#25291D] border-[#748447]/40 dark:border-[#4D5A2A] text-[#25291D] dark:text-[#F7F4E8]',
  };

  const iconColors = {
    success: 'text-[#4D5A2A] dark:text-[#DCE4C2]',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-[#4D5A2A] dark:text-[#DCE4C2]',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-10 ${
                styles[t.type] || styles.info
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[t.type] || 'text-sky-500'}`} />
              <div className="flex-1 space-y-0.5">
                {t.title && <h4 className="text-sm font-semibold">{t.title}</h4>}
                {t.message && <p className="text-xs opacity-90 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
