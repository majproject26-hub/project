import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { Database, Loader2 } from 'lucide-react';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4D5A2A] via-[#748447] to-[#DCE4C2] flex items-center justify-center text-[#F7F4E8] shadow-lg shadow-[#4D5A2A]/25 animate-pulse">
          <Database className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#748447]" />
          <span>Verifying secure workspace session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <ForbiddenPage requiredRoles={allowedRoles} />;
  }

  return children;
}

