import React from 'react';
import { X, Trophy, Coins, Sparkles, CheckCircle2, Flame, ArrowRight } from 'lucide-react';
import { Habit, MilestoneConfig } from '../../types';

interface Props {
  award: {
    milestone: MilestoneConfig;
    habit: Habit;
    cycle: number;
    tokensAwarded: number;
  } | null;
  onClose: () => void;
  onOpenWallet?: () => void;
}

export const MilestoneCelebrationModal: React.FC<Props> = ({
  award,
  onClose,
  onOpenWallet,
}) => {
  if (!award) return null;

  const { milestone, habit, tokensAwarded } = award;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-amber-300/80 dark:border-amber-800/80 bg-white dark:bg-slate-900 p-6 shadow-2xl text-center space-y-4 overflow-hidden">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full bg-amber-400/25 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Milestone Icon */}
        <div className="relative mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-white shadow-xl shadow-amber-500/35">
          <Coins className="h-10 w-10 fill-amber-100/30 text-white animate-bounce" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-sm shadow-md">
            🏆
          </div>
        </div>

        {/* Headline & Tokens Awarded */}
        <div>
          <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
            Milestone Achieved!
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            +{tokensAwarded} HabitPulse Tokens
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Added to your Token Wallet & Transaction Ledger
          </p>
        </div>

        {/* Milestone & Habit Card Details */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Milestone Tier
            </span>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
              {milestone.days} Days Streak
            </span>
          </div>

          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{milestone.name}</span>
          </p>

          <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{habit.emoji}</span>
            <span className="font-semibold truncate">{habit.name}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              if (onOpenWallet) onOpenWallet();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold py-3 text-sm transition shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <span>View in Token Wallet</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 cursor-pointer"
          >
            Continue Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
