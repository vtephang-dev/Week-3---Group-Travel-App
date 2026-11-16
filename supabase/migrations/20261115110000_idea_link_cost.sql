-- Ticket 2.1.1 — Put everyone's ideas in one shared place
-- Add an optional link and an optional rough cost to ideas.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements; run once.

alter table public.ideas add column link text;
alter table public.ideas add column cost_cents integer;
