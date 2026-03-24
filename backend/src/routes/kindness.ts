// ── Kindness routes ───────────────────────────────────────────
//
// Sending kindness (water drop, flower, note) requires a FULL account.
// Guests can view the world map and public gardens, but cannot send.
//
// GET  /api/kindness              → unread events for the authed user
// POST /api/kindness              → send a kindness event [full account]
// POST /api/kindness/:id/read     → mark an event as read

import { Router } from 'express';
import { z } from 'zod';
import { adminSupabase } from '../lib/supabase.js';
import { requireAuth, requireFullAccount } from '../middleware/auth.js';
import { kindnessLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { KindnessEvent } from '../types/database.js';

const router = Router();

const sendKindnessSchema = z.object({
  recipient_id:   z.string().uuid(),
  event_type:     z.enum(['water', 'flower', 'note']),
  note_text:      z.string().max(280).optional(),
  target_tile_id: z.string().uuid().optional(),
});

// ── GET /api/kindness ────────────────────────────────────────
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await adminSupabase
    .from('kindness_events')
    .select('*')
    .eq('recipient_id', req.user!.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ events: data ?? [] });
}));

// ── POST /api/kindness ───────────────────────────────────────
// Requires a FULL account — guests cannot send kindness.
router.post(
  '/',
  requireAuth,
  requireFullAccount,
  kindnessLimiter,
  asyncHandler(async (req, res) => {
    const parsed = sendKindnessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    // Prevent self-kindness (it's sweet, but meaningless)
    if (parsed.data.recipient_id === req.user!.id) {
      res.status(400).json({ error: 'Cannot send kindness to yourself' });
      return;
    }

    // Verify recipient exists
    const { data: recipient } = await adminSupabase
      .from('user_profiles')
      .select('id')
      .eq('id', parsed.data.recipient_id)
      .single();

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    const { data, error } = await adminSupabase
      .from('kindness_events')
      .insert({
        sender_id:      req.user!.id,
        recipient_id:   parsed.data.recipient_id,
        event_type:     parsed.data.event_type,
        note_text:      parsed.data.note_text ?? null,
        target_tile_id: parsed.data.target_tile_id ?? null,
      } as Omit<KindnessEvent, 'id' | 'created_at' | 'is_read'>)
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ event: data });
  }),
);

// ── POST /api/kindness/:id/read ──────────────────────────────
router.post('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const { error } = await adminSupabase
    .from('kindness_events')
    .update({ is_read: true } as Partial<KindnessEvent>)
    .eq('id', req.params.id)
    .eq('recipient_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
}));

export default router;
