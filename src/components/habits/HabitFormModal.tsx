import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bell,
  Calendar,
  Palette,
  Tag,
  Clock,
  Plus,
  Settings2,
  Archive,
  Target,
  FileText,
  Hourglass,
  CheckCircle2,
} from 'lucide-react';
import { Habit, HabitColor, FrequencyType, Category, GoalType } from '../../types';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';
import { DAYS_SHORT, getTodayKey } from '../../utils/date';
import { requestNotificationPermission, getNotificationStatus } from '../../utils/notifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt'>) => void;
  habitToEdit?: Habit | null;
  categories: Category[];
  onOpenCategoryManager?: () => void;
}

const EMOJI_PRESETS = [
  '💧', '🏃‍♂️', '📚', '🧘‍♀️', '✍️', '🥦', '🛌', '🚶‍♂️',
  '☕', '💪', '🎯', '🥑', '🎧', '🎸', '🌱', '☀️',
  '🎨', '🧠', '🚴‍♂️', '🏊‍♂️', '⚡', '💊', '🍎', '🔥',
];

const PRESET_IDEAS = [
  { name: 'Drink 2L Water', emoji: '💧', color: 'cyan' as HabitColor, cat: 'Health', goalType: 'recurring' as GoalType },
  { name: 'Daily Workout', emoji: '💪', color: 'emerald' as HabitColor, cat: 'Fitness', goalType: 'recurring' as GoalType },
  { name: 'Read 20 Pages', emoji: '📚', color: 'indigo' as HabitColor, cat: 'Learning', goalType: 'recurring' as GoalType },
  { name: 'Deep Meditation', emoji: '🧘‍♀️', color: 'violet' as HabitColor, cat: 'Mind', goalType: 'recurring' as GoalType },
  { name: 'Finish Java Assignment', emoji: '💻', color: 'blue' as HabitColor, cat: 'Work', goalType: 'one_time' as GoalType, targetTime: '18:00' },
  { name: 'Evening Journal', emoji: '✍️', color: 'amber' as HabitColor, cat: 'Personal', goalType: 'recurring' as GoalType },
];

export const HabitFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  habitToEdit,
  categories,
  onOpenCategoryManager,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState<HabitColor>('indigo');
  const [goalType, setGoalType] = useState<GoalType>('recurring');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [targetCompletions, setTargetCompletions] = useState<number | ''>('');
  const [freqType, setFreqType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [archived, setArchived] = useState(false);

  // Reset or populate state when modal opens
  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setEmoji(habitToEdit.emoji);
      setColor(habitToEdit.color);
      setGoalType(habitToEdit.goalType || 'recurring');
      setTargetDate(habitToEdit.targetDate || '');
      setTargetTime(habitToEdit.targetTime || '');
      setTargetCompletions(habitToEdit.targetCompletions || '');
      setFreqType(habitToEdit.frequency.type);
      setSelectedDays(habitToEdit.frequency.days || [1, 2, 3, 4, 5]);
      setTimesPerWeek(habitToEdit.frequency.timesPerWeek || 3);
      setReminderEnabled(!!habitToEdit.reminderEnabled);
      setReminderTime(habitToEdit.reminderTime || '08:00');
      setArchived(!!habitToEdit.archived);

      // Match category by id or name
      const matchedCat = categories.find(
        (c) => c.id === habitToEdit.categoryId || c.name === habitToEdit.category
      );
      setSelectedCategoryId(matchedCat ? matchedCat.id : (categories[0]?.id || ''));
    } else {
      setName('');
      setDescription('');
      setEmoji('⚡');
      setColor('indigo');
      setGoalType('recurring');
      setTargetDate('');
      setTargetTime('');
      setTargetCompletions('');
      setFreqType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setTimesPerWeek(3);
      setReminderEnabled(false);
      setReminderTime('08:00');
      setArchived(false);
      setSelectedCategoryId(categories[0]?.id || '');
    }
  }, [habitToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) return; // Keep at least one day
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleToggleReminder = async () => {
    if (!reminderEnabled) {
      const status = getNotificationStatus();
      if (status.permission !== 'granted') {
        const perm = await requestNotificationPermission();
        if (perm === 'granted') {
          setReminderEnabled(true);
        } else {
          setReminderEnabled(false);
        }
        return;
      }
      setReminderEnabled(true);
    } else {
      setReminderEnabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedCat = categories.find((c) => c.id === selectedCategoryId);
    const categoryName = matchedCat ? matchedCat.name : 'General';

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      emoji,
      color,
      goalType,
      targetDate: targetDate ? targetDate : undefined,
      targetTime: targetTime ? targetTime : undefined,
      targetCompletions: typeof targetCompletions === 'number' && targetCompletions > 0 ? targetCompletions : undefined,
      frequency: {
        type: freqType,
        days: freqType === 'weekdays' ? selectedDays : undefined,
        timesPerWeek: freqType === 'times_per_week' ? timesPerWeek : undefined,
      },
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      category: categoryName,
      categoryId: selectedCategoryId || undefined,
      archived,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {habitToEdit ? 'Edit Habit / Goal' : 'Create Habit or Task'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure habit routine, target deadlines, and milestone rewards
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Idea Templates (only in Create mode) */}
          {!habitToEdit && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                Quick Inspiration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IDEAS.map((idea) => {
                  const targetCat = categories.find((c) => c.name.toLowerCase() === idea.cat.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={idea.name}
                      onClick={() => {
                        setName(idea.name);
                        setEmoji(idea.emoji);
                        setColor(idea.color);
                        setGoalType(idea.goalType);
                        if (idea.targetTime) setTargetTime(idea.targetTime);
                        if (targetCat) setSelectedCategoryId(targetCat.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition cursor-pointer"
                    >
                      <span>{idea.emoji}</span>
                      <span>{idea.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name & Emoji row */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Habit / Task Name & Icon
            </label>
            <div className="flex gap-2.5 items-center">
              <div className="relative">
                <input
                  type="text"
                  value={emoji}
                  maxLength={4}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="h-10 w-12 text-center text-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <input
                type="text"
                required
                placeholder="e.g., Morning Run, Finish Java Assignment..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Study chapter 4 & 5 or practice 30 minutes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Emoji Picker Presets */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Select Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setEmoji(icon)}
                  className={`h-8 w-8 rounded-xl text-base flex items-center justify-center transition cursor-pointer ${
                    emoji === icon
                      ? 'bg-indigo-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Type: Recurring Habit vs One-Time Task */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-indigo-500" />
                <span>Goal & Deadline Configuration</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Optional Deadlines
              </span>
            </div>

            {/* Goal Type Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGoalType('recurring')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  goalType === 'recurring'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Recurring Habit
              </button>
              <button
                type="button"
                onClick={() => setGoalType('one_time')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  goalType === 'one_time'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                One-Time Task
              </button>
            </div>

            {/* Deadline inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Deadline Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Time (Optional)
                </label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Target completions (e.g. Complete 10 times by deadline) */}
            {goalType === 'recurring' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Total Completions (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="e.g. 14 sessions or 30 days"
                  value={targetCompletions}
                  onChange={(e) => setTargetCompletions(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Color & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Color Accent */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Color Accent
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => {
                  const scheme = COLOR_SCHEMES[c];
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-xl transition cursor-pointer flex items-center justify-center ${scheme.bg} ${
                        color === c ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : ''
                      }`}
                      title={scheme.label}
                    >
                      {color === c && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Manage
                  </button>
                )}
              </div>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency Section (for recurring habits) */}
          {goalType === 'recurring' && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Repeat Schedule
              </label>

              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFreqType('daily')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    freqType === 'daily'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Everyday
                </button>
                <button
                  type="button"
                  onClick={() => setFreqType('weekdays')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    freqType === 'weekdays'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Specific Days
                </button>
                <button
                  type="button"
                  onClick={() => setFreqType('times_per_week')}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    freqType === 'times_per_week'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Times / Week
                </button>
              </div>

              {/* Specific days */}
              {freqType === 'weekdays' && (
                <div className="pt-2">
                  <div className="flex justify-between gap-1">
                    {DAYS_SHORT.map((dayName, idx) => {
                      const isSelected = selectedDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={dayName}
                          onClick={() => handleToggleDay(idx)}
                          className={`h-9 flex-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {dayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Times per week */}
              {freqType === 'times_per_week' && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Target frequency:
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setTimesPerWeek(num)}
                        className={`h-8 w-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                          timesPerWeek === num
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reminder Section */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Reminder Notification
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Get gentle reminder notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Notify me at:
                </span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="ml-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Archive Status Toggle (when editing an existing habit) */}
          {habitToEdit && (
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Archive Habit
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Hide from active daily checklist without losing historical streak logs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchived(!archived)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  archived ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    archived ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
            >
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
