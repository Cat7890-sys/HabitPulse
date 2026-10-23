import React from 'react';
import { CalendarCheck2, LayoutList, BarChart3, Settings } from 'lucide-react';
import { ActiveTab } from '../../types';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingTodayCount: number;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  pendingTodayCount,
}) => {
  const navItems = [
    {
      id: 'today' as ActiveTab,
      label: 'Today',
      icon: CalendarCheck2,
      badge: pendingTodayCount > 0 ? pendingTodayCount : undefined,
    },
    {
      id: 'habits' as ActiveTab,
      label: 'Habits',
      icon: LayoutList,
    },
    {
      id: 'stats' as ActiveTab,
      label: 'Stats',
      icon: BarChart3,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active subtle background */}
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 -z-10" />
              )}

              <div className="relative">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} aria-hidden="true" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
