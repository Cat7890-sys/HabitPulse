import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Habit } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habit: Habit | null;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  habit,
}) => {
  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 p-5 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
          <Trash2 className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Delete Habit?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{habit.emoji} {habit.name}</strong>? All historical logs and streaks for this habit will be removed.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
