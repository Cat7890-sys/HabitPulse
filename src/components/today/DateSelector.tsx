import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import {
  getTodayKey,
  addDaysToDateKey,
  parseDateKey,
  DAYS_SHORT,
  formatDisplayDate,
} from '../../utils/date';
import { Habit, HabitLogs } from '../../types';
import { isHabitScheduledOnDate } from '../../utils/streaks';
import { DatePickerModal } from './DatePickerModal';

interface Props {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  habits: Habit[];
  logs: HabitLogs;
}

export const DateSelector: React.FC<Props> = ({
  selectedDateKey,
  onSelectDate,
  habits,
  logs,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const today = getTodayKey();
  const isSelectedToday = selectedDateKey === today;

  // Generate rolling 7-day strip centered around selectedDateKey
  const dateStrip = React.useMemo(() => {
    const dates: string[] = [];
    for (let i = -3; i <= 3; i++) {
      dates.push(addDaysToDateKey(selectedDateKey, i));
    }
    return dates;
  }, [selectedDateKey]);

  // Check completion status for a date dot
  const getDayCompletionStatus = (dKey: string) => {
    const activeHabits = habits.filter((h) => !h.archived);
    const scheduled = activeHabits.filter((h) => isHabitScheduledOnDate(h, dKey));
    if (scheduled.length === 0) return 'none';

    const completed = scheduled.filter((h) => !!(logs[h.id] && logs[h.id][dKey])).length;
    if (completed === scheduled.length) return 'all';
    if (completed > 0) return 'partial';
    return 'empty';
  };

  return (
    <div className="space-y-2">
      {/* Date Header Title & Jump to Today button */}
      <div className="flex items-center justify-between px-1">
        {/* Clickable Date Title that opens Date Picker Modal */}
        <button
          onClick={() => setIsDatePickerOpen(true)}
          className="flex items-center gap-2 text-left group rounded-xl p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          title="Click to open calendar date picker"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {formatDisplayDate(selectedDateKey)}
              </h2>
              <CalendarRange className="h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {parseDateKey(selectedDateKey).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {/* Jump back to today button */}
          {!isSelectedToday && (
            <button
              onClick={() => onSelectDate(today)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
            >
              Today
            </button>
          )}

          {/* Calendar Picker Trigger Icon */}
          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
            title="Pick a specific date"
          >
            <CalendarRange className="h-4 w-4" />
          </button>

          {/* Prev/Next Day buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onSelectDate(addDaysToDateKey(selectedDateKey, -1))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onSelectDate(addDaysToDateKey(selectedDateKey, 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Day Chips */}
      <div className="grid grid-cols-7 gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {dateStrip.map((dKey) => {
          const dateObj = parseDateKey(dKey);
          const dayName = DAYS_SHORT[dateObj.getDay()];
          const dayNumber = dateObj.getDate();
          const isSelected = dKey === selectedDateKey;
          const isCurrentToday = dKey === today;
          const status = getDayCompletionStatus(dKey);

          return (
            <button
              key={dKey}
              onClick={() => onSelectDate(dKey)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
              }`}
            >
              {/* Today indicator dot */}
              {isCurrentToday && !isSelected && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}

              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {dayName}
              </span>
              <span
                className={`text-sm font-extrabold mt-0.5 ${
                  isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {dayNumber}
              </span>

              {/* Status mini dot */}
              <div className="mt-1 flex items-center justify-center h-1.5">
                {status === 'all' && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                )}
                {status === 'partial' && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-indigo-200' : 'bg-amber-400'
                    }`}
                  />
                )}
                {status === 'empty' && (
                  <span
                    className={`h-1 w-1 rounded-full ${
                      isSelected ? 'bg-indigo-300/40' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDateKey={selectedDateKey}
        onSelectDate={onSelectDate}
        habits={habits}
        logs={logs}
      />
    </div>
  );
};
