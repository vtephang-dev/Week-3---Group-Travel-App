-- Ticket 6.1.3 — Join a trip with as little friction as possible
-- Let an invited person PREVIEW a trip (its name + who invited them) from an
-- invite code before joining, even though RLS otherwise hides trips from
-- non-members. SECURITY DEFINER returns only the minimal, safe info.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- Uses "create function ... $$", which the editor accepts.

create or replace function public.preview_trip_by_code(code text)
returns table (trip_id uuid, trip_name text, inviter text)
language sql
security definer
set search_path = public
stable
as $$
  select t.id,
         t.name,
         coalesce(p.display_name, 'the organizer')
  from public.trips t
  left join public.profiles p on p.id = t.owner_id
  where t.invite_code = code
  limit 1;
$$;
