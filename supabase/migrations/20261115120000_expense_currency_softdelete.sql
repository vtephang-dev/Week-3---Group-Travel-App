-- Ticket 3.1.1 — Keep a clear record of shared spending
-- Record each cost's currency, and make removals soft (kept in history, never
-- silently lost).
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements; run once.

-- Note: expenses.currency already exists from the initial schema, so we only
-- add the soft-delete column here.

-- Soft-delete: a removed cost keeps its row with a deleted_at timestamp.
alter table public.expenses add column deleted_at timestamptz;
