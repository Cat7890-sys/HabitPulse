import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  FileJson,
  AlertTriangle,
  X,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { storage, BackupData } from '../../storage/storage';
import { sound, triggerHaptic } from '../../utils/sound';
import { Habit, Category } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  categories: Category[];
  onDataRestored: () => void;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
}

export const DataTransferModal: React.FC<Props> = ({
  isOpen,
  onClose,
  habits,
  categories,
  onDataRestored,
  hapticsEnabled = true,
  soundEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [previewBackup, setPreviewBackup] = useState<BackupData | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export Handlers
  const handleDownloadFile = async () => {
    try {
      setIsProcessing(true);
      const jsonString = await storage.exportAllData();
      const filename = `habitpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Check if Web Share API with Files is supported (iOS Safari / Android)
      if (
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], filename, { type: 'application/json' })],
        })
      ) {
        const file = new File([blob], filename, { type: 'application/json' });
        await navigator.share({
          title: 'HabitPulse Backup',
          text: 'Here is my HabitPulse backup file.',
          files: [file],
        });
        setFeedback({ type: 'success', message: 'Backup file shared successfully!' });
        triggerHaptic('complete', hapticsEnabled);
        return;
      }

      // Traditional browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: 'Backup file downloaded to your device!' });
      triggerHaptic('complete', hapticsEnabled);
      sound.playCheck(soundEnabled);
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'AbortError') {
        setFeedback({ type: 'error', message: 'Failed to export backup file.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyJson = async () => {
    try {
      const jsonString = await storage.exportAllData();
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      triggerHaptic('light', hapticsEnabled);
      sound.playCheck(soundEnabled);
      setFeedback({ type: 'success', message: 'Backup JSON copied to clipboard!' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback({ type: 'error', message: 'Clipboard access denied.' });
    }
  };

  // 2. Import Handlers
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      parseAndPreview(text);
    } catch {
      setFeedback({ type: 'error', message: 'Could not read the selected file.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseAndPreview = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || !Array.isArray(parsed.habits)) {
        setFeedback({
          type: 'error',
          message: 'Invalid backup file: Could not find habits list.',
        });
        return;
      }
      setPreviewBackup(parsed);
      setFeedback(null);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Invalid JSON syntax. Please check your backup data.',
      });
    }
  };

  const handleExecuteImport = async () => {
    if (!previewBackup) return;

    try {
      setIsProcessing(true);
      if (importMode === 'replace') {
        // Complete replacement
        await storage.saveHabits(previewBackup.habits);
        if (previewBackup.logs) await storage.saveLogs(previewBackup.logs);
        if (previewBackup.categories) await storage.saveCategories(previewBackup.categories);
        if (previewBackup.settings) await storage.saveSettings(previewBackup.settings);
      } else {
        // Merge mode: combine unique habits and merge logs
        const currentHabits = await storage.getHabits();
        const currentLogs = await storage.getLogs();
        const currentCategories = await storage.getCategories();

        // Merge habits by ID (or add new)
        const habitMap = new Map<string, Habit>();
        currentHabits.forEach((h) => habitMap.set(h.id, h));
        previewBackup.habits.forEach((h) => habitMap.set(h.id, h));
        const mergedHabits = Array.from(habitMap.values());

        // Merge categories
        const catMap = new Map<string, Category>();
        currentCategories.forEach((c) => catMap.set(c.id, c));
        if (previewBackup.categories) {
          previewBackup.categories.forEach((c) => catMap.set(c.id, c));
        }

        // Merge logs
        const mergedLogs = { ...currentLogs };
        if (previewBackup.logs) {
          Object.entries(previewBackup.logs).forEach(([habitId, dateMap]) => {
            mergedLogs[habitId] = {
              ...(mergedLogs[habitId] || {}),
              ...dateMap,
            };
          });
        }

        await storage.saveHabits(mergedHabits);
        await storage.saveLogs(mergedLogs);
        await storage.saveCategories(Array.from(catMap.values()));
      }

      triggerHaptic('celebration', hapticsEnabled);
      sound.playCelebration(soundEnabled);
      onDataRestored();
      setFeedback({
        type: 'success',
        message: `Successfully imported ${previewBackup.habits.length} habits & logs!`,
      });
      setPreviewBackup(null);
      setPasteText('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to restore backup data.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Data Backup & Restore
              </h3>
              <p className="text-[11px] text-slate-400">
                Transfer your habits between devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback notification toast */}
        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-2xl p-3 text-xs font-bold shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-1 mt-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('export');
              setPreviewBackup(null);
              setFeedback(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export Backup</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setFeedback(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Import / Restore</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1">
          {activeTab === 'export' ? (
            /* EXPORT SECTION */
            <div className="space-y-3.5">
              {/* Summary of current state */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Backup Overview
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base block">
                      {habits.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Habits</span>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 text-base block">
                      {categories.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Categories</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleDownloadFile}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .JSON File</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 px-4 text-xs font-bold transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" />
                      <span>Copy Raw JSON to Clipboard</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Tip: You can send this file to your new phone or computer to seamlessly restore your streaks.
              </p>
            </div>
          ) : (
            /* IMPORT SECTION */
            <div className="space-y-3.5">
              {!previewBackup ? (
                <>
                  {/* File Upload Trigger */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30 p-5 text-center cursor-pointer transition group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tap to select .json backup file
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Accepts standard HabitPulse JSON exports
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleSelectFile}
                    className="hidden"
                  />

                  {/* Or Paste Raw JSON */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>Or paste JSON backup text:</span>
                    </label>
                    <textarea
                      rows={3}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder='{"version": 2, "habits": [...]}'
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {pasteText.trim() && (
                      <button
                        onClick={() => parseAndPreview(pasteText)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-2 text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Verify & Preview Backup</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* BACKUP PREVIEW CONFIRMATION */
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Valid Backup Found
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-2">
                        <span className="text-[10px] text-slate-400 block">Habits in File</span>
                        <strong className="text-slate-900 dark:text-white font-black text-sm">
                          {previewBackup.habits.length}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-2">
                        <span className="text-[10px] text-slate-400 block">Categories</span>
                        <strong className="text-slate-900 dark:text-white font-black text-sm">
                          {previewBackup.categories?.length || 0}
                        </strong>
                      </div>
                    </div>

                    {previewBackup.exportedAt && (
                      <span className="text-[10px] text-slate-400 block">
                        Exported: {new Date(previewBackup.exportedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Restore Mode Options */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Import Mode:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setImportMode('replace')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                          importMode === 'replace'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold block">Replace All</span>
                        <span className="text-[10px] opacity-75">Overwrite current habits</span>
                      </button>

                      <button
                        onClick={() => setImportMode('merge')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                          importMode === 'merge'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold block">Merge</span>
                        <span className="text-[10px] opacity-75">Combine with existing</span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Restore Button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setPreviewBackup(null)}
                      className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      disabled={isProcessing}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition cursor-pointer"
                    >
                      {isProcessing ? 'Restoring...' : 'Restore Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
