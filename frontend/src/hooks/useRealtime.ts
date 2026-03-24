// ── useRealtime hook ────────────────────────────────────────

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useNotifStore } from '@/stores/notifStore';
import { useGardenStore } from '@/stores/gardenStore';
import type { KindnessEvent } from '@/types/user';

/**
 * Subscribe to Supabase Realtime for kindness events
 * and co-garden tile sync.
 */
export function useRealtime() {
  const user = useAuthStore((s) => s.user);
  const addKindness = useNotifStore((s) => s.addKindness);
  const triggerCottageLightUp = useGardenStore((s) => s.triggerCottageLightUp);
  const animateTileWater = useGardenStore((s) => s.animateTileWater);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user || channelRef.current) return;

    const channel = supabase
      .channel(`kindness:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kindness_events',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const event = payload.new as unknown as KindnessEvent;
          addKindness(event);
          triggerCottageLightUp();
          if (event.event_type === 'water' && event.target_tile_id) {
            animateTileWater(event.target_tile_id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, addKindness, triggerCottageLightUp, animateTileWater]);
}
