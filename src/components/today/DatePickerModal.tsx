import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import {
  getTodayKey,
  parseDateKey,
  formatDateKey,
  DAYS_SHORT,
  addDaysToDateKey,
} from '../../utils/date';
import { Habit, HabitLogs } from '../../types';
import { isHabitScheduledOnDate } from '../../utils/streaks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  habits: Habit[];
  logs: HabitLogs;
}

export const DatePickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedDateKey,
  onSelectDate,
  habits,
  logs,
}) => {
  const today = getTodayKey();
  const selectedDate = parseDateKey(selectedDateKey);

  // Month navigation state
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth()); // 0-11

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    onSelectDate(today);
    onClose();
  };

  // Build calendar matrix for viewMonth & viewYear
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getDayCompletion = (dKey: string) => {
    const activeHabits = habits.filter((h) => !h.archived);
    const scheduled = activeHabits.filter((h) => isHabitScheduledOnDate(h, dKey));
    if (scheduled.length === 0) return 'none';

    const completed = scheduled.filter((h) => !!(logs[h.id] && logs[h.id][dKey])).length;
    if (completed === scheduled.length) return 'all';
    if (completed > 0) return 'partial';
    return 'empty';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Select Date
              </h3>
              <p className="text-[11px] text-slate-400">
                Review or log past entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between mt-3 px-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {monthName}
          </h4>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">
          {DAYS_SHORT.map((d) => (
            <span key={d}>{d[0]}</span>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1 mt-1.5">
          {/* Empty slots for start of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 w-full" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dKey === selectedDateKey;
            const isTodayDate = dKey === today;
            const status = getDayCompletion(dKey);

            return (
              <button
                key={dKey}
                onClick={() => {
                  onSelectDate(dKey);
                  onClose();
                }}
                className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                    : isTodayDate
                    ? 'border-2 border-indigo-500 font-bold text-slate-900 dark:text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="text-xs leading-none">{dayNum}</span>

                {/* Status Dot */}
                <div className="h-1 flex items-center justify-center mt-0.5">
                  {status === 'all' && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                  {status === 'partial' && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-indigo-200' : 'bg-amber-400'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
