// ── useSeason hook ──────────────────────────────────────────

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentSeason } from '@/lib/canvas/seasons';
import type { Season, Hemisphere } from '@/types/garden';

/**
 * Returns the current real-world season based on date + hemisphere.
 */
export function useSeason(): Season {
  const hemisphere = useAuthStore(
    (s) => (s.profile?.hemisphere ?? 'north') as Hemisphere
  );

  return useMemo(() => getCurrentSeason(hemisphere), [hemisphere]);
}
