import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Habit,
  HabitLogs,
  AppSettings,
  HabitComputedStats,
  Category,
  UserProfile,
  LoginStreakData,
} from '../types';
import {
  storage,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_PROFILE,
  DEFAULT_LOGIN_STREAK,
  INITIAL_HABITS,
  generateStarterLogs,
} from '../storage/storage';
import { getTodayKey } from '../utils/date';
import { computeHabitStats, isHabitScheduledOnDate } from '../utils/streaks';
import { sound, triggerHaptic } from '../utils/sound';
import { checkHabitReminders } from '../utils/notifications';
import { useMilestones } from './useMilestones';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [logs, setLogs] = useState<HabitLogs>(() => generateStarterLogs(INITIAL_HABITS));
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loginStreak, setLoginStreak] = useState<LoginStreakData>(DEFAULT_LOGIN_STREAK);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getTodayKey());
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Hook for Milestones & Token Ledger Management
  const {
    milestones,
    transactions,
    milestoneClaims,
    tokenBalance,
    totalTokensEarned,
    newlyAwardedMilestone,
    setNewlyAwardedMilestone,
    evaluateAndAwardMilestones,
    getHabitProgress,
    getNextMilestoneForHabit,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    refreshMilestones,
  } = useMilestones();

  // Initial load & recording daily login
  const loadData = useCallback(async () => {
    try {
      const [
        savedHabits,
        savedLogs,
        savedCategories,
        savedSettings,
        savedProfile,
        recordedLogin,
      ] = await Promise.all([
        storage.getHabits(),
        storage.getLogs(),
        storage.getCategories(),
        storage.getSettings(),
        storage.getProfile(),
        storage.recordDailyLogin(),
      ]);

      if (savedHabits && savedHabits.length > 0) setHabits(savedHabits);
      if (savedLogs) setLogs(savedLogs);
      if (savedCategories && savedCategories.length > 0) setCategories(savedCategories);
      if (savedSettings) setSettings(savedSettings);
      if (savedProfile) setProfile(savedProfile);
      if (recordedLogin) setLoginStreak(recordedLogin);
    } catch (e) {
      console.error('Failed to load habit data from storage:', e);
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
    const handleProfileChange = () => storage.getProfile().then(setProfile);
    const handleLoginStreakChange = () => storage.getLoginStreak().then(setLoginStreak);
    const handleReset = () => {
      loadData();
      refreshMilestones();
    };

    window.addEventListener('habitpulse-habits-changed', handleHabitsChange);
    window.addEventListener('habitpulse-logs-changed', handleLogsChange);
    window.addEventListener('habitpulse-categories-changed', handleCategoriesChange);
    window.addEventListener('habitpulse-settings-changed', handleSettingsChange);
    window.addEventListener('habitpulse-profile-changed', handleProfileChange);
    window.addEventListener('habitpulse-login-streak-changed', handleLoginStreakChange);
    window.addEventListener('habitpulse-reset', handleReset);

    return () => {
      window.removeEventListener('habitpulse-habits-changed', handleHabitsChange);
      window.removeEventListener('habitpulse-logs-changed', handleLogsChange);
      window.removeEventListener('habitpulse-categories-changed', handleCategoriesChange);
      window.removeEventListener('habitpulse-settings-changed', handleSettingsChange);
      window.removeEventListener('habitpulse-profile-changed', handleProfileChange);
      window.removeEventListener('habitpulse-login-streak-changed', handleLoginStreakChange);
      window.removeEventListener('habitpulse-reset', handleReset);
    };
  }, [loadData, refreshMilestones]);

  // Periodic reminder checking
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    // Check active habits only
    const activeHabits = habits.filter((h) => !h.archived);
    checkHabitReminders(activeHabits, logs);
    const interval = setInterval(() => {
      checkHabitReminders(activeHabits, logs);
    }, 15000);

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

  // Computed stats for ALL habits
  const allComputedStats: HabitComputedStats[] = useMemo(() => {
    return habits.map((habit) => computeHabitStats(habit, logs, selectedDateKey));
  }, [habits, logs, selectedDateKey]);

  // Computed stats for ACTIVE habits only
  const computedStats: HabitComputedStats[] = useMemo(() => {
    return allComputedStats.filter((s) => !s.habit.archived);
  }, [allComputedStats]);

  // Computed stats for ARCHIVED habits only
  const archivedComputedStats: HabitComputedStats[] = useMemo(() => {
    return allComputedStats.filter((s) => s.habit.archived);
  }, [allComputedStats]);

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

      const targetHabit = habits.find((h) => h.id === habitId);

      // Sound and Vibration API Haptic feedback
      if (nextVal) {
        sound.playCheck(settings.soundEnabled);
        triggerHaptic('complete', settings.hapticsEnabled);

        // If this habit is a one-time task, complete its goal
        if (targetHabit && targetHabit.goalType === 'one_time' && !targetHabit.isGoalCompleted) {
          const updatedHabit: Habit = {
            ...targetHabit,
            isGoalCompleted: true,
            goalCompletedAt: new Date().toISOString(),
          };
          const updatedList = habits.map((h) => (h.id === habitId ? updatedHabit : h));
          setHabits(updatedList);
          await storage.saveHabits(updatedList);
        }

        // EVALUATE TOKEN MILESTONES (ONLY when habit is actually completed!)
        if (targetHabit && !targetHabit.archived) {
          await evaluateAndAwardMilestones(targetHabit, newLogs, dateKey, {
            soundEnabled: settings.soundEnabled,
            hapticsEnabled: settings.hapticsEnabled,
          });
        }

        // Check if this check completes all scheduled habits for this date
        const scheduledToday = habits.filter(
          (h) => !h.archived && isHabitScheduledOnDate(h, dateKey)
        );
        const allCompletedNow = scheduledToday.every(
          (h) => (h.id === habitId ? nextVal : !!(newLogs[h.id] && newLogs[h.id][dateKey]))
        );

        if (allCompletedNow && scheduledToday.length > 0 && !newlyAwardedMilestone) {
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

        // If unchecking a one-time task that was marked completed today
        if (targetHabit && targetHabit.goalType === 'one_time' && targetHabit.isGoalCompleted) {
          const updatedHabit: Habit = {
            ...targetHabit,
            isGoalCompleted: false,
            goalCompletedAt: undefined,
          };
          const updatedList = habits.map((h) => (h.id === habitId ? updatedHabit : h));
          setHabits(updatedList);
          await storage.saveHabits(updatedList);
        }
      }
    },
    [
      logs,
      habits,
      selectedDateKey,
      settings,
      evaluateAndAwardMilestones,
      newlyAwardedMilestone,
    ]
  );

  // Add new habit
  const addHabit = useCallback(
    async (newHabitData: Omit<Habit, 'id' | 'createdAt'>) => {
      const newHabit: Habit = {
        ...newHabitData,
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        archived: false,
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
      const updated = habits.map((h) =>
        h.id === habitId ? { ...h, ...updates } : h
      );
      setHabits(updated);
      await storage.saveHabits(updated);
    },
    [habits]
  );

  // Toggle archive status
  const toggleArchiveHabit = useCallback(
    async (habitId: string) => {
      const target = habits.find((h) => h.id === habitId);
      if (!target) return;
      const nextArchived = !target.archived;
      const updated = habits.map((h) =>
        h.id === habitId ? { ...h, archived: nextArchived } : h
      );
      setHabits(updated);
      await storage.saveHabits(updated);

      if (nextArchived) {
        sound.playUncheck(settings.soundEnabled);
        triggerHaptic('uncheck', settings.hapticsEnabled);
      } else {
        sound.playCheck(settings.soundEnabled);
        triggerHaptic('complete', settings.hapticsEnabled);
      }
    },
    [habits, settings]
  );

  // Mark a goal as completed directly
  const completeGoal = useCallback(
    async (habitId: string) => {
      const target = habits.find((h) => h.id === habitId);
      if (!target) return;

      const updated: Habit = {
        ...target,
        isGoalCompleted: true,
        goalCompletedAt: new Date().toISOString(),
      };
      const updatedList = habits.map((h) => (h.id === habitId ? updated : h));
      setHabits(updatedList);
      await storage.saveHabits(updatedList);

      sound.playCelebration(settings.soundEnabled);
      triggerHaptic('celebration', settings.hapticsEnabled);
    },
    [habits, settings]
  );

  // Delete habit permanently
  const deleteHabit = useCallback(
    async (habitId: string) => {
      const updated = habits.filter((h) => h.id !== habitId);
      setHabits(updated);
      await storage.saveHabits(updated);

      // Clean up logs for deleted habit
      const newLogs = { ...logs };
      delete newLogs[habitId];
      setLogs(newLogs);
      await storage.saveLogs(newLogs);
    },
    [habits, logs]
  );

  // Add custom category
  const addCategory = useCallback(
    async (newCategoryData: Omit<Category, 'id'>) => {
      const newCat: Category = {
        ...newCategoryData,
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
      const updated = categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      setCategories(updated);
      await storage.saveCategories(updated);

      if (updates.name || updates.color) {
        const updatedHabits = habits.map((h) => {
          if (h.categoryId === id) {
            return {
              ...h,
              category: updates.name || h.category,
            };
          }
          return h;
        });
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

  // Update profile
  const updateProfile = useCallback(
    async (newProfile: UserProfile) => {
      setProfile(newProfile);
      await storage.saveProfile(newProfile);
    },
    []
  );

  return {
    habits,
    categories,
    logs,
    settings,
    profile,
    milestones,
    transactions,
    tokenBalance,
    totalTokensEarned,
    milestoneClaims,
    loginStreak,
    isLoading,
    selectedDateKey,
    setSelectedDateKey,
    allComputedStats,
    computedStats,
    archivedComputedStats,
    todayHabits,
    todayProgress,
    toggleHabit,
    addHabit,
    updateHabit,
    toggleArchiveHabit,
    completeGoal,
    deleteHabit,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    getHabitProgress,
    getNextMilestoneForHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    updateProfile,
    refreshData: loadData,
    showCelebrationModal,
    setShowCelebrationModal,
    newlyAwardedMilestone,
    setNewlyAwardedMilestone,
  };
}
