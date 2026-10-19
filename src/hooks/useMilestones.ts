import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Habit,
  HabitLogs,
  MilestoneConfig,
  TokenTransaction,
  HabitMilestoneClaim,
} from '../types';
import { storage } from '../storage/storage';
import {
  DEFAULT_MILESTONES,
  evaluateHabitMilestones,
  calculateTokenBalance,
  calculateTotalTokensEarned,
  getHabitMilestoneProgress,
  HabitMilestoneProgressItem,
  MilestoneEvaluationResult,
} from '../utils/rewards';
import { calculateCurrentStreak } from '../utils/streaks';
import { getTodayKey } from '../utils/date';
import { sound, triggerHaptic } from '../utils/sound';

export interface NewlyAwardedMilestone {
  milestone: MilestoneConfig;
  habit: Habit;
  cycle: number;
  tokensAwarded: number;
}

export function useMilestones() {
  const [milestones, setMilestones] = useState<MilestoneConfig[]>(DEFAULT_MILESTONES);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [milestoneClaims, setMilestoneClaims] = useState<HabitMilestoneClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyAwardedMilestone, setNewlyAwardedMilestone] = useState<NewlyAwardedMilestone | null>(null);

  // Load milestones and token transactions from storage
  const loadMilestonesData = useCallback(async () => {
    try {
      const [savedMilestones, savedTransactions, savedClaims] = await Promise.all([
        storage.getMilestones(),
        storage.getTransactions(),
        storage.getMilestoneClaims(),
      ]);

      if (savedMilestones && savedMilestones.length > 0) {
        setMilestones(savedMilestones);
      }
      if (savedTransactions) {
        setTransactions(savedTransactions);
      }
      if (savedClaims) {
        setMilestoneClaims(savedClaims);
      }
    } catch (e) {
      console.error('Failed to load milestone & token data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMilestonesData();

    // Listen to custom cross-tab or cross-event updates
    const handleMilestonesChange = () => storage.getMilestones().then(setMilestones);
    const handleTransactionsChange = () => storage.getTransactions().then(setTransactions);
    const handleClaimsChange = () => storage.getMilestoneClaims().then(setMilestoneClaims);
    const handleReset = () => loadMilestonesData();

    window.addEventListener('habitpulse-milestones-changed', handleMilestonesChange);
    window.addEventListener('habitpulse-transactions-changed', handleTransactionsChange);
    window.addEventListener('habitpulse-claims-changed', handleClaimsChange);
    window.addEventListener('habitpulse-reset', handleReset);

    return () => {
      window.removeEventListener('habitpulse-milestones-changed', handleMilestonesChange);
      window.removeEventListener('habitpulse-transactions-changed', handleTransactionsChange);
      window.removeEventListener('habitpulse-claims-changed', handleClaimsChange);
      window.removeEventListener('habitpulse-reset', handleReset);
    };
  }, [loadMilestonesData]);

  // Derived Token Balances
  const tokenBalance = useMemo(() => {
    return calculateTokenBalance(transactions);
  }, [transactions]);

  const totalTokensEarned = useMemo(() => {
    return calculateTotalTokensEarned(transactions);
  }, [transactions]);

  /**
   * Evaluates milestone completion for a habit after logging completion,
   * creates idempotent token reward transactions, and triggers celebration.
   */
  const evaluateAndAwardMilestones = useCallback(
    async (
      habit: Habit,
      currentLogs: HabitLogs,
      dateKey: string = getTodayKey(),
      options: { soundEnabled?: boolean; hapticsEnabled?: boolean } = {}
    ): Promise<MilestoneEvaluationResult> => {
      if (habit.archived) {
        return { newTransactions: [], newClaims: [], awardedMilestones: [] };
      }

      const evaluation = evaluateHabitMilestones(
        habit,
        currentLogs,
        milestones,
        milestoneClaims,
        transactions,
        dateKey
      );

      if (evaluation.newTransactions.length > 0) {
        const updatedTransactions = [...transactions, ...evaluation.newTransactions];
        const updatedClaims = [...milestoneClaims, ...evaluation.newClaims];

        setTransactions(updatedTransactions);
        setMilestoneClaims(updatedClaims);

        await Promise.all([
          storage.addTransactions(evaluation.newTransactions),
          storage.addMilestoneClaims(evaluation.newClaims),
        ]);

        const firstAward = evaluation.awardedMilestones[0];
        if (firstAward) {
          setNewlyAwardedMilestone(firstAward);

          // Audio & visual feedback
          setTimeout(() => {
            if (options.soundEnabled !== false) {
              sound.playCelebration(true);
            }
            if (options.hapticsEnabled !== false) {
              triggerHaptic('celebration', true);
            }
            try {
              confetti({
                particleCount: 110,
                spread: 85,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#fbbf24', '#6366f1', '#10b981', '#ec4899', '#3b82f6'],
              });
            } catch {}
          }, 120);
        }
      }

      return evaluation;
    },
    [milestones, milestoneClaims, transactions]
  );

  /**
   * Derives milestone progress items for a habit from logs
   */
  const getHabitProgress = useCallback(
    (habit: Habit, logs: HabitLogs, asOfDateKey: string = getTodayKey()): HabitMilestoneProgressItem[] => {
      const currentStreak = calculateCurrentStreak(habit, logs, asOfDateKey);
      return getHabitMilestoneProgress(habit, currentStreak, milestones);
    },
    [milestones]
  );

  /**
   * Retrieves the next uncompleted milestone for a given habit
   */
  const getNextMilestoneForHabit = useCallback(
    (habit: Habit, logs: HabitLogs, asOfDateKey: string = getTodayKey()) => {
      const progressItems = getHabitProgress(habit, logs, asOfDateKey);
      return progressItems.find((p) => p.currentDays < p.targetDays) || progressItems[progressItems.length - 1];
    },
    [getHabitProgress]
  );

  // Milestone Configuration CRUD
  const addMilestone = useCallback(
    async (milestoneData: Omit<MilestoneConfig, 'id'>) => {
      const newMilestone: MilestoneConfig = {
        ...milestoneData,
        id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      const updated = [...milestones, newMilestone].sort((a, b) => a.days - b.days);
      setMilestones(updated);
      await storage.saveMilestones(updated);
      return newMilestone;
    },
    [milestones]
  );

  const updateMilestone = useCallback(
    async (id: string, updates: Partial<MilestoneConfig>) => {
      const updated = milestones
        .map((m) => (m.id === id ? { ...m, ...updates } : m))
        .sort((a, b) => a.days - b.days);
      setMilestones(updated);
      await storage.saveMilestones(updated);
    },
    [milestones]
  );

  const deleteMilestone = useCallback(
    async (id: string) => {
      const updated = milestones.filter((m) => m.id !== id);
      setMilestones(updated);
      await storage.saveMilestones(updated);
    },
    [milestones]
  );

  const toggleMilestone = useCallback(
    async (id: string) => {
      const target = milestones.find((m) => m.id === id);
      if (!target) return;
      await updateMilestone(id, { enabled: !target.enabled });
    },
    [milestones, updateMilestone]
  );

  const dismissCelebration = useCallback(() => {
    setNewlyAwardedMilestone(null);
  }, []);

  return {
    milestones,
    transactions,
    milestoneClaims,
    tokenBalance,
    totalTokensEarned,
    isLoading,
    newlyAwardedMilestone,
    setNewlyAwardedMilestone,
    dismissCelebration,
    evaluateAndAwardMilestones,
    getHabitProgress,
    getNextMilestoneForHabit,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    refreshMilestones: loadMilestonesData,
  };
}
