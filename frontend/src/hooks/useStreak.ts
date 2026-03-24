// ── useStreak hook ──────────────────────────────────────────

import { useMemo } from 'react';
import { useMoodStore } from '@/stores/moodStore';
import { calculateStreak } from '@/lib/streak';

export function useStreak() {
  const entries = useMoodStore((s) => s.entries);

  const streak = useMemo(() => {
    const dates = entries.map((e) => e.logged_date);
    return calculateStreak(dates);
  }, [entries]);

  return streak;
}
