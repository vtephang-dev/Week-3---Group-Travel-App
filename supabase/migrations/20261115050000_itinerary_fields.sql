-- Ticket 1.2.1 — Shape the plan together
-- Adds time, place, cost and a version counter to itinerary items, and tightens
-- delete so members remove only their own items (the organizer can remove any).
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- Plain statements only (the editor's parser rejects "ADD COLUMN IF NOT EXISTS"
-- and "DO" blocks). Run it ONCE.
-- The "destructive operation" warning from the drop policy line is expected.

-- New fields on itinerary items.
alter table public.itinerary_items add column start_time time;
alter table public.itinerary_items add column place text;
alter table public.itinerary_items add column cost_cents integer;
alter table public.itinerary_items add column currency text;

-- Version counter for optimistic concurrency (so two edits can't silently
-- overwrite each other). The app bumps this on every edit and checks it.
alter table public.itinerary_items add column version integer not null default 0;

-- Delete: a member can remove their own item; the trip owner (organizer) can
-- remove any item.
drop policy if exists "Delete itinerary" on public.itinerary_items;
create policy "Delete own itinerary or organizer"
  on public.itinerary_items for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );
