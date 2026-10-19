/**
 * @file db.ts
 * Native IndexedDB local storage engine for HabitPulse.
 * Local-first, offline-ready, asynchronous database layer with automatic schema migrations.
 */

import {
  Habit,
  AppSettings,
  Category,
  UserProfile,
  MilestoneConfig,
  TokenTransaction,
  HabitMilestoneClaim,
  LoginStreakData,
} from '../types';

const DB_NAME = 'habitpulse_idb_v1';
const DB_VERSION = 2;

export interface SyncQueueItem {
  id?: number;
  entity: 'habit' | 'completion' | 'category' | 'profile' | 'settings';
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('completions')) {
        db.createObjectStore('completions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('entity', 'entity');
      }

      // Version 2 stores: Tokens, Milestones, Claims, Login Streak
      if (!db.objectStoreNames.contains('milestones')) {
        db.createObjectStore('milestones', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('milestone_claims')) {
        db.createObjectStore('milestone_claims', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('login_streak')) {
        db.createObjectStore('login_streak', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Generic helper methods
async function getAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function getOne<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function putOne<T>(storeName: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

async function putMany<T>(storeName: string, values: T[]): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      values.forEach((v) => store.put(v));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

async function removeOne(storeName: string, key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

export const idbStorage = {
  // HABITS
  async getHabits(): Promise<Habit[]> {
    return getAll<Habit>('habits');
  },
  async saveHabits(habits: Habit[]): Promise<void> {
    await clearStore('habits');
    await putMany('habits', habits);
  },
  async saveHabit(habit: Habit): Promise<void> {
    await putOne('habits', habit);
  },

  // LOGS / COMPLETIONS
  async getLogs(): Promise<Record<string, Record<string, boolean>>> {
    const completions = await getAll<{ id: string; habitId: string; dateKey: string; completed: boolean }>('completions');
    const logs: Record<string, Record<string, boolean>> = {};
    completions.forEach((c) => {
      if (!logs[c.habitId]) logs[c.habitId] = {};
      logs[c.habitId][c.dateKey] = c.completed;
    });
    return logs;
  },
  async saveLogs(logs: Record<string, Record<string, boolean>>): Promise<void> {
    const items: { id: string; habitId: string; dateKey: string; completed: boolean }[] = [];
    Object.entries(logs).forEach(([habitId, dateMap]) => {
      Object.entries(dateMap).forEach(([dateKey, completed]) => {
        items.push({
          id: `${habitId}_${dateKey}`,
          habitId,
          dateKey,
          completed,
        });
      });
    });
    await clearStore('completions');
    await putMany('completions', items);
  },
  async saveCompletion(habitId: string, dateKey: string, completed: boolean): Promise<void> {
    await putOne('completions', {
      id: `${habitId}_${dateKey}`,
      habitId,
      dateKey,
      completed,
    });
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    return getAll<Category>('categories');
  },
  async saveCategories(categories: Category[]): Promise<void> {
    await clearStore('categories');
    await putMany('categories', categories);
  },

  // PROFILE
  async getProfile(): Promise<UserProfile | null> {
    const res = await getOne<{ id: string; profile: UserProfile }>('profile', 'current');
    return res ? res.profile : null;
  },
  async saveProfile(profile: UserProfile): Promise<void> {
    await putOne('profile', { id: 'current', profile });
  },

  // SETTINGS
  async getSettings(): Promise<AppSettings | null> {
    const res = await getOne<{ id: string; settings: AppSettings }>('settings', 'current');
    return res ? res.settings : null;
  },
  async saveSettings(settings: AppSettings): Promise<void> {
    await putOne('settings', { id: 'current', settings });
  },

  // MILESTONES (Version 2)
  async getMilestones(): Promise<MilestoneConfig[]> {
    return getAll<MilestoneConfig>('milestones');
  },
  async saveMilestones(milestones: MilestoneConfig[]): Promise<void> {
    await clearStore('milestones');
    await putMany('milestones', milestones);
  },

  // TOKEN TRANSACTIONS (Version 2)
  async getTransactions(): Promise<TokenTransaction[]> {
    return getAll<TokenTransaction>('transactions');
  },
  async saveTransactions(transactions: TokenTransaction[]): Promise<void> {
    await clearStore('transactions');
    await putMany('transactions', transactions);
  },
  async addTransaction(transaction: TokenTransaction): Promise<void> {
    await putOne('transactions', transaction);
  },

  // MILESTONE CLAIMS (Version 2)
  async getMilestoneClaims(): Promise<HabitMilestoneClaim[]> {
    return getAll<HabitMilestoneClaim>('milestone_claims');
  },
  async saveMilestoneClaims(claims: HabitMilestoneClaim[]): Promise<void> {
    await clearStore('milestone_claims');
    await putMany('milestone_claims', claims);
  },
  async addMilestoneClaim(claim: HabitMilestoneClaim): Promise<void> {
    await putOne('milestone_claims', claim);
  },

  // LOGIN STREAK (Version 2)
  async getLoginStreak(): Promise<LoginStreakData | null> {
    const res = await getOne<{ id: string; data: LoginStreakData }>('login_streak', 'current');
    return res ? res.data : null;
  },
  async saveLoginStreak(data: LoginStreakData): Promise<void> {
    await putOne('login_streak', { id: 'current', data });
  },

  // SYNC QUEUE
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return getAll<SyncQueueItem>('sync_queue');
  },
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  },
  async removeSyncQueueItem(id: number): Promise<void> {
    await removeOne('sync_queue', id.toString());
  },
  async clearSyncQueue(): Promise<void> {
    await clearStore('sync_queue');
  },

  // CLEAR ALL DATA
  async clearAllData(): Promise<void> {
    await clearStore('habits');
    await clearStore('completions');
    await clearStore('categories');
    await clearStore('profile');
    await clearStore('settings');
    await clearStore('sync_queue');
    await clearStore('milestones');
    await clearStore('transactions');
    await clearStore('milestone_claims');
    await clearStore('login_streak');
  },
};
