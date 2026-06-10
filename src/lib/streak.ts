import type { StreakInfo } from '@/api/types';

export interface WatchStreakResult {
  distinctDays: number;
  longestStreak: StreakInfo | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(d: Date): number {
  // Map the local calendar day onto a UTC timestamp so consecutive days
  // always differ by exactly DAY_MS, regardless of DST transitions.
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function toDateString(utcDayMs: number): string {
  return new Date(utcDayMs).toISOString().slice(0, 10);
}

/** Compute distinct watch days and the longest run of consecutive days. */
export function computeWatchStreak(dates: Date[]): WatchStreakResult {
  const days = new Set<number>();
  for (const d of dates) {
    if (!isNaN(d.getTime())) days.add(dayKey(d));
  }
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { distinctDays: 0, longestStreak: null };
  }

  let bestLen = 1;
  let bestStart = sorted[0];
  let bestEnd = sorted[0];
  let curLen = 1;
  let curStart = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === DAY_MS) {
      curLen += 1;
    } else {
      curLen = 1;
      curStart = sorted[i];
    }
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
      bestEnd = sorted[i];
    }
  }

  return {
    distinctDays: sorted.length,
    longestStreak: {
      days: bestLen,
      start: toDateString(bestStart),
      end: toDateString(bestEnd),
    },
  };
}

/** Format a YYYY-MM-DD date string in the user's locale without timezone shifts. */
export function formatStreakDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
