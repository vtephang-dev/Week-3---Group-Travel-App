-- Ticket 1.1.1 — Bring the whole group into one shared trip
-- Adds: trips.main_currency, and a named "invites" table (per-person invitations
-- that can expire and be revoked).
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- NOTE: the SQL Editor's parser rejects "ADD COLUMN IF NOT EXISTS" and "DO $$"
-- blocks, so this script uses plain statements. Run it ONCE (it is not written
-- to be re-run; re-running will error that things already exist, which is
-- harmless).
-- The "destructive operation" warning from the drop policy lines is expected
-- and safe to proceed.

-- =========================================================
-- Trip main currency (criterion: create a trip with a main currency)
-- =========================================================
alter table public.trips
  add column main_currency text not null default 'USD';

-- =========================================================
-- INVITES — named invitations to a trip
-- NFR-SEC-03: invitations expire and can be revoked.
-- =========================================================
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  email text not null,
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  invited_by uuid not null default auth.uid() references auth.users (id),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- One live invitation per email per trip.
create unique index invites_trip_email_unique
  on public.invites (trip_id, lower(email));

alter table public.invites enable row level security;

-- Members of a trip can see its invitations.
drop policy if exists "View trip invites" on public.invites;
create policy "View trip invites"
  on public.invites for select
  using (public.can_access_trip(trip_id));

-- A member of a trip can invite someone to it.
drop policy if exists "Create trip invites" on public.invites;
create policy "Create trip invites"
  on public.invites for insert
  with check (public.can_access_trip(trip_id) and invited_by = auth.uid());

-- The organizer (trip owner) or the person who sent it can cancel it.
drop policy if exists "Cancel trip invites" on public.invites;
create policy "Cancel trip invites"
  on public.invites for delete
  using (
    invited_by = auth.uid()
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );
