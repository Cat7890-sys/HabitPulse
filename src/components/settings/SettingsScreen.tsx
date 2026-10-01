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
} from 'lucide-react';
import { AppSettings, HabitColor, Category } from '../../types';
import { storage } from '../../storage/storage';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  requestNotificationPermission,
  sendHabitNotification,
  getNotificationStatus,
} from '../../utils/notifications';
import { sound, triggerHaptic } from '../../utils/sound';

interface Props {
  settings: AppSettings;
  categories?: Category[];
  onOpenCategoryManager?: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onRefreshData: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  settings,
  categories = [],
  onOpenCategoryManager,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [notificationState, setNotificationState] = useState(getNotificationStatus());
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      setNotificationState(getNotificationStatus());
      if (perm === 'granted') {
        onUpdateSettings({ notificationsEnabled: true });
        sendHabitNotification(
          'HabitPulse Notifications Active! ✨',
          'You will receive reminders when it’s time to check off your scheduled habits.'
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
      'Test notification working! Stay consistent with your daily goals.'
    );
    showFeedback('success', 'Test notification sent!');
  };

  // Export Data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const jsonString = await storage.exportAllData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('success', 'Data exported successfully as JSON!');
    } catch (e) {
      showFeedback('error', 'Failed to export backup data.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import Data
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await storage.importData(text);
      if (res.success) {
        showFeedback('success', res.message);
        onRefreshData();
      } else {
        showFeedback('error', res.message);
      }
    } catch (err) {
      showFeedback('error', 'Failed to read file.');
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
  };

  // Reset all
  const handleResetAll = async () => {
    await storage.clearAllData();
    onRefreshData();
    setShowResetConfirm(false);
    showFeedback('success', 'All data has been cleared.');
  };

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

        {/* Accent Color Palette */}
        <div className="pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-indigo-500" />
            <span>Accent Highlight</span>
          </label>
          <div className="grid grid-cols-8 gap-2">
            {COLOR_OPTIONS.map((c) => {
              const scheme = COLOR_SCHEMES[c];
              const isSelected = settings.accentColor === c;
              return (
                <button
                  key={c}
                  onClick={() => handleAccentChange(c)}
                  className={`h-8 rounded-xl ${scheme.bg} flex items-center justify-center transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications & Reminders */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Browser Reminders
              </h3>
              <p className="text-[11px] text-slate-400">
                Receive scheduled habit alerts
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleNotifications}
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

        {settings.notificationsEnabled && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Notification API: <strong className="text-emerald-600">Active</strong>
            </span>
            <button
              onClick={handleTestNotification}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
            >
              Test Notification 🔔
            </button>
          </div>
        )}
      </div>

      {/* Sound & Haptics */}
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
          {/* Sound Effects Toggle */}
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

          {/* Haptics Toggle */}
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

      {/* Data Management: Export / Import / Seed / Reset */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Data & Backup
          </h3>
          <p className="text-[11px] text-slate-400">
            Stored locally in your browser (no account needed)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Export JSON */}
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-500" />
            <span>Export JSON</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            <span>Import JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* Load Starter Habits */}
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

        {/* Reset All Data */}
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

      {/* App Info Footer */}
      <div className="text-center pt-2 pb-6 text-xs text-slate-400 space-y-1">
        <p className="font-bold text-slate-600 dark:text-slate-400">
          HabitPulse PWA v1.0.0
        </p>
        <p className="text-[11px]">
          100% Client-side • Works Offline • Privacy-First
        </p>
      </div>

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
