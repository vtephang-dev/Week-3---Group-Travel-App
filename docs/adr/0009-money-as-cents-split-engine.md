# ADR-0009: Keep money as whole cents and split it with a largest-remainder engine

## Date and status
November 17, 2026. Accepted.

## Context
The whole "handle the money fairly" epic depends on splits that are exactly
right. If three people split a $10.00 bill, their shares have to add back up to
exactly $10.00 — not $9.99 or $10.01. Computers store decimal numbers like 0.1
imprecisely, so doing money math in dollars (e.g. `10 / 3`) quietly introduces
rounding errors that pile up across many expenses. We needed a representation and
a splitting method that never lose or invent a cent.

## Options
- Store money as dollars (floating-point numbers):
  - Good: Matches how people type amounts.
  - Bad: Floating-point rounding drifts; shares may not sum to the total; bugs
    are hard to spot and hard to test.
- Store money as whole cents (integers) and split with a deterministic rule:
  - Good: Integers are exact; a clear rule can guarantee shares always sum to the
    total; easy to unit-test.
  - Bad: Have to convert dollars↔cents at the edges (input and display), and
    write the splitting logic ourselves.
- Use a money/decimal library:
  - Good: Handles precision for us.
  - Bad: Extra dependency and API to learn for what integer cents already solve.

## Decision
Store and compute all money as **whole cents (integers)**. Convert to/from
dollars only at the edges — when reading what a person typed and when showing an
amount. Put the splitting logic in one pure, UI-free module (`utils/split.ts`)
with two building blocks:
- **`splitEqual`** — split an amount equally and hand the leftover cents to the
  first few people, so the parts sum exactly.
- **`allocateProportional`** — share an amount (e.g. tax, service, tip) in
  proportion to weights using the **largest-remainder method**: give everyone
  their floored share, then hand the remaining cents to whoever was rounded down
  the most. This guarantees the parts sum exactly to the total.

Itemized splits combine these: each person pays for their own items, plus a
proportional slice of tax/service/tip. Foreign-currency expenses (ADR-0008)
convert to trip-currency cents first, then split the same way.

## Consequences
- Splits always add up to the exact total, to the cent — even/custom/itemized,
  and after a currency conversion.
- The money math lives in one small pure module, so it can be unit-tested hard
  (see ADR-0010 and the money test set) without touching the UI or database.
- What's harder: we must carefully convert dollars↔cents at every input and
  display, and remember to round to cents (not dollars) everywhere.
- "Fair" here means the cents always reconcile; it does not try to be clever
  about *who* absorbs a leftover cent beyond "the first few" / "largest
  remainder" — a deliberately simple, predictable rule.
