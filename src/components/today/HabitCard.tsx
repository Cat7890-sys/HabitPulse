import React from 'react';
import {
  Check,
  Flame,
  Bell,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Target,
  Tag,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Layers,
} from 'lucide-react';
import { Habit, HabitComputedStats, Category } from '../../types';
import { COLOR_SCHEMES } from '../common/ColorMap';
import { DAYS_SHORT } from '../../utils/date';

interface Props {
  stats: HabitComputedStats;
  dateKey: string;
  isCompleted: boolean;
  categories?: Category[];
  onToggle: (habitId: string, dateKey: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onCompleteGoal?: (habitId: string) => void;
}

export const HabitCard: React.FC<Props> = ({
  stats,
  dateKey,
  isCompleted,
  categories = [],
  onToggle,
  onEdit,
  onDelete,
  onCompleteGoal,
}) => {
  const { habit, currentStreak, weeklyProgress, goalStatus, remainingTimeText, isOverdue, goalProgress } = stats;
  const habitColor = COLOR_SCHEMES[habit.color] || COLOR_SCHEMES.indigo;
  const [showMenu, setShowMenu] = React.useState(false);

  // Match category for color-coded tag
  const category = React.useMemo(() => {
    if (habit.categoryId) {
      return categories.find((c) => c.id === habit.categoryId);
    }
    if (habit.category) {
      return categories.find((c) => c.name.toLowerCase() === habit.category?.toLowerCase());
    }
    return undefined;
  }, [habit, categories]);

  const categoryColor = category ? COLOR_SCHEMES[category.color] || habitColor : habitColor;

  // Format frequency label
  const getFrequencyLabel = () => {
    if (habit.goalType === 'one_time') return 'One-Time Task';
    if (habit.frequency.type === 'daily') return 'Everyday';
    if (habit.frequency.type === 'times_per_week')
      return `${habit.frequency.timesPerWeek}x / week`;
    if (habit.frequency.type === 'weekdays' && habit.frequency.days) {
      if (habit.frequency.days.length === 5 && !habit.frequency.days.includes(0) && !habit.frequency.days.includes(6)) {
        return 'Weekdays';
      }
      if (habit.frequency.days.length === 2 && habit.frequency.days.includes(0) && habit.frequency.days.includes(6)) {
        return 'Weekends';
      }
      return habit.frequency.days.map((d) => DAYS_SHORT[d]).join(', ');
    }
    return 'Custom';
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-colors ${
        showMenu ? 'z-30 overflow-visible' : 'overflow-visible'
      } ${
        isOverdue && !isCompleted
          ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
          : isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/80 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Emoji and Details */}
          <div
            onClick={() => onToggle(habit.id, dateKey)}
            className="flex items-start gap-3.5 flex-1 min-w-0 cursor-pointer select-none"
          >
            {/* Emoji Avatar with habit color accent */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-xs transition-transform group-active:scale-95 mt-0.5 ${
                isCompleted
                  ? 'bg-slate-200/70 dark:bg-slate-800/70 saturate-50'
                  : `${habitColor.bgSubtle}`
              }`}
            >
              <span>{habit.emoji}</span>
            </div>

            {/* Title & Metadata badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm font-bold truncate transition-colors ${
                    isCompleted
                      ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400/60'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {habit.name}
                </h3>

                {habit.goalType === 'one_time' && (
                  <span className="shrink-0 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-600 dark:text-blue-400">
                    Task
                  </span>
                )}
              </div>

              {/* Habit Description (if available) */}
              {habit.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {habit.description}
                </p>
              )}

              {/* Habit Note (if available) */}
              {habit.note && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Note:</span>
                  <span>{habit.note}</span>
                </p>
              )}

              {/* Badges / Subtitle */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {/* Streak Badge (for recurring habits) */}
                {habit.goalType !== 'one_time' && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      currentStreak > 0
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Flame className={`h-3 w-3 ${currentStreak > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} aria-hidden="true" />
                    <span className="tabular-nums">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
                  </span>
                )}

                {/* Target Deadline Badge */}
                {remainingTimeText && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] border ${
                      isOverdue
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                        : goalStatus === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                        : remainingTimeText.includes('today') || remainingTimeText.includes('Due in')
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    ) : goalStatus === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>{remainingTimeText}</span>
                  </span>
                )}

                {/* Color-Coded Category Tag */}
                {category ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${categoryColor.bgSubtle}`}
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </span>
                ) : habit.category ? (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-[10px] text-slate-600 dark:text-slate-300">
                    <Tag className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                    <span>{habit.category}</span>
                  </span>
                ) : null}

                {/* Frequency Badge */}
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-[10px] text-slate-600 dark:text-slate-300">
                  <Calendar className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                  <span>{getFrequencyLabel()}</span>
                </span>

                {/* Reminder time if enabled */}
                {habit.reminderEnabled && habit.reminderTime && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-medium text-[10px]">
                    <Bell className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                    <span>{habit.reminderTime}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Check-off Button & Quick Menu */}
          <div className="flex items-center gap-2">
            {/* Menu Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  showMenu
                    ? 'bg-slate-200/80 dark:bg-slate-700 text-slate-900 dark:text-white relative z-50 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Habit Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100">
                    {onCompleteGoal && !habit.isGoalCompleted && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onCompleteGoal(habit.id);
                        }}
                        className="relative z-10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 active:scale-[0.98] transition-all cursor-pointer text-left"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Complete Goal</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(habit);
                      }}
                      className="relative z-10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Edit Habit</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(habit.id);
                      }}
                      className="relative z-10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Large Tap Target Checkbox Button */}
            <button
              onClick={() => onToggle(habit.id, dateKey)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isCompleted
                  ? `${habitColor.bg} ${habitColor.border} text-white shadow-2xs`
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-transparent hover:border-emerald-500'
              }`}
              aria-label={isCompleted ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
            >
              <Check
                className={`h-5 w-5 stroke-[3] transition-all duration-200 ${
                  isCompleted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Goal Completions Progress (if targetCompletions is set) */}
        {goalProgress && (
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Target className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Target Completions:</span>
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {goalProgress.completed} / {goalProgress.target} ({goalProgress.percentage}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${habitColor.bg}`}
                style={{ width: `${goalProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Visual Indicator for Weekly Target (times_per_week) */}
        {habit.frequency.type === 'times_per_week' && weeklyProgress && (
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-indigo-500" />
                <span>Weekly Goal:</span>
              </span>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1">
                {Array.from({ length: weeklyProgress.target }).map((_, idx) => {
                  const isFilled = idx < weeklyProgress.completed;
                  return (
                    <span
                      key={idx}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        isFilled
                          ? `${habitColor.bg} shadow-xs`
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      title={`Session ${idx + 1} of ${weeklyProgress.target}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Fraction & Status Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-extrabold ${
                  weeklyProgress.isTargetMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {weeklyProgress.completed}/{weeklyProgress.target} this week
              </span>

              {weeklyProgress.isTargetMet && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Target Met!</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
