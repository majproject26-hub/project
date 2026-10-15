import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function ForbiddenPage({ requiredRoles = [] }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Error 403 • Access Restricted
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Permission Denied
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your current role does not have authorization to view or execute actions on this lakehouse resource.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Your Current Role:</span>
            <Badge variant={currentUser?.role || 'STAFF'}>{currentUser?.role || 'STAFF'}</Badge>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Required Role(s):</span>
              <div className="flex gap-1">
                {requiredRoles.map(r => (
                  <Badge key={r} variant={r} size="xs">{r}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={Home}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
