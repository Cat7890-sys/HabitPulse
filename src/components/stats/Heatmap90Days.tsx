import React, { useState, useMemo } from 'react';
import { Calendar, Info } from 'lucide-react';
import { Habit, HabitLogs } from '../../types';
import { generate90DayHeatmap, HeatmapDayData } from '../../utils/streaks';
import { parseDateKey, formatDisplayDate, DAYS_SHORT } from '../../utils/date';

interface Props {
  habits: Habit[];
  logs: HabitLogs;
}

export const Heatmap90Days: React.FC<Props> = ({ habits, logs }) => {
  const [selectedDay, setSelectedDay] = useState<HeatmapDayData | null>(null);

  const heatmapData = useMemo(() => {
    return generate90DayHeatmap(habits, logs);
  }, [habits, logs]);

  // Group days into columns of weeks (7 days per column, Sunday to Saturday)
  const columns = useMemo(() => {
    const cols: HeatmapDayData[][] = [];
    let currentWeek: HeatmapDayData[] = [];

    heatmapData.forEach((day, index) => {
      const dayOfWeek = parseDateKey(day.dateKey).getDay();

      // If it's the very first day, fill preceding empty slots in the first column
      if (index === 0 && dayOfWeek > 0) {
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({
            dateKey: '',
            completedCount: 0,
            totalScheduled: 0,
            intensityLevel: 0,
            completedHabitNames: [],
          });
        }
      }

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dateKey: '',
          completedCount: 0,
          totalScheduled: 0,
          intensityLevel: 0,
          completedHabitNames: [],
        });
      }
      cols.push(currentWeek);
    }

    return cols;
  }, [heatmapData]);

  // Extract month labels positioned above columns
  const monthLabels = useMemo(() => {
    const labels: { colIndex: number; monthName: string }[] = [];
    let lastMonth = -1;

    columns.forEach((col, colIndex) => {
      const firstValidDay = col.find((d) => d.dateKey !== '');
      if (firstValidDay) {
        const date = parseDateKey(firstValidDay.dateKey);
        const month = date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            colIndex,
            monthName: date.toLocaleDateString('en-US', { month: 'short' }),
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [columns]);

  // Intensity color mapper
  const getCellColor = (level: number, isEmpty: boolean) => {
    if (isEmpty) return 'bg-transparent';
    switch (level) {
      case 4:
        return 'bg-indigo-600 dark:bg-indigo-500 shadow-xs ring-1 ring-indigo-400/40';
      case 3:
        return 'bg-indigo-500/80 dark:bg-indigo-600/80';
      case 2:
        return 'bg-indigo-400/60 dark:bg-indigo-700/60';
      case 1:
        return 'bg-indigo-300/40 dark:bg-indigo-900/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700';
    }
  };

  const totalCompletions90d = useMemo(() => {
    return heatmapData.reduce((sum, d) => sum + d.completedCount, 0);
  }, [heatmapData]);

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              90-Day Activity Heatmap
            </h3>
            <p className="text-[11px] text-slate-400">
              {totalCompletions90d} habit check-ins in the last 3 months
            </p>
          </div>
        </div>
      </div>

      {/* Grid Container with horizontal scrolling on mobile */}
      <div className="mt-4 overflow-x-auto pb-2 scrollbar-none">
        <div className="min-w-[480px]">
          {/* Month labels */}
          <div className="flex text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 pl-6">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                style={{ marginLeft: idx === 0 ? `${lbl.colIndex * 15}px` : '24px' }}
              >
                {lbl.monthName}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Day of Week Row Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-semibold text-slate-400 dark:text-slate-500 pr-1 py-0.5 select-none">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Heatmap Grid Columns */}
            <div className="flex gap-1">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {col.map((day, rowIdx) => {
                    const isEmpty = day.dateKey === '';
                    const isSelected = selectedDay?.dateKey === day.dateKey;

                    return (
                      <button
                        key={rowIdx}
                        disabled={isEmpty}
                        onClick={() => setSelectedDay(day)}
                        className={`h-3.5 w-3.5 rounded-sm transition-transform cursor-pointer ${getCellColor(
                          day.intensityLevel,
                          isEmpty
                        )} ${isSelected ? 'ring-2 ring-indigo-500 scale-125 z-10' : 'hover:scale-115'}`}
                        title={
                          day.dateKey
                            ? `${day.dateKey}: ${day.completedCount}/${day.totalScheduled} completed`
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-medium">Tap any square for day details</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">Less</span>
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-100 dark:bg-slate-800" />
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-300/40 dark:bg-indigo-900/60" />
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-400/60 dark:bg-indigo-700/60" />
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500/80 dark:bg-indigo-600/80" />
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-500" />
          </div>
          <span className="text-[10px]">More</span>
        </div>
      </div>

      {/* Selected Day Detail Popover / Card */}
      {selectedDay && selectedDay.dateKey && (
        <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {formatDisplayDate(selectedDay.dateKey)} ({selectedDay.dateKey})
            </h4>
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {selectedDay.completedCount} of {selectedDay.totalScheduled} completed
            </span>
          </div>

          {selectedDay.completedHabitNames.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDay.completedHabitNames.map((name, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              No habits completed on this date.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
