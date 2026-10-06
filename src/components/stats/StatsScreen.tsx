import React from 'react';
import { Flame, Trophy, CheckCircle, Target, Award, ArrowUpRight } from 'lucide-react';
import { Habit, HabitLogs, HabitComputedStats, Category, UserProfile } from '../../types';
import { Heatmap90Days } from './Heatmap90Days';
import { WeeklyChart } from './WeeklyChart';
import { WeeklyGoalProgress } from './WeeklyGoalProgress';
import { AchievementsList } from './AchievementsList';
import { ProfileCard } from '../profile/ProfileCard';
import { COLOR_SCHEMES } from '../common/ColorMap';

interface Props {
  habits: Habit[];
  categories?: Category[];
  logs: HabitLogs;
  computedStats: HabitComputedStats[];
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onSelectHabit?: (habit: Habit) => void;
}

export const StatsScreen: React.FC<Props> = ({
  habits,
  categories = [],
  logs,
  computedStats,
  profile,
  onOpenProfile,
}) => {
  // Compute overall KPI metrics
  const totalCheckins = React.useMemo(() => {
    let count = 0;
    Object.values(logs).forEach((habitDateMap) => {
      Object.values(habitDateMap).forEach((val) => {
        if (val) count++;
      });
    });
    return count;
  }, [logs]);

  const bestOverallStreak = React.useMemo(() => {
    return computedStats.reduce((max, s) => Math.max(max, s.bestStreak), 0);
  }, [computedStats]);

  const averageCompletionRate = React.useMemo(() => {
    if (computedStats.length === 0) return 0;
    const sum = computedStats.reduce((acc, s) => acc + s.completionRate, 0);
    return Math.round(sum / computedStats.length);
  }, [computedStats]);

  return (
    <div className="space-y-5 pb-12">
      {/* Profile Overview Card */}
      {profile && onOpenProfile && (
        <ProfileCard
          profile={profile}
          totalCompletions={totalCheckins}
          bestStreak={bestOverallStreak}
          onEditProfile={onOpenProfile}
        />
      )}

      {/* KPI Overview Grid - 2 cols on mobile, 4 cols on tablet & desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Check-ins */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Check-Ins
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {totalCheckins}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Lifetime completions
          </span>
        </div>

        {/* Best Streak */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Best Streak
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {bestOverallStreak} <span className="text-xs font-bold text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Personal record
          </span>
        </div>

        {/* Average Completion Rate */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {averageCompletionRate}%
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Scheduled success rate
          </span>
        </div>

        {/* Active Habits */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Habits
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {habits.filter((h) => !h.archived).length}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Being tracked daily
          </span>
        </div>
      </div>

      {/* Responsive Mid Section: 2 Columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
          {/* Achievements and Milestones System */}
          <AchievementsList
            habits={habits}
            logs={logs}
            computedStats={computedStats}
            categories={categories}
          />

          {/* Weekly Goal Progress Widget by Category */}
          <WeeklyGoalProgress
            habits={habits}
            categories={categories}
            logs={logs}
          />
        </div>

        <div className="space-y-5">
          {/* 7-Day Performance Bar Chart */}
          <WeeklyChart habits={habits} logs={logs} />

          {/* 90-Day Calendar Heatmap */}
          <Heatmap90Days habits={habits} logs={logs} />
        </div>
      </div>

      {/* Per-Habit Breakdown Section in 2 columns on tablet/desktop */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Habit Performance Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">
              Completion rates and streak statistics per habit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {computedStats.map((stat) => {
            const { habit, currentStreak, bestStreak, totalCompletions, completionRate } = stat;
            const colorScheme = COLOR_SCHEMES[habit.color] || COLOR_SCHEMES.indigo;

            return (
              <div
                key={habit.id}
                className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{habit.emoji}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {habit.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {totalCompletions} total check-ins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                        <Flame className="h-3 w-3 fill-amber-500" />
                        <span>{currentStreak}d</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Best: {bestStreak}d
                      </span>
                    </div>

                    <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {completionRate}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Rate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${colorScheme.bg}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
