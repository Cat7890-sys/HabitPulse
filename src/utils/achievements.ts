import { Habit, HabitLogs, HabitComputedStats, Achievement, Category } from '../types';
import { getTodayKey, addDaysToDateKey } from './date';

export function calculateAchievements(
  habits: Habit[],
  logs: HabitLogs,
  computedStats: HabitComputedStats[],
  categories: Category[] = []
): Achievement[] {
  // Aggregate Metrics
  const totalCompletions = Object.values(logs).reduce((total, habitDates) => {
    return total + Object.values(habitDates).filter(Boolean).length;
  }, 0);

  const maxCurrentStreak = computedStats.reduce((max, s) => Math.max(max, s.currentStreak), 0);
  const maxBestStreak = computedStats.reduce((max, s) => Math.max(max, s.bestStreak), 0);
  const activeHabitsCount = habits.filter((h) => !h.archived).length;

  // Distinct days with at least 1 check-in
  const activeDaysSet = new Set<string>();
  Object.values(logs).forEach((habitDates) => {
    Object.entries(habitDates).forEach(([dKey, isDone]) => {
      if (isDone) activeDaysSet.add(dKey);
    });
  });
  const totalActiveDays = activeDaysSet.size;

  // Check if user has habits with early morning reminders (<= 09:00) or evening reminders (>= 20:00)
  const hasEarlyMorningHabit = habits.some(
    (h) => !h.archived && h.reminderEnabled && h.reminderTime && h.reminderTime <= '09:00'
  );
  const hasNightOwlHabit = habits.some(
    (h) => !h.archived && h.reminderEnabled && h.reminderTime && h.reminderTime >= '20:00'
  );

  // Check distinct categories in use
  const usedCategoryIds = new Set(
    habits.filter((h) => !h.archived && (h.categoryId || h.category)).map((h) => h.categoryId || h.category)
  );

  // Check 100% days count (days where all scheduled habits were completed)
  let perfectDaysCount = 0;
  const today = getTodayKey();
  for (let i = 0; i < 60; i++) {
    const dKey = addDaysToDateKey(today, -i);
    const scheduled = habits.filter((h) => !h.archived);
    if (scheduled.length > 0) {
      const allDone = scheduled.every((h) => !!(logs[h.id] && logs[h.id][dKey]));
      if (allDone) perfectDaysCount++;
    }
  }

  // Definition of achievements
  const rawDefinitions: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: Achievement['category'];
    tier: Achievement['tier'];
    target: number;
    currentValue: number;
  }[] = [
    {
      id: 'first_step',
      title: 'First Step',
      description: 'Log your very first habit completion',
      icon: '🌱',
      category: 'total',
      tier: 'bronze',
      target: 1,
      currentValue: totalCompletions,
    },
    {
      id: 'streak_3',
      title: 'Habit Starter',
      description: 'Reach a 3-day streak on any habit',
      icon: '🔥',
      category: 'streak',
      tier: 'bronze',
      target: 3,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'streak_5',
      title: '5-Day Streak',
      description: 'Maintain an active 5-day streak without breaking chain',
      icon: '⚡',
      category: 'streak',
      tier: 'bronze',
      target: 5,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'streak_7',
      title: 'One Week Warrior',
      description: 'Achieve a 7-day unbroken streak',
      icon: '🛡️',
      category: 'streak',
      tier: 'silver',
      target: 7,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'streak_14',
      title: 'Fortnight Champion',
      description: 'Maintain a 14-day streak on any habit',
      icon: '🌟',
      category: 'streak',
      tier: 'silver',
      target: 14,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'streak_30',
      title: 'Habit Master',
      description: 'Reach the golden 30-day streak milestone',
      icon: '🏆',
      category: 'streak',
      tier: 'gold',
      target: 30,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'streak_60',
      title: 'Unstoppable Force',
      description: 'Complete an incredible 60-day unbroken streak',
      icon: '👑',
      category: 'streak',
      tier: 'diamond',
      target: 60,
      currentValue: Math.max(maxCurrentStreak, maxBestStreak),
    },
    {
      id: 'total_25',
      title: 'Getting Serious',
      description: 'Log 25 lifetime habit check-ins',
      icon: '🎯',
      category: 'total',
      tier: 'bronze',
      target: 25,
      currentValue: totalCompletions,
    },
    {
      id: 'total_50',
      title: 'Halfway to Century',
      description: 'Log 50 lifetime habit completions',
      icon: '💫',
      category: 'total',
      tier: 'silver',
      target: 50,
      currentValue: totalCompletions,
    },
    {
      id: 'total_100',
      title: 'Centurion',
      description: 'Reach 100 total lifetime check-ins',
      icon: '💎',
      category: 'total',
      tier: 'gold',
      target: 100,
      currentValue: totalCompletions,
    },
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Configure and commit to a morning routine before 9:00 AM',
      icon: '🌅',
      category: 'time',
      tier: 'bronze',
      target: 1,
      currentValue: hasEarlyMorningHabit ? 1 : 0,
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Maintain an evening wind-down routine past 8:00 PM',
      icon: '🌙',
      category: 'time',
      tier: 'bronze',
      target: 1,
      currentValue: hasNightOwlHabit ? 1 : 0,
    },
    {
      id: 'perfect_days_3',
      title: 'Flawless Trio',
      description: 'Complete 100% of all scheduled habits for 3 full days',
      icon: '✨',
      category: 'consistency',
      tier: 'silver',
      target: 3,
      currentValue: perfectDaysCount,
    },
    {
      id: 'category_diverse',
      title: 'Well-Rounded',
      description: 'Build habits across 3 or more life categories',
      icon: '🌈',
      category: 'mastery',
      tier: 'silver',
      target: 3,
      currentValue: usedCategoryIds.size,
    },
    {
      id: 'habit_architect',
      title: 'Habit Architect',
      description: 'Create and actively manage 5+ daily habits',
      icon: '🏗️',
      category: 'mastery',
      tier: 'bronze',
      target: 5,
      currentValue: activeHabitsCount,
    },
  ];

  return rawDefinitions.map((def) => {
    const isUnlocked = def.currentValue >= def.target;
    const progressPercentage = Math.min(100, Math.round((def.currentValue / def.target) * 100));

    return {
      ...def,
      isUnlocked,
      progressPercentage,
    };
  });
}
