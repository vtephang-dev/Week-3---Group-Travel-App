# ADR-0004: Show arrival times as the destination's local time

## Date and status
November 15, 2026. Accepted.

## Context
Ticket 5.1.1 says arrival times must be "entered and shown in the destination's
local time," and the whole group should see the same time. The app does not know
each trip's real time zone, and travelers open the app from different places. We
had to choose how to store and show an arrival time so it is not confusing.

## Options
- Option 1: Store a real time zone and convert the time for each viewer.
  - Good: Technically correct across the world; can handle daylight saving.
  - Bad: Needs a time-zone library and a way to know the destination's zone;
    more work than this homework needs.
- Option 2: Treat the typed time as the destination's local wall-clock time,
  store it pinned to UTC, and show it the same for everyone.
  - Good: Everyone sees the exact time the traveler typed; no extra library;
    simple to build.
  - Bad: The app does not know the real time zone, so it cannot convert between
    zones or adjust for daylight saving.

## Decision
Use Option 2. The time a traveler types is treated as the destination's local
time. It is stored pinned to UTC (saved as if the typed value were UTC) and shown
with `timeZone: "UTC"`, so the same clock time appears for everyone. A small
"Times are the destination's local time" label makes this clear.

## Consequences
Everyone in the group sees the same arrival time with no confusing shift into
their own time zone, and we did not add a time-zone library. The app cannot
convert between time zones or handle daylight saving, because it never learns the
destination's real zone — it trusts the typed local time. Full time-zone support
is left for a later release.
