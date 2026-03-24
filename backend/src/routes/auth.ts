// ── Auth routes ──────────────────────────────────────────────
//
// POST /api/auth/guest          → sign in anonymously
// POST /api/auth/upgrade        → link anonymous → Google OAuth
// GET  /api/auth/me             → get current user + profile
// POST /api/auth/signout        → sign out (invalidate token)
//
// Note: Google OAuth redirect flow is handled entirely on the
// frontend by Supabase JS.  These endpoints handle supplementary
// server-side operations (e.g., fetching the merged profile after
// upgrade, server-side sign-out).

import { Router } from 'express';
import { z } from 'zod';
import { adminSupabase, supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { UserProfile } from '../types/database.js';

const router = Router();

// ── POST /api/auth/guest ─────────────────────────────────────
// Creates an anonymous Supabase session.
// Returns: { access_token, refresh_token, user }
router.post('/guest', authLimiter, asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    res.status(400).json({ error: error?.message ?? 'Anonymous sign-in failed' });
    return;
  }
  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id:          data.user!.id,
      isAnonymous: true,
    },
  });
}));

// ── POST /api/auth/upgrade ───────────────────────────────────
// Links an anonymous session to a Google account after OAuth.
// Body: { access_token: string }   (the token from the OAuth callback)
// Returns: { profile }
router.post('/upgrade', authLimiter, requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({ access_token: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'access_token required' });
    return;
  }

  const { data: userData, error: userErr } = await adminSupabase.auth.getUser(
    parsed.data.access_token,
  );
  if (userErr || !userData.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Ensure profile exists for the upgraded user
  const { data: profile, error: profErr } = await adminSupabase
    .from('user_profiles')
    .upsert({ id: userData.user.id } as Partial<UserProfile> & { id: string }, { onConflict: 'id' })
    .select()
    .single();

  if (profErr) {
    res.status(500).json({ error: 'Could not create profile' });
    return;
  }

  res.json({ profile });
}));

// ── GET /api/auth/me ─────────────────────────────────────────
// Returns the authenticated user's profile.
// Works for both full accounts and anonymous guests.
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const { data: profile, error } = await adminSupabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" — normal for brand-new anonymous users
    res.status(500).json({ error: 'Could not fetch profile' });
    return;
  }

  res.json({
    user: {
      id:          req.user!.id,
      email:       req.user!.email ?? null,
      isAnonymous: req.user!.isAnonymous,
    },
    profile: profile ?? null,
  });
}));

// ── POST /api/auth/signout ───────────────────────────────────
// Invalidates the user's session server-side via admin client.
router.post('/signout', requireAuth, asyncHandler(async (req, res) => {
  const { error } = await adminSupabase.auth.admin.signOut(
    req.headers.authorization!.slice(7),
  );
  if (error) {
    // Non-fatal — client should clear its own token anyway
    console.warn('Sign-out warning:', error.message);
  }
  res.json({ ok: true });
}));

export default router;
