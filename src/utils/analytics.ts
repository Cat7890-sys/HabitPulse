/**
 * @file analytics.ts
 * Privacy-conscious analytics tracker for HabitPulse.
 * Collects strictly aggregate metrics without sensitive habit titles, goals, or notes.
 */

import { doc, setDoc, increment } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { AnalyticsEventType } from '../types';
import { getTodayKey } from './date';

const LAST_ACTIVE_DATE_KEY = 'habitpulse_last_active_date_key';

/**
 * Log a privacy-conscious aggregate analytics event.
 * Absolutely no habit names, descriptions, or user notes are accepted or transmitted.
 */
export async function trackEvent(eventType: AnalyticsEventType): Promise<void> {
  try {
    if (!isFirebaseConfigured()) return;

    const today = getTodayKey();
    const currentUser = auth.currentUser;
    const metricRef = doc(db, 'daily_metrics', today);

    // Determine if this user is a unique active user for today on this device
    const lastActiveDate = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_ACTIVE_DATE_KEY) : null;
    const isFirstActiveToday = lastActiveDate !== today;

    if (isFirstActiveToday && typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_ACTIVE_DATE_KEY, today);
    }

    const payload: Record<string, any> = {
      date: today,
      updated_at: new Date().toISOString(),
    };

    if (isFirstActiveToday) {
      payload.active_user_count = increment(1);
    }

    switch (eventType) {
      case 'app_open':
        payload.app_open_count = increment(1);
        break;
      case 'sign_up':
        payload.new_registrations_count = increment(1);
        payload.registration_count = increment(1);
        break;
      case 'sign_in':
        // Counted in active_user_count if first time today
        break;
      case 'habit_created':
        payload.habits_created_count = increment(1);
        break;
      case 'habit_completed':
        payload.habits_completed_count = increment(1);
        break;
    }

    await setDoc(metricRef, payload, { merge: true }).catch((err) => {
      // Non-blocking catch for analytics writes
      console.debug('Analytics aggregate record note:', err?.message || err);
    });
  } catch {
    // Analytics is non-blocking
  }
}
