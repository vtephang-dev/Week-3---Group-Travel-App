# ADR-0007: Enforce "only the organizer decides" with a database trigger

## Date and status
November 15, 2026. Accepted.

## Context
Any member can edit an idea's text, but only the organizer should be able to mark
an idea as "decided". Hiding the Decide button for non-organizers isn't enough on
its own, because someone could still try to change the field through the API.

## Options
- Only hide the Decide button in the app (UI-only):
  - Good: Simple; no database change.
  - Bad: Not truly enforced — a determined user could change "decided" directly.
- Column-level Row-Level Security:
  - Good: Database-enforced.
  - Bad: Postgres RLS can't easily allow editing an idea's text while blocking a
    change to one specific column.
- A database trigger that checks who is changing "decided":
  - Good: Enforced in the database for everyone, however they connect; still lets
    members edit the idea's text.
  - Bad: A bit more database code (a function plus a trigger).

## Decision
Add a `before update` trigger on `ideas`. If the `decided` value is changing and
the current user is not the trip's organizer, the trigger raises an error and the
change is refused. Editing an idea's text (without touching `decided`) is
unaffected. The Decide button is also hidden for non-organizers in the app.

## Consequences
"Only the organizer decides" is enforced in the database, not just the screen, so
it holds even against direct API calls, while members can still edit their own
ideas. What gets harder: there is a little more database code to maintain, and the
rule now lives in two places (the trigger and the hidden button), which must stay
in agreement.
