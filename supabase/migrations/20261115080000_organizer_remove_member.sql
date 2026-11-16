-- Ticket 6.2.1 — Trust that their information is safe
-- Let the trip organizer remove a member (not just members leaving themselves).
-- A removed member immediately loses access, because every table's RLS checks
-- can_access_trip(), which is false once their trip_members row is gone.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- The "destructive operation" warning from the drop policy line is expected.

drop policy if exists "Leave a trip yourself" on public.trip_members;
create policy "Leave yourself or organizer removes"
  on public.trip_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = auth.uid()
    )
  );
