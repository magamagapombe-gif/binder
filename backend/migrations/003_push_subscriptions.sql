-- Run this in your Supabase SQL editor

create table if not exists push_subscriptions (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  subscription text not null,
  updated_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own subscription"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
