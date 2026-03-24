// ── Garden store ────────────────────────────────────────────

import { create } from 'zustand';
import type { GardenTile, ViewDirection, CottageStyle } from '@/types/garden';
import type { MoodEntry } from '@/types/mood';
import { supabase } from '@/lib/supabase';
import { gardenApi } from '@/lib/api';
import { getGridSize, getNextAvailablePosition } from '@/lib/canvas/renderer';

interface GardenState {
  tiles: GardenTile[];
  gridSize: number;
  viewDirection: ViewDirection;
  cottageStyle: CottageStyle;
  isEditorMode: boolean;
  isLoading: boolean;
  /** Tile IDs currently showing water sparkle */
  wateredTiles: Set<string>;

  // Actions
  fetchTiles: (userId: string) => Promise<void>;
  placeTileForEntry: (userId: string, entry: MoodEntry) => Promise<void>;
  addTileOptimistic: (tile: GardenTile) => void;
  addPartnerTile: (entry: MoodEntry) => void;
  moveTile: (tileId: string, newCol: number, newRow: number) => Promise<void>;
  updateTile: (tileId: string, newTileType: string) => Promise<void>;
  /** Water a tile — upgrades sprout→standard→bloom */
  waterTile: (tileId: string) => void;
  rotateView: (direction: 'cw' | 'ccw') => void;
  toggleEditor: () => void;
  setCottageStyle: (style: CottageStyle) => void;

  // Events
  triggerCottageLightUp: () => void;
  animateTileWater: (tileId: string) => void;
}

export const useGardenStore = create<GardenState>((set, get) => ({
  tiles: [],
  gridSize: 4,
  viewDirection: 0,
  cottageStyle: 'wood',
  isEditorMode: false,
  isLoading: false,
  wateredTiles: new Set<string>(),

  fetchTiles: async (userId: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('garden_tiles')
      .select('*')
      .eq('user_id', userId)
      .order('placed_at', { ascending: true });

    if (!error && data) {
      const tiles = data as unknown as GardenTile[];
      set({
        tiles,
        gridSize: getGridSize(tiles.length),
      });
    }
    set({ isLoading: false });
  },

  placeTileForEntry: async (userId: string, entry: MoodEntry) => {
    const state = get();
    const newGridSize = getGridSize(state.tiles.length + 1);
    const position = getNextAvailablePosition(state.tiles, newGridSize);

    const tileData = {
      user_id: userId,
      mood_entry_id: entry.id,
      tile_type: entry.tile_type,
      grid_col: position.col,
      grid_row: position.row,
      is_decoration: false,
    };

    // Optimistic add — this ensures the tile shows up immediately
    const optimisticTile: GardenTile = {
      id: `local-tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...tileData,
      placed_at: new Date().toISOString(),
    };
    set((s) => ({
      tiles: [...s.tiles, optimisticTile],
      gridSize: newGridSize,
    }));

    // Try to persist to Supabase (gracefully ignore if unavailable)
    try {
      const { data, error } = await supabase
        .from('garden_tiles')
        .insert(tileData)
        .select()
        .single();

      if (!error && data) {
        const realTile = data as unknown as GardenTile;
        set((s) => ({
          tiles: s.tiles.map((t) => (t.id === optimisticTile.id ? realTile : t)),
        }));
      }

      await supabase
        .from('user_profiles')
        .update({ total_tiles: get().tiles.length })
        .eq('id', userId);
    } catch {
      // Supabase unavailable — tile is already in local state
    }
  },

  addTileOptimistic: (tile: GardenTile) => {
    set((s) => ({
      tiles: [...s.tiles, tile],
      gridSize: getGridSize(s.tiles.length + 1),
    }));
  },

  addPartnerTile: (_entry: MoodEntry) => {
    // Co-garden tile sync — implemented in Phase 7
  },

  moveTile: async (tileId: string, newCol: number, newRow: number) => {
    set((s) => ({
      tiles: s.tiles.map((t) =>
        t.id === tileId ? { ...t, grid_col: newCol, grid_row: newRow } : t
      ),
    }));

    // Only persist to Supabase if the tile has a real ID (not local optimistic)
    if (!tileId.startsWith('local-tile-')) {
      try {
        await supabase
          .from('garden_tiles')
          .update({ grid_col: newCol, grid_row: newRow })
          .eq('id', tileId);
      } catch {
        // Supabase unavailable — move already applied locally
      }
    }
  },

  updateTile: async (tileId: string, newTileType: string) => {
    set((s) => ({
      tiles: s.tiles.map((t) =>
        t.id === tileId ? { ...t, tile_type: newTileType } : t
      ),
    }));

    try {
      await supabase
        .from('garden_tiles')
        .update({ tile_type: newTileType })
        .eq('id', tileId);
    } catch {
      // Supabase unavailable — change is already in local state
    }
  },

  waterTile: (tileId: string) => {
    const tile = get().tiles.find((t) => t.id === tileId);
    if (!tile) return;

    // Upgrade path: sprout → standard → bloom
    const parts = tile.tile_type.split('_');
    const variant = parts.pop();
    const mood = parts.join('_');

    let newVariant = variant;
    if (variant === 'sprout') newVariant = 'standard';
    else if (variant === 'standard') newVariant = 'bloom';
    // bloom stays bloom — fully grown

    const newType = `${mood}_${newVariant}`;

    // Optimistic update + sparkle animation
    set((s) => ({
      tiles: s.tiles.map((t) =>
        t.id === tileId ? { ...t, tile_type: newType } : t
      ),
      wateredTiles: new Set([...s.wateredTiles, tileId]),
    }));

    // Clear watered visual after 3s
    setTimeout(() => {
      set((s) => {
        const next = new Set(s.wateredTiles);
        next.delete(tileId);
        return { wateredTiles: next };
      });
    }, 3000);

    // Persist via backend API (non-blocking)
    gardenApi.waterTile(tileId).then((result) => {
      // If the backend computed a different upgrade (e.g. water_count-based),
      // reconcile the tile type with what the server returned
      const serverTile = result.tile as GardenTile | null;
      if (serverTile && serverTile.tile_type !== newType) {
        set((s) => ({
          tiles: s.tiles.map((t) => t.id === tileId ? { ...t, ...serverTile } : t),
        }));
      }
    }).catch((err) => {
      console.warn('waterTile backend error:', err?.message ?? err);
      // State already updated optimistically — no rollback needed for visual
    });
  },

  rotateView: (direction: 'cw' | 'ccw') => {
    set((s) => ({
      viewDirection: ((s.viewDirection + (direction === 'cw' ? 1 : 3)) % 4) as ViewDirection,
    }));
  },

  toggleEditor: () => {
    set((s) => ({ isEditorMode: !s.isEditorMode }));
  },

  setCottageStyle: (style: CottageStyle) => {
    set({ cottageStyle: style });
  },

  triggerCottageLightUp: () => {
    // Visual event — consumed by the canvas renderer
    // Implementation: dispatch a transient event
  },

  animateTileWater: (_tileId: string) => {
    // Visual event — consumed by the canvas renderer
  },
}));
