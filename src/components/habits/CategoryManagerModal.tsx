import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Palette, Check, Sparkles } from 'lucide-react';
import { Category, HabitColor, Habit } from '../../types';
import { COLOR_OPTIONS, COLOR_SCHEMES } from '../common/ColorMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  habits: Habit[];
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const CATEGORY_EMOJI_PRESETS = [
  '🌿', '⚡', '🧘‍♀️', '💼', '👤', '📚', '⏰', '🍎',
  '💰', '🎨', '🎯', '❤️', '💡', '🏆', '🚀', '🌟'
];

export const CategoryManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  habits,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [color, setColor] = useState<HabitColor>('indigo');

  if (!isOpen) return null;

  const startCreate = () => {
    setName('');
    setEmoji('🎯');
    setColor('indigo');
    setEditingId(null);
    setIsCreating(true);
  };

  const startEdit = (cat: Category) => {
    setName(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color);
    setEditingId(cat.id);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await onUpdateCategory(editingId, {
        name: name.trim(),
        emoji,
        color,
      });
    } else {
      await onAddCategory({
        name: name.trim(),
        emoji,
        color,
      });
    }

    setIsCreating(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Manage Categories
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Create and customize color-coded groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add/Edit Category Inline Form */}
        {isCreating ? (
          <form onSubmit={handleSave} className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Category' : 'New Custom Category'}
              </span>
              <button
                type="button"
                onClick={cancelForm}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {/* Name and Icon Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                maxLength={4}
                onChange={(e) => setEmoji(e.target.value || '🏷️')}
                className="h-10 w-10 text-center text-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                required
                placeholder="Category name (e.g. Health, Work)..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Emoji Quick Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {CATEGORY_EMOJI_PRESETS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`h-7 w-7 shrink-0 rounded-lg text-xs flex items-center justify-center transition cursor-pointer ${
                    emoji === e ? 'bg-indigo-600 text-white scale-110' : 'bg-white dark:bg-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Category Color
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {COLOR_OPTIONS.map((c) => {
                  const scheme = COLOR_SCHEMES[c];
                  const isSelected = color === c;
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-7 rounded-lg ${scheme.bg} flex items-center justify-center transition cursor-pointer ${
                        isSelected ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 rounded-xl bg-slate-200/80 dark:bg-slate-700 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {categories.length} Categories
            </span>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Category</span>
            </button>
          </div>
        )}

        {/* Existing Categories List */}
        <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const scheme = COLOR_SCHEMES[cat.color] || COLOR_SCHEMES.indigo;
            const habitCount = habits.filter(
              (h) => h.categoryId === cat.id || h.category === cat.name
            ).length;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${scheme.bgSubtle}`}
                  >
                    <span>{cat.emoji}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <span className={`h-2 w-2 rounded-full ${scheme.bg}`} />
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {habitCount} {habitCount === 1 ? 'habit' : 'habits'} assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 dark:bg-slate-100 py-2.5 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
