# 🌸 bloom — monorepo

Bloom is a mood-journaling app where your feelings grow into a garden.
This repository is split into two independent packages:

```
bloom/
├── frontend/   React 19 + Vite + Zustand + Tailwind + Canvas
└── backend/    Node 22 + Express + Supabase (Auth + Postgres + Realtime)
```

---

## Project structure

| Folder | Description |
|---|---|
| `frontend/` | Vite SPA — all UI, canvas rendering, Zustand stores |
| `backend/` | Express REST API — auth middleware, typed DB helpers, rate limiting |
| `backend/supabase/migrations/` | SQL migrations to run in the Supabase SQL Editor |

---

## Auth model

| Session type | How created | What they can do |
|---|---|---|
| **No session** | N/A | Sees the Auth screen only |
| **Anonymous (guest)** | "Explore as guest" → signInAnonymously() | Browse world map, view public gardens |
| **Full account** | Google OAuth | Everything — plant, log moods, send kindness, co-garden |

Guests get a real auth.uid() from Supabase.
The backend requireFullAccount middleware rejects anonymous users with:
{ "error": "guest_action_blocked" }
The frontend catches ApiError.isGuestBlocked and shows the GuestGate bottom-sheet — never a hard block.

---

## Quick start

### 1 — Supabase setup

1. Create a project at supabase.com
2. In the SQL Editor, run migrations in order:
   - backend/supabase/migrations/00001_initial_schema.sql
   - backend/supabase/migrations/00002_watering_and_anon.sql
3. Auth → Providers → Google — enable with your OAuth Client ID + Secret
4. Auth → Settings — enable "Allow anonymous sign-ins"
5. Auth → URL Configuration — add http://localhost:5173 + your production domain

### 2 — Backend

cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev   # http://localhost:4000

### 3 — Frontend

cd frontend
npm install
cp .env.local.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL=http://localhost:4000
npm run dev   # http://localhost:5173

---

## Backend API

Auth (/api/auth): guest sign-in, upgrade anon→Google, /me, sign-out
Garden (/api/garden): CRUD tiles, water tile (sprout→standard→bloom) — writes require full account
Mood (/api/mood): log entries — writes require full account
Kindness (/api/kindness): send water/flower/note — requires full account; read is open
Profile (/api/profile): update settings — writes require full account; /world is open to guests
Co-garden (/api/co-garden): invite + join via code — full account only

---

## Guest experience

Guests CAN: view world map, browse public gardens, navigate all pages
Guests CANNOT (soft GuestGate prompt, never hard block): plant tiles, log moods, send kindness, co-garden
One-tap Google sign-in upgrades the anonymous session — no data lost.
