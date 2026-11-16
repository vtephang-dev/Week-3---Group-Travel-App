-- Ticket 5.1.1 — Let the group know when and where they're arriving
-- Adds an optional flight / train number to arrivals.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- Run it ONCE (plain statement; re-running errors harmlessly that the column
-- already exists).

alter table public.arrivals
  add column flight_number text;
