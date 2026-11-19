# ADR-0012: Let invited people accept from their dashboard

## Date and status
November 19, 2026. Accepted.

## Context
An organizer could invite someone by email, but the invited person had no way to
act on it: the email invite only recorded a "pending" row that trip members could
see. The invited person, logging in, saw no sign of the trip — they could only
join through the separate shareable link. So "I was invited but see nothing" was
a real gap. People fall into two cases: those who already have an account, and
those who don't yet.

## Options
- Keep link-only joining:
  - Good: Nothing to build; one link works for everyone.
  - Bad: The invited person has no in-app signal; they must be handed the link,
    and a tracked email invite does nothing for them.
- Send a real invitation email with a join link:
  - Good: Reaches people who don't have an account yet, in their inbox.
  - Bad: Needs email-sending infrastructure (an email service or Supabase Auth
    emails) — a whole piece of its own.
- Show pending invites on the invited person's dashboard with an "Accept" button:
  - Good: People who sign in see exactly what they were invited to and join in
    one click; no email service needed; fixes the gap for account holders.
  - Bad: Only helps people who already have (or create) an account with the
    invited email; needs new access rules so an invitee can see their own invite.

## Decision
Build **accept-from-dashboard**. When someone signs in, any trip they were
invited to (matched by their email) appears on their dashboard with an **Accept**
button that adds them to the trip. This needs two new read rules — an invitee can
read their own pending invite, and can read the invited trip's details — and a
`SECURITY DEFINER` `accept_invite` function that checks the invite is theirs and
not expired, then adds them as a member and clears the invite.

For people **without an account yet**, the existing **shareable join link** still
works (open it, sign up, join). **Sending the invitation email automatically is
deferred** — it needs email infrastructure — so for now the organizer shares the
link. We also add a way to **set a display name** so people aren't shown as their
email address.

## Consequences
- An invited person who signs in (or signs up) with the invited email now sees
  the trip and joins in one click — the gap is closed for account holders.
- New access rules let an invitee read their own invite and the invited trip;
  this intentionally exposes that trip's basic details to someone who was
  invited to it.
- What's deferred / harder: no automatic invitation **email** yet (the link
  covers the no-account case meanwhile); an invite is matched purely by email, so
  signing up with a different email won't surface it.
