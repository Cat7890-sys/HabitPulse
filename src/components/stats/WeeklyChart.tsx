import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Habit, HabitLogs } from '../../types';
import { getTodayKey, addDaysToDateKey, parseDateKey, DAYS_SHORT } from '../../utils/date';
import { isHabitScheduledOnDate } from '../../utils/streaks';

interface Props {
  habits: Habit[];
  logs: HabitLogs;
}

export const WeeklyChart: React.FC<Props> = ({ habits, logs }) => {
  const today = getTodayKey();

  // Last 7 days data
  const weeklyData = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    const days: {
      dateKey: string;
      dayLabel: string;
      dateLabel: string;
      completed: number;
      total: number;
      pct: number;
      isToday: boolean;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dKey = addDaysToDateKey(today, -i);
      const dateObj = parseDateKey(dKey);
      const dayLabel = DAYS_SHORT[dateObj.getDay()];
      const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

      let scheduled = 0;
      let completed = 0;

      activeHabits.forEach((h) => {
        if (isHabitScheduledOnDate(h, dKey)) {
          scheduled++;
          if (logs[h.id] && logs[h.id][dKey]) {
            completed++;
          }
        }
      });

      const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

      days.push({
        dateKey: dKey,
        dayLabel,
        dateLabel,
        completed,
        total: scheduled,
        pct,
        isToday: dKey === today,
      });
    }

    return days;
  }, [habits, logs, today]);

  // Calculate this 7-day average vs total
  const avgCompletion = useMemo(() => {
    const totalScheduled = weeklyData.reduce((s, d) => s + d.total, 0);
    const totalDone = weeklyData.reduce((s, d) => s + d.completed, 0);
    return totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;
  }, [weeklyData]);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              7-Day Performance
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Daily completion rate over the last 7 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-900/50">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">{avgCompletion}% avg</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="mt-6 flex items-end justify-between gap-2 h-36 px-1">
        {weeklyData.map((d) => {
          const barHeight = Math.max(6, d.pct);

          return (
            <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-2 group">
              {/* Tooltip on hover */}
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {d.completed}/{d.total}
              </span>

              {/* Bar track */}
              <div className="w-full max-w-[28px] h-24 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex flex-col justify-end p-0.5 relative">
                <div
                  style={{ height: `${barHeight}%` }}
                  className={`w-full rounded-md transition-all duration-300 ${
                    d.pct === 100
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : d.isToday
                      ? 'bg-slate-900 dark:bg-emerald-400'
                      : d.pct > 0
                      ? 'bg-emerald-600/70 dark:bg-emerald-500/70'
                      : 'bg-transparent'
                  }`}
                />
              </div>

              {/* Day label */}
              <div className="text-center">
                <span
                  className={`text-[11px] font-semibold block ${
                    d.isToday
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d.dayLabel}
                </span>
                <span className="text-[9px] text-slate-400 block -mt-0.5 font-medium tabular-nums">
                  {d.dateLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
