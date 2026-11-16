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

export type Member = { user_id: string; name: string };

export type Expense = {
  id: string;
  description: string;
  amount_cents: number;
  payer_name: string;
  shared_with: string[]; // names
};

export type Balance = { user_id: string; name: string; net_cents: number };
export type Settlement = { from: string; to: string; amount_cents: number };

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ExpensesSection({
  tripId,
  expenses,
  members,
  currentUserId,
  balances,
  settlements,
}: {
  tripId: string;
  expenses: Expense[];
  members: Member[];
  currentUserId: string;
  balances: Balance[];
  settlements: Settlement[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  // Who shares this expense — default everyone.
  const [shared, setShared] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id)),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(uid: string) {
    setShared((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function removeExpense(id: string) {
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    router.refresh();
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = parseFloat(amount);
    if (isNaN(dollars) || dollars < 0) return setError("Enter a valid amount.");
    const sharers = [...shared];
    if (sharers.length === 0) return setError("Pick at least one person to split with.");

    setLoading(true);
    const supabase = createClient();
    const totalCents = Math.round(dollars * 100);

    // Insert the expense and get its id.
    const { data: exp, error: expErr } = await supabase
      .from("expenses")
      .insert({ trip_id: tripId, description, amount_cents: totalCents })
      .select("id")
      .single();

    if (expErr || !exp) {
      setLoading(false);
      return setError(expErr?.message ?? "Could not save expense.");
    }

    // Split evenly across the chosen people, giving leftover cents to the first few.
    const base = Math.floor(totalCents / sharers.length);
    let remainder = totalCents - base * sharers.length;
    const rows = sharers.map((uid) => {
      let share = base;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return { expense_id: exp.id, user_id: uid, trip_id: tripId, share_cents: share };
    });

    const { error: splitErr } = await supabase.from("expense_splits").insert(rows);
    setLoading(false);
    if (splitErr) return setError(splitErr.message);

    setDescription("");
    setAmount("");
    setShared(new Set(members.map((m) => m.user_id)));
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
          <List dense>
            {expenses.map((e) => (
              <ListItem
                key={e.id}
                divider
                secondaryAction={
                  <Button size="small" color="error" onClick={() => removeExpense(e.id)}>
                    Delete
                  </Button>
                }
              >
                <ListItemText
                  primary={`${e.description} — ${money(e.amount_cents)}`}
                  secondary={
                    e.shared_with.length > 0
                      ? `Paid by ${e.payer_name} · split with ${e.shared_with.join(", ")}`
                      : `Paid by ${e.payer_name}`
                  }
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Total: {money(total)}
          </Typography>

          <Divider sx={{ my: 2 }} />
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
        </>
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
          <TextField
            label="Amount (USD)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            size="small"
            placeholder="48.50"
            inputMode="decimal"
          />
          <Box>
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
          </Box>
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add expense"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
