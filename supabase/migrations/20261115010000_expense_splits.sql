-- Migration: custom expense splits + settle-up support
-- Each expense can be split among a chosen set of members, with a share each.

create table if not exists public.expense_splits (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  share_cents integer not null check (share_cents >= 0),
  primary key (expense_id, user_id)
);
alter table public.expense_splits enable row level security;
create policy "View splits" on public.expense_splits for select using (public.can_access_trip(trip_id));
create policy "Add splits" on public.expense_splits for insert with check (public.can_access_trip(trip_id));
create policy "Delete splits" on public.expense_splits for delete using (public.can_access_trip(trip_id));
