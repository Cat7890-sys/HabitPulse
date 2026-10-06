import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Flame,
  Trophy,
  Calendar,
  Bell,
  Edit3,
  Trash2,
  CheckCircle2,
  Layers,
  Tag,
  Settings2,
  ArrowUpDown,
  X,
  Sparkles,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { Habit, HabitComputedStats, Category } from '../../types';
import { COLOR_SCHEMES } from '../common/ColorMap';
import { DAYS_SHORT } from '../../utils/date';

export type HabitSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'streak-desc'
  | 'best-desc'
  | 'rate-desc'
  | 'created-desc'
  | 'created-asc';

interface Props {
  habits: Habit[];
  categories: Category[];
  computedStats: HabitComputedStats[];
  onOpenAddModal: () => void;
  onEditHabit: (habit: Habit) => void;
  onToggleArchiveHabit?: (habitId: string) => void;
  onRequestDelete: (habit: Habit) => void;
  onOpenCategoryManager: () => void;
}

export const HabitListScreen: React.FC<Props> = ({
  habits,
  categories,
  computedStats,
  onOpenAddModal,
  onEditHabit,
  onToggleArchiveHabit,
  onRequestDelete,
  onOpenCategoryManager,
}) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isGroupedByCategory, setIsGroupedByCategory] = useState(false);
  const [sortBy, setSortBy] = useState<HabitSortOption>('streak-desc');

  // Counts
  const activeCount = useMemo(() => habits.filter((h) => !h.archived).length, [habits]);
  const archivedCount = useMemo(() => habits.filter((h) => h.archived).length, [habits]);

  // Helper map: categoryId or name -> Category object
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => {
      map.set(c.id, c);
      map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, [categories]);

  // Helper to find category for a habit
  const getHabitCategory = (habit: Habit): Category | undefined => {
    if (habit.categoryId && categoryMap.has(habit.categoryId)) {
      return categoryMap.get(habit.categoryId);
    }
    if (habit.category && categoryMap.has(habit.category.toLowerCase())) {
      return categoryMap.get(habit.category.toLowerCase());
    }
    return undefined;
  };

  // Filtered & Sorted stats
  const processedStats = useMemo(() => {
    // 0. Filter active vs archived
    const tabFiltered = computedStats.filter((stat) => {
      if (activeTabFilter === 'archived') return !!stat.habit.archived;
      return !stat.habit.archived;
    });

    // 1. Search & Category Filter
    const filtered = tabFiltered.filter((stat) => {
      const cat = getHabitCategory(stat.habit);
      const catName = cat?.name || stat.habit.category || 'General';

      const matchesSearch =
        stat.habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategoryId === 'all' ||
        stat.habit.categoryId === selectedCategoryId ||
        (cat && cat.id === selectedCategoryId) ||
        (!cat && selectedCategoryId === 'uncategorized');

      return matchesSearch && matchesCategory;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.habit.name.localeCompare(b.habit.name);
        case 'name-desc':
          return b.habit.name.localeCompare(a.habit.name);
        case 'streak-desc':
          if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
          return b.bestStreak - a.bestStreak;
        case 'best-desc':
          if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
          return b.currentStreak - a.currentStreak;
        case 'rate-desc':
          return b.completionRate - a.completionRate;
        case 'created-desc':
          return new Date(b.habit.createdAt || 0).getTime() - new Date(a.habit.createdAt || 0).getTime();
        case 'created-asc':
          return new Date(a.habit.createdAt || 0).getTime() - new Date(a.habit.createdAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [computedStats, activeTabFilter, searchQuery, selectedCategoryId, sortBy, categoryMap]);

  // Grouped stats by category
  const groupedStats = useMemo(() => {
    if (!isGroupedByCategory) return null;
    const groups: {
      category: Category | { id: string; name: string; color: 'indigo'; emoji: string };
      stats: HabitComputedStats[];
    }[] = [];

    // Group for each defined category
    categories.forEach((cat) => {
      const statsInCat = processedStats.filter((s) => {
        const habitCat = getHabitCategory(s.habit);
        return habitCat?.id === cat.id;
      });
      if (statsInCat.length > 0) {
        groups.push({ category: cat, stats: statsInCat });
      }
    });

    // Catch uncategorized habits if any
    const uncategorized = processedStats.filter((s) => !getHabitCategory(s.habit));
    if (uncategorized.length > 0) {
      groups.push({
        category: { id: 'uncategorized', name: 'Other', color: 'indigo', emoji: '📦' },
        stats: uncategorized,
      });
    }

    return groups;
  }, [processedStats, isGroupedByCategory, categories, categoryMap]);

  const getFrequencyLabel = (habit: Habit) => {
    if (habit.frequency.type === 'daily') return 'Everyday';
    if (habit.frequency.type === 'times_per_week') return `${habit.frequency.timesPerWeek}x / week`;
    if (habit.frequency.type === 'weekdays' && habit.frequency.days) {
      if (habit.frequency.days.length === 5 && !habit.frequency.days.includes(0) && !habit.frequency.days.includes(6)) {
        return 'Weekdays';
      }
      return habit.frequency.days.map((d) => DAYS_SHORT[d]).join(', ');
    }
    return 'Custom';
  };

  const renderHabitCard = (stat: HabitComputedStats) => {
    const { habit, currentStreak, bestStreak, totalCompletions, completionRate } = stat;
    const habitColor = COLOR_SCHEMES[habit.color] || COLOR_SCHEMES.indigo;
    const category = getHabitCategory(habit);
    const categoryColor = category ? COLOR_SCHEMES[category.color] || habitColor : habitColor;
    const isArchived = !!habit.archived;

    return (
      <div
        key={habit.id}
        className={`rounded-2xl border p-4 shadow-xs hover:shadow-md transition ${
          isArchived
            ? 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90'
        }`}
      >
        {/* Top Row: Icon, Title, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-xs ${habitColor.bgSubtle}`}
            >
              {habit.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {habit.name}
                </h4>
                {isArchived && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                    <Archive className="h-2.5 w-2.5" />
                    <span>Archived</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {/* Category Tag Badge */}
                {category ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${categoryColor.bgSubtle}`}
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </span>
                ) : habit.category ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <Tag className="h-2.5 w-2.5" />
                    <span>{habit.category}</span>
                  </span>
                ) : null}

                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-medium">
                  <Calendar className="h-2.5 w-2.5 text-slate-400" />
                  {getFrequencyLabel(habit)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {/* Archive / Unarchive Button */}
            {onToggleArchiveHabit && (
              <button
                onClick={() => onToggleArchiveHabit(habit.id)}
                aria-label={isArchived ? "Restore Habit" : "Archive Habit"}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isArchived
                    ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
                title={isArchived ? 'Restore to Active Habits' : 'Archive Habit'}
              >
                {isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              onClick={() => onEditHabit(habit)}
              aria-label="Edit Habit"
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Edit Habit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onRequestDelete(habit)}
              aria-label="Delete Habit"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Delete Habit Permanently"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Stats Grid */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
              <Flame className="h-3 w-3 fill-amber-500" />
              <span>{currentStreak}d</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Current</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2">
            <div className="flex items-center justify-center gap-1 text-purple-500 font-bold text-xs">
              <Trophy className="h-3 w-3" />
              <span>{bestStreak}d</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Best</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2">
            <div className="flex items-center justify-center gap-1 text-emerald-500 font-bold text-xs">
              <CheckCircle2 className="h-3 w-3" />
              <span>{totalCompletions}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Total</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2">
            <div className="font-bold text-xs text-indigo-500">
              {completionRate}%
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Rate</span>
          </div>
        </div>

        {/* Reminder status */}
        {!isArchived && habit.reminderEnabled && habit.reminderTime && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
            <Bell className="h-3 w-3" />
            <span>Reminder set for {habit.reminderTime} every scheduled day</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Active vs Archived Segmented Control */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-1 max-w-md">
        <button
          onClick={() => setActiveTabFilter('active')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
            activeTabFilter === 'active'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Active Habits</span>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.2 text-[10px] text-indigo-600 dark:text-indigo-400">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTabFilter('archived')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
            activeTabFilter === 'archived'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="h-3.5 w-3.5" />
          <span>Archived</span>
          <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.2 text-[10px] text-amber-600 dark:text-amber-400">
            {archivedCount}
          </span>
        </button>
      </div>

      {/* Search Bar & Action Toolbar */}
      <div className="space-y-2.5">
        {/* Search Input with Clear Button */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTabFilter === 'archived' ? "Search archived habits..." : "Search habits or categories..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controls Row: Sorting Dropdown, Group Toggle, Category Manager */}
        <div className="flex items-center gap-2">
          {/* Sorting Dropdown */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-3 h-3.5 w-3.5 text-indigo-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as HabitSortOption)}
                aria-label="Sort habits by"
                className="w-full h-10 pl-8 pr-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs appearance-none"
              >
                <option value="streak-desc">🔥 Current Streak (High to Low)</option>
                <option value="best-desc">🏆 Best Streak (High to Low)</option>
                <option value="name-asc">🔤 Name (A to Z)</option>
                <option value="name-desc">🔤 Name (Z to A)</option>
                <option value="rate-desc">🎯 Completion Rate (%)</option>
                <option value="created-desc">⏳ Date Created (Newest)</option>
                <option value="created-asc">⏳ Date Created (Oldest)</option>
              </select>
              <div className="absolute right-3 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Group View Toggle Button */}
          <button
            onClick={() => setIsGroupedByCategory(!isGroupedByCategory)}
            className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
              isGroupedByCategory
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Group habits by category"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="text-xs">Group</span>
          </button>

          {/* Manage Categories Button */}
          <button
            onClick={onOpenCategoryManager}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Manage Custom Categories"
          >
            <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Categories</span>
          </button>
        </div>

        {/* Color-Coded Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {/* All filter pill */}
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All</span>
            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
              {activeTabFilter === 'archived' ? archivedCount : activeCount}
            </span>
          </button>

          {/* Individual Category Filter Pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const scheme = COLOR_SCHEMES[cat.color] || COLOR_SCHEMES.indigo;
            const count = habits.filter(
              (h) => (activeTabFilter === 'archived' ? !!h.archived : !h.archived) &&
                     (h.categoryId === cat.id || h.category === cat.name)
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? `${scheme.bg} text-white ${scheme.border} shadow-sm ring-2 ring-offset-1 ring-indigo-500`
                    : `${scheme.bgSubtle} hover:opacity-100 opacity-90`
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white/60 dark:bg-slate-900/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Habit Count Summary Bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {processedStats.length} {activeTabFilter === 'archived' ? 'Archived Habit' : 'Active Habit'}{processedStats.length === 1 ? '' : 's'}
        </span>
        {activeTabFilter === 'active' && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Habit</span>
          </button>
        )}
      </div>

      {/* Habits Grid (Responsive 1 column on mobile, 2 columns on tablet & desktop) */}
      {processedStats.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-2xl">
            {activeTabFilter === 'archived' ? '📦' : '✨'}
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeTabFilter === 'archived'
              ? 'No archived habits'
              : searchQuery
              ? 'No matching habits found'
              : 'No habits in this category'}
          </h4>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            {activeTabFilter === 'archived'
              ? 'When you archive habits you want to pause, they will appear here with all historical logs intact.'
              : searchQuery
              ? 'Try changing your search keywords or select another category.'
              : 'Create a habit assigned to this category to see it here.'}
          </p>
          {activeTabFilter === 'active' && (
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Habit</span>
            </button>
          )}
        </div>
      ) : isGroupedByCategory && groupedStats ? (
        /* Visual Category Groups View */
        <div className="space-y-6">
          {groupedStats.map(({ category, stats }) => {
            const scheme = COLOR_SCHEMES[category.color] || COLOR_SCHEMES.indigo;

            return (
              <div key={category.id} className="space-y-3">
                {/* Visual Category Header Banner */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${scheme.bgSubtle} border`}
                    >
                      <span>{category.emoji}</span>
                    </div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{category.name}</span>
                      <span className={`h-2 w-2 rounded-full ${scheme.bg}`} />
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {stats.length} {stats.length === 1 ? 'habit' : 'habits'}
                  </span>
                </div>

                {/* Habit Cards in 1 or 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {stats.map((stat) => renderHabitCard(stat))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Responsive Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {processedStats.map((stat) => renderHabitCard(stat))}
        </div>
      )}
    </div>
  );
};
