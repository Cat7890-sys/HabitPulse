import React from 'react';
import { Plus, CheckCheck, Sparkles, Calendar, History, ArrowRight } from 'lucide-react';
import { Habit, HabitLogs, HabitComputedStats, Category } from '../../types';
import { ProgressRing } from './ProgressRing';
import { DateSelector } from './DateSelector';
import { HabitCard } from './HabitCard';
import { getTodayKey, formatDisplayDate } from '../../utils/date';

interface Props {
  habits: Habit[];
  categories?: Category[];
  logs: HabitLogs;
  computedStats: HabitComputedStats[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  todayProgress: { completed: number; total: number; percentage: number };
  onToggleHabit: (habitId: string, dateKey: string) => void;
  onOpenAddModal: () => void;
  onEditHabit: (habit: Habit) => void;
  onRequestDelete: (habit: Habit) => void;
}

export const TodayScreen: React.FC<Props> = ({
  habits,
  categories = [],
  logs,
  computedStats,
  selectedDateKey,
  onSelectDate,
  todayProgress,
  onToggleHabit,
  onOpenAddModal,
  onEditHabit,
  onRequestDelete,
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
      {/* Date Navigator & Picker */}
      <DateSelector
        selectedDateKey={selectedDateKey}
        onSelectDate={onSelectDate}
        habits={habits}
        logs={logs}
      />

      {/* Retroactive Entry Notice Banner when viewing past date */}
      {!isToday && (
        <div className="flex items-center justify-between rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 p-3 border border-indigo-200/80 dark:border-indigo-800/60 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Logging for {formatDisplayDate(selectedDateKey)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Tap any habit below to retroactively log completion
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectDate(today)}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer shrink-0"
          >
            <span>Today</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Progress Ring Summary Card */}
      <ProgressRing
        completed={todayProgress.completed}
        total={todayProgress.total}
        percentage={todayProgress.percentage}
        isToday={isToday}
      />

      {/* Habits List Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isToday ? "Today's Habits" : `Habits for ${formatDisplayDate(selectedDateKey)}`} ({scheduledStats.length})
          </h2>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Habit</span>
          </button>
        </div>

        {/* Habits Cards */}
        {sortedStats.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xl">
              🌱
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No habits scheduled for this day
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              You have no active habits scheduled on this day. Tap below to create one or adjust your schedule.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Habit</span>
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
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
