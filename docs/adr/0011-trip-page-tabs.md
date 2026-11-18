# ADR-0011: Split the trip page into tabs instead of separate pages

## Date and status
November 18, 2026. Accepted.

## Context
The trip page had grown into one long scroll: the summary, members, itinerary,
ideas, expenses, and arrivals all stacked on one screen. On a phone that is a lot
of scrolling, and it's hard to find the part you want. We wanted to split it into
separate screens without making the app much more complicated.

## Options
- Keep one long scrolling page:
  - Good: Simplest; everything is visible at once; nothing new to build.
  - Bad: Long and overwhelming, especially on a phone; hard to find a section.
- Separate URL pages per section (e.g. `/trips/[id]/expenses`):
  - Good: Each section has its own web address you can bookmark or link to, and
    its own browser history.
  - Bad: More pages to build, and each one has to load its own data separately —
    more code and more complexity.
- Tabs on the same page (switch between sections without changing pages):
  - Good: Feels like separate screens with much less work; the page still loads
    all the data once; a half-filled form isn't lost when you switch tabs.
  - Bad: A section doesn't have its own web address, and all the data still loads
    up front.

## Decision
Use **tabs on the one trip page**. The header and the "Trip at a glance" summary
stay pinned at the top, and tabs switch between Members, Itinerary, Ideas,
Expenses, and Arrivals. All the tab panels stay loaded (just hidden), so a
half-typed form survives switching tabs, and the single data fetch the page
already did is reused.

## Consequences
Much less scrolling and it's easier to find a section, especially on a phone,
without adding separate pages or separate data loading. What's harder or left
out: you can't link straight to one tab (there's no per-section web address), and
everything still loads when the page opens rather than only the active tab. If
per-section links or loading one section at a time become important later, the
sections are already their own components, so moving to real URL pages would be a
contained change.
