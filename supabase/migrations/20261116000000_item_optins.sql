-- Ticket 1.2.2 — Choose which parts of the trip are for them
-- Records who has opted in to each itinerary item, so an item's cost can later
-- be shared only among them.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements; run once.

create table public.item_optins (
  item_id uuid not null references public.itinerary_items (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

alter table public.item_optins enable row level security;

create policy "View optins"
  on public.item_optins for select
  using (public.can_access_trip(trip_id));

create policy "Opt myself in"
  on public.item_optins for insert
  with check (public.can_access_trip(trip_id) and user_id = auth.uid());

create policy "Opt myself out"
  on public.item_optins for delete
  using (user_id = auth.uid());
