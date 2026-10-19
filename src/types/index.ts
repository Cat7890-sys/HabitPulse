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

export type GoalType = 'recurring' | 'one_time';

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

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

  // Habit Goals & Deadlines
  description?: string;
  goalType?: GoalType; // 'recurring' habit or 'one_time' task
  startDate?: string; // 'YYYY-MM-DD'
  targetDate?: string; // Target completion date 'YYYY-MM-DD'
  targetTime?: string; // Target completion time 'HH:MM'
  targetCompletions?: number; // Target number of qualifying completions
  isGoalCompleted?: boolean; // Set when task or goal is marked completed
  goalCompletedAt?: string; // Actual ISO timestamp when completed
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

  // Deadline & Goal Tracking Metrics
  goalStatus?: GoalStatus;
  remainingTimeText?: string;
  isOverdue?: boolean;
  goalProgress?: {
    completed: number;
    target: number;
    percentage: number;
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

// ============================================================================
// TOKEN REWARD SYSTEM & MILESTONES
// ============================================================================

export interface MilestoneConfig {
  id: string;
  name: string;
  days: number; // Interval days (e.g. 7, 20, 30, 60, 90)
  tokenReward: number; // Virtual tokens awarded
  description?: string;
  enabled: boolean;
}

export type TransactionType = 'milestone_reward' | 'goal_completed' | 'bonus';

export interface TokenTransaction {
  id: string; // Deterministic or unique UUID
  type: TransactionType;
  amount: number;
  habitId?: string;
  habitName?: string;
  milestoneId?: string;
  milestoneName?: string;
  description: string;
  createdAt: string; // ISO date string
}

export interface HabitMilestoneClaim {
  id: string; // Deterministic: `claim_${habitId}_${milestoneId}_cycle_${cycle}`
  habitId: string;
  milestoneId: string;
  cycle: number;
  claimedStreak: number;
  claimedAt: string; // ISO date string
  transactionId: string;
}

export interface LoginStreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // 'YYYY-MM-DD' in user's local timezone
  history?: string[];
}
