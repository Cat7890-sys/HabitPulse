import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncQueue } from './syncQueue';
import { idbStorage, SyncQueueItem } from '../storage/db';
import { Habit, HabitLogs, Category, AppSettings, UserProfile } from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

type SyncListener = (status: SyncStatus) => void;

class SyncManager {
  private status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private listeners: Set<SyncListener> = new Set();
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus(this.status === 'pending' ? 'pending' : 'synced');
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.listeners.forEach((fn) => fn(newStatus));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habitpulse-sync-status', { detail: newStatus }));
    }
  }

  /**
   * Process all pending queued mutations and upload to Supabase.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!isSupabaseConfigured() || !supabase) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    const pending = await syncQueue.getPendingItems();
    if (pending.length === 0) {
      this.setStatus('synced');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      this.setStatus('pending');
      return;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    try {
      for (const item of pending) {
        const success = await this.syncItem(user.id, item);
        if (success && item.id) {
          await syncQueue.removeItem(item.id);
        }
      }

      const remaining = await syncQueue.getPendingItems();
      if (remaining.length === 0) {
        this.setStatus('synced');
      } else {
        this.setStatus('pending');
      }
    } catch (err) {
      console.error('Error processing sync queue:', err);
      this.setStatus('error');
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncItem(userId: string, item: SyncQueueItem): Promise<boolean> {
    if (!supabase) return false;

    try {
      if (item.entity === 'habit') {
        if (item.operation === 'DELETE') {
          await supabase.from('habits').delete().eq('id', item.entityId).eq('user_id', userId);
        } else {
          const habit: Habit = item.payload;
          await supabase.from('habits').upsert({
            id: habit.id,
            user_id: userId,
            name: habit.name,
            emoji: habit.emoji,
            color: habit.color,
            frequency: habit.frequency,
            reminder_time: habit.reminderTime || null,
            reminder_enabled: !!habit.reminderEnabled,
            category: habit.category || null,
            category_id: habit.categoryId || null,
            created_at: habit.createdAt || new Date().toISOString(),
            archived: !!habit.archived,
            order_index: habit.order || 0,
            updated_at: new Date().toISOString(),
          });
        }
      } else if (item.entity === 'completion') {
        if (item.operation === 'DELETE') {
          await supabase.from('habit_completions').delete().eq('id', item.entityId).eq('user_id', userId);
        } else {
          const { habitId, dateKey, completed } = item.payload;
          await supabase.from('habit_completions').upsert({
            id: `${habitId}_${dateKey}`,
            user_id: userId,
            habit_id: habitId,
            date_key: dateKey,
            completed,
            updated_at: new Date().toISOString(),
          });
        }
      } else if (item.entity === 'category') {
        if (item.operation === 'DELETE') {
          await supabase.from('categories').delete().eq('id', item.entityId).eq('user_id', userId);
        } else {
          const cat: Category = item.payload;
          await supabase.from('categories').upsert({
            id: cat.id,
            user_id: userId,
            name: cat.name,
            color: cat.color,
            emoji: cat.emoji,
            updated_at: new Date().toISOString(),
          });
        }
      } else if (item.entity === 'profile') {
        const profile: UserProfile = item.payload;
        await supabase.from('profiles').upsert({
          id: userId,
          name: profile.name,
          avatar: profile.avatar,
          bio: profile.bio,
          title: profile.title,
          joined_at: profile.joinedAt,
          daily_habit_goal: profile.dailyHabitGoal,
          theme_color: profile.themeColor,
          updated_at: new Date().toISOString(),
        });
      } else if (item.entity === 'settings') {
        const settings: AppSettings = item.payload;
        await supabase.from('user_settings').upsert({
          user_id: userId,
          theme: settings.theme,
          accent_color: settings.accentColor,
          sound_enabled: settings.soundEnabled,
          haptics_enabled: settings.hapticsEnabled,
          notifications_enabled: settings.notificationsEnabled,
          updated_at: new Date().toISOString(),
        });
      }

      return true;
    } catch (e) {
      console.error(`Failed to sync ${item.entity}:`, e);
      return false;
    }
  }

  /**
   * Pull all cloud data for the logged-in user and write into IndexedDB.
   */
  public async pullFromCloud(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    this.setStatus('syncing');

    try {
      // 1. Fetch habits
      const { data: dbHabits } = await supabase.from('habits').select('*').eq('user_id', userId);
      if (dbHabits && dbHabits.length > 0) {
        const habits: Habit[] = dbHabits.map((h) => ({
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          color: h.color,
          frequency: h.frequency,
          reminderTime: h.reminder_time || undefined,
          reminderEnabled: h.reminder_enabled,
          category: h.category || undefined,
          categoryId: h.category_id || undefined,
          createdAt: h.created_at,
          archived: h.archived,
          order: h.order_index,
        }));
        await idbStorage.saveHabits(habits);
      }

      // 2. Fetch completions / logs
      const { data: dbLogs } = await supabase.from('habit_completions').select('*').eq('user_id', userId);
      if (dbLogs && dbLogs.length > 0) {
        const logs: HabitLogs = {};
        dbLogs.forEach((l) => {
          if (!logs[l.habit_id]) logs[l.habit_id] = {};
          logs[l.habit_id][l.date_key] = l.completed;
        });
        await idbStorage.saveLogs(logs);
      }

      // 3. Fetch categories
      const { data: dbCategories } = await supabase.from('categories').select('*').eq('user_id', userId);
      if (dbCategories && dbCategories.length > 0) {
        const categories: Category[] = dbCategories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          emoji: c.emoji,
        }));
        await idbStorage.saveCategories(categories);
      }

      // 4. Fetch profile
      const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (dbProfile) {
        const profile: UserProfile = {
          name: dbProfile.name,
          avatar: dbProfile.avatar,
          bio: dbProfile.bio,
          title: dbProfile.title,
          joinedAt: dbProfile.joined_at,
          dailyHabitGoal: dbProfile.daily_habit_goal,
          themeColor: dbProfile.theme_color,
        };
        await idbStorage.saveProfile(profile);
      }

      // 5. Fetch settings
      const { data: dbSettings } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
      if (dbSettings) {
        const settings: AppSettings = {
          theme: dbSettings.theme,
          accentColor: dbSettings.accent_color,
          soundEnabled: dbSettings.sound_enabled,
          hapticsEnabled: dbSettings.haptics_enabled,
          notificationsEnabled: dbSettings.notifications_enabled,
        };
        await idbStorage.saveSettings(settings);
      }

      this.setStatus('synced');
      this.dispatchLocalDataEvents();
    } catch (err) {
      console.error('Error pulling from cloud:', err);
      this.setStatus('error');
    }
  }

  /**
   * Push all current local data from IndexedDB up to Supabase.
   */
  public async pushLocalToCloud(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    this.setStatus('syncing');

    try {
      const habits = await idbStorage.getHabits();
      const logs = await idbStorage.getLogs();
      const categories = await idbStorage.getCategories();
      const profile = await idbStorage.getProfile();
      const settings = await idbStorage.getSettings();

      // Enqueue habits
      for (const h of habits) {
        await syncQueue.enqueue('habit', h.id, 'UPDATE', h);
      }

      // Enqueue logs
      Object.entries(logs).forEach(([habitId, dateMap]) => {
        Object.entries(dateMap).forEach(([dateKey, completed]) => {
          syncQueue.enqueue('completion', `${habitId}_${dateKey}`, 'UPDATE', {
            habitId,
            dateKey,
            completed,
          });
        });
      });

      // Enqueue categories
      for (const c of categories) {
        await syncQueue.enqueue('category', c.id, 'UPDATE', c);
      }

      // Enqueue profile
      if (profile) {
        await syncQueue.enqueue('profile', userId, 'UPDATE', profile);
      }

      // Enqueue settings
      if (settings) {
        await syncQueue.enqueue('settings', userId, 'UPDATE', settings);
      }

      await this.processQueue();
    } catch (err) {
      console.error('Error pushing local data to cloud:', err);
      this.setStatus('error');
    }
  }

  private dispatchLocalDataEvents() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habitpulse-habits-changed'));
      window.dispatchEvent(new CustomEvent('habitpulse-logs-changed'));
      window.dispatchEvent(new CustomEvent('habitpulse-categories-changed'));
      window.dispatchEvent(new CustomEvent('habitpulse-profile-changed'));
      window.dispatchEvent(new CustomEvent('habitpulse-settings-changed'));
    }
  }
}

export const syncManager = new SyncManager();
