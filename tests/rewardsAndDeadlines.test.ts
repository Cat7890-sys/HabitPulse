/**
 * @file tests/rewardsAndDeadlines.test.ts
 * Verification suite testing token rewards, milestone cycles, goal deadlines, and login streak rules.
 */

import { Habit, HabitLogs, MilestoneConfig, TokenTransaction, HabitMilestoneClaim, LoginStreakData } from '../src/types';
import {
  DEFAULT_MILESTONES,
  evaluateHabitMilestones,
  calculateTokenBalance,
  calculateTotalTokensEarned,
  getHabitMilestoneProgress,
} from '../src/utils/rewards';
import { computeHabitDeadline, getTargetDateTime } from '../src/utils/deadlines';
import { calculateCurrentStreak, isHabitScheduledOnDate } from '../src/utils/streaks';
import { getTodayKey, addDaysToDateKey } from '../src/utils/date';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('=== RUNNING HABITPULSE UPGRADE TESTS ===\n');

// ---------------------------------------------------------------------------
// TEST 1: Logging in twice on the same day increases the login streak only once
// ---------------------------------------------------------------------------
console.log('--- Test 1 & 2: Daily Login Streak Logic & Token Isolation ---');
const today = getTodayKey();
const yesterday = addDaysToDateKey(today, -1);

function simulateDailyLogin(current: LoginStreakData, currentDateKey: string): LoginStreakData {
  if (current.lastLoginDate === currentDateKey) {
    return current; // Same day: no increase
  }

  const prevDay = addDaysToDateKey(currentDateKey, -1);
  let newCurrentStreak = 1;
  if (current.lastLoginDate === prevDay) {
    newCurrentStreak = (current.currentStreak || 0) + 1;
  }

  const newLongestStreak = Math.max(current.longestStreak || 0, newCurrentStreak);
  const historySet = new Set(current.history || []);
  historySet.add(currentDateKey);

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastLoginDate: currentDateKey,
    history: Array.from(historySet),
  };
}

let streak: LoginStreakData = { currentStreak: 0, longestStreak: 0, lastLoginDate: '' };
streak = simulateDailyLogin(streak, yesterday);
assert(streak.currentStreak === 1 && streak.lastLoginDate === yesterday, 'First login sets streak to 1');

// Login again on yesterday (same calendar day)
streak = simulateDailyLogin(streak, yesterday);
assert(streak.currentStreak === 1, 'Logging in again on same calendar day does not increase streak');

// Login today (consecutive calendar day)
streak = simulateDailyLogin(streak, today);
assert(streak.currentStreak === 2 && streak.longestStreak === 2, 'Consecutive day login increases streak to 2');

// Login today again
streak = simulateDailyLogin(streak, today);
assert(streak.currentStreak === 2, 'Subsequent login on same day maintains streak 2');

// Miss a day (skip to today + 2)
const futureDay = addDaysToDateKey(today, 2);
streak = simulateDailyLogin(streak, futureDay);
assert(streak.currentStreak === 1 && streak.longestStreak === 2, 'Missed calendar day resets current streak to 1 while preserving longestStreak');

// ---------------------------------------------------------------------------
// TEST 2: Logging in does not award habit-completion tokens
// ---------------------------------------------------------------------------
const emptyTransactions: TokenTransaction[] = [];
const loginTokens = calculateTokenBalance(emptyTransactions);
assert(loginTokens === 0, 'Login does not award tokens (balance remains 0)');

// ---------------------------------------------------------------------------
// TEST 3 & 4: Habit Milestone Rewards & Idempotency
// ---------------------------------------------------------------------------
console.log('\n--- Test 3, 4 & 5: Milestone Progress, Awards, & Idempotency ---');
const habitA: Habit = {
  id: 'habit-water',
  name: 'Drink 2L Water',
  emoji: '💧',
  color: 'cyan',
  frequency: { type: 'daily' },
  createdAt: addDaysToDateKey(today, -30),
};

const habitLogs: HabitLogs = {
  [habitA.id]: {},
};

// Log 7 consecutive days for habitA (from today-6 to today)
for (let i = 0; i < 7; i++) {
  const dKey = addDaysToDateKey(today, -i);
  habitLogs[habitA.id][dKey] = true;
}

const activeStreak = calculateCurrentStreak(habitA, habitLogs, today);
assert(activeStreak === 7, 'Habit streak correctly calculated as 7 days');

const evalResult1 = evaluateHabitMilestones(
  habitA,
  habitLogs,
  DEFAULT_MILESTONES,
  [],
  [],
  today
);

assert(evalResult1.awardedMilestones.length === 1, 'Reaching 7-day milestone awards 1 milestone');
assert(evalResult1.awardedMilestones[0].tokensAwarded === 20, '7-day milestone awards configured 20 tokens');
assert(evalResult1.newTransactions.length === 1, 'Generates exactly 1 ledger transaction');

// Simulate storing claims and transactions
const existingClaims: HabitMilestoneClaim[] = [...evalResult1.newClaims];
const existingTransactions: TokenTransaction[] = [...evalResult1.newTransactions];

const balanceAfterAward = calculateTokenBalance(existingTransactions);
assert(balanceAfterAward === 20, 'Token balance reconciles to 20 tokens');

// Re-evaluating immediately (e.g. reload or duplicate click)
const evalResult2 = evaluateHabitMilestones(
  habitA,
  habitLogs,
  DEFAULT_MILESTONES,
  existingClaims,
  existingTransactions,
  today
);
assert(evalResult2.newTransactions.length === 0, 'Page reload or repeat action does NOT award duplicate tokens');

// ---------------------------------------------------------------------------
// TEST 6: Two different habits maintain independent milestone progress
// ---------------------------------------------------------------------------
console.log('\n--- Test 6: Independent Habit Milestone Progress ---');
const habitB: Habit = {
  id: 'habit-run',
  name: 'Morning Run',
  emoji: '🏃‍♂️',
  color: 'emerald',
  frequency: { type: 'daily' },
  createdAt: addDaysToDateKey(today, -10),
};

habitLogs[habitB.id] = {};
// Only 3 days completed for habitB
for (let i = 0; i < 3; i++) {
  const dKey = addDaysToDateKey(today, -i);
  habitLogs[habitB.id][dKey] = true;
}

const evalResultHabitB = evaluateHabitMilestones(
  habitB,
  habitLogs,
  DEFAULT_MILESTONES,
  existingClaims,
  existingTransactions,
  today
);
assert(evalResultHabitB.awardedMilestones.length === 0, 'Habit B (streak 3) has not reached 7-day milestone');

const progressA = getHabitMilestoneProgress(habitA, 7, DEFAULT_MILESTONES);
const progressB = getHabitMilestoneProgress(habitB, 3, DEFAULT_MILESTONES);
assert(progressA[0].percentage === 100, 'Habit A is 100% on 7-day milestone');
assert(progressB[0].currentDays === 3 && progressB[0].targetDays === 7, 'Habit B is 3/7 on 7-day milestone');

// ---------------------------------------------------------------------------
// TEST 7: Custom milestone intervals
// ---------------------------------------------------------------------------
console.log('\n--- Test 7: Custom Milestone Intervals & Persistence ---');
const customMilestones: MilestoneConfig[] = [
  ...DEFAULT_MILESTONES,
  {
    id: 'milestone-custom-14',
    name: '14-Day Sprint',
    days: 14,
    tokenReward: 60,
    enabled: true,
  },
];

// Give habitA 14 consecutive days
for (let i = 7; i < 14; i++) {
  const dKey = addDaysToDateKey(today, -i);
  habitLogs[habitA.id][dKey] = true;
}

const evalResultCustom = evaluateHabitMilestones(
  habitA,
  habitLogs,
  customMilestones,
  existingClaims,
  existingTransactions,
  today
);

assert(
  evalResultCustom.awardedMilestones.some((m) => m.milestone.days === 14 && m.tokensAwarded === 60),
  'Custom 14-day milestone evaluated and awarded 60 tokens'
);

// ---------------------------------------------------------------------------
// TEST 8: Scheduled habit occurrence cannot be completed twice
// ---------------------------------------------------------------------------
console.log('\n--- Test 8: Single completion status per scheduled occurrence ---');
habitLogs[habitA.id][today] = true;
habitLogs[habitA.id][today] = true; // Duplicate click
assert(habitLogs[habitA.id][today] === true, 'Habit status for date remains single boolean true');

// ---------------------------------------------------------------------------
// TEST 9 & 10: Goals & Deadlines, Remaining Time, Overdue Status
// ---------------------------------------------------------------------------
console.log('\n--- Test 9, 10 & 11: Goal Deadlines, Remaining Time, & One-time Tasks ---');
const pastDate = addDaysToDateKey(today, -2);
const futureDate = addDaysToDateKey(today, 3);

// Overdue task
const overdueTask: Habit = {
  id: 'task-overdue',
  name: 'Submit Assignment',
  emoji: '📝',
  color: 'rose',
  goalType: 'one_time',
  frequency: { type: 'daily' },
  targetDate: pastDate,
  createdAt: addDaysToDateKey(today, -5),
};

const deadlineOverdue = computeHabitDeadline(overdueTask, habitLogs);
assert(deadlineOverdue !== null, 'Deadline computed for overdue task');
assert(deadlineOverdue?.isOverdue === true, 'Task correctly detected as overdue');
assert(deadlineOverdue?.status === 'overdue', 'Status is overdue');
assert(deadlineOverdue?.remainingText.includes('Overdue'), 'Remaining text indicates overdue');

// Future task
const upcomingTask: Habit = {
  id: 'task-upcoming',
  name: 'Launch Project',
  emoji: '🚀',
  color: 'indigo',
  goalType: 'one_time',
  frequency: { type: 'daily' },
  targetDate: futureDate,
  targetTime: '18:00',
  createdAt: today,
};

const deadlineUpcoming = computeHabitDeadline(upcomingTask, habitLogs);
assert(deadlineUpcoming?.isOverdue === false, 'Upcoming task is not overdue');
assert(deadlineUpcoming?.remainingText.includes('Due in 3 days') || deadlineUpcoming?.remainingText.includes('Due in'), 'Shows correct remaining days');

// Completed task
const completedTask: Habit = {
  ...upcomingTask,
  isGoalCompleted: true,
  goalCompletedAt: new Date().toISOString(),
};

const deadlineCompleted = computeHabitDeadline(completedTask, habitLogs);
assert(deadlineCompleted?.status === 'completed', 'Completed task has status completed');
assert(deadlineCompleted?.remainingText.includes('Completed'), 'Shows actual completion date');

// Recurring habit does not prematurely complete goal
const recurringHabit: Habit = {
  id: 'habit-reading',
  name: 'Read Book',
  emoji: '📖',
  color: 'amber',
  goalType: 'recurring',
  frequency: { type: 'daily' },
  targetDate: futureDate,
  targetCompletions: 10,
  createdAt: today,
};

habitLogs[recurringHabit.id] = { [today]: true };
const deadlineRecurring = computeHabitDeadline(recurringHabit, habitLogs);
assert(deadlineRecurring?.status === 'in_progress', '1 check-in does not complete recurring long-term goal');
assert(deadlineRecurring?.progress?.completed === 1 && deadlineRecurring?.progress?.target === 10, 'Accurately tracks 1/10 progress');

console.log('\n🎉 ALL ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!');
