# ADR-0008: Currency conversion with Frankfurter (home-currency display + foreign-currency entry)

## Date and status
November 17, 2026. Accepted.

## Context
Groups travel across currencies. Two needs came up:
1. People want to understand trip totals in money they know (a US traveller on a
   EUR trip wants a rough dollar figure).
2. Whoever pays often has a receipt in a foreign currency (a ¥15,000 dinner on a
   trip that settles in USD) and shouldn't have to convert it by hand before
   entering it.

We needed exchange rates, a way to keep them honest over time, and a way to do
all of this without breaking the existing splitting and balance maths, which
work in one trip currency.

## Options
- Pick rates by hand / type them in:
  - Good: No external dependency.
  - Bad: Tedious and error-prone; no shared source of truth.
- A paid FX API (e.g. with an API key):
  - Good: Lots of currencies, high limits.
  - Bad: Needs a key and billing; overkill for a student project.
- Frankfurter (free, no key, European Central Bank data):
  - Good: Free, no key, simple JSON; covers the major currencies we offer.
  - Bad: Only ~30 currencies; daily (not intraday) rates; the API host sends no
    CORS headers, so it can't be called straight from the browser.

For *where* to store the converted money:
- Convert only for display, keep raw foreign amounts:
  - Good: Nothing to migrate.
  - Bad: Every split/balance calc would have to convert on the fly — complex and
    easy to get wrong.
- Convert to the trip currency at entry and store that as the real amount:
  - Good: All existing split/balance code keeps working unchanged.
  - Bad: One row stores both the entered and converted amounts.

## Decision
Use **Frankfurter**, fetched **server-side** (a Next.js route handler and the
trip page), never from the browser — that sidesteps the CORS limit and keeps the
daily-cache logic in one place. Cache each currency pair once a day in an
`fx_rates` table so repeated views don't re-hit the API.

Two features build on this:
- **Home-currency display:** each person can set a home currency; trip pages show
  an approximate total and balance in it, clearly labelled with the rate and its
  date. It never changes what anyone owes.
- **Foreign-currency entry:** on an even split, the payer can enter the amount in
  the currency they paid. We convert to the trip currency at a rate **locked at
  entry time**, store that as the expense's real `amount_cents`/`currency` (so
  splitting and balances are untouched), and additionally keep the entered amount,
  currency, locked rate, and rate date so the number stays explainable later.

**Scope kept small on purpose:** foreign-currency entry is for the **even split
only** for now — the common receipt case. Custom and by-item splits still take
amounts in the trip currency, because converting each person's or each line's
amount while keeping cents adding up exactly is fiddly and deserves its own pass.

## Consequences
- Easier: travellers see familiar amounts; payers enter receipts as paid; the
  split/balance engine needed no changes.
- Honest by design: conversions are marked approximate with a date; locked rates
  mean a past expense doesn't silently change when rates move.
- Harder / next:
  - Custom and by-item splits in a foreign currency are **not** supported yet.
  - Frankfurter only covers the currencies in our picker and only daily rates.
  - If the rate fetch fails, entry falls back to asking for the trip currency,
    and the display simply shows the trip currency only.
- New DB: `profiles.home_currency`; `fx_rates` cache table; and
  `expenses.entered_amount_cents / entered_currency / fx_rate_to_trip /
  fx_rate_date`.
