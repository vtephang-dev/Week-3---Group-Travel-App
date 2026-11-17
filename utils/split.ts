// Item-by-item split engine (ticket 3.2.1).
// Pure functions, money in whole cents, shares guaranteed to sum exactly to the
// bill total. Kept separate from the UI so it can be unit-tested (the "money
// test set", ticket F.4, when CI is set up).

export type SplitLine = {
  amount_cents: number;
  user_ids: string[]; // the people who had this item (equal weight each)
};

// Split one amount equally among people, giving leftover cents to the first few
// so it adds up exactly.
export function splitEqual(amount_cents: number, user_ids: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const n = user_ids.length;
  if (n === 0) return out;
  const base = Math.floor(amount_cents / n);
  let remainder = amount_cents - base * n;
  for (const id of user_ids) {
    out[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return out;
}

// Allocate `total_cents` across people in proportion to their weights, using the
// largest-remainder method so the parts sum exactly to total_cents.
export function allocateProportional(
  total_cents: number,
  weights: Record<string, number>,
): Record<string, number> {
  const ids = Object.keys(weights);
  const out: Record<string, number> = {};
  for (const id of ids) out[id] = 0;
  const weightSum = ids.reduce((s, id) => s + weights[id], 0);
  if (total_cents <= 0 || weightSum <= 0) return out;

  const parts = ids.map((id) => {
    const exact = (total_cents * weights[id]) / weightSum;
    const floor = Math.floor(exact);
    return { id, floor, frac: exact - floor };
  });
  for (const p of parts) out[p.id] = p.floor;
  let leftover = total_cents - parts.reduce((s, p) => s + p.floor, 0);
  parts.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < parts.length && leftover > 0; i++, leftover--) {
    out[parts[i].id] += 1;
  }
  return out;
}

// Each person's total share = their items + their proportional part of
// tax/service/tip. Guaranteed to sum to (subtotal + tax + service + tip).
export function computeItemizedShares(
  lines: SplitLine[],
  tax_cents: number,
  service_cents: number,
  tip_cents: number,
): { shares: Record<string, number>; subtotal_cents: number; total_cents: number } {
  const subtotal: Record<string, number> = {};
  const add = (id: string, cents: number) => {
    subtotal[id] = (subtotal[id] ?? 0) + cents;
  };

  let subtotal_cents = 0;
  for (const line of lines) {
    if (line.user_ids.length === 0) continue;
    subtotal_cents += line.amount_cents;
    const per = splitEqual(line.amount_cents, line.user_ids);
    for (const id of line.user_ids) add(id, per[id]);
  }

  // Tax + service + tip shared in proportion to each person's item subtotal.
  const extras = tax_cents + service_cents + tip_cents;
  const extraShares = allocateProportional(extras, subtotal);

  const shares: Record<string, number> = {};
  for (const id of Object.keys(subtotal)) {
    shares[id] = subtotal[id] + (extraShares[id] ?? 0);
  }

  return { shares, subtotal_cents, total_cents: subtotal_cents + extras };
}
