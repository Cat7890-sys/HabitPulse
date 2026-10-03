/**
 * @file storage.ts
 * Hardened storage layer wrapper around localStorage with in-memory fallback.
 * Guarantees zero runtime crashes or white-screens in restricted iframes or private browsing.
 */

import { Habit, HabitLogs, AppSettings, Category, UserProfile } from '../types';
import { getTodayKey, addDaysToDateKey } from '../utils/date';

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

/**
 * Generates initial demo completion history for starter habits.
 */
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

// In-memory memory map in case localStorage is blocked or throws
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {}
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    memoryStore.set(key, value);
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

function safeRemoveItem(key: string): void {
  try {
    memoryStore.delete(key);
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

function safeDispatchEvent(name: string, detail?: unknown): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

export const storage = {
  /**
   * Loads user profile from storage.
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const raw = safeGetItem(STORAGE_KEYS.PROFILE);
      if (!raw) {
        safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        return DEFAULT_PROFILE;
      }
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  /**
   * Saves user profile to storage.
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      safeDispatchEvent('habitpulse-profile-changed', profile);
    } catch {}
  },

  /**
   * Loads all categories from storage.
   */
  async getCategories(): Promise<Category[]> {
    try {
      const raw = safeGetItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  /**
   * Saves categories list to storage.
   */
  async saveCategories(categories: Category[]): Promise<void> {
    try {
      safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      safeDispatchEvent('habitpulse-categories-changed', categories);
    } catch {}
  },

  /**
   * Loads all habits from storage.
   */
  async getHabits(): Promise<Habit[]> {
    try {
      const raw = safeGetItem(STORAGE_KEYS.HABITS);
      if (!raw) {
        const initial = INITIAL_HABITS;
        safeSetItem(STORAGE_KEYS.HABITS, JSON.stringify(initial));
        const starterLogs = generateStarterLogs(initial);
        safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(starterLogs));
        safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_HABITS;
    }
  },

  /**
   * Saves habits list to storage.
   */
  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      safeSetItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      safeDispatchEvent('habitpulse-habits-changed', habits);
    } catch {}
  },

  /**
   * Loads completion logs map from storage.
   */
  async getLogs(): Promise<HabitLogs> {
    try {
      const raw = safeGetItem(STORAGE_KEYS.LOGS);
      if (!raw) {
        const initialLogs = generateStarterLogs(INITIAL_HABITS);
        safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogs));
        return initialLogs;
      }
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  /**
   * Saves completion logs map to storage.
   */
  async saveLogs(logs: HabitLogs): Promise<void> {
    try {
      safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      safeDispatchEvent('habitpulse-logs-changed', logs);
    } catch {}
  },

  /**
   * Loads user settings.
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
      if (!raw) {
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Saves user settings.
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      safeDispatchEvent('habitpulse-settings-changed', settings);
    } catch {}
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
   * Imports JSON backup data.
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
   * Clears all habits, categories, and logs from storage (factory reset).
   */
  async clearAllData(): Promise<void> {
    safeRemoveItem(STORAGE_KEYS.HABITS);
    safeRemoveItem(STORAGE_KEYS.LOGS);
    safeRemoveItem(STORAGE_KEYS.CATEGORIES);
    safeRemoveItem(STORAGE_KEYS.SETTINGS);
    safeRemoveItem(STORAGE_KEYS.PROFILE);
    safeDispatchEvent('habitpulse-reset');
  },

  /**
   * Seeds demo data.
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
