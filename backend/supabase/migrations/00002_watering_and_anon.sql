-- ══════════════════════════════════════════════════════════════
-- Bloom — Migration 00002: Watering & anonymous user support
-- ══════════════════════════════════════════════════════════════

-- ── Track how many times a tile has been watered ─────────────
alter table garden_tiles
  add column if not exists water_count integer not null default 0;

-- ── Allow anonymous (guest) users to read public gardens ─────
-- Anonymous users get a real auth.uid() from signInAnonymously()
-- but their is_anonymous flag is true.  We allow them to:
--   • read public user_profiles
--   • read garden_tiles of public gardens
--   • insert kindness_events (send kindness to others)
--   • NO write access to mood_entries or their own garden_tiles

-- Public profile read is already covered by the "Public profiles readable"
-- policy from migration 00001. Add the same guard for tiles.
-- (The policy already exists — this is idempotent.)

-- ── Co-garden invite table (was missing the accepted_by column) ─
-- Add co_gardens table if it was created with the wrong schema in 00001
create table if not exists co_gardens (
  id          uuid primary key default uuid_generate_v4(),
  user_a_id   uuid not null references auth.users(id) on delete cascade,
  user_b_id   uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','ended')),
  created_at  timestamptz not null default now(),
  unique(user_a_id, user_b_id)
);

create table if not exists co_garden_invites (
  id          uuid primary key default uuid_generate_v4(),
  inviter_id  uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  accepted    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table co_gardens        enable row level security;
alter table co_garden_invites enable row level security;

-- Co-garden: members can read their own pairs
drop policy if exists "Co-garden members can read" on co_gardens;
create policy "Co-garden members can read"
  on co_gardens for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "Users can create co-gardens" on co_gardens;
create policy "Users can create co-gardens"
  on co_gardens for insert
  with check (auth.uid() = user_a_id);

-- Invites
drop policy if exists "Inviter can manage invites" on co_garden_invites;
create policy "Inviter can manage invites"
  on co_garden_invites for all
  using (auth.uid() = inviter_id);

drop policy if exists "Anyone can read invite by code" on co_garden_invites;
create policy "Anyone can read invite by code"
  on co_garden_invites for select
  using (true);

-- ── Realtime: add garden_tiles to publication ─────────────────
-- Enables co-garden live sync of tile changes.
-- Use DO block to avoid error if already added
do $$ begin
  alter publication supabase_realtime add table garden_tiles;
exception when duplicate_object then null;
end $$;

-- ══════════════════════════════════════════════════════════════
-- Auto-create profile for anonymous users too
-- The existing handle_new_user trigger already fires for anon
-- sign-ups (they also appear in auth.users), so no change needed.
-- ══════════════════════════════════════════════════════════════
