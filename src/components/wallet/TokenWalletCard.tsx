import React from 'react';
import { Coins, Zap, ChevronRight } from 'lucide-react';
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
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Section: Token Balance and Ledger Info */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reward Tokens
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                ·
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {totalTokensEarned} lifetime
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                {tokenBalance.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                tokens available
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Separate Login Streak & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Daily App Login Streak (Preserved as separate system) */}
          <div
            title="Daily App Login Streak: measures consecutive days logging into HabitPulse. Login streaks are separate from habit token rewards."
            className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border border-slate-200/80 dark:border-slate-700/80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                Login Streak
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums leading-none">
                {loginStreak.currentStreak} {loginStreak.currentStreak === 1 ? 'day' : 'days'}
                {loginStreak.longestStreak > loginStreak.currentStreak && (
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    (best {loginStreak.longestStreak}d)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Open Wallet & Ledger Button */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold px-3.5 py-2 text-xs transition cursor-pointer shrink-0 shadow-2xs"
          >
            <span>Wallet & Milestones</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
