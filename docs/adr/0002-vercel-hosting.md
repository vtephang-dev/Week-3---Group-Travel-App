# ADR-0002: Host the app on Vercel

## Date and status
November 12, 2026. Accepted.

## Context
I needed to publish the app on the internet so real users could visit it, without
paying for hosting or managing my own server.

## Options
- Vercel:
  - Good: Free to start, made by the same team as Next.js, and it auto-deploys
    every time I push to GitHub.
  - Bad: The free plan has usage limits.
- Netlify:
  - Good: Also free and popular for front-end apps.
  - Bad: Less tightly integrated with Next.js than Vercel.
- Run my own server:
  - Good: Full control over everything.
  - Bad: Costs money and takes a lot of setup and maintenance.

## Decision
I chose Vercel to host my live app, because it is free, it works smoothly with
Next.js, and it publishes the app automatically every time I push my code.

## Consequences
I get free hosting that real users can visit, and new changes go live as soon as
I push to the main branch. The downside is that the free plan has limits, such as
usage caps, and a free Supabase project pauses after inactivity.
