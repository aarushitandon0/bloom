// ── Streak calculations ─────────────────────────────────────

import { format, subDays, isEqual, parseISO } from 'date-fns';

/**
 * Calculate the current consecutive-day streak from a sorted
 * array of logged_date strings (YYYY-MM-DD, newest first).
 *
 * A "streak" = consecutive calendar days with at least one log.
 */
export function calculateStreak(loggedDates: string[]): {
  current: number;
  longest: number;
} {
  if (loggedDates.length === 0) return { current: 0, longest: 0 };

  // Deduplicate and sort descending
  const unique = [...new Set(loggedDates)].sort().reverse();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Current streak must include today or yesterday
  let current = 0;
  if (unique[0] === today || unique[0] === yesterday) {
    current = 1;
    for (let i = 1; i < unique.length; i++) {
      const expected = format(subDays(parseISO(unique[i - 1]), 1), 'yyyy-MM-dd');
      if (unique[i] === expected) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak ever
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = parseISO(unique[i - 1]);
    const curr = parseISO(unique[i]);
    const expectedDate = subDays(prev, 1);
    if (isEqual(curr, expectedDate)) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest };
}

/**
 * Check which milestone unlocks are earned.
 * Milestones are permanent — never revoked.
 */
export function getUnlockedMilestones(
  highestStreak: number,
  totalTiles: number,
): string[] {
  const unlocked: string[] = [];

  // Streak-based
  if (highestStreak >= 7)  { unlocked.push('bench', 'bunny'); }
  if (highestStreak >= 30) { unlocked.push('birdbath', 'hedgehog'); }

  // Tile-based
  if (totalTiles >= 50)  { unlocked.push('stone_path', 'butterfly'); }
  if (totalTiles >= 100) { unlocked.push('lantern', 'cat'); }
  if (totalTiles >= 200) { unlocked.push('wishing_well'); }

  return unlocked;
}
