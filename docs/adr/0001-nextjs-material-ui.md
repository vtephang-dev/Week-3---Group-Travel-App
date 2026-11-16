# ADR-0001: Use Next.js with Material UI

## Date and status
November 12, 2026. Accepted.

## Context
I needed to build the webpages/screens for the app with a responsive design that
works on phones and computers, without creating the design from scratch. The
challenge also required using Material UI as the design system.

## Options
- Plain React:
  - Good: It is simple to start.
  - Bad: It needs a separate place for the server code.
- Next.js:
  - Good: It holds the screens and the server code in one project, and works
    well on Vercel.
  - Bad: I have to learn which code runs in the browser and which runs on the
    server.

## Decision
I chose Next.js for the structure of the app and Material UI for the look,
because Next.js covers the screens and the server code in one project, and
Material UI gives me a responsive design without building it from scratch.

## Consequences
I can build faster. I need to learn where code runs (browser vs. server), and
Material UI's theme file needs a "use client" line at the top. Because Material
UI is used by many apps, the design can look a bit unoriginal.
