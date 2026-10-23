import React, { useState } from 'react';
import { ActiveTab, Habit, Category } from './types';
import { useHabits } from './hooks/useHabits';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { TodayScreen } from './components/today/TodayScreen';
import { HabitListScreen } from './components/habits/HabitListScreen';
import { StatsScreen } from './components/stats/StatsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { HabitFormModal } from './components/habits/HabitFormModal';
import { CategoryManagerModal } from './components/habits/CategoryManagerModal';
import { DeleteConfirmModal } from './components/habits/DeleteConfirmModal';
import { CelebrationModal } from './components/today/CelebrationModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { AuthModal } from './components/auth/AuthModal';
import { DataMigrationModal } from './components/auth/DataMigrationModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { TokenWalletModal } from './components/wallet/TokenWalletModal';
import { MilestoneCelebrationModal } from './components/wallet/MilestoneCelebrationModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthGuard } from './auth/AuthGuard';
import { useAuth } from './auth/useAuth';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const { user, isAdmin } = useAuth();

  const {
    habits,
    categories,
    logs,
    settings,
    profile,
    milestones,
    transactions,
    tokenBalance,
    totalTokensEarned,
    loginStreak,
    isLoading,
    selectedDateKey,
    setSelectedDateKey,
    allComputedStats,
    computedStats,
    todayProgress,
    toggleHabit,
    addHabit,
    updateHabit,
    toggleArchiveHabit,
    completeGoal,
    deleteHabit,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    updateProfile,
    refreshData,
    showCelebrationModal,
    setShowCelebrationModal,
    newlyAwardedMilestone,
    setNewlyAwardedMilestone,
  } = useHabits();

  // Pending habits for badge counter
  const pendingTodayCount = Math.max(0, todayProgress.total - todayProgress.completed);

  // Compute total completions and best streak for profile XP/level
  const totalCompletions = React.useMemo(() => {
    let count = 0;
    Object.values(logs).forEach((habitDateMap) => {
      Object.values(habitDateMap).forEach((val) => {
        if (val) count++;
      });
    });
    return count;
  }, [logs]);

  const bestOverallStreak = React.useMemo(() => {
    return allComputedStats.reduce((max, s) => Math.max(max, s.bestStreak), 0);
  }, [allComputedStats]);

  const handleOpenAdd = () => {
    setHabitToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsAddModalOpen(true);
  };

  const handleSaveHabit = (data: Omit<Habit, 'id' | 'createdAt'>) => {
    if (habitToEdit) {
      updateHabit(habitToEdit.id, data);
    } else {
      addHabit(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading HabitPulse...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Sticky Header with Desktop Navigation, Tokens & Login Streak */}
      <Header
        activeTab={activeTab}
        computedStats={computedStats}
        profile={profile}
        tokenBalance={tokenBalance}
        loginStreak={loginStreak}
        onOpenAddModal={handleOpenAdd}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenWallet={() => setIsWalletModalOpen(true)}
        onTabChange={setActiveTab}
        pendingTodayCount={pendingTodayCount}
      />

      {/* Main Content Area - Responsive Container for Mobile, Tablet & Desktop */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-3 sm:px-6 py-4 md:py-6 pb-24 md:pb-12 transition-all">
        {activeTab === 'today' && (
          <TodayScreen
            habits={habits}
            categories={categories}
            logs={logs}
            computedStats={computedStats}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            todayProgress={todayProgress}
            tokenBalance={tokenBalance}
            totalTokensEarned={totalTokensEarned}
            loginStreak={loginStreak}
            transactions={transactions}
            milestones={milestones}
            onToggleHabit={toggleHabit}
            onOpenAddModal={handleOpenAdd}
            onEditHabit={handleEditHabit}
            onRequestDelete={(h) => setHabitToDelete(h)}
            onCompleteGoal={completeGoal}
            onOpenWallet={() => setIsWalletModalOpen(true)}
          />
        )}

        {activeTab === 'habits' && (
          <HabitListScreen
            habits={habits}
            categories={categories}
            computedStats={allComputedStats}
            onOpenAddModal={handleOpenAdd}
            onEditHabit={handleEditHabit}
            onToggleArchiveHabit={toggleArchiveHabit}
            onRequestDelete={(h) => setHabitToDelete(h)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        )}

        {activeTab === 'stats' && (
          <StatsScreen
            habits={habits}
            categories={categories}
            logs={logs}
            computedStats={allComputedStats}
            profile={profile}
            loginStreak={loginStreak}
            tokenBalance={tokenBalance}
            totalTokensEarned={totalTokensEarned}
            transactions={transactions}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            habits={habits}
            categories={categories}
            profile={profile}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            onUpdateSettings={updateSettings}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'admin' && (
          <AuthGuard user={user} isAdmin={isAdmin}>
            <AdminDashboard onBackToApp={() => setActiveTab('today')} />
          </AuthGuard>
        )}
      </main>

      {/* Mobile Bottom Tab Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingTodayCount={pendingTodayCount}
      />

      {/* Add / Edit Habit Modal */}
      <HabitFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setHabitToEdit(null);
        }}
        onSave={handleSaveHabit}
        habitToEdit={habitToEdit}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      {/* Custom Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        habits={habits}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
      />

      {/* Token Wallet & Milestones Manager Modal */}
      <TokenWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        tokenBalance={tokenBalance}
        totalTokensEarned={totalTokensEarned}
        transactions={transactions}
        milestones={milestones}
        habits={habits}
        computedStats={allComputedStats}
        loginStreak={loginStreak}
        onAddMilestone={addMilestone}
        onUpdateMilestone={updateMilestone}
        onDeleteMilestone={deleteMilestone}
        onToggleMilestone={toggleMilestone}
      />

      {/* Milestone Completion Celebration Modal */}
      <MilestoneCelebrationModal
        award={newlyAwardedMilestone}
        onClose={() => setNewlyAwardedMilestone(null)}
        onOpenWallet={() => {
          setNewlyAwardedMilestone(null);
          setIsWalletModalOpen(true);
        }}
      />

      {/* Profile Maker & Customization Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={updateProfile}
        totalCompletions={totalCompletions}
        maxStreak={bestOverallStreak}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Data Migration Prompt Modal */}
      <DataMigrationModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
        habit={habitToDelete}
      />

      {/* 100% Daily Goal Celebration Popup */}
      <CelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        completedCount={todayProgress.completed}
      />
    </div>
  );
}
