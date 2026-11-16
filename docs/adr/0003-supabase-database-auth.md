# ADR-0003: Use Supabase for the database and authentication

## Date and status
November 12, 2026. Accepted.

## Context
I needed to store the app's data and handle sign-up and login, and make sure each
person can only see the data they are allowed to. I did not want to build or run
my own database and login system from scratch.

## Options
- Supabase:
  - Good: Free, gives me a PostgreSQL database, built-in login, and security
    rules (Row-Level Security) so each person only sees their own data.
  - Bad: The app is tied to Supabase, and free projects pause after inactivity.
- Firebase:
  - Good: Also free to start with built-in login.
  - Bad: Uses a NoSQL database, which is less familiar than SQL tables.
- Build my own database and login:
  - Good: Full control.
  - Bad: Much more work and easier to get security wrong.

## Decision
I chose Supabase for my database and user login, because it gives me a SQL
database, login, and security rules in one free service, so I don't have to build
them myself.

## Consequences
I get a free database, built-in login, and RLS rules that keep each person's data
private. The trade-offs are that the app depends on Supabase, and free projects
pause after inactivity.
