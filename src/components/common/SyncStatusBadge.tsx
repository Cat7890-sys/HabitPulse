import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface Props {
  className?: string;
  showText?: boolean;
}

export const SyncStatusBadge: React.FC<Props> = ({ className = '', showText = true }) => {
  const { syncStatus, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 ${className}`}
        title="Supabase keys not configured - running in local mode"
      >
        <CloudOff className="h-3 w-3" />
        {showText && <span>Local Mode</span>}
      </div>
    );
  }

  switch (syncStatus) {
    case 'synced':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 ${className}`}
          title="All habit data is synchronized with Supabase cloud"
        >
          <Cloud className="h-3 w-3 text-emerald-500" />
          {showText && <span>Cloud Synced</span>}
        </div>
      );

    case 'syncing':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 ${className}`}
          title="Synchronizing habits with cloud database..."
        >
          <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
          {showText && <span>Syncing...</span>}
        </div>
      );

    case 'offline':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 ${className}`}
          title="Offline - changes saved locally and queued for auto-sync"
        >
          <CloudOff className="h-3 w-3 text-amber-500" />
          {showText && <span>Saved Offline</span>}
        </div>
      );

    case 'pending':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 ${className}`}
          title="Changes queued - waiting to sync with cloud"
        >
          <Clock className="h-3 w-3 text-purple-500" />
          {showText && <span>Sync Pending</span>}
        </div>
      );

    case 'error':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 ${className}`}
          title="Sync issue encountered - retrying automatically"
        >
          <AlertCircle className="h-3 w-3 text-rose-500" />
          {showText && <span>Sync Retry</span>}
        </div>
      );

    default:
      return null;
  }
};
