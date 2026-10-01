/**
 * @file streaks.ts
 * Calculation engine for habit streaks, completion rates, and historical statistics.
 * 
 * ============================================================================
 * STREAK LOGIC SPECIFICATION & RULES:
 * ============================================================================
 * 
 * 1. Scheduled Days:
 *    - 'daily': Every day is a scheduled day.
 *    - 'weekdays': Only days whose day-of-week index (0=Sun..6=Sat) is in `habit.frequency.days` are scheduled.
 *    - 'times_per_week': Target X completions within Monday-Sunday week windows.
 * 
 * 2. Current Streak Calculation:
 *    - We traverse backwards in time day-by-day (or scheduled day-by-scheduled day).
 *    - If today is scheduled and COMPLETED: streak starts with 1 and accumulates earlier consecutive completed scheduled days.
 *    - If today is scheduled but NOT YET completed: today is treated as pending. We check the most recent past scheduled day (e.g. yesterday).
 *      If that past scheduled day was completed, the current active streak is retained (so users have until the end of today to check it off).
 *      If that past scheduled day was NOT completed (missed), the streak has broken and resets to 0.
 *    - If today is NOT a scheduled day (e.g. for weekdays habit): we check the most recent past scheduled day. If completed, streak is retained.
 * 
 * 3. Missed Scheduled Day:
 *    - Any scheduled day prior to today that is marked false/uncompleted breaks the streak immediately.
 * 
 * 4. Best Streak:
 *    - We evaluate all historical logs from creation up to today, tracking the longest consecutive sequence of completed scheduled days.
 */

import { Habit, HabitLogs, HabitComputedStats } from '../types';
import {
  formatDateKey,
  getTodayKey,
  addDaysToDateKey,
  getDayOfWeek,
  parseDateKey,
  getWeekDateKeys,
  getStartOfWeekKey,
} from './date';

/**
 * Determines whether a habit is scheduled to be performed on a specific dateKey.
 */
export function isHabitScheduledOnDate(habit: Habit, dateKey: string): boolean {
  if (habit.archived) return false;

  const freq = habit.frequency;
  if (!freq || freq.type === 'daily') {
    return true;
  }

  if (freq.type === 'weekdays') {
    if (!freq.days || freq.days.length === 0) return true;
    const dayOfWeek = getDayOfWeek(dateKey);
    return freq.days.includes(dayOfWeek);
  }

  if (freq.type === 'times_per_week') {
    // For times_per_week, every day is open for completion until the weekly quota is met
    return true;
  }

  return true;
}

/**
 * Checks whether a habit is completed on a specific dateKey.
 */
export function isHabitCompletedOnDate(
  habitLogs: HabitLogs,
  habitId: string,
  dateKey: string
): boolean {
  return !!(habitLogs[habitId] && habitLogs[habitId][dateKey]);
}

/**
 * Calculates the current streak for a habit as of today.
 */
export function calculateCurrentStreak(
  habit: Habit,
  habitLogs: HabitLogs,
  asOfDateKey: string = getTodayKey()
): number {
  const logs = habitLogs[habit.id] || {};
  const freq = habit.frequency;

  if (freq.type === 'times_per_week') {
    return calculateWeeklyStreak(habit, logs, asOfDateKey);
  }

  let streak = 0;
  let cursorDateKey = asOfDateKey;
  const isTodayScheduled = isHabitScheduledOnDate(habit, cursorDateKey);
  const isTodayCompleted = !!logs[cursorDateKey];

  if (isTodayScheduled) {
    if (isTodayCompleted) {
      streak += 1;
      cursorDateKey = addDaysToDateKey(cursorDateKey, -1);
    } else {
      // Today is pending (not completed yet). Do not count today, but don't break streak yet.
      // Move cursor to yesterday to see if prior streak is alive.
      cursorDateKey = addDaysToDateKey(cursorDateKey, -1);
    }
  } else {
    // Today is not a scheduled day for this habit (e.g. weekend for Mon-Fri habit).
    // Move to yesterday.
    cursorDateKey = addDaysToDateKey(cursorDateKey, -1);
  }

  // Iterate backwards through past days
  // Safety guard: max 3650 days (10 years)
  let guard = 0;
  while (guard < 3650) {
    guard++;
    // Check if habit existed before this date (optional limit, or continue until creation date)
    const cursorDate = parseDateKey(cursorDateKey);
    const createdDate = habit.createdAt ? new Date(habit.createdAt) : null;
    if (createdDate && cursorDate < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() - 1)) {
      break;
    }

    const scheduled = isHabitScheduledOnDate(habit, cursorDateKey);
    if (!scheduled) {
      // Non-scheduled day does not break streak for weekday habits
      cursorDateKey = addDaysToDateKey(cursorDateKey, -1);
      continue;
    }

    const completed = !!logs[cursorDateKey];
    if (completed) {
      streak += 1;
      cursorDateKey = addDaysToDateKey(cursorDateKey, -1);
    } else {
      // A past scheduled day was missed! Streak broken.
      break;
    }
  }

  return streak;
}

/**
 * Calculates current weekly streak for 'times_per_week' habits.
 */
function calculateWeeklyStreak(
  habit: Habit,
  logs: Record<string, boolean>,
  asOfDateKey: string
): number {
  const targetTimes = habit.frequency.timesPerWeek || 1;
  let streak = 0;

  // Check current week
  const currentWeekDays = getWeekDateKeys(asOfDateKey, true);
  const currentWeekCompletions = currentWeekDays.reduce(
    (acc, dayKey) => acc + (logs[dayKey] ? 1 : 0),
    0
  );

  // If current week already achieved target, include it
  if (currentWeekCompletions >= targetTimes) {
    streak += 1;
  }

  // Iterate previous weeks backwards
  let prevWeekStartKey = addDaysToDateKey(getStartOfWeekKey(asOfDateKey, true), -7);
  let guard = 0;

  while (guard < 520) { // Up to 10 years of weeks
    guard++;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDaysToDateKey(prevWeekStartKey, i));
    }

    // Check if before creation
    const createdDate = habit.createdAt ? new Date(habit.createdAt) : null;
    const weekEndDate = parseDateKey(weekDays[6]);
    if (createdDate && weekEndDate < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() - 7)) {
      break;
    }

    const completions = weekDays.reduce((acc, d) => acc + (logs[d] ? 1 : 0), 0);
    if (completions >= targetTimes) {
      streak += 1;
      prevWeekStartKey = addDaysToDateKey(prevWeekStartKey, -7);
    } else {
      // Prior week target not reached: streak broken
      break;
    }
  }

  return streak;
}

/**
 * Calculates the best streak ever achieved for a habit across its entire logged history.
 */
export function calculateBestStreak(
  habit: Habit,
  habitLogs: HabitLogs,
  currentStreak: number
): number {
  const logs = habitLogs[habit.id] || {};
  const dates = Object.keys(logs).filter((k) => logs[k]).sort();

  if (dates.length === 0) {
    return currentStreak;
  }

  if (habit.frequency.type === 'times_per_week') {
    // For times per week, best streak is at least the current streak or scan weeks
    return Math.max(currentStreak, calculateBestWeeklyStreak(habit, logs));
  }

  // Find earliest recorded date or habit creation date
  const earliestDateStr = dates[0];
  const todayStr = getTodayKey();

  let maxStreak = 0;
  let runningStreak = 0;
  let cursor = earliestDateStr;

  let guard = 0;
  while (cursor <= todayStr && guard < 3650) {
    guard++;
    const scheduled = isHabitScheduledOnDate(habit, cursor);
    if (scheduled) {
      if (logs[cursor]) {
        runningStreak++;
        if (runningStreak > maxStreak) {
          maxStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
    cursor = addDaysToDateKey(cursor, 1);
  }

  return Math.max(maxStreak, currentStreak);
}

function calculateBestWeeklyStreak(habit: Habit, logs: Record<string, boolean>): number {
  const dates = Object.keys(logs).filter((k) => logs[k]).sort();
  if (dates.length === 0) return 0;

  const targetTimes = habit.frequency.timesPerWeek || 1;
  const startWeek = getStartOfWeekKey(dates[0], true);
  const endWeek = getStartOfWeekKey(getTodayKey(), true);

  let maxStreak = 0;
  let runningStreak = 0;
  let currentWeekStart = startWeek;

  let guard = 0;
  while (currentWeekStart <= endWeek && guard < 520) {
    guard++;
    let completions = 0;
    for (let i = 0; i < 7; i++) {
      const dayKey = addDaysToDateKey(currentWeekStart, i);
      if (logs[dayKey]) completions++;
    }

    if (completions >= targetTimes) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }

    currentWeekStart = addDaysToDateKey(currentWeekStart, 7);
  }

  return maxStreak;
}

/**
 * Computes complete statistics for a single habit.
 */
export function computeHabitStats(
  habit: Habit,
  habitLogs: HabitLogs,
  asOfDateKey: string = getTodayKey()
): HabitComputedStats {
  const logs = habitLogs[habit.id] || {};
  const currentStreak = calculateCurrentStreak(habit, habitLogs, asOfDateKey);
  const bestStreak = calculateBestStreak(habit, habitLogs, currentStreak);

  // Total completions
  const completedDateKeys = Object.keys(logs).filter((k) => logs[k]);
  const totalCompletions = completedDateKeys.length;

  // Completion rate since creation or last 90 days
  const createdDateKey = habit.createdAt ? formatDateKey(habit.createdAt) : asOfDateKey;
  const daysSinceCreation = Math.max(1, Math.min(90, Math.floor((parseDateKey(asOfDateKey).getTime() - parseDateKey(createdDateKey).getTime()) / (1000 * 60 * 60 * 24)) + 1));
  
  let scheduledDaysCount = 0;
  let scheduledDaysCompleted = 0;

  for (let i = 0; i < daysSinceCreation; i++) {
    const dKey = addDaysToDateKey(asOfDateKey, -i);
    if (isHabitScheduledOnDate(habit, dKey)) {
      scheduledDaysCount++;
      if (logs[dKey]) {
        scheduledDaysCompleted++;
      }
    }
  }

  const completionRate = scheduledDaysCount > 0
    ? Math.round((scheduledDaysCompleted / scheduledDaysCount) * 100)
    : 0;

  const isScheduledToday = isHabitScheduledOnDate(habit, asOfDateKey);
  const isCompletedToday = !!logs[asOfDateKey];

  // Calculate weeklyProgress if habit is 'times_per_week'
  let weeklyProgress: HabitComputedStats['weeklyProgress'] = undefined;
  if (habit.frequency.type === 'times_per_week') {
    const target = habit.frequency.timesPerWeek || 1;
    const currentWeekDays = getWeekDateKeys(asOfDateKey, true);
    const completedThisWeek = currentWeekDays.reduce(
      (acc, dKey) => acc + (logs[dKey] ? 1 : 0),
      0
    );
    weeklyProgress = {
      completed: completedThisWeek,
      target,
      isTargetMet: completedThisWeek >= target,
    };
  }

  return {
    habit,
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate,
    isScheduledToday,
    isCompletedToday,
    lastCompletedDate: completedDateKeys.sort().reverse()[0],
    weeklyProgress,
  };
}

/**
 * Generates 90-day heatmap data matrix.
 * Returns array of { dateKey, completedCount, totalScheduled, intensityLevel: 0-4 }
 */
export interface HeatmapDayData {
  dateKey: string;
  completedCount: number;
  totalScheduled: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4; // 0 = none, 1 = 1-25%, 2 = 26-50%, 3 = 51-75%, 4 = 76-100%
  completedHabitNames: string[];
}

export function generate90DayHeatmap(
  habits: Habit[],
  habitLogs: HabitLogs,
  endDateKey: string = getTodayKey()
): HeatmapDayData[] {
  const activeHabits = habits.filter((h) => !h.archived);
  const result: HeatmapDayData[] = [];

  for (let i = 89; i >= 0; i--) {
    const dateKey = addDaysToDateKey(endDateKey, -i);
    let scheduledCount = 0;
    let completedCount = 0;
    const completedHabitNames: string[] = [];

    for (const habit of activeHabits) {
      const scheduled = isHabitScheduledOnDate(habit, dateKey);
      if (scheduled) {
        scheduledCount++;
        if (habitLogs[habit.id] && habitLogs[habit.id][dateKey]) {
          completedCount++;
          completedHabitNames.push(`${habit.emoji} ${habit.name}`);
        }
      }
    }

    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (completedCount > 0) {
      if (scheduledCount === 0) {
        intensityLevel = 4;
      } else {
        const ratio = completedCount / scheduledCount;
        if (ratio >= 0.99) intensityLevel = 4;
        else if (ratio >= 0.66) intensityLevel = 3;
        else if (ratio >= 0.33) intensityLevel = 2;
        else intensityLevel = 1;
      }
    }

    result.push({
      dateKey,
      completedCount,
      totalScheduled: scheduledCount,
      intensityLevel,
      completedHabitNames,
    });
  }

  return result;
}
