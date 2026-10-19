/**
 * @file storage.ts
 * Upgraded Local-First storage abstraction layer for HabitPulse.
 * Saves locally immediately to IndexedDB, maintains legacy localStorage migration,
 * enqueues mutations in syncQueue, and syncs asynchronously to Supabase cloud.
 */

import {
  Habit,
  HabitLogs,
  AppSettings,
  Category,
  UserProfile,
  MilestoneConfig,
  TokenTransaction,
  HabitMilestoneClaim,
  LoginStreakData,
} from '../types';
import { getTodayKey, addDaysToDateKey } from '../utils/date';
import { idbStorage } from './db';
import { syncQueue } from '../sync/syncQueue';
import { syncManager } from '../sync/syncManager';
import { DEFAULT_MILESTONES } from '../utils/rewards';

const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits_v1',
  LOGS: 'habitpulse_logs_v1',
  SETTINGS: 'habitpulse_settings_v1',
  CATEGORIES: 'habitpulse_categories_v1',
  PROFILE: 'habitpulse_profile_v1',
  MILESTONES: 'habitpulse_milestones_v1',
  TRANSACTIONS: 'habitpulse_transactions_v1',
  CLAIMS: 'habitpulse_claims_v1',
  LOGIN_STREAK: 'habitpulse_login_streak_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'indigo',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Habit Champion',
  avatar: '🦁',
  bio: 'Building consistent daily habits one small step at a time.',
  title: 'Consistent Striver',
  joinedAt: new Date().toISOString(),
  dailyHabitGoal: 4,
  themeColor: 'indigo',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-health', name: 'Health', color: 'emerald', emoji: '🌿' },
  { id: 'cat-fitness', name: 'Fitness', color: 'rose', emoji: '⚡' },
  { id: 'cat-mind', name: 'Mind', color: 'violet', emoji: '🧘‍♀️' },
  { id: 'cat-work', name: 'Work', color: 'blue', emoji: '💼' },
  { id: 'cat-personal', name: 'Personal', color: 'amber', emoji: '👤' },
  { id: 'cat-learning', name: 'Learning', color: 'indigo', emoji: '📚' },
  { id: 'cat-routine', name: 'Routine', color: 'cyan', emoji: '⏰' },
];

export const DEFAULT_LOGIN_STREAK: LoginStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoginDate: '',
  history: [],
};

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Morning Hydration (500ml)',
    emoji: '💧',
    color: 'cyan',
    frequency: { type: 'daily' },
    reminderTime: '07:30',
    reminderEnabled: true,
    category: 'Health',
    categoryId: 'cat-health',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    order: 0,
    goalType: 'recurring',
    description: 'Drink fresh water first thing in the morning',
  },
  {
    id: 'habit-2',
    name: '20-Min Workout / Run',
    emoji: '🏃‍♂️',
    color: 'emerald',
    frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] }, // Mon-Fri
    reminderTime: '08:00',
    reminderEnabled: true,
    category: 'Fitness',
    categoryId: 'cat-fitness',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    order: 1,
    goalType: 'recurring',
    description: 'Keep body energized with light cardio or gym',
  },
  {
    id: 'habit-3',
    name: 'Read 15 Pages',
    emoji: '📚',
    color: 'indigo',
    frequency: { type: 'daily' },
    reminderTime: '21:30',
    reminderEnabled: true,
    category: 'Learning',
    categoryId: 'cat-learning',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    order: 2,
    goalType: 'recurring',
    description: 'Non-fiction book or technical literature',
  },
  {
    id: 'habit-4',
    name: 'Mindful Meditation (10m)',
    emoji: '🧘‍♀️',
    color: 'violet',
    frequency: { type: 'daily' },
    reminderTime: '07:00',
    reminderEnabled: false,
    category: 'Mind',
    categoryId: 'cat-mind',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    order: 3,
    goalType: 'recurring',
    description: 'Calm the mind before diving into tasks',
  },
  {
    id: 'habit-5',
    name: 'Review Daily Goals & Journal',
    emoji: '✍️',
    color: 'amber',
    frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5, 0] }, // Sun-Fri
    reminderTime: '22:00',
    reminderEnabled: true,
    category: 'Personal',
    categoryId: 'cat-personal',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    order: 4,
    goalType: 'recurring',
    description: 'Reflect on wins and plan tomorrow',
  },
];

export function generateStarterLogs(habits: Habit[]): HabitLogs {
  const logs: HabitLogs = {};
  const today = getTodayKey();

  habits.forEach((habit, idx) => {
    logs[habit.id] = {};
    const streakLength = 5 + (idx % 8);
    for (let i = 0; i < 28; i++) {
      const dKey = addDaysToDateKey(today, -i);
      const chance = i < streakLength ? 1 : Math.random() > 0.35 ? 1 : 0;
      if (chance === 1) {
        logs[habit.id][dKey] = true;
      }
    }
  });

  return logs;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  profile?: UserProfile;
  habits: Habit[];
  logs: HabitLogs;
  categories: Category[];
  settings: AppSettings;
  milestones?: MilestoneConfig[];
  transactions?: TokenTransaction[];
  milestoneClaims?: HabitMilestoneClaim[];
  loginStreak?: LoginStreakData;
}

function safeDispatchEvent(name: string, detail?: unknown): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

// Fallback legacy localStorage helpers
function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

export const storage = {
  /**
   * Loads user profile from local IndexedDB or legacy localStorage.
   */
  async getProfile(): Promise<UserProfile> {
    try {
      let profile = await idbStorage.getProfile();
      if (!profile) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.PROFILE);
        if (raw) {
          profile = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
        } else {
          profile = DEFAULT_PROFILE;
        }
        await idbStorage.saveProfile(profile);
      }
      return profile;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  /**
   * Saves user profile locally and enqueues cloud sync.
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await idbStorage.saveProfile(profile);
      safeSetLocalStorage(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      await syncQueue.enqueue('profile', 'current', 'UPDATE', profile);
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-profile-changed', profile);
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  },

  /**
   * Loads all categories from local IndexedDB or legacy localStorage.
   */
  async getCategories(): Promise<Category[]> {
    try {
      let categories = await idbStorage.getCategories();
      if (!categories || categories.length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.CATEGORIES);
        if (raw) {
          categories = JSON.parse(raw);
        } else {
          categories = DEFAULT_CATEGORIES;
        }
        await idbStorage.saveCategories(categories);
      }
      return categories;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  /**
   * Saves categories list locally and enqueues cloud sync.
   */
  async saveCategories(categories: Category[]): Promise<void> {
    try {
      await idbStorage.saveCategories(categories);
      safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      for (const cat of categories) {
        await syncQueue.enqueue('category', cat.id, 'UPDATE', cat);
      }
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-categories-changed', categories);
    } catch (e) {
      console.error('Error saving categories:', e);
    }
  },

  /**
   * Loads all habits from local IndexedDB or legacy localStorage.
   */
  async getHabits(): Promise<Habit[]> {
    try {
      let habits = await idbStorage.getHabits();
      if (!habits || habits.length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.HABITS);
        if (raw) {
          habits = JSON.parse(raw);
        } else {
          habits = INITIAL_HABITS;
          const starterLogs = generateStarterLogs(INITIAL_HABITS);
          await idbStorage.saveLogs(starterLogs);
          await idbStorage.saveCategories(DEFAULT_CATEGORIES);
          await idbStorage.saveProfile(DEFAULT_PROFILE);
          await idbStorage.saveMilestones(DEFAULT_MILESTONES);
        }
        await idbStorage.saveHabits(habits);
      }
      return habits;
    } catch {
      return INITIAL_HABITS;
    }
  },

  /**
   * Saves habits list locally and enqueues cloud sync.
   */
  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      await idbStorage.saveHabits(habits);
      safeSetLocalStorage(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      for (const h of habits) {
        await syncQueue.enqueue('habit', h.id, 'UPDATE', h);
      }
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-habits-changed', habits);
    } catch (e) {
      console.error('Error saving habits:', e);
    }
  },

  /**
   * Loads completion logs map from local IndexedDB or legacy localStorage.
   */
  async getLogs(): Promise<HabitLogs> {
    try {
      let logs = await idbStorage.getLogs();
      if (!logs || Object.keys(logs).length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.LOGS);
        if (raw) {
          logs = JSON.parse(raw);
          await idbStorage.saveLogs(logs);
        }
      }
      return logs || {};
    } catch {
      return {};
    }
  },

  /**
   * Saves completion logs map locally and enqueues cloud sync.
   */
  async saveLogs(logs: HabitLogs): Promise<void> {
    try {
      await idbStorage.saveLogs(logs);
      safeSetLocalStorage(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      Object.entries(logs).forEach(([habitId, dateMap]) => {
        Object.entries(dateMap).forEach(([dateKey, completed]) => {
          syncQueue.enqueue('completion', `${habitId}_${dateKey}`, 'UPDATE', {
            habitId,
            dateKey,
            completed,
          });
        });
      });
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-logs-changed', logs);
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  },

  /**
   * Saves a single completion log entry locally and enqueues cloud sync.
   */
  async saveCompletion(habitId: string, dateKey: string, completed: boolean): Promise<void> {
    try {
      await idbStorage.saveCompletion(habitId, dateKey, completed);
      await syncQueue.enqueue('completion', `${habitId}_${dateKey}`, 'UPDATE', {
        habitId,
        dateKey,
        completed,
      });
      syncManager.processQueue();
      const currentLogs = await this.getLogs();
      safeSetLocalStorage(STORAGE_KEYS.LOGS, JSON.stringify(currentLogs));
      safeDispatchEvent('habitpulse-logs-changed', currentLogs);
    } catch (e) {
      console.error('Error saving completion:', e);
    }
  },

  /**
   * Loads user settings.
   */
  async getSettings(): Promise<AppSettings> {
    try {
      let settings = await idbStorage.getSettings();
      if (!settings) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.SETTINGS);
        if (raw) {
          settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } else {
          settings = DEFAULT_SETTINGS;
        }
        await idbStorage.saveSettings(settings);
      }
      return settings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Saves user settings locally and enqueues cloud sync.
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await idbStorage.saveSettings(settings);
      safeSetLocalStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      await syncQueue.enqueue('settings', 'current', 'UPDATE', settings);
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-settings-changed', settings);
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // ==========================================================================
  // MILESTONE REWARDS & CONFIGURATION
  // ==========================================================================

  async getMilestones(): Promise<MilestoneConfig[]> {
    try {
      let milestones = await idbStorage.getMilestones();
      if (!milestones || milestones.length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.MILESTONES);
        if (raw) {
          milestones = JSON.parse(raw);
        } else {
          milestones = DEFAULT_MILESTONES;
        }
        await idbStorage.saveMilestones(milestones);
      }
      return milestones;
    } catch {
      return DEFAULT_MILESTONES;
    }
  },

  async saveMilestones(milestones: MilestoneConfig[]): Promise<void> {
    try {
      await idbStorage.saveMilestones(milestones);
      safeSetLocalStorage(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
      safeDispatchEvent('habitpulse-milestones-changed', milestones);
    } catch (e) {
      console.error('Error saving milestones:', e);
    }
  },

  // ==========================================================================
  // TOKEN TRANSACTIONS LEDGER
  // ==========================================================================

  async getTransactions(): Promise<TokenTransaction[]> {
    try {
      let transactions = await idbStorage.getTransactions();
      if (!transactions || transactions.length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.TRANSACTIONS);
        if (raw) {
          transactions = JSON.parse(raw);
          await idbStorage.saveTransactions(transactions);
        }
      }
      return transactions || [];
    } catch {
      return [];
    }
  },

  async saveTransactions(transactions: TokenTransaction[]): Promise<void> {
    try {
      await idbStorage.saveTransactions(transactions);
      safeSetLocalStorage(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      safeDispatchEvent('habitpulse-transactions-changed', transactions);
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  },

  async addTransactions(newTxs: TokenTransaction[]): Promise<void> {
    if (newTxs.length === 0) return;
    try {
      const existing = await this.getTransactions();
      const existingIds = new Set(existing.map((t) => t.id));
      const toAdd = newTxs.filter((t) => !existingIds.has(t.id));
      if (toAdd.length === 0) return;

      const merged = [...existing, ...toAdd];
      await idbStorage.saveTransactions(merged);
      safeSetLocalStorage(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(merged));
      safeDispatchEvent('habitpulse-transactions-changed', merged);
    } catch (e) {
      console.error('Error adding transactions:', e);
    }
  },

  // ==========================================================================
  // HABIT MILESTONE CLAIMS
  // ==========================================================================

  async getMilestoneClaims(): Promise<HabitMilestoneClaim[]> {
    try {
      let claims = await idbStorage.getMilestoneClaims();
      if (!claims || claims.length === 0) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.CLAIMS);
        if (raw) {
          claims = JSON.parse(raw);
          await idbStorage.saveMilestoneClaims(claims);
        }
      }
      return claims || [];
    } catch {
      return [];
    }
  },

  async saveMilestoneClaims(claims: HabitMilestoneClaim[]): Promise<void> {
    try {
      await idbStorage.saveMilestoneClaims(claims);
      safeSetLocalStorage(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
      safeDispatchEvent('habitpulse-claims-changed', claims);
    } catch (e) {
      console.error('Error saving milestone claims:', e);
    }
  },

  async addMilestoneClaims(newClaims: HabitMilestoneClaim[]): Promise<void> {
    if (newClaims.length === 0) return;
    try {
      const existing = await this.getMilestoneClaims();
      const existingIds = new Set(existing.map((c) => c.id));
      const toAdd = newClaims.filter((c) => !existingIds.has(c.id));
      if (toAdd.length === 0) return;

      const merged = [...existing, ...toAdd];
      await idbStorage.saveMilestoneClaims(merged);
      safeSetLocalStorage(STORAGE_KEYS.CLAIMS, JSON.stringify(merged));
      safeDispatchEvent('habitpulse-claims-changed', merged);
    } catch (e) {
      console.error('Error adding milestone claims:', e);
    }
  },

  // ==========================================================================
  // DAILY LOGIN STREAK (SEPARATE FROM HABIT REWARDS)
  // ==========================================================================

  async getLoginStreak(): Promise<LoginStreakData> {
    try {
      let streakData = await idbStorage.getLoginStreak();
      if (!streakData) {
        const raw = safeGetLocalStorage(STORAGE_KEYS.LOGIN_STREAK);
        if (raw) {
          streakData = JSON.parse(raw);
        } else {
          streakData = DEFAULT_LOGIN_STREAK;
        }
        await idbStorage.saveLoginStreak(streakData);
      }
      return streakData;
    } catch {
      return DEFAULT_LOGIN_STREAK;
    }
  },

  async saveLoginStreak(data: LoginStreakData): Promise<void> {
    try {
      await idbStorage.saveLoginStreak(data);
      safeSetLocalStorage(STORAGE_KEYS.LOGIN_STREAK, JSON.stringify(data));
      safeDispatchEvent('habitpulse-login-streak-changed', data);
    } catch (e) {
      console.error('Error saving login streak:', e);
    }
  },

  /**
   * Records a daily login event.
   * Rules:
   * - Login streaks track consecutive days a user opens HabitPulse.
   * - Only increment ONCE per calendar day (using local dateKey).
   * - Missed day resets active streak to 1.
   * - Longest streak is preserved.
   * - Never awards tokens for logging in.
   */
  async recordDailyLogin(): Promise<LoginStreakData> {
    try {
      const todayKey = getTodayKey();
      const yesterdayKey = addDaysToDateKey(todayKey, -1);
      const current = await this.getLoginStreak();

      // If already logged in today, do not increase streak
      if (current.lastLoginDate === todayKey) {
        return current;
      }

      let newCurrentStreak = 1;
      if (current.lastLoginDate === yesterdayKey) {
        // Consecutive calendar day login
        newCurrentStreak = (current.currentStreak || 0) + 1;
      } else if (!current.lastLoginDate) {
        // First login ever
        newCurrentStreak = 1;
      } else {
        // Missed one or more days: reset active consecutive streak to 1
        newCurrentStreak = 1;
      }

      const newLongestStreak = Math.max(current.longestStreak || 0, newCurrentStreak);
      const historySet = new Set(current.history || []);
      historySet.add(todayKey);

      const updated: LoginStreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastLoginDate: todayKey,
        history: (Array.from(historySet) as string[]).sort(),
      };

      await this.saveLoginStreak(updated);
      return updated;
    } catch (e) {
      console.error('Error recording daily login:', e);
      return DEFAULT_LOGIN_STREAK;
    }
  },

  // ==========================================================================
  // BACKUP & RESTORE
  // ==========================================================================

  /**
   * Exports full database as JSON object string for backups.
   */
  async exportAllData(): Promise<string> {
    const [
      profile,
      habits,
      logs,
      categories,
      settings,
      milestones,
      transactions,
      milestoneClaims,
      loginStreak,
    ] = await Promise.all([
      this.getProfile(),
      this.getHabits(),
      this.getLogs(),
      this.getCategories(),
      this.getSettings(),
      this.getMilestones(),
      this.getTransactions(),
      this.getMilestoneClaims(),
      this.getLoginStreak(),
    ]);

    const backup: BackupData = {
      version: 3,
      exportedAt: new Date().toISOString(),
      profile,
      habits,
      logs,
      categories,
      settings,
      milestones,
      transactions,
      milestoneClaims,
      loginStreak,
    };

    return JSON.stringify(backup, null, 2);
  },

  /**
   * Imports JSON backup data locally and syncs to cloud if authenticated.
   */
  async importData(jsonString: string): Promise<{ success: boolean; message: string; habitsCount?: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.habits)) {
        return { success: false, message: 'Invalid backup format: habits array missing.' };
      }

      await this.saveHabits(parsed.habits);
      if (parsed.logs && typeof parsed.logs === 'object') {
        await this.saveLogs(parsed.logs);
      }
      if (Array.isArray(parsed.categories)) {
        await this.saveCategories(parsed.categories);
      }
      if (parsed.profile && typeof parsed.profile === 'object') {
        await this.saveProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        await this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      if (Array.isArray(parsed.milestones)) {
        await this.saveMilestones(parsed.milestones);
      }
      if (Array.isArray(parsed.transactions)) {
        await this.saveTransactions(parsed.transactions);
      }
      if (Array.isArray(parsed.milestoneClaims)) {
        await this.saveMilestoneClaims(parsed.milestoneClaims);
      }
      if (parsed.loginStreak && typeof parsed.loginStreak === 'object') {
        await this.saveLoginStreak(parsed.loginStreak);
      }

      return {
        success: true,
        message: `Successfully restored ${parsed.habits.length} habits, categories, milestones, transactions, and logs!`,
        habitsCount: parsed.habits.length,
      };
    } catch {
      return { success: false, message: 'Malformed JSON file. Please check your backup file.' };
    }
  },

  /**
   * Clears all local data (factory reset).
   */
  async clearAllData(): Promise<void> {
    await idbStorage.clearAllData();
    await syncQueue.clear();
    try {
      localStorage.removeItem(STORAGE_KEYS.HABITS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.MILESTONES);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.CLAIMS);
      localStorage.removeItem(STORAGE_KEYS.LOGIN_STREAK);
    } catch {}
    safeDispatchEvent('habitpulse-reset');
  },

  /**
   * Seeds demo data locally and syncs if authenticated.
   */
  async seedDemoData(): Promise<void> {
    const habits = INITIAL_HABITS;
    const logs = generateStarterLogs(habits);
    await this.saveCategories(DEFAULT_CATEGORIES);
    await this.saveProfile(DEFAULT_PROFILE);
    await this.saveHabits(habits);
    await this.saveLogs(logs);
    await this.saveMilestones(DEFAULT_MILESTONES);
    await this.recordDailyLogin();
  },
};
