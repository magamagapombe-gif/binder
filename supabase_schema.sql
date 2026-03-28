-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  is_verified boolean default false,
  verified_at timestamptz,
  face_payload jsonb,
  created_at timestamptz default now()
);

-- PROFILES
create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  name text,
  age int check (age >= 18 and age <= 99),
  gender text check (gender in ('man', 'woman', 'non-binary')),
  interested_in text check (interested_in in ('men', 'women', 'both')),
  bio text,
  photos text[] default '{}',
  country text check (country in ('UG', 'KE', 'TZ')),
  location_lat float,
  location_lng float,
  updated_at timestamptz default now()
);

-- SWIPES
create table swipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  target_id uuid references users(id) on delete cascade,
  direction text check (direction in ('like', 'pass')),
  created_at timestamptz default now(),
  unique(user_id, target_id)
);

-- MATCHES
create table matches (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references users(id) on delete cascade,
  user2_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

-- MESSAGES
create table messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  content text,
  media_url text,
  type text default 'text' check (type in ('text', 'image', 'audio')),
  read boolean default false,
  created_at timestamptz default now()
);

-- STORIES
create table stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  media_url text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  caption text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- INDEXES
create index on profiles(country);
create index on swipes(user_id);
create index on swipes(target_id);
create index on matches(user1_id);
create index on matches(user2_id);
create index on messages(match_id, created_at);
create index on stories(user_id, expires_at);

-- ROW LEVEL SECURITY
alter table users enable row level security;
alter table profiles enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table stories enable row level security;

-- Backend uses service role key — bypass RLS. These policies are for future direct client access.
create policy "service_role_all" on users using (true) with check (true);
create policy "service_role_all" on profiles using (true) with check (true);
create policy "service_role_all" on swipes using (true) with check (true);
create policy "service_role_all" on matches using (true) with check (true);
create policy "service_role_all" on messages using (true) with check (true);
create policy "service_role_all" on stories using (true) with check (true);

-- STORAGE BUCKETS (run in Supabase Dashboard > Storage or via API)
-- Create bucket: profile-photos (public: true)
-- Create bucket: stories (public: true)

-- REALTIME (enable for messages and stories tables in Supabase Dashboard > Database > Replication)

-- ── MIGRATION: Add age preference columns to profiles ─────────────────────
alter table profiles
  add column if not exists min_age_pref int default 18,
  add column if not exists max_age_pref int default 60;

-- ── BLOCKS ───────────────────────────────────────────────────────────────────
create table if not exists blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid references users(id) on delete cascade,
  blocked_id uuid references users(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

create index if not exists on blocks(blocker_id);
create index if not exists on blocks(blocked_id);

alter table blocks enable row level security;
create policy "service_role_all" on blocks using (true) with check (true);

-- ── REPORTS ──────────────────────────────────────────────────────────────────
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references users(id) on delete cascade,
  reported_id uuid references users(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(reporter_id, reported_id)
);

alter table reports enable row level security;
create policy "service_role_all" on reports using (true) with check (true);

-- ── SUPER LIKE direction support ──────────────────────────────────────────────
alter table swipes
  drop constraint if exists swipes_direction_check;

alter table swipes
  add constraint swipes_direction_check
  check (direction in ('like', 'pass', 'super_like'));


-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION v2: Elo ranking + distance filter + last_active
-- Run this in Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Elo score for every profile (default 1000, same as chess starting Elo)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS elo_score       INT     DEFAULT 1000;

-- Max distance preference (km). NULL = country-wide (no limit).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS max_distance_km INT     DEFAULT NULL;

-- Last time the user was active (updated on profile save + any API call)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active     TIMESTAMPTZ DEFAULT NOW();

-- Index so discover query can ORDER BY elo_score efficiently
CREATE INDEX IF NOT EXISTS profiles_elo_score_idx ON profiles(elo_score DESC);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON profiles(last_active DESC);

-- Initialise existing profiles so they aren't stuck at NULL
UPDATE profiles SET elo_score = 1000 WHERE elo_score IS NULL;
UPDATE profiles SET last_active = updated_at WHERE last_active IS NULL;
