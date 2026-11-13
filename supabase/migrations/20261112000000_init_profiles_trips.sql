-- Migration: initial schema for the Group Travel App
-- Creates: profiles (one per user) and trips.
-- Security: Row Level Security so each person only sees their own data.

-- =========================================================
-- PROFILES
-- One row per authenticated user, linked to Supabase Auth.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- TRIPS
-- A trip belongs to the user who created it (the owner).
-- =========================================================
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Owners can view their trips"
  on public.trips for select
  using (auth.uid() = owner_id);

create policy "Owners can create their trips"
  on public.trips for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their trips"
  on public.trips for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their trips"
  on public.trips for delete
  using (auth.uid() = owner_id);
