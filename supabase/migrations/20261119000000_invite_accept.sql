-- ADR-0012 — Let invited people accept from their dashboard
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run). Plain
-- statements; run once.
--
-- Adds: (1) an invitee can read their OWN pending invite, (2) an invitee can
-- read the trip they were invited to, and (3) accept_invite() which joins them
-- to the trip.

-- 1. An invited person can see their own pending invites (matched by email).
drop policy if exists "Invitee can see own invite" on public.invites;
create policy "Invitee can see own invite"
  on public.invites for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 2. An invited person can read the trip they were invited to, so the dashboard
--    can show its name before they accept.
drop policy if exists "Invitee can see invited trip" on public.trips;
create policy "Invitee can see invited trip"
  on public.trips for select
  to authenticated
  using (
    exists (
      select 1 from public.invites i
      where i.trip_id = trips.id
        and lower(i.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 3. Accept an invite: checks it's the caller's invite and not expired, adds
--    them to the trip, and clears the invite. SECURITY DEFINER so it can write
--    trip_members for a trip the caller isn't a member of yet.
create or replace function public.accept_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
  v_email text;
begin
  select trip_id, email into v_trip, v_email
  from public.invites
  where id = p_invite_id and expires_at > now();

  if v_trip is null then
    raise exception 'This invitation was not found or has expired.';
  end if;

  if lower(v_email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'This invitation is for a different email address.';
  end if;

  insert into public.trip_members (trip_id, user_id)
  values (v_trip, auth.uid())
  on conflict (trip_id, user_id) do nothing;

  delete from public.invites where id = p_invite_id;

  return v_trip;
end;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;
