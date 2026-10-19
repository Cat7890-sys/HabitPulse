/**
 * @file deadlines.ts
 * Calculation and formatting engine for Habit Goals, Target Deadlines, and Statuses.
 */

import { Habit, HabitLogs, GoalStatus } from '../types';
import { getTodayKey, parseDateKey } from './date';

export interface DeadlineInfo {
  status: GoalStatus;
  isOverdue: boolean;
  remainingText: string;
  formattedTarget: string;
  progress?: {
    completed: number;
    target: number;
    percentage: number;
  };
}

/**
 * Parses target date and optional target time into a local Date object.
 */
export function getTargetDateTime(targetDate: string, targetTime?: string): Date {
  const parts = targetDate.split('-').map(Number);
  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  if (targetTime) {
    const timeParts = targetTime.split(':').map(Number);
    if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
      hours = timeParts[0];
      minutes = timeParts[1];
      seconds = 0;
    }
  }

  return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, seconds, 0);
}

/**
 * Computes goal deadline details and status for a habit or task.
 */
export function computeHabitDeadline(
  habit: Habit,
  habitLogs: HabitLogs,
  now: Date = new Date()
): DeadlineInfo | null {
  if (!habit.targetDate) {
    return null;
  }

  const targetDateObj = getTargetDateTime(habit.targetDate, habit.targetTime);
  const nowTime = now.getTime();
  const targetTimeMs = targetDateObj.getTime();
  const diffMs = targetTimeMs - nowTime;

  // Format readable target string (e.g. "Oct 24, 2026 at 18:00")
  const dateFormatted = targetDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTarget = habit.targetTime
    ? `${dateFormatted} at ${habit.targetTime}`
    : dateFormatted;

  // Check completions progress if targetCompletions is set
  let progress: { completed: number; target: number; percentage: number } | undefined;
  const logsForHabit = habitLogs[habit.id] || {};
  const totalCompletedCount = Object.values(logsForHabit).filter(Boolean).length;

  if (habit.targetCompletions && habit.targetCompletions > 0) {
    const target = habit.targetCompletions;
    const completed = Math.min(totalCompletedCount, target);
    const percentage = Math.round((completed / target) * 100);
    progress = { completed, target, percentage };
  }

  // Check if goal is explicitly completed or target completions reached
  if (
    habit.isGoalCompleted ||
    (habit.targetCompletions && totalCompletedCount >= habit.targetCompletions)
  ) {
    const completedDateText = habit.goalCompletedAt
      ? new Date(habit.goalCompletedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : dateFormatted;

    return {
      status: 'completed',
      isOverdue: false,
      remainingText: `Completed on ${completedDateText}`,
      formattedTarget,
      progress,
    };
  }

  // Check if overdue
  if (diffMs < 0) {
    const overdueDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const overdueHours = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60));

    let remainingText = '';
    if (overdueDays > 1) {
      remainingText = `Overdue by ${overdueDays} days`;
    } else if (overdueHours > 1) {
      remainingText = `Overdue by ${overdueHours}h`;
    } else {
      remainingText = 'Overdue';
    }

    return {
      status: 'overdue',
      isOverdue: true,
      remainingText,
      formattedTarget,
      progress,
    };
  }

  // Not overdue: compute remaining time
  const remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let remainingText = '';
  const todayKey = getTodayKey();

  if (habit.targetDate === todayKey) {
    if (habit.targetTime) {
      if (remainingHours <= 1) {
        const remainingMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        remainingText = `Due in ${remainingMinutes}m (${habit.targetTime})`;
      } else {
        remainingText = `Due today at ${habit.targetTime} (${remainingHours}h left)`;
      }
    } else {
      remainingText = 'Due today';
    }
  } else if (remainingDays === 1) {
    remainingText = habit.targetTime
      ? `Due tomorrow at ${habit.targetTime}`
      : 'Due tomorrow';
  } else if (remainingDays > 1) {
    remainingText = `Due in ${remainingDays} days`;
  } else {
    remainingText = `Due in ${remainingHours}h`;
  }

  // Determine status: 'not_started' vs 'in_progress'
  const status: GoalStatus = totalCompletedCount > 0 ? 'in_progress' : 'not_started';

  return {
    status,
    isOverdue: false,
    remainingText,
    formattedTarget,
    progress,
  };
}
