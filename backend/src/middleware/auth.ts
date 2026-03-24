// ── Auth middleware ───────────────────────────────────────────
// Verifies the Supabase JWT from the Authorization header and
// attaches the authenticated user to req.user.
//
// Usage:
//   router.get('/protected', requireAuth, handler)
//   router.get('/optional',  optionalAuth, handler)  ← guest OK
//   router.get('/admin',     requireAuth, requireFullAccount, handler)

import type { Request, Response, NextFunction } from 'express';
import { adminSupabase } from '../lib/supabase.js';

// Extend Express Request with our user fields
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        isAnonymous: boolean;
        isGuest: boolean;   // alias for isAnonymous — used in route guards
      };
    }
  }
}

// ── Helper: extract & verify the JWT ─────────────────────────
async function verifyToken(token: string) {
  const { data, error } = await adminSupabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ── requireAuth ───────────────────────────────────────────────
// Blocks unauthenticated requests (HTTP 401).
// Allows both full accounts AND anonymous (guest) users.
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' });
    return;
  }

  const token = header.slice(7);
  const user  = await verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = {
    id:          user.id,
    email:       user.email,
    isAnonymous: user.is_anonymous ?? false,
    isGuest:     user.is_anonymous ?? false,
  };

  next();
}

// ── optionalAuth ──────────────────────────────────────────────
// Attaches user if a valid token is present, but does NOT block.
// Use for public endpoints that behave differently for logged-in users.
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    const user  = await verifyToken(token);
    if (user) {
      req.user = {
        id:          user.id,
        email:       user.email,
        isAnonymous: user.is_anonymous ?? false,
        isGuest:     user.is_anonymous ?? false,
      };
    }
  }
  next();
}

// ── requireFullAccount ────────────────────────────────────────
// Must come AFTER requireAuth.
// Rejects anonymous (guest) users — use on write operations that
// guests are not allowed to perform (plant, log mood, send notes).
export function requireFullAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (req.user.isAnonymous) {
    res.status(403).json({
      error:  'guest_action_blocked',
      message: 'Sign in to use this feature.',
      hint:   'Call /api/auth/upgrade to convert your guest session.',
    });
    return;
  }
  next();
}
