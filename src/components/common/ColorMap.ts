import { HabitColor } from '../../types';

export interface ColorScheme {
  id: HabitColor;
  label: string;
  bg: string;
  bgSubtle: string;
  border: string;
  text: string;
  ring: string;
  glow: string;
  hex: string;
}

export const COLOR_SCHEMES: Record<HabitColor, ColorScheme> = {
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    bg: 'bg-indigo-600',
    bgSubtle: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
    border: 'border-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'focus:ring-indigo-500',
    glow: 'shadow-indigo-500/20',
    hex: '#6366f1',
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    bg: 'bg-violet-600',
    bgSubtle: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/60',
    border: 'border-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'focus:ring-violet-500',
    glow: 'shadow-violet-500/20',
    hex: '#8b5cf6',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    bg: 'bg-rose-500',
    bgSubtle: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    border: 'border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'focus:ring-rose-500',
    glow: 'shadow-rose-500/20',
    hex: '#f43f5e',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    bg: 'bg-emerald-500',
    bgSubtle: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'focus:ring-emerald-500',
    glow: 'shadow-emerald-500/20',
    hex: '#10b981',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    bg: 'bg-amber-500',
    bgSubtle: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'focus:ring-amber-500',
    glow: 'shadow-amber-500/20',
    hex: '#f59e0b',
  },
  cyan: {
    id: 'cyan',
    label: 'Cyan',
    bg: 'bg-cyan-500',
    bgSubtle: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60',
    border: 'border-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    ring: 'focus:ring-cyan-500',
    glow: 'shadow-cyan-500/20',
    hex: '#06b6d4',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    bg: 'bg-blue-600',
    bgSubtle: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'focus:ring-blue-500',
    glow: 'shadow-blue-500/20',
    hex: '#3b82f6',
  },
  orange: {
    id: 'orange',
    label: 'Orange',
    bg: 'bg-orange-500',
    bgSubtle: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60',
    border: 'border-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'focus:ring-orange-500',
    glow: 'shadow-orange-500/20',
    hex: '#f97316',
  },
};

export const COLOR_OPTIONS: HabitColor[] = [
  'indigo',
  'violet',
  'rose',
  'emerald',
  'amber',
  'cyan',
  'blue',
  'orange',
];
