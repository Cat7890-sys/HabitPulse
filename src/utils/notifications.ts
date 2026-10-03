/**
 * @file notifications.ts
 * Browser Notification API helper for habit reminders with base URL support.
 */

import { Habit, HabitLogs } from '../types';
import { getTodayKey } from './date';
import { isHabitScheduledOnDate } from './streaks';

const getAssetUrl = (relativePath: string) => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
}

export function getNotificationStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      isSupported: false,
      permission: 'denied',
    };
  }

  return {
    isSupported: true,
    permission: Notification.permission,
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function sendHabitNotification(
  title: string,
  body: string,
  icon?: string,
  tag = 'habit-reminder'
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const resolvedIcon = icon || getAssetUrl('pwa-192x192.png');
  const resolvedBadge = getAssetUrl('favicon.ico');

  try {
    const options: NotificationOptions = {
      body,
      icon: resolvedIcon,
      badge: resolvedBadge,
      tag,
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, options);
        })
        .catch(() => {
          new Notification(title, options);
        });
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.warn('Failed to send notification:', e);
  }
}

// Track last triggered minute to prevent spamming within the same minute
let lastTriggeredMinute = '';

/**
 * Checks all active habits and triggers notifications if reminder time matches current local time.
 */
export function checkHabitReminders(habits: Habit[], logs: HabitLogs) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayKey = getTodayKey();
  const currentMinuteKey = `${todayKey}_${currentTimeStr}`;

  if (lastTriggeredMinute === currentMinuteKey) {
    return; // Already checked for this specific minute
  }
  lastTriggeredMinute = currentMinuteKey;

  const activeHabits = habits.filter((h) => !h.archived);

  for (const habit of activeHabits) {
    if (habit.reminderEnabled && habit.reminderTime === currentTimeStr) {
      const scheduled = isHabitScheduledOnDate(habit, todayKey);
      const completed = !!(logs[habit.id] && logs[habit.id][todayKey]);

      if (scheduled && !completed) {
        sendHabitNotification(
          `${habit.emoji} Time for ${habit.name}`,
          `Keep your streak alive! Tap to mark your habit complete for today.`,
          getAssetUrl('pwa-192x192.png'),
          `habit-${habit.id}`
        );
      }
    }
  }
}

/**
 * Quick preview test for a specific habit's reminder
 */
export function testHabitReminder(habit: Habit) {
  sendHabitNotification(
    `${habit.emoji} Scheduled Reminder: ${habit.name}`,
    `This is a test preview of your scheduled reminder at ${habit.reminderTime || 'set time'}.`,
    getAssetUrl('pwa-192x192.png'),
    `test-${habit.id}`
  );
}
