# Lessons Learned — Week 4 (for my own SOP)

> This is my personal process retrospective, written to improve how I build next
> time. It is **not** the graded "What I Did / What I Learned" write-up (that one
> I write myself, in my own words). This file captures what to **keep doing** and
> what to **change**, as checklist-style notes I can fold into my standard
> operating procedure (SOP).

## What went well (keep doing)

- **Built the foundation first.** The repo, Next.js + Vercel, Supabase schema, and
  auth + RLS were in place before features — the right order. Features sit on a
  solid base.
- **Worked one ticket at a time, to its acceptance criteria.** For each feature I
  pulled the ticket, listed its acceptance criteria, built to them, then tested in
  the running app before moving on. This kept the app working at every step.
- **Verified in the real app, not just "it compiles."** Every feature was clicked
  through (often with two accounts) against each acceptance item.
- **Kept the app deployable at each step.** Built before committing; never left it
  broken.
- **Was honest about scope.** When something was partial or simplified, I said so
  and wrote it down instead of marking it "done".

## What to change next time (improve)

1. **Do the database design doc BEFORE creating tables.** This time the tables
   already existed, so I *reverse-documented* them. The design doc is meant to be a
   planning step that comes right after requirements — doing it first catches
   missing columns and relationships before I build on them.
2. **Set up automated testing / CI early (the skipped Foundation ticket).** Because
   the test setup (F.4) was never done, *every* feature ticket's "automated tests"
   deliverable had to be deferred. Standing up a test runner + CI early would have
   let me check off that deliverable each time instead of carrying it as debt.
3. **Move backlog tickets as I work.** Tickets should flow Backlog → Development →
   Testing → Done as I go, so the board reflects reality — not all moved at the end.
4. **Write ADRs when I make the decision, not in a batch at the end.** I ended up
   writing several ADRs (invites model, concurrency, the decided trigger) after the
   fact. Writing each when I decide keeps the reasoning fresh and the board honest.
5. **Decide deferrals out loud, early.** Some items (currency conversion, realtime
   updates, item-by-item splits) were always going to be out of scope for the time
   box. Naming them as deferred at the start would have set expectations sooner.

## Practical gotchas I hit (worth remembering)

- **The app and the database are two separate halves.** Code changes don't change
  the database — new columns/tables/rules only exist after I run the SQL in
  Supabase. So I always ran the migration **before** testing the code that used it.
- **The Supabase SQL Editor's parser is strict.** It rejected `ADD COLUMN IF NOT
  EXISTS` and `DO $$ ... $$` blocks, but accepted plain `ALTER`/`CREATE` statements,
  `DROP POLICY IF EXISTS`, and `CREATE FUNCTION ... $$`. I kept migrations to plain
  statements.
- **Running a query in Supabase is permanent.** Clearing the editor or pasting new
  SQL doesn't undo a change that already ran — only another SQL command does.
- **Money as whole cents + a currency code.** Storing money as integer cents (not
  decimals) avoids floating-point rounding errors.
- **Save every DB change as a named migration file.** `supabase/migrations/` is the
  written history, and the file name should say what it does.

## How this helps in team work

- The ticket-by-ticket, acceptance-criteria-first habit is how a team keeps a shared
  definition of "done" and avoids half-finished features.
- Honest status (Testing vs Done, named deferrals, ADRs for decisions) is what lets
  teammates trust the board and understand *why* things were built the way they were.
- Keeping the app deployable at every step is what makes continuous delivery and
  code review possible on a team.
