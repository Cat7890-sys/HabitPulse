import React, { useState, useEffect } from 'react';
import { X, Sparkles, Bell, Calendar, Palette, Tag, Clock, Plus, Settings2 } from 'lucide-react';
import { Habit, HabitColor, FrequencyType, Category } from '../../types';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';
import { DAYS_SHORT } from '../../utils/date';
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
  '🎨', '🧠', '🚴‍♂️', '🏊‍♂️', '⚡', '💊', '🍎', '🔥'
];

const PRESET_IDEAS = [
  { name: 'Drink 2L Water', emoji: '💧', color: 'cyan' as HabitColor, cat: 'Health' },
  { name: 'Daily Workout', emoji: '💪', color: 'emerald' as HabitColor, cat: 'Fitness' },
  { name: 'Read 20 Pages', emoji: '📚', color: 'indigo' as HabitColor, cat: 'Learning' },
  { name: 'Deep Meditation', emoji: '🧘‍♀️', color: 'violet' as HabitColor, cat: 'Mind' },
  { name: 'Evening Journal', emoji: '✍️', color: 'amber' as HabitColor, cat: 'Personal' },
  { name: 'Focus Work Block', emoji: '🎯', color: 'blue' as HabitColor, cat: 'Work' },
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
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState<HabitColor>('indigo');
  const [freqType, setFreqType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Reset or populate state when modal opens
  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setEmoji(habitToEdit.emoji);
      setColor(habitToEdit.color);
      setFreqType(habitToEdit.frequency.type);
      setSelectedDays(habitToEdit.frequency.days || [1, 2, 3, 4, 5]);
      setTimesPerWeek(habitToEdit.frequency.timesPerWeek || 3);
      setReminderEnabled(!!habitToEdit.reminderEnabled);
      setReminderTime(habitToEdit.reminderTime || '08:00');
      
      // Match category by id or name
      const matchedCat = categories.find(
        (c) => c.id === habitToEdit.categoryId || c.name === habitToEdit.category
      );
      setSelectedCategoryId(matchedCat ? matchedCat.id : (categories[0]?.id || ''));
    } else {
      setName('');
      setEmoji('⚡');
      setColor('indigo');
      setFreqType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setTimesPerWeek(3);
      setReminderEnabled(false);
      setReminderTime('08:00');
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
      emoji,
      color,
      frequency: {
        type: freqType,
        days: freqType === 'weekdays' ? selectedDays : undefined,
        timesPerWeek: freqType === 'times_per_week' ? timesPerWeek : undefined,
      },
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      category: categoryName,
      categoryId: selectedCategoryId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Build a consistent daily routine
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Quick Idea Templates (only in Create mode) */}
          {!habitToEdit && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 block">
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
              Habit Name & Icon
            </label>
            <div className="flex gap-2.5 items-center">
              {/* Emoji selector preview */}
              <div className="relative">
                <input
                  type="text"
                  value={emoji}
                  maxLength={4}
                  onChange={(e) => setEmoji(e.target.value || '✨')}
                  className="h-12 w-12 text-center text-2xl rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Name input */}
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Read 15 mins, Drink water..."
                className="flex-1 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick emoji presets */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {EMOJI_PRESETS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm transition cursor-pointer ${
                    emoji === e
                      ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color-Coded Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-500" />
                <span>Category (Color-Coded)</span>
              </label>

              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="h-3 w-3" />
                  <span>Manage Categories</span>
                </button>
              )}
            </div>

            {/* Selectable Color-Coded Category Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const scheme = COLOR_SCHEMES[cat.color] || COLOR_SCHEMES.indigo;

                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      // Sync habit color with category color if default
                      setColor(cat.color);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? `${scheme.bg} text-white ${scheme.border} shadow-sm scale-105 ring-2 ring-offset-1 ring-indigo-500`
                        : `${scheme.bgSubtle} hover:opacity-100 opacity-90`
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}

              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>New Category</span>
                </button>
              )}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-indigo-500" />
              <span>Habit Accent Color</span>
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((c) => {
                const scheme = COLOR_SCHEMES[c];
                const isSelected = color === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 rounded-xl ${scheme.bg} flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105 shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>Frequency Schedule</span>
            </label>

            {/* Type selector tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-1">
              <button
                type="button"
                onClick={() => setFreqType('daily')}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  freqType === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Everyday
              </button>
              <button
                type="button"
                onClick={() => setFreqType('weekdays')}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  freqType === 'weekdays'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Specific Days
              </button>
              <button
                type="button"
                onClick={() => setFreqType('times_per_week')}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  freqType === 'times_per_week'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                X / Week
              </button>
            </div>

            {/* Specific Days Chips */}
            {freqType === 'weekdays' && (
              <div className="mt-3 grid grid-cols-7 gap-1">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const isSelected = selectedDays.includes(dayIdx);
                  return (
                    <button
                      type="button"
                      key={dayIdx}
                      onClick={() => handleToggleDay(dayIdx)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {DAYS_SHORT[dayIdx]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Times Per Week Stepper */}
            {freqType === 'times_per_week' && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Target days per week:
                </span>
                <div className="flex items-center gap-2">
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

          {/* Reminder Section */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Daily Reminder
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Get polite browser notifications
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
