# Group Travel App — Handoff Report (continue the Week 4 homework)

**For the next agent:** Read this whole file first. The user is a **beginner**, first-time
app builder, in an AI Development Residency (Premium → **Group Travel App**). Work in
**short bullets, one feature at a time**, act as a **guardrail**, give honest time
estimates, and **never mark something done that isn't**. The user values honesty; the
teacher checks. Original due date was **Nov 16, 2026** — it is now past; the user chose to
"do it RIGHT, even if late."

---

## 0. How the user likes to work
- One ticket at a time: pull the ticket's acceptance criteria from Notion → build to them →
  test together in the running app → report honestly → commit → move to the next.
- Explain simply. Use the browser preview to verify every UI change with the test accounts.
- When something is partial or simplified, say so plainly and note it.

## 1. Stack & key links
- **Next.js 16** (App Router, TS) + **Material UI v7** · **Supabase** (Postgres + Auth) ·
  **Vercel** (auto-deploys on push to `main`) · **GitHub**.
- **Local repo:** `C:\Users\osogr\source\repos\Week-3---Group-Travel-App`
- **GitHub:** https://github.com/vtephang-dev/Week-3---Group-Travel-App (public)
- **Live app:** https://week-3-group-travel-app.vercel.app/
- **Supabase ref:** `beejyecvrrwuzimmebgb`
- **Backlog (Notion):** https://app.notion.com/p/Backlog-Kanban-Board-da2328a63762835a8c1801a377127e7d
  (data source `collection://192328a6-3762-83ce-b88c-87d1b7fd2412`; query it to read tickets/acceptance criteria)
- **Test accounts** (email confirmation OFF): `traveler.demo2026@gmail.com` / `traveltest123`
  and `livetest.demo2026@gmail.com` / `traveltest123`
- **Submission goes to:** `mdenner@techfleet.org`

## 2. Environment & gotchas (READ before coding)
- **PowerShell PATH refresh first:**
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
- `npm run build` to type-check. `npm test` runs the money test set (Vitest). `npm run lint`.
- **Dev server:** `preview_start {name:"dev"}` (port 3000) or `npm run dev`. Use the browser
  preview tools + test accounts to verify. Log in each new browser session.
- **Migrations are run BY HAND** by the user in the Supabase **SQL Editor** (copy SQL → paste →
  Run). Always save each as a file in `supabase/migrations/`. **Run the SQL before testing the
  code that uses it.** The SQL Editor's parser **rejects** `ADD COLUMN IF NOT EXISTS` and
  `DO $$` blocks, but **accepts** plain `ALTER`/`CREATE`, `DROP POLICY IF EXISTS`,
  `CREATE FUNCTION ... $$`, and triggers. Keep migrations to plain statements.
- RLS pattern: `SECURITY DEFINER` function `can_access_trip(tid)` (owner or member); every
  trip-child table's policies call it.
- Password reset needs Supabase **Auth → URL Configuration → Redirect URLs** to include
  `http://localhost:3000/reset-password` and `https://week-3-group-travel-app.vercel.app/reset-password`.

## 3. Git / deploy state (as of this handoff)
- **`main` is deployed** to Vercel and has: the original MVP + **two merged batches** (PR #1, PR #2):
  tickets 2.1.3, 1.1.1, 5.1.1, 1.2.1, 2.1.2, 2.1.4, 6.2.1, 3.2.5, 3.2.2, 2.1.1, 5.1.2,
  3.1.1 (slice), 6.1.3, 1.1.2, 1.2.2, 3.2.4 (slice), 6.1.2, **3.2.1 (item-by-item split)** — all live.
- **PR #3 (`ci-and-tests`) is OPEN with green CI and NOT yet merged** → it adds **F.4**
  (Vitest + 22-bill money test set + GitHub Actions CI). **The user needs to merge PR #3 on
  GitHub** (an automated merge was blocked by the safety classifier). After merge, Vercel redeploys.
- Deploy flow: new work on a fresh branch from `main` → PR → merge (Vercel auto-publishes).

## 4. What is BUILT & VERIFIED (all live except F.4 pending PR #3)
Auth (signup/login/logout/protected) · dashboard (create trip w/ **dates + main currency**) ·
trip page sections: Members (+ invite by email with expiry/cancel, **join link**, **remove member**,
privacy note, "Trip at a glance" summary strip) · **Itinerary** (time/place/cost, edit, who-added,
optimistic-concurrency version check, **opt in/out of items**) · **Ideas** (author+when, edit own,
**comments**, optional link+cost, **Decided view + move-to-plan**, organizer-only decide trigger) ·
**Expenses** (even / **custom** / **by-item** splits with tax/service/tip, **"How this was split"
breakdown**, currency per expense, soft-delete history, **record a payment**, balances + settle-up,
"all settled up") · **Arrivals** (edit, flight #, destination-local time, grouped by place +
who-hasn't) · **Join flow** (preview + single-confirm + return-after-login + invalid message) ·
**Password recovery** (forgot/reset pages — user verified the email round-trip end-to-end).
Split engine: `utils/split.ts` (pure, exact-to-cent) with `utils/split.test.ts` (22 bills).

## 5. Database (all tables RLS ON) — see docs/database-design.md + docs/database-diagram.md
profiles · trips · trip_members · invites · itinerary_items · item_optins · ideas · idea_comments ·
arrivals · expenses (+subtotal/tax/service/tip, split_mode, currency, deleted_at) · expense_splits ·
expense_lines · line_shares · settlements. Functions: can_access_trip, handle_new_user,
add_owner_as_member, join_trip_by_code, preview_trip_by_code, enforce_decided_by_organizer (trigger).

## 6. Docs done
7 ADRs in `docs/adr` (0001 Next.js+MUI, 0002 Vercel, 0003 Supabase, 0004 arrival local-time,
0005 named invites, 0006 optimistic concurrency, 0007 decided trigger) — all on the official
template (Options section). `docs/database-design.md`, `docs/database-diagram.md` (Mermaid),
`docs/lessons-learned.md`, `CLAUDE.md`.

## 7. THE GAP — what's left
- **Merge PR #3** (F.4) — user action on GitHub.
- **3.2.3 — Currency conversion** (NOT built): show money in each person's **home currency** via
  the **Frankfurter** API (free, no key), rate **locked per expense** + cached daily; table
  `fx_rates` + `expenses.fx_rate_to_trip/date`; home-currency setting per user. This also finishes
  3.2.5 #2. ~45–60 min. Status on board: Development.
- **4.1.2 — Keep/dismiss suggestions** (minor, partly met): criteria #1 & #4 already satisfied
  (ideas separate from plan; decided-view gates the plan). Only keep/dismiss/restore (#2,#3) is
  unbuilt (~25 min) and is somewhat moot without AI suggestions (4.1.1 deferred).
- **Deferred / out of scope:** 3.2.6 receipt AI, 4.1.1 discover AI (Epic 4 AI). Realtime live
  updates, PWA/offline, tabs-navigation refactor, tightening expense edit/delete to payer/organizer
  (see the user's memory notes).
- **Automated UI tests**: F.4 covers the **money logic**; per-ticket UI/e2e tests are still absent.

## 8. Board (Notion) — honest reconciliation
Move these if not already: **1.1.2 → Testing**, **5.1.1 → Testing**, **6.1.1 → Testing** (auth works),
**6.1.2 → Done** (user verified), **1.2.2 / 3.2.4 / 3.2.1 → Testing**, **F.4 → Done** (after PR #3
merges), **F.5 → Done** (split engine built+tested). Everything in **Testing** has **UI automated
tests deferred** — that's the honest spot, not Done. Two **blank cards in Development** and **2.1.5
(merged into 2.1.4)** need cleanup. `3.2.3` stays Development; `3.2.6/4.1.1/4.1.2` stay Backlog.

## 9. Final submission (the user does these; NO AI on the writing)
1. Merge **PR #3**. 2. In `Week 4 Coding Challenge/SUBMISSION.md`, write **"What I Did"** and
**"What I Learned"** (≥2 paragraphs each, own words — teacher checks). Links are already filled.
3. Move board tickets honestly (section 8). 4. Open the **live app** in a private window, sign up as
a new person to confirm. 5. **Email `mdenner@techfleet.org`** with the GitHub repo link, live Vercel
link, and database-diagram link.

## 10. Honesty guardrails (do not skip)
Don't mark tickets Done that aren't. Don't write the "What I Did/Learned" sections. Flag every
deferral/simplification plainly. Keep the app in a working, deployed state at each step.
