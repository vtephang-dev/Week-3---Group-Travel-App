-- Ticket 3.2.2 — Split simply and fairly
-- Record how an expense was split (even or custom) for clarity and future
-- breakdowns (ticket 3.2.4).
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statement; run once.

alter table public.expenses
  add column split_mode text not null default 'even';
