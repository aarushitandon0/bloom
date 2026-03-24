// ── useGarden hook ──────────────────────────────────────────

import { useEffect } from 'react';
import { useGardenStore } from '@/stores/gardenStore';
import { useAuthStore } from '@/stores/authStore';

export function useGarden() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const {
    tiles, gridSize, viewDirection, cottageStyle, isEditorMode, isLoading,
    fetchTiles, rotateView, toggleEditor,
  } = useGardenStore();

  useEffect(() => {
    if (user) {
      fetchTiles(user.id);
    }
  }, [user, fetchTiles]);

  useEffect(() => {
    if (profile?.cottage_style) {
      useGardenStore.getState().setCottageStyle(
        profile.cottage_style as 'wood' | 'stone' | 'brick'
      );
    }
  }, [profile?.cottage_style]);

  return {
    tiles,
    gridSize,
    viewDirection,
    cottageStyle,
    isEditorMode,
    isLoading,
    rotateView,
    toggleEditor,
  };
}
