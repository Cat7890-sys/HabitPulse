import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { syncQueue } from './syncQueue';
import { idbStorage, SyncQueueItem } from '../storage/db';
import {
  Habit,
  HabitLogs,
  Category,
  AppSettings,
  UserProfile,
  TokenTransaction,
  HabitMilestoneClaim,
} from '../types';

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
   * Process all pending queued mutations and upload to Firebase Firestore.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!isFirebaseConfigured()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    const pending = await syncQueue.getPendingItems();
    if (pending.length === 0) {
      this.setStatus('synced');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      this.setStatus('pending');
      return;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    try {
      for (const item of pending) {
        const success = await this.syncItem(currentUser.uid, item);
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
    try {
      if (item.entity === 'habit') {
        const habitDocRef = doc(db, 'users', userId, 'habits', item.entityId);
        if (item.operation === 'DELETE') {
          await deleteDoc(habitDocRef).catch((e) =>
            handleFirestoreError(e, OperationType.DELETE, `users/${userId}/habits/${item.entityId}`)
          );
        } else {
          const habit: Habit = item.payload;
          const payload = {
            id: habit.id,
            name: habit.name,
            emoji: habit.emoji || '🎯',
            color: habit.color || 'indigo',
            frequency: habit.frequency,
            reminderTime: habit.reminderTime || null,
            reminderEnabled: !!habit.reminderEnabled,
            category: habit.category || null,
            categoryId: habit.categoryId || null,
            createdAt: habit.createdAt || new Date().toISOString(),
            archived: !!habit.archived,
            order: habit.order || 0,
            description: habit.description || '',
            goalType: habit.goalType || 'recurring',
            startDate: habit.startDate || null,
            targetDate: habit.targetDate || null,
            targetTime: habit.targetTime || null,
            targetCompletions: habit.targetCompletions || 0,
            isGoalCompleted: !!habit.isGoalCompleted,
            goalCompletedAt: habit.goalCompletedAt || null,
            userId,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(habitDocRef, payload, { merge: true }).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, `users/${userId}/habits/${item.entityId}`)
          );
        }
      } else if (item.entity === 'completion') {
        const logDocRef = doc(db, 'users', userId, 'logs', item.entityId);
        if (item.operation === 'DELETE') {
          await deleteDoc(logDocRef).catch((e) =>
            handleFirestoreError(e, OperationType.DELETE, `users/${userId}/logs/${item.entityId}`)
          );
        } else {
          const { habitId, dateKey, completed } = item.payload;
          await setDoc(
            logDocRef,
            {
              id: item.entityId,
              habitId,
              date: dateKey,
              completed: !!completed,
              userId,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          ).catch((e) =>
            handleFirestoreError(e, OperationType.WRITE, `users/${userId}/logs/${item.entityId}`)
          );
        }
      } else if (item.entity === 'profile') {
        const profile: UserProfile = item.payload;
        const profileDocRef = doc(db, 'users', userId);
        await setDoc(
          profileDocRef,
          {
            name: profile.name,
            avatar: profile.avatar || '🦁',
            bio: profile.bio || '',
            title: profile.title || 'Consistent Striver',
            joinedAt: profile.joinedAt || new Date().toISOString(),
            dailyHabitGoal: profile.dailyHabitGoal || 4,
            themeColor: profile.themeColor || 'indigo',
            userId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((e) => handleFirestoreError(e, OperationType.WRITE, `users/${userId}`));
      } else if (item.entity === 'settings') {
        const settings: AppSettings = item.payload;
        const settingsDocRef = doc(db, 'users', userId, 'settings', 'config');
        await setDoc(
          settingsDocRef,
          {
            theme: settings.theme,
            accentColor: settings.accentColor,
            soundEnabled: !!settings.soundEnabled,
            hapticsEnabled: !!settings.hapticsEnabled,
            notificationsEnabled: !!settings.notificationsEnabled,
            userId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((e) =>
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/settings/config`)
        );
      }

      return true;
    } catch (e) {
      console.error(`Failed to sync ${item.entity}:`, e);
      return false;
    }
  }

  /**
   * Pull all cloud data from Firestore for the logged-in user and write into IndexedDB.
   */
  public async pullFromCloud(userId: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    this.setStatus('syncing');

    try {
      // 1. Fetch habits
      const habitsCol = collection(db, 'users', userId, 'habits');
      const habitSnap = await getDocs(habitsCol).catch((e) =>
        handleFirestoreError(e, OperationType.GET, `users/${userId}/habits`)
      );

      if (habitSnap && !habitSnap.empty) {
        const habits: Habit[] = habitSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name,
            emoji: data.emoji || '🎯',
            color: data.color || 'indigo',
            frequency: data.frequency || { type: 'daily' },
            reminderTime: data.reminderTime || undefined,
            reminderEnabled: data.reminderEnabled,
            category: data.category || undefined,
            categoryId: data.categoryId || undefined,
            createdAt: data.createdAt || new Date().toISOString(),
            archived: data.archived,
            order: data.order ?? 0,
            description: data.description || undefined,
            goalType: data.goalType || 'recurring',
            startDate: data.startDate || undefined,
            targetDate: data.targetDate || undefined,
            targetTime: data.targetTime || undefined,
            targetCompletions: data.targetCompletions || undefined,
            isGoalCompleted: data.isGoalCompleted,
            goalCompletedAt: data.goalCompletedAt || undefined,
          };
        });
        await idbStorage.saveHabits(habits);
      }

      // 2. Fetch completions / logs
      const logsCol = collection(db, 'users', userId, 'logs');
      const logsSnap = await getDocs(logsCol).catch((e) =>
        handleFirestoreError(e, OperationType.GET, `users/${userId}/logs`)
      );

      if (logsSnap && !logsSnap.empty) {
        const logs: HabitLogs = {};
        logsSnap.docs.forEach((d) => {
          const data = d.data();
          const habitId = data.habitId;
          const dateKey = data.date;
          if (habitId && dateKey) {
            if (!logs[habitId]) logs[habitId] = {};
            logs[habitId][dateKey] = Boolean(data.completed);
          }
        });
        await idbStorage.saveLogs(logs);
      }

      // 3. Fetch profile
      const profileDocRef = doc(db, 'users', userId);
      const profileSnap = await getDoc(profileDocRef).catch((e) =>
        handleFirestoreError(e, OperationType.GET, `users/${userId}`)
      );

      if (profileSnap && profileSnap.exists()) {
        const data = profileSnap.data();
        const profile: UserProfile = {
          name: data.name || 'Habit Champion',
          avatar: data.avatar || '🦁',
          bio: data.bio || '',
          title: data.title || 'Consistent Striver',
          joinedAt: data.joinedAt || new Date().toISOString(),
          dailyHabitGoal: data.dailyHabitGoal || 4,
          themeColor: data.themeColor || 'indigo',
        };
        await idbStorage.saveProfile(profile);
      }

      // 4. Fetch settings
      const settingsDocRef = doc(db, 'users', userId, 'settings', 'config');
      const settingsSnap = await getDoc(settingsDocRef).catch((e) =>
        handleFirestoreError(e, OperationType.GET, `users/${userId}/settings/config`)
      );

      if (settingsSnap && settingsSnap.exists()) {
        const data = settingsSnap.data();
        const settings: AppSettings = {
          theme: data.theme || 'dark',
          accentColor: data.accentColor || 'indigo',
          soundEnabled: data.soundEnabled ?? true,
          hapticsEnabled: data.hapticsEnabled ?? true,
          notificationsEnabled: data.notificationsEnabled ?? false,
        };
        await idbStorage.saveSettings(settings);
      }

      // 5. Fetch transactions
      const txCol = collection(db, 'users', userId, 'transactions');
      const txSnap = await getDocs(txCol).catch(() => null);
      if (txSnap && !txSnap.empty) {
        const txList: TokenTransaction[] = txSnap.docs.map((d) => d.data() as TokenTransaction);
        await idbStorage.saveTransactions(txList);
      }

      // 6. Fetch claims
      const claimsCol = collection(db, 'users', userId, 'claims');
      const claimsSnap = await getDocs(claimsCol).catch(() => null);
      if (claimsSnap && !claimsSnap.empty) {
        const claimsList: HabitMilestoneClaim[] = claimsSnap.docs.map(
          (d) => d.data() as HabitMilestoneClaim
        );
        await idbStorage.saveMilestoneClaims(claimsList);
      }

      this.setStatus('synced');
      this.dispatchLocalDataEvents();
    } catch (err) {
      console.error('Error pulling from Firebase Firestore:', err);
      this.setStatus('error');
    }
  }

  /**
   * Push all current local data from IndexedDB up to Firestore.
   */
  public async pushLocalToCloud(userId: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    this.setStatus('syncing');

    try {
      const habits = await idbStorage.getHabits();
      const logs = await idbStorage.getLogs();
      const categories = await idbStorage.getCategories();
      const profile = await idbStorage.getProfile();
      const settings = await idbStorage.getSettings();
      const transactions = await idbStorage.getTransactions();
      const claims = await idbStorage.getMilestoneClaims();

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

      // Enqueue profile
      if (profile) {
        await syncQueue.enqueue('profile', userId, 'UPDATE', profile);
      }

      // Enqueue settings
      if (settings) {
        await syncQueue.enqueue('settings', userId, 'UPDATE', settings);
      }

      // Direct write transactions and claims to Firestore
      for (const tx of transactions) {
        const txDocRef = doc(db, 'users', userId, 'transactions', tx.id);
        await setDoc(txDocRef, { ...tx, userId }, { merge: true }).catch(() => null);
      }

      for (const claim of claims) {
        const claimDocRef = doc(db, 'users', userId, 'claims', claim.id);
        await setDoc(claimDocRef, { ...claim, userId }, { merge: true }).catch(() => null);
      }

      await this.processQueue();
    } catch (err) {
      console.error('Error pushing local data to Firebase Firestore:', err);
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
      window.dispatchEvent(new CustomEvent('habitpulse-transactions-changed'));
    }
  }
}

export const syncManager = new SyncManager();
