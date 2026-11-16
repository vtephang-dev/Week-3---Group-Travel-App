# ADR-0006: Prevent lost edits with a version counter (optimistic concurrency)

## Date and status
November 15, 2026. Accepted.

## Context
Several people can edit the trip at the same time. For itinerary items, two
people editing the same item could silently overwrite each other's changes, which
the spec says must not happen.

## Options
- Last write wins (do nothing special):
  - Good: No extra work.
  - Bad: The second person's save silently erases the first person's change.
- Real-time locking or live collaboration:
  - Good: Strongest protection.
  - Bad: Much more complex; needs real-time infrastructure we haven't built.
- Optimistic concurrency with a version number:
  - Good: Simple; stops two edits of the same item from overwriting each other.
  - Bad: The second saver has to retry (the app tells them to reload).

## Decision
Give each itinerary item a `version` number. When saving an edit, the app only
updates the row if the version still matches the one it loaded, and bumps the
version. If someone else saved first, no row matches, and the app warns the person
and reloads the latest version instead of overwriting.

## Consequences
Two people editing different items never clash, and two people editing the same
item can't lose each other's work — the later save is rejected cleanly. What gets
harder: the person who saved second has to make their change again on the fresh
version. This covers edits of the same item; it is not full real-time
collaboration (live updates to other screens are a separate, deferred piece).
