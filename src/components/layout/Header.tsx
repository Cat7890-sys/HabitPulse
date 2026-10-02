import React from 'react';
import { Flame, Plus, Sparkles, User } from 'lucide-react';
import { ActiveTab, HabitComputedStats, UserProfile } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { COLOR_SCHEMES } from '../common/ColorMap';

interface Props {
  activeTab: ActiveTab;
  computedStats: HabitComputedStats[];
  profile?: UserProfile;
  onOpenAddModal: () => void;
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  computedStats,
  profile,
  onOpenAddModal,
  onOpenProfileModal,
}) => {
  // Compute max active streak among all habits
  const topStreak = computedStats.reduce(
    (max, stat) => Math.max(max, stat.currentStreak),
    0
  );

  const scheme = profile ? COLOR_SCHEMES[profile.themeColor || 'indigo'] || COLOR_SCHEMES.indigo : COLOR_SCHEMES.indigo;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              HabitPulse
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
              {activeTab === 'today' && 'Daily Progress'}
              {activeTab === 'habits' && 'Manage Habits'}
              {activeTab === 'stats' && 'Insights & Milestones'}
              {activeTab === 'settings' && 'App Preferences'}
            </p>
          </div>
        </div>

        {/* Top Right Action & Streak Pill */}
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="button" />

          {/* Top Streak Badge */}
          {topStreak > 0 && (
            <div
              title={`Your top current streak is ${topStreak} days!`}
              className="flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{topStreak}</span>
            </div>
          )}

          {/* User Profile Avatar Icon */}
          {profile && onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              title={`Profile: ${profile.name}`}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${scheme.bgSubtle}`}
            >
              <span>{profile.avatar || '🦁'}</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
            aria-label="Add Habit"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
