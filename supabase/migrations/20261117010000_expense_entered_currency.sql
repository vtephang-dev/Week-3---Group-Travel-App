-- Ticket 3.2.3 (follow-on) — Enter an expense in a different currency
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements only; run once.
--
-- Lets a payer record what they actually paid in a foreign currency (e.g. a
-- ¥15,000 dinner receipt) on a trip that settles in another currency (e.g. USD).
-- We keep converting to the trip currency for all splitting/balances — those
-- columns (amount_cents, currency) are unchanged — and additionally remember the
-- original amount and the exchange rate we locked in at the time, so the number
-- is explainable later even if rates move.

-- What the payer typed, in the currency they paid in.
alter table public.expenses add column entered_amount_cents bigint;

-- The currency they paid in (e.g. 'JPY'). Null/equal means it matched the trip.
alter table public.expenses add column entered_currency text;

-- Rate locked at entry: 1 entered_currency = fx_rate_to_trip of the trip currency.
alter table public.expenses add column fx_rate_to_trip numeric;

-- The date that rate was priced (from Frankfurter), for transparency.
alter table public.expenses add column fx_rate_date date;
