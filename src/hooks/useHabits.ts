import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Habit, HabitLogs, AppSettings, HabitComputedStats, Category } from '../types';
import { storage, DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../storage/storage';
import { getTodayKey } from '../utils/date';
import { computeHabitStats, isHabitScheduledOnDate } from '../utils/streaks';
import { sound, triggerHaptic } from '../utils/sound';
import { checkHabitReminders } from '../utils/notifications';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [logs, setLogs] = useState<HabitLogs>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getTodayKey());
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Initial load
  const loadData = useCallback(async () => {
    try {
      const [savedHabits, savedLogs, savedCategories, savedSettings] = await Promise.all([
        storage.getHabits(),
        storage.getLogs(),
        storage.getCategories(),
        storage.getSettings(),
      ]);
      setHabits(savedHabits);
      setLogs(savedLogs);
      setCategories(savedCategories);
      setSettings(savedSettings);
    } catch (e) {
      console.error('Failed to load habit data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to custom events across windows / components
    const handleHabitsChange = () => storage.getHabits().then(setHabits);
    const handleLogsChange = () => storage.getLogs().then(setLogs);
    const handleCategoriesChange = () => storage.getCategories().then(setCategories);
    const handleSettingsChange = () => storage.getSettings().then(setSettings);
    const handleReset = () => loadData();

    window.addEventListener('habitpulse-habits-changed', handleHabitsChange);
    window.addEventListener('habitpulse-logs-changed', handleLogsChange);
    window.addEventListener('habitpulse-categories-changed', handleCategoriesChange);
    window.addEventListener('habitpulse-settings-changed', handleSettingsChange);
    window.addEventListener('habitpulse-reset', handleReset);

    return () => {
      window.removeEventListener('habitpulse-habits-changed', handleHabitsChange);
      window.removeEventListener('habitpulse-logs-changed', handleLogsChange);
      window.removeEventListener('habitpulse-categories-changed', handleCategoriesChange);
      window.removeEventListener('habitpulse-settings-changed', handleSettingsChange);
      window.removeEventListener('habitpulse-reset', handleReset);
    };
  }, [loadData]);

  // Periodic reminder checking
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    // Check on mount and every 30s
    checkHabitReminders(habits, logs);
    const interval = setInterval(() => {
      checkHabitReminders(habits, logs);
    }, 30000);

    return () => clearInterval(interval);
  }, [habits, logs, settings.notificationsEnabled]);

  // Apply dark mode class and color variables to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Computed stats for each habit
  const computedStats: HabitComputedStats[] = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    return activeHabits.map((habit) => computeHabitStats(habit, logs, selectedDateKey));
  }, [habits, logs, selectedDateKey]);

  // Today scheduled habits and progress calculation
  const todayHabits = useMemo(() => {
    return computedStats.filter((stat) =>
      isHabitScheduledOnDate(stat.habit, selectedDateKey)
    );
  }, [computedStats, selectedDateKey]);

  const todayProgress = useMemo(() => {
    const total = todayHabits.length;
    const completed = todayHabits.filter((h) =>
      !!(logs[h.habit.id] && logs[h.habit.id][selectedDateKey])
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [todayHabits, logs, selectedDateKey]);

  // Toggle habit completion status for a given date
  const toggleHabit = useCallback(
    async (habitId: string, dateKey: string = selectedDateKey) => {
      const currentVal = !!(logs[habitId] && logs[habitId][dateKey]);
      const nextVal = !currentVal;

      const newLogs = {
        ...logs,
        [habitId]: {
          ...(logs[habitId] || {}),
          [dateKey]: nextVal,
        },
      };

      setLogs(newLogs);
      await storage.saveLogs(newLogs);

      // Sound and Vibration API Haptic feedback
      if (nextVal) {
        sound.playCheck(settings.soundEnabled);
        triggerHaptic('complete', settings.hapticsEnabled);

        // Check if this check completes all scheduled habits for this date
        const scheduledToday = habits.filter(
          (h) => !h.archived && isHabitScheduledOnDate(h, dateKey)
        );
        const allCompletedNow = scheduledToday.every(
          (h) => (h.id === habitId ? nextVal : !!(newLogs[h.id] && newLogs[h.id][dateKey]))
        );

        if (allCompletedNow && scheduledToday.length > 0) {
          // Trigger celebration
          setTimeout(() => {
            sound.playCelebration(settings.soundEnabled);
            triggerHaptic('celebration', settings.hapticsEnabled);
            setShowCelebrationModal(true);

            // Confetti burst
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.7 },
                colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
              });
            } catch {}
          }, 200);
        }
      } else {
        sound.playUncheck(settings.soundEnabled);
        triggerHaptic('uncheck', settings.hapticsEnabled);
      }
    },
    [logs, habits, selectedDateKey, settings]
  );

  // Add new habit
  const addHabit = useCallback(
    async (newHabitData: Omit<Habit, 'id' | 'createdAt'>) => {
      const newHabit: Habit = {
        ...newHabitData,
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        order: habits.length,
      };

      const updated = [...habits, newHabit];
      setHabits(updated);
      await storage.saveHabits(updated);
      return newHabit;
    },
    [habits]
  );

  // Update existing habit
  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
      const updated = habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h));
      setHabits(updated);
      await storage.saveHabits(updated);
    },
    [habits]
  );

  // Delete habit
  const deleteHabit = useCallback(
    async (habitId: string) => {
      const updated = habits.filter((h) => h.id !== habitId);
      const newLogs = { ...logs };
      delete newLogs[habitId];

      setHabits(updated);
      setLogs(newLogs);
      await Promise.all([storage.saveHabits(updated), storage.saveLogs(newLogs)]);
    },
    [habits, logs]
  );

  // Add custom category
  const addCategory = useCallback(
    async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
      const newCat: Category = {
        ...categoryData,
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      await storage.saveCategories(updated);
      return newCat;
    },
    [categories]
  );

  // Update custom category
  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setCategories(updated);
      await storage.saveCategories(updated);

      // Also update habit category names if renamed
      if (updates.name) {
        const updatedHabits = habits.map((h) =>
          h.categoryId === id ? { ...h, category: updates.name } : h
        );
        setHabits(updatedHabits);
        await storage.saveHabits(updatedHabits);
      }
    },
    [categories, habits]
  );

  // Delete custom category
  const deleteCategory = useCallback(
    async (id: string) => {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      await storage.saveCategories(updated);
    },
    [categories]
  );

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await storage.saveSettings(updated);
    },
    [settings]
  );

  return {
    habits,
    categories,
    logs,
    settings,
    isLoading,
    selectedDateKey,
    setSelectedDateKey,
    computedStats,
    todayHabits,
    todayProgress,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    refreshData: loadData,
    showCelebrationModal,
    setShowCelebrationModal,
  };
}
