import React, { useMemo } from 'react';
import { Target, Sparkles, CheckCircle2, TrendingUp, Award } from 'lucide-react';
import { Habit, HabitLogs, Category } from '../../types';
import { getTodayKey, getWeekDateKeys, parseDateKey } from '../../utils/date';
import { COLOR_SCHEMES } from '../common/ColorMap';

interface Props {
  habits: Habit[];
  categories: Category[];
  logs: HabitLogs;
}

interface CategoryWeeklyStat {
  category: Category | { id: string; name: string; color: 'indigo'; emoji: string };
  habitsCount: number;
  completed: number;
  target: number;
  percentage: number;
  isTargetMet: boolean;
  habitBreakdown: {
    habit: Habit;
    completed: number;
    target: number;
  }[];
}

export const WeeklyGoalProgress: React.FC<Props> = ({
  habits,
  categories,
  logs,
}) => {
  const today = getTodayKey();
  const currentWeekDays = useMemo(() => getWeekDateKeys(today, true), [today]);

  // Format week date range string (e.g. "Oct 28 – Nov 3")
  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const startObj = parseDateKey(currentWeekDays[0]);
    const endObj = parseDateKey(currentWeekDays[currentWeekDays.length - 1]);
    const startStr = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Helper map: categoryId or name -> Category object
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => {
      map.set(c.id, c);
      map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, [categories]);

  const getHabitCategory = (habit: Habit): Category | undefined => {
    if (habit.categoryId && categoryMap.has(habit.categoryId)) {
      return categoryMap.get(habit.categoryId);
    }
    if (habit.category && categoryMap.has(habit.category.toLowerCase())) {
      return categoryMap.get(habit.category.toLowerCase());
    }
    return undefined;
  };

  // Compute weekly targets & completions per category
  const categoryStats: CategoryWeeklyStat[] = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    if (activeHabits.length === 0) return [];

    const statsList: CategoryWeeklyStat[] = [];

    // Helper to calculate target and completed for a habit in the current week
    const getHabitWeeklyData = (habit: Habit) => {
      let target = 7;
      if (habit.frequency.type === 'daily') {
        target = 7;
      } else if (habit.frequency.type === 'times_per_week') {
        target = habit.frequency.timesPerWeek || 1;
      } else if (habit.frequency.type === 'weekdays' && habit.frequency.days) {
        target = habit.frequency.days.length;
      }

      const habitLogs = logs[habit.id] || {};
      const completed = currentWeekDays.reduce(
        (acc, dKey) => acc + (habitLogs[dKey] ? 1 : 0),
        0
      );

      return { habit, completed, target };
    };

    // Process all defined categories
    categories.forEach((cat) => {
      const habitsInCat = activeHabits.filter((h) => {
        const hCat = getHabitCategory(h);
        return hCat?.id === cat.id;
      });

      if (habitsInCat.length > 0) {
        const breakdown = habitsInCat.map(getHabitWeeklyData);
        const totalCompleted = breakdown.reduce((acc, item) => acc + item.completed, 0);
        const totalTarget = breakdown.reduce((acc, item) => acc + item.target, 0);
        const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

        statsList.push({
          category: cat,
          habitsCount: habitsInCat.length,
          completed: totalCompleted,
          target: totalTarget,
          percentage,
          isTargetMet: totalCompleted >= totalTarget,
          habitBreakdown: breakdown,
        });
      }
    });

    // Uncategorized habits
    const uncategorized = activeHabits.filter((h) => !getHabitCategory(h));
    if (uncategorized.length > 0) {
      const breakdown = uncategorized.map(getHabitWeeklyData);
      const totalCompleted = breakdown.reduce((acc, item) => acc + item.completed, 0);
      const totalTarget = breakdown.reduce((acc, item) => acc + item.target, 0);
      const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

      statsList.push({
        category: { id: 'other', name: 'Other', color: 'indigo', emoji: '📦' },
        habitsCount: uncategorized.length,
        completed: totalCompleted,
        target: totalTarget,
        percentage,
        isTargetMet: totalCompleted >= totalTarget,
        habitBreakdown: breakdown,
      });
    }

    return statsList;
  }, [habits, categories, logs, currentWeekDays, categoryMap]);

  // Overall weekly target summary
  const overallWeekly = useMemo(() => {
    const totalTarget = categoryStats.reduce((acc, c) => acc + c.target, 0);
    const totalCompleted = categoryStats.reduce((acc, c) => acc + c.completed, 0);
    const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    return { totalCompleted, totalTarget, percentage };
  }, [categoryStats]);

  if (categoryStats.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Weekly Goal Progress
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {weekRangeLabel} • Category targets
            </p>
          </div>
        </div>

        {/* Overall Completion Ratio Badge */}
        <div className="text-right shrink-0">
          <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{overallWeekly.percentage}% Goal</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block">
            {overallWeekly.totalCompleted}/{overallWeekly.totalTarget} check-ins
          </span>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div className="space-y-4 pt-1">
        {categoryStats.map((stat) => {
          const { category, completed, target, percentage, isTargetMet, habitsCount } = stat;
          const colorScheme = COLOR_SCHEMES[category.color] || COLOR_SCHEMES.indigo;
          const fillWidth = Math.min(100, percentage);

          return (
            <div
              key={category.id}
              className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800/80 space-y-2.5"
            >
              {/* Top Row: Category Title, Counts, Target Met Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-base ${colorScheme.bgSubtle} border`}
                  >
                    <span>{category.emoji}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{category.name}</span>
                      <span className={`h-2 w-2 rounded-full ${colorScheme.bg}`} />
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {habitsCount} {habitsCount === 1 ? 'habit' : 'habits'}
                    </span>
                  </div>
                </div>

                {/* Status and Fraction */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {completed}/{target}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isTargetMet
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {isTargetMet ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 mt-0.5">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Target Met!</span>
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                      {target - completed} more to reach goal
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Target Bar Comparison */}
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                  {/* Progress Fill Bar */}
                  <div
                    style={{ width: `${fillWidth}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${colorScheme.bg} ${
                      isTargetMet ? 'shadow-xs' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Sub-breakdown of habits in this category */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                {stat.habitBreakdown.map((item) => (
                  <span
                    key={item.habit.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
                  >
                    <span>{item.habit.emoji}</span>
                    <span className="truncate max-w-[100px]">{item.habit.name}</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold">
                      {item.completed}/{item.target}
                    </strong>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
