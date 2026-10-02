import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { storage } from '../../storage/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReset = async () => {
    try {
      await storage.clearAllData();
      await storage.seedDemoData();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Something went wrong
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              HabitPulse encountered an unexpected issue while rendering. You can reload the app or restore default data.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload HabitPulse</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Reset & Load Fresh Demo Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
