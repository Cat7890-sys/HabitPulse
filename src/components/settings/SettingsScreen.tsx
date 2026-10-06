import React, { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Tag,
  Settings2,
  Info,
  FileJson,
  Share2,
  User,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
} from 'lucide-react';
import { AppSettings, HabitColor, Category, Habit, UserProfile } from '../../types';
import { storage } from '../../storage/storage';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SyncStatusBadge } from '../common/SyncStatusBadge';
import { useAuth } from '../../auth/useAuth';
import {
  requestNotificationPermission,
  sendHabitNotification,
  getNotificationStatus,
  testHabitReminder,
} from '../../utils/notifications';
import { sound, triggerHaptic } from '../../utils/sound';
import { DataTransferModal } from './DataTransferModal';

interface Props {
  settings: AppSettings;
  habits?: Habit[];
  categories?: Category[];
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenCategoryManager?: () => void;
  onOpenAuthModal?: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  settings,
  habits = [],
  categories = [],
  profile,
  onOpenProfile,
  onOpenCategoryManager,
  onOpenAuthModal,
  onUpdateSettings,
  onRefreshData,
}) => {
  const { user, signOut, triggerManualSync } = useAuth();
  const [notificationState, setNotificationState] = useState(getNotificationStatus());
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Theme change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ theme });
    sound.playCheck(settings.soundEnabled);
  };

  // Accent color
  const handleAccentChange = (accentColor: HabitColor) => {
    onUpdateSettings({ accentColor });
    sound.playCheck(settings.soundEnabled);
  };

  // Notifications
  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const perm = await requestNotificationPermission();
      setNotificationState(perm as any);
      if (perm === 'granted') {
        onUpdateSettings({ notificationsEnabled: true });
        sendHabitNotification(
          'HabitPulse Notifications Active! ✨',
          'You will receive push reminders when it’s time to check off your scheduled habits.'
        );
        showFeedback('success', 'Notifications enabled!');
      } else {
        showFeedback('error', 'Notification permission was denied in browser settings.');
      }
    } else {
      onUpdateSettings({ notificationsEnabled: false });
      showFeedback('success', 'Notifications disabled.');
    }
  };

  const handleTestNotification = () => {
    sendHabitNotification(
      '🔥 HabitPulse Reminder Test',
      'Scheduled notification active! Stay consistent with your daily goals.'
    );
    showFeedback('success', 'Test notification sent!');
  };

  // Direct quick Export Data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const jsonString = await storage.exportAllData();
      const filename = `habitpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Mobile share sheet if supported
      if (
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], filename, { type: 'application/json' })],
        })
      ) {
        const file = new File([blob], filename, { type: 'application/json' });
        await navigator.share({
          title: 'HabitPulse Backup',
          text: 'My HabitPulse habits & streaks backup.',
          files: [file],
        });
        showFeedback('success', 'Backup shared successfully!');
        triggerHaptic('complete', settings.hapticsEnabled);
        return;
      }

      // Browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerHaptic('complete', settings.hapticsEnabled);
      showFeedback('success', 'Data exported successfully as JSON!');
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'AbortError') {
        showFeedback('error', 'Failed to export backup data.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Direct quick Import Data
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await storage.importData(text);
      if (res.success) {
        showFeedback('success', res.message);
        triggerHaptic('celebration', settings.hapticsEnabled);
        sound.playCelebration(settings.soundEnabled);
        onRefreshData();
      } else {
        showFeedback('error', res.message);
      }
    } catch {
      showFeedback('error', 'Failed to read backup file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Seed starter data
  const handleSeedData = async () => {
    await storage.seedDemoData();
    onRefreshData();
    showFeedback('success', 'Starter demo habits & past 30-day logs loaded!');
    sound.playCelebration(settings.soundEnabled);
    triggerHaptic('celebration', settings.hapticsEnabled);
  };

  // Reset all
  const handleResetAll = async () => {
    await storage.clearAllData();
    onRefreshData();
    setShowResetConfirm(false);
    showFeedback('success', 'All data has been cleared.');
  };

  const habitsWithReminders = habits.filter((h) => !h.archived && h.reminderEnabled && h.reminderTime);

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Feedback banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-3.5 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallButton variant="settings" />

      {/* Responsive 2-Column Layout on Tablet and Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Cloud Account & Supabase Sync Section */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Supabase Cloud Sync</span>
                    <SyncStatusBadge showText={false} />
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {user ? `Signed in as ${user.email}` : 'Local-First • Sign in to backup data to cloud'}
                  </p>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In / Up</span>
                  </button>
                )
              )}
            </div>

            {user && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <SyncStatusBadge showText={true} />
                <button
                  onClick={triggerManualSync}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Persona Banner */}
          {profile && onOpenProfile && (
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-2xl border border-indigo-100 dark:border-indigo-900">
                    <span>{profile.avatar || '🦁'}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{profile.name}</span>
                    </h3>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {profile.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Categories Section */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Color-Coded Categories
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {categories.length} custom categories configured
                  </p>
                </div>
              </div>

              {onOpenCategoryManager && (
                <button
                  onClick={onOpenCategoryManager}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Manage</span>
                </button>
              )}
            </div>

            {/* Category Preview Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => {
                const scheme = COLOR_SCHEMES[cat.color] || COLOR_SCHEMES.indigo;
                return (
                  <span
                    key={cat.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${scheme.bgSubtle}`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Appearance & Theme */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Appearance & Theme
              </h3>
              <p className="text-[11px] text-slate-400">
                Customize how HabitPulse looks
              </p>
            </div>

            {/* Theme mode buttons */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-1">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  settings.theme === 'system'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </button>
            </div>

            {/* Accent color picker */}
            <div className="pt-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-slate-400" />
                <span>Accent Highlight</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COLOR_OPTIONS.map((colorKey) => {
                  const scheme = COLOR_SCHEMES[colorKey];
                  const isSelected = settings.accentColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      onClick={() => handleAccentChange(colorKey)}
                      aria-label={`Accent color ${colorKey}`}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        scheme.bg
                      } ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-105 shadow-md'
                          : 'opacity-80 hover:opacity-100 hover:scale-102'
                      }`}
                      title={scheme.label}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reminders & Push Notifications */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reminders & Notifications API
              </h3>
              <p className="text-[11px] text-slate-400">
                Scheduled push notifications triggered at your chosen habit times
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Scheduled Habit Notifications
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Receive browser alerts when your habits are due
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleNotifications}
                aria-label="Toggle notifications"
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Scheduled Habits Summary */}
            {settings.notificationsEnabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Active Habits with Reminders: <strong className="text-indigo-600 dark:text-indigo-400">{habitsWithReminders.length}</strong>
                  </span>
                  <button
                    onClick={handleTestNotification}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                  >
                    Test Alert 🔔
                  </button>
                </div>

                {habitsWithReminders.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {habitsWithReminders.map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{habit.emoji}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {habit.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-[10px]">
                            <Clock className="h-3 w-3" />
                            <span>{habit.reminderTime}</span>
                          </span>
                          <button
                            onClick={() => testHabitReminder(habit)}
                            title="Send sample notification for this habit"
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audio & Haptics */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Audio & Haptics
              </h3>
              <p className="text-[11px] text-slate-400">
                Tactile micro-feedback when completing habits
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sound Effects
                  </span>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.soundEnabled;
                    onUpdateSettings({ soundEnabled: next });
                    sound.playCheck(next);
                  }}
                  aria-label="Toggle sound effects"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Haptic Vibration
                  </span>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.hapticsEnabled;
                    onUpdateSettings({ hapticsEnabled: next });
                    if (next) triggerHaptic('complete', true);
                  }}
                  aria-label="Toggle haptic vibration"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.hapticsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* JSON Data Export & Backup */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  JSON Data Export & Backup
                </h3>
                <p className="text-[11px] text-slate-400">
                  Download your complete habit history, streak logs, and settings as JSON
                </p>
              </div>

              <button
                onClick={() => setIsDataModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
              >
                <FileJson className="h-3.5 w-3.5" />
                <span>Advanced</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Backup Contents
                </span>
                <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  .json format
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm block">
                    {habits.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Habits</span>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm block">
                    {categories.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Categories</span>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm block">
                    {profile?.name ? '1' : '0'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">Profile & Logs</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Preparing JSON...' : 'Download JSON Backup File'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Import JSON</span>
                </button>

                <button
                  onClick={() => setIsDataModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <FileJson className="h-3.5 w-3.5 text-purple-500" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Demo Starter Data
                </h4>
                <p className="text-[11px] text-slate-400">
                  Populate with 5 habits & 30-day logs
                </p>
              </div>
              <button
                onClick={handleSeedData}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Load Demo</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Clear All Data
                </h4>
                <p className="text-[11px] text-slate-400">
                  Wipes all habits and streak logs
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-3 py-1.5 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-2 pb-6 text-xs text-slate-400 space-y-1">
        <p className="font-bold text-slate-600 dark:text-slate-400">
          HabitPulse PWA v1.0.0
        </p>
        <p className="text-[11px]">
          100% Client-side • Works Offline • Privacy-First
        </p>
      </div>

      {/* Full-Featured Data Transfer Modal */}
      <DataTransferModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        habits={habits}
        categories={categories}
        onDataRestored={onRefreshData}
        hapticsEnabled={settings.hapticsEnabled}
        soundEnabled={settings.soundEnabled}
      />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 p-5 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Reset Everything?
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will permanently delete all your habits, streaks, and check-in history. This action cannot be undone.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
