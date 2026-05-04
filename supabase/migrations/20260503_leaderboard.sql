-- Leaderboard: public profiles + friendships
-- Run this in Supabase SQL Editor

-- Public profiles (username + avatar for leaderboard display)
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  avatar      text not null default '💪',  -- emoji avatar
  updated_at  timestamptz default now()
);

-- RLS: users can only update their own profile, anyone can read
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = user_id);

-- Friendships (bidirectional: A adds B → pending; B accepts → accepted)
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  addressee_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "friendships_select" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id);

create policy "friendships_update" on public.friendships
  for update using (auth.uid() = addressee_id and status = 'pending');

create policy "friendships_delete" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Weekly stats (public, refreshed by the weekly-report cron or client push)
-- Stores only the last 4 weeks of data, automatically pruned
create table if not exists public.weekly_stats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  sessions    int not null default 0,
  volume_kg   int not null default 0,
  created_at  timestamptz default now(),
  unique(user_id, week_start)
);

alter table public.weekly_stats enable row level security;

-- Anyone who is friends can see weekly stats
create policy "weekly_stats_select" on public.weekly_stats
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = user_id))
    )
  );

create policy "weekly_stats_upsert" on public.weekly_stats
  for all using (auth.uid() = user_id);
