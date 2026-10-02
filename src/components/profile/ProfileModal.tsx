import React, { useState } from 'react';
import { User, X, Sparkles, Check, Heart, Trophy, Target, Palette } from 'lucide-react';
import { UserProfile, HabitColor } from '../../types';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';
import { sound, triggerHaptic } from '../../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  totalCompletions?: number;
  maxStreak?: number;
}

const AVATAR_PRESETS = [
  '🦁', '🚀', '⚡', '🧘‍♀️', '🦊', '🦉', '🎯', '🐉', '💎', '🌊', '🌿', '🏆',
  '🔥', '🥑', '📚', '🌟', '🦄', '🥋', '🎨', '💻', '🏋️‍♂️', '🧗‍♂️', '🚴‍♀️', '🏄‍♂️',
];

const TITLE_PRESETS = [
  'Consistent Striver',
  'Habit Artisan',
  'Disciplined Seeker',
  'Atomic Builder',
  'Master of Routines',
  'Early Bird Legend',
  'Mindful Achiever',
  'Streak Champion',
];

export const ProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  totalCompletions = 0,
  maxStreak = 0,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [bio, setBio] = useState(profile.bio);
  const [title, setTitle] = useState(profile.title);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyHabitGoal || 4);
  const [themeColor, setThemeColor] = useState<HabitColor>(profile.themeColor || 'indigo');

  if (!isOpen) return null;

  // Level & XP Calculation
  const xp = totalCompletions * 25 + maxStreak * 50;
  const level = Math.floor(xp / 250) + 1;
  const currentLevelXp = xp % 250;

  const handleSave = () => {
    onSaveProfile({
      ...profile,
      name: name.trim() || 'Habit Champion',
      avatar: avatar || '🦁',
      bio: bio.trim(),
      title: title.trim() || 'Consistent Striver',
      dailyHabitGoal: dailyGoal,
      themeColor,
    });
    triggerHaptic('complete', true);
    sound.playCheck(true);
    onClose();
  };

  const scheme = COLOR_SCHEMES[themeColor] || COLOR_SCHEMES.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Customize Profile
              </h3>
              <p className="text-[11px] text-slate-400">
                Personalize your habit persona & daily goals
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

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1">
          {/* Live Profile Card Preview */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 border border-indigo-200/80 dark:border-indigo-800/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-md border ${scheme.bgSubtle} shrink-0`}
              >
                <span>{avatar}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {name || 'Habit Champion'}
                  </h4>
                  <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                    Lvl {level}
                  </span>
                </div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {title || 'Consistent Striver'}
                </p>
                {bio && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                    "{bio}"
                  </p>
                )}
              </div>
            </div>

            {/* Level XP Bar */}
            <div className="space-y-1 pt-1 border-t border-indigo-100 dark:border-indigo-900/60">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>Experience (XP)</span>
                <span>{currentLevelXp} / 250 XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${(currentLevelXp / 250) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Name & Title Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex Johnson"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Title / Honorific Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Habit Title / Rank
              </label>
              <input
                type="text"
                value={title}
                maxLength={30}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Master of Routines"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {TITLE_PRESETS.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      title === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Emoji Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Choose Avatar
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`h-10 rounded-xl text-lg flex items-center justify-center transition cursor-pointer ${
                    avatar === emoji
                      ? 'bg-indigo-600 text-white shadow-md scale-110 ring-2 ring-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Bio / Daily Motto */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Personal Motto / Daily Motivation
            </label>
            <textarea
              rows={2}
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Win the morning, win the day."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Daily Habit Target Goal */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>Daily Target Habit Goal</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                {dailyGoal} habits / day
              </strong>
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDailyGoal(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    dailyGoal === num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
