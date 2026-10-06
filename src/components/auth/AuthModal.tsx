import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { signIn, signUp, isConfigured } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (tab === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password should be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.success) {
          setSuccessMessage('Successfully signed in!');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setErrorMessage(res.error || 'Failed to sign in. Check your email and password.');
        }
      } else {
        const res = await signUp(email.trim(), password);
        if (res.success) {
          setSuccessMessage('Account created successfully! Check your email if verification is required.');
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setErrorMessage(res.error || 'Could not create account.');
        }
      }
    } catch {
      setErrorMessage('An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                HabitPulse Cloud Sync
              </h3>
              <p className="text-[11px] text-slate-400">
                Backup habits across your devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Not Configured Notice */}
        {!isConfigured && (
          <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-3.5 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Supabase Keys Missing</span>
            </p>
            <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
              Add your <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env</code> to activate cloud authentication. HabitPulse continues working locally in the meantime.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-1 mt-4">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              tab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              tab === 'signup'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Notification Feedback */}
        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 p-3 text-xs text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/80">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Email */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Confirm Password in Sign Up */}
          {tab === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : tab === 'signin' ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In to Account</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Free Account</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
          100% Local-First. Your habits work offline even without logging in.
        </p>
      </div>
    </div>
  );
};
