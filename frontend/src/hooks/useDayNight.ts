// ── useDayNight hook ────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getDayPhase } from '@/lib/canvas/daynight';
import type { DayPhase } from '@/types/garden';

/**
 * Returns the current day phase, updated every 60 seconds.
 */
export function useDayNight(): DayPhase {
  const [phase, setPhase] = useState<DayPhase>(getDayPhase());

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(getDayPhase());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return phase;
}
