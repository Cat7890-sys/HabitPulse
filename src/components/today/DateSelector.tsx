import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import {
  getTodayKey,
  addDaysToDateKey,
  parseDateKey,
  DAYS_SHORT,
  formatDisplayDate,
  getWeekDateKeys,
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

  // Generate stable 7-day strip representing the calendar week of selectedDateKey
  const dateStrip = React.useMemo(() => {
    return getWeekDateKeys(selectedDateKey, true);
  }, [selectedDateKey]);

  // Touch swipe support for switching weeks on mobile
  const touchStartX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX.current;
    touchStartX.current = null;
    if (diffX > 60) {
      // Swiped right -> go to previous week
      onSelectDate(addDaysToDateKey(selectedDateKey, -7));
    } else if (diffX < -60) {
      // Swiped left -> go to next week
      onSelectDate(addDaysToDateKey(selectedDateKey, 7));
    }
  };

  // Keyboard navigation within the date strip
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelectDate(addDaysToDateKey(selectedDateKey, -1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelectDate(addDaysToDateKey(selectedDateKey, 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSelectDate(dateStrip[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSelectDate(dateStrip[6]);
    }
  };

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
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
          className="flex items-center gap-2 text-left group rounded-xl p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          title="Open calendar date picker"
          aria-label="Open calendar date picker"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            <CalendarIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {formatDisplayDate(selectedDateKey)}
              </h2>
              <CalendarRange className="h-3 w-3 text-slate-400" aria-hidden="true" />
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {parseDateKey(selectedDateKey).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Jump back to today button */}
          {!isSelectedToday && (
            <button
              type="button"
              onClick={() => onSelectDate(today)}
              className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800 px-2.5 py-1 rounded-lg hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Today
            </button>
          )}

          {/* Calendar Picker Trigger Icon */}
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Pick a specific date"
            aria-label="Pick date"
          >
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Prev/Next Day buttons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onSelectDate(addDaysToDateKey(selectedDateKey, -1))}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(addDaysToDateKey(selectedDateKey, 1))}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Day Chips - Stable week columns that don't slide under click */}
      <div
        role="group"
        aria-label="Week day selector"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-7 gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
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
              type="button"
              onClick={() => onSelectDate(dKey)}
              aria-label={`${isCurrentToday ? 'Today, ' : ''}${dayName}, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${status === 'all' ? ' - all habits completed' : status === 'partial' ? ' - partially completed' : ''}`}
              aria-pressed={isSelected}
              aria-current={isCurrentToday ? 'date' : undefined}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all cursor-pointer relative active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200'
              }`}
            >
              {/* Today indicator dot */}
              {isCurrentToday && (
                <span
                  className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${
                    isSelected
                      ? 'bg-emerald-400 dark:bg-slate-950 ring-1 ring-white/60 dark:ring-emerald-400/40'
                      : 'bg-emerald-500'
                  }`}
                  aria-hidden="true"
                />
              )}

              <span
                className={`text-[11px] uppercase tracking-wider transition-colors ${
                  isSelected
                    ? 'font-bold text-slate-300 dark:text-slate-950'
                    : isCurrentToday
                    ? 'font-bold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-slate-600 dark:text-slate-300'
                }`}
              >
                {dayName}
              </span>
              <span
                className={`text-sm mt-0.5 tabular-nums transition-colors ${
                  isSelected
                    ? 'font-extrabold text-white dark:text-slate-950'
                    : isCurrentToday
                    ? 'font-extrabold text-emerald-800 dark:text-emerald-300'
                    : 'font-bold text-slate-900 dark:text-slate-100'
                }`}
              >
                {dayNumber}
              </span>

              {/* Status mini dot */}
              <div className="mt-1 flex items-center justify-center h-1.5">
                {status === 'all' && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-emerald-400 dark:bg-slate-950' : 'bg-emerald-500'
                    }`}
                  />
                )}
                {status === 'partial' && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-amber-400 dark:bg-amber-900' : 'bg-amber-500'
                    }`}
                  />
                )}
                {status === 'empty' && (
                  <span
                    className={`h-1 w-1 rounded-full ${
                      isSelected ? 'bg-slate-600 dark:bg-emerald-950/40' : 'bg-slate-200 dark:bg-slate-700'
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
