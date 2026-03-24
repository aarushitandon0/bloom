// ── Co-garden routes ──────────────────────────────────────────
//
// Co-gardens require a FULL account on all endpoints.
//
// POST /api/co-garden/invite          → create an invite link
// POST /api/co-garden/join/:code      → accept an invite
// GET  /api/co-garden                 → list active co-gardens
// DELETE /api/co-garden/:id           → leave a co-garden

import { Router } from 'express';
import { adminSupabase } from '../lib/supabase.js';
import { requireAuth, requireFullAccount } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { CoGarden } from '../types/database.js';
import { randomBytes } from 'crypto';

const router = Router();

// ── POST /api/co-garden/invite ───────────────────────────────
router.post('/invite', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const code = randomBytes(6).toString('hex');

  const { data, error } = await adminSupabase
    .from('co_garden_invites')
    .insert({ inviter_id: req.user!.id, invite_code: code } as { inviter_id: string; invite_code: string; accepted: boolean })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json({ invite: data, code });
}));

// ── POST /api/co-garden/join/:code ───────────────────────────
router.post('/join/:code', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const { data: inviteData, error: invErr } = await adminSupabase
    .from('co_garden_invites')
    .select('*')
    .eq('invite_code', req.params.code)
    .eq('accepted', false)
    .single();

  if (invErr || !inviteData) {
    res.status(404).json({ error: 'Invite not found or already used' });
    return;
  }

  const invite = inviteData as { id: string; inviter_id: string; invite_code: string; accepted: boolean; created_at: string };

  if (invite.inviter_id === req.user!.id) {
    res.status(400).json({ error: 'Cannot join your own invite' });
    return;
  }

  // Create co-garden pair (canonical: smaller uuid is user_a)
  const [a, b] = [invite.inviter_id, req.user!.id].sort();

  const { data: garden, error: gardenErr } = await adminSupabase
    .from('co_gardens')
    .upsert({ user_a_id: a, user_b_id: b, status: 'active' } as Omit<CoGarden, 'id' | 'created_at'>, { onConflict: 'user_a_id,user_b_id' })
    .select()
    .single();

  if (gardenErr) { res.status(500).json({ error: gardenErr.message }); return; }

  // Mark invite as accepted
  await adminSupabase
    .from('co_garden_invites')
    .update({ accepted: true } as { accepted: boolean })
    .eq('id', invite.id);

  res.status(201).json({ coGarden: garden });
}));

// ── GET /api/co-garden ───────────────────────────────────────
router.get('/', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const uid = req.user!.id;

  const { data, error } = await adminSupabase
    .from('co_gardens')
    .select('*')
    .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`)
    .eq('status', 'active');

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ coGardens: data ?? [] });
}));

// ── DELETE /api/co-garden/:id ────────────────────────────────
router.delete('/:id', requireAuth, requireFullAccount, asyncHandler(async (req, res) => {
  const uid = req.user!.id;

  const { error } = await adminSupabase
    .from('co_gardens')
    .update({ status: 'ended' } as Partial<CoGarden>)
    .eq('id', req.params.id)
    .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
}));

export default router;
