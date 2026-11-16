# Architecture Plan — Group Travel App

A three-tier web app. Each tier has one job, and they talk to each other over
the internet.

## Tier 1 — Screens (what people see)

Built with **Next.js (App Router)** and the **Material UI** design system.

Pages (routes):
- `/` — landing page (sign up / log in)
- `/signup` — create an account
- `/login` — log in
- `/dashboard` — your trips + create a new trip
- `/trips/[id]` — one trip's home: members, itinerary, ideas, expenses, arrivals
- `/join/[code]` — join a trip from an invite link

## Tier 2 — Server code (the logic)

Runs on **Vercel** (serverless) as part of Next.js.
- **Server Components** read data from Supabase on the server and render pages.
- **Client Components** handle forms and buttons, and write data to Supabase.
- `proxy.ts` (Next.js 16's renamed middleware) keeps the login session fresh on
  every request and protects pages like `/dashboard`.
- `utils/supabase/` holds the Supabase clients (browser + server) using
  `@supabase/ssr`.

## Tier 3 — Database (where data lives)

**Supabase** (PostgreSQL). Tables:
- `profiles` — one row per user (created automatically at sign-up)
- `trips` — a trip, owned by a user, with an `invite_code`
- `trip_members` — who belongs to each trip
- `itinerary_items` — plans for a trip
- `ideas` + `idea_comments` — the group ideas board
- `arrivals` — when/where each member arrives
- `expenses` — costs, split evenly across members

**Security:** Row Level Security (RLS) is on for every table. A helper function
`can_access_trip()` lets only a trip's owner and members see that trip's data.

## Data flow (example: adding a trip)

1. You type a trip name on `/dashboard` (Tier 1).
2. The form (Tier 2, client) sends it to Supabase.
3. Supabase (Tier 3) saves a new row in `trips`, checked by RLS.
4. The page re-reads your trips (Tier 2, server) and shows the new one (Tier 1).

## Tools

| Tier | Tool |
| --- | --- |
| Screens | Next.js + Material UI |
| Hosting / server | Vercel |
| Database | Supabase (PostgreSQL) |
| Code storage | GitHub |
