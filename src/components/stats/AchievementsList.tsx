import React, { useState, useMemo } from 'react';
import { Award, Trophy, Lock, CheckCircle2, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { Habit, HabitLogs, HabitComputedStats, Achievement, Category } from '../../types';
import { calculateAchievements } from '../../utils/achievements';

interface Props {
  habits: Habit[];
  logs: HabitLogs;
  computedStats: HabitComputedStats[];
  categories?: Category[];
}

export const AchievementsList: React.FC<Props> = ({
  habits,
  logs,
  computedStats,
  categories = [],
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalAchievement, setActiveModalAchievement] = useState<Achievement | null>(null);

  const achievements = useMemo(() => {
    return calculateAchievements(habits, logs, computedStats, categories);
  }, [habits, logs, computedStats, categories]);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const percentageUnlocked = Math.round((unlockedCount / achievements.length) * 100);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      const matchesStatus =
        selectedFilter === 'all' ||
        (selectedFilter === 'unlocked' && a.isUnlocked) ||
        (selectedFilter === 'locked' && !a.isUnlocked);

      const matchesCat =
        selectedCategory === 'all' || a.category === selectedCategory;

      return matchesStatus && matchesCat;
    });
  }, [achievements, selectedFilter, selectedCategory]);

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'diamond':
        return {
          bg: 'bg-cyan-50 dark:bg-cyan-950/40',
          border: 'border-cyan-400 dark:border-cyan-600',
          text: 'text-cyan-600 dark:text-cyan-400',
          badge: 'bg-cyan-500 text-white',
          glow: 'shadow-cyan-500/20',
        };
      case 'gold':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-400 dark:border-amber-600',
          text: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-500 text-white',
          glow: 'shadow-amber-500/20',
        };
      case 'silver':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800/60',
          border: 'border-slate-300 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-500 text-white',
          glow: 'shadow-slate-500/20',
        };
      case 'bronze':
      default:
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-700',
          text: 'text-orange-700 dark:text-orange-400',
          badge: 'bg-orange-600 text-white',
          glow: 'shadow-orange-500/20',
        };
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Milestones & Achievements</span>
              <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                {unlockedCount}/{achievements.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Unlock badges as you build life-changing habits
            </p>
          </div>
        </div>

        {/* Unlocked Progress Pill */}
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
            {percentageUnlocked}% Unlocked
          </span>
          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
            <div
              style={{ width: `${percentageUnlocked}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-1.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All ({achievements.length})
          </button>
          <button
            onClick={() => setSelectedFilter('unlocked')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'unlocked'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Unlocked ({unlockedCount})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('locked')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'locked'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Lock className="h-3 w-3" />
            <span>Locked ({achievements.length - unlockedCount})</span>
          </button>
        </div>
      </div>

      {/* Achievement Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {filteredAchievements.map((ach) => {
          const tier = getTierColor(ach.tier);

          return (
            <div
              key={ach.id}
              onClick={() => setActiveModalAchievement(ach)}
              className={`group relative rounded-2xl p-3.5 border transition cursor-pointer flex items-start gap-3 select-none ${
                ach.isUnlocked
                  ? `${tier.bg} ${tier.border} shadow-sm hover:shadow-md hover:scale-[1.01]`
                  : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Badge Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl border ${
                  ach.isUnlocked
                    ? `${tier.bg} ${tier.border} shadow-xs`
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 grayscale'
                }`}
              >
                <span>{ach.icon}</span>
              </div>

              {/* Text & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs font-bold truncate ${
                      ach.isUnlocked
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </h4>
                  {ach.isUnlocked ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-extrabold shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 text-[9px] font-bold shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      <span>{ach.progressPercentage}%</span>
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {ach.description}
                </p>

                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${ach.progressPercentage}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        ach.isUnlocked ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">
                    {Math.min(ach.currentValue, ach.target)}/{ach.target}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Achievement Detail Dialog */}
      {activeModalAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 p-5 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-4xl shadow-md">
              {activeModalAchievement.icon}
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
              {activeModalAchievement.title}
            </h3>

            <span className="mt-1 inline-block rounded-full bg-amber-100 dark:bg-amber-950 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {activeModalAchievement.tier} Tier Milestone
            </span>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {activeModalAchievement.description}
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Goal Progress:</span>
              <strong className="text-amber-600 dark:text-amber-400 font-extrabold">
                {activeModalAchievement.currentValue} / {activeModalAchievement.target} (
                {activeModalAchievement.progressPercentage}%)
              </strong>
            </div>

            <button
              onClick={() => setActiveModalAchievement(null)}
              className="mt-5 w-full rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
