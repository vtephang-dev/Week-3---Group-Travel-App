-- Ticket 2.1.3 — Talk through an idea where it lives
-- Tighten idea_comments so members can edit/delete ONLY their own comments.
--
-- Run this whole script in the Supabase SQL Editor (paste -> Run).
-- The "destructive operation" warning from the drop policy lines is expected
-- and safe to proceed.

-- Replace the old delete policy (any member could delete any comment)
-- with one scoped to the comment's author.
drop policy if exists "Delete comments" on public.idea_comments;
create policy "Delete own comments"
  on public.idea_comments
  for delete
  using (author_id = auth.uid());

-- Add an update policy so a member can edit their own comment.
-- (There was no update policy before, so edits were silently blocked by RLS.)
drop policy if exists "Update own comments" on public.idea_comments;
create policy "Update own comments"
  on public.idea_comments
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
