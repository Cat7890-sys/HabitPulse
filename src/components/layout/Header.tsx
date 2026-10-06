import React from 'react';
import {
  Flame,
  Plus,
  Sparkles,
  User,
  ShieldCheck,
  CalendarCheck2,
  LayoutList,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ActiveTab, HabitComputedStats, UserProfile } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { COLOR_SCHEMES } from '../common/ColorMap';
import { useAuth } from '../../auth/useAuth';

interface Props {
  activeTab: ActiveTab;
  computedStats: HabitComputedStats[];
  profile?: UserProfile;
  onOpenAddModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: () => void;
  onTabChange?: (tab: ActiveTab) => void;
  pendingTodayCount?: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  computedStats,
  profile,
  onOpenAddModal,
  onOpenProfileModal,
  onOpenAuthModal,
  onTabChange,
  pendingTodayCount = 0,
}) => {
  const { user } = useAuth();

  // Compute max active streak among all habits
  const topStreak = computedStats.reduce(
    (max, stat) => Math.max(max, stat.currentStreak),
    0
  );

  const scheme = profile
    ? COLOR_SCHEMES[profile.themeColor || 'indigo'] || COLOR_SCHEMES.indigo
    : COLOR_SCHEMES.indigo;

  const desktopNavItems = [
    { id: 'today' as ActiveTab, label: 'Today', icon: CalendarCheck2, badge: pendingTodayCount > 0 ? pendingTodayCount : undefined },
    { id: 'habits' as ActiveTab, label: 'Habits', icon: LayoutList },
    { id: 'stats' as ActiveTab, label: 'Stats', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md pt-safe transition-all">
      <div className="mx-auto flex max-w-md md:max-w-4xl lg:max-w-6xl items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/25 shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
              HabitPulse
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
              {activeTab === 'today' && 'Daily Progress'}
              {activeTab === 'habits' && 'Manage Habits'}
              {activeTab === 'stats' && 'Insights & Milestones'}
              {activeTab === 'settings' && 'App Preferences'}
            </p>
          </div>
        </div>

        {/* Right Section: Flexbox distribution for Top-Right Horizontal Nav & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {/* Desktop Horizontal Navigation Bar (Top-Right on md/lg screens) */}
          {onTabChange && (
            <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 p-1 border border-slate-200/60 dark:border-slate-800 mr-2">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-extrabold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Sync Status Badge */}
          <SyncStatusBadge showText={false} />

          {/* PWA Install Button */}
          <PWAInstallButton variant="button" />

          {/* Top Streak Badge */}
          {topStreak > 0 && (
            <div
              title={`Your top current streak is ${topStreak} days!`}
              className="flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{topStreak}</span>
            </div>
          )}

          {/* Cloud Account Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              title={user ? `Signed in as ${user.email}` : 'Sign In / Create Account'}
              aria-label="Cloud Account & Synchronization"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition hover:scale-105 active:scale-95 cursor-pointer ${
                user
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
            </button>
          )}

          {/* User Profile Avatar Icon */}
          {profile && onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              title={`Profile: ${profile.name}`}
              aria-label="User Profile"
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-base sm:text-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${scheme.bgSubtle}`}
            >
              <span>{profile.avatar || '🦁'}</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition cursor-pointer shrink-0"
            aria-label="Add Habit"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
