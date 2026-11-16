-- Ticket 2.1.4 — See what the group has decided at a glance
-- Enforce (server-side) that ONLY the trip organizer can change an idea's
-- "decided" status. Editing an idea's text stays allowed for its author or the
-- organizer (from ticket 2.1.2); this only guards the decided flag.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- NOTE: "create function ... $$" is accepted by the editor (your earlier
-- functions use it); only "DO $$" blocks are rejected.

create or replace function public.enforce_decided_by_organizer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.decided is distinct from old.decided then
    if not exists (
      select 1 from public.trips t
      where t.id = new.trip_id and t.owner_id = auth.uid()
    ) then
      raise exception 'Only the trip organizer can mark an idea as decided';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_idea_decided_change on public.ideas;
create trigger on_idea_decided_change
  before update on public.ideas
  for each row execute procedure public.enforce_decided_by_organizer();
