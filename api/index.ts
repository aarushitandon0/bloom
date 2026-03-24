// ── Vercel serverless entry point ─────────────────────────────
// Wraps the Express app as a single serverless function.
// All /api/* and /health requests are routed here via vercel.json rewrites.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter } from '../backend/src/middleware/rateLimiter.js';
import { errorHandler } from '../backend/src/middleware/errorHandler.js';

import authRoutes     from '../backend/src/routes/auth.js';
import gardenRoutes   from '../backend/src/routes/garden.js';
import moodRoutes     from '../backend/src/routes/mood.js';
import kindnessRoutes from '../backend/src/routes/kindness.js';
import profileRoutes  from '../backend/src/routes/profile.js';
import coGardenRoutes from '../backend/src/routes/coGarden.js';

const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: true,       // Allow all origins on Vercel (same domain)
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '128kb' }));

// ── Rate limit ───────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/garden',     gardenRoutes);
app.use('/api/mood',       moodRoutes);
app.use('/api/kindness',   kindnessRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/co-garden',  coGardenRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler);

export default app;
