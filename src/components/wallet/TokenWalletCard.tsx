import React from 'react';
import { Coins, Zap, Trophy, ChevronRight, Sparkles, Flame, History, Award } from 'lucide-react';
import { LoginStreakData, TokenTransaction, MilestoneConfig } from '../../types';

interface Props {
  tokenBalance: number;
  totalTokensEarned: number;
  loginStreak: LoginStreakData;
  transactions: TokenTransaction[];
  milestones: MilestoneConfig[];
  onOpenWallet: () => void;
  onOpenMilestones?: () => void;
}

export const TokenWalletCard: React.FC<Props> = ({
  tokenBalance,
  totalTokensEarned,
  loginStreak,
  transactions,
  milestones,
  onOpenWallet,
  onOpenMilestones,
}) => {
  const activeMilestonesCount = milestones.filter((m) => m.enabled).length;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 shadow-sm transition-all hover:border-amber-300 dark:hover:border-amber-800/60">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/15 blur-2xl dark:bg-amber-500/10" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Section: Token Balance and Currency */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/30">
            <Coins className="h-6 w-6 fill-amber-100/20 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white">
              🪙
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                HabitPulse Tokens
              </span>
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                Reward Currency
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {tokenBalance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                tokens
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Lifetime: <strong className="text-slate-700 dark:text-slate-300">{totalTokensEarned}</strong> earned</span>
              <span>•</span>
              <span>{transactions.length} rewards ledger</span>
            </div>
          </div>
        </div>

        {/* Right Section: Separate Login Streak & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/40 dark:border-slate-800">
          {/* Daily App Login Streak (Preserved as separate system) */}
          <div
            title="Daily App Login Streak: measures consecutive days logging into HabitPulse. Login streaks are separate from habit token rewards."
            className="flex items-center gap-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 px-3 py-2 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Zap className="h-4 w-4 fill-indigo-500/30 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                App Login Streak
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                <span>{loginStreak.currentStreak} {loginStreak.currentStreak === 1 ? 'day' : 'days'}</span>
                {loginStreak.longestStreak > loginStreak.currentStreak && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    (Best: {loginStreak.longestStreak}d)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Open Wallet & Ledger Button */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-3.5 py-2 text-xs transition shadow-xs cursor-pointer shrink-0"
          >
            <Coins className="h-4 w-4" />
            <span>Wallet & Milestones</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
