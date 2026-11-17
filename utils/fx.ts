// Currency conversion helpers (ticket 3.2.3).
//
// Rates come from the free Frankfurter API (https://frankfurter.app) — no key
// needed. We cache each pair once a day in the `fx_rates` table so repeated
// views don't re-hit the API. Everything here is best-effort: if a rate can't
// be fetched we return null and the UI simply skips the conversion.

import type { SupabaseClient } from "@supabase/supabase-js";

export type FxRate = {
  rate: number; // how many `quote` units per 1 `base`
  rateDate: string; // the date Frankfurter priced this rate (YYYY-MM-DD)
};

// Local calendar day as YYYY-MM-DD (the cache key for "today").
function todayKey(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Convert an amount in cents using a rate, rounded to the nearest cent.
export function convertCents(cents: number, rate: number): number {
  return Math.round(cents * rate);
}

// Get the rate to turn `base` into `quote`. Checks today's cache first, then
// falls back to the Frankfurter API and caches the result. Returns null if the
// pair can't be resolved (e.g. network error or an unsupported currency).
export async function getRate(
  supabase: SupabaseClient,
  base: string,
  quote: string,
): Promise<FxRate | null> {
  if (!base || !quote) return null;
  if (base === quote) return { rate: 1, rateDate: todayKey() };

  const asOf = todayKey();

  // 1. Already cached for today?
  const { data: cached } = await supabase
    .from("fx_rates")
    .select("rate, rate_date")
    .eq("base", base)
    .eq("quote", quote)
    .eq("as_of", asOf)
    .maybeSingle();

  if (cached) {
    return { rate: Number(cached.rate), rateDate: cached.rate_date ?? asOf };
  }

  // 2. Fetch from Frankfurter.
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const rate = json.rates?.[quote];
    if (typeof rate !== "number") return null;
    const rateDate = json.date ?? asOf;

    // 3. Cache it for the rest of the day (ignore conflicts — a concurrent
    //    viewer may have inserted the same row first).
    await supabase
      .from("fx_rates")
      .upsert(
        { base, quote, as_of: asOf, rate, rate_date: rateDate },
        { onConflict: "base,quote,as_of", ignoreDuplicates: true },
      );

    return { rate, rateDate };
  } catch {
    return null;
  }
}
