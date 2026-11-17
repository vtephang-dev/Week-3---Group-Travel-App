import { describe, it, expect } from "vitest";
import { splitEqual, allocateProportional, computeItemizedShares, type SplitLine } from "./split";

const sum = (r: Record<string, number>) => Object.values(r).reduce((s, v) => s + v, 0);

describe("splitEqual", () => {
  it("1. splits evenly when it divides exactly", () => {
    expect(splitEqual(1000, ["a", "b"])).toEqual({ a: 500, b: 500 });
  });
  it("2. gives leftover cents to the first people, summing exactly", () => {
    const r = splitEqual(1000, ["a", "b", "c"]); // 10.00 / 3
    expect(r).toEqual({ a: 334, b: 333, c: 333 });
    expect(sum(r)).toBe(1000);
  });
  it("3. one person pays the whole amount", () => {
    expect(splitEqual(777, ["a"])).toEqual({ a: 777 });
  });
  it("4. spreads a 2-cent remainder across 4 people", () => {
    const r = splitEqual(1002, ["a", "b", "c", "d"]); // 10.02 / 4
    expect(r).toEqual({ a: 251, b: 251, c: 250, d: 250 });
    expect(sum(r)).toBe(1002);
  });
  it("5. handles an amount smaller than the group size", () => {
    const r = splitEqual(2, ["a", "b", "c"]); // 2 cents among 3
    expect(sum(r)).toBe(2);
    expect(r).toEqual({ a: 1, b: 1, c: 0 });
  });
  it("6. returns nothing for an empty group", () => {
    expect(splitEqual(500, [])).toEqual({});
  });
});

describe("allocateProportional", () => {
  it("7. splits equally when weights are equal", () => {
    const r = allocateProportional(1000, { a: 10, b: 10 });
    expect(r).toEqual({ a: 500, b: 500 });
  });
  it("8. allocates in proportion to weight", () => {
    const r = allocateProportional(300, { a: 1000, b: 2000 }); // tax 3.00 over 10/20 subtotals
    expect(r).toEqual({ a: 100, b: 200 });
    expect(sum(r)).toBe(300);
  });
  it("9. gives leftover cents to the largest remainders, summing exactly", () => {
    const r = allocateProportional(100, { a: 1, b: 1, c: 1 }); // 1.00 over 3 equal
    expect(sum(r)).toBe(100);
    expect(Object.values(r).sort()).toEqual([33, 33, 34]);
  });
  it("10. returns zeros when there is nothing to allocate", () => {
    expect(allocateProportional(0, { a: 10, b: 20 })).toEqual({ a: 0, b: 0 });
  });
  it("11. returns zeros when all weights are zero", () => {
    expect(allocateProportional(500, { a: 0, b: 0 })).toEqual({ a: 0, b: 0 });
  });
});

describe("computeItemizedShares — worked example bills", () => {
  const bill = (lines: SplitLine[], tax = 0, service = 0, tip = 0) =>
    computeItemizedShares(lines, tax, service, tip);

  it("12. pizza shared + a solo beer + tax (the demo bill)", () => {
    const r = bill([
      { amount_cents: 2000, user_ids: ["a", "b"] }, // pizza 20 shared
      { amount_cents: 600, user_ids: ["b"] }, // beer 6 for b
    ], 260); // tax 2.60
    expect(r.subtotal_cents).toBe(2600);
    expect(r.total_cents).toBe(2860);
    expect(r.shares).toEqual({ a: 1100, b: 1760 });
    expect(sum(r.shares)).toBe(2860);
  });
  it("13. every item shared equally by all", () => {
    const r = bill([
      { amount_cents: 1000, user_ids: ["a", "b"] },
      { amount_cents: 500, user_ids: ["a", "b"] },
    ]);
    expect(r.shares).toEqual({ a: 750, b: 750 });
    expect(sum(r.shares)).toBe(r.total_cents);
  });
  it("14. one person had everything", () => {
    const r = bill([{ amount_cents: 1234, user_ids: ["a"] }], 100, 50, 25);
    expect(r.shares).toEqual({ a: 1234 + 175 });
    expect(sum(r.shares)).toBe(r.total_cents);
  });
  it("15. tax split proportionally with a remainder", () => {
    // subtotals a=10, b=10, c=10; tax 1.00 -> 34/33/33
    const r = bill([
      { amount_cents: 1000, user_ids: ["a"] },
      { amount_cents: 1000, user_ids: ["b"] },
      { amount_cents: 1000, user_ids: ["c"] },
    ], 100);
    expect(sum(r.shares)).toBe(3100);
    expect(Object.values(r.shares).map((v) => v - 1000).sort()).toEqual([33, 33, 34]);
  });
  it("16. service and tip included, shares add up exactly", () => {
    const r = bill([
      { amount_cents: 1500, user_ids: ["a", "b", "c"] },
      { amount_cents: 900, user_ids: ["a"] },
    ], 0, 200, 300);
    expect(sum(r.shares)).toBe(r.total_cents);
    expect(r.total_cents).toBe(1500 + 900 + 200 + 300);
  });
  it("17. an item shared by three with odd cents", () => {
    const r = bill([{ amount_cents: 1000, user_ids: ["a", "b", "c"] }]); // 10/3
    expect(sum(r.shares)).toBe(1000);
    expect(Object.values(r.shares).sort()).toEqual([333, 333, 334]);
  });
  it("18. items with no one assigned are ignored", () => {
    const r = bill([
      { amount_cents: 1000, user_ids: ["a"] },
      { amount_cents: 500, user_ids: [] }, // nobody had this
    ]);
    expect(r.subtotal_cents).toBe(1000);
    expect(r.shares).toEqual({ a: 1000 });
  });
  it("19. a large realistic restaurant bill still sums exactly", () => {
    const r = bill([
      { amount_cents: 1850, user_ids: ["a", "b"] },
      { amount_cents: 2299, user_ids: ["c"] },
      { amount_cents: 999, user_ids: ["a", "c"] },
      { amount_cents: 1450, user_ids: ["b"] },
    ], 537, 400, 500);
    expect(sum(r.shares)).toBe(r.total_cents);
    expect(r.total_cents).toBe(1850 + 2299 + 999 + 1450 + 537 + 400 + 500);
  });
  it("20. empty bill is zero", () => {
    const r = bill([]);
    expect(r.total_cents).toBe(0);
    expect(r.subtotal_cents).toBe(0);
    expect(r.shares).toEqual({});
  });
  it("21. tax with no items allocates nothing (can't attribute it)", () => {
    const r = bill([], 500);
    expect(r.total_cents).toBe(500);
    expect(sum(r.shares)).toBe(0);
  });
  it("22. property: shares always sum to the bill total across many bills", () => {
    const bills: [SplitLine[], number, number, number][] = [
      [[{ amount_cents: 333, user_ids: ["a", "b"] }], 17, 0, 0],
      [[{ amount_cents: 101, user_ids: ["a", "b", "c"] }], 0, 0, 7],
      [[{ amount_cents: 999, user_ids: ["a"] }, { amount_cents: 1, user_ids: ["b"] }], 3, 3, 3],
      [[{ amount_cents: 4500, user_ids: ["a", "b", "c", "d"] }], 585, 0, 675],
      [[{ amount_cents: 1234, user_ids: ["a", "b"] }, { amount_cents: 5678, user_ids: ["b", "c"] }], 999, 111, 222],
    ];
    for (const [lines, tax, service, tip] of bills) {
      const r = computeItemizedShares(lines, tax, service, tip);
      expect(sum(r.shares)).toBe(r.total_cents);
    }
  });
});
