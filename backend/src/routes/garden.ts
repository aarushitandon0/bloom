// ── Garden routes ─────────────────────────────────────────────
//
// All garden mutations require a FULL account (guests can only read).
//
// GET    /api/garden                     → own tiles
// GET    /api/garden/public/:userId      → public garden (any auth level)
// POST   /api/garden/tile                → place a tile  [full account]
// PATCH  /api/garden/tile/:id            → edit a tile   [full account]
// DELETE /api/garden/tile/:id            → remove a tile [full account]
// POST   /api/garden/tile/:id/water      → water a tile  [full account]

import { Router } from 'express';
import { z } from 'zod';
import { adminSupabase } from '../lib/supabase.js';
import { requireAuth, requireFullAccount, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { GardenTile } from '../types/database.js';

const router = Router();

// ── Schemas ───────────────────────────────────────────────────
const placeTileSchema = z.object({
  tile_type:     z.string().min(1),
  grid_col:      z.number().int().min(0).max(15),
  grid_row:      z.number().int().min(0).max(15),
  is_decoration: z.boolean().optional().default(false),
  mood_entry_id: z.string().uuid().optional(),
});

const editTileSchema = placeTileSchema.partial();

// ── GET /api/garden ──────────────────────────────────────────
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await adminSupabase
    .from('garden_tiles')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('placed_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ tiles: data ?? [] });
}));

// ── GET /api/garden/public/:userId ───────────────────────────
// Guests can call this — no requireFullAccount guard.
router.get('/public/:userId', optionalAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check that the garden is public
  const { data: profile, error: profErr } = await adminSupabase
    .from('user_profiles')
    .select('garden_name, is_public, accent_colour, cottage_style')
    .eq('id', userId)
    .single();

  if (profErr || !profile) {
    res.status(404).json({ error: 'Garden not found' });
    return;
  }

  const p = profile as { garden_name: string; is_public: boolean; accent_colour: string; cottage_style: string };
  if (!p.is_public) {
    res.status(403).json({ error: 'This garden is private' });
    return;
  }

  const { data: tiles, error: tileErr } = await adminSupabase
    .from('garden_tiles')
    .select('*')
    .eq('user_id', userId)
    .order('placed_at', { ascending: true });

  if (tileErr) { res.status(500).json({ error: tileErr.message }); return; }

  res.json({ profile: p, tiles: (tiles ?? []) as GardenTile[] });
}));

// ── POST /api/garden/tile ────────────────────────────────────
router.post('/tile', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const parsed = placeTileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await adminSupabase
    .from('garden_tiles')
    .insert({ ...parsed.data, user_id: req.user!.id } as Omit<GardenTile, 'id' | 'placed_at'>)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Increment total_tiles counter on the profile
  await adminSupabase.rpc('increment_total_tiles' as never, { uid: req.user!.id } as never);

  res.status(201).json({ tile: data });
}));

// ── PATCH /api/garden/tile/:id ───────────────────────────────
router.patch('/tile/:id', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const parsed = editTileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await adminSupabase
    .from('garden_tiles')
    .update(parsed.data as Partial<GardenTile>)
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data)  { res.status(404).json({ error: 'Tile not found' }); return; }

  res.json({ tile: data });
}));

// ── DELETE /api/garden/tile/:id ──────────────────────────────
router.delete('/tile/:id', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const { error } = await adminSupabase
    .from('garden_tiles')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
}));

// ── POST /api/garden/tile/:id/water ─────────────────────────
// Increments water_count; upgrades variant: sprout→standard→bloom
router.post('/tile/:id/water', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  // Fetch current tile
  const { data: tileData, error: fetchErr } = await adminSupabase
    .from('garden_tiles')
    .select('id, user_id, tile_type, water_count')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (fetchErr || !tileData) { res.status(404).json({ error: 'Tile not found' }); return; }

  const tile = tileData as Pick<GardenTile, 'id' | 'user_id' | 'tile_type' | 'water_count'>;

  // Upgrade logic: sprout (0 waters) → standard (1 water) → bloom (3+ waters)
  const newCount  = (tile.water_count ?? 0) + 1;
  let newTileType = tile.tile_type;

  if (tile.tile_type.endsWith('_sprout') && newCount >= 1) {
    newTileType = tile.tile_type.replace('_sprout', '');
  } else if (!tile.tile_type.endsWith('_bloom') && newCount >= 3) {
    newTileType = tile.tile_type + '_bloom';
  }

  const { data: updated, error: updateErr } = await adminSupabase
    .from('garden_tiles')
    .update({ water_count: newCount, tile_type: newTileType } as Partial<GardenTile>)
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateErr) { res.status(500).json({ error: updateErr.message }); return; }

  res.json({ tile: updated, upgraded: newTileType !== tile.tile_type });
}));

export default router;
