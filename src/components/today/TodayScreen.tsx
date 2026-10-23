import React from 'react';
import { Plus, CheckCheck, Sparkles, Calendar, History, ArrowRight } from 'lucide-react';
import {
  Habit,
  HabitLogs,
  HabitComputedStats,
  Category,
  LoginStreakData,
  TokenTransaction,
  MilestoneConfig,
} from '../../types';
import { ProgressRing } from './ProgressRing';
import { DateSelector } from './DateSelector';
import { HabitCard } from './HabitCard';
import { TokenWalletCard } from '../wallet/TokenWalletCard';
import { getTodayKey, formatDisplayDate } from '../../utils/date';

interface Props {
  habits: Habit[];
  categories?: Category[];
  logs: HabitLogs;
  computedStats: HabitComputedStats[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  todayProgress: { completed: number; total: number; percentage: number };
  tokenBalance: number;
  totalTokensEarned: number;
  loginStreak: LoginStreakData;
  transactions: TokenTransaction[];
  milestones: MilestoneConfig[];
  onToggleHabit: (habitId: string, dateKey: string) => void;
  onOpenAddModal: () => void;
  onEditHabit: (habit: Habit) => void;
  onRequestDelete: (habit: Habit) => void;
  onCompleteGoal?: (habitId: string) => void;
  onOpenWallet: () => void;
}

export const TodayScreen: React.FC<Props> = ({
  habits,
  categories = [],
  logs,
  computedStats,
  selectedDateKey,
  onSelectDate,
  todayProgress,
  tokenBalance,
  totalTokensEarned,
  loginStreak,
  transactions,
  milestones,
  onToggleHabit,
  onOpenAddModal,
  onEditHabit,
  onRequestDelete,
  onCompleteGoal,
  onOpenWallet,
}) => {
  const today = getTodayKey();
  const isToday = selectedDateKey === today;

  // Filter habits scheduled for selected date
  const scheduledStats = computedStats.filter((s) => s.isScheduledToday);

  // Sort: incomplete first, then completed
  const sortedStats = [...scheduledStats].sort((a, b) => {
    const aDone = !!(logs[a.habit.id] && logs[a.habit.id][selectedDateKey]);
    const bDone = !!(logs[b.habit.id] && logs[b.habit.id][selectedDateKey]);
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Token Wallet & Milestones Overview Card */}
      <TokenWalletCard
        tokenBalance={tokenBalance}
        totalTokensEarned={totalTokensEarned}
        loginStreak={loginStreak}
        transactions={transactions}
        milestones={milestones}
        onOpenWallet={onOpenWallet}
      />

      {/* Desktop Layout: 2 Columns on lg screens with sticky sidebar; Mobile Layout: Stacked single column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column (lg:col-span-5): Sticky Date Navigator & Daily Goal Summary */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 self-start">
          <DateSelector
            selectedDateKey={selectedDateKey}
            onSelectDate={onSelectDate}
            habits={habits}
            logs={logs}
          />

          <ProgressRing
            completed={todayProgress.completed}
            total={todayProgress.total}
            percentage={todayProgress.percentage}
            isToday={isToday}
          />
        </div>

        {/* Right Column (lg:col-span-7): Habit Checklist */}
        <div className="lg:col-span-7 space-y-3">
          {/* Retroactive Entry Notice Banner when viewing past date */}
          {!isToday && (
            <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/90 p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Viewing {formatDisplayDate(selectedDateKey)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Check off habits to record retroactive completions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectDate(today)}
                className="flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-white dark:text-slate-950 transition cursor-pointer shrink-0 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span>Today</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Habits Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {isToday ? "Today's Habits" : `Habits for ${formatDisplayDate(selectedDateKey)}`} ({scheduledStats.length})
            </h2>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md px-1"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Add Habit</span>
            </button>
          </div>

          {/* Habits Cards */}
          {sortedStats.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No habits scheduled for this day
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                No active habits match this date. Tap below to create a new habit or adjust your routine.
              </p>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Create Habit</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedStats.map((stat) => {
                const isCompleted = !!(logs[stat.habit.id] && logs[stat.habit.id][selectedDateKey]);
                return (
                  <HabitCard
                    key={stat.habit.id}
                    stats={stat}
                    dateKey={selectedDateKey}
                    isCompleted={isCompleted}
                    categories={categories}
                    onToggle={onToggleHabit}
                    onEdit={onEditHabit}
                    onDelete={() => onRequestDelete(stat.habit)}
                    onCompleteGoal={onCompleteGoal}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
