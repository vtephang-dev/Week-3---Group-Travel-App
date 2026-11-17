"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Chip from "@mui/material/Chip";
import { computeItemizedShares, type SplitLine } from "@/utils/split";

type ItemLine = { label: string; amount: string; userIds: string[] };

export type Member = { user_id: string; name: string };

export type RecordedPayment = { from_name: string; to_name: string; amount_cents: number };

export type Expense = {
  id: string;
  description: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  payer_name: string;
  shared_with: string[]; // names
  split_mode: string;
  breakdown: { name: string; share_cents: number }[];
};

export type RemovedExpense = {
  id: string;
  description: string;
  amount_cents: number;
  currency: string;
  payer_name: string;
  removed_at: string;
};

export type Balance = { user_id: string; name: string; net_cents: number };
export type Settlement = { from: string; to: string; amount_cents: number };

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function amountWithCurrency(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

function addedOn(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ExpensesSection({
  tripId,
  expenses,
  members,
  currentUserId,
  balances,
  settlements,
  recordedPayments,
  allSettled,
  tripCurrency,
  removedExpenses,
}: {
  tripId: string;
  expenses: Expense[];
  members: Member[];
  currentUserId: string;
  balances: Balance[];
  settlements: Settlement[];
  recordedPayments: RecordedPayment[];
  allSettled: boolean;
  tripCurrency: string;
  removedExpenses: RemovedExpense[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payTo, setPayTo] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [openBreakdown, setOpenBreakdown] = useState<string | null>(null);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = parseFloat(payAmount);
    if (isNaN(dollars) || dollars <= 0) return setError("Enter a valid payment amount.");
    if (!payTo) return setError("Choose who you paid.");
    const supabase = createClient();
    const { error } = await supabase.from("settlements").insert({
      trip_id: tripId,
      from_user: currentUserId,
      to_user: payTo,
      amount_cents: Math.round(dollars * 100),
      currency: tripCurrency,
    });
    if (error) return setError(error.message);
    setPayTo("");
    setPayAmount("");
    router.refresh();
  }
  // Who shares this expense — default everyone.
  const [shared, setShared] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id)),
  );
  const [splitMode, setSplitMode] = useState<"even" | "custom" | "itemized">("even");
  // Custom per-person amounts (dollar strings), keyed by user id.
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  // Itemized split: line items + tax/service/tip.
  const [itemLines, setItemLines] = useState<ItemLine[]>([
    { label: "", amount: "", userIds: [] },
  ]);
  const [taxStr, setTaxStr] = useState("");
  const [serviceStr, setServiceStr] = useState("");
  const [tipStr, setTipStr] = useState("");

  const toCents = (s: string) => {
    const v = parseFloat(s);
    return isNaN(v) ? 0 : Math.round(v * 100);
  };

  // Live preview of the itemized split (also used on save).
  const itemizedLines: SplitLine[] = itemLines
    .filter((l) => toCents(l.amount) > 0 && l.userIds.length > 0)
    .map((l) => ({ amount_cents: toCents(l.amount), user_ids: l.userIds }));
  const itemizedResult = computeItemizedShares(
    itemizedLines,
    toCents(taxStr),
    toCents(serviceStr),
    toCents(tipStr),
  );

  function updateLine(i: number, patch: Partial<ItemLine>) {
    setItemLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function toggleLineUser(i: number, uid: string) {
    setItemLines((prev) =>
      prev.map((l, idx) => {
        if (idx !== i) return l;
        const has = l.userIds.includes(uid);
        return { ...l, userIds: has ? l.userIds.filter((x) => x !== uid) : [...l.userIds, uid] };
      }),
    );
  }
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const customSumCents = members.reduce((sum, m) => {
    const v = parseFloat(customAmounts[m.user_id] ?? "");
    return sum + (isNaN(v) ? 0 : Math.round(v * 100));
  }, 0);
  const targetCents = (() => {
    const d = parseFloat(amount);
    return isNaN(d) ? 0 : Math.round(d * 100);
  })();

  function toggle(uid: string) {
    setShared((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function removeExpense(id: string) {
    // Soft-delete: keep the row, mark when it was removed (never silently lost).
    const supabase = createClient();
    await supabase.from("expenses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (splitMode === "itemized") {
      if (itemizedLines.length === 0) {
        return setError("Add at least one item with an amount and at least one person.");
      }
      setLoading(true);
      const supabase = createClient();
      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .insert({
          trip_id: tripId,
          description,
          amount_cents: itemizedResult.total_cents,
          currency: tripCurrency,
          split_mode: "itemized",
          subtotal_cents: itemizedResult.subtotal_cents,
          tax_cents: toCents(taxStr),
          service_cents: toCents(serviceStr),
          tip_cents: toCents(tipStr),
        })
        .select("id")
        .single();
      if (expErr || !exp) {
        setLoading(false);
        return setError(expErr?.message ?? "Could not save expense.");
      }

      // Save each line and who had it.
      const validLines = itemLines.filter((l) => toCents(l.amount) > 0 && l.userIds.length > 0);
      for (const line of validLines) {
        const { data: ln, error: lnErr } = await supabase
          .from("expense_lines")
          .insert({ expense_id: exp.id, trip_id: tripId, label: line.label || "Item", amount_cents: toCents(line.amount) })
          .select("id")
          .single();
        if (lnErr || !ln) {
          setLoading(false);
          return setError(lnErr?.message ?? "Could not save a line item.");
        }
        const shareRows = line.userIds.map((uid) => ({ line_id: ln.id, user_id: uid, trip_id: tripId }));
        const { error: shErr } = await supabase.from("line_shares").insert(shareRows);
        if (shErr) {
          setLoading(false);
          return setError(shErr.message);
        }
      }

      // The per-person totals go into expense_splits (what balances read).
      const splitRows = Object.entries(itemizedResult.shares)
        .filter(([, c]) => c > 0)
        .map(([uid, c]) => ({ expense_id: exp.id, user_id: uid, trip_id: tripId, share_cents: c }));
      const { error: splitErr } = await supabase.from("expense_splits").insert(splitRows);
      setLoading(false);
      if (splitErr) return setError(splitErr.message);

      setDescription("");
      setItemLines([{ label: "", amount: "", userIds: [] }]);
      setTaxStr("");
      setServiceStr("");
      setTipStr("");
      setSplitMode("even");
      router.refresh();
      return;
    }

    const dollars = parseFloat(amount);
    if (isNaN(dollars) || dollars < 0) return setError("Enter a valid amount.");
    const totalCents = Math.round(dollars * 100);

    // Build the per-person shares depending on the chosen split method.
    let rows: { user_id: string; share_cents: number }[];

    if (splitMode === "even") {
      const sharers = [...shared];
      if (sharers.length === 0) return setError("Pick at least one person to split with.");
      // Split evenly, giving leftover cents to the first few so it adds up exactly.
      const base = Math.floor(totalCents / sharers.length);
      let remainder = totalCents - base * sharers.length;
      rows = sharers.map((uid) => {
        let share = base;
        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }
        return { user_id: uid, share_cents: share };
      });
    } else {
      // Custom amounts: each person's exact share must add up to the total.
      if (customSumCents !== totalCents) {
        return setError(
          `Custom amounts add up to ${money(customSumCents)}, but the total is ${money(
            totalCents,
          )}. Please make them match.`,
        );
      }
      rows = members
        .map((m) => {
          const v = parseFloat(customAmounts[m.user_id] ?? "");
          return { user_id: m.user_id, share_cents: isNaN(v) ? 0 : Math.round(v * 100) };
        })
        .filter((r) => r.share_cents > 0);
      if (rows.length === 0) return setError("Enter at least one person's amount.");
    }

    setLoading(true);
    const supabase = createClient();

    const { data: exp, error: expErr } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        description,
        amount_cents: totalCents,
        split_mode: splitMode,
        currency: tripCurrency,
      })
      .select("id")
      .single();

    if (expErr || !exp) {
      setLoading(false);
      return setError(expErr?.message ?? "Could not save expense.");
    }

    const splitRows = rows.map((r) => ({
      expense_id: exp.id,
      user_id: r.user_id,
      trip_id: tripId,
      share_cents: r.share_cents,
    }));

    const { error: splitErr } = await supabase.from("expense_splits").insert(splitRows);
    setLoading(false);
    if (splitErr) return setError(splitErr.message);

    setDescription("");
    setAmount("");
    setShared(new Set(members.map((m) => m.user_id)));
    setCustomAmounts({});
    setSplitMode("even");
    router.refresh();
  }

  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Expenses
      </Typography>

      {expenses.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No expenses yet. Add one and choose who shares it.
        </Typography>
      ) : (
        <>
          <Stack spacing={1}>
            {expenses.map((e) => {
              const sum = e.breakdown.reduce((s, b) => s + b.share_cents, 0);
              const n = e.breakdown.length;
              const open = openBreakdown === e.id;
              return (
                <Box key={e.id}>
                  <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {e.description} — {amountWithCurrency(e.amount_cents, e.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {(e.shared_with.length > 0
                          ? `Paid by ${e.payer_name} · split with ${e.shared_with.join(", ")}`
                          : `Paid by ${e.payer_name}`) + ` · added ${addedOn(e.created_at)}`}
                      </Typography>
                      {n > 0 && (
                        <Button
                          size="small"
                          onClick={() => setOpenBreakdown(open ? null : e.id)}
                          sx={{ textTransform: "none", color: "text.secondary", minWidth: 0, px: 0.5 }}
                        >
                          How this was split {open ? "▲" : "▼"}
                        </Button>
                      )}
                      {open && (
                        <Box sx={{ pl: 1, mt: 0.5, borderLeft: "2px solid", borderColor: "divider" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            {e.split_mode === "custom"
                              ? "Split by the custom amount set for each person."
                              : e.split_mode === "itemized"
                                ? "Split by item — each person's items, plus their share of tax, service and tip in proportion to what they had."
                                : `Split evenly among ${n} ${n === 1 ? "person" : "people"} — any leftover cents go to the first person so it adds up exactly.`}
                          </Typography>
                          <Stack spacing={0.25}>
                            {e.breakdown.map((b, i) => (
                              <Typography key={i} variant="body2">
                                {b.name}: {amountWithCurrency(b.share_cents, e.currency)}
                              </Typography>
                            ))}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            Adds up to {amountWithCurrency(sum, e.currency)}.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Button size="small" color="error" onClick={() => removeExpense(e.id)}>
                      Delete
                    </Button>
                  </Stack>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              );
            })}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Total: {amountWithCurrency(total, tripCurrency)}
          </Typography>

          <Divider sx={{ my: 2 }} />
          {allSettled && (
            <Alert severity="success" sx={{ mb: 2 }}>
              All settled up — nobody owes anything. 🎉
            </Alert>
          )}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Balances
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {balances.map((b) => {
              const label =
                b.net_cents > 0
                  ? `is owed ${money(b.net_cents)}`
                  : b.net_cents < 0
                    ? `owes ${money(-b.net_cents)}`
                    : "is settled up";
              return (
                <Typography key={b.user_id} variant="body2">
                  {b.name}
                  {b.user_id === currentUserId ? " (you)" : ""} {label}
                </Typography>
              );
            })}
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Settle up (fewest payments)
          </Typography>
          {settlements.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Everyone&apos;s even. 🎉
            </Typography>
          ) : (
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              {settlements.map((s, i) => (
                <Typography key={i} variant="body2">
                  <strong>{s.from}</strong> pays <strong>{s.to}</strong> {money(s.amount_cents)}
                </Typography>
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Record a payment you made
          </Typography>
          <Box component="form" onSubmit={recordPayment} sx={{ mb: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                select
                label="I paid…"
                value={payTo}
                onChange={(e) => setPayTo(e.target.value)}
                size="small"
                sx={{ minWidth: 140 }}
              >
                {members
                  .filter((m) => m.user_id !== currentUserId)
                  .map((m) => (
                    <MenuItem key={m.user_id} value={m.user_id}>
                      {m.name}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                label={`Amount (${tripCurrency})`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                size="small"
                placeholder="25.00"
                inputMode="decimal"
              />
              <Button type="submit" variant="outlined">
                Record
              </Button>
            </Stack>
          </Box>

          {recordedPayments.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Payments recorded
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {recordedPayments.map((p, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">
                    {p.from_name} paid {p.to_name} {money(p.amount_cents)}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {removedExpenses.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Removed costs (kept for the record)
          </Typography>
          <Stack spacing={0.5}>
            {removedExpenses.map((e) => (
              <Stack key={e.id} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <Chip label="Removed" size="small" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {e.description} — {amountWithCurrency(e.amount_cents, e.currency)} · paid by{" "}
                  {e.payer_name} · removed {addedOn(e.removed_at)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />
      <Box component="form" onSubmit={addExpense}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Dinner at the ramen place"
          />
          {splitMode !== "itemized" && (
            <TextField
              label={`Amount (${tripCurrency})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              size="small"
              placeholder="48.50"
              inputMode="decimal"
            />
          )}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              How to split:
            </Typography>
            <RadioGroup
              row
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as "even" | "custom" | "itemized")}
            >
              <FormControlLabel value="even" control={<Radio size="small" />} label="Evenly" />
              <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom amounts" />
              <FormControlLabel value="itemized" control={<Radio size="small" />} label="By item" />
            </RadioGroup>

            {splitMode === "even" && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Split with:
                </Typography>
                <FormGroup>
                  {members.map((m) => (
                    <FormControlLabel
                      key={m.user_id}
                      control={
                        <Checkbox
                          checked={shared.has(m.user_id)}
                          onChange={() => toggle(m.user_id)}
                          size="small"
                        />
                      }
                      label={m.user_id === currentUserId ? `${m.name} (you)` : m.name}
                    />
                  ))}
                </FormGroup>
              </>
            )}
            {splitMode === "custom" && (
              <Stack spacing={1}>
                {members.map((m) => (
                  <Stack
                    key={m.user_id}
                    direction="row"
                    sx={{ alignItems: "center", gap: 1 }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {m.user_id === currentUserId ? `${m.name} (you)` : m.name}
                    </Typography>
                    <TextField
                      value={customAmounts[m.user_id] ?? ""}
                      onChange={(e) =>
                        setCustomAmounts((prev) => ({ ...prev, [m.user_id]: e.target.value }))
                      }
                      size="small"
                      placeholder="0.00"
                      inputMode="decimal"
                      sx={{ width: 110 }}
                    />
                  </Stack>
                ))}
                <Typography
                  variant="caption"
                  color={customSumCents === targetCents && targetCents > 0 ? "success.main" : "text.secondary"}
                >
                  Entered {money(customSumCents)} of {money(targetCents)}
                  {targetCents > 0 && customSumCents !== targetCents
                    ? ` · ${money(Math.abs(targetCents - customSumCents))} ${
                        customSumCents > targetCents ? "over" : "left"
                      }`
                    : ""}
                </Typography>
              </Stack>
            )}
            {splitMode === "itemized" && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Add each item and tick who had it.
                </Typography>
                {itemLines.map((line, i) => (
                  <Box
                    key={i}
                    sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                  >
                    <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                      <TextField
                        label="Item"
                        value={line.label}
                        onChange={(e) => updateLine(i, { label: e.target.value })}
                        size="small"
                        fullWidth
                        placeholder="Pizza"
                      />
                      <TextField
                        label={tripCurrency}
                        value={line.amount}
                        onChange={(e) => updateLine(i, { amount: e.target.value })}
                        size="small"
                        sx={{ width: 100 }}
                        placeholder="12.00"
                        inputMode="decimal"
                      />
                      {itemLines.length > 1 && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() =>
                            setItemLines((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          sx={{ minWidth: 0 }}
                        >
                          ✕
                        </Button>
                      )}
                    </Stack>
                    <Stack direction="row" sx={{ flexWrap: "wrap" }}>
                      {members.map((m) => (
                        <FormControlLabel
                          key={m.user_id}
                          control={
                            <Checkbox
                              size="small"
                              checked={line.userIds.includes(m.user_id)}
                              onChange={() => toggleLineUser(i, m.user_id)}
                            />
                          }
                          label={m.user_id === currentUserId ? `${m.name} (you)` : m.name}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
                <Button
                  size="small"
                  onClick={() =>
                    setItemLines((prev) => [...prev, { label: "", amount: "", userIds: [] }])
                  }
                  sx={{ alignSelf: "flex-start" }}
                >
                  + Add item
                </Button>

                <Stack direction="row" spacing={1}>
                  <TextField
                    label={`Tax (${tripCurrency})`}
                    value={taxStr}
                    onChange={(e) => setTaxStr(e.target.value)}
                    size="small"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <TextField
                    label="Service"
                    value={serviceStr}
                    onChange={(e) => setServiceStr(e.target.value)}
                    size="small"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <TextField
                    label="Tip"
                    value={tipStr}
                    onChange={(e) => setTipStr(e.target.value)}
                    size="small"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </Stack>

                <Box sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Each person pays (total {amountWithCurrency(itemizedResult.total_cents, tripCurrency)}):
                  </Typography>
                  {members.map((m) => {
                    const c = itemizedResult.shares[m.user_id] ?? 0;
                    if (c === 0) return null;
                    return (
                      <Typography key={m.user_id} variant="body2">
                        {m.user_id === currentUserId ? `${m.name} (you)` : m.name}:{" "}
                        {amountWithCurrency(c, tripCurrency)}
                      </Typography>
                    );
                  })}
                  {itemizedResult.total_cents === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Add items and tick who had them to see the split.
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Box>
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add expense"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
