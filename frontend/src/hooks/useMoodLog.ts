// ── useMoodLog hook ─────────────────────────────────────────

import { useMoodStore } from '@/stores/moodStore';
import { useAuthStore } from '@/stores/authStore';
import type { MoodType, Intensity } from '@/types/mood';

export function useMoodLog() {
  const user = useAuthStore((s) => s.user);
  const { entries, isLoading, submitLog, updateEntry, deleteEntry, fetchEntries } = useMoodStore();

  const log = async (moodType: MoodType, intensity: Intensity, note: string | null) => {
    const userId = user?.id ?? 'local-guest';
    return submitLog(userId, moodType, intensity, note);
  };

  const refresh = async () => {
    const userId = user?.id ?? 'local-guest';
    await fetchEntries(userId);
  };

  return {
    entries,
    isLoading,
    log,
    updateEntry,
    deleteEntry,
    refresh,
  };
}
