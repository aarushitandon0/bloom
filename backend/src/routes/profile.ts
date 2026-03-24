// ── Profile routes ────────────────────────────────────────────
//
// GET   /api/profile              → own profile
// PATCH /api/profile              → update own profile [full account]
// GET   /api/profile/world        → all public profiles for world map
//                                   (any auth level including guests)

import { Router } from 'express';
import { z } from 'zod';
import { adminSupabase } from '../lib/supabase.js';
import { requireAuth, requireFullAccount, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { UserProfile } from '../types/database.js';

const router = Router();

const updateProfileSchema = z.object({
  garden_name:   z.string().min(1).max(40).optional(),
  cottage_style: z.enum(['wood', 'stone', 'brick']).optional(),
  accent_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  hemisphere:    z.enum(['north', 'south']).optional(),
  is_public:     z.boolean().optional(),
});

// ── GET /api/profile ─────────────────────────────────────────
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await adminSupabase
    .from('user_profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json({ profile: data });
}));

// ── PATCH /api/profile ───────────────────────────────────────
router.patch('/', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await adminSupabase
    .from('user_profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as Partial<UserProfile>)
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ profile: data });
}));

// ── GET /api/profile/world ───────────────────────────────────
// Returns public profiles for the world map.
// Guests CAN see this — it's the explore experience.
router.get('/world', optionalAuth, asyncHandler(async (_req, res) => {
  const { data, error } = await adminSupabase
    .from('user_profiles')
    .select('id, garden_name, accent_colour, cottage_style, current_streak, total_tiles, hemisphere')
    .eq('is_public', true)
    .order('current_streak', { ascending: false })
    .limit(200);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ gardens: data ?? [] });
}));

export default router;
