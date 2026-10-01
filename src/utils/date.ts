/**
 * @file date.ts
 * Date handling utility functions for HabitPulse.
 * 
 * DESIGN NOTES ON DATE HANDLING:
 * 1. All persistent date keys use the standard 'YYYY-MM-DD' ISO format (e.g. '2026-10-01').
 * 2. To avoid timezone discrepancies and day-shift bugs caused by UTC conversions in Date objects,
 *    all local date formatting uses year, month, and day based on local clock or parsed date parts.
 * 3. Day of week follows standard JavaScript conventions:
 *    0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.
 */

/**
 * Formats a Date object or ISO string to a clean 'YYYY-MM-DD' string in local time.
 */
export function formatDateKey(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date key formatted as 'YYYY-MM-DD'.
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object set at 00:00:00 local time.
 * This prevents the timezone offset from shifting the day when using new Date('YYYY-MM-DD').
 */
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  return new Date();
}

/**
 * Adds or subtracts days from a given dateKey ('YYYY-MM-DD') and returns the new dateKey.
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

/**
 * Returns the day of week for a given dateKey: 0 (Sun) to 6 (Sat).
 */
export function getDayOfWeek(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

/**
 * Returns human-readable relative label for a dateKey (e.g., "Today", "Yesterday", "Tomorrow", "Mon, Oct 1").
 */
export function formatDisplayDate(dateKey: string): string {
  const today = getTodayKey();
  const yesterday = addDaysToDateKey(today, -1);
  const tomorrow = addDaysToDateKey(today, 1);

  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  if (dateKey === tomorrow) return 'Tomorrow';

  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns formatted long date (e.g. "Thursday, October 1, 2026")
 */
export function formatFullDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns an array of date keys for a day range ending at `endDateKey` (inclusive).
 * E.g., getPastDateKeys(90) returns the last 90 days.
 */
export function getPastDateKeys(count: number, endDateKey: string = getTodayKey()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(addDaysToDateKey(endDateKey, -i));
  }
  return keys;
}

/**
 * Returns the start of the week (Sunday or Monday, default Monday = 1) for a given dateKey.
 */
export function getStartOfWeekKey(dateKey: string, startOnMonday = true): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay(); // 0 is Sunday
  const diff = startOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  return addDaysToDateKey(dateKey, diff);
}

/**
 * Returns array of 7 date keys for the week containing `dateKey`.
 */
export function getWeekDateKeys(dateKey: string, startOnMonday = true): string[] {
  const startKey = getStartOfWeekKey(dateKey, startOnMonday);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDaysToDateKey(startKey, i));
  }
  return days;
}

/**
 * Day abbreviations and full names
 */
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_SINGLE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
