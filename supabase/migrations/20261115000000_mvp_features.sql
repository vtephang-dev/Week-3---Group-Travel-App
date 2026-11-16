-- Migration: MVP #1 group-travel features
-- Adds: trip members, invites, itinerary, ideas + comments, arrivals, expenses.
-- Security: members of a trip share its data; non-members see nothing.

-- Allow the helper function to reference tables created later in this script.
set check_function_bodies = off;

-- =========================================================
-- Helper: can the current user access this trip?
-- SECURITY DEFINER avoids RLS recursion between trips/trip_members.
-- =========================================================
create or replace function public.can_access_trip(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trips t
    where t.id = tid and t.owner_id = auth.uid()
  ) or exists (
    select 1 from public.trip_members m
    where m.trip_id = tid and m.user_id = auth.uid()
  );
$$;

-- Invite code on each trip (for the join link)
alter table public.trips
  add column if not exists invite_code text unique
  default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- =========================================================
-- TRIP MEMBERS
-- =========================================================
create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table public.trip_members enable row level security;

create policy "See members of accessible trips"
  on public.trip_members for select using (public.can_access_trip(trip_id));
create policy "Join a trip yourself"
  on public.trip_members for insert with check (user_id = auth.uid());
create policy "Leave a trip yourself"
  on public.trip_members for delete using (user_id = auth.uid());

-- Add the owner as a member automatically when a trip is created
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_members (trip_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_trip_created on public.trips;
create trigger on_trip_created after insert on public.trips
  for each row execute procedure public.add_owner_as_member();

-- Backfill: add owners of existing trips as members
insert into public.trip_members (trip_id, user_id)
select id, owner_id from public.trips
on conflict do nothing;

-- Let trip members (not just owners) view a trip
drop policy if exists "Owners can view their trips" on public.trips;
create policy "View trips you can access"
  on public.trips for select using (public.can_access_trip(id));

-- =========================================================
-- ITINERARY ITEMS
-- =========================================================
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  details text,
  day date,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.itinerary_items enable row level security;
create policy "View itinerary" on public.itinerary_items for select using (public.can_access_trip(trip_id));
create policy "Add itinerary" on public.itinerary_items for insert with check (public.can_access_trip(trip_id));
create policy "Update itinerary" on public.itinerary_items for update using (public.can_access_trip(trip_id));
create policy "Delete itinerary" on public.itinerary_items for delete using (public.can_access_trip(trip_id));

-- =========================================================
-- IDEAS + COMMENTS
-- =========================================================
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  notes text,
  decided boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.ideas enable row level security;
create policy "View ideas" on public.ideas for select using (public.can_access_trip(trip_id));
create policy "Add ideas" on public.ideas for insert with check (public.can_access_trip(trip_id));
create policy "Update ideas" on public.ideas for update using (public.can_access_trip(trip_id));
create policy "Delete ideas" on public.ideas for delete using (public.can_access_trip(trip_id));

create table if not exists public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  body text not null,
  author_id uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.idea_comments enable row level security;
create policy "View comments" on public.idea_comments for select using (public.can_access_trip(trip_id));
create policy "Add comments" on public.idea_comments for insert with check (public.can_access_trip(trip_id));
create policy "Delete comments" on public.idea_comments for delete using (public.can_access_trip(trip_id));

-- =========================================================
-- ARRIVALS
-- =========================================================
create table if not exists public.arrivals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  arrive_at timestamptz,
  location text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.arrivals enable row level security;
create policy "View arrivals" on public.arrivals for select using (public.can_access_trip(trip_id));
create policy "Add arrivals" on public.arrivals for insert with check (public.can_access_trip(trip_id) and user_id = auth.uid());
create policy "Update own arrival" on public.arrivals for update using (user_id = auth.uid());
create policy "Delete own arrival" on public.arrivals for delete using (user_id = auth.uid());

-- =========================================================
-- EXPENSES (split evenly among trip members in the app)
-- =========================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  description text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  paid_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "View expenses" on public.expenses for select using (public.can_access_trip(trip_id));
create policy "Add expenses" on public.expenses for insert with check (public.can_access_trip(trip_id));
create policy "Update expenses" on public.expenses for update using (public.can_access_trip(trip_id));
create policy "Delete expenses" on public.expenses for delete using (public.can_access_trip(trip_id));

-- =========================================================
-- Join a trip by its invite code (runs as definer so a
-- not-yet-member can look up the trip and add themselves).
-- =========================================================
create or replace function public.join_trip_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare tid uuid;
begin
  select id into tid from public.trips where invite_code = code;
  if tid is null then
    return null;
  end if;
  insert into public.trip_members (trip_id, user_id)
  values (tid, auth.uid())
  on conflict do nothing;
  return tid;
end;
$$;

-- =========================================================
-- Make sure every existing user has a profile, and let trip
-- co-members see each other's names (for members + expenses).
-- =========================================================
insert into public.profiles (id, display_name)
select id, email from auth.users
on conflict do nothing;

drop policy if exists "View co-member profiles" on public.profiles;
create policy "View co-member profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.trip_members me
      join public.trip_members them on me.trip_id = them.trip_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );
