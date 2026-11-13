# ADR 3: Use Supabase for the database and authentication

**Status:** Accepted
**Date:** 2026-11-12

## Context
Supabase was used to store data and handle sign-up and login. It only allows
each person to see their own data, and I did not want to run my own database.

## Decision
Supabase was used for my database and user login.

## Consequences
Gains: a free database, built-in login, and security rules (RLS) that make sure
each person can only see their own data. Trade-off: the app is tied to Supabase,
and free projects pause after inactivity.
