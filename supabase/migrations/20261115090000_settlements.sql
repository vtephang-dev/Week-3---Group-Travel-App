-- Ticket 3.2.5 — Know where everyone stands (record a payment)
-- Records payments members make to each other to settle up. Balances =
-- total paid - total owed + net of recorded payments.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements only; run once.

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  from_user uuid not null references auth.users (id),
  to_user uuid not null references auth.users (id),
  amount_cents integer not null check (amount_cents > 0),
  currency text,
  paid_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.settlements enable row level security;

create policy "View settlements"
  on public.settlements for select
  using (public.can_access_trip(trip_id));

create policy "Add settlements"
  on public.settlements for insert
  with check (public.can_access_trip(trip_id) and from_user = auth.uid());

create policy "Delete own settlements"
  on public.settlements for delete
  using (created_by = auth.uid());
