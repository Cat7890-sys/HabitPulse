/**
 * @file storage.ts
 * Storage layer wrapper around localStorage.
 * Provides an async interface so a backend or cloud database (e.g. Firebase/Cloud SQL)
 * can easily be plugged in without refactoring UI components.
 */

import { Habit, HabitLogs, AppSettings, Category } from '../types';
import { getTodayKey, addDaysToDateKey } from '../utils/date';

const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits_v1',
  LOGS: 'habitpulse_logs_v1',
  SETTINGS: 'habitpulse_settings_v1',
  CATEGORIES: 'habitpulse_categories_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'indigo',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
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
 * Generates initial demo completion history for starter habits so heatmaps and streak counters look realistic.
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
  habits: Habit[];
  logs: HabitLogs;
  categories: Category[];
  settings: AppSettings;
}

export const storage = {
  /**
   * Loads all categories from storage.
   */
  async getCategories(): Promise<Category[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        await this.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading categories from localStorage:', e);
      return DEFAULT_CATEGORIES;
    }
  },

  /**
   * Saves categories list to storage.
   */
  async saveCategories(categories: Category[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent('habitpulse-categories-changed', { detail: categories }));
    } catch (e) {
      console.error('Error saving categories to localStorage:', e);
    }
  },

  /**
   * Loads all habits from storage.
   */
  async getHabits(): Promise<Habit[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (!raw) {
        const initial = INITIAL_HABITS;
        await this.saveHabits(initial);
        const starterLogs = generateStarterLogs(initial);
        await this.saveLogs(starterLogs);
        await this.saveCategories(DEFAULT_CATEGORIES);
        return initial;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading habits from localStorage:', e);
      return INITIAL_HABITS;
    }
  },

  /**
   * Saves habits list to storage.
   */
  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      window.dispatchEvent(new CustomEvent('habitpulse-habits-changed', { detail: habits }));
    } catch (e) {
      console.error('Error saving habits to localStorage:', e);
    }
  },

  /**
   * Loads completion logs map from storage.
   */
  async getLogs(): Promise<HabitLogs> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading logs from localStorage:', e);
      return {};
    }
  },

  /**
   * Saves completion logs map to storage.
   */
  async saveLogs(logs: HabitLogs): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('habitpulse-logs-changed', { detail: logs }));
    } catch (e) {
      console.error('Error saving logs to localStorage:', e);
    }
  },

  /**
   * Loads user settings.
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Saves user settings.
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('habitpulse-settings-changed', { detail: settings }));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  },

  /**
   * Exports full database as JSON object string for backups.
   */
  async exportAllData(): Promise<string> {
    const habits = await this.getHabits();
    const logs = await this.getLogs();
    const categories = await this.getCategories();
    const settings = await this.getSettings();

    const backup: BackupData = {
      version: 2,
      exportedAt: new Date().toISOString(),
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
      if (parsed.settings && typeof parsed.settings === 'object') {
        await this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }

      return {
        success: true,
        message: `Successfully restored ${parsed.habits.length} habits, categories, and logs!`,
        habitsCount: parsed.habits.length,
      };
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return { success: false, message: 'Malformed JSON file. Please check your backup file.' };
    }
  },

  /**
   * Clears all habits, categories, and logs from storage (factory reset).
   */
  async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    window.dispatchEvent(new CustomEvent('habitpulse-reset'));
  },

  /**
   * Seeds demo data.
   */
  async seedDemoData(): Promise<void> {
    const habits = INITIAL_HABITS;
    const logs = generateStarterLogs(habits);
    await this.saveCategories(DEFAULT_CATEGORIES);
    await this.saveHabits(habits);
    await this.saveLogs(logs);
  },
};
