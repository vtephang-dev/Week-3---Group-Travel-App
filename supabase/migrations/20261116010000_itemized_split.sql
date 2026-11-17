-- Ticket 3.2.1 — Pay for exactly what they had (item-by-item split)
-- Adds line items, who had each item, and tax/service/tip on an expense.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements; run once.

-- Breakdown amounts on the expense (all in whole cents).
alter table public.expenses add column subtotal_cents integer;
alter table public.expenses add column tax_cents integer not null default 0;
alter table public.expenses add column service_cents integer not null default 0;
alter table public.expenses add column tip_cents integer not null default 0;

-- One row per item on the bill.
create table public.expense_lines (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  label text not null,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);
alter table public.expense_lines enable row level security;
create policy "View lines" on public.expense_lines for select using (public.can_access_trip(trip_id));
create policy "Add lines" on public.expense_lines for insert with check (public.can_access_trip(trip_id));
create policy "Delete lines" on public.expense_lines for delete using (public.can_access_trip(trip_id));

-- Who had each item (weight defaults to 1 = an equal share of that item).
create table public.line_shares (
  line_id uuid not null references public.expense_lines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  weight integer not null default 1,
  primary key (line_id, user_id)
);
alter table public.line_shares enable row level security;
create policy "View line shares" on public.line_shares for select using (public.can_access_trip(trip_id));
create policy "Add line shares" on public.line_shares for insert with check (public.can_access_trip(trip_id));
create policy "Delete line shares" on public.line_shares for delete using (public.can_access_trip(trip_id));
