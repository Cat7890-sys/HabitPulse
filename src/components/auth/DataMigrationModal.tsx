import React, { useState } from 'react';
import { CloudUpload, RefreshCcw, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export const DataMigrationModal: React.FC = () => {
  const {
    showMigrationPrompt,
    migrateLocalDataToCloud,
    startFreshCloud,
    dismissMigrationPrompt,
  } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showMigrationPrompt) return null;

  const handleSyncLocal = async () => {
    setIsProcessing(true);
    try {
      await migrateLocalDataToCloud();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartFresh = async () => {
    setIsProcessing(true);
    try {
      await startFreshCloud();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <CloudUpload className="h-7 w-7" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Existing Local Habits Found
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You have active habit tracking data saved on this device. Would you like to upload your existing local habits into your cloud account?
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {/* Option 1: Upload / Sync existing local data */}
          <button
            onClick={handleSyncLocal}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isProcessing ? 'Syncing...' : 'Sync My Existing Local Data'}</span>
          </button>

          {/* Option 2: Start fresh from cloud */}
          <button
            onClick={handleStartFresh}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCcw className="h-4 w-4 text-slate-400" />
            <span>Load Account Data (Start Fresh)</span>
          </button>
        </div>

        <button
          onClick={dismissMigrationPrompt}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer pt-1"
        >
          Decide Later
        </button>
      </div>
    </div>
  );
};
