import React from 'react';
import { Trophy, Sparkles, CheckCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
}

export const CelebrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  completedCount,
}) => {
  if (!isOpen) return null;

  const handleConfettiAgain = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl border border-slate-200/80 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Celebration Trophy Icon with Glow */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 p-4 shadow-xl shadow-amber-500/25">
          <Trophy className="h-10 w-10 text-white animate-bounce" />
        </div>

        <h3 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">
          Daily Goal Crushed! 🎉
        </h3>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
          You have checked off all <strong className="text-slate-900 dark:text-white">{completedCount} habits</strong> scheduled for today. Consistency is your superpower!
        </p>

        <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <span>Your streak continues to grow!</span>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleConfettiAgain}
            className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            More Confetti 🎊
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
          >
            Keep Going 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
