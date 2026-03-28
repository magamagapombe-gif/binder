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
