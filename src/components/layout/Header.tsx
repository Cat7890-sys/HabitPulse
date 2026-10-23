import React from 'react';
import {
  Flame,
  Plus,
  Sparkles,
  ShieldCheck,
  CalendarCheck2,
  LayoutList,
  BarChart3,
  Settings,
  Coins,
  Zap,
} from 'lucide-react';
import { ActiveTab, HabitComputedStats, UserProfile, LoginStreakData } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { COLOR_SCHEMES } from '../common/ColorMap';
import { useAuth } from '../../auth/useAuth';

interface Props {
  activeTab: ActiveTab;
  computedStats: HabitComputedStats[];
  profile?: UserProfile;
  tokenBalance?: number;
  loginStreak?: LoginStreakData;
  onOpenAddModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenWallet?: () => void;
  onTabChange?: (tab: ActiveTab) => void;
  pendingTodayCount?: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  computedStats,
  profile,
  tokenBalance = 0,
  loginStreak,
  onOpenAddModal,
  onOpenProfileModal,
  onOpenAuthModal,
  onOpenWallet,
  onTabChange,
  pendingTodayCount = 0,
}) => {
  const { user, isAdmin } = useAuth();

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
    ...(isAdmin ? [{ id: 'admin' as ActiveTab, label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md pt-safe transition-all">
      <div className="mx-auto flex max-w-md md:max-w-4xl lg:max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Left Section: Branding & Desktop Navigation Menu */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-8 min-w-0 shrink">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-emerald-500 text-emerald-400 dark:text-slate-950 shadow-xs shrink-0">
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h4l3-7 4 14 3-7h4" />
              </svg>
            </div>
            <div className="shrink-0">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                HabitPulse
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu alongside Branding */}
          {onTabChange && (
            <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800" aria-label="Main Navigation">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Section: Action Controls & User Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">
          {/* Token Wallet Badge / Button */}
          {onOpenWallet && (
            <button
              onClick={onOpenWallet}
              title={`HabitPulse Tokens: ${tokenBalance}. Click to open Token Wallet.`}
              aria-label={`Token Wallet: ${tokenBalance} tokens`}
              className="relative shrink-0 whitespace-nowrap z-10 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-2xs transition cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 shrink-0 fill-amber-500/20 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="shrink-0 tabular-nums">{tokenBalance}</span>
            </button>
          )}

          {/* Daily App Login Streak (Distinct from habit top streak flame) */}
          {loginStreak && loginStreak.currentStreak > 0 && (
            <div
              title={`Daily App Login Streak: ${loginStreak.currentStreak} consecutive days opening HabitPulse (Best: ${loginStreak.longestStreak}d)`}
              className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0"
            >
              <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="tabular-nums">{loginStreak.currentStreak}d</span>
            </div>
          )}

          {/* Sync Status Badge */}
          <SyncStatusBadge showText={false} className="hidden min-[480px]:inline-flex shrink-0" />

          {/* PWA Install Button */}
          <PWAInstallButton variant="button" />

          {/* Top Habit Streak Badge */}
          {topStreak > 0 && (
            <div
              title={`Your top current habit streak is ${topStreak} days!`}
              className="hidden min-[380px]:flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-2xs shrink-0"
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500/20 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="tabular-nums">{topStreak}</span>
            </div>
          )}

          {/* Cloud Account Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              title={user ? `Signed in as ${user.email}` : 'Sign In / Create Account'}
              aria-label="Cloud Account & Synchronization"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 cursor-pointer ${
                user
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {/* Admin Dashboard Button (Only visible to verified administrators) */}
          {isAdmin && onTabChange && (
            <button
              onClick={() => onTabChange('admin')}
              title="Open Admin Dashboard"
              aria-label="Admin Dashboard"
              className={`flex h-9 items-center gap-1.5 px-2.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 dark:bg-emerald-500 border-transparent text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-semibold">Admin</span>
            </button>
          )}

          {/* User Profile Avatar Icon */}
          {profile && onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              title={`Profile: ${profile.name}`}
              aria-label={`User Profile: ${profile.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-base border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 cursor-pointer"
            >
              <span>{profile.avatar || '👤'}</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition cursor-pointer shrink-0"
            aria-label="Add Habit"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
