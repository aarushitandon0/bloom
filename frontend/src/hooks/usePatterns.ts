// ── usePatterns hook ────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { useMoodStore } from '@/stores/moodStore';
import { useNotifStore } from '@/stores/notifStore';
import { useAuthStore } from '@/stores/authStore';
import { useGardenStore } from '@/stores/gardenStore';
import { detectPatterns } from '@/lib/patterns';
import { supabase } from '@/lib/supabase';

/**
 * Detects mood patterns and fires soft toast notifications.
 * Each pattern fires at most once per 48 hours.
 */
export function usePatterns() {
  const entries = useMoodStore((s) => s.entries);
  const user = useAuthStore((s) => s.user);
  const totalTiles = useGardenStore((s) => s.tiles.length);
  const showToast = useNotifStore((s) => s.showPatternToast);
  const lastCheck = useRef<number>(0);

  useEffect(() => {
    if (!user || entries.length === 0) return;

    // Debounce — at most once per 2 seconds
    const now = Date.now();
    if (now - lastCheck.current < 2000) return;
    lastCheck.current = now;

    const check = async () => {
      const patterns = detectPatterns(entries, totalTiles);
      if (patterns.length === 0) return;

      // Check 48h cooldown
      const { data: seen } = await supabase
        .from('pattern_toasts_seen')
        .select('pattern_id, seen_at')
        .eq('user_id', user.id);

      const cooldown = 48 * 60 * 60 * 1000;
      const seenMap = new Map(
        (seen ?? []).map((s: { pattern_id: string; seen_at: string }) => [
          s.pattern_id,
          new Date(s.seen_at).getTime(),
        ])
      );

      for (const pattern of patterns) {
        const lastSeen = seenMap.get(pattern.id) ?? 0;
        if (now - lastSeen < cooldown) continue;

        // Show toast and record
        showToast(pattern.id, pattern.message);
        await supabase.from('pattern_toasts_seen').upsert({
          user_id: user.id,
          pattern_id: pattern.id,
          seen_at: new Date().toISOString(),
        });
        break; // Only one toast at a time
      }
    };

    check();
  }, [entries, user, totalTiles, showToast]);
}
