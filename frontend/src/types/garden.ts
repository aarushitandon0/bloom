// ── Garden domain types ────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type CottageStyle = 'wood' | 'stone' | 'brick';

export type Hemisphere = 'north' | 'south';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** Direction for isometric rotation (4 cardinal views) */
export type ViewDirection = 0 | 1 | 2 | 3;

export interface GardenTile {
  id: string;
  user_id: string;
  mood_entry_id: string | null;
  tile_type: string;
  grid_col: number;
  grid_row: number;
  is_decoration: boolean;
  placed_at: string;
}

export interface GardenLayout {
  gridSize: number;
  tiles: GardenTile[];
  cottageStyle: CottageStyle;
  viewDirection: ViewDirection;
}

export interface Position {
  col: number;
  row: number;
}

/** Sprite sheet source rectangle */
export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnimalState {
  type: 'bird' | 'bunny' | 'hedgehog' | 'butterfly' | 'cat';
  position: Position;
  frame: number;
  direction: 'left' | 'right';
  state: 'walking' | 'idle' | 'sitting';
}

export interface DecorationItem {
  id: string;
  label: string;
  unlockCondition: string;
  hasNightEffect: boolean;
}

export const DECORATION_ITEMS: DecorationItem[] = [
  { id: 'bench',       label: 'Wooden Bench',  unlockCondition: '7-day streak',     hasNightEffect: false },
  { id: 'birdbath',    label: 'Birdbath',       unlockCondition: '30-day streak',    hasNightEffect: false },
  { id: 'stone_path',  label: 'Stone Path',     unlockCondition: '50 tiles placed',  hasNightEffect: false },
  { id: 'lantern',     label: 'Lantern',        unlockCondition: '100 tiles placed', hasNightEffect: true },
  { id: 'wishing_well',label: 'Wishing Well',   unlockCondition: '200 tiles placed', hasNightEffect: false },
];
