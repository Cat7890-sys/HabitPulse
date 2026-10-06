/**
 * @file storage.ts
 * Upgraded Local-First storage abstraction layer for HabitPulse.
 * Saves locally immediately to IndexedDB, maintains legacy localStorage migration,
 * enqueues mutations in syncQueue, and syncs asynchronously to Supabase cloud.
 */

import { Habit, HabitLogs, AppSettings, Category, UserProfile } from '../types';
import { getTodayKey, addDaysToDateKey } from '../utils/date';
import { idbStorage } from './db';
import { syncQueue } from '../sync/syncQueue';
import { syncManager } from '../sync/syncManager';

const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits_v1',
  LOGS: 'habitpulse_logs_v1',
  SETTINGS: 'habitpulse_settings_v1',
  CATEGORIES: 'habitpulse_categories_v1',
  PROFILE: 'habitpulse_profile_v1',
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
      await syncQueue.enqueue('settings', 'current', 'UPDATE', settings);
      syncManager.processQueue();
      safeDispatchEvent('habitpulse-settings-changed', settings);
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  /**
   * Exports full database as JSON object string for backups.
   */
  async exportAllData(): Promise<string> {
    const profile = await this.getProfile();
    const habits = await this.getHabits();
    const logs = await this.getLogs();
    const categories = await this.getCategories();
    const settings = await this.getSettings();

    const backup: BackupData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
      habits,
      logs,
      categories,
      settings,
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

      return {
        success: true,
        message: `Successfully restored ${parsed.habits.length} habits, categories, profile, and logs!`,
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
  },
};
