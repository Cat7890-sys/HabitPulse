import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  completed: number;
  total: number;
  percentage: number;
  isToday: boolean;
}

export const ProgressRing: React.FC<Props> = ({
  completed,
  total,
  percentage,
  isToday,
}) => {
  const size = 120;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getMotivationalText = () => {
    if (total === 0) return 'No habits scheduled for this date.';
    if (percentage === 100) return isToday ? 'All habits completed for today.' : 'All habits completed for this date.';
    if (percentage >= 75) return 'Nearly complete. Keep going.';
    if (percentage >= 50) return 'Halfway through today’s checklist.';
    if (percentage > 0) return 'In progress. Mark habits complete as you finish.';
    return isToday ? 'Ready to begin today’s routine.' : 'No habits completed yet.';
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left text metrics */}
        <div className="flex-1 space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {isToday ? 'Today’s Progress' : 'Daily Progress'}
          </span>

          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {completed}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              of {total} completed
            </span>
          </div>

          <p className="text-xs font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
            {getMotivationalText()}
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100 dark:text-slate-800/80"
            />
            {/* Crisp Fresh-Green Progress Bar */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="text-emerald-600 dark:text-emerald-400 transition-all duration-300 ease-out"
            />
          </svg>

          {/* Center % Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {percentage === 100 && total > 0 ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-label="100% completed" />
            ) : (
              <>
                <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                  {percentage}%
                </span>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                  done
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
