import React from 'react';
import { Sparkles, Edit3, Trophy, Flame, Target } from 'lucide-react';
import { UserProfile, HabitComputedStats } from '../../types';
import { COLOR_SCHEMES } from '../common/ColorMap';

interface Props {
  profile: UserProfile;
  totalCompletions: number;
  bestStreak: number;
  onEditProfile: () => void;
}

export const ProfileCard: React.FC<Props> = ({
  profile,
  totalCompletions,
  bestStreak,
  onEditProfile,
}) => {
  const scheme = COLOR_SCHEMES[profile.themeColor || 'indigo'] || COLOR_SCHEMES.indigo;

  // Level & XP Calculation
  const xp = totalCompletions * 25 + bestStreak * 50;
  const level = Math.floor(xp / 250) + 1;
  const currentLevelXp = xp % 250;
  const xpPercentage = Math.min(100, Math.round((currentLevelXp / 250) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3.5">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar with level badge */}
          <div className="relative">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-md border ${scheme.bgSubtle}`}
            >
              <span>{profile.avatar || '🦁'}</span>
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.2 text-[9px] font-black shadow-xs">
              Lvl {level}
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{profile.name || 'Habit Champion'}</span>
            </h3>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>{profile.title || 'Consistent Striver'}</span>
            </p>
            {profile.bio && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                "{profile.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={onEditProfile}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
        >
          <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Level XP Bar & Stats row */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>Level {level} Progress</span>
          <span>
            {currentLevelXp} / 250 XP ({xpPercentage}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${xpPercentage}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
};
