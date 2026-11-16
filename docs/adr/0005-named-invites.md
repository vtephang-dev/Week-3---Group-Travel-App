# ADR-0005: Use named, expiring invitations plus a shareable join link

## Date and status
November 15, 2026. Accepted.

## Context
An organizer needs to invite people to a trip and see who has and hasn't joined,
and be able to cancel an invitation that hasn't been used. The app started with a
single shareable link (an invite code on the trip) that anyone could use.

## Options
- Shareable link only (the invite code already on the trip):
  - Good: Very simple; one link to share with the whole group.
  - Bad: Can't show who was invited but hasn't joined, and can't cancel one
    person's invitation.
- Named invitations in their own table (one row per invited email):
  - Good: The organizer can see who's still pending, cancel an invitation, and
    invitations can expire.
  - Bad: More to build, and it has to be kept separate from the join flow.

## Decision
Use both. Keep the shareable join link for quick invites, and add an `invites`
table for named, per-person invitations (email, token, a 14-day expiry, and a
cancel action). "Who hasn't joined yet" is worked out by comparing invited emails
to the emails of people already in the trip.

## Consequences
The organizer can invite by email, see a "waiting to join" list, and cancel an
unused invitation; invitations expire after 14 days. What gets harder: there are
now two ways in (the link and named invites), and enforcing a specific cancelled
link at join time is part of a later join ticket, so for now cancelling removes
the tracked invitation while the shared link stays active. Row-Level Security
keeps invitations visible to trip members only.
