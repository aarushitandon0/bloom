// ── Rate limiter middleware ───────────────────────────────────

import rateLimit from 'express-rate-limit';

/** General API rate limit: 120 req / minute */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' },
});

/** Stricter limit for auth endpoints: 10 req / minute */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again in a minute.' },
});

/** Kindness send limit: 30 acts / minute */
export const kindnessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Slow down — spread kindness at a gentler pace 🌸' },
});
