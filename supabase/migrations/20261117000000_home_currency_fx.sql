-- Ticket 3.2.3 — Currency conversion (show money in each person's home currency)
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements only; run once.
--
-- What it adds:
--   1. profiles.home_currency — each person's preferred display currency.
--   2. fx_rates — a shared daily cache of exchange rates so we don't hit the
--      Frankfurter API more than once per currency pair per day.

-- 1. Each person can pick the currency they'd like to see amounts in.
alter table public.profiles add column home_currency text;

-- 2. Daily rate cache. One row per (base, quote, cache day).
--    rate      = how many 'quote' you get for 1 'base'
--    as_of     = the day we cached it (so we refresh once a day)
--    rate_date = the actual date Frankfurter priced the rate (can be the last
--                business day, e.g. a Friday rate shown on the weekend)
create table public.fx_rates (
  base text not null,
  quote text not null,
  as_of date not null,
  rate numeric not null,
  rate_date date,
  primary key (base, quote, as_of)
);

alter table public.fx_rates enable row level security;

-- Rates are public reference data: any signed-in user may read them and add a
-- freshly-fetched one to the shared cache.
drop policy if exists "fx_rates readable by authenticated" on public.fx_rates;
create policy "fx_rates readable by authenticated"
  on public.fx_rates for select
  to authenticated
  using (true);

drop policy if exists "fx_rates insertable by authenticated" on public.fx_rates;
create policy "fx_rates insertable by authenticated"
  on public.fx_rates for insert
  to authenticated
  with check (true);
