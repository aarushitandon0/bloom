// ── Bloom API Server ─────────────────────────────────────────
// Express + Supabase backend for the Bloom mood-garden app.
//
// Auth model:
//   • Unauthenticated  → public read-only endpoints only
//   • Anonymous (guest)→ requireAuth passes, requireFullAccount blocks writes
//   • Full account     → all endpoints available
//
// Start: npm run dev

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes     from './routes/auth.js';
import gardenRoutes   from './routes/garden.js';
import moodRoutes     from './routes/mood.js';
import kindnessRoutes from './routes/kindness.js';
import profileRoutes  from './routes/profile.js';
import coGardenRoutes from './routes/coGarden.js';

const app  = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '128kb' }));

// ── Global rate limit ────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check (no auth) ───────────────────────────────────
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

// ── 404 catch-all ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌸 Bloom API listening on http://localhost:${PORT}`);
  console.log(`   env: ${process.env.NODE_ENV ?? 'development'}`);
});
