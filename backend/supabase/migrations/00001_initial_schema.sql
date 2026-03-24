-- ══════════════════════════════════════════════════════════════
-- Bloom — full database schema
-- Run this in the Supabase SQL Editor or as a migration.
-- ══════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── User profiles ───────────────────────────────────────────
create table if not exists user_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  garden_name    text not null default 'my garden',
  cottage_style  text not null default 'wood'     check (cottage_style in ('wood','stone','brick')),
  accent_colour  text not null default '#8BAF7A',
  hemisphere     text not null default 'north'    check (hemisphere in ('north','south')),
  is_public      boolean not null default false,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  highest_streak_unlocked integer not null default 0,
  total_tiles    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Mood entries ────────────────────────────────────────────
create table if not exists mood_entries (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  logged_at    timestamptz not null default now(),
  logged_date  date not null default current_date,
  mood_type    text not null check (mood_type in (
                 'happy','calm','sad','stressed','excited','neutral','grateful','tired'
               )),
  intensity    smallint not null check (intensity between 1 and 5),
  note         text,
  tile_type    text not null,
  weather_type text not null check (weather_type in (
                 'sunny','rain','thunder','windy','foggy','snowy','heat_shimmer','overcast'
               )),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_mood_entries_user    on mood_entries(user_id);
create index if not exists idx_mood_entries_date    on mood_entries(logged_date);
create index if not exists idx_mood_entries_user_date on mood_entries(user_id, logged_date);

-- ── Garden tiles ────────────────────────────────────────────
create table if not exists garden_tiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  mood_entry_id uuid references mood_entries(id) on delete set null,
  tile_type     text not null,
  grid_col      integer not null,
  grid_row      integer not null,
  is_decoration boolean not null default false,
  placed_at     timestamptz not null default now()
);

create index if not exists idx_garden_tiles_user on garden_tiles(user_id);

-- ── Unlocked items ──────────────────────────────────────────
create table if not exists unlocked_items (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, item_id)
);

-- ── Kindness events ─────────────────────────────────────────
create table if not exists kindness_events (
  id            uuid primary key default uuid_generate_v4(),
  sender_id     uuid references auth.users(id) on delete set null,
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  event_type    text not null check (event_type in ('water','flower','note')),
  note_text     text,
  target_tile_id uuid references garden_tiles(id) on delete set null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_kindness_recipient on kindness_events(recipient_id);

-- ── Co-garden pairs (Phase 7) ───────────────────────────────
create table if not exists co_garden_pairs (
  id          uuid primary key default uuid_generate_v4(),
  user_a      uuid not null references auth.users(id) on delete cascade,
  user_b      uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_a, user_b)
);

-- ── Pattern history ─────────────────────────────────────────
create table if not exists pattern_history (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  pattern_id   text not null,
  detected_at  timestamptz not null default now()
);

create index if not exists idx_pattern_user on pattern_history(user_id);

-- ══════════════════════════════════════════════════════════════
-- Row-Level Security
-- ══════════════════════════════════════════════════════════════

alter table user_profiles   enable row level security;
alter table mood_entries    enable row level security;
alter table garden_tiles    enable row level security;
alter table unlocked_items  enable row level security;
alter table kindness_events enable row level security;
alter table co_garden_pairs enable row level security;
alter table pattern_history enable row level security;

-- Profiles: users can read/write their own, public gardens readable by all
create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Public profiles readable"
  on user_profiles for select
  using (is_public = true);

-- Mood entries: own only
create policy "Users can CRUD own mood entries"
  on mood_entries for all
  using (auth.uid() = user_id);

-- Garden tiles: own only
create policy "Users can CRUD own garden tiles"
  on garden_tiles for all
  using (auth.uid() = user_id);

-- Public garden tiles readable
create policy "Public garden tiles readable"
  on garden_tiles for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = garden_tiles.user_id
        and user_profiles.is_public = true
    )
  );

-- Unlocked items: own only
create policy "Users can CRUD own unlocks"
  on unlocked_items for all
  using (auth.uid() = user_id);

-- Kindness events: recipient can read, anyone can insert
create policy "Recipients can read kindness"
  on kindness_events for select
  using (auth.uid() = recipient_id);

create policy "Anyone can send kindness"
  on kindness_events for insert
  with check (true);

-- Pattern history: own only
create policy "Users can CRUD own patterns"
  on pattern_history for all
  using (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- Auto-create profile on sign-up
-- ══════════════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- Realtime
-- ══════════════════════════════════════════════════════════════

alter publication supabase_realtime add table kindness_events;
