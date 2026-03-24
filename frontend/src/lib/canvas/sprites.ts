// ── Sprite sheet coordinate map ──────────────────────────────

import type { SpriteRect } from '@/types/garden';

/**
 * All sprite source rectangles from the sprite sheets.
 * Coordinates are in the 16x16 pixel-art grid.
 * Rendering scales these up by TILE_SCALE.
 */
export const SPRITE_MAP: Record<string, SpriteRect> = {
  // ── Plant tiles (plants.png) ── 8 moods x 3 variants ──
  // Row 0: Happy
  happy_sprout:      { x: 0,   y: 0,  w: 16, h: 16 },
  happy_standard:    { x: 16,  y: 0,  w: 16, h: 16 },
  happy_bloom:       { x: 32,  y: 0,  w: 16, h: 24 },  // taller
  // Row 1: Calm
  calm_sprout:       { x: 0,   y: 16, w: 16, h: 16 },
  calm_standard:     { x: 16,  y: 16, w: 16, h: 16 },
  calm_bloom:        { x: 32,  y: 16, w: 16, h: 24 },
  // Row 2: Sad
  sad_sprout:        { x: 0,   y: 32, w: 16, h: 16 },
  sad_standard:      { x: 16,  y: 32, w: 16, h: 16 },
  sad_bloom:         { x: 32,  y: 32, w: 16, h: 24 },
  // Row 3: Stressed
  stressed_sprout:   { x: 0,   y: 48, w: 16, h: 16 },
  stressed_standard: { x: 16,  y: 48, w: 16, h: 16 },
  stressed_bloom:    { x: 32,  y: 48, w: 16, h: 24 },
  // Row 4: Excited
  excited_sprout:    { x: 0,   y: 64, w: 16, h: 16 },
  excited_standard:  { x: 16,  y: 64, w: 16, h: 16 },
  excited_bloom:     { x: 32,  y: 64, w: 16, h: 24 },
  // Row 5: Neutral
  neutral_sprout:    { x: 0,   y: 80, w: 16, h: 16 },
  neutral_standard:  { x: 16,  y: 80, w: 16, h: 16 },
  neutral_bloom:     { x: 32,  y: 80, w: 16, h: 24 },
  // Row 6: Grateful
  grateful_sprout:   { x: 0,   y: 96, w: 16, h: 16 },
  grateful_standard: { x: 16,  y: 96, w: 16, h: 16 },
  grateful_bloom:    { x: 32,  y: 96, w: 16, h: 24 },
  // Row 7: Tired
  tired_sprout:      { x: 0,   y: 112, w: 16, h: 16 },
  tired_standard:    { x: 16,  y: 112, w: 16, h: 16 },
  tired_bloom:       { x: 32,  y: 112, w: 16, h: 24 },
  // Row 8: Anxious
  anxious_sprout:    { x: 0,   y: 128, w: 16, h: 16 },
  anxious_standard:  { x: 16,  y: 128, w: 16, h: 16 },
  anxious_bloom:     { x: 32,  y: 128, w: 16, h: 24 },
  // Row 9: Hopeful
  hopeful_sprout:    { x: 0,   y: 144, w: 16, h: 16 },
  hopeful_standard:  { x: 16,  y: 144, w: 16, h: 16 },
  hopeful_bloom:     { x: 32,  y: 144, w: 16, h: 24 },
  // Row 10: Angry
  angry_sprout:      { x: 0,   y: 160, w: 16, h: 16 },
  angry_standard:    { x: 16,  y: 160, w: 16, h: 16 },
  angry_bloom:       { x: 32,  y: 160, w: 16, h: 24 },
  // Row 11: Loved
  loved_sprout:      { x: 0,   y: 176, w: 16, h: 16 },
  loved_standard:    { x: 16,  y: 176, w: 16, h: 16 },
  loved_bloom:       { x: 32,  y: 176, w: 16, h: 24 },
  // Row 12: Confused
  confused_sprout:   { x: 0,   y: 192, w: 16, h: 16 },
  confused_standard: { x: 16,  y: 192, w: 16, h: 16 },
  confused_bloom:    { x: 32,  y: 192, w: 16, h: 24 },
  // Row 13: Proud
  proud_sprout:      { x: 0,   y: 208, w: 16, h: 16 },
  proud_standard:    { x: 16,  y: 208, w: 16, h: 16 },
  proud_bloom:       { x: 32,  y: 208, w: 16, h: 24 },

  // ── Ground tiles (ground.png) ──
  grass:             { x: 0,   y: 0,  w: 16, h: 16 },
  grass_lush:        { x: 16,  y: 0,  w: 16, h: 16 },
  dirt:              { x: 32,  y: 0,  w: 16, h: 16 },
  path:              { x: 48,  y: 0,  w: 16, h: 16 },
  puddle:            { x: 0,   y: 16, w: 16, h: 16 },
  snow_ground:       { x: 16,  y: 16, w: 16, h: 16 },
  autumn_ground:     { x: 32,  y: 16, w: 16, h: 16 },
  spring_ground:     { x: 48,  y: 16, w: 16, h: 16 },

  // ── Fence tiles (in ground.png lower rows) ──
  fence_top:         { x: 0,   y: 32, w: 16, h: 16 },
  fence_right:       { x: 16,  y: 32, w: 16, h: 16 },
  fence_bottom:      { x: 32,  y: 32, w: 16, h: 16 },
  fence_left:        { x: 48,  y: 32, w: 16, h: 16 },
  fence_corner_tl:   { x: 0,   y: 48, w: 16, h: 16 },
  fence_corner_tr:   { x: 16,  y: 48, w: 16, h: 16 },
  fence_corner_bl:   { x: 32,  y: 48, w: 16, h: 16 },
  fence_corner_br:   { x: 48,  y: 48, w: 16, h: 16 },

  // ── Decorations (decorations.png) ──
  bench:             { x: 0,   y: 0,  w: 16, h: 16 },
  birdbath:          { x: 16,  y: 0,  w: 16, h: 16 },
  lantern:           { x: 32,  y: 0,  w: 16, h: 24 },
  wishing_well:      { x: 48,  y: 0,  w: 16, h: 24 },
  stone_path:        { x: 0,   y: 16, w: 16, h: 16 },

  // ── Cottage ──
  cottage_wood:      { x: 0,   y: 0,  w: 48, h: 48 },
  cottage_stone:     { x: 0,   y: 0,  w: 48, h: 48 },
  cottage_brick:     { x: 0,   y: 0,  w: 48, h: 48 },
};

/** Tile render dimensions */
export const TILE_W = 64;    // rendered tile width (2:1 iso)
export const TILE_H = 32;    // rendered tile height
export const TILE_DEPTH = 16; // vertical face height
export const TILE_SCALE = 4;  // 16px source -> 64px rendered
