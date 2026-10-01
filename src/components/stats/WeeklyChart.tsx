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
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              7-Day Performance
            </h3>
            <p className="text-[11px] text-slate-400">
              Daily completion rate over the last 7 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{avgCompletion}% avg</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="mt-6 flex items-end justify-between gap-2 h-36 px-1">
        {weeklyData.map((d) => {
          const barHeight = Math.max(8, d.pct); // min 8% for visual indicator

          return (
            <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-2 group">
              {/* Tooltip on hover */}
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.completed}/{d.total}
              </span>

              {/* Bar track */}
              <div className="w-full max-w-[28px] h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 relative">
                <div
                  style={{ height: `${barHeight}%` }}
                  className={`w-full rounded-lg transition-all duration-500 ease-out ${
                    d.pct === 100
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/30'
                      : d.isToday
                      ? 'bg-gradient-to-t from-indigo-600 to-pink-500'
                      : 'bg-gradient-to-t from-indigo-500 to-purple-400'
                  }`}
                />
              </div>

              {/* Day label */}
              <div className="text-center">
                <span
                  className={`text-[11px] font-bold block ${
                    d.isToday
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d.dayLabel}
                </span>
                <span className="text-[9px] text-slate-400 block -mt-0.5 font-medium">
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
