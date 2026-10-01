import React from 'react';
import { Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

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
  const size = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getMotivationalText = () => {
    if (total === 0) return 'No habits scheduled for this day';
    if (percentage === 100) return isToday ? 'All done for today! Outstanding! 🎉' : 'All habits completed! 🎉';
    if (percentage >= 75) return 'Almost there! Just a little push! 🔥';
    if (percentage >= 50) return 'Halfway done! Keep the momentum going! 💪';
    if (percentage > 0) return 'Great start! Keep building your streak! ✨';
    return isToday ? 'Tap a habit to start your day!' : 'No habits completed yet';
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left text metrics */}
        <div className="flex-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {percentage === 100 ? (
              <Trophy className="h-3 w-3 text-amber-500" />
            ) : (
              <Sparkles className="h-3 w-3 text-indigo-500" />
            )}
            <span>{isToday ? 'Today’s Goal' : 'Daily Progress'}</span>
          </div>

          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {completed}
            </span>
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
              of {total} done
            </span>
          </div>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
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
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Animated Progress Gradient Bar */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#progress-gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center % Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {percentage === 100 ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-500 animate-in zoom-in-75 duration-300" />
            ) : (
              <>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {percentage}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  DONE
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
