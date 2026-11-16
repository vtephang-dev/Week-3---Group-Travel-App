-- Ticket 2.1.2 — Let anyone contribute, not just the organizer
-- Tighten ideas so a member can change/remove only their own idea, while the
-- organizer (trip owner) can manage any idea.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- The "destructive operation" warning from the drop policy lines is expected.

-- Edit: your own idea, or you are the trip's organizer.
drop policy if exists "Update ideas" on public.ideas;
create policy "Update own ideas or organizer"
  on public.ideas for update
  using (
    created_by = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );

-- Delete: your own idea, or you are the trip's organizer.
drop policy if exists "Delete ideas" on public.ideas;
create policy "Delete own ideas or organizer"
  on public.ideas for delete
  using (
    created_by = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );
