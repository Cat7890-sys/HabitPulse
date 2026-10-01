import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  variant?: 'button' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (variant === 'settings') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Install HabitPulse App
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Install for offline access, instant notifications, and a full native app experience.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          {isInstallable ? (
            <button
              onClick={install}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Install to Home Screen
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
            >
              <Share className="h-4 w-4" />
              How to Install on iPhone / iPad
            </button>
          ) : (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-[0.98] transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              App Installation Guide
            </button>
          )}
        </div>

        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add to Home Screen
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button <Share className="inline h-4 w-4 text-indigo-500 mb-0.5" /> in your Safari browser toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> <PlusSquare className="inline h-4 w-4 text-indigo-500 mb-0.5" />.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    3
                  </span>
                  <p>
                    Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top-right corner to finish!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-2.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header quick install pill
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-indigo-600/10 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return null;
};
