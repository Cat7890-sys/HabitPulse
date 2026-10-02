export type FrequencyType = 'daily' | 'weekdays' | 'times_per_week';

export interface FrequencyConfig {
  type: FrequencyType;
  /**
   * For 'weekdays' type: Array of day indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  days?: number[];
  /**
   * For 'times_per_week' type: Number of times target per week (e.g. 3)
   */
  timesPerWeek?: number;
}

export type HabitColor =
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'emerald'
  | 'amber'
  | 'cyan'
  | 'blue'
  | 'orange';

export interface Category {
  id: string;
  name: string;
  color: HabitColor;
  emoji: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  frequency: FrequencyConfig;
  reminderTime?: string; // "HH:MM" in 24h format, e.g. "08:30"
  reminderEnabled?: boolean;
  category?: string; // Category name for backwards compatibility
  categoryId?: string; // Reference to custom Category
  createdAt: string; // ISO String 'YYYY-MM-DDTHH:mm:ss.sssZ'
  archived?: boolean;
  order?: number;
}

/**
 * Habit completion logs:
 * Key is habitId, value is a map of date string ('YYYY-MM-DD') to completion status.
 */
export type HabitLogs = Record<string, Record<string, boolean>>;

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  accentColor: HabitColor;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface HabitComputedStats {
  habit: Habit;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0 to 100 percentage
  isScheduledToday: boolean;
  isCompletedToday: boolean;
  lastCompletedDate?: string;
  weeklyProgress?: {
    completed: number;
    target: number;
    isTargetMet: boolean;
  };
}

export type ActiveTab = 'today' | 'habits' | 'stats' | 'settings';

export interface UserProfile {
  name: string;
  avatar: string; // Emoji or avatar identifier
  bio: string;
  title: string;
  joinedAt: string;
  dailyHabitGoal: number;
  themeColor: HabitColor;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'total' | 'time' | 'mastery' | 'consistency';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  target: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercentage: number;
}
