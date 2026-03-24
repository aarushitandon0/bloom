// ── Mood routes ───────────────────────────────────────────────
//
// Guests CANNOT log moods (requireFullAccount on all mutations).
//
// GET    /api/mood                → recent entries (last 90 days)
// POST   /api/mood                → log a new mood entry  [full account]
// DELETE /api/mood/:id            → delete an entry       [full account]

import { Router } from 'express';
import { z } from 'zod';
import { adminSupabase } from '../lib/supabase.js';
import { requireAuth, requireFullAccount } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { MoodEntry } from '../types/database.js';

const router = Router();

const moodTypes = ['happy', 'calm', 'sad', 'stressed', 'excited', 'neutral', 'grateful', 'tired', 'anxious', 'hopeful', 'angry', 'loved', 'confused', 'proud'] as const;
const weatherTypes = ['sunny', 'rain', 'thunder', 'windy', 'foggy', 'snowy', 'heat_shimmer', 'overcast'] as const;

const logMoodSchema = z.object({
  mood_type:    z.enum(moodTypes),
  intensity:    z.number().int().min(1).max(5),
  note:         z.string().max(1000).optional(),
  tile_type:    z.string().min(1),
  weather_type: z.enum(weatherTypes),
  logged_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── GET /api/mood ────────────────────────────────────────────
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await adminSupabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', req.user!.id)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ entries: data ?? [] });
}));

// ── POST /api/mood ───────────────────────────────────────────
router.post('/', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const parsed = logMoodSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await adminSupabase
    .from('mood_entries')
    .insert({
      user_id:      req.user!.id,
      mood_type:    parsed.data.mood_type,
      intensity:    parsed.data.intensity,
      note:         parsed.data.note ?? null,
      tile_type:    parsed.data.tile_type,
      weather_type: parsed.data.weather_type,
      logged_date:  parsed.data.logged_date ?? today,
    } as Omit<MoodEntry, 'id' | 'created_at' | 'updated_at' | 'logged_at'>)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json({ entry: data });
}));

// ── DELETE /api/mood/:id ─────────────────────────────────────
router.delete('/:id', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const { error } = await adminSupabase
    .from('mood_entries')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
}));

export default router;
