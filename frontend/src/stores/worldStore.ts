// ── World store — anonymous garden discovery ───────────────

import { create } from 'zustand';
import type { GardenTile } from '@/types/garden';
import type { MoodType } from '@/types/mood';
import { getGridSize, getNextAvailablePosition } from '@/lib/canvas/renderer';

export interface WorldGarden {
  id: string;
  gardenName: string;       // anonymous label like "garden #42"
  moodType: string;          // latest mood
  tileCount: number;         // how many plants
  season: string;
  kindNotes: KindNote[];
  position: { x: number; y: number }; // position on the world canvas (0-1 range)
  islandHue: number;         // random hue for the island color
  tiles: GardenTile[];       // generated tiles for the garden view
}

export interface KindNote {
  id: string;
  message: string;
  sentAt: string;
}

/* ── Helper: Generate plausible tiles for a world garden ─── */

const MOOD_TYPES: MoodType[] = ['happy', 'calm', 'sad', 'stressed', 'excited', 'neutral', 'grateful', 'tired'];
const VARIANTS = ['sprout', 'standard', 'bloom'] as const;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateTiles(gardenId: string, count: number, primaryMood: string): GardenTile[] {
  const rand = seededRandom(gardenId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const tiles: GardenTile[] = [];
  const gridSize = getGridSize(count);

  for (let i = 0; i < count; i++) {
    // 60% chance the tile matches the garden's primary mood
    const mood = rand() < 0.6
      ? primaryMood
      : MOOD_TYPES[Math.floor(rand() * MOOD_TYPES.length)];
    const variant = VARIANTS[Math.floor(rand() * VARIANTS.length)];
    const tileType = `${mood}_${variant}`;

    const pos = getNextAvailablePosition(tiles, gridSize);

    tiles.push({
      id: `${gardenId}-tile-${i}`,
      user_id: gardenId,
      mood_entry_id: null,
      tile_type: tileType,
      grid_col: pos.col,
      grid_row: pos.row,
      is_decoration: false,
      placed_at: new Date(Date.now() - (count - i) * 86400000).toISOString(),
    });
  }

  return tiles;
}

// Pre-seeded anonymous gardens for demo (in real app these come from Supabase)
const ANONYMOUS_GARDENS: WorldGarden[] = [
  {
    id: 'world-1', gardenName: 'garden #7',
    moodType: 'happy', tileCount: 14, season: 'spring',
    kindNotes: [{ id: 'n1', message: 'your garden is so lovely!', sentAt: '2026-03-22T10:00:00Z' }],
    position: { x: 0.15, y: 0.18 }, islandHue: 120, tiles: [],
  },
  {
    id: 'world-2', gardenName: 'garden #23',
    moodType: 'calm', tileCount: 8, season: 'spring',
    kindNotes: [],
    position: { x: 0.75, y: 0.12 }, islandHue: 200, tiles: [],
  },
  {
    id: 'world-3', gardenName: 'garden #51',
    moodType: 'sad', tileCount: 22, season: 'winter',
    kindNotes: [
      { id: 'n2', message: 'sending warmth your way', sentAt: '2026-03-21T14:00:00Z' },
      { id: 'n3', message: 'you are not alone, keep going!', sentAt: '2026-03-20T09:30:00Z' },
    ],
    position: { x: 0.45, y: 0.38 }, islandHue: 220, tiles: [],
  },
  {
    id: 'world-4', gardenName: 'garden #12',
    moodType: 'grateful', tileCount: 31, season: 'autumn',
    kindNotes: [{ id: 'n4', message: 'what a beautiful garden!', sentAt: '2026-03-22T18:00:00Z' }],
    position: { x: 0.2, y: 0.62 }, islandHue: 35, tiles: [],
  },
  {
    id: 'world-5', gardenName: 'garden #88',
    moodType: 'excited', tileCount: 5, season: 'summer',
    kindNotes: [],
    position: { x: 0.82, y: 0.45 }, islandHue: 350, tiles: [],
  },
  {
    id: 'world-6', gardenName: 'garden #34',
    moodType: 'stressed', tileCount: 18, season: 'spring',
    kindNotes: [{ id: 'n5', message: 'take a deep breath, you got this!', sentAt: '2026-03-23T08:00:00Z' }],
    position: { x: 0.5, y: 0.72 }, islandHue: 280, tiles: [],
  },
  {
    id: 'world-7', gardenName: 'garden #99',
    moodType: 'tired', tileCount: 12, season: 'winter',
    kindNotes: [],
    position: { x: 0.1, y: 0.42 }, islandHue: 260, tiles: [],
  },
  {
    id: 'world-8', gardenName: 'garden #5',
    moodType: 'neutral', tileCount: 9, season: 'summer',
    kindNotes: [],
    position: { x: 0.78, y: 0.78 }, islandHue: 160, tiles: [],
  },
].map((g) => ({ ...g, tiles: generateTiles(g.id, g.tileCount, g.moodType) }));

// Positive-only messages you can send
export const KIND_PRESETS = [
  'your garden is beautiful!',
  'sending sunshine your way!',
  'keep blooming, you\'re doing great!',
  'wishing you a lovely day!',
  'your plants look so happy!',
  'you are stronger than you think!',
  'take it easy, you deserve rest',
  'the world is brighter with you in it!',
];

interface WorldState {
  gardens: WorldGarden[];
  selectedGardenId: string | null;
  isLoading: boolean;

  fetchGardens: () => Promise<void>;
  selectGarden: (id: string | null) => void;
  sendKindNote: (gardenId: string, message: string) => void;
}

export const useWorldStore = create<WorldState>((set, _get) => ({
  gardens: [],
  selectedGardenId: null,
  isLoading: false,

  fetchGardens: async () => {
    set({ isLoading: true });
    // In real app, fetch from Supabase with anonymous projection
    // For now, use pre-seeded data
    await new Promise((r) => setTimeout(r, 600)); // simulate loading
    set({ gardens: ANONYMOUS_GARDENS, isLoading: false });
  },

  selectGarden: (id) => {
    set({ selectedGardenId: id });
  },

  sendKindNote: (gardenId, message) => {
    const note: KindNote = {
      id: `note-${Date.now()}`,
      message,
      sentAt: new Date().toISOString(),
    };
    set((s) => ({
      gardens: s.gardens.map((g) =>
        g.id === gardenId
          ? { ...g, kindNotes: [note, ...g.kindNotes] }
          : g
      ),
    }));
    // In real app: insert to Supabase kind_notes table
  },
}));
