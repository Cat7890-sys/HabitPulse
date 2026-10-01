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
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const {
    habits,
    categories,
    logs,
    settings,
    isLoading,
    selectedDateKey,
    setSelectedDateKey,
    computedStats,
    todayProgress,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    refreshData,
    showCelebrationModal,
    setShowCelebrationModal,
  } = useHabits();

  // Pending habits for badge counter
  const pendingTodayCount = Math.max(0, todayProgress.total - todayProgress.completed);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 animate-pulse">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Loading Habits...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        computedStats={computedStats}
        onOpenAddModal={handleOpenAdd}
      />

      {/* Main Content Area - Mobile constrained container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24">
        {activeTab === 'today' && (
          <TodayScreen
            habits={habits}
            categories={categories}
            logs={logs}
            computedStats={computedStats}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            todayProgress={todayProgress}
            onToggleHabit={toggleHabit}
            onOpenAddModal={handleOpenAdd}
            onEditHabit={handleEditHabit}
            onRequestDelete={(h) => setHabitToDelete(h)}
          />
        )}

        {activeTab === 'habits' && (
          <HabitListScreen
            habits={habits}
            categories={categories}
            computedStats={computedStats}
            onOpenAddModal={handleOpenAdd}
            onEditHabit={handleEditHabit}
            onRequestDelete={(h) => setHabitToDelete(h)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        )}

        {activeTab === 'stats' && (
          <StatsScreen
            habits={habits}
            categories={categories}
            logs={logs}
            computedStats={computedStats}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            categories={categories}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onUpdateSettings={updateSettings}
            onRefreshData={refreshData}
          />
        )}
      </main>

      {/* Bottom Tab Navigation Bar */}
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
