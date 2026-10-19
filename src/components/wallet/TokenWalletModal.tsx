import React, { useState, useMemo } from 'react';
import {
  X,
  Coins,
  Trophy,
  History,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  Habit,
  MilestoneConfig,
  TokenTransaction,
  HabitComputedStats,
  LoginStreakData,
} from '../../types';
import { getHabitMilestoneProgress, DEFAULT_MILESTONES } from '../../utils/rewards';
import { formatDisplayDate } from '../../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: number;
  totalTokensEarned: number;
  transactions: TokenTransaction[];
  milestones: MilestoneConfig[];
  habits: Habit[];
  computedStats: HabitComputedStats[];
  loginStreak: LoginStreakData;
  onAddMilestone: (data: Omit<MilestoneConfig, 'id'>) => Promise<MilestoneConfig>;
  onUpdateMilestone: (id: string, updates: Partial<MilestoneConfig>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  onToggleMilestone: (id: string) => Promise<void>;
}

export const TokenWalletModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tokenBalance,
  totalTokensEarned,
  transactions,
  milestones,
  habits,
  computedStats,
  loginStreak,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onToggleMilestone,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'progress' | 'config'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');

  // Milestone Add/Edit Form State
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState<number>(14);
  const [formReward, setFormReward] = useState<number>(35);
  const [formDescription, setFormDescription] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  // Filter transactions
  const filteredTransactions = transactions
    .filter((tx) => {
      if (selectedHabitFilter !== 'all' && tx.habitId !== selectedHabitFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          tx.description.toLowerCase().includes(query) ||
          tx.habitName?.toLowerCase().includes(query) ||
          tx.milestoneName?.toLowerCase().includes(query) ||
          tx.id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingMilestoneId(null);
    setFormName('14-Day Sprint');
    setFormDays(14);
    setFormReward(35);
    setFormDescription('Two weeks of continuous consistency');
  };

  const handleStartEdit = (m: MilestoneConfig) => {
    setEditingMilestoneId(m.id);
    setIsAddingNew(false);
    setFormName(m.name);
    setFormDays(m.days);
    setFormReward(m.tokenReward);
    setFormDescription(m.description || '');
  };

  const handleSaveMilestoneForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formDays <= 0 || formReward <= 0) return;

    if (isAddingNew) {
      await onAddMilestone({
        name: formName.trim(),
        days: formDays,
        tokenReward: formReward,
        description: formDescription.trim(),
        enabled: true,
      });
      setIsAddingNew(false);
    } else if (editingMilestoneId) {
      await onUpdateMilestone(editingMilestoneId, {
        name: formName.trim(),
        days: formDays,
        tokenReward: formReward,
        description: formDescription.trim(),
      });
      setEditingMilestoneId(null);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset milestones to default tiers (7, 20, 30, 60, 90 days)?')) {
      for (const m of milestones) {
        await onDeleteMilestone(m.id);
      }
      for (const dm of DEFAULT_MILESTONES) {
        await onAddMilestone({
          name: dm.name,
          days: dm.days,
          tokenReward: dm.tokenReward,
          description: dm.description,
          enabled: true,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/25">
              <Coins className="h-5 w-5 fill-amber-100/20 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Token Wallet & Milestones</span>
                <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {tokenBalance} Tokens
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reward currency earned exclusively by completing habits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Transaction Ledger ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'progress'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Milestones Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Config ({milestones.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: TRANSACTION LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Balance Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Current Balance
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {tokenBalance}
                    </span>
                    <span className="text-xs font-bold text-slate-500">tokens</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lifetime Earned
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {totalTokensEarned}
                    </span>
                    <span className="text-xs font-bold text-slate-500">tokens</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Login Streak (Separate)
                    </span>
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {loginStreak.currentStreak}
                    </span>
                    <span className="text-xs font-bold text-slate-500">days</span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <input
                  type="text"
                  placeholder="Search ledger by habit or milestone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <select
                  value={selectedHabitFilter}
                  onChange={(e) => setSelectedHabitFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Habits</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.emoji} {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 text-xl">
                    🪙
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No token rewards recorded yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete your scheduled habits consistently to reach milestones (e.g. 7, 20, 30 days) and earn virtual HabitPulse tokens!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          +{tx.amount}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-400">ID: {tx.id.substring(0, 16)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Credited</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MILESTONES PROGRESS */}
          {activeTab === 'progress' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 p-4 border border-indigo-200/80 dark:border-indigo-800/60 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>How Habit Milestones Work</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Each habit maintains independent streak progress. Completing a habit on scheduled days advances its milestone counters. Reaching a milestone threshold grants you HabitPulse Tokens once per cycle!
                </p>
              </div>

              {habits.filter((h) => !h.archived).map((habit) => {
                const stat = computedStats.find((s) => s.habit.id === habit.id);
                const currentStreak = stat ? stat.currentStreak : 0;
                const progressItems = getHabitMilestoneProgress(habit, currentStreak, milestones);

                return (
                  <div
                    key={habit.id}
                    className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{habit.emoji}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {habit.name}
                          </h4>
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            Current Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Progress Bars */}
                    <div className="space-y-2.5 pt-1">
                      {progressItems.map((item) => (
                        <div key={item.milestone.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <span>{item.milestone.name}</span>
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                (+{item.milestone.tokenReward} 🪙)
                              </span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {item.currentDays} / {item.targetDays} days ({item.percentage}%)
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: MILESTONE CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Configurable Milestones
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize interval days and token rewards for your habits
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefaults}
                    title="Reset to default milestones"
                    className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Defaults</span>
                  </button>

                  <button
                    onClick={handleStartAdd}
                    className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>
              </div>

              {/* Add / Edit Form Modal inside Config tab */}
              {(isAddingNew || editingMilestoneId) && (
                <form
                  onSubmit={handleSaveMilestoneForm}
                  className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in duration-150"
                >
                  <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    {isAddingNew ? 'Create New Milestone Tier' : 'Edit Milestone Tier'}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Milestone Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. 14-Day Sprint"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Interval (Consecutive Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        required
                        value={formDays}
                        onChange={(e) => setFormDays(parseInt(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Token Reward Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        required
                        value={formReward}
                        onChange={(e) => setFormReward(parseInt(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="e.g. Two weeks of uninterrupted consistency"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingMilestoneId(null);
                      }}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 text-xs transition cursor-pointer"
                    >
                      Save Milestone
                    </button>
                  </div>
                </form>
              )}

              {/* Milestones List */}
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                      m.enabled
                        ? 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                        : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-sm">
                        {m.days}d
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.name}
                          </h5>
                          <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                            +{m.tokenReward} 🪙
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => onToggleMilestone(m.id)}
                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          m.enabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit milestone"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${m.name}?`)) {
                            onDeleteMilestone(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
