# ADR-0010: Test the money logic automatically, verify the rest by hand (for now)

## Date and status
November 17, 2026. Accepted.

## Context
This is a solo student project with limited time. Automated tests catch
regressions and prove the risky parts work, but writing tests for every screen
and flow (end-to-end UI tests) is a lot of setup and upkeep. We had to decide
where automated testing earns its keep now, and be honest about what is left to
manual checking — rather than claim a coverage we don't have.

## Options
- No automated tests; check everything by hand:
  - Good: Nothing to set up.
  - Bad: The money math — the easiest place to be subtly, expensively wrong — has
    no safety net; a refactor could break a split silently.
- Full automated coverage, including end-to-end UI tests:
  - Good: Strongest safety net across the whole app.
  - Bad: Heavy to set up and maintain (a browser test harness, fixtures, test
    data) — more than this homework's time budget allows.
- Automatically test the money logic only; verify the UI by hand:
  - Good: Protects the highest-risk, most-testable part (pure split functions)
    cheaply; keeps the rest moving.
  - Bad: UI and flows aren't guarded by automated tests, so a screen could break
    without a test catching it.

## Decision
Automatically test the **money logic** and run it in CI, and **verify everything
else by hand** in the running app for now.
- `utils/split.ts` is pure and UI-free, so it's unit-tested with Vitest — the
  "money test set" of 22 bills covering even, custom, and itemized splits with
  tax/service/tip, checking shares always sum to the total (ties back to
  ADR-0009).
- GitHub Actions runs those tests on every push/PR, and Vercel builds the app, so
  a broken build or a broken split blocks a merge.
- UI features are checked by hand against each ticket's acceptance criteria in the
  deployed app with the test accounts.

## Consequences
- The riskiest, hardest-to-eyeball part (the money math) can't silently break —
  CI fails if it does.
- Keeping the split engine pure and separate (ADR-0009) is what makes this cheap;
  it's a reason to keep money logic out of components.
- What's deferred and stated honestly: there are **no per-ticket automated UI or
  end-to-end tests** yet. Those tickets sit in "Testing" on the board — built and
  manually verified, but not Done — which is the truthful status, not a hidden
  gap. Adding UI/e2e tests is a clear next step when there's time.
