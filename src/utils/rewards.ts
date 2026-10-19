/**
 * @file rewards.ts
 * Milestone evaluation and token award engine for HabitPulse.
 * 
 * Rules:
 * 1. Tokens are awarded ONLY for qualifying habit completions reaching configured milestones.
 * 2. Login streaks NEVER award tokens.
 * 3. Every transaction has a unique, deterministic ID to guarantee idempotency.
 * 4. Milestone progress is maintained independently per habit.
 * 5. Cycles reset cleanly when a streak breaks, but claimed history is preserved forever.
 */

import { Habit, HabitLogs, MilestoneConfig, TokenTransaction, HabitMilestoneClaim } from '../types';
import { calculateCurrentStreak } from './streaks';

export const DEFAULT_MILESTONES: MilestoneConfig[] = [
  {
    id: 'milestone-7',
    name: '7-Day Sprint',
    days: 7,
    tokenReward: 20,
    description: 'Complete 7 consecutive scheduled habit days',
    enabled: true,
  },
  {
    id: 'milestone-20',
    name: '20-Day Momentum',
    days: 20,
    tokenReward: 50,
    description: 'Reach a solid 20-day streak of consistency',
    enabled: true,
  },
  {
    id: 'milestone-30',
    name: '30-Day Master',
    days: 30,
    tokenReward: 100,
    description: 'Achieve one full month of disciplined habit tracking',
    enabled: true,
  },
  {
    id: 'milestone-60',
    name: '60-Day Titan',
    days: 60,
    tokenReward: 200,
    description: 'Maintain unstoppable consistency for two months',
    enabled: true,
  },
  {
    id: 'milestone-90',
    name: '90-Day Legend',
    days: 90,
    tokenReward: 350,
    description: 'The golden milestone: 90 consecutive days of excellence',
    enabled: true,
  },
];

export interface MilestoneEvaluationResult {
  newTransactions: TokenTransaction[];
  newClaims: HabitMilestoneClaim[];
  awardedMilestones: {
    milestone: MilestoneConfig;
    habit: Habit;
    cycle: number;
    tokensAwarded: number;
  }[];
}

/**
 * Reconciles token balance from transactions list.
 */
export function calculateTokenBalance(transactions: TokenTransaction[]): number {
  return transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
}

/**
 * Computes total lifetime tokens earned (sum of all positive awards).
 */
export function calculateTotalTokensEarned(transactions: TokenTransaction[]): number {
  return transactions.reduce((acc, tx) => (tx.amount > 0 ? acc + tx.amount : acc), 0);
}

/**
 * Evaluates whether habit completion qualifies for any enabled milestone rewards.
 * 
 * Each milestone interval represents a cycle:
 * For a milestone with interval `M` days (e.g. 7 days):
 * - If current streak is 7, cycle = 1 (days 1-7).
 * - If current streak is 14, cycle = 2 (days 8-14).
 * - Claim ID is deterministic: `claim_${habit.id}_${milestone.id}_cycle_${cycle}`.
 * - If a claim with this ID already exists in `existingClaims` or `existingTransactions`,
 *   it is SKIPPED to guarantee idempotency.
 */
export function evaluateHabitMilestones(
  habit: Habit,
  habitLogs: HabitLogs,
  milestones: MilestoneConfig[],
  existingClaims: HabitMilestoneClaim[],
  existingTransactions: TokenTransaction[],
  asOfDateKey: string
): MilestoneEvaluationResult {
  const result: MilestoneEvaluationResult = {
    newTransactions: [],
    newClaims: [],
    awardedMilestones: [],
  };

  // Only evaluate active habits
  if (habit.archived) {
    return result;
  }

  // Active current streak on qualifying scheduled days
  const currentStreak = calculateCurrentStreak(habit, habitLogs, asOfDateKey);
  if (currentStreak <= 0) {
    return result;
  }

  // Set of existing claim IDs for quick O(1) lookup
  const claimIdSet = new Set<string>();
  existingClaims.forEach((c) => claimIdSet.add(c.id));

  // Set of existing transaction IDs
  const txIdSet = new Set<string>();
  existingTransactions.forEach((tx) => txIdSet.add(tx.id));

  // Filter and sort enabled milestones by days ascending
  const enabledMilestones = milestones
    .filter((m) => m.enabled && m.days > 0 && m.tokenReward > 0)
    .sort((a, b) => a.days - b.days);

  for (const milestone of enabledMilestones) {
    // Current cycle index for this milestone interval (1-based)
    // E.g. for days=7: streak 7..13 => cycle 1; streak 14..20 => cycle 2
    const totalCyclesReached = Math.floor(currentStreak / milestone.days);

    for (let cycle = 1; cycle <= totalCyclesReached; cycle++) {
      const claimId = `claim_${habit.id}_${milestone.id}_cycle_${cycle}`;
      const transactionId = `tx_reward_${habit.id}_${milestone.id}_cycle_${cycle}`;

      // Check if already claimed or awarded
      if (claimIdSet.has(claimId) || txIdSet.has(transactionId)) {
        continue;
      }

      // Generate new award transaction
      const nowIso = new Date().toISOString();
      const transaction: TokenTransaction = {
        id: transactionId,
        type: 'milestone_reward',
        amount: milestone.tokenReward,
        habitId: habit.id,
        habitName: habit.name,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        description: `Earned ${milestone.tokenReward} tokens: Reached ${milestone.days}-day milestone with "${habit.name}"!`,
        createdAt: nowIso,
      };

      const claim: HabitMilestoneClaim = {
        id: claimId,
        habitId: habit.id,
        milestoneId: milestone.id,
        cycle,
        claimedStreak: cycle * milestone.days,
        claimedAt: nowIso,
        transactionId,
      };

      // Mark as processed in local sets to prevent duplicate in same batch
      claimIdSet.add(claimId);
      txIdSet.add(transactionId);

      result.newTransactions.push(transaction);
      result.newClaims.push(claim);
      result.awardedMilestones.push({
        milestone,
        habit,
        cycle,
        tokensAwarded: milestone.tokenReward,
      });
    }
  }

  return result;
}

/**
 * Computes progress of a habit toward each enabled milestone.
 */
export interface HabitMilestoneProgressItem {
  milestone: MilestoneConfig;
  currentDays: number;
  targetDays: number;
  percentage: number;
  isUnlockedInCurrentCycle: boolean;
  totalCyclesCompleted: number;
}

export function getHabitMilestoneProgress(
  habit: Habit,
  currentStreak: number,
  milestones: MilestoneConfig[]
): HabitMilestoneProgressItem[] {
  const enabledMilestones = milestones
    .filter((m) => m.enabled && m.days > 0)
    .sort((a, b) => a.days - b.days);

  return enabledMilestones.map((m) => {
    const totalCyclesCompleted = Math.floor(currentStreak / m.days);
    const progressInCurrentCycle = currentStreak % m.days;
    const isUnlockedInCurrentCycle = totalCyclesCompleted > 0 && progressInCurrentCycle === 0;

    const currentDays = isUnlockedInCurrentCycle ? m.days : progressInCurrentCycle;
    const targetDays = m.days;
    const percentage = Math.min(100, Math.round((currentDays / targetDays) * 100));

    return {
      milestone: m,
      currentDays,
      targetDays,
      percentage,
      isUnlockedInCurrentCycle,
      totalCyclesCompleted,
    };
  });
}
