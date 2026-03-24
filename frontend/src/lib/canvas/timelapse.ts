// ── Time-lapse playback engine ───────────────────────────────

import type { MoodEntry } from '@/types/mood';
import type { GardenTile } from '@/types/garden';

export interface TimeLapseState {
  entries: MoodEntry[];
  tiles: GardenTile[];
  currentIndex: number;
  isPlaying: boolean;
  speed: 'slow' | 'normal' | 'fast';
  elapsed: number;
}

const SPEED_MAP = {
  slow:   0.8,  // seconds per tile
  normal: 0.4,
  fast:   0.15,
};

export function createTimeLapseState(
  entries: MoodEntry[],
  tiles: GardenTile[],
): TimeLapseState {
  // Sort by logged_at ascending
  const sorted = [...entries].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );
  const sortedTiles = [...tiles].sort(
    (a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()
  );

  return {
    entries: sorted,
    tiles: sortedTiles,
    currentIndex: 0,
    isPlaying: false,
    speed: 'normal',
    elapsed: 0,
  };
}

/**
 * Advance the time-lapse by delta time.
 * Returns the tiles that should be visible.
 */
export function updateTimeLapse(
  state: TimeLapseState,
  deltaTime: number,
): { visibleTiles: GardenTile[]; currentEntry: MoodEntry | null; done: boolean } {
  if (!state.isPlaying || state.currentIndex >= state.tiles.length) {
    return {
      visibleTiles: state.tiles.slice(0, state.currentIndex),
      currentEntry: state.entries[state.currentIndex - 1] ?? null,
      done: state.currentIndex >= state.tiles.length,
    };
  }

  state.elapsed += deltaTime;
  const interval = SPEED_MAP[state.speed];

  if (state.elapsed >= interval) {
    state.elapsed = 0;
    state.currentIndex++;
  }

  return {
    visibleTiles: state.tiles.slice(0, state.currentIndex),
    currentEntry: state.entries[Math.min(state.currentIndex, state.entries.length) - 1] ?? null,
    done: state.currentIndex >= state.tiles.length,
  };
}
